import { describe, expect, it } from "vitest";
import { teacherCourseMaterialSlice } from "./teacher-material-slice";
import {
  fetchCourseMaterial,
  postCourseMaterial,
  removeCourseMaterial,
} from "./teacher-material-action";
import type { GetCourseMaterialDetailResp } from "../types/course-material-type";
import {
  initialStateOf,
  itOnlyTracksLoading,
  itStoresTheResponse,
} from "../../../../test/slice-cases";

/**
 * Course materials — the files and links attached to a week of the lesson
 * plan.
 *
 * The list is kept here because the lesson-plan table reads it back after an
 * upload rather than refetching the whole plan.
 */

const reducer = teacherCourseMaterialSlice.reducer;

const materials = [
  { id: 1, title: "สไลด์สัปดาห์ที่หนึ่ง" },
] as unknown as GetCourseMaterialDetailResp[];

describe("teacherCourseMaterialSlice", () => {
  itStoresTheResponse(reducer, [
    {
      thunk: fetchCourseMaterial,
      flag: "fetchCourseMaterialLoading",
      field: "courseMaterialData",
      data: materials,
    },
  ]);

  itOnlyTracksLoading(reducer, [
    { thunk: postCourseMaterial, flag: "postCourseMaterialLoading" },
    { thunk: removeCourseMaterial, flag: "removeCourseMaterialLoading" },
  ]);

  it("declares two flags for requests this slice does not have", () => {
    // Pinned, not endorsed. `editCourseMaterialLoading` and
    // `fetchCourseMaterialOptionsLoading` were declared for an edit and an
    // options request that were never written; no reducer raises either.
    const initialState = initialStateOf(reducer);

    expect(initialState.editCourseMaterialLoading).toBe(false);
    expect(initialState.fetchCourseMaterialOptionsLoading).toBe(false);
  });
});
