import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { GENERIC_ERROR_MESSAGE } from "../../../../utils/api-error";
import {
  fetchAllAnnouncement,
  fetchCourseClasswork,
  fetchCLO,
  fetchCourseDetail,
  fetchStudentLessonPlanWithMaterial,
  fetchScoreWeight,
  fetchStudentCourseList,
  fetchStudentActivityDetail,
  fetchLearningActivityDetail,
  postSubmitActivity,
  postSubmitLearningActivity,
  postStudentActivityGroup,
  fetchStudentActivityGroup,
  fetchStudentActivityGroupInSec,
  fetchStudentWithoutGroup,
  patchStudentActivityGroup,
  postResendActivityGroupInvite,
  postStudentLearningActivityGroup,
  patchStudentLearningActivityGroup,
  postResendLearningActivityGroupInvite,
  fetchStudentLearningActivityGroup,
  fetchStudentLearningActivityGroupInSec,
  fetchStudentLearningActivityWithoutGroup,
  fetchStudentEvaluationList,
} from "./course-action";
import type {
  ActivityDetailResp,
  CourseDetail,
  GroupDetailResp,
  LearningActivityDetailResp,
  StudentActivityDetailResp,
  StudentWithoutGroup,
} from "@deep-portfolio/api-types";
import type {
  AnnouncementDetailResp,
  ScoreWeightResp,
} from "../../../../types/course-type.type";
import {
  mapActivityDetail,
  mapLearningActivityDetail,
  type ClassworkDetailFull,
  type ClassworkDetailResp,
} from "../types/course-type";

type StudentCourseSlice = {
  courseList: CourseDetail[];
  selectedCourse: CourseDetail | null;
  selectedClasswork: StudentActivityDetailResp | null;
  classworkDetail: ClassworkDetailFull | null;
  announcements: AnnouncementDetailResp[];
  activities: ActivityDetailResp[];
  learningActivities: LearningActivityDetailResp[];
  allClasswork: ClassworkDetailResp | null;
  scoreWeight: ScoreWeightResp[];
  // The without-group list and nothing else: the only two reducers that write
  // this field are the two without-group thunks, so the row it holds is the row
  // that endpoint sends (#68). It used to say `StudentDetailResp`, whose every
  // field is optional — which is why nothing complained, and why both readers
  // guarded a `student_id` that is always there. Those guards came out with the
  // retype; the ones around `full_name_th` stayed, because that one is nullable.
  studentList: StudentWithoutGroup[];
  studentGroup: GroupDetailResp | null;
  studentGroupInSec: GroupDetailResp[];

  fetchStudentCourseListLoading: boolean;
  fetchCourseDetailLoading: boolean;
  fetchScoreWeightLoading: boolean;
  fetchCLOLoading: boolean;
  fetchLessonPlanLoading: boolean;
  fetchAllAnnouncementLoading: boolean;
  fetchAllClassworkLoading: boolean;
  fetchActivityDetailLoading: boolean;
  fetchLearningActivityDetailLoading: boolean;
  postSubmitActivityLoading: boolean;
  postSubmitLearningActivityLoading: boolean;
  getStudentInSecLoading: boolean;
  postStudentActivityGroupLoading: boolean;
  fetchStudentActivityGroupLoading: boolean;
  fetchStudentActivityGroupInSecLoading: boolean;
  fetchStudentWithoutGroupLoading: boolean;
  patchStudentActivityGroupLoading: boolean;
  postResendActivityGroupInviteLoading: boolean;

  postStudentLearningActivityGroupLoading: boolean;
  patchStudentLearningActivityGroupLoading: boolean;
  postResendLearningActivityGroupInviteLoading: boolean;
  fetchStudentLearningActivityGroupLoading: boolean;
  fetchStudentLearningActivityWithoutGroupLoading: boolean;
  fetchStudentLearningActivityGroupInSecLoading: boolean;

  fetchStudentEvaluationListLoading: boolean;
  isFetchStudentCourseList: boolean;

  error: string | null;
};

