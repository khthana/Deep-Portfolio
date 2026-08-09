/**
 * CSV, as the file actually arrives.
 *
 * The format was chosen for what produces it: the institution's master data
 * lives in spreadsheets, and "Save as CSV UTF-8" is one menu item away in Excel.
 * Reading .xlsx directly would have meant a parser dependency in the API for the
 * sake of a command nobody runs more than a few times a term, and would have
 * given up the thing that makes a CSV worth keeping — it is text, so a master
 * data file can be reviewed in a diff before anybody runs it.
 *
 * The parser is written here rather than taken from a package because the whole
 * of RFC 4180 is the twenty lines below. What it does handle is what Excel
 * emits: a UTF-8 BOM, CRLF line endings, quoted fields containing commas,
 * newlines and doubled quotes.
 */

export interface Row {
  /**
   * The line the row started on, counting from 1 with the header as line 1 —
   * the number the operator sees in their spreadsheet, so an error can be acted
   * on without translating it first.
   */
  line: number;
  cells: string[];
}

export interface Sheet {
  header: string[];
  /** The line the header was found on, so a header problem can be pointed at. */
  headerLine: number;
  rows: Row[];
}

/**
 * Splits the text into records, keeping track of which line each began on.
 *
 * A quoted field may span lines, so the starting line is captured when the
 * record opens rather than counted afterwards.
 */
function records(text: string): { line: number; cells: string[] }[] {
  const out: { line: number; cells: string[] }[] = [];

  let cells: string[] = [];
  let field = "";
  let quoted = false;
  let line = 1;
  let startedAt = 1;
  let started = false;

  const openRecord = () => {
    if (!started) {
      startedAt = line;
      started = true;
    }
  };

  const endField = () => {
    openRecord();
    cells.push(field);
    field = "";
  };

  const endRecord = () => {
    endField();
    out.push({ line: startedAt, cells });
    cells = [];
    started = false;
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i] as string;

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        if (char === "\n") line++;
        field += char;
      }

      continue;
    }

    switch (char) {
      case '"':
        openRecord();
        quoted = true;
        break;

      case ",":
        endField();
        break;

      case "\r":
        // Part of a CRLF; the \n that follows is what ends the record.
        break;

      case "\n":
        endRecord();
        line++;
        break;

      default:
        openRecord();
        field += char;
    }
  }

  // A file that does not end in a newline still has a last record, but one that
  // does must not be given a spurious empty one.
  if (started || field !== "") {
    endRecord();
  }

  return out;
}

/** Whether a record is a blank line rather than a row of empty values. */
function isBlank(cells: string[]): boolean {
  return cells.every((cell) => cell.trim() === "");
}

/**
 * The header row and the data rows, with blank lines dropped.
 *
 * A file with no header at all is `null` rather than an empty sheet: there is a
 * difference between "this table has nothing to import" and "this file is not a
 * CSV", and only the caller knows which one deserves an error.
 */
export function parseCsv(text: string): Sheet | null {
  // Excel writes a BOM when saving as CSV UTF-8. Left in place it becomes part
  // of the first header name, so the first column is never recognised.
  const body = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const all = records(body);
  const headerRecord = all.find((record) => !isBlank(record.cells));

  if (!headerRecord) {
    return null;
  }

  const header = headerRecord.cells.map((name) => name.trim());
  const rows = all
    .filter((record) => record.line > headerRecord.line && !isBlank(record.cells))
    .map((record) => ({ line: record.line, cells: record.cells }));

  return { header, headerLine: headerRecord.line, rows };
}
