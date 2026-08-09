import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import { BASELINE } from "./seed";
import { createSharedRubric, createSharedRubricDetail } from "./factories";

/**
 * The programme's shared rubrics — /rubric.
 *
 * Reference data, and read-only: there is no endpoint in this system that
 * writes a `rubrics` row, so whoever owns the curriculum puts them in the
 * database by other means. A teacher writing an activity reads them here and
 * copies what they want into that activity's own rubric, which is a different
 * pair of tables entirely — see the note in test/factories/rubric.ts.
 *
 * Nothing here checks a session. The catalogue is the same for everyone.
 */

/** The ids in a response body, in the order the endpoint returned them. */
function ids(response: { body: { data: { id: number }[] } }): number[] {
  return response.body.data.map((row) => row.id);
}

describe("GET /rubric/shared-rubric", () => {
  it("returns the programme's rubrics in display order", async () => {
    const second = await createSharedRubric({
      rubric_name_th: "เกณฑ์การนำเสนอ",
      display_order: 2,
    });
    const first = await createSharedRubric({
      rubric_name_th: "เกณฑ์การเขียนรายงาน",
      display_order: 1,
    });

    // No cookie: this is a catalogue, not anyone's data.
    const response = await request(app)
      .get("/rubric/shared-rubric")
      .query({ program_id: BASELINE.program.program_id });

    expect(response.status).toBe(200);
    expect(
      response.body.data.filter((rubric: { id: number }) =>
        [first.id, second.id].includes(rubric.id),
      ),
    ).toEqual([
      expect.objectContaining({
        id: first.id,
        rubric_name_th: "เกณฑ์การเขียนรายงาน",
        display_order: 1,
      }),
      expect.objectContaining({
        id: second.id,
        rubric_name_th: "เกณฑ์การนำเสนอ",
        display_order: 2,
      }),
    ]);
  });

  it("returns only this programme's rubrics", async () => {
    const mine = await createSharedRubric();
    const theirs = await createSharedRubric({
      program_id: BASELINE.otherProgram.program_id,
    });

    const response = await request(app)
      .get("/rubric/shared-rubric")
      .query({ program_id: BASELINE.program.program_id });

    expect(ids(response)).toContain(mine.id);
    expect(ids(response)).not.toContain(theirs.id);
  });

  it("returns an empty list for a programme that has nothing", async () => {
    // Nothing looks the programme up, so an id belonging to no programme at
    // all is answered the same way as one that simply has no rubrics yet.
    const response = await request(app)
      .get("/rubric/shared-rubric")
      .query({ program_id: "0000" });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("answers 400 when no programme is named", async () => {
    // A missing parameter is `undefined`, and Prisma reads
    // `where: { program_id: undefined }` as "do not filter on this column"
    // rather than "match null" — so leaving the parameter out used to widen the
    // query to every programme instead of narrowing it to one.
    await createSharedRubric();
    await createSharedRubric({
      program_id: BASELINE.otherProgram.program_id,
    });

    const response = await request(app).get("/rubric/shared-rubric");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: program_id ต้องระบุ",
      errors: [
        { field: "program_id", location: "query", message: "ต้องระบุ" },
      ],
    });
  });
});

describe("GET /rubric/shared-rubric/detail", () => {
  it("returns the rubric's criteria in display order", async () => {
    const rubric = await createSharedRubric();
    const second = await createSharedRubricDetail({
      rubric_id: rubric.id,
      criteria_name_th: "ความสมบูรณ์",
      display_order: 2,
    });
    const first = await createSharedRubricDetail({
      rubric_id: rubric.id,
      criteria_name_th: "ความถูกต้อง",
      level_4_description: "ถูกต้องครบถ้วนทุกข้อ",
      display_order: 1,
    });

    const response = await request(app)
      .get("/rubric/shared-rubric/detail")
      .query({ rubric_id: rubric.id });

    expect(response.status).toBe(200);
    // Scoped to this rubric by the query, so the whole body is the assertion.
    expect(response.body.data).toEqual([
      expect.objectContaining({
        id: first.id,
        criteria_name_th: "ความถูกต้อง",
        level_4_description: "ถูกต้องครบถ้วนทุกข้อ",
        display_order: 1,
      }),
      expect.objectContaining({
        id: second.id,
        criteria_name_th: "ความสมบูรณ์",
        display_order: 2,
      }),
    ]);
  });

  it("returns only this rubric's criteria", async () => {
    const rubric = await createSharedRubric();
    const other = await createSharedRubric();
    const mine = await createSharedRubricDetail({ rubric_id: rubric.id });
    await createSharedRubricDetail({ rubric_id: other.id });

    const response = await request(app)
      .get("/rubric/shared-rubric/detail")
      .query({ rubric_id: rubric.id });

    expect(ids(response)).toEqual([mine.id]);
  });

  it("returns an empty list for a rubric that does not exist", async () => {
    // The endpoint reads the detail table and never looks the rubric up, so a
    // wrong id is indistinguishable from a rubric with no criteria in it.
    const response = await request(app)
      .get("/rubric/shared-rubric/detail")
      .query({ rubric_id: 999_999 });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("answers 400 for a rubric id that is not a number", async () => {
    const response = await request(app)
      .get("/rubric/shared-rubric/detail")
      .query({ rubric_id: "เกณฑ์แรก" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "rubric_id", location: "query", message: "ต้องเป็นตัวเลข" },
    ]);
  });
});
