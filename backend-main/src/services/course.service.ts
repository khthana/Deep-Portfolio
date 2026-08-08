import prisma from "../config/prisma";
import {
  CourseDetail,
  CourseDetailBrief,
  CreateCourseSectionScheduleReq,
  GetAllCoursesParams,
  TeacherCourseListResp,
} from "../models/course.model";
import {
  convertTimeToDate,
  formatDateToTimeString,
} from "../utils/convert-time";
import { sortByDate } from "../utils/sort-by-date";
import UserService from "./user.service";

export default class CourseService {
  private readonly userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getAllCourses(
    params: GetAllCoursesParams,
  ): Promise<TeacherCourseListResp> {
    const sectionTeacher = await this.getCourseSectionTeacherById(
      params.teacher_id,
    );

    const activeCourses: CourseDetailBrief[] = [];
    const archivedCourses: CourseDetailBrief[] = [];

    await Promise.all(
      sectionTeacher.map(async (section) => {
        const sectionDetail = await prisma.course_sections.findUnique({
          where: { section_id: section.section_id ?? 0 },
          include: {
            semester_courses: {
              include: {
                subjects: true,
              },
            },
            course_section_schedule: {
              select: {
                day_of_week: true,
                start_time: true,
                end_time: true,
                classroom: true,
              },
            },
          },
        });

        if (!sectionDetail) return null;

        const courseData = {
          section_number: sectionDetail?.section_number,
          section_id: sectionDetail?.section_id,
          course_name_en:
            sectionDetail?.semester_courses.subjects.subject_name_en,
          course_name_th:
            sectionDetail?.semester_courses.subjects.subject_name_th,
          course_id: sectionDetail?.semester_courses.subjects.subject_id,
          academic_year: sectionDetail?.semester_courses.academic_year,
          semester: sectionDetail?.semester_courses.semester,
          day_of_week:
            sectionDetail?.course_section_schedule?.[0]?.day_of_week ?? null,
          start_time: sectionDetail?.course_section_schedule?.[0]?.start_time
            ? formatDateToTimeString(
                sectionDetail.course_section_schedule[0].start_time,
              )
            : null,
          end_time: sectionDetail?.course_section_schedule?.[0]?.end_time
            ? formatDateToTimeString(
                sectionDetail.course_section_schedule[0].end_time,
              )
            : null,
          classroom:
            sectionDetail?.course_section_schedule?.[0]?.classroom ?? null,
        } as CourseDetailBrief;

        if (
          sectionDetail.semester_courses.academic_year ===
            params.academic_year &&
          sectionDetail.semester_courses.semester === params.semester
        ) {
          activeCourses.push(courseData);
        } else {
          archivedCourses.push(courseData);
        }
      }),
    );

    // const dayOrder = {
    //   MON: 1,
    //   TUE: 2,
    //   WED: 3,
    //   THU: 4,
    //   FRI: 5,
    //   SAT: 6,
    //   SUN: 7,
    // };

    // activeCourses.sort((a, b) => {
    //   const dayA = a.day_of_week ? dayOrder[a.day_of_week] : 8;
    //   const dayB = b.day_of_week ? dayOrder[b.day_of_week] : 8;

    //   if (dayA !== dayB) {
    //     return dayA - dayB;
    //   }

    //   return (a.start_time ?? "").localeCompare(b.start_time ?? "");
    // });

    // archivedCourses.sort((a, b) => {
    //   const dayA = a.day_of_week ? dayOrder[a.day_of_week] : 8;
    //   const dayB = b.day_of_week ? dayOrder[b.day_of_week] : 8;

    //   if (dayA !== dayB) {
    //     return dayA - dayB;
    //   }

    //   return (a.start_time ?? "").localeCompare(b.start_time ?? "");
    // });

    return {
      teacher_id: params.teacher_id,
      active_courses: sortByDate(activeCourses),
      archived_courses: sortByDate(archivedCourses),
    };
  }

  async getCourseDetail(sec_id: number): Promise<CourseDetail | null> {
    const section = await prisma.course_sections.findUnique({
      where: { section_id: sec_id },
      include: {
        semester_courses: {
          include: {
            subjects: true,
          },
        },
        course_section_schedule: {
          select: {
            day_of_week: true,
            start_time: true,
            end_time: true,
            classroom: true,
          },
        },
      },
    });

    if (!section) return null;

    const teacher = await prisma.course_sections_teacher.findFirst({
      where: { section_id: sec_id },
    });

    const teacherDetail = await this.userService.getUserDetail(
      teacher?.user_id ?? "",
    );

    const course = section.semester_courses;
    const subject = course.subjects;

    // const schedules = section.course_section_schedule;
    // const dayOrder: { [key: string]: number } = {
    //   MON: 1,
    //   TUE: 2,
    //   WED: 3,
    //   THU: 4,
    //   FRI: 5,
    //   SAT: 6,
    //   SUN: 7,
    // };

    // schedules.sort((a, b) => {
    //   const dayA = dayOrder[a.day_of_week] || 8;
    //   const dayB = dayOrder[b.day_of_week] || 8;

    //   if (dayA !== dayB) return dayA - dayB;

    //   return (
    //     new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    //   );
    // });

    if (!teacher || !subject || !teacherDetail) return null;

    return {
      teacher_name_th: `${teacherDetail.title_th} ${teacherDetail.first_name_th} ${teacherDetail.last_name_th}`,
      teacher_name_en: `${teacherDetail.title_en} ${teacherDetail.first_name_en} ${teacherDetail.last_name_en}`,
      teacher_email: teacherDetail.email,
      teacher_phone: teacherDetail.phone ?? "",
      teacher_id: teacherDetail.user_id,

      section_id: section.section_id,
      section_number: section.section_number,

      course_name_en: subject.subject_name_en,
      course_name_th: subject.subject_name_th,
      course_id: subject.subject_id,
      credits: subject.credits,
      course_desc_en: subject.description_en ?? "",
      course_desc_th: subject.description_th ?? "",

      academic_year: course.academic_year,
      semester: course.semester,
      program_id: course.program_id ?? "",

      day_of_week: section.course_section_schedule?.[0]?.day_of_week ?? null,
      start_time: section.course_section_schedule?.[0]?.start_time
        ? formatDateToTimeString(
            section.course_section_schedule?.[0]?.start_time,
          )
        : null,
      end_time: section.course_section_schedule?.[0]?.end_time
        ? formatDateToTimeString(section.course_section_schedule?.[0]?.end_time)
        : null,
      classroom: section.course_section_schedule?.[0]?.classroom ?? null,
    };
  }

  async getCourseSectionTeacherById(user_id: string) {
    return prisma.course_sections_teacher.findMany({
      where: { user_id: user_id },
    });
  }

  //----------------------------------------------------------------------

  async createCourseSectionSchedule(data: CreateCourseSectionScheduleReq) {
    const existingSchedule = await prisma.course_section_schedule.findFirst({
      where: { section_id: data.section_id },
    });

    if (existingSchedule) {
      return prisma.course_section_schedule.update({
        where: { id: existingSchedule.id },
        data: {
          day_of_week: data.day_of_week,
          start_time: convertTimeToDate(data.start_time),
          end_time: convertTimeToDate(data.end_time),
          classroom: data.classroom,
        },
      });
    }

    return prisma.course_section_schedule.create({
      data: {
        section_id: data.section_id,
        day_of_week: data.day_of_week,
        start_time: convertTimeToDate(data.start_time),
        end_time: convertTimeToDate(data.end_time),
        classroom: data.classroom,
      },
    });
  }
}
