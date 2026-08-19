import type {
  CreateLearningActivityBody,
  UpdateLearningActivityBody,
} from "../validation/learning-activity.schema";

/** What the schema checked, plus the files multer took off the same request. */
export type CreateLearningActivityReqBody = CreateLearningActivityBody & {
  files: Express.Multer.File[];
};

export type UpdateLearningActivityReqBody = UpdateLearningActivityBody & {
  files: Express.Multer.File[];
};

// GetLearningActivityDetailResp and GetAllLearningActivityList used to be
// declared here. They moved to @deep-portfolio/api-types (#68) — import
// LearningActivityDetailResp and LearningActivityListItem from there. The
// dates that said Date now say string, `id` and the two columns the list row
// had never declared are written down, and week_no is optional on the list and
// absent from the detail; see ADR-0033. What is left in this file is the two
// request bodies, which stay: the zod schemas in ../validation are what
// actually refuses a bad one (ADR-0028).
