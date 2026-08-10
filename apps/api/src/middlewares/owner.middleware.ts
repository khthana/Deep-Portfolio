import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import { sessionUserId } from "./auth.middleware";
import { errorResponse } from "../utils/response";

/**
 * Row-level ownership — the second half of the answer `requireRole` cannot
 * give.
 *
 * A role says what kind of user is asking. It does not say whose data this is,
 * and that is the question these middlewares answer. Five rules live here, one
 * per ADR:
 *
 * - `requireSelf` / `requireOwnEntry` — the portfolio group's rule. Every row
 *   carries a user_id, and for all 56 endpoints the acting user is the
 *   session's, never whoever the request says.
 *   See docs/adr/0001-portfolio-access.md and issue #31.
 * - `requireOwnSection` — the teaching rule. A teacher acts on the sections
 *   they teach and no others.
 *   See docs/adr/0002-section-access.md and issue #30.
 * - `requireEnrolledSection` — the other half of the same question, from the
 *   student's side: a student acts on the sections they are enrolled in.
 *   See docs/adr/0003-enrolment-access.md and issue #26.
 * - `requireGroupLeader` — inside a group, the membership is the leader's to
 *   change and nobody else's.
 *   See docs/adr/0004-group-leader.md and issue #27.
 * - `requireSelfLeader` — the same rule one step earlier: a new group is the
 *   caller's own, so they must be the leader of the list they send.
 *   See docs/adr/0007-group-membership.md and issue #37.
 *
 * All of them assume a session middleware ran first: they read the session
 * through `sessionUserId`, which throws rather than answering 401, because a
 * route that reached here without a session is a wiring mistake and not a
 * caller's.
 *
 * The two portfolio ones do not care whether the row exists. A request for
 * something that is not there is a different question with a different answer,
 * and the controller already gives it; folding the two together would turn
 * every 404 in that group into a 403 and hide the difference from the caller.
 * The two section ones and `requireGroupLeader` are the other way round, and
 * `sectionRule` says why. `requireSelfLeader` asks the database nothing at all:
 * everything it compares is in the request.
 */

/**
 * Shown when a signed-in user reaches for somebody else's data. Deliberately the
 * same sentence for "not your list" and "not your row": which one it was is
 * information about what exists, and the caller has no business learning it
 * from a refusal.
 */
export const NOT_OWNER = "คุณไม่มีสิทธิ์เข้าถึงข้อมูลของผู้ใช้อื่น";

/**
 * The request names a user — `?user_id=` or `/:user_id` — and it must be the
 * one who is signed in.
 *
 *     router.get("/", requireUser, validate({ query: portfolioOwnerQuery }),
 *                requireSelf("query"), controller.list);
 *
 * Runs after `validate`, so by the time it reads the field the schema has
 * already refused a request that omits it or malforms it. It compares the raw
 * value rather than the parsed one because `validated` is keyed by schema
 * object, and a middleware that had to be handed the route's schema to do this
 * would be one more thing every route could wire up wrongly.
 *
 * The field is always `user_id` — every route in the group spells it that way,
 * and a parameter for a name nobody varies would be a second way to write the
 * same thing.
 */
export function requireSelf(
  location: "params" | "query",
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    const named = (req[location] as Record<string, unknown> | undefined)
      ?.user_id;

    if (named !== sessionUserId(req)) {
      return errorResponse(res, 403, NOT_OWNER);
    }

    next();
  };
}

/**
 * Shown when a signed-in user reaches for a section they have nothing to do
 * with. Says "กลุ่มเรียน" because that is what the interface calls a section
 * everywhere the user can see one, and it is the same sentence for the teacher
 * who does not teach it and the student who is not in it: which of the two the
 * caller is, is not a fact the refusal should have to reveal.
 */
export const NOT_MY_SECTION = "คุณไม่มีสิทธิ์เข้าถึงข้อมูลของกลุ่มเรียนนี้";

/** Whether this user belongs to this section, in whichever sense the caller's
 *  rule means by "belongs". */
type SectionMembership = (
  sectionId: number,
  userId: string,
) => Promise<boolean>;

/**
 * The shape both section rules share: read `section_id` off the request, ask
 * one question about it, and answer `403` when the answer is no.
 *
 *     router.get("/per-student", requireRole("TEACHER"),
 *                validate({ query: gradebookQuery }),
 *                requireOwnSection("query"), controller.perStudent);
 *
 * Runs after `validate` for the same reason `requireSelf` does: a request whose
 * section_id is missing or malformed is a malformed request, and `400` tells
 * the caller more than `403` would. By the time this runs the field is there
 * and is a number, so the coercion below cannot fail — it is here because the
 * raw value is still a string, and reading the raw value keeps the schema out
 * of the middleware's arguments.
 *
 * A section that nobody has that relationship with, and a section that does not
 * exist at all, both come back as `403` rather than as an empty answer or a
 * `404`. That is deliberate, and it is where these rules part company with the
 * portfolio one above: section ids are small integers, so a caller who could
 * tell "no such section" from "not yours" could walk the range and map the
 * whole institution's teaching and enrolment from the outside.
 */
