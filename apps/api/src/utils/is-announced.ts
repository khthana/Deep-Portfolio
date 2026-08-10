/**
 * Has this piece of work been released to the students yet?
 *
 * The gate on every student-facing read — the calendar, the classwork lists,
 * the lesson plan and the evaluation list all ask it before showing a row.
 *
 * A missing date means announced, not withheld (ADR-0005). The column is
 * optional in the schema and in both create/update payloads, so reading `null`
 * as "not announced yet" left work a teacher never dated invisible to the
 * student for good, however long ago it was marked, with nothing on either
 * screen to say why.
 *
 * Called `checkIsOverAnnouncementDate` until #29, which is what it did rather
 * than what it answers — and after the decision above, nothing is "over" a
 * date that was never set, though the answer is still yes.
 */
export const isAnnounced = (announcement: Date | null) => {
  if (!announcement) return true;

  const now = new Date();
  const announcementDate = new Date(announcement);

  return now.getTime() >= announcementDate.getTime();
};
