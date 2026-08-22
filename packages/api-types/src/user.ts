/**
 * Who the caller is — `/user`, and the one `/auth` route that answers a shape
 * rather than a cookie.
 *
 * Two endpoints ask that question and neither is the other's shorthand:
 *
 * - `GET /user?id=` answers `UserDetail` — the `users` row itself, for the
 *   screen that shows a profile. `requireSelf` refuses anyone else's id (#40).
 * - `GET /auth` answers `SessionUser` — the four things the app needs before
 *   it can draw anything: who you are, what to call you, and what you may do.
 *   It takes no id at all; the session is the question.
 *
 * `GET /user/student` is the third, and its `StudentDetail` lives in
 * `student.ts` — it moved a pass early because the aggregate portfolio read
 * embeds it (ADR-0043 §3).
 *
 * `POST /auth/google`, `POST /auth/logout` and `POST /auth/refresh` answer
 * `data: null` or no body at all and have no type here. What they really hand
 * back is two cookies, which no response type can describe.
 */

/**
 * `GET /user?id=` — one row of `users`, as a profile screen reads it.
 *
 * Thirteen fields, which is four fewer than the table has. The four left out
 * are `password`, `verification_token`, `is_verified` and `status`, and until
 * #68 all four were on the wire: the service called `findUnique` with no
 * `select`, so every column the table had went to the caller.
 *
 * Two of the four are vestigial. Nothing in `apps/api` writes `password` or
 * `verification_token` — sign-in is Google's and always has been here — so
 * what actually left the server was two nulls. That is worth saying plainly
 * rather than calling this a leak of anything: what was wrong is that the
 * response promised to carry them, and the day someone adds a password the
 * promise starts being kept. No screen has ever read any of the four — the
 * web's own copy of this shape named exactly the thirteen below — so narrowing
 * the query broke nothing. See BEHAVIOR-CHANGES.md.
 *
 * Everything but `user_id` and `email` is nullable, and none of it is
 * optional: `select` names all thirteen keys, so all thirteen are sent. The
 * web wrote eleven of them as optional *and* nullable, which said a caller
 * could not tell a column left empty from one the API declined to send.
 *
 * `created_at` and `updated_at` are ISO strings, and both are seven hours
 * ahead of the moment they record — measured, not reasoned. The columns
 * default to `CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'` and are
 * `timestamp` without a zone, so Postgres stores Bangkok local time and Prisma
 * reads that same clock reading back as UTC.
 *
 * Twenty-seven columns across the schema carry that default. These two are
 * among the three that are `Timestamp(6)`; the other twenty-four are
 * `Timestamptz(6)`, where the same expression is cast back using the server's
 * own zone — a related question this pass did not measure. Pinned in
 * BEHAVIOR-CHANGES.md rather than fixed here.
 */
export type UserDetail = {
  user_id: string;
  email: string;
  phone: string | null;
  title_th: string | null;
  first_name_th: string | null;
  last_name_th: string | null;
  title_en: string | null;
  first_name_en: string | null;
  last_name_en: string | null;
  department_id: string | null;
  program_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * `GET /auth` — the session, answered as the person holding it.
 *
 * Assembled rather than selected: `name` is the Thai title and both Thai names
 * joined, and `roles` is a lookup through `user_roles`. Neither is a column,
 * which is why this is not `UserDetail` with fields removed.
 *
 * Every guard on the frontend reads `roles` and nothing else — an empty list
 * is what "signed in but may do nothing" looks like, and `use-auth.ts` treats
 * it as not signed in at all.
 *
 * The entries are nullable because `user_roles.role_id` is: a row can assign
 * no role. Nothing renders one, and the guards compare against "TEACHER" and
 * "STUDENT", so a null simply never matches. Left as it is rather than
 * filtered, because dropping rows from a response is a change to what a caller
 * sees and this pass had no reason to make one (ADR-0044 §4).
 */
export type SessionUser = {
  user_id: string;
  email: string;
  /** Title and both Thai names, space-joined, with the empty parts left out. */
  name: string;
  roles: (string | null)[];
};
