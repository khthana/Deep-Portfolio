/**
 * What the course endpoints answer with lives in @deep-portfolio/api-types, so
 * that the frontend reads the same declaration this service is annotated with.
 * What stays here is what never leaves the API: the arguments a service takes,
 * and the request bodies the zod schemas own.
 */

export type GetAllCoursesParams = {
  academic_year: string;
  semester: number;
  teacher_id: string;
};

//-------------------------------------

export type { CreateCourseSectionScheduleReq } from "../validation/course.schema";
