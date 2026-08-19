import type { CreateAnnouncementBody } from "../validation/announcement.schema";

/**
 * What the service is given: the validated body, the files multer put on the
 * request, and the author — which comes from the session rather than from the
 * body (#30). All three arrive by different routes and only meet here.
 */
export type CreateAnnouncementReqBody = CreateAnnouncementBody & {
  files: Express.Multer.File[];
  created_by: string;
};

//--------------------------------------

// AnnouncementDetailResp used to be declared here. It moved to
// @deep-portfolio/api-types (#68) — import it from there. Three things it said
// were wrong, all of them hidden by an `as` over the whole object in the
// service: `section_id` is on the wire and was not declared, `attachments` is
// never null, and the three dates are strings by the time a caller reads them.
// See ADR-0037.
