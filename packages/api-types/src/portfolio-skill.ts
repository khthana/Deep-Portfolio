/**
 * The skills a student claims, and the submitted work each is evidenced by.
 *
 * The largest of the e-Portfolio's sections: nine endpoints where the others
 * have five, because a skill and the work it points at are read from both
 * directions. `portfolio_skill` holds the name; every other field lives on
 * `portfolio_skill_activity_mapping`, one row per (skill, submission) pair.
 *
 * - `GET /portfolio-skill` and `GET /portfolio-skill/:id` answer
 *   `PortfolioSkillDetail` — a skill with its mappings. So do `POST` and `PUT`.
 * - `GET /portfolio-skill/works` answers `PortfolioWorkDetail[]` — the same rows
 *   grouped the other way round, by submission rather than by skill.
 * - `GET /portfolio-skill/mapping/:id` answers `SkillMappingDetail` — one
 *   mapping with the skill it hangs off nested inside it.
 * - `DELETE /portfolio-skill/:id`, `POST /portfolio-skill/assign-work` and
 *   `DELETE /portfolio-skill/mapping/:id` answer `data: null` and have no type
 *   here. The delete builds a row for its caller inside the service; the
 *   controller does not pass it on.
 *
 * The four `isShow*` flags are camelCase because the columns are. Two tables in
 * the schema name their columns that way and both belong to the e-Portfolio —
 * this one and `portfolio` itself, whose nine `isShow*` flags the aggregate read
 * answers. The package spells what the wire spells (ADR-0037 for enum values,
 * ADR-0042 §3 for field names), which here means not tidying them.
 */

/**
 * One (skill, submission) pair — a row of `portfolio_skill_activity_mapping`.
 *
 * The four flags are nullable columns defaulting to false. This is the shape as
 * it appears inside a skill, handed over as Prisma read it; `/works` coalesces
 * them and `PortfolioWorkDetail` says so.
 */
export type SkillMapping = {
  id: number;
  skill_id: number;
  student_activity_id: number;
  repository: string | null;
  role_and_resp: string | null;
  init_expect: string | null;
  reflection: string | null;
  isShowRepo: boolean | null;
  isShowRole: boolean | null;
  isShowInit: boolean | null;
  isShowReflec: boolean | null;
};

/**
 * `GET /portfolio-skill/mapping/:id` — one mapping and the skill it belongs to.
 *
 * The nested skill is how ownership is decided: a mapping has no `user_id` of
 * its own, so the guard reads it through the parent. That is also why the
 * parent's `user_id` is on the wire — the whole row is included, not a chosen
 * few columns.
 *
 * Neither side had a name for this shape before #68.
 */
export type SkillMappingDetail = SkillMapping & {
  portfolio_skill: {
    id: number;
    name: string | null;
    user_id: string;
  };
};

/**
 * A skill with the work behind it — the answer of four of the nine endpoints.
 *
 * `mappings` is not optional. Both reads include the join, the create and the
 * update read the skill back with it, and a skill with no work behind it
 * carries an empty list rather than no key. Both sides had written `mappings?`
 * (#68).
 */
export type PortfolioSkillDetail = {
  id: number;
  user_id: string;
  name: string | null;
  mappings: SkillMapping[];
};

/**
 * `GET /portfolio-skill/works` — the same mappings grouped by submission.
 *
 * One entry per `student_activity_id`, with every skill that names it. The four
 * long-form answers and their flags are read off the first mapping of the
 * group: they are columns of the mapping rather than of the submission, so two
 * skills pointing at one submission with different text would show only the
 * first, which is a question for whoever owns the screen rather than for this
 * type.
 *
 * The flags are plain booleans here where `SkillMapping` has them nullable,
 * because the service coalesces each to `false` — the column's own default —
 * before answering.
 *
 * `feedback` comes from `student_activity`, not from the mapping: it is what
 * the teacher wrote on the submission being cited.
 */
export type PortfolioWorkDetail = {
  student_activity_id: number;
  mapping_ids: number[];
  skills: { id: number; name: string | null }[];
  repository: string | null;
  role_and_resp: string | null;
  init_expect: string | null;
  reflection: string | null;
  isShowRepo: boolean;
  isShowRole: boolean;
  isShowInit: boolean;
  isShowReflec: boolean;
  feedback: string | null;
};
