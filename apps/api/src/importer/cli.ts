import "./load-env";
import prisma from "../config/prisma";
import { runImport, type ImportReport } from "./run";
import type { ImportError } from "./rows";

/**
 * The command an administrator runs:
 *
 *     npm run import --workspace @deep-portfolio/api -- /path/to/data
 *
 * The directory is resolved against the working directory, and --workspace
 * makes that apps/api rather than wherever the administrator was standing, so
 * the documented form is an absolute path.
 *
 * Everything it prints is Thai, because the person reading it is the
 * administrator doing the import rather than a developer reading a log — the
 * same reason the request validators answer in Thai. See CLAUDE.md.
 *
 * The exit code is the part a script can act on: zero when the data is in, one
 * when nothing was written. There is no third outcome, because there is no
 * partial write to report.
 */

const USAGE = `วิธีใช้: import <โฟลเดอร์>

  อ่านไฟล์ .csv ในโฟลเดอร์ที่ระบุ โดยตั้งชื่อไฟล์ตามชื่อตาราง เช่น faculty.csv
  บรรทัดแรกของไฟล์คือชื่อคอลัมน์ ตรงตามชื่อในฐานข้อมูล

  ตรวจสอบข้อมูลทั้งหมดก่อน ถ้าพบข้อผิดพลาดจะไม่เขียนอะไรลงฐานข้อมูลเลย
  ถ้าผ่านทั้งหมดจะเขียนตามลำดับความสัมพันธ์ระหว่างตาราง และนำเข้าซ้ำได้`;

function describeError(error: ImportError): string {
  const place = [
    error.line === null ? null : `บรรทัดที่ ${error.line}`,
    error.column === null ? null : `คอลัมน์ ${error.column}`,
  ]
    .filter((part) => part !== null)
    .join(" ");

  return place === ""
    ? `    ${error.message}`
    : `    ${place}: ${error.message}`;
}

function report(result: ImportReport): string {
  const lines: string[] = [];

  if (!result.ok) {
    lines.push(
      `พบข้อผิดพลาด ${result.errors.length} รายการ ไม่ได้เขียนข้อมูลลงฐานข้อมูล`,
      "",
    );

    // Grouped by file, because that is the thing the operator opens to fix it.
    for (const table of [
      ...new Set(result.errors.map((error) => error.table)),
    ]) {
      lines.push(`  ${table}.csv`);

      for (const error of result.errors.filter((e) => e.table === table)) {
        lines.push(describeError(error));
      }

      lines.push("");
    }

    return lines.join("\n");
  }

  lines.push(
    `ลำดับการเขียน: ${result.order.map((layer) => layer.join(", ")).join(" → ") || "(ไม่มี)"}`,
    "",
  );

  let created = 0;
  let updated = 0;

  for (const count of result.tables) {
    lines.push(
      `  ${count.table}: เพิ่ม ${count.created} อัปเดต ${count.updated}`,
    );
    created += count.created;
    updated += count.updated;
  }

  lines.push("", `รวม: เพิ่ม ${created} อัปเดต ${updated}`);

  return lines.join("\n");
}

async function main(): Promise<number> {
  const directory = process.argv[2];

  if (directory === undefined || directory === "--help" || directory === "-h") {
    console.log(USAGE);
    return directory === undefined ? 1 : 0;
  }

  const result = await runImport(directory);

  console.log(report(result));

  return result.ok ? 0 : 1;
}

main()
  .then(async (code) => {
    await prisma.$disconnect();
    process.exitCode = code;
  })
  .catch(async (error: unknown) => {
    // Anything that reaches here is not a data problem the report can describe —
    // an unreadable directory, a database that is not there. The message is
    // printed as-is rather than dressed up as a validation failure.
    console.error(error instanceof Error ? error.message : String(error));
    await prisma.$disconnect();
    process.exitCode = 1;
  });
