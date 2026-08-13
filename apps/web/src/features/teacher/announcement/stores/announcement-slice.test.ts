import { describe, expect, it } from "vitest";
import {
  teacherAnnouncementSlice,
  teacherAnnouncementSliceAction,
} from "./announcement-slice";
import { fetchAllAnnouncements, postAnnouncement } from "./announcement-action";
import type { AnnouncmentFormType } from "../types/announement-type";
import type { AnnouncementDetailResp } from "../../../../types/course-type.type";
import {
  initialStateOf,
  itOnlyTracksLoading,
  itStoresTheResponse,
} from "../../../../test/slice-cases";

/**
 * Posting an announcement to a section, and listing what has been posted.
 *
 * The one thing here that is not a request is `announcementForm`, which holds
 * the editor's working copy — an announcement is written across several
 * controls and only becomes a request when the teacher presses post.
 */

const reducer = teacherAnnouncementSlice.reducer;
const initialState = initialStateOf(reducer);

const announcements = [
  { id: 1, title: "ประกาศที่หนึ่ง" },
] as unknown as AnnouncementDetailResp[];

const draft = [
  {
    title: "ประกาศที่หนึ่ง",
    detail: { type: "doc", content: [] },
    attachments: [],
  },
] as AnnouncmentFormType[];

describe("teacherAnnouncementSlice", () => {
  itStoresTheResponse(reducer, [
    {
      thunk: fetchAllAnnouncements,
      flag: "fetchAllAnnouncementsLoading",
      field: "announcements",
      data: announcements,
    },
  ]);

  itOnlyTracksLoading(reducer, [
    { thunk: postAnnouncement, flag: "postAnnouncementLoading" },
  ]);

  describe("setAnnouncement", () => {
    it("holds the editor's working copy", () => {
      const next = reducer(
        initialState,
        teacherAnnouncementSliceAction.setAnnouncement(draft),
      );

      expect(next.announcementForm).toEqual(draft);
    });

    it("replaces the draft rather than appending to it", () => {
      const written = reducer(
        initialState,
        teacherAnnouncementSliceAction.setAnnouncement(draft),
      );

      expect(
        reducer(written, teacherAnnouncementSliceAction.setAnnouncement([]))
          .announcementForm,
      ).toEqual([]);
    });

    it("leaves the posted announcements alone", () => {
      // The draft and the list are separate: writing a new announcement does
      // not disturb what the page is already showing.
      const listed = reducer(
        initialState,
        teacherAnnouncementSliceAction.setAnnouncement(draft),
      );

      expect(listed.announcements).toEqual([]);
    });
  });

  describe("the flags nothing ever sets", () => {
    it("keeps postURLLoading and postFileLoading at rest", () => {
      // Pinned, not endorsed. Both are declared and initialised and no reducer
      // touches either — the attachments go up inside the announcement's own
      // multipart body, so the separate upload requests they were written for
      // never came to exist.
      const posted = reducer(
        initialState,
        teacherAnnouncementSliceAction.setAnnouncement(draft),
      );

      expect(posted.postURLLoading).toBe(false);
      expect(posted.postFileLoading).toBe(false);
    });
  });
});
