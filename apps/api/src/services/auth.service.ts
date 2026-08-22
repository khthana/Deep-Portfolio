import prisma from "../config/prisma";
import type { SessionUser } from "@deep-portfolio/api-types";

export default class AuthService {
  /**
   * The account an identity provider's email address belongs to, or null when
   * the address is not one of ours.
   *
   * Null is the whole point of this method. `users.user_id` is a VarChar(8)
   * with a meaning outside this system — a student or staff code issued by the
   * university — so there is nothing this server could invent for someone who
   * has never been registered. A verified Google address is proof of who you
   * are, not proof that you belong here; those are separate questions and only
   * the second one is ours to answer.
   *
   * Matched case-insensitively: Google always hands back a lower-cased
   * address, while `users.email` holds whatever was imported, and an account
   * that exists must not be unreachable because someone typed it capitalised.
   */
  async findUserByEmail(email: string) {
    return prisma.users.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { user_id: true },
    });
  }

  /**
   * Whether this user_id still names a row in `users`.
   *
   * The same question `requireUser` asks on every guarded request, asked here
   * because /auth/refresh answers before any middleware would. Only the
   * existence matters, so only the key is selected.
   */
  async userExists(user_id: string) {
    const user = await prisma.users.findUnique({
      where: { user_id },
      select: { user_id: true },
    });

    return user !== null;
  }

  /**
   * `GET /auth` — the session, answered as the person holding it.
   *
   * Two of the four fields are assembled rather than selected, which is why
   * this is not `UserDetail` with columns removed: `name` is three columns
   * joined and `roles` is a lookup through `user_roles`.
   */
  async getUserDetail(user_id: string): Promise<SessionUser | null> {
    try {
      const user = await prisma.users.findUnique({
        where: { user_id },
        select: {
          user_id: true,
          email: true,
          title_th: true,
          first_name_th: true,
          last_name_th: true,
          first_name_en: true,
          last_name_en: true,
          user_roles_user_roles_user_idTousers: {
            where: {
              is_active: true,
            },
            select: {
              role_id: true,
            },
          },
        },
      });

      if (!user) return null;

      return {
        user_id: user.user_id,
        email: user.email,
        // Joined by filtering rather than by template literal. All three
        // columns are nullable, and a template literal writes the four letters
        // "null" into the string for each one that is — which the teacher
        // navbar then draws (#68, and BEHAVIOR-CHANGES.md).
        name: [user.title_th, user.first_name_th, user.last_name_th]
          .filter(Boolean)
          .join(" "),
        roles: user.user_roles_user_roles_user_idTousers.map((r) => r.role_id),
      };
    } catch {
      throw new Error("Failed to fetch user profile");
    }
  }
}