const initialState: StudentCourseSlice = {
  courseList: [],
  selectedCourse: null,
  selectedClasswork: null,
  classworkDetail: null,
  announcements: [],
  activities: [],
  learningActivities: [],
  allClasswork: null,
  scoreWeight: [],
  studentList: [],
  studentGroup: null,
  studentGroupInSec: [],

  fetchStudentCourseListLoading: false,
  fetchCourseDetailLoading: false,
  fetchScoreWeightLoading: false,
  fetchCLOLoading: false,
  fetchLessonPlanLoading: false,
  fetchAllAnnouncementLoading: false,
  fetchAllClassworkLoading: false,
  fetchActivityDetailLoading: false,
  fetchLearningActivityDetailLoading: false,
  postSubmitActivityLoading: false,
  postSubmitLearningActivityLoading: false,
  getStudentInSecLoading: false,
  postStudentActivityGroupLoading: false,
  fetchStudentActivityGroupLoading: false,
  fetchStudentActivityGroupInSecLoading: false,
  fetchStudentWithoutGroupLoading: false,
  patchStudentActivityGroupLoading: false,
  postResendActivityGroupInviteLoading: false,

  postStudentLearningActivityGroupLoading: false,
  patchStudentLearningActivityGroupLoading: false,
  postResendLearningActivityGroupInviteLoading: false,
  fetchStudentLearningActivityGroupLoading: false,
  fetchStudentLearningActivityWithoutGroupLoading: false,
  fetchStudentLearningActivityGroupInSecLoading: false,

  fetchStudentEvaluationListLoading: false,

  isFetchStudentCourseList: false,

  error: null,
};

