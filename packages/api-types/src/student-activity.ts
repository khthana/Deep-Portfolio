import type { ActivityDetailResp } from "./activity";
import type { AttachmentDetailResp } from "./attachment";
import type { SubmissionGroup } from "./group";
import type { StudentFullNameTh, StudentNameBrief } from "./student";

/**
 * What a student handed in on a graded activity, from both directions: the one
 * submission a student and their teacher look at, and the roster of every
 * submission on one activity.
 */

/**
 * The four values `student_activity.status` holds, which is what every
 * endpoint that reports a submission sends.
 *
 * The `DB` suffix is not decoration: apps/api also has a `StudentActivityStatus`
 * of its own with `LATE` in place of `GRADING`. That one stays in apps/api, and
 * this pass is what settled it — `LATE` is `getDisplayStatus()` reading a
 * deadline against the clock, it is written nowhere and stored nowhere, and
 * none of the endpoints here sends it. It reaches a caller only through the
 * student's classwork list, whose own pass has not come.
 */
export type StudentActivityStatusDB =
  "NOT_SUBMITTED" | "SUBMITTED" | "GRADING" | "GRADED";

/** What every row of the teacher's roster says, whoever it is about. */
type ActivitySubmissionBase = {
  /** `student_activity.id` — the submission, not the activity. */
  id: number;
  status: StudentActivityStatusDB;
  submitted_at: string | null;
  /**
   * `Decimal(5,2)` in the database, a number by the time it leaves the service
   * (#33). Zero survives as zero: the expression that reads it looks like a
   * falsy-zero bug and is not one, because Prisma hands back an object.
   */
  score: number | null;
  feedback: string | null;
  remark: string | null;
  is_bookmark: boolean;
};

/**
 * One row of the teacher's marking roster.
 *
 * A union rather than one row with both halves optional (ADR-0030), because
 * `submission_type` already tells them apart and no row has ever carried both.
 * It describes the **row**, not the activity: a student who is in no group at
 * all on a group activity comes back as an `INDIVIDUAL` row, which is the one
 * thing that makes them visible to a teacher (#56, #64).
 */
export type ActivitySubmission =
  ActivityIndividualSubmission | ActivityGroupSubmission;

export type ActivityIndividualSubmission = ActivitySubmissionBase & {
  submission_type: "INDIVIDUAL";
  student: StudentNameBrief;
};

export type ActivityGroupSubmission = ActivitySubmissionBase & {
  submission_type: "GROUP";
  group: SubmissionGroup;
};

/** `GET /activity/submitted/list` — the roster for one activity. */
export type ActivitySubmissionListResp = {
  activity_id: number;
  activity_name: string;
  deadline_date: string | null;
  /** `activities.score_number` — what the work is out of, not what anyone got. */
  score: number | null;
  submissions: ActivitySubmission[];
};

/**
 * `GET /activity/student/detail` — one submission, with the activity it is
 * against.
 *
 * The service spreads the activity whole and then the submission over it, so
 * where the two name the same key the submission wins: `id` here is the
 * `student_activity` row, and `activity_id` is the same number the activity
 * half already carried.
 */
export type StudentActivityDetailResp = ActivityDetailResp & {
  id: number;
  student_id: string;
  status: StudentActivityStatusDB;
  submitted_at: string | null;
  graded_at: string | null;
  feedback: string | null;
  remark: string | null;
  is_bookmark: boolean;
  /**
   * The same mark under two names. `student_score` is written first and `score`
   * arrives with the spread; both are on the wire, so both are declared, and
   * dropping either is a change a caller can see.
   */
  score: number | null;
  student_score: number | null;
  student: StudentFullNameTh;
  student_activity_rubric_score: StudentActivityRubricScore[];
  /** What the student uploaded, as opposed to `attachments`, which is what the
   *  teacher handed out. Never null — the service answers two lists whatever it
   *  finds. */
  submitted_files: AttachmentDetailResp;
};

/**
 * `POST /student-activity/grade` — what marking answers, for one student or for
 * a whole group.
 *
 * `total_score` is the mark the levels add up to, not the row's stored score;
 * on group work every accepted member's row gets it, and this names the one the
 * request pointed at.
 */
export type GradeStudentActivityResp = {
  student_activity_id: number;
  total_score: number;
};

/** One criterion's share of the mark. */
export type StudentActivityRubricScore = {
  rubric_activity_mapping_id: number;
  rubric_level_id: number;
  /** `Decimal(5,2)`, a number by the time it leaves the service (#33). */
  calculated_score: number;
};
