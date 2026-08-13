import { Prisma } from "@prisma/client";

/**
 * What the importer knows about a table, read off the Prisma schema rather than
 * written out by hand.
 *
 * Twenty-eight tables, each with its own columns, widths, foreign keys and
 * natural key, is exactly the sort of list that is correct on the day it is
 * typed and wrong three migrations later. Prisma already ships all of it in
 * `Prisma.dmmf` — column types, `@db.VarChar` widths, which fields a relation is
 * built from, which combinations are unique — so this file reshapes that into
 * the few facts the importer needs and keeps no independent copy. A column added
 * to schema.prisma is a column the importer accepts on the next run, and a
 * column removed is one it starts rejecting, without anybody remembering to come
 * here.
 *
 * See D7 in docs/spec-refactor-redeploy.md, and issue #23.
 */

/**
 * The tables the importer covers: the master data that has no write path
 * anywhere in the API, so the only ways to fill it are this importer or SQL by
 * hand.
 *
 * Named explicitly rather than derived, because "has no endpoint that writes it"
 * is a fact about the routes, not about the schema — nothing in the DMMF can be
 * consulted for it. It is the one list here that has to be revisited when an
 * endpoint is added.
 */
export const MASTER_TABLES = [
  "activity_evidence",
  "clo_course_cycle_cloplan",
  "clo_course_cycle_detail_cloplan",
  "course_sections",
  "course_sections_teacher",
  "departments",
  "faculty",
  "learning_outcomes",
  "portfolio_template",
  "program_subjects",
  "programs",
  "roles",
  "rubric_details",
  "rubrics",
  "semester_courses",
  "student",
  "student_course",
  "student_group",
  "student_group_change_log",
  "student_group_member",
  "subject_clo_achievement_criteria",
  "subject_clo_measurable_behavior",
  "subject_plo_mapping",
  "subjects",
  "user_image",
  "user_log",
  "user_roles",
  "users",
] as const;

export type MasterTable = (typeof MASTER_TABLES)[number];

/** How a cell's text is turned into a value. */
export type ColumnKind =
  | "String"
  | "Int"
  | "Float"
  | "Decimal"
  | "Boolean"
  | "DateTime"
  | "Json"
  | "Enum";

export interface Column {
  name: string;
  kind: ColumnKind;
  /** Set only for `kind: "Enum"` — the spellings the column accepts. */
  enumValues: readonly string[];
  /** NOT NULL with nothing to fall back on, so the file has to carry it. */
  required: boolean;
  /** From `@db.VarChar(n)` / `@db.Char(n)`. Null where the column is unbounded. */
  maxLength: number | null;
  /**
   * The largest magnitude the column's Postgres type holds, so `40000` in a
   * `SmallInt` is reported as a bad cell rather than left to blow up the write.
   * Null for kinds where there is no such bound.
   */
  maxValue: number | null;
  /** Computed by Postgres. No INSERT or UPDATE may name it, so no file may either. */
  readOnly: boolean;
}

/** One foreign key: local columns pointing at another table's columns. */
export interface Reference {
  columns: string[];
  table: string;
  targetColumns: string[];
}

export interface Table {
  name: string;
  columns: Column[];
  /**
   * The columns that decide whether an incoming row is a new row or an existing
   * one. This is what makes a re-run an update rather than a duplicate.
   */
  key: string[];
  /**
   * True when the only key available is a database-generated surrogate — the
   * table has no natural key at all. Such a table can still be imported, but
   * only if the file supplies the surrogate itself; without it there is no way
   * to tell a re-run from a second copy.
   */
  keyIsGenerated: boolean;
  references: Reference[];
  /** Master tables this one points at. Self-references are left out. */
  dependencies: string[];
}

const INT2_MAX = 32_767;
const INT4_MAX = 2_147_483_647;

const SCALAR_KINDS = new Set<string>([
  "String",
  "Int",
  "Float",
  "Decimal",
  "Boolean",
  "DateTime",
  "Json",
]);

const MASTER_SET: ReadonlySet<string> = new Set(MASTER_TABLES);

