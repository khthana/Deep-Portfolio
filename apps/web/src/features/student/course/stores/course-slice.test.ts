import type { ClassworkDetailResp } from "@deep-portfolio/api-types";
import { describe, expect, it } from "vitest";
import { studentCourseSlice, studentCourseSliceAction } from "./course-slice";
import {
  fetchAllAnnouncement,
  fetchCLO,
  fetchCourseClasswork,
  fetchCourseDetail,
  fetchLearningActivityDetail,
  fetchScoreWeight,
  fetchStudentActivityDetail,
  fetchStudentActivityGroup,
  fetchStudentActivityGroupInSec,
  fetchStudentCourseList,
  fetchStudentEvaluationList,
  fetchStudentLearningActivityGroup,
  fetchStudentLearningActivityGroupInSec,
  fetchStudentLearningActivityWithoutGroup,
  fetchStudentLessonPlanWithMaterial,
  fetchStudentWithoutGroup,
  patchStudentActivityGroup,
  patchStudentLearningActivityGroup,
  postResendActivityGroupInvite,
  postResendLearningActivityGroupInvite,
  postStudentActivityGroup,
  postStudentLearningActivityGroup,
  postSubmitActivity,
  postSubmitLearningActivity,
} from "./course-action";
import {
  mapActivityDetail,
  mapLearningActivityDetail,
} from "../types/course-type";
import type {
  CourseDetail,
  GroupDetailResp,
  ScoreWeightDetail,
  StudentActivityDetailResp,
  StudentLearningActivityDetailResp,
  StudentWithoutGroup,
} from "@deep-portfolio/api-types";
import type { AnnouncementDetailResp } from "@deep-portfolio/api-types";
import {
  failed,
  initialStateOf,
  itOnlyTracksLoading,
  itStoresTheResponse,
  responded,
  started,
} from "../../../../test/slice-cases";

/**
 * Everything a student sees inside one course: the course list, the syllabus
 * tabs, the classwork detail page and the group-forming dialogs.
 *
 * The slice is by far the largest in the app — twenty-two requests — and most
 * of them fall into the two shapes the shared table covers. What is written
 * out by hand here is the part that is genuinely this slice's own: the
 * classwork detail page, which is fed from two different endpoints through two
 * different mappers into one field, and which clears that field on the way in
 * so the page cannot show the previous piece of work while the next is
 * loading.
 */

const reducer = studentCourseSlice.reducer;
const initialState = initialStateOf(reducer);

const course = {
  section_id: 10,
  subject_name_en: "Software Engineering",
} as unknown as CourseDetail;

/**
 * Only the fields the mappers read. The response types carry two dozen more —
 * the rubric rows, the score-ratio row, the teacher's own feedback — and
 * naming them here would say nothing about the mapping under test.
 */
const activityDetail = {
  id: 501,
  activity_id: 42,
  student_id: "65000001",
  section_id: 10,
  activity_name: "งานที่หนึ่ง",
  activity_type: "INDIVIDUAL",
  status: "SUBMITTED",
  score_number: 20,
  student_score: 18,
  expected_level: 3,
  deadline_date: "2024-01-05T13:45:00.000Z",
  detail: null,
  attachments: null,
  rubric_activity_mapping: [],
  submitted_files: { file: [], url: [] },
  submitted_at: "2024-01-04T09:00:00.000Z",
} as unknown as StudentActivityDetailResp;

const learningActivityDetail = {
  id: 601,
  learning_activity_id: 77,
  student_id: "65000001",
  section_id: 10,
  learning_activity_name: "กิจกรรมที่หนึ่ง",
  learning_activity_type: "GROUP",
  status: "NOT_SUBMITTED",
  deadline_date: "2024-01-09T13:45:00.000Z",
  detail: null,
  attachments: null,
  submitted_files: { file: [], url: [] },
  submitted_at: "2024-01-08T09:00:00.000Z",
} as unknown as StudentLearningActivityDetailResp;

const group: GroupDetailResp = {
  group_id: 3,
  members: [
    {
      student_id: "65000001",
      role: "LEADER",
      student_name: "ทดสอบ ระบบดี",
      status: "ACCEPT",
    },
  ],
};

const classwork: ClassworkDetailResp = { today: [], other: [] };

