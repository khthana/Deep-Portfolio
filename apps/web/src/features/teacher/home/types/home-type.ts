/**
 * `TeacherCourseListResp` and `CourseDetailBrief` used to be written out here.
 * They now come from @deep-portfolio/api-types, which apps/api is annotated
 * against — see docs/adr/0028-shared-api-types.md. What is left is what only
 * this screen knows: the arguments it calls with.
 */

export type GetCourseDetailParams = {
  secId: string;
};

export type GetAllCoursesParams = {
  academic_year: string;
  semester: number;
  teacher_id: string;
};
