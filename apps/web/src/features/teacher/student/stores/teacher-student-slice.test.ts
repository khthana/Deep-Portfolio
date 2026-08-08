import { describe } from "vitest";
import { teacherStudentSlice } from "./teacher-student-slice";
import { fetchAllStudentInSection } from "./teacher-student-action";
import { itOnlyTracksLoading } from "../../../../test/slice-cases";

/**
 * The class list of a section.
 *
 * One request; the table it fills belongs to the page.
 */

describe("teacherStudentSlice", () => {
  itOnlyTracksLoading(teacherStudentSlice.reducer, [
    {
      thunk: fetchAllStudentInSection,
      flag: "fetchAllStudentInSectionLoading",
    },
  ]);
});