/**
 * The `GENERATED ALWAYS ... STORED` columns, as `table.column`.
 *
 * Postgres computes these from other columns of the same row and rejects any
 * INSERT or UPDATE that names them at all — not silently, but with an error that
 * would take the whole import down with a message about DEFAULT expressions.
 * They matter because `student.full_name_th` is precisely the column a
 * spreadsheet of students would have in it.
 *
 * Listed by hand for the reason recorded in the baseline migration: Prisma
 * introspects a generated column as an ordinary `@default(dbgenerated(...))`, so
 * the DMMF cannot tell one apart from `created_at`. The migration's own
 * HAND-EDITED comments mark both of them; there are no others in the schema.
 */
const GENERATED_ALWAYS: ReadonlySet<string> = new Set([
  "student.full_name_th",
  "student.admission_year",
]);

function enumValues(name: string): readonly string[] {
  const found = Prisma.dmmf.datamodel.enums.find((e) => e.name === name);
  return found ? found.values.map((v) => v.name) : [];
}

/**
 * `["VarChar", ["200"]]` → `200`.
 *
 * Only the width-carrying string types are read. `Timestamptz(6)` and
 * `Decimal(10, 2)` also carry arguments, but those are precision rather than a
 * limit the file can exceed one character at a time, and the coercions below
 * report those failures in their own terms.
 */
function maxLengthOf(
  nativeType: readonly [string, readonly string[]] | null,
): number | null {
  if (!nativeType) {
    return null;
  }

  const [name, args] = nativeType;

  if (name !== "VarChar" && name !== "Char") {
    return null;
  }

  const width = Number(args[0]);
  return Number.isInteger(width) ? width : null;
}

/**
 * The largest value the column will hold, as its Postgres type defines it.
 *
 * Postgres refuses an out-of-range number rather than truncating it, and it
 * refuses it at write time — which for this importer means in the middle of the
 * transaction, with a message about numeric types rather than about a row. The
 * schema uses `SmallInt` for a good deal of the master data (`semester`,
 * `criteria_no`, `clo_id`), so the difference between int2 and int4 is a
 * difference the file can run into.
 *
 * `Decimal(p, s)` holds `p` digits of which `s` are after the point, so the
 * largest it can hold is `p - s` nines followed by `s` more: `Decimal(5, 2)`
 * stops at 999.99. Postgres rounds a longer fraction quietly but rejects a
 * larger whole part, so the bound is the whole part's.
 */
function maxValueOf(
  kind: ColumnKind,
  nativeType: readonly [string, readonly string[]] | null,
): number | null {
  const name = nativeType?.[0];

  if (kind === "Int") {
    if (name === "SmallInt") return INT2_MAX;
    // Anything else whole is int4, which is also what Prisma's `Int` means when
    // no native type is written down at all.
    return INT4_MAX;
  }

  if (kind === "Decimal" && name === "Decimal") {
    const [precision, scale] = (nativeType?.[1] ?? []).map(Number);

    if (!Number.isInteger(precision) || !Number.isInteger(scale)) {
      return null;
    }

    return (
      10 ** ((precision as number) - (scale as number)) -
      10 ** -(scale as number)
    );
  }

  return null;
}

/**
 * Which columns identify a row, in the order of how much they can be trusted.
 *
 * A composite `@@id` and a natural `@id` are both the institution's own
 * identifier — a faculty code, a student code — and are what a second run of the
 * same file arrives with. Where the primary key is an autoincrementing surrogate
 * the file cannot know it, so a unique index over real columns is the next best
 * thing: `user_roles` has no id anybody outside the database has seen, but
 * (user, role, scope) is the row.
 *
 * Only when neither exists does this fall back to the surrogate, and it says so
 * — see `keyIsGenerated`.
 */
function keyColumnsOf(model: Prisma.DMMF.Model): {
  key: string[];
  generated: boolean;
} {
  if (model.primaryKey && model.primaryKey.fields.length > 0) {
    return { key: [...model.primaryKey.fields], generated: false };
  }

  const idField = model.fields.find((field) => field.isId);
  const idIsGenerated =
    idField?.hasDefaultValue === true &&
    typeof idField.default === "object" &&
    idField.default !== null &&
    !Array.isArray(idField.default);

  if (idField && !idIsGenerated) {
    return { key: [idField.name], generated: false };
  }

  const uniqueField = model.fields.find((field) => field.isUnique);

  if (uniqueField) {
    return { key: [uniqueField.name], generated: false };
  }

  const uniqueIndex = model.uniqueIndexes[0];

  if (uniqueIndex) {
    return { key: [...uniqueIndex.fields], generated: false };
  }

  return { key: idField ? [idField.name] : [], generated: true };
}

