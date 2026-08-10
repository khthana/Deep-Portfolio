import { describe, expect, it } from "vitest";
import { toRubricPayload } from "./rubric-payload";

describe("toRubricPayload", () => {
  const levels = [
    { level_no: 2, description: "ถูกต้องครบถ้วน" },
    { level_no: 1, description: "ยังไม่ถูกต้อง" },
  ];

  it("sends back the id a criterion arrived with", () => {
    // The whole point of #25: without it, PUT /activity cannot tell a criterion
    // it already has from a new one, and rewrites the rubric — marks and all.
    expect(
      toRubricPayload([{ id: 7, criteria: "ความถูกต้อง", weight: 100, levels }]),
    ).toEqual([{ id: 7, criteria: "ความถูกต้อง", weight: 100, levels }]);
  });

  it("leaves the id off a criterion the teacher just added", () => {
    const payload = toRubricPayload([
      { criteria: "ความสะอาดของโค้ด", weight: 40, levels },
    ]);

    expect(payload).toEqual([
      { criteria: "ความสะอาดของโค้ด", weight: 40, levels },
    ]);
    expect("id" in payload[0]).toBe(false);
  });

  it("drops the bookkeeping the shared-rubric modal hangs on a row", () => {
    expect(
      toRubricPayload([
        {
          criteria: "ความถูกต้อง",
          weight: 100,
          levels,
          _shared_rubric_index: 0,
          _shared_rubric_title_key: "rubric-1",
          _shared_rubric_detail_key: "detail-1",
        },
      ]),
    ).toEqual([{ criteria: "ความถูกต้อง", weight: 100, levels }]);
  });

  it("keeps the criteria in the order the table shows them", () => {
    expect(
      toRubricPayload([
        { id: 7, criteria: "ความถูกต้อง", weight: 60, levels },
        { criteria: "ความสะอาดของโค้ด", weight: 40, levels },
      ]).map((rubric) => rubric.criteria),
    ).toEqual(["ความถูกต้อง", "ความสะอาดของโค้ด"]);
  });

  it("hands back an empty list for a rubric with nothing in it", () => {
    expect(toRubricPayload([])).toEqual([]);
  });
});
