import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import prisma from "../src/config/prisma";
import { runImport } from "../src/importer/run";
import { createCLO, createSharedRubric } from "./factories";
import { BASELINE } from "./seed";

/**
 * The master data importer — `npm run import` (issue #23, D7).
 *
 * The importer has no HTTP edge, so these cases enter at the one it does have:
 * a directory of CSV files goes in, and the report plus the state of the
 * database comes out. That is the same seam the endpoint tests use, applied to a
 * different front door — assert what a caller can see and what the database
 * holds, never which query ran (T1). It is not a third seam, and there are no
 * unit tests below it: the CSV parser, the write order and the coercions are all
 * driven through `runImport`, because a file that parses but does not import is
 * not worth passing.
 *
 * Every file here is invented. None of it is the institution's real master data
 * — that is the point of T4, and it is why the importer could be finished before
 * the real data had all arrived.
 *
 * The baseline seed (test/seed.ts) already holds faculty 90, departments 91 and
 * 92, programmes 9101 and 9201, and the seven roles. Cases that want to create
 * something new stay out of those ids; cases that want to prove an update lands
 * on an existing row use them.
 */

const directories: string[] = [];

/** A throwaway directory holding the given files, as the operator would lay it out. */
async function importable(files: Record<string, string>): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "dp-import-"));
  directories.push(directory);

  for (const [name, content] of Object.entries(files)) {
    await writeFile(path.join(directory, name), content, "utf8");
  }

  return directory;
}