function describe(model: Prisma.DMMF.Model): Table {
  const columns: Column[] = [];
  const references: Reference[] = [];
  const dependencies = new Set<string>();

  for (const field of model.fields) {
    if (field.isList) {
      // The far side of a relation. Nothing of it is stored on this table.
      continue;
    }

    if (field.kind === "object") {
      const from = field.relationFromFields ?? [];
      const to = field.relationToFields ?? [];

      if (from.length === 0) {
        // The other end owns the columns; this side stores nothing.
        continue;
      }

      references.push({
        columns: [...from],
        table: field.type,
        targetColumns: [...to],
      });

      if (field.type !== model.name && MASTER_SET.has(field.type)) {
        dependencies.add(field.type);
      }

      continue;
    }

    if (field.kind !== "enum" && !SCALAR_KINDS.has(field.type)) {
      continue;
    }

    const kind: ColumnKind =
      field.kind === "enum" ? "Enum" : (field.type as ColumnKind);
    const nativeType = (field.nativeType ?? null) as
      readonly [string, readonly string[]] | null;

    columns.push({
      name: field.name,
      kind,
      enumValues: field.kind === "enum" ? enumValues(field.type) : [],
      // A column with a default is one the file may leave out, whether the
      // default is written by Postgres or by Prisma.
      required: field.isRequired && field.hasDefaultValue !== true,
      maxLength: maxLengthOf(nativeType),
      maxValue: maxValueOf(kind, nativeType),
      readOnly: GENERATED_ALWAYS.has(`${model.name}.${field.name}`),
    });
  }

  const { key, generated } = keyColumnsOf(model);

  return {
    name: model.name,
    columns,
    key,
    keyIsGenerated: generated,
    references,
    dependencies: [...dependencies].sort(),
  };
}

const TABLES: ReadonlyMap<string, Table> = new Map(
  Prisma.dmmf.datamodel.models
    .filter((model) => MASTER_SET.has(model.name))
    .map((model) => [model.name, describe(model)]),
);

export function isMasterTable(name: string): name is MasterTable {
  return MASTER_SET.has(name);
}

export function tableOf(name: string): Table {
  const table = TABLES.get(name);

  if (!table) {
    // A name that passed `isMasterTable` and is still missing here means
    // MASTER_TABLES lists something schema.prisma does not have.
    throw new Error(`No such master table in the Prisma schema: ${name}`);
  }

  return table;
}

/**
 * The order the given tables have to be written in, so that every row's foreign
 * keys point at something that is already there.
 *
 * Returned as layers rather than a flat list because the layering is the useful
 * part when reading a run: everything in one layer is independent of everything
 * else in it. The sort walks the whole dependency graph, not just the tables
 * asked for, so importing `programs` on its own still knows it comes after
 * `departments` — it simply has nothing to emit for that step.
 *
 * Throws on a cycle. The current schema has none, and a cycle would mean there
 * is no order that works, which is not something the importer can paper over.
 */
export function orderByDependencies(names: readonly string[]): string[][] {
  const wanted = new Set(names);
  const pending = new Set<string>();

  // Pull in the transitive dependencies, so the ordering is decided by the whole
  // graph even when only part of it is being imported.
  const queue = [...wanted];

  while (queue.length > 0) {
    const name = queue.pop() as string;

    if (pending.has(name)) {
      continue;
    }

    pending.add(name);
    queue.push(...tableOf(name).dependencies);
  }

  const placed = new Set<string>();
  const layers: string[][] = [];

  while (placed.size < pending.size) {
    const layer = [...pending]
      .filter(
        (name) =>
          !placed.has(name) &&
          tableOf(name).dependencies.every((dep) => placed.has(dep)),
      )
      .sort();

    if (layer.length === 0) {
      const stuck = [...pending].filter((name) => !placed.has(name)).sort();
      throw new Error(
        `Foreign keys form a cycle, so no write order exists: ${stuck.join(", ")}`,
      );
    }

    for (const name of layer) {
      placed.add(name);
    }

    const requested = layer.filter((name) => wanted.has(name));

    if (requested.length > 0) {
      layers.push(requested);
    }
  }

  return layers;
}
