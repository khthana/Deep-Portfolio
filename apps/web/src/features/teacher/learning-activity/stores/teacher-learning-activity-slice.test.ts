import { describe } from "vitest";
import { teacherLearningActivitySlice } from "./teacher-learning-activity-slice";
import {
  fetchAllLearningActivity,
  fetchAllSubmittedLearningActivityList,
  fetchLearningActivity,
  fetchLearningActivityOptions,
  fetchStudentLearningActivityDetail,
  postGradeStudentLearningActivity,
  postLearningActivity,
  putLearningActivity,
} from "./teacher-learning-activity-action";
import { itOnlyTracksLoading } from "../../../../test/slice-cases";

/**
 * The teacher's side of a learning activity — the same eight steps as an
 * activity, minus the score.
 *
 * Five of the flags are named after the request rather than after the state
 * they hold (`fetchAllLearningActivity`, not `fetchAllLearningActivityLoading`),
 * which is the hand-over's own inconsistency and is pinned here as it stands.
 */

describe("teacherLearningActivitySlice", () => {
  itOnlyTracksLoading(teacherLearningActivitySlice.reducer, [
    { thunk: fetchLearningActivity, flag: "fetchLearningActivityLoading" },
    { thunk: putLearningActivity, flag: "putLearningActivityLoading" },
    { thunk: postLearningActivity, flag: "postLearningActivityLoading" },
    { thunk: fetchAllLearningActivity, flag: "fetchAllLearningActivity" },
    {
      thunk: fetchLearningActivityOptions,
      flag: "fetchLearningActivityOptions",
    },
    {
      thunk: fetchAllSubmittedLearningActivityList,
      flag: "fetchAllSubmittedLearningActivityList",
    },
    {
      thunk: fetchStudentLearningActivityDetail,
      flag: "fetchStudentLearningActivityDetail",
    },
    {
      thunk: postGradeStudentLearningActivity,
      flag: "postGradeStudentLearningActivity",
    },
  ]);
});
