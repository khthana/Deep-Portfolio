import prisma from "../../src/config/prisma";
import type { Weekday } from "../../src/models/course.model";
import { BASELINE } from "../seed";
import { nextSubjectId } from "./ids";

/**
 * Courses.
 *
 * "A course" is four tables in this schema — subjects, semester_courses,
 * course_sections and, if anyone teaches it, course_sections_teacher — and
 * almost no case is about that shape. createCourse builds the whole chain and
 * hands back the ids, so a case that is about, say, the archived list can say
 * so in one line and leave the rest alone.
 */

export interface ScheduleOptions {
  day_of_week?: Weekday;
  /** "HH:MM", 24-hour. Stored in a time column, so the date part is ignored. */
  start_time?: string;
  end_time?: string;
  classroom?: string;
}

export interface CourseOptions {
  /** Defaults to the term the baseline calls current. Pass
   *  BASELINE.previousTerm to make the course archived. */
  academic_year?: string;
  semester?: number;
  subject_id?: string;
  subject_name_th?: string;
  subject_name_en?: string;
  credits?: number;
  description_th?: string;
  description_en?: string;
  program_id?: string;
  section_number?: string;
  /** users.user_id. Optional since #48 — a section with no teacher is returned
   *  with the five `teacher_*` fields null — so pass one only when the case
   *  reads a teacher out of the response. The column has no foreign key, so an
   *  id belonging to nobody is writable, and answers exactly as no teacher at
   *  all does. */
  teacher_id?: string;
  schedule?: ScheduleOptions;
}

export interface CreatedCourse {
  semester_course_id: number;
  section_id: number;
  section_number: string;
  subject_id: string;
  academic_year: string;
  semester: number;
  program_id: string;
}

/** Time columns are read back as 1970-01-01 UTC, so that is what goes in. */
function timeOfDay(value: string): Date {
  return new Date(`1970-01-01T${value}:00Z`);
}

export async function createCourse(
  options: CourseOptions = {},
): Promise<CreatedCourse> {
  const subject_id = options.subject_id ?? nextSubjectId();
  const academic_year = options.academic_year ?? BASELINE.term.academic_year;
  const semester = options.semester ?? BASELINE.term.semester;
  const program_id = options.program_id ?? BASELINE.program.program_id;
  const section_number = options.section_number ?? "1";

  // upsert rather than create, so two sections of the same subject in the same
  // term — a real case, and the reason course_sections exists — do not collide
  // on the (academic_year, semester, subject_id) unique index.
  await prisma.subjects.upsert({
    where: { subject_id },
    update: {},
    create: {
      subject_id,
      subject_name_th: options.subject_name_th ?? "วิชาตัวอย่าง",
      subject_name_en: options.subject_name_en ?? "Example Subject",
      credits: options.credits ?? 3,
      description_th: options.description_th ?? "คำอธิบายรายวิชาตัวอย่าง",
      description_en: options.description_en ?? "An example subject.",
      department_id: BASELINE.department.department_id,
    },
  });

  const semesterCourse = await prisma.semester_courses.upsert({
    where: {
      academic_year_semester_subject_id: {
        academic_year,
        semester,
        subject_id,
      },
    },
    update: {},
    create: { academic_year, semester, subject_id, program_id },
  });

  const section = await prisma.course_sections.create({
    data: { semester_course_id: semesterCourse.id, section_number },
  });

  if (options.teacher_id) {
    await prisma.course_sections_teacher.create({
      data: {
        semester_course_id: semesterCourse.id,
        section_id: section.section_id,
        user_id: options.teacher_id,
      },
    });
  }

  if (options.schedule) {
    await setCourseSchedule(section.section_id, options.schedule);
  }

  return {
    semester_course_id: semesterCourse.id,
    section_id: section.section_id,
    section_number,
    subject_id,
    academic_year,
    semester,
    program_id,
  };
}

/** Separate from createCourse because POST /course/schedule is the endpoint
 *  under test in some cases and the arrange step in others. */
export function setCourseSchedule(
  section_id: number,
  schedule: ScheduleOptions = {},
) {
  return prisma.course_section_schedule.create({
    data: {
      section_id,
      day_of_week: schedule.day_of_week ?? "MON",
      start_time: timeOfDay(schedule.start_time ?? "09:00"),
      end_time: timeOfDay(schedule.end_time ?? "12:00"),
      classroom: schedule.classroom ?? "ECC-101",
    },
  });
}

/** student_course — the enrolment row a section needs before a student can be
 *  graded in it. */
export function enrolStudent(section_id: number, student_id: string) {
  return prisma.student_course.create({ data: { section_id, student_id } });
}
