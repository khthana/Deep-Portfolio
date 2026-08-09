import { z } from "zod";
import { text, userId } from "./fields";

/** `/auth` and `/user` — signing in, and reading a person's own details. */

export const googleLoginBody = z.object({
  /**
   * The ID token the browser got from Google. Only its presence and its being
   * a string are checked here; whether Google will vouch for it is the
   * identity provider's answer, and no schema can stand in for that.
   */
  credential: text,
});

export const userQuery = z.object({
  id: userId,
});
