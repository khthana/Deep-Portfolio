import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { parseCsv } from "./csv";
import { keyOf, prepare, type ImportError, type PreparedRow } from "./rows";
import { isMasterTable, orderByDependencies, tableOf, type Table } from "./tables";

/**
 * The importer itself: a directory of CSV files in, rows in the database out.
 *
 * Two rules shape the whole run.
 *
 * Nothing is written until everything has been read. Every file is parsed,
 * every cell is checked against its column, and every foreign key is checked
 * against what will exist by the time it is needed — and only then does the
 * first INSERT happen. A run that finds a problem writes nothing at all, so the
 * operator is never left guessing which half of a file went in.
 *
 * A row is matched before it is written. Each table has a key — the
 * institution's own identifier where there is one, a unique combination where
 * there is not — and a row whose key is already there is updated rather than
 * inserted. Running the same file twice therefore reports the same total the
 * second time, with everything in the "updated" column.
 *
 * See D7 in docs/spec-refactor-redeploy.md, and issue #23.
 */

export interface TableCount {
  table: string;
  created: number;
  updated: number;
}

export interface ImportReport {
  /** False when nothing was written, whatever the reason. */
  ok: boolean;
  /** The write order that was worked out from the foreign keys, in layers. */
  order: string[][];
  tables: TableCount[];
  errors: ImportError[];
}

/**
 * The slice of a Prisma model delegate this file uses, named structurally.
 *
 * The importer is generic over twenty-eight models, so it cannot name any of
 * their generated types. Writing down the four methods it calls keeps the one
 * unavoidable cast in a single place instead of letting `any` spread through
 * the run.
 */
interface Delegate {
  findFirst(args: {
    where: Record<string, unknown>;
  }): Promise<Record<string, unknown> | null>;
  findMany(args: {
    where: Record<string, unknown>;
    select: Record<string, boolean>;
  }): Promise<Record<string, unknown>[]>;
  create(args: { data: Record<string, unknown> }): Promise<unknown>;
  updateMany(args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<{ count: number }>;
}

type Client = Pick<typeof prisma, "$transaction"> & Record<string, unknown>;

function delegate(client: object, table: string): Delegate {
  return (client as Record<string, Delegate>)[table] as Delegate;
}

/** Where-clause matching one row on its key columns. */
function keyWhere(table: Table, values: Record<string, unknown>): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  for (const name of table.key) {
    // `null` rather than `undefined`: Prisma reads a missing property as "do not
    // filter on this", which would match any row. `user_roles.scope_id` is
    // nullable and part of its key, so this is not hypothetical.
    where[name] = values[name] ?? null;
  }

  return where;
}

interface Loaded {
  table: Table;
  rows: PreparedRow[];
}

/**
 * Checks that every foreign key has something to point at, before anything is
 * written.
 *
 * A value counts as satisfied if the referenced table is getting it in this same
 * run — the point of the write order — or if the database already has it. Only
 * single-column references are checked here; the schema's composite ones are
 * left to Postgres, which refuses them inside the transaction below and takes
 * the whole run down with them rather than leaving half a file behind.
 */
async function checkReferences(
  client: object,
  loaded: Map<string, Loaded>,
): Promise<ImportError[]> {
  const errors: ImportError[] = [];

  for (const { table, rows } of loaded.values()) {
    for (const reference of table.references) {
      const column = reference.columns[0];
      const target = reference.targetColumns[0];

      if (reference.columns.length !== 1 || !column || !target) {
        continue;
      }

      /** Every distinct value used, and the lines that used it. */
      const used = new Map<string, { value: unknown; lines: number[] }>();

      for (const row of rows) {
        const value = row.values[column];

        if (value === undefined || value === null) {
          continue;
        }

        const seen = used.get(String(value));

        if (seen) {
          seen.lines.push(row.line);
        } else {
          used.set(String(value), { value, lines: [row.line] });
        }
      }

      if (used.size === 0) {
        continue;
      }

      const arriving = new Set(
        (loaded.get(reference.table)?.rows ?? []).map((row) =>
          String(row.values[target]),
        ),
      );

      const unresolved = [...used.entries()].filter(([key]) => !arriving.has(key));

      if (unresolved.length === 0) {
        continue;
      }

      const existing = await delegate(client, reference.table).findMany({
        where: { [target]: { in: unresolved.map(([, entry]) => entry.value) } },
        select: { [target]: true },
      });

      const known = new Set(existing.map((row) => String(row[target])));

      for (const [key, entry] of unresolved) {
        if (known.has(key)) {
          continue;
        }

        for (const line of entry.lines) {
          errors.push({
            table: table.name,
            line,
            column,
            message: `ไม่พบ ${key} ในตาราง ${reference.table} (คอลัมน์ ${target})`,
          });
        }
      }
    }
  }

  return errors;
}

