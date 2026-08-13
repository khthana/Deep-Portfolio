import { describe, expect, it } from "vitest";
import { teacherHomeSlice, teacherHomeSliceAction } from "./teacher-home-slice";
import { fetchAllCourse, fetchCourseById } from "./teacher-home-action";
import type { CourseDetailBrief } from "../types/home-type";
import type { CourseDetail } from "../../../../types/course-type.type";
import {
  failed,
  initialStateOf,
  itStoresTheResponse,
  responded,
  started,
} from "../../../../test/slice-cases";

/**
 * The teacher's home page: the courses they teach, split into the term they
 * are teaching now and the terms they have finished.
 *
 * This slice is also where the teacher's own id lives, which is why the
 * course-list response carries it — every other teacher page sends
 * `teacher_id` as a query parameter and reads it from here.
 */

const reducer = teacherHomeSlice.reducer;
const initialState = initialStateOf(reducer);

const active = [
  { section_id: 10, subject_name_en: "Software Engineering" },
] as unknown as CourseDetailBrief[];

const archived = [
  { section_id: 4, subject_name_en: "Programming Fundamentals" },
] as unknown as CourseDetailBrief[];

const course = {
  section_id: 10,
  subject_name_en: "Software Engineering",
} as unknown as CourseDetail;

const courseList = {
  active_courses: active,
  archived_courses: archived,
  teacher_id: "9f1c0d3e",
};

describe("teacherHomeSlice", () => {
  itStoresTheResponse(reducer, [
    {
      thunk: fetchCourseById,
      flag: "fetchCourseByIdLoading",
      field: "selectedCourse",
      data: course,
    },
  ]);

  describe("fetchAllCourse", () => {
    it("raises the loading flag while the courses are being fetched", () => {
      expect(reducer(initialState, started(fetchAllCourse))).toEqual({
        ...initialState,
        fetchAllCourseLoading: true,
      });
    });

    it("splits the response into the two lists the page draws", () => {
      const fulfilled = reducer(
        reducer(initialState, started(fetchAllCourse)),
        responded(fetchAllCourse, courseList),
      );

      expect(fulfilled).toEqual({
        ...initialState,
        activeCourse: active,
        archivedCourse: archived,
        user_id: "9f1c0d3e",
      });
    });

    it("learns who the teacher is from the course list", () => {
      // Nothing else writes `user_id`, so this response is the only thing that
      // ever makes it true. It starts empty — the hand-over shipped a real
      // teacher's id here as a stand-in, removed with this ticket.
      expect(initialState.user_id).toBe("");

      const fulfilled = reducer(
        initialState,
        responded(fetchAllCourse, courseList),
      );

      expect(fulfilled.user_id).toBe("9f1c0d3e");
    });

    it("records the failure and leaves both lists as they were", () => {
      const loaded = reducer(
        initialState,
        responded(fetchAllCourse, courseList),
      );

      const rejected = reducer(
        loaded,
        failed(fetchAllCourse, "โหลดรายวิชาไม่สำเร็จ"),
      );

      expect(rejected.error).toBe("โหลดรายวิชาไม่สำเร็จ");
      expect(rejected.activeCourse).toEqual(active);
      expect(rejected.archivedCourse).toEqual(archived);
    });
  });

  describe("setSelectedCourse", () => {
    it("takes a course the list already has, without a request", () => {
      expect(
        reducer(initialState, teacherHomeSliceAction.setSelectedCourse(course))
          .selectedCourse,
      ).toEqual(course);
    });

    it("takes a null, which is how leaving a course clears the header", () => {
      const opened = reducer(
        initialState,
        teacherHomeSliceAction.setSelectedCourse(course),
      );

      expect(
        reducer(opened, teacherHomeSliceAction.setSelectedCourse(null))
          .selectedCourse,
      ).toBeNull();
    });
  });

  describe("setActiveMenu", () => {
    it("remembers which sidebar entry is highlighted", () => {
      const next = reducer(
        initialState,
        teacherHomeSliceAction.setActiveMenu("GRADEBOOK"),
      );

      expect(next.activeMenu).toBe("GRADEBOOK");
      expect(
        reducer(next, teacherHomeSliceAction.setActiveMenu(null)).activeMenu,
      ).toBeNull();
    });

    it("does not touch the submenu flags, which nothing sets", () => {
      // Pinned, not endorsed. `isShowInstructionSubMenu`,
      // `isShowAssessmentSubMenu` and `selectedSubMenu` are declared here but
      // no reducer writes them — the sidebar works out what is expanded from
      // the route instead.
      const next = reducer(
        initialState,
        teacherHomeSliceAction.setActiveMenu("GRADEBOOK"),
      );

      expect(next.isShowInstructionSubMenu).toBe(false);
      expect(next.isShowAssessmentSubMenu).toBe(false);
      expect(next.selectedSubMenu).toBeNull();
    });
  });
});
