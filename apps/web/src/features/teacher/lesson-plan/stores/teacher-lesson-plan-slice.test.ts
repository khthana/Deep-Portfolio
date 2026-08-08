import { describe } from "vitest";
import { teacherLessonPlanSlice } from "./teacher-lesson-plan-slice";
import {
  editLessonPlan,
  fetchLessonPlan,
  fetchLessonPlanOptions,
  postLessonPlan,
  removeLessonPlan,
} from "./teacher-lesson-plan-action";
import { itOnlyTracksLoading } from "../../../../test/slice-cases";

/**
 * The weekly lesson plan — one row per week, edited in place.
 *
 * The table holds the plan, so the store carries nothing but the five flags
 * the row's spinner and disabled buttons read.
 */

describe("teacherLessonPlanSlice", () => {
  itOnlyTracksLoading(teacherLessonPlanSlice.reducer, [
    { thunk: postLessonPlan, flag: "postLessonPlanLoading" },
    { thunk: fetchLessonPlan, flag: "fetchLessonPlanLoading" },
    { thunk: editLessonPlan, flag: "editLessonPlanLoading" },
    { thunk: removeLessonPlan, flag: "removeLessonPlanLoading" },
    { thunk: fetchLessonPlanOptions, flag: "fetchLessonPlanOptionsLoading" },
  ]);
});
