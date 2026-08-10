import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import { sessionUserId } from "./auth.middleware";
import { errorResponse } from "../utils/response";

/**
 * Row-level ownership for the portfolio group — the second half of the answer
 * `requireRole` cannot give.
 *
 * A role says what kind of user is asking. It does not say whose data this is,
 * and in this group that is the only question worth asking: every row carries a
 * user_id, and the rule is the same for all 56 endpoints — the acting user is
 * the session's, never whoever the request says. See
 * docs/adr/0001-portfolio-access.md and issue #31.
 *
 * Both middlewares below assume `requireUser` ran first: they read the session
 * through `sessionUserId`, which throws rather than answering 401, because a
 * route that reached here without a session is a wiring mistake and not a
 * caller's.
 *
 * Neither of them cares whether the row exists. A request for something that is
 * not there is a different question with a different answer, and the controller
 * already gives it; folding the two together would turn every 404 in this group
 * into a 403 and hide the difference from the caller.
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
