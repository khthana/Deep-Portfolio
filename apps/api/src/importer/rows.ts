import type { Sheet } from "./csv";
import type { Column, Table } from "./tables";

/**
 * Turning a sheet of text into rows the database will accept — or into the list
 * of reasons it will not.
 *
 * Everything here runs before a single row is written, and it collects rather
 * than throws. An import of two thousand students that stops at the first bad
 * date, gets fixed, and stops at the second one is an afternoon; the same import
 * that comes back with all forty problems at once is ten minutes. That is the
 * whole argument for the shape of this file.
 *
 * Messages are Thai, for the same reason the request validators' are: the person
 * reading them is the administrator running the import, not a developer. See the
 * language convention in CLAUDE.md.
 */

export interface ImportError {
  table: string;
  /** The line in the file. Null where the problem is the file as a whole. */
  line: number | null;
  /** The column at fault. Null where the problem is the row or the file. */
  column: string | null;
  message: string;
}

export interface PreparedRow {
  line: number;
  values: Record<string, unknown>;
}

export interface Prepared {
  rows: PreparedRow[];
  errors: ImportError[];
}

/**
 * Whether a number is outside what the column's Postgres type holds.
 *
 * The bound is symmetric here even though int2 reaches one further down
 * (-32768): a master data file has no use for that one value, and a range the
 * operator can read off the message is worth more than the last integer.
 */
function outOfRange(value: number, maxValue: number | null): boolean {
  return maxValue !== null && Math.abs(value) > maxValue;
}

function rangeError(maxValue: number | null): string {
  return `ต้องอยู่ในช่วง -${maxValue} ถึง ${maxValue}`;
}

/** Reads "true"/"false" however the spreadsheet capitalised them. */
function toBoolean(text: string): boolean | undefined {
  const lowered = text.toLowerCase();

  if (lowered === "true") return true;
  if (lowered === "false") return false;

  return undefined;
}

/**
 * One cell, as the value the column holds — or a Thai sentence saying why it is
 * not one.
 *
 * The caller has already established that the cell is not empty, so "ต้องระบุ"
 * is not among the answers here.
 */
function coerce(column: Column, text: string): { value: unknown } | { error: string } {
  switch (column.kind) {
    case "String": {
      // Postgres counts characters, not bytes or code units, so Thai text is
      // measured the way the column will measure it. `[...text].length` counts
      // code points; `text.length` would count a surrogate pair twice.
      if (column.maxLength !== null && [...text].length > column.maxLength) {
        return { error: `ต้องยาวไม่เกิน ${column.maxLength} ตัวอักษร` };
      }

      return { value: text };
    }

    case "Int": {
      if (!/^[+-]?\d+$/.test(text)) {
        return { error: "ต้องเป็นจำนวนเต็ม" };
      }

      const parsed = Number(text);

      if (!Number.isSafeInteger(parsed) || outOfRange(parsed, column.maxValue)) {
        return { error: rangeError(column.maxValue) };
      }

      return { value: parsed };
    }

    case "Decimal": {
      // Kept as text rather than turned into a JS number: `Decimal(5, 2)` is an
      // exact type and Prisma accepts the digits as they were written, so the
      // value that reaches Postgres is the value that was in the file. Scientific
      // notation is refused for the same reason — Postgres would take it, but the
      // file it came from would no longer read like the column it lands in.
      if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(text)) {
        return { error: "ต้องเป็นตัวเลข" };
      }

      if (outOfRange(Number(text), column.maxValue)) {
        return { error: rangeError(column.maxValue) };
      }

      return { value: text };
    }

    case "Float": {
      const parsed = Number(text);

      if (!Number.isFinite(parsed)) {
        return { error: "ต้องเป็นตัวเลข" };
      }

      return { value: parsed };
    }

    case "Boolean": {
      const parsed = toBoolean(text);

      return parsed === undefined
        ? { error: "ต้องเป็นค่า true หรือ false" }
        : { value: parsed };
    }

    case "DateTime": {
      const parsed = new Date(text);

      return Number.isNaN(parsed.getTime())
        ? { error: "ต้องเป็นวันที่ที่ถูกต้อง" }
        : { value: parsed };
    }

    case "Enum": {
      return column.enumValues.includes(text)
        ? { value: text }
        : { error: `ต้องเป็นค่าใดค่าหนึ่งใน: ${column.enumValues.join(", ")}` };
    }

    case "Json": {
      try {
        return { value: JSON.parse(text) as unknown };
      } catch {
        return { error: "ต้องเป็น JSON ที่ถูกต้อง" };
      }
    }
  }
}

/**
 * What separates one key column from the next when a composite key is
 * flattened into a string.
 *
 * ASCII 31, the unit separator, written as an escape so the source file stays
 * text. Any character a spreadsheet could put in a cell would risk running two
 * keys together: separated by a space, the pair ("a b", "") and the pair
 * ("a", "b") flatten to the same string, and one of those two rows would be
 * reported as a duplicate of the other.
 */
