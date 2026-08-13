import { describe, expect, it } from "vitest";
import { homeSlice, homeSliceAction } from "./home-slice";
import {
  fetchAllClasswork,
  fetchPortfolioPersonal,
  fetchStudentDetail,
} from "./home-action";
import type { AllClassworkDetailResp, StudentDetail } from "../types/home-type";
import type { PortfolioPersonalResp } from "../../../../types/portfolio-personal-type.type";
import {
  failed,
  initialStateOf,
  responded,
  started,
} from "../../../../test/slice-cases";

/**
 * The student's home page, and the shell around it.
 *
 * Two jobs in one slice: which menu the reader has open, and the three
 * requests the page shows — the classwork buckets, who the student is, and the
 * portfolio contact block. `studentId` sits in the middle of both, because
 * every other page reads it from here rather than fetching the session again.
 */

const reducer = homeSlice.reducer;
const initialState = initialStateOf(reducer);

const classwork: AllClassworkDetailResp = {
  late: [],
  this_week: [],
  upcoming: [],
  submitted: [],
};

const student: StudentDetail = {
  user_id: "9f1c0d3e",
  student_id: "65000001",
  full_name_th: "นายทดสอบ ระบบดี",
  first_name_th: "ทดสอบ",
  last_name_th: "ระบบดี",
  title_th: "นาย",
  email: "student@example.test",
  phone: null,
  department_name: "วิศวกรรมคอมพิวเตอร์",
  program_name: "วิศวกรรมศาสตรบัณฑิต",
};

const personal: PortfolioPersonalResp = {
  user_id: "9f1c0d3e",
  nationality: "ไทย",
  email: "student@example.test",
};

describe("homeSlice", () => {
  it("starts on the classwork tab with four empty buckets", () => {
    // Not null: the page maps over all four lists on its first render, before
    // any response has arrived.
    expect(initialState.allClasswork).toEqual(classwork);
    expect(initialState.selectedMenu).toBe("HOME");
    expect(initialState.selectedSubMenu).toBe("CLASSWORK");
    expect(initialState.studentId).toBe("");
  });

  describe("fetchAllClasswork", () => {
    it("raises the loading flag while the buckets are being fetched", () => {
      expect(reducer(initialState, started(fetchAllClasswork))).toEqual({
        ...initialState,
        fetchAllClassworkLoading: true,
      });
    });

    it("replaces all four buckets with what came back", () => {
      const late: AllClassworkDetailResp = {
        ...classwork,
        late: [
          { id: 7, name: "งานที่หนึ่ง" },
        ] as AllClassworkDetailResp["late"],
      };

      const next = reducer(
        reducer(initialState, started(fetchAllClasswork)),
        responded(fetchAllClasswork, late),
      );

      expect(next).toEqual({ ...initialState, allClasswork: late });
    });

    it("records the failure and leaves the buckets alone", () => {
      const next = reducer(
        initialState,
        failed(fetchAllClasswork, "โหลดงานไม่สำเร็จ"),
      );

      expect(next.error).toBe("โหลดงานไม่สำเร็จ");
      expect(next.allClasswork).toEqual(classwork);
    });
  });

  describe("fetchStudentDetail", () => {
    it("raises the loading flag while the student is being fetched", () => {
      expect(reducer(initialState, started(fetchStudentDetail))).toEqual({
        ...initialState,
        fetchStudentDetailLoading: true,
      });
    });

    it("lifts the student id out of the response as well as the detail", () => {
      // This is where `studentId` comes from. Every page that sends
      // `student_id` as a query parameter is sending the value this line put
      // in the store.
      const next = reducer(
        reducer(initialState, started(fetchStudentDetail)),
        responded(fetchStudentDetail, student),
      );

      expect(next).toEqual({
        ...initialState,
        studentDetail: student,
        studentId: "65000001",
      });
    });

    it("records the failure and leaves the previous student in place", () => {
      const loaded = reducer(
        initialState,
        responded(fetchStudentDetail, student),
      );

      const next = reducer(loaded, failed(fetchStudentDetail));

      expect(next.studentId).toBe("65000001");
      expect(next.error).not.toBeNull();
    });
  });

  describe("fetchPortfolioPersonal", () => {
    it("raises the loading flag while the contact block is being fetched", () => {
      expect(reducer(initialState, started(fetchPortfolioPersonal))).toEqual({
        ...initialState,
        fetchPortfolioPersonalLoading: true,
      });
    });

    it("stores the contact block", () => {
      const next = reducer(
        reducer(initialState, started(fetchPortfolioPersonal)),
        responded(fetchPortfolioPersonal, personal),
      );

      expect(next).toEqual({ ...initialState, portfolioPersonal: personal });
    });

    it("stores a null for a student who has not filled one in", () => {
      // The API answers 200 with no body for a portfolio that does not exist
      // yet, and the page reads the null as "show the empty form".
      const next = reducer(
        initialState,
        responded(fetchPortfolioPersonal, null),
      );

      expect(next.portfolioPersonal).toBeNull();
    });

    it("records the failure", () => {
      const next = reducer(
        initialState,
        failed(fetchPortfolioPersonal, "โหลดข้อมูลส่วนตัวไม่สำเร็จ"),
      );

      expect(next.error).toBe("โหลดข้อมูลส่วนตัวไม่สำเร็จ");
    });
  });

  describe("the menu setters", () => {
    it("remembers which menu and submenu are open", () => {
      const opened = reducer(
        reducer(initialState, homeSliceAction.setSelectedMenu("PORTFOLIO")),
        homeSliceAction.setSelectedSubMenu("EDUCATION"),
      );

      expect(opened.selectedMenu).toBe("PORTFOLIO");
      expect(opened.selectedSubMenu).toBe("EDUCATION");
    });

    it("remembers whether the submenu is expanded", () => {
      const shown = reducer(
        initialState,
        homeSliceAction.setIsShowSubMenu(true),
      );

      expect(shown.isShowSubmenu).toBe(true);
      expect(
        reducer(shown, homeSliceAction.setIsShowSubMenu(false)).isShowSubmenu,
      ).toBe(false);
    });

    it("remembers which course was opened", () => {
      expect(
        reducer(initialState, homeSliceAction.setSelectedCourseId("12"))
          .selectedCourseId,
      ).toBe("12");
    });
  });

  describe("setStudentId", () => {
    it("lets the caller set the id without fetching the student", () => {
      // The e-portfolio is reachable by a public link, where there is no
      // session to fetch a student from — the id comes off the route instead.
      const next = reducer(
        initialState,
        homeSliceAction.setStudentId("65000002"),
      );

      expect(next.studentId).toBe("65000002");
      expect(next.studentDetail).toBeNull();
    });
  });

  describe("setPortfolioPersonal", () => {
    it("takes an edited contact block without a refetch", () => {
      const next = reducer(
        initialState,
        homeSliceAction.setPortfolioPersonal(personal),
      );

      expect(next.portfolioPersonal).toEqual(personal);
    });

    it("takes a null, which is how the form clears it", () => {
      const filled = reducer(
        initialState,
        homeSliceAction.setPortfolioPersonal(personal),
      );

      expect(
        reducer(filled, homeSliceAction.setPortfolioPersonal(null))
          .portfolioPersonal,
      ).toBeNull();
    });
  });
});