export const studentCourseSlice = createSlice({
  name: "studentCourse",
  initialState,
  reducers: {
    setSelectedCourse(state, action: PayloadAction<CourseDetail | null>) {
      state.selectedCourse = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentCourseList.pending, (state) => {
        state.fetchStudentCourseListLoading = true;
      })
      .addCase(fetchStudentCourseList.fulfilled, (state, action) => {
        state.fetchStudentCourseListLoading = false;
        state.courseList = action.payload.data;
        state.isFetchStudentCourseList = true;
      })
      .addCase(fetchStudentCourseList.rejected, (state, action) => {
        state.fetchStudentCourseListLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(fetchCourseDetail.pending, (state) => {
        state.fetchCourseDetailLoading = true;
      })
      .addCase(fetchCourseDetail.fulfilled, (state, action) => {
        state.fetchCourseDetailLoading = false;
        state.selectedCourse = action.payload.data;
      })
      .addCase(fetchCourseDetail.rejected, (state, action) => {
        state.fetchCourseDetailLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(fetchScoreWeight.pending, (state) => {
        state.fetchScoreWeightLoading = true;
      })
      .addCase(fetchScoreWeight.fulfilled, (state, action) => {
        state.fetchScoreWeightLoading = false;
        state.scoreWeight = action.payload.data;
      })
      .addCase(fetchScoreWeight.rejected, (state, action) => {
        state.fetchScoreWeightLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(fetchCLO.pending, (state) => {
        state.fetchCLOLoading = true;
      })
      .addCase(fetchCLO.fulfilled, (state, action) => {
        state.fetchCLOLoading = false;
      })
      .addCase(fetchCLO.rejected, (state, action) => {
        state.fetchCLOLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(fetchStudentLessonPlanWithMaterial.pending, (state) => {
        state.fetchLessonPlanLoading = true;
      })
      .addCase(
        fetchStudentLessonPlanWithMaterial.fulfilled,
        (state, action) => {
          state.fetchLessonPlanLoading = false;
        },
      )
      .addCase(fetchStudentLessonPlanWithMaterial.rejected, (state, action) => {
        state.fetchLessonPlanLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(fetchAllAnnouncement.pending, (state) => {
        state.fetchAllAnnouncementLoading = true;
      })
      .addCase(fetchAllAnnouncement.fulfilled, (state, action) => {
        state.fetchAllAnnouncementLoading = false;
        state.announcements = action.payload.data;
      })
      .addCase(fetchAllAnnouncement.rejected, (state, action) => {
        state.fetchAllAnnouncementLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(fetchStudentActivityDetail.pending, (state) => {
        state.fetchActivityDetailLoading = true;
        state.classworkDetail = null;
      })
      .addCase(fetchStudentActivityDetail.fulfilled, (state, action) => {
        state.fetchActivityDetailLoading = false;

        // No submission by that id, so there is nothing to map: the mappers
        // read the response's own fields and would throw on an absent one. The
        // screen reads the same null it does before the request lands (#68).
        const detail = action.payload.data;
        state.selectedClasswork = detail ?? null;
        state.classworkDetail = detail ? mapActivityDetail(detail) : null;
      })
      .addCase(fetchStudentActivityDetail.rejected, (state, action) => {
        state.fetchActivityDetailLoading = false;
        state.classworkDetail = null;

        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(fetchLearningActivityDetail.pending, (state) => {
        state.fetchLearningActivityDetailLoading = true;
        state.classworkDetail = null;
      })
      .addCase(fetchLearningActivityDetail.fulfilled, (state, action) => {
        state.fetchLearningActivityDetailLoading = false;

        // Same guard as the graded half above.
        const detail = action.payload.data;
        state.classworkDetail = detail
          ? mapLearningActivityDetail(detail)
          : null;
      })
      .addCase(fetchLearningActivityDetail.rejected, (state, action) => {
        state.fetchLearningActivityDetailLoading = false;
        state.classworkDetail = null;

        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(fetchCourseClasswork.pending, (state) => {
        state.fetchAllClassworkLoading = true;
      })
      .addCase(fetchCourseClasswork.fulfilled, (state, action) => {
        state.fetchAllClassworkLoading = false;
        state.allClasswork = action.payload.data;
      })
      .addCase(fetchCourseClasswork.rejected, (state, action) => {
        state.fetchAllClassworkLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(postSubmitActivity.pending, (state) => {
        state.postSubmitActivityLoading = true;
        // state.classworkDetail = null;
      })
      .addCase(postSubmitActivity.fulfilled, (state, action) => {
        state.postSubmitActivityLoading = false;
        state.classworkDetail = mapActivityDetail(action.payload.data);
      })
      .addCase(postSubmitActivity.rejected, (state, action) => {
        state.postSubmitActivityLoading = false;
        // state.classworkDetail = null;

        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(postSubmitLearningActivity.pending, (state) => {
        state.postSubmitLearningActivityLoading = true;
        // state.classworkDetail = null;
      })
      .addCase(postSubmitLearningActivity.fulfilled, (state, action) => {
        state.postSubmitLearningActivityLoading = false;
        state.classworkDetail = mapLearningActivityDetail(action.payload.data);
      })
      .addCase(postSubmitLearningActivity.rejected, (state, action) => {
        state.postSubmitLearningActivityLoading = false;
        // state.classworkDetail = null;

        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    //----------activity group-----------------------------------------------

    builder
      .addCase(postStudentActivityGroup.pending, (state) => {
        state.postStudentActivityGroupLoading = true;
      })
      .addCase(postStudentActivityGroup.fulfilled, (state, action) => {
        state.postStudentActivityGroupLoading = false;
      })
      .addCase(postStudentActivityGroup.rejected, (state, action) => {
        state.postStudentActivityGroupLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(patchStudentActivityGroup.pending, (state) => {
        state.patchStudentActivityGroupLoading = true;
      })
      .addCase(patchStudentActivityGroup.fulfilled, (state, action) => {
        state.patchStudentActivityGroupLoading = false;
      })
      .addCase(patchStudentActivityGroup.rejected, (state, action) => {
        state.patchStudentActivityGroupLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    // Nothing to keep on success: the new link goes to the member by email, so
    // the leader who asked gets back only the flag going down again (#57).
    builder
      .addCase(postResendActivityGroupInvite.pending, (state) => {
        state.postResendActivityGroupInviteLoading = true;
      })
      .addCase(postResendActivityGroupInvite.fulfilled, (state) => {
        state.postResendActivityGroupInviteLoading = false;
      })
      .addCase(postResendActivityGroupInvite.rejected, (state, action) => {
        state.postResendActivityGroupInviteLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(fetchStudentActivityGroup.pending, (state) => {
        state.fetchStudentActivityGroupLoading = true;
      })
      .addCase(fetchStudentActivityGroup.fulfilled, (state, action) => {
        state.fetchStudentActivityGroupLoading = false;
        state.studentGroup = action.payload.data;
      })
      .addCase(fetchStudentActivityGroup.rejected, (state, action) => {
        state.fetchStudentActivityGroupLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(fetchStudentActivityGroupInSec.pending, (state) => {
        state.fetchStudentActivityGroupInSecLoading = true;
      })
      .addCase(fetchStudentActivityGroupInSec.fulfilled, (state, action) => {
        state.fetchStudentActivityGroupInSecLoading = false;
        state.studentGroupInSec = action.payload.data;
      })
      .addCase(fetchStudentActivityGroupInSec.rejected, (state, action) => {
        state.fetchStudentActivityGroupInSecLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(fetchStudentWithoutGroup.pending, (state) => {
        state.fetchStudentWithoutGroupLoading = true;
      })
      .addCase(fetchStudentWithoutGroup.fulfilled, (state, action) => {
        state.fetchStudentWithoutGroupLoading = false;
        state.studentList = action.payload.data;
      })
      .addCase(fetchStudentWithoutGroup.rejected, (state, action) => {
        state.fetchStudentWithoutGroupLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    //----------learning activity group-----------------------------------------------

    builder
      .addCase(postStudentLearningActivityGroup.pending, (state) => {
        state.postStudentLearningActivityGroupLoading = true;
      })
      .addCase(postStudentLearningActivityGroup.fulfilled, (state, action) => {
        state.postStudentLearningActivityGroupLoading = false;
      })
      .addCase(postStudentLearningActivityGroup.rejected, (state, action) => {
        state.postStudentLearningActivityGroupLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(patchStudentLearningActivityGroup.pending, (state) => {
        state.patchStudentLearningActivityGroupLoading = true;
      })
      .addCase(patchStudentLearningActivityGroup.fulfilled, (state, action) => {
        state.patchStudentLearningActivityGroupLoading = false;
      })
      .addCase(patchStudentLearningActivityGroup.rejected, (state, action) => {
        state.patchStudentLearningActivityGroupLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(postResendLearningActivityGroupInvite.pending, (state) => {
        state.postResendLearningActivityGroupInviteLoading = true;
      })
      .addCase(postResendLearningActivityGroupInvite.fulfilled, (state) => {
        state.postResendLearningActivityGroupInviteLoading = false;
      })
      .addCase(
        postResendLearningActivityGroupInvite.rejected,
        (state, action) => {
          state.postResendLearningActivityGroupInviteLoading = false;
          state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
        },
      );

    builder
      .addCase(fetchStudentLearningActivityGroup.pending, (state) => {
        state.fetchStudentLearningActivityGroupLoading = true;
      })
      .addCase(fetchStudentLearningActivityGroup.fulfilled, (state, action) => {
        state.fetchStudentLearningActivityGroupLoading = false;
        state.studentGroup = action.payload.data;
      })
      .addCase(fetchStudentLearningActivityGroup.rejected, (state, action) => {
        state.fetchStudentLearningActivityGroupLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(fetchStudentLearningActivityGroupInSec.pending, (state) => {
        state.fetchStudentLearningActivityGroupInSecLoading = true;
      })
      .addCase(
        fetchStudentLearningActivityGroupInSec.fulfilled,
        (state, action) => {
          state.fetchStudentLearningActivityGroupInSecLoading = false;
          state.studentGroupInSec = action.payload.data;
        },
      )
      .addCase(
        fetchStudentLearningActivityGroupInSec.rejected,
        (state, action) => {
          state.fetchStudentLearningActivityGroupInSecLoading = false;
          state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
        },
      );

    builder
      .addCase(fetchStudentLearningActivityWithoutGroup.pending, (state) => {
        state.fetchStudentLearningActivityWithoutGroupLoading = true;
      })
      .addCase(
        fetchStudentLearningActivityWithoutGroup.fulfilled,
        (state, action) => {
          state.fetchStudentLearningActivityWithoutGroupLoading = false;
          state.studentList = action.payload.data;
        },
      )
      .addCase(
        fetchStudentLearningActivityWithoutGroup.rejected,
        (state, action) => {
          state.fetchStudentLearningActivityWithoutGroupLoading = false;
          state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
        },
      );

    builder
      .addCase(fetchStudentEvaluationList.pending, (state) => {
        state.fetchStudentEvaluationListLoading = true;
      })
      .addCase(fetchStudentEvaluationList.fulfilled, (state, action) => {
        state.fetchStudentEvaluationListLoading = false;
      })
      .addCase(fetchStudentEvaluationList.rejected, (state, action) => {
        state.fetchStudentEvaluationListLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });
  },
});

export const studentCourseSliceAction = studentCourseSlice.actions;