const SEPARATOR = "\u001f";

/** The key values of one row, as a string that can be compared for sameness. */
export function keyOf(table: Table, values: Record<string, unknown>): string {
  return table.key.map((name) => String(values[name] ?? "")).join(SEPARATOR);
}

function checkHeader(table: Table, sheet: Sheet): ImportError[] {
  const errors: ImportError[] = [];
  const known = new Map(table.columns.map((column) => [column.name, column]));
  const seen = new Set<string>();

  for (const name of sheet.header) {
    const column = known.get(name);

    if (!column) {
      errors.push({
        table: table.name,
        line: sheet.headerLine,
        column: name,
        message: `ไม่มีคอลัมน์นี้ในตาราง ${table.name}`,
      });
      continue;
    }

    // Postgres computes these from the row's other columns and refuses any write
    // that names them, so a file carrying one has to be told before the write
    // rather than after it fails. `student.full_name_th` is the realistic case:
    // it is the column a list of students is sorted by.
    if (column.readOnly) {
      errors.push({
        table: table.name,
        line: sheet.headerLine,
        column: name,
        message: "ฐานข้อมูลคำนวณคอลัมน์นี้เอง ไฟล์ระบุค่าไม่ได้ ให้ลบคอลัมน์นี้ออก",
      });
      continue;
    }

    if (seen.has(name)) {
      errors.push({
        table: table.name,
        line: sheet.headerLine,
        column: name,
        message: "มีคอลัมน์ชื่อนี้ซ้ำกัน",
      });
    }

    seen.add(name);
  }

  for (const column of table.columns) {
    if (column.required && !seen.has(column.name)) {
      errors.push({
        table: table.name,
        line: sheet.headerLine,
        column: column.name,
        message: "ต้องมีคอลัมน์นี้ในไฟล์",
      });
    }
  }

  /**
   * A table with no natural key can still be imported, but only if the file
   * carries the surrogate primary key itself. Without it there is nothing to
   * match an incoming row against, so a second run would insert a second copy of
   * everything — which is exactly what the importer promises not to do.
   */
  if (table.keyIsGenerated) {
    const missing = table.key.filter((name) => !seen.has(name));

    if (missing.length > 0) {
      errors.push({
        table: table.name,
        line: sheet.headerLine,
        column: missing.join(", "),
        message:
          `ตาราง ${table.name} ไม่มีคีย์ตามธรรมชาติ ` +
          "ไฟล์จึงต้องระบุคอลัมน์นี้เอง มิฉะนั้นการนำเข้าซ้ำจะทำให้ข้อมูลซ้ำ",
      });
    }
  }

  return errors;
}

/**
 * Checks a sheet against its table and converts what passes.
 *
 * Rows that failed are left out of `rows`, so a caller that ignored `errors`
 * would write less than it was given rather than something wrong. Nothing calls
 * it that way — `runImport` refuses the whole run — but the weaker of the two
 * failures is the one worth defaulting to.
 */
export function prepare(table: Table, sheet: Sheet): Prepared {
  const errors = checkHeader(table, sheet);
  const byName = new Map(table.columns.map((column) => [column.name, column]));
  const rows: PreparedRow[] = [];
  const seenKeys = new Map<string, number>();

  for (const row of sheet.rows) {
    if (row.cells.length !== sheet.header.length) {
      errors.push({
        table: table.name,
        line: row.line,
        column: null,
        message: `มี ${row.cells.length} ช่อง แต่หัวตารางมี ${sheet.header.length} คอลัมน์`,
      });
      continue;
    }

    const values: Record<string, unknown> = {};
    let rowFailed = false;

    sheet.header.forEach((name, index) => {
      const column = byName.get(name);

      if (!column || column.readOnly) {
        // Both are already reported against the header, and repeating either
        // once per row would bury everything else.
        return;
      }

      const text = (row.cells[index] ?? "").trim();

      if (text === "") {
        if (column.required) {
          errors.push({
            table: table.name,
            line: row.line,
            column: name,
            message: "ต้องระบุ",
          });
          rowFailed = true;
        }

        // An empty optional cell means "leave it alone", not "set it to null" —
        // a re-run of a partially filled file must not blank out what a later,
        // fuller run put there.
        return;
      }

      const result = coerce(column, text);

      if ("error" in result) {
        errors.push({ table: table.name, line: row.line, column: name, message: result.error });
        rowFailed = true;
        return;
      }

      values[name] = result.value;
    });

    if (rowFailed) {
      continue;
    }

    const key = keyOf(table, values);
    const earlier = seenKeys.get(key);

    if (earlier !== undefined) {
      errors.push({
        table: table.name,
        line: row.line,
        column: table.key.join(", "),
        message: `ซ้ำกับแถวบรรทัดที่ ${earlier} ในไฟล์เดียวกัน`,
      });
      continue;
    }

    seenKeys.set(key, row.line);
    rows.push({ line: row.line, values });
  }

  return { rows, errors };
}
