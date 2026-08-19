// GetActivityDetailResp, RubricDetail, RubricLevel and ScoreWeightDetail used
// to be declared here. They moved to @deep-portfolio/api-types (#68) — import
// ActivityDetailResp, RubricDetail, RubricLevel and
// ScoreWeightBrief/ScoreWeightDetail from there. The score category is two
// types now because the two endpoints read it differently: the list selects
// five columns (Brief) and the detail joins the row (Detail). The dates that
// said Date now say string, and both nested shapes gained the bookkeeping
// columns the endpoint had been sending all along; see ADR-0032.

// GetLearningActivityDetailResp used to be declared here. It moved to
// @deep-portfolio/api-types (#68) as LearningActivityDetailResp — the dates
// that said Date now say string, `attachments` is never null, `detail` is
// unknown, and week_no is gone because this endpoint has never sent it. See
// ADR-0033.

/**
 * The people invited into a group who are not in it: `PENDING` if the
 * invitation is still unanswered, `REJECTED` if it was turned down.
 *
 * Both submitted-list endpoints send them in `group.unaccepted_members`, kept
 * apart from `group.members` — which means "who this score lands on" since
 * ADR-0017 — so that a name the teacher is not marking can never be read as one
 * they are (ADR-0023). The two silences ask for different things: an unanswered
 * invitation expires after seven days and may want chasing, a refusal is an
 * answer already.
 */
export type UnacceptedMember = {
  student_id: string;
  first_name_th: string;
  last_name_th: string;
  status: "PENDING" | "REJECTED";
};

// StudentActivityStatusDB used to be declared here. It is the column every
// endpoint that reports a submission sends, so it belongs to both sides now
// — import it from @deep-portfolio/api-types (#68).
