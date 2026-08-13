import type { StudentActivityStatusDB } from "../models/student-activity.model";

/**
 * As much of a submission as the order needs. Both roster endpoints have their
 * own `Submission` type — the graded half carries a score, the learning-activity
 * half does not — and both satisfy this.
 */
export interface OrderableSubmission {
  status: StudentActivityStatusDB;
  submitted_at: Date | null;
}

/**
 * The order a teacher's marking table reads in: work that was handed in, newest
 * first, and everything that was not after it.
 *
 * Both endpoints list every student and every group the work was set for since
 * #56, not only the ones who handed something in, so they need an answer to a
 * question they never had to ask before — where the empty rows go. They go last:
 * a teacher opens this screen to mark what is waiting, and that stays at the top
 * where it has always been.
 *
 * The key is the row's own `status`, not whether `submitted_at` is set. They
 * agree in the database — nothing writes one without the other — but the status
 * is what the table shows, so sorting on it is what makes the order match what
 * the reader sees.
 *
 * Rows on the same side of that line and with the same date compare equal, which
 * leaves them where the query put them. Every query feeding this one orders by
 * `id`, so equal is still deterministic.
 */
export function byUnsubmittedLast(
  a: OrderableSubmission,
  b: OrderableSubmission,
): number {
  const aHandedIn = a.status !== "NOT_SUBMITTED";
  const bHandedIn = b.status !== "NOT_SUBMITTED";

  if (aHandedIn !== bHandedIn) {
    return aHandedIn ? -1 : 1;
  }

  return (b.submitted_at?.getTime() ?? 0) - (a.submitted_at?.getTime() ?? 0);
}