afterAll(async () => {
  await Promise.all(
    directories.map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("runImport", () => {
  it("inserts the rows it is given and says how many per table", async () => {
    const directory = await importable({
      "faculty.csv": [
        "faculty_id,faculty_name_th,faculty_name_en",
        "93,คณะทดสอบ,Test Faculty",
      ].join("\n"),
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.tables).toEqual([{ table: "faculty", created: 1, updated: 0 }]);
    expect(await prisma.faculty.findUnique({ where: { faculty_id: "93" } })).toMatchObject({
      faculty_name_th: "คณะทดสอบ",
      faculty_name_en: "Test Faculty",
      // Not in the file. The column's default is what fills it, which is why a
      // column with a default is one the file is allowed to leave out.
      is_active: true,
    });
  });

  it("updates rather than duplicating when the same file is imported twice", async () => {
    const directory = await importable({
      "faculty.csv": [
        "faculty_id,faculty_name_th,faculty_name_en",
        "94,คณะเดิม,Original Faculty",
      ].join("\n"),
    });

    const first = await runImport(directory);
    const second = await runImport(directory);

    expect(first.tables).toEqual([{ table: "faculty", created: 1, updated: 0 }]);
    expect(second.tables).toEqual([{ table: "faculty", created: 0, updated: 1 }]);
    expect(await prisma.faculty.count({ where: { faculty_id: "94" } })).toBe(1);
  });

  it("carries an edit through on the second run", async () => {
    const before = await importable({
      "faculty.csv": ["faculty_id,faculty_name_th,faculty_name_en", "95,ชื่อเก่า,Old Name"].join(
        "\n",
      ),
    });
    const after = await importable({
      "faculty.csv": ["faculty_id,faculty_name_th,faculty_name_en", "95,ชื่อใหม่,New Name"].join(
        "\n",
      ),
    });

    await runImport(before);
    await runImport(after);

    expect(await prisma.faculty.findUnique({ where: { faculty_id: "95" } })).toMatchObject({
      faculty_name_th: "ชื่อใหม่",
      faculty_name_en: "New Name",
    });
  });

  it("writes parents before children, whatever order the files come in", async () => {
    // Read alphabetically, departments.csv comes before faculty.csv — so a run
    // that wrote files in the order it found them would break its own foreign
    // key on the first row. The order below is worked out from the schema.
    const directory = await importable({
      "programs.csv": [
        "program_id,program_name_th,program_name_en,department_id,year",
        "9601,หลักสูตรทดสอบ,Test Programme,96,2565",
      ].join("\n"),
      "departments.csv": [
        "department_id,department_name_th,department_name_en,faculty_id",
        "96,ภาควิชาทดสอบ,Test Department,96",
      ].join("\n"),
      "faculty.csv": ["faculty_id,faculty_name_th,faculty_name_en", "96,คณะทดสอบสอง,Second Test Faculty"].join(
        "\n",
      ),
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(true);
    expect(result.order).toEqual([["faculty"], ["departments"], ["programs"]]);
    expect(await prisma.programs.findUnique({ where: { program_id: "9601" } })).toMatchObject({
      department_id: "96",
    });
  });

  it("reads a file the way a spreadsheet writes one", async () => {
    // A byte-order mark, CRLF endings, and a quoted field with a comma in it:
    // all three are what Excel's "CSV UTF-8" produces, and any one of them read
    // literally would corrupt the row.
    const directory = await importable({
      "faculty.csv":
        "﻿faculty_id,faculty_name_th,faculty_name_en\r\n" +
        '97,"คณะวิศวกรรมศาสตร์, วิทยาเขตหลัก",Faculty of Engineering\r\n',
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(true);
    expect(await prisma.faculty.findUnique({ where: { faculty_id: "97" } })).toMatchObject({
      faculty_name_th: "คณะวิศวกรรมศาสตร์, วิทยาเขตหลัก",
      faculty_name_en: "Faculty of Engineering",
    });
  });

  it("keeps a field that runs over more than one line together, and counts lines past it", async () => {
    const directory = await importable({
      "subjects.csv": [
        "subject_id,subject_name_th,subject_name_en,credits,description_th",
        '90009701,วิชาคำอธิบายยาว,Long Description Subject,3,"บรรทัดแรก',
        'บรรทัดที่สอง ""มีคำพูด"" ด้วย"',
        "90009702,วิชาถัดไป,Next Subject,3,",
      ].join("\n"),
    });

    const result = await runImport(directory);

    expect(result.errors).toEqual([]);
    expect(await prisma.subjects.findUnique({ where: { subject_id: "90009701" } })).toMatchObject({
      description_th: 'บรรทัดแรก\nบรรทัดที่สอง "มีคำพูด" ด้วย',
    });
    // And the row after it is still one row, not two half-rows.
    expect(await prisma.subjects.findUnique({ where: { subject_id: "90009702" } })).not.toBeNull();
  });

  it("leaves a column alone when the cell for it is empty", async () => {
    const named = await importable({
      "departments.csv": [
        "department_id,department_name_th,faculty_id",
        `98,ภาควิชาเดิม,${BASELINE.faculty.faculty_id}`,
      ].join("\n"),
    });
    const blank = await importable({
      "departments.csv": ["department_id,department_name_th", "98,"].join("\n"),
    });

    await runImport(named);
    const second = await runImport(blank);

    expect(second.tables).toEqual([{ table: "departments", created: 0, updated: 1 }]);
    // An empty optional cell means "nothing to say about this column", not
    // "clear it" — otherwise a partial file would wipe what a fuller one wrote.
    expect(await prisma.departments.findUnique({ where: { department_id: "98" } })).toMatchObject({
      department_name_th: "ภาควิชาเดิม",
    });
  });

  it("matches a row on a composite key, so that one updates too", async () => {
    // program_subjects has no identifier of its own that a file could carry —
    // its id is autoincrementing — so the pair (programme, subject) is what
    // makes a row the same row on the second run.
    const directory = await importable({
      "subjects.csv": [
        "subject_id,subject_name_th,subject_name_en,credits",
        "90009801,วิชาคีย์ผสม,Composite Key Subject,3",
      ].join("\n"),
      "program_subjects.csv": [
        "program_id,subject_id,subject_type",
        `${BASELINE.program.program_id},90009801,required`,
      ].join("\n"),
    });

    const first = await runImport(directory);
    const second = await runImport(directory);

    expect(first.tables).toContainEqual({
      table: "program_subjects",
      created: 1,
      updated: 0,
    });
    expect(second.tables).toContainEqual({
      table: "program_subjects",
      created: 0,
      updated: 1,
    });
    expect(
      await prisma.program_subjects.count({ where: { subject_id: "90009801" } }),
    ).toBe(1);
  });

  it("leaves the columns Postgres computes to Postgres", async () => {
    const directory = await importable({
      "student.csv": [
        "student_id,first_name_th,last_name_th,department_id,program_id",
        `65009901,นักศึกษา,ทดสอบ,${BASELINE.department.department_id},${BASELINE.program.program_id}`,
      ].join("\n"),
      // student.student_id is a foreign key to users.user_id: staff and students
      // share one identifier space, so a student is a user first and a student
      // second. The write order is what makes one directory enough for both.
      "users.csv": ["user_id,email", "65009901,student9901@example.ac.th"].join("\n"),
    });

    const result = await runImport(directory);

    expect(result.errors).toEqual([]);
    expect(await prisma.student.findUnique({ where: { student_id: "65009901" } })).toMatchObject({
      // Neither column is in the file, and neither could be: both are GENERATED
      // ALWAYS, from the two names and from the first two digits of the id.
      full_name_th: "นักศึกษา ทดสอบ",
      admission_year: "2565",
    });
  });

  it("reads the true/false and date columns as their own types", async () => {
    const directory = await importable({
      "faculty.csv": [
        "faculty_id,faculty_name_th,faculty_name_en,is_active",
        "99,คณะที่ปิดแล้ว,Closed Faculty,FALSE",
      ].join("\n"),
      "programs.csv": ["program_id,created_at", "9901,2026-01-02T03:04:05Z"].join("\n"),
    });

    const result = await runImport(directory);

    expect(result.errors).toEqual([]);
    expect(await prisma.faculty.findUnique({ where: { faculty_id: "99" } })).toMatchObject({
      // Written "FALSE" by the spreadsheet, and false in the database.
      is_active: false,
    });
    expect(
      (await prisma.programs.findUnique({ where: { program_id: "9901" } }))?.created_at,
    ).toEqual(new Date("2026-01-02T03:04:05Z"));
  });

  it("keeps a decimal exactly as the file wrote it", async () => {
    // rubric_details is one of the seven tables with no natural key, so this is
    // also the case that shows what importing one of those looks like: the file
    // carries the id, and the rubric it belongs to is already in the database.
    const rubric = await createSharedRubric();
    const directory = await importable({
      "rubric_details.csv": [
        "id,rubric_id,criteria_name_th,criteria_name_en,weight",
        `900001,${rubric.id},ความถูกต้อง,Correctness,12.34`,
      ].join("\n"),
    });

    const first = await runImport(directory);
    const second = await runImport(directory);

    expect(first.tables).toEqual([{ table: "rubric_details", created: 1, updated: 0 }]);
    expect(second.tables).toEqual([{ table: "rubric_details", created: 0, updated: 1 }]);

    const detail = await prisma.rubric_details.findUnique({ where: { id: 900001 } });

    // Decimal(5, 2). Read back as a string so the assertion is about the digits
    // Postgres stored, not about what a float rounds to.
    expect(detail?.weight?.toString()).toBe("12.34");
  });

  it("updates a row that was already in the database before any import ran", async () => {
    const directory = await importable({
      "faculty.csv": [
        "faculty_id,faculty_name_th,faculty_name_en",
        `${BASELINE.faculty.faculty_id},คณะตัวอย่างแก้ชื่อ,Renamed Example Faculty`,
      ].join("\n"),
    });

    const result = await runImport(directory);

    expect(result.tables).toEqual([{ table: "faculty", created: 0, updated: 1 }]);
    expect(
      await prisma.faculty.findUnique({
        where: { faculty_id: BASELINE.faculty.faculty_id },
      }),
    ).toMatchObject({ faculty_name_th: "คณะตัวอย่างแก้ชื่อ" });
  });
});

describe("runImport, when the files are wrong", () => {
  it("names the line and the column, and writes nothing at all", async () => {
    const before = await prisma.faculty.count();
    const directory = await importable({
      "faculty.csv": [
        "faculty_id,faculty_name_th,faculty_name_en",
        "THIS-ID-IS-FAR-TOO-LONG,คณะยาวเกิน,Overlong Faculty",
        "80,คณะที่ถูกต้อง,Valid Faculty",
      ].join("\n"),
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      {
        table: "faculty",
        line: 2,
        column: "faculty_id",
        message: "ต้องยาวไม่เกิน 10 ตัวอักษร",
      },
    ]);
    // The second row was fine. It is still not in the database, because one bad
    // cell stops the whole run rather than half of it.
    expect(await prisma.faculty.findUnique({ where: { faculty_id: "80" } })).toBeNull();
    expect(await prisma.faculty.count()).toBe(before);
  });

  it("refuses a file that leaves out a column the table requires", async () => {
    const directory = await importable({
      "faculty.csv": ["faculty_id,faculty_name_th", "81,คณะขาดคอลัมน์"].join("\n"),
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual({
      table: "faculty",
      line: 1,
      column: "faculty_name_en",
      message: "ต้องมีคอลัมน์นี้ในไฟล์",
    });
    expect(await prisma.faculty.findUnique({ where: { faculty_id: "81" } })).toBeNull();
  });

  it("refuses a column the table does not have", async () => {
    const directory = await importable({
      "faculty.csv": [
        "faculty_id,faculty_name_th,faculty_name_en,faculty_nickname",
        "82,คณะเกินคอลัมน์,Extra Column Faculty,เกิน",
      ].join("\n"),
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual({
      table: "faculty",
      line: 1,
      column: "faculty_nickname",
      message: "ไม่มีคอลัมน์นี้ในตาราง faculty",
    });
  });

  it("reports a foreign key with nothing to point at", async () => {
    const directory = await importable({
      "departments.csv": [
        "department_id,department_name_th,faculty_id",
        "83,ภาควิชาไร้คณะ,79",
      ].join("\n"),
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      {
        table: "departments",
        line: 2,
        column: "faculty_id",
        message: "ไม่พบ 79 ในตาราง faculty (คอลัมน์ faculty_id)",
      },
    ]);
    expect(await prisma.departments.findUnique({ where: { department_id: "83" } })).toBeNull();
  });

  it("accepts a foreign key that the same run is about to create", async () => {
    // The mirror of the case above, and the reason the write order exists: the
    // faculty this department needs is not in the database yet, but it is in the
    // directory, so the reference resolves.
    const directory = await importable({
      "departments.csv": [
        "department_id,department_name_th,faculty_id",
        "84,ภาควิชามีคณะใหม่,84",
      ].join("\n"),
      "faculty.csv": ["faculty_id,faculty_name_th,faculty_name_en", "84,คณะใหม่,New Faculty"].join(
        "\n",
      ),
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(true);
    expect(await prisma.departments.findUnique({ where: { department_id: "84" } })).toMatchObject({
      faculty_id: "84",
    });
  });

  it("reports two rows in one file that claim the same key", async () => {
    const directory = await importable({
      "faculty.csv": [
        "faculty_id,faculty_name_th,faculty_name_en",
        "85,คณะแรก,First Faculty",
        "85,คณะซ้ำ,Duplicate Faculty",
      ].join("\n"),
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      {
        table: "faculty",
        line: 3,
        column: "faculty_id",
        message: "ซ้ำกับแถวบรรทัดที่ 2 ในไฟล์เดียวกัน",
      },
    ]);
  });

  it("refuses a value that is not one of the column's own", async () => {
    const directory = await importable({
      "subjects.csv": [
        "subject_id,subject_name_th,subject_name_en,credits",
        "90000001,วิชาทดสอบ,Test Subject,3",
      ].join("\n"),
      "program_subjects.csv": [
        "program_id,subject_id,subject_type",
        `${BASELINE.program.program_id},90000001,core`,
      ].join("\n"),
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      {
        table: "program_subjects",
        line: 2,
        column: "subject_type",
        message: "ต้องเป็นค่าใดค่าหนึ่งใน: required, elective",
      },
    ]);
    // subjects.csv was faultless, and is still not in the database: the run is
    // one decision across every file, not one per file.
    expect(await prisma.subjects.findUnique({ where: { subject_id: "90000001" } })).toBeNull();
  });

  it("refuses a whole number the column's type cannot hold", async () => {
    // semester is SmallInt, not Int. Left to Postgres this would be an error
    // about numeric types raised halfway through the transaction, naming no row.
    const directory = await importable({
      "semester_courses.csv": [
        "academic_year,semester,subject_id",
        "2568,40000,90000003",
      ].join("\n"),
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      {
        table: "semester_courses",
        line: 2,
        column: "semester",
        message: "ต้องอยู่ในช่วง -32767 ถึง 32767",
      },
    ]);
  });

  it("refuses a decimal wider than the column's type", async () => {
    const rubric = await createSharedRubric();
    const directory = await importable({
      "rubric_details.csv": [
        "id,rubric_id,criteria_name_th,criteria_name_en,weight",
        `900002,${rubric.id},น้ำหนักเกิน,Overweight,1234.5`,
      ].join("\n"),
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      {
        table: "rubric_details",
        line: 2,
        column: "weight",
        message: "ต้องอยู่ในช่วง -999.99 ถึง 999.99",
      },
    ]);
  });

  it("refuses a number that is not one", async () => {
    const directory = await importable({
      "subjects.csv": [
        "subject_id,subject_name_th,subject_name_en,credits",
        "90000002,วิชาหน่วยกิตผิด,Bad Credits Subject,สามหน่วยกิต",
      ].join("\n"),
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      { table: "subjects", line: 2, column: "credits", message: "ต้องเป็นจำนวนเต็ม" },
    ]);
  });

  it("refuses a required cell left blank", async () => {
    const directory = await importable({
      "faculty.csv": ["faculty_id,faculty_name_th,faculty_name_en", "86,,Blank Thai Name"].join(
        "\n",
      ),
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      { table: "faculty", line: 2, column: "faculty_name_th", message: "ต้องระบุ" },
    ]);
  });

  it("refuses a file named after no table it can import", async () => {
    const directory = await importable({
      "facultys.csv": ["faculty_id,faculty_name_th,faculty_name_en", "87,คณะสะกดผิด,Typo"].join(
        "\n",
      ),
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({ table: "facultys", line: null, column: null });
  });

  it("refuses a column the database computes for itself", async () => {
    // A list of students exported from anywhere will have the full name in it,
    // and student.full_name_th is GENERATED ALWAYS — Postgres rejects a write
    // that so much as names it. Saying so against the header is the difference
    // between one clear line and a failed transaction quoting DEFAULT
    // expressions at the operator.
    const directory = await importable({
      "student.csv": [
        "student_id,first_name_th,last_name_th,full_name_th,department_id,program_id",
        `65009902,นักศึกษา,ทดสอบสอง,นักศึกษา ทดสอบสอง,${BASELINE.department.department_id},${BASELINE.program.program_id}`,
      ].join("\n"),
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      {
        table: "student",
        line: 1,
        column: "full_name_th",
        message: "ฐานข้อมูลคำนวณคอลัมน์นี้เอง ไฟล์ระบุค่าไม่ได้ ให้ลบคอลัมน์นี้ออก",
      },
    ]);
    expect(await prisma.student.findUnique({ where: { student_id: "65009902" } })).toBeNull();
  });

  it("refuses a keyless table unless the file supplies the id itself", async () => {
    // rubric_details has no natural key at all — its only unique column is an
    // autoincrementing id. Importing it without one would insert a fresh copy of
    // every row on every run, which is the one thing the importer promises not
    // to do, so it says so instead of quietly doing it.
    const directory = await importable({
      "rubric_details.csv": [
        "rubric_id,criteria_name_th,criteria_name_en",
        "1,เกณฑ์ทดสอบ,Test Criterion",
      ].join("\n"),
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      table: "rubric_details",
      line: 1,
      column: "id",
    });
  });

  it("refuses an empty file rather than reading it as an empty table", async () => {
    const directory = await importable({ "faculty.csv": "" });

    const result = await runImport(directory);

    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({ table: "faculty", line: null });
  });

  it("reports a row with the wrong number of cells", async () => {
    const directory = await importable({
      "faculty.csv": [
        "faculty_id,faculty_name_th,faculty_name_en",
        "88,คณะขาดช่อง",
      ].join("\n"),
    });

    const result = await runImport(directory);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      {
        table: "faculty",
        line: 2,
        column: null,
        message: "มี 2 ช่อง แต่หัวตารางมี 3 คอลัมน์",
      },
    ]);
  });
});

/**
 * PINNED, not asserted-as-correct — [#58](https://github.com/khthana/Deep-Portfolio/issues/58).
 *
 * `subject_clo_measurable_behavior` is on the master-data list and documented in
 * importer.md, but nothing can be written to it, and no file can be written that
 * would change that. Its `learning_activity` and `cognitive_level` columns are
 * NOT NULL and typed by two enums the baseline migration had to create empty,
 * because their real members were not recoverable from anywhere — the original
 * database is gone and the thesis document does not record them (D2).
 *
 * Two consequences, and this case pins both:
 *
 * The columns are `Unsupported(...)` in schema.prisma, so they are absent from
 * the DMMF the importer reads its columns off. A file cannot supply them — it
 * would be told the table has no such column — and no default stands behind
 * them.
 *
 * Prisma generates no `create`, `createMany` or `upsert` for a model with a
 * required unsupported field, there being no way to write a row it could not
 * fill. `writeTable`'s `model.create` is therefore an operation this model does
 * not have, and Prisma refuses the call rather than sending SQL. The run throws
 * instead of reporting: no `ImportError` describes this, and the transaction
 * takes the whole run down with it — the loud failure D2 chose over guessing at
 * values.
 *
 * Which is why #58 cannot be closed by a migration alone, whatever its
 * acceptance criteria say: `ALTER TYPE ... ADD VALUE` fills the enums, but the
 * importer only starts asking for the two columns once schema.prisma declares
 * them as enums rather than as `Unsupported`. When that happens this case is the
 * one that should fail — the file below names neither column, so it should start
 * being refused with a line number rather than throwing. Rewrite it then; do not
 * relax it.
 */
describe("runImport, on the table that cannot be written yet", () => {
  it("throws on subject_clo_measurable_behavior, however sound the file (#58)", async () => {
    // Everything a file can get right is right here: the id this table's
    // generated key has to be given, a CLO that exists, and cells of the types
    // their columns want.
    const clo = await createCLO({ section_id: 9_801 });
    const directory = await importable({
      "subject_clo_measurable_behavior.csv": [
        "id,clo_id,behavior_no,behavior_detail",
        `9801,${clo.clo_id},1,อธิบายหลักการของเรื่องที่เรียนได้`,
      ].join("\n"),
      // A table that writes perfectly well, and is written first because nothing
      // it references is in this run. It is here to show what the throw costs:
      // the transaction takes it back down with the file it could not write.
      "faculty.csv": ["faculty_id,faculty_name_th,faculty_name_en", "78,คณะร่วมรอบ,Same Run Faculty"].join(
        "\n",
      ),
    });

    // The message is Prisma's own wording, not ours, so an upgrade may move it.
    // The pin is the refusal, not the sentence.
    await expect(runImport(directory)).rejects.toThrow(
      "Operation 'createOne' for model 'subject_clo_measurable_behavior' does not match any query.",
    );

    expect(
      await prisma.subject_clo_measurable_behavior.count({
        where: { clo_id: clo.clo_id },
      }),
    ).toBe(0);
    expect(await prisma.faculty.findUnique({ where: { faculty_id: "78" } })).toBeNull();
  });
});