function sectionRule(belongs: SectionMembership) {
  return (location: "query" | "body") =>
    async (req: Request, res: Response, next: NextFunction) => {
      const session = sessionUserId(req);
      const named = (req[location] as Record<string, unknown> | undefined)
        ?.section_id;
      const sectionId = Number(named);

      try {
        const member =
          Number.isSafeInteger(sectionId) &&
          (await belongs(sectionId, session));

        if (!member) {
          return errorResponse(res, 403, NOT_MY_SECTION);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
}

/**
 * The request names a section and the signed-in teacher must be one of the
 * section's teachers (#30).
 */
export const requireOwnSection = sectionRule(async (sectionId, userId) => {
  const teaches = await prisma.course_sections_teacher.findFirst({
    where: { section_id: sectionId, user_id: userId },
    select: { id: true },
  });

  return teaches !== null;
});

/**
 * The request names a section and the signed-in student must be enrolled in it
 * (#26).
 *
 * The mirror image of `requireOwnSection` over `student_course` instead of
 * `course_sections_teacher`. It exists because a handful of reads are about a
 * section rather than about the caller — the roster of who is still without a
 * group, say — so there is no user_id in the request to compare the session
 * against, and being in the class is the nearest thing to owning the answer.
 */
export const requireEnrolledSection = sectionRule(async (sectionId, userId) => {
  const enrolled = await prisma.student_course.findFirst({
    where: { section_id: sectionId, student_id: userId },
    select: { student_id: true },
  });

  return enrolled !== null;
});

/**
 * Shown when a member of a group reaches for something only its leader may do.
 * Same sentence for a group that does not exist, for the reason
 * `requireGroupLeader` gives.
 *
 * "แก้ไขกลุ่ม" covers disbanding it as well as rewriting the list: both are
 * changes to the group, and telling the two refusals apart would only tell the
 * caller which endpoint they hit, which they already know.
 */
export const NOT_GROUP_LEADER = "เฉพาะหัวหน้ากลุ่มเท่านั้นที่แก้ไขกลุ่มได้";

/** Finds the student who leads a group, or null when the group has no leader —
 *  which includes the group not being there at all. */
type GroupLeaderLookup = (
  groupId: number,
) => Promise<{ student_id: string } | null>;

/**
 * The request names a group and the signed-in student must be its LEADER (#27).
 *
 *     router.patch("/", requireRole("STUDENT"),
 *                  validate({ body: updateStudentActivityGroupBody }),
 *                  requireGroupLeader(groupLeader.activity, "body"),
 *                  controller.update);
 *
 * Being in the group is not enough. The whole membership arrives on each write,
 * so a member who could write it could put themselves in charge, drop the
 * leader, or empty the group — the group is a thing one student owns and the
 * rest are invited to, and this is what says so.
 *
 * A group nobody leads and a group that is not there both answer `403`, the
 * same way the section rules do and for the same reason: group ids are small
 * integers, and a caller who could tell the two apart could count the groups of
 * a class they have nothing to do with.
 *
 * After `validate`, so a request that names no group is a `400`.
 *
 * Shaped like `sectionRule` and deliberately not folded into it. That one asks
 * "does this pair belong together" of two tables that answer it two ways; this
 * one asks the group who leads it and compares. Merging them would mean a rule
 * parameterised by field name, message and predicate — four knobs for three call
 * sites, where the reader of any one of them has to reassemble what it does.
 */
export function requireGroupLeader(
  find: GroupLeaderLookup,
  location: "params" | "body",
): (req: Request, res: Response, next: NextFunction) => void {
  return async (req, res, next) => {
    const session = sessionUserId(req);
    const named = (req[location] as Record<string, unknown> | undefined)
      ?.group_id;
    const groupId = Number(named);

    try {
      const leader = Number.isSafeInteger(groupId) ? await find(groupId) : null;

      if (leader?.student_id !== session) {
        return errorResponse(res, 403, NOT_GROUP_LEADER);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Shown when a student sets a group up in somebody else's name (#37). A
 * separate sentence from `NOT_GROUP_LEADER` because it is a separate mistake:
 * that one is about a group that exists and is somebody else's, this one is
 * about a group that does not exist yet and is being made for somebody else.
 */
export const NOT_SELF_LEADER = "สร้างกลุ่มได้เฉพาะกลุ่มที่ตัวเองเป็นหัวหน้าเท่านั้น";

/**
 * The body carries a member list and the signed-in student must be the one it
 * calls `LEADER` (#37).
 *
 *     router.post("/", requireRole("STUDENT"),
 *                 validate({ body: createStudentActivityGroupBody }),
 *                 requireSelfLeader, controller.create);
 *
 * `POST` is where a group's leader is decided, and it used to be decided by
 * whoever asked: a student could name a classmate as leader, leave themselves
 * out, and hand them a group they never made — which `requireGroupLeader` then
 * protects on that classmate's behalf. Under ADR-0001's rule the acting user is
 * the session's, and for a group the acting user is its leader.
 *
 * Being in the list is deliberately not enough. A member who is not the leader
 * cannot rewrite the list or disband the group afterwards (ADR-0004), so
 * letting them create it would mean the one thing they could do to a group is
 * the one thing that cannot be undone by anyone but somebody else.
 *
 * After `validate`, so by the time this runs the list exists and has exactly
 * one `LEADER` in it — a body without one is a `400` from `memberList` first.
 * Like the rules above it reads the raw body rather than the parsed one, to
 * keep the route's schema out of the middleware's arguments.
 */
export function requireSelfLeader(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { members } = (req.body ?? {}) as { members?: unknown };
  const leader = Array.isArray(members)
    ? (members.find(
        (member) => (member as { role?: unknown })?.role === "LEADER",
      ) as { student_id?: unknown } | undefined)
    : undefined;

  if (leader?.student_id !== sessionUserId(req)) {
    return errorResponse(res, 403, NOT_SELF_LEADER);
  }

  next();
}

/**
 * Where each kind of group keeps its leader — the two parallel tables the
 * students' group endpoints address.
 */
export const groupLeader = {
  activity: (groupId: number) =>
    prisma.student_activity_group_member.findFirst({
      where: { group_id: groupId, role: "LEADER" },
      select: { student_id: true },
    }),

  learningActivity: (groupId: number) =>
    prisma.student_learning_activity_group_member.findFirst({
      where: { group_id: groupId, role: "LEADER" },
      select: { student_id: true },
    }),
} satisfies Record<string, GroupLeaderLookup>;

/** Finds who a row belongs to, or null when there is no such row. */
type OwnerLookup = (id: string) => Promise<{ user_id: string } | null>;

/**
 * The request names a row — `/:id` — and that row must belong to the user who
 * is signed in.
 *
 *     router.delete("/:id", requireUser, validate({ params: portfolioEntryParams }),
 *                   requireOwnEntry(entryOwner.education), controller.remove);
 *
 * One extra SELECT of one column per write. The alternative is for every
 * service to filter its update and delete by user_id as well as by id, which is
 * the same query cost spread over sixty call sites, each of which can forget.
 */
export function requireOwnEntry(find: OwnerLookup) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const session = sessionUserId(req);

    try {
      const row = await find(req.params.id);

      if (row && row.user_id !== session) {
        return errorResponse(res, 403, NOT_OWNER);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * An id that arrived as a path segment, as the autoincrement columns want it.
 *
 * A segment that is not a whole number belongs to no row, so the lookup is
 * skipped and the request goes on to whatever `validate` or the controller
 * makes of it — the same as any other id that matches nothing.
 */
function byNumericId(
  find: (id: number) => Promise<{ user_id: string } | null>,
): OwnerLookup {
  return (raw) => {
    const id = Number(raw);
    return Number.isSafeInteger(id) ? find(id) : Promise.resolve(null);
  };
}

/**
 * The same, for the portfolio's uuid key.
 *
 * The shape check is not decoration: Postgres refuses to compare a uuid column
 * against text that is not one, so handing it a malformed id would raise a
 * database error and turn the 400 the caller should get into a 500.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function byUuid(
  find: (id: string) => Promise<{ user_id: string } | null>,
): OwnerLookup {
  return (raw) => (UUID.test(raw) ? find(raw) : Promise.resolve(null));
}

/**
 * Where each kind of portfolio row keeps its owner, one entry per table the
 * group's `/:id` routes address.
 *
 * Spelled out rather than derived from the table name because the last one is
 * not derivable: a skill-to-work mapping has no user_id of its own and belongs
 * to whoever the skill belongs to.
 */
export const entryOwner = {
  portfolio: byUuid((id) =>
    prisma.portfolio.findUnique({
      where: { id },
      select: { user_id: true },
    }),
  ),

  education: byNumericId((id) =>
    prisma.portfolio_education.findUnique({
      where: { id },
      select: { user_id: true },
    }),
  ),

  training: byNumericId((id) =>
    prisma.portfolio_training.findUnique({
      where: { id },
      select: { user_id: true },
    }),
  ),

  certificate: byNumericId((id) =>
    prisma.portfolio_certificate.findUnique({
      where: { id },
      select: { user_id: true },
    }),
  ),

  internship: byNumericId((id) =>
    prisma.portfolio_internship.findUnique({
      where: { id },
      select: { user_id: true },
    }),
  ),

  award: byNumericId((id) =>
    prisma.portfolio_award.findUnique({
      where: { id },
      select: { user_id: true },
    }),
  ),

  thesis: byNumericId((id) =>
    prisma.portfolio_thesis.findUnique({
      where: { id },
      select: { user_id: true },
    }),
  ),

  activity: byNumericId((id) =>
    prisma.portfolio_activities.findUnique({
      where: { id },
      select: { user_id: true },
    }),
  ),

  skill: byNumericId((id) =>
    prisma.portfolio_skill.findUnique({
      where: { id },
      select: { user_id: true },
    }),
  ),

  skillMapping: byNumericId(async (id) => {
    const mapping = await prisma.portfolio_skill_activity_mapping.findUnique({
      where: { id },
      select: { portfolio_skill: { select: { user_id: true } } },
    });

    return mapping?.portfolio_skill ?? null;
  }),
} satisfies Record<string, OwnerLookup>;
