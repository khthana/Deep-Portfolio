import { describe } from "vitest";
import { teacherCourseSlice } from "./teacher-course-slice";
import {
  editCLO,
  editScoreWeight,
  fetchCLO,
  fetchPLO,
  fetchScoreWeight,
  fetchScoreWeightOptions,
  postCLO,
  postCreateCourseSectionSchedule,
  postScoreWeight,
  removeCLO,
  removeScoreWeight,
} from "./teacher-course-action";
import type { CLOResp } from "@deep-portfolio/api-types";
import {
  itOnlyTracksLoading,
  itStoresTheResponse,
} from "../../../../test/slice-cases";

/**
 * Setting a course up: its score weights, its course learning outcomes, and
 * the section schedule.
 *
 * Only the CLO list is kept — the mapping page reads it back out of the store
 * to draw the CLO/PLO grid. Everything else is a form that refetches after it
 * saves.
 */

const clos = [
  { id: 1, clo_number: "CLO1", description: "อธิบายหลักการได้" },
] as unknown as CLOResp[];

describe("teacherCourseSlice", () => {
  itStoresTheResponse(teacherCourseSlice.reducer, [
    { thunk: fetchCLO, flag: "fetchCLOLoading", field: "cloData", data: clos },
  ]);

  itOnlyTracksLoading(teacherCourseSlice.reducer, [
    { thunk: postScoreWeight, flag: "postScoreWeightLoading" },
    { thunk: fetchScoreWeight, flag: "fetchScoreWeightLoading" },
    { thunk: editScoreWeight, flag: "editScoreWeightLoading" },
    { thunk: removeScoreWeight, flag: "removeScoreWeightLoading" },
    { thunk: fetchScoreWeightOptions, flag: "fetchScoreWeightOptionsLoading" },
    { thunk: postCLO, flag: "postCLOLoading" },
    { thunk: editCLO, flag: "editCLOLoading" },
    { thunk: removeCLO, flag: "removeCLOLoading" },
    { thunk: fetchPLO, flag: "fetchPLOLoading" },
    {
      thunk: postCreateCourseSectionSchedule,
      flag: "postCreateCourseSectionScheduleLoading",
    },
  ]);
});
