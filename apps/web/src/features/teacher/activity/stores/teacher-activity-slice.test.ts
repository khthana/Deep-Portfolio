import { describe } from "vitest";
import { teacherActivitySlice } from "./teacher-activity-slice";
import {
  deleteActivity,
  fetchActivity,
  fetchActivityOptions,
  fetchAllActivity,
  fetchAllSubmittedActivityList,
  fetchSharedRubric,
  fetchSharedRubricDetail,
  fetchStudentActivityDetail,
  getValidateActivityCLOMapping,
  patchBookmarkStudentActivity,
  postActivity,
  postGradeStudentActivity,
  putActivity,
} from "./teacher-activity-action";
import { itOnlyTracksLoading } from "../../../../test/slice-cases";

/**
 * The teacher's side of an activity: writing one, listing what has been handed
 * in, and grading it.
 *
 * Thirteen requests and not one of them keeps anything. Every page in this
 * feature holds its own response in component state and reads only the loading
 * flag out of the store — so the whole slice is flags, and this file says so
 * once rather than thirteen times.
 */

describe("teacherActivitySlice", () => {
  itOnlyTracksLoading(teacherActivitySlice.reducer, [
    { thunk: fetchSharedRubric, flag: "fetchSharedRubricLoading" },
    { thunk: fetchSharedRubricDetail, flag: "fetchSharedRubricDetailLoading" },
    { thunk: fetchActivity, flag: "fetchActivityLoading" },
    { thunk: postActivity, flag: "postActivityLoading" },
    { thunk: putActivity, flag: "putActivityLoading" },
    { thunk: deleteActivity, flag: "deleteActivityLoading" },
    { thunk: fetchAllActivity, flag: "fetchAllActivityLoading" },
    { thunk: fetchActivityOptions, flag: "fetchActivityOptionsLoading" },
    {
      thunk: fetchAllSubmittedActivityList,
      flag: "fetchAllSubmittedActivityListLoading",
    },
    {
      thunk: fetchStudentActivityDetail,
      flag: "fetchStudentActivityDetailLoading",
    },
    {
      thunk: postGradeStudentActivity,
      flag: "postGradeStudentActivityLoading",
    },
    {
      thunk: patchBookmarkStudentActivity,
      flag: "patchBookmarkStudentActivityLoading",
    },
    {
      thunk: getValidateActivityCLOMapping,
      flag: "getValidateActivityCLOMappingLoading",
    },
  ]);
});
