import type { AttachmentDetailResp } from "./attachment";
import type { SubmissionGroup } from "./group";
import type { LearningActivityDetailResp } from "./learning-activity";
import type { StudentActivityStatusDB } from "./student-activity";
import type { StudentFullNameTh, StudentNameBrief } from "./student";

/**
 * The classroom-work twin of student-activity.ts, shape for shape, minus every
 * mention of a score: `student_learning_activity` has no score column, no
 * rubric and no category, because classroom work is not marked out of anything.
 * A teacher records that it was done and writes a comment.
 *
 * `status` is the same column type on both tables, so it is imported rather
 * than spelled again — unlike `submission_type`, which each half spells for
 * itself (ADR-0033 §2).
 */

/** What every row of the teacher's roster says, whoever it is about. */
type LearningActivitySubmissionBase = {
  /** `student_learning_activity.id` — the submission, not the activity. */
  id: number;
  status: StudentActivityStatusDB;
  submitted_at: string | null;
  feedback: string | null;
  remark: string | null;
  is_bookmark: boolean;
};

/**
 * One row of the teacher's marking roster. A union on `submission_type`
 * (ADR-0030), describing the row rather than the activity — see
 * `ActivitySubmission`, which this mirrors.
 */
export type LearningActivitySubmission =
  LearningActivityIndividualSubmission | LearningActivityGroupSubmission;

export type LearningActivityIndividualSubmission =
  LearningActivitySubmissionBase & {
    submission_type: "INDIVIDUAL";
    student: StudentNameBrief;
  };

export type LearningActivityGroupSubmission = LearningActivitySubmissionBase & {
  submission_type: "GROUP";
  group: SubmissionGroup;
};

/**
 * `GET /learning-activity/submitted/list` — the roster for one learning
 * activity. No `score` beside the name, unlike the graded half: there is
 * nothing for the work to be out of.
 */
export type LearningActivitySubmissionListResp = {
  learning_activity_id: number;
  learning_activity_name: string;
  deadline_date: string | null;
  submissions: LearningActivitySubmission[];
};

/**
 * `GET /learning-activity/student/detail` — one submission, with the activity
 * it is against. The submission is spread over the activity, so `id` here is
 * the `student_learning_activity` row.
 */
export type StudentLearningActivityDetailResp = LearningActivityDetailResp & {
  id: number;
  student_id: string;
  status: StudentActivityStatusDB;
  submitted_at: string | null;
  graded_at: string | null;
  feedback: string | null;
  remark: string | null;
  is_bookmark: boolean;
  student: StudentFullNameTh;
  /** What the student uploaded, as opposed to `attachments`, which is what the
   *  teacher handed out. */
  submitted_files: AttachmentDetailResp;
};
