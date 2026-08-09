import { z } from "zod";
import { text } from "./fields";

/**
 * The pieces every endpoint that takes attachments shares.
 *
 * A post, a week of material, an assignment and a submission all accept the
 * same two things — files in the multipart body, and links pasted alongside
 * them — so the link is described once here rather than in each schema.
 */

/**
 * A link, as the frontend serialises it into the form. It also sends
 * `uploaded_by`, which nothing reads: unknown keys are dropped rather than
 * refused, so those requests keep working.
 */
export const uploadUrl = z.object({
  title: text,
  url: text,
});

export type UploadURLDetail = z.infer<typeof uploadUrl>;
