import { describe, expect, it } from "vitest";
import { teacherGradebookSlice } from "./teacher-gradebook-slice";
import {
  fetchGradebookPerActivity,
  fetchGradebookPerStudent,
} from "./teacher-gradebook-action";
import {
  initialStateOf,
  itOnlyTracksLoading,
} from "../../../../test/slice-cases";

/**
 * The gradebook, read either way round — one row per student, or one row per
 * activity.
 *
 * Both grids are large and are held by the page rather than the store, so the
 * slice only reports progress.
 */

const reducer = teacherGradebookSlice.reducer;

describe("teacherGradebookSlice", () => {
  itOnlyTracksLoading(reducer, [
    {
      thunk: fetchGradebookPerStudent,
      flag: "fetchGradebookPerStudentLoading",
    },
    {
      thunk: fetchGradebookPerActivity,
      flag: "fetchGradebookPerActivityLoading",
    },
  ]);

  it("declares a flag for a request this slice does not have", () => {
    // Pinned, not endorsed. `fetchAllStudentInSectionLoading` is copied from
    // the teacher-student slice, where the request it names actually lives.
    // Nothing here ever raises it.
    const initialState = initialStateOf(reducer);

    expect(initialState.fetchAllStudentInSectionLoading).toBe(false);
  });
});
