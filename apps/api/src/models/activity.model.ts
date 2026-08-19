import type {
  CreateActivityBody,
  UpdateActivityBody,
} from "../validation/activity.schema";

/** What the schema checked, plus the files multer took off the same request. */
export type CreateActivityReqBody = CreateActivityBody & {
  files: Express.Multer.File[];
};

export type UpdateActivityReqBody = UpdateActivityBody & {
  files: Express.Multer.File[];
};

// The two response shapes this feature answers with — the detail and the list
// row — moved to @deep-portfolio/api-types (#68), and took the rubric and the
// score category with them. Import ActivityDetailResp, ActivityListItem,
// RubricDetail and ScoreWeightBrief/ScoreWeightDetail from there. What is left
// here is the two request bodies, which belong to the zod schemas above them.