/** Reads the directory into parsed, checked rows — or into the reasons it could not. */
async function load(
  directory: string,
): Promise<{ loaded: Map<string, Loaded>; errors: ImportError[] }> {
  const errors: ImportError[] = [];
  const loaded = new Map<string, Loaded>();

  const entries = (await readdir(directory)).filter((name) =>
    name.toLowerCase().endsWith(".csv"),
  );

  for (const entry of entries.sort()) {
    const name = path.basename(entry, path.extname(entry));

    if (!isMasterTable(name)) {
      errors.push({
        table: name,
        line: null,
        column: null,
        message:
          `ชื่อไฟล์ไม่ตรงกับตารางใดที่นำเข้าได้ — ` +
          `ต้องตั้งชื่อไฟล์ตามชื่อตาราง เช่น faculty.csv`,
      });
      continue;
    }

    const table = tableOf(name);
    const sheet = parseCsv(await readFile(path.join(directory, entry), "utf8"));

    if (!sheet) {
      errors.push({
        table: name,
        line: null,
        column: null,
        message: "ไฟล์ว่าง ไม่มีแม้แต่หัวตาราง",
      });
      continue;
    }

    const prepared = prepare(table, sheet);

    errors.push(...prepared.errors);
    loaded.set(name, { table, rows: prepared.rows });
  }

  return { loaded, errors };
}

/**
 * Writes one table's rows, matching each against what is already there.
 *
 * `updateMany` rather than `update` because the key may be a composite one, and
 * Prisma's `update` wants the generated compound-key name for those. The row has
 * already been found, so the difference between the two is a name, not a count.
 */
async function writeTable(
  tx: object,
  table: Table,
  rows: PreparedRow[],
): Promise<TableCount> {
  const model = delegate(tx, table.name);
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const where = keyWhere(table, row.values);
    const existing = await model.findFirst({ where });

    if (existing) {
      await model.updateMany({ where, data: row.values });
      updated++;
    } else {
      await model.create({ data: row.values });
      created++;
    }
  }

  return { table: table.name, created, updated };
}

/**
 * How long the write is given.
 *
 * Prisma's default is five seconds, which is a sensible ceiling for a request
 * and far too little for a few thousand rows written one at a time. The import
 * is a command somebody is watching, not a request somebody is waiting on, so
 * the limit exists only to stop a wedged run holding a transaction open forever.
 */
const WRITE_TIMEOUT_MS = 10 * 60 * 1000;

export async function runImport(directory: string): Promise<ImportReport> {
  const client = prisma as unknown as Client;
  const { loaded, errors } = await load(directory);

  const order = loaded.size > 0 ? orderByDependencies([...loaded.keys()]) : [];

  // Only worth asking about foreign keys once the rows themselves are sound —
  // a row that failed its own columns is not in `loaded`, and reporting that its
  // absent programme does not exist would be a second complaint about the same
  // mistake.
  if (errors.length === 0) {
    errors.push(...(await checkReferences(client, loaded)));
  }

  if (errors.length > 0) {
    return { ok: false, order, tables: [], errors };
  }

  const tables = await client.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const counts: TableCount[] = [];

      for (const layer of order) {
        for (const name of layer) {
          const entry = loaded.get(name);

          if (entry) {
            counts.push(await writeTable(tx, entry.table, entry.rows));
          }
        }
      }

      return counts;
    },
    { timeout: WRITE_TIMEOUT_MS, maxWait: 30_000 },
  );

  return { ok: true, order, tables, errors: [] };
}