describe("studentCourseSlice", () => {
  describe("the requests that only report progress", () => {
    itOnlyTracksLoading(reducer, [
      { thunk: fetchCLO, flag: "fetchCLOLoading" },
      {
        thunk: fetchStudentLessonPlanWithMaterial,
        flag: "fetchLessonPlanLoading",
      },
      {
        thunk: postStudentActivityGroup,
        flag: "postStudentActivityGroupLoading",
      },
      {
        thunk: patchStudentActivityGroup,
        flag: "patchStudentActivityGroupLoading",
      },
      // The two resends belong here rather than beside the reads: the new token
      // is mailed to the member, so a success leaves the store exactly as it
      // found it (#57).
      {
        thunk: postResendActivityGroupInvite,
        flag: "postResendActivityGroupInviteLoading",
      },
      {
        thunk: postStudentLearningActivityGroup,
        flag: "postStudentLearningActivityGroupLoading",
      },
      {
        thunk: patchStudentLearningActivityGroup,
        flag: "patchStudentLearningActivityGroupLoading",
      },
      {
        thunk: postResendLearningActivityGroupInvite,
        flag: "postResendLearningActivityGroupInviteLoading",
      },
      {
        thunk: fetchStudentEvaluationList,
        flag: "fetchStudentEvaluationListLoading",
      },
    ]);
  });

  describe("the requests that fill one field", () => {
    itStoresTheResponse(reducer, [
      {
        thunk: fetchCourseDetail,
        flag: "fetchCourseDetailLoading",
        field: "selectedCourse",
        data: course,
      },
      {
        thunk: fetchScoreWeight,
        flag: "fetchScoreWeightLoading",
        field: "scoreWeight",
        data: [{ id: 1, name: "Midterm" }] as unknown as ScoreWeightDetail[],
      },
      {
        thunk: fetchAllAnnouncement,
        flag: "fetchAllAnnouncementLoading",
        field: "announcements",
        data: [
          { id: 1, title: "ประกาศที่หนึ่ง" },
        ] as unknown as AnnouncementDetailResp[],
      },
      {
        thunk: fetchCourseClasswork,
        flag: "fetchAllClassworkLoading",
        field: "allClasswork",
        data: classwork,
      },
      {
        thunk: fetchStudentActivityGroup,
        flag: "fetchStudentActivityGroupLoading",
        field: "studentGroup",
        data: group,
      },
      {
        thunk: fetchStudentActivityGroupInSec,
        flag: "fetchStudentActivityGroupInSecLoading",
        field: "studentGroupInSec",
        data: [group],
      },
      {
        thunk: fetchStudentWithoutGroup,
        flag: "fetchStudentWithoutGroupLoading",
        field: "studentList",
        data: [
          { student_id: "65000002", full_name_th: "สอง ระบบดี" },
        ] satisfies StudentWithoutGroup[],
      },
      // The learning-activity dialogs are a second copy of the three above,
      // writing into the very same fields — so a page that opened both would
      // read one dialog's members in the other. Pinned as it stands.
      {
        thunk: fetchStudentLearningActivityGroup,
        flag: "fetchStudentLearningActivityGroupLoading",
        field: "studentGroup",
        data: group,
      },
      {
        thunk: fetchStudentLearningActivityGroupInSec,
        flag: "fetchStudentLearningActivityGroupInSecLoading",
        field: "studentGroupInSec",
        data: [group],
      },
      {
        thunk: fetchStudentLearningActivityWithoutGroup,
        flag: "fetchStudentLearningActivityWithoutGroupLoading",
        field: "studentList",
        data: [
          { student_id: "65000003", full_name_th: "สาม ระบบดี" },
        ] satisfies StudentWithoutGroup[],
      },
    ]);
  });

  describe("fetchStudentCourseList", () => {
    it("raises the loading flag while the list is being fetched", () => {
      expect(reducer(initialState, started(fetchStudentCourseList))).toEqual({
        ...initialState,
        fetchStudentCourseListLoading: true,
      });
    });

    it("marks the list as fetched, even when it came back empty", () => {
      // `isFetchStudentCourseList` is how the page tells "no courses this
      // term" from "not asked yet" — without it an enrolment-free student
      // would sit on a spinner.
      const fulfilled = reducer(
        reducer(initialState, started(fetchStudentCourseList)),
        responded(fetchStudentCourseList, []),
      );

      expect(fulfilled).toEqual({
        ...initialState,
        courseList: [],
        isFetchStudentCourseList: true,
      });
    });

    it("stores the courses it was given", () => {
      const fulfilled = reducer(
        initialState,
        responded(fetchStudentCourseList, [course]),
      );

      expect(fulfilled.courseList).toEqual([course]);
    });

    it("leaves the list unmarked when the request failed", () => {
      // A failure is not an answer: the page has to keep showing that it does
      // not know yet, rather than "you take no courses".
      const rejected = reducer(
        reducer(initialState, started(fetchStudentCourseList)),
        failed(fetchStudentCourseList, "โหลดรายวิชาไม่สำเร็จ"),
      );

      expect(rejected).toEqual({
        ...initialState,
        error: "โหลดรายวิชาไม่สำเร็จ",
      });
      expect(rejected.isFetchStudentCourseList).toBe(false);
    });
  });

  describe("fetchStudentActivityDetail", () => {
    it("clears the previous piece of work before the next one arrives", () => {
      // Without this the detail page would show the last activity's rubric
      // while the next one loads.
      const loaded = reducer(
        initialState,
        responded(fetchStudentActivityDetail, activityDetail),
      );

      const pending = reducer(loaded, started(fetchStudentActivityDetail));

      expect(pending.classworkDetail).toBeNull();
      expect(pending.fetchActivityDetailLoading).toBe(true);
    });

    it("keeps both the response and the mapped view of it", () => {
      // `selectedClasswork` is the response as it arrived — the grading panel
      // reads the rubric scores off it — and `classworkDetail` is the shape
      // the page shares with learning activities.
      const fulfilled = reducer(
        reducer(initialState, started(fetchStudentActivityDetail)),
        responded(fetchStudentActivityDetail, activityDetail),
      );

      expect(fulfilled).toEqual({
        ...initialState,
        selectedClasswork: activityDetail,
        classworkDetail: mapActivityDetail(activityDetail),
      });
    });

    it("maps an activity into the page's own shape", () => {
      const fulfilled = reducer(
        initialState,
        responded(fetchStudentActivityDetail, activityDetail),
      );

      expect(fulfilled.classworkDetail).toEqual({
        id: 501,
        name: "งานที่หนึ่ง",
        type: "INDIVIDUAL",
        score: 20,
        student_score: 18,
        deadline_date: activityDetail.deadline_date,
        detail: null,
        attachments: null,
        rubrics: [],
        expected_level: 3,
        status: "SUBMITTED",
        category: "activity",
        student_id: "65000001",
        section_id: 10,
        activity_id: 42,
        submitted_files: { file: [], url: [] },
        submitted_at: activityDetail.submitted_at,
      });
    });

    it("clears the detail on failure rather than leaving a stale one", () => {
      const loaded = reducer(
        initialState,
        responded(fetchStudentActivityDetail, activityDetail),
      );

      const rejected = reducer(loaded, failed(fetchStudentActivityDetail));

      expect(rejected.classworkDetail).toBeNull();
      expect(rejected.error).not.toBeNull();
    });

    it("leaves the raw response behind when the next request fails", () => {
      // Pinned, not endorsed. Only `classworkDetail` is cleared — the response
      // the grading panel reads stays pointing at the previous activity.
      const loaded = reducer(
        initialState,
        responded(fetchStudentActivityDetail, activityDetail),
      );

      const rejected = reducer(loaded, failed(fetchStudentActivityDetail));

      expect(rejected.selectedClasswork).toEqual(activityDetail);
    });
  });

  describe("fetchLearningActivityDetail", () => {
    it("clears the previous piece of work before the next one arrives", () => {
      const loaded = reducer(
        initialState,
        responded(fetchLearningActivityDetail, learningActivityDetail),
      );

      const pending = reducer(loaded, started(fetchLearningActivityDetail));

      expect(pending.classworkDetail).toBeNull();
      expect(pending.fetchLearningActivityDetailLoading).toBe(true);
    });

    it("maps a learning activity into the same shape as an activity", () => {
      // The differences are the ones a learning activity does not have: it
      // carries no score and no rubric, and it names itself under its own key.
      const fulfilled = reducer(
        initialState,
        responded(fetchLearningActivityDetail, learningActivityDetail),
      );

      expect(fulfilled.classworkDetail).toEqual({
        id: 601,
        name: "กิจกรรมที่หนึ่ง",
        type: "GROUP",
        score: null,
        student_score: null,
        deadline_date: learningActivityDetail.deadline_date,
        detail: null,
        attachments: null,
        rubrics: null,
        expected_level: null,
        status: "NOT_SUBMITTED",
        category: "learning_activity",
        student_id: "65000001",
        section_id: 10,
        activity_id: 77,
        submitted_files: { file: [], url: [] },
        submitted_at: learningActivityDetail.submitted_at,
      });
    });

    it("does not touch the activity response the other endpoint left", () => {
      const withActivity = reducer(
        initialState,
        responded(fetchStudentActivityDetail, activityDetail),
      );

      const fulfilled = reducer(
        withActivity,
        responded(fetchLearningActivityDetail, learningActivityDetail),
      );

      expect(fulfilled.selectedClasswork).toEqual(activityDetail);
      expect(fulfilled.classworkDetail).toEqual(
        mapLearningActivityDetail(learningActivityDetail),
      );
    });

    it("clears the detail on failure", () => {
      const loaded = reducer(
        initialState,
        responded(fetchLearningActivityDetail, learningActivityDetail),
      );

      expect(
        reducer(loaded, failed(fetchLearningActivityDetail)).classworkDetail,
      ).toBeNull();
    });
  });

  describe("postSubmitActivity", () => {
    it("raises the loading flag without clearing the page", () => {
      // Unlike a fetch, a submit leaves `classworkDetail` where it is: the
      // student is looking at the work they just handed in.
      const loaded = reducer(
        initialState,
        responded(fetchStudentActivityDetail, activityDetail),
      );

      const pending = reducer(loaded, started(postSubmitActivity));

      expect(pending.postSubmitActivityLoading).toBe(true);
      expect(pending.classworkDetail).toEqual(
        mapActivityDetail(activityDetail),
      );
    });

    it("replaces the page with the submission the API returned", () => {
      const submitted = {
        ...activityDetail,
        status: "SUBMITTED",
        submitted_files: {
          file: [{ attachment_id: 9, title: "งาน.pdf" }],
          url: [],
        },
      } as unknown as StudentActivityDetailResp;

      const fulfilled = reducer(
        reducer(initialState, started(postSubmitActivity)),
        responded(postSubmitActivity, submitted),
      );

      expect(fulfilled.classworkDetail).toEqual(mapActivityDetail(submitted));
    });

    it("keeps the page as it was when the submit failed", () => {
      const loaded = reducer(
        initialState,
        responded(fetchStudentActivityDetail, activityDetail),
      );

      const rejected = reducer(
        reducer(loaded, started(postSubmitActivity)),
        failed(postSubmitActivity, "ส่งงานไม่สำเร็จ"),
      );

      expect(rejected.error).toBe("ส่งงานไม่สำเร็จ");
      expect(rejected.classworkDetail).toEqual(
        mapActivityDetail(activityDetail),
      );
    });
  });

  describe("postSubmitLearningActivity", () => {
    it("raises the loading flag without clearing the page", () => {
      const loaded = reducer(
        initialState,
        responded(fetchLearningActivityDetail, learningActivityDetail),
      );

      const pending = reducer(loaded, started(postSubmitLearningActivity));

      expect(pending.postSubmitLearningActivityLoading).toBe(true);
      expect(pending.classworkDetail).toEqual(
        mapLearningActivityDetail(learningActivityDetail),
      );
    });

    it("replaces the page with the submission the API returned", () => {
      const submitted = {
        ...learningActivityDetail,
        status: "SUBMITTED",
      } as unknown as StudentLearningActivityDetailResp;

      const fulfilled = reducer(
        reducer(initialState, started(postSubmitLearningActivity)),
        responded(postSubmitLearningActivity, submitted),
      );

      expect(fulfilled.classworkDetail).toEqual(
        mapLearningActivityDetail(submitted),
      );
    });

    it("records why the submit failed", () => {
      const rejected = reducer(
        initialState,
        failed(postSubmitLearningActivity, "ส่งกิจกรรมไม่สำเร็จ"),
      );

      expect(rejected.error).toBe("ส่งกิจกรรมไม่สำเร็จ");
    });
  });

  describe("setSelectedCourse", () => {
    it("takes a course the list already has, without a request", () => {
      const next = reducer(
        initialState,
        studentCourseSliceAction.setSelectedCourse(course),
      );

      expect(next.selectedCourse).toEqual(course);
    });

    it("takes a null, which is how leaving a course clears the header", () => {
      const opened = reducer(
        initialState,
        studentCourseSliceAction.setSelectedCourse(course),
      );

      expect(
        reducer(opened, studentCourseSliceAction.setSelectedCourse(null))
          .selectedCourse,
      ).toBeNull();
    });
  });
});
