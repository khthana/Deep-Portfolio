import { describe } from "vitest";
import { teacherActivityCLOMappingSlice } from "./teacher-mapping-slice";
import {
  fetchActivity,
  fetchLearningActivity,
  postActivityCLOMapping,
  postLearningActivityCLOMapping,
} from "./teacher-mapping-action";
import { itOnlyTracksLoading } from "../../../../test/slice-cases";

/**
 * Mapping activities onto course learning outcomes.
 *
 * Four requests, in two matching pairs — one for activities, one for learning
 * activities. The grid itself is drawn from the CLO list the teacher-course
 * slice holds, so nothing is kept here.
 */

describe("teacherActivityCLOMappingSlice", () => {
  itOnlyTracksLoading(teacherActivityCLOMappingSlice.reducer, [
    { thunk: fetchActivity, flag: "fetchActivityLoading" },
    { thunk: postActivityCLOMapping, flag: "postActivityCLOMappingLoading" },
    { thunk: fetchLearningActivity, flag: "fetchLearningActivityLoading" },
    {
      thunk: postLearningActivityCLOMapping,
      flag: "postLearningActivityCLOMappingLoading",
    },
  ]);
});
