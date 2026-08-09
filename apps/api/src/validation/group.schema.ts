import { z } from "zod";
import { text } from "./fields";

/**
 * `/group` — answering a group invitation from the link in the email.
 *
 * Neither endpoint has a session; the token is the whole of the authorisation.
 * So the token is the one field that was already checked by hand, and the check
 * moves here to answer in the same shape as everything else.
 *
 * `type` picks which of the two parallel tables to look in, and used to reach
 * the service as whatever was sent: only the exact string `"activity"` took the
 * activity path, so a typo silently searched the learning-activity side and
 * reported the token as invalid.
 */

const inviteType = z.enum(["activity", "learning-activity"]);

export const validateInviteBody = z.object({
  token: text,
  type: inviteType,
});

/**
 * `action` is the answer, and only an answer. It went into the status column
 * unchecked, so a caller could put an accepted member back to PENDING — the
 * third value of the enum, and not something an invitation can be answered
 * with.
 */
export const acceptInviteBody = validateInviteBody.extend({
  action: z.enum(["ACCEPT", "REJECTED"]),
});

export type AcceptInviteBody = z.infer<typeof acceptInviteBody>;
export type ValidateInviteBody = z.infer<typeof validateInviteBody>;
