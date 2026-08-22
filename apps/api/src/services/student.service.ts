import prisma from "../config/prisma";
import StudentMapper from "../mappers/student.mapper";
import {
  SubmitActivityBody,
  SubmitLearningActivityBody,
} from "../models/student.model";
import AttachmentsService, {
  transactionWithUploads,
} from "./attachments.service";
import CourseService from "./course.service";
import LearningActivityService from "./learning-activity.service";
import StudentActivityService from "./student-activity.service";
import StudentLearningActivityService from "./student-learning-activity.service";
import MinIOService from "./upload.service";
import type {
  AllClassworkDetailResp,
  CalendarClassworkEvent,
  CalendarCourseEvent,
  CalendarEventResp,
  ClassworkDetail,
  ClassworkDetailResp,
  CourseDetail,
  EnrolledSubject,
  SectionActivityOption,
  SubmissionWithCourse,
  StudentActivityDetailResp,
  StudentLearningActivityDetailResp,
  StudentRosterEntry,
} from "@deep-portfolio/api-types";
import { sortByDate } from "../utils/sort-by-date";
import { isAnnounced } from "../utils/is-announced";
import { HttpError } from "../utils/http-error";

/**
 * The ways handing work in can fail on something the caller named.
 *
 * The first three used to be a bare `Error`, which the middleware answers with
 * a 500 and — now that it forwards a message only when a status says the
 * message was meant for the caller — with "เกิดข้อผิดพลาดภายในระบบ". None of
 * them is the server breaking: the submission id names nothing, or the group
 * does. Written once each because both halves of the endpoint pair raise the
 * same ones.
 */
const SUBMISSION_NOT_FOUND = () => new HttpError(404, "ไม่พบงานที่ต้องการส่ง");

const GROUP_HAS_NO_MEMBERS = () =>
  new HttpError(400, "ยังไม่มีสมาชิกที่ตอบรับคำเชิญในกลุ่มนี้");

const GROUP_HAS_NO_SUBMISSIONS = () =>
  new HttpError(404, "ไม่พบงานของสมาชิกในกลุ่ม");

/**
 * The last two are the caller's right being refused rather than a value being
 * wrong, so they are 403s (ADR-0007, ADR-0009): the session says who is asking,
 * the body says what is being submitted, and the two have to agree.
 *
 * A submission id that names nothing is still a 404. Telling the two apart says
 * only that some row carries that id, which every classmate's classwork list
 * already implies — and a student who is refused deserves to know which of the
 * two they hit.
 */
const NOT_YOUR_SUBMISSION = () =>
  new HttpError(403, "ส่งงานได้เฉพาะงานของตัวเองเท่านั้น");

const NOT_YOUR_GROUP = () =>
  new HttpError(403, "ส่งงานกลุ่มได้เฉพาะกลุ่มที่ตัวเองเป็นสมาชิกเท่านั้น");

export default class StudentService {
  private readonly courseService: CourseService;
  private readonly attachmentsService: AttachmentsService;
  private readonly studentActivityService: StudentActivityService;
  private readonly studentLearningActivityService: StudentLearningActivityService;
  private readonly learningActivityService: LearningActivityService;
  private readonly uploadService: MinIOService;

  private readonly studentMapper: StudentMapper;

  constructor() {
    this.courseService = new CourseService();
    this.attachmentsService = new AttachmentsService();
    this.uploadService = new MinIOService();
    this.studentActivityService = new StudentActivityService();
    this.studentLearningActivityService = new StudentLearningActivityService();
    this.learningActivityService = new LearningActivityService();

    this.studentMapper = new StudentMapper();
  }

  async getStudentCalendarEvent(
    student_id: string,
    semester: number,
    academic_year: string,
  ): Promise<CalendarEventResp> {
    const studentCourses = await this.getStudentCourseList(
      student_id,
      semester,
      academic_year,
    );

    const sectionIds = studentCourses.map((course) => course.section_id);

    // Built once rather than a find() per row, and it is total over sectionIds
    // by construction: the ids are read off this very list, and both queries
    // below are filtered to them. So the "" fallback is unreachable — it is
    // there because the type has to say something, and "" is what a classwork
    // row already uses for a subject with no name (#68). Keyed on `number |
    // null` so that a nullable section_id is looked up as it is, rather than
    // being turned into the fake id 0 on the way in.
    const courseNames = new Map<number | null, string>(
      studentCourses.map((course) => [
        course.section_id,
        course.course_name_en,
      ]),
    );

    const activities = await prisma.student_activity.findMany({
      where: {
        student_id,
        activities: {
          section_id: { in: sectionIds },
        },
      },
      select: {
        id: true,
        status: true,

        activities: {
          select: {
            activity_name: true,
            section_id: true,
            activity_type: true,
            deadline_date: true,
            announcement_date: true,
          },
        },
      },
    });

    const learningActivities = await prisma.student_learning_activity.findMany({
      where: {
        student_id,
        learning_activities: {
          section_id: { in: sectionIds },
        },
      },
      select: {
        status: true,
        id: true,

        learning_activities: {
          select: {
            learning_activity_name: true,
            section_id: true,
            learning_activity_type: true,
            deadline_date: true,

            announcement_date: true,
          },
        },
      },
    });

    // Filter, then map. Written the other way round — map over everything and
    // let `announced && {...}` decide — the unannounced entries stayed in the
    // array as the literal `false`, and only the cast made that typecheck.
    const calendarActivities: CalendarClassworkEvent[] = activities
      .filter((c) => isAnnounced(c.activities.announcement_date))
      .map((c) => ({
        id: c.id,
        name: c.activities.activity_name,
        deadline_date: c.activities.deadline_date?.toISOString() ?? null,
        type: c.activities.activity_type,
        status: c.status,
        course: courseNames.get(c.activities.section_id) ?? "",
      }));

    const calendarLearningActivities: CalendarClassworkEvent[] =
      learningActivities
        .filter((c) => isAnnounced(c.learning_activities.announcement_date))
        .map((c) => ({
          id: c.id,
          name: c.learning_activities.learning_activity_name,
          deadline_date:
            c.learning_activities.deadline_date?.toISOString() ?? null,
          type: c.learning_activities.learning_activity_type,
          status: c.status,
          course: courseNames.get(c.learning_activities.section_id) ?? "",
        }));

    // The `as CalendarCourseEvent` this used to carry was hiding nothing —
    // every field lines up with CourseDetail, which is what studentCourses
    // holds. Dropped so that the next drift is a type error (ADR-0045).
    const courses: CalendarCourseEvent[] = studentCourses.map((sc) => ({
      id: sc.section_id,
      name: sc.course_name_en,
      day_of_week: sc.day_of_week,
      start_time: sc.start_time,
      end_time: sc.end_time,
      classroom: sc.classroom,
    }));

    return {
      activities: calendarActivities,
      learning_activities: calendarLearningActivities,
      courses: courses,
    };
  }

  /**
   * The roster, in one query rather than one per student.
   *
   * It used to read `student_course` and then `findUnique` the `student` row
   * for each id it found, with no `select` on either, so the response carried
   * all eleven columns of `student` — one of which is named `test`. That was
   * not decided, it is what an unselected `findUnique` happens to do
   * (ADR-0044 §1).
   *
   * `student_course.student_id` is a foreign key onto `student`, so reading it
   * as a relation is the same set of rows, ordered the same way, in one round
   * trip instead of one per student. The key also means the row can never be
   * missing, which is why the old `{ ...result }` over a possibly-null
   * `findUnique` never actually answered `{}` — it only said it might.
   */
  async getStudentInSec(section_id: number): Promise<StudentRosterEntry[]> {
    const enrolments = await prisma.student_course.findMany({
      where: { section_id },
      orderBy: { student_id: "asc" },
      select: {
        student: {
          select: {
            student_id: true,
            first_name_th: true,
            last_name_th: true,
            full_name_th: true,
          },
        },
      },
    });

    return enrolments.map((enrolment) => enrolment.student);
  }

  async submitActivity(
    data: SubmitActivityBody,
  ): Promise<StudentActivityDetailResp | undefined> {
    const { result, objects } = await transactionWithUploads(
      async (tx, uploads) => {
        // 1. ดึง activity พร้อม attachments เดิม
        const activity = await tx.student_activity.findUnique({
          where: { id: data.student_activity_id },
          include: {
            student_activity_attachments: true,
          },
        });

        if (!activity) {
          throw SUBMISSION_NOT_FOUND();
        }

        if (activity.student_id !== data.student_id) {
          throw NOT_YOUR_SUBMISSION();
        }

        // 2. ถ้าเคย submit แล้ว → ลบงานเดิม
        // if (activity.status === "SUBMITTED") {
        // ลบ relation ก่อน
        await tx.student_activity_attachments.deleteMany({
          where: {
            student_activity_id: activity.id,
          },
        });
        // }

        // 3. update status (submit ใหม่)
        const updatedActivity = await tx.student_activity.update({
          where: { id: activity.id },
          data: {
            status: "SUBMITTED",
            submitted_at: new Date(),
          },
        });

        // 4. สร้าง attachment ใหม่
        const attachmentIds = await this.attachmentsService.createAttachments(
          {
            urls: data.urls,
            files: data.files,
          },
          `${data.section_id}/activity/${data.activity_id}/${data.student_id}`,
          { tx, uploads },
        );

        const allAttachmentsIds = [
          ...data.existing_files_ids,
          ...attachmentIds,
        ];

        if (allAttachmentsIds.length > 0) {
          await tx.student_activity_attachments.createMany({
            data: allAttachmentsIds.map((attId) => ({
              student_activity_id: updatedActivity.id,
              attachment_id: attId,
            })),
          });
        }

        // Only now: what the resubmission named again has just been linked back,
        // so what is left unreferenced is what it replaced (#34).
        const objects = await this.attachmentsService.deleteUnreferenced(
          activity.student_activity_attachments.map(
            (link) => link.attachment_id,
          ),
          tx,
        );

        const result =
          await this.studentActivityService.getStudentActivityDetail(
            updatedActivity.id,
            tx,
          );

        return { result, objects };
      },
    );

    await this.uploadService.removeFiles(objects);

    return result;
  }

  async submitGroupActivity(
    data: SubmitActivityBody,
  ): Promise<StudentActivityDetailResp | undefined> {
    const { result, objects } = await transactionWithUploads(
      async (tx, uploads) => {
        // 1. ดึงสมาชิกในกลุ่ม
        const members = await tx.student_activity_group_member.findMany({
          where: {
            group_id: data.group_id,
            status: "ACCEPT",
          },
          select: { student_id: true, student_activity_id: true },
        });

        if (members.length === 0) {
          throw GROUP_HAS_NO_MEMBERS();
        }

        // Submitting for a group writes to every accepted member at once, so a
        // group the caller never joined is other people's work (#38).
        if (!members.some((m) => m.student_id === data.student_id)) {
          throw NOT_YOUR_GROUP();
        }

        const studentIds = members.map((m) => m.student_id);

        // 2. ดึง student_activity ของทุกคน
        const activities = await tx.student_activity.findMany({
          where: {
            activity_id: data.activity_id,
            student_id: { in: studentIds },
          },
          include: {
            student_activity_attachments: true,
          },
        });

        if (activities.length === 0) {
          throw GROUP_HAS_NO_SUBMISSIONS();
        }

        // Being in the group is not enough on its own: the reply carries the
        // detail of whichever submission was named, so it has to be the caller's.
        const own = activities.find((a) => a.id === data.student_activity_id);

        if (!own || own.student_id !== data.student_id) {
          throw NOT_YOUR_SUBMISSION();
        }

        // 3. ลบ attachment เดิม (ถ้าเคย submit)
        await tx.student_activity_attachments.deleteMany({
          where: {
            student_activity_id: {
              in: activities
                .filter((a) => a.status === "SUBMITTED")
                .map((a) => a.id),
            },
          },
        });

        // 4. upload ไฟล์ (ครั้งเดียว)
        const attachmentIds = await this.attachmentsService.createAttachments(
          {
            urls: data.urls,
            files: data.files,
          },
          `${data.section_id}/activity/${data.activity_id}/group-${data.group_id}`,
          { tx, uploads },
        );

        const allAttachmentIds = [
          ...(data.existing_files_ids ?? []),
          ...attachmentIds,
        ];

        // 5. update status + submitted_at ทุกคน
        await tx.student_activity.updateMany({
          where: {
            id: { in: activities.map((a) => a.id) },
          },
          data: {
            status: "SUBMITTED",
            submitted_at: new Date(),
          },
        });

        await tx.student_activity_group.updateMany({
          where: {
            id: data.group_id,
          },
          data: {
            status: "SUBMITTED",
          },
        });

        // 6. ผูก attachment ให้ทุกคน
        if (allAttachmentIds.length > 0) {
          await tx.student_activity_attachments.createMany({
            data: activities.flatMap((activity) =>
              allAttachmentIds.map((attId) => ({
                student_activity_id: activity.id,
                attachment_id: attId,
              })),
            ),
          });
        }

        // Only now: what the resubmission named again has just been linked back
        // for every member, so what is left unreferenced is what it replaced
        // (#34).
        const objects = await this.attachmentsService.deleteUnreferenced(
          activities.flatMap((activity) =>
            activity.student_activity_attachments.map(
              (link) => link.attachment_id,
            ),
          ),
          tx,
        );

        const result =
          await this.studentActivityService.getStudentActivityDetail(
            data.student_activity_id,
            tx,
          );

        return { result, objects };
      },
    );

    await this.uploadService.removeFiles(objects);

    return result;
  }

  async submitLearningActivity(
    data: SubmitLearningActivityBody,
  ): Promise<StudentLearningActivityDetailResp | undefined> {
    const { result, objects } = await transactionWithUploads(
      async (tx, uploads) => {
        const existingActivity = await tx.student_learning_activity.findUnique({
          where: { id: data.student_learning_activity_id },
          include: {
            student_learning_activity_attachments: true,
          },
        });

        if (!existingActivity) {
          throw SUBMISSION_NOT_FOUND();
        }

        if (existingActivity.student_id !== data.student_id) {
          throw NOT_YOUR_SUBMISSION();
        }

        // if (existingActivity.status === "SUBMITTED") {
        await tx.student_learning_activity_attachments.deleteMany({
          where: {
            student_learning_activity_id: existingActivity.id,
          },
        });
        // }

        const activity = await tx.student_learning_activity.update({
          where: { id: data.student_learning_activity_id },
          data: {
            status: "SUBMITTED",
            submitted_at: new Date(),
          },
        });

        const attachmentIds = await this.attachmentsService.createAttachments(
          {
            urls: data.urls,
            files: data.files,
          },
          `${data.section_id}/learning-activity/${data.learning_activity_id}/${data.student_id}`,
          { tx, uploads },
        );

        const allAttachmentsIds = [
          ...data.existing_files_ids,
          ...attachmentIds,
        ];
        if (allAttachmentsIds.length > 0) {
          await tx.student_learning_activity_attachments.createMany({
            data: allAttachmentsIds.map((attId) => ({
              student_learning_activity_id: activity.id,
              attachment_id: attId,
            })),
          });
        }

        // Only now: what the resubmission named again has just been linked back,
        // so what is left unreferenced is what it replaced (#34).
        const objects = await this.attachmentsService.deleteUnreferenced(
          existingActivity.student_learning_activity_attachments.map(
            (link) => link.attachment_id,
          ),
          tx,
        );

        const result =
          await this.studentLearningActivityService.getStudentLearningActivityDetail(
            data.student_learning_activity_id,
            tx,
          );

        return { result, objects };
      },
    );

    await this.uploadService.removeFiles(objects);

    return result;
  }

  async submitGroupLearningActivity(data: SubmitLearningActivityBody) {
    const { result, objects } = await transactionWithUploads(
      async (tx, uploads) => {
        // 1. ดึงสมาชิกในกลุ่ม
        const members =
          await tx.student_learning_activity_group_member.findMany({
            where: {
              group_id: data.group_id,
              status: "ACCEPT",
            },
            select: { student_id: true, student_learning_activity_id: true },
          });

        if (members.length === 0) {
          throw GROUP_HAS_NO_MEMBERS();
        }

        // Submitting for a group writes to every accepted member at once, so a
        // group the caller never joined is other people's work (#38).
        if (!members.some((m) => m.student_id === data.student_id)) {
          throw NOT_YOUR_GROUP();
        }

        const studentIds = members.map((m) => m.student_id);

        // 2. ดึง student_learning_activity ของทุกคน
        const activities = await tx.student_learning_activity.findMany({
          where: {
            learning_activity_id: data.learning_activity_id,
            student_id: { in: studentIds },
          },
          include: {
            student_learning_activity_attachments: true,
          },
        });

        if (activities.length === 0) {
          throw GROUP_HAS_NO_SUBMISSIONS();
        }

        // Being in the group is not enough on its own: the reply carries the
        // detail of whichever submission was named, so it has to be the caller's.
        const own = activities.find(
          (a) => a.id === data.student_learning_activity_id,
        );

        if (!own || own.student_id !== data.student_id) {
          throw NOT_YOUR_SUBMISSION();
        }

        // 3. ลบ attachment เดิม (ถ้าเคย submit)
        await tx.student_learning_activity_attachments.deleteMany({
          where: {
            student_learning_activity_id: {
              in: activities
                .filter((a) => a.status === "SUBMITTED")
                .map((a) => a.id),
            },
          },
        });

        // 4. upload ไฟล์ (ครั้งเดียว)
        const attachmentIds = await this.attachmentsService.createAttachments(
          {
            urls: data.urls,
            files: data.files,
          },
          `${data.section_id}/learning-activity/${data.learning_activity_id}/group-${data.group_id}`,
          { tx, uploads },
        );

        const allAttachmentIds = [
          ...(data.existing_files_ids ?? []),
          ...attachmentIds,
        ];

        // 5. update status + submitted_at ทุกคน
        await tx.student_learning_activity.updateMany({
          where: {
            id: { in: activities.map((a) => a.id) },
          },
          data: {
            status: "SUBMITTED",
            submitted_at: new Date(),
          },
        });

        await tx.student_learning_activity_group.updateMany({
          where: {
            id: data.group_id,
          },
          data: {
            status: "SUBMITTED",
          },
        });

        // 6. ผูก attachment ให้ทุกคน
        if (allAttachmentIds.length > 0) {
          await tx.student_learning_activity_attachments.createMany({
            data: activities.flatMap((activity) =>
              allAttachmentIds.map((attId) => ({
                student_learning_activity_id: activity.id,
                attachment_id: attId,
              })),
            ),
          });
        }

        // Only now: what the resubmission named again has just been linked back
        // for every member, so what is left unreferenced is what it replaced
        // (#34).
        const objects = await this.attachmentsService.deleteUnreferenced(
          activities.flatMap((activity) =>
            activity.student_learning_activity_attachments.map(
              (link) => link.attachment_id,
            ),
          ),
          tx,
        );

        const result =
          await this.studentLearningActivityService.getStudentLearningActivityDetail(
            data.student_learning_activity_id,
            tx,
          );

        return { result, objects };
      },
    );

    await this.uploadService.removeFiles(objects);

    return result;
  }

  /** `getCourseDetail` once per section the student is enrolled in this term,
   *  in date order, with the sections it could not resolve dropped. */
  async getStudentCourseList(
    student_id: string,
    semester: number,
    academic_year: string,
  ): Promise<CourseDetail[]> {
    const sections = await prisma.student_course.findMany({
      where: {
        student_id,
        course_sections: {
          semester_courses: {
            academic_year,
            semester,
          },
        },
      },
      orderBy: {
        section_id: "asc",
      },
      include: {
        course_sections: true,
      },
    });

    const result = await Promise.all(
      sections.map(async (section) => {
        const courseDetail = await this.courseService.getCourseDetail(
          section.section_id,
        );

        if (!courseDetail) return null;

        return {
          ...courseDetail,
        };
      }),
    );

    const courses = result.filter((course): course is CourseDetail => !!course);

    return sortByDate(courses);
  }

  async getStudentCourseClassworkList(
    student_id: string,
    section_id: number,
  ): Promise<ClassworkDetailResp> {
    const [activities, learningActivities, section, scoreRatios] =
      await Promise.all([
        this.studentActivityService.getAllStudentActivity(
          section_id,
          student_id,
        ),
        this.studentLearningActivityService.getAllStudentLearningActivity(
          section_id,
          student_id,
        ),

        prisma.course_sections.findUnique({
          where: { section_id },
          select: {
            semester_courses: {
              select: {
                subjects: {
                  select: { subject_name_en: true, subject_id: true },
                },
              },
            },
          },
        }),

        prisma.subject_score_ratio.findMany({
          where: { section_id },
          select: { score_ratio_id: true, score_category: true },
        }),
      ]);

    const ratioMap = new Map<number, string>();

    scoreRatios.forEach((r) =>
      ratioMap.set(r.score_ratio_id, r.score_category),
    );

    const subjectName =
      section?.semester_courses.subjects.subject_name_en || "";
    const subjectId = section?.semester_courses.subjects.subject_id || "";

    const allClassworks = await Promise.all([
      ...activities.map((act) =>
        this.studentMapper.mapGetAllStudentActivityToClassworkDetail(
          act,
          subjectName,
          subjectId,
        ),
      ),
      ...learningActivities.map((lact) =>
        this.studentMapper.mapGetAllStudentLearningActivityToClassworkDetail(
          lact,
          subjectName,
          subjectId,
        ),
      ),
    ]);

    return this.groupClassworks(allClassworks, ratioMap);
  }

  private groupClassworks(
    classworks: ClassworkDetail[],
    ratioMap: Map<number, string>,
  ): ClassworkDetailResp {
    const today: ClassworkDetail[] = [];
    const groups = new Map<string, ClassworkDetail[]>();

    for (const work of classworks) {
      if (this.isToday(work.date)) {
        today.push(work);
        continue;
      }

      const title = this.resolveGroupTitle(work, ratioMap);

      const list = groups.get(title) ?? [];
      list.push(work);
      groups.set(title, list);
    }

    return {
      today,
      other: Array.from(groups, ([title, classworks]) => ({
        title,
        classworks,
      })),
    };
  }

  // The dates are ISO strings now, which is what the caller reads (#68), so
  // the comparison is on the day the string already starts with rather than on
  // a Date built to be thrown away.
  private isToday = (date: string | null): boolean => {
    if (!date) return false;

    const today = new Date().toISOString().split("T")[0];
    return date.split("T")[0] === today;
  };

  private resolveGroupTitle = (
    work: ClassworkDetail,
    ratioMap: Map<number, string>,
  ): string => {
    if (work.category === "learning_activity") {
      return "กิจกรรมการเรียนรู้";
    }

    if (work.score_weight_id) {
      return ratioMap.get(work.score_weight_id) ?? "Unknown Category";
    }

    return "อื่น ๆ";
  };

  async getStudentAllClassworkList(
    student_id: string,
    semester: number,
    academic_year: string,
  ): Promise<AllClassworkDetailResp> {
    const studentCourses = await prisma.student_course.findMany({
      where: {
        student_id,
        course_sections: {
          semester_courses: {
            academic_year,
            semester,
          },
        },
      },
      select: { section_id: true },
    });

    const section_id_list = studentCourses.map((sc) => sc.section_id);

    if (section_id_list.length === 0) {
      return { late: [], this_week: [], upcoming: [], submitted: [] };
    }

    const [activities, learningActivities, sectionsInfo] = await Promise.all([
      this.studentActivityService.getAllStudentActivityBySectionIdList(
        section_id_list,
        student_id,
      ),

      this.studentLearningActivityService.getAllStudentLearningActivityBySectionIdList(
        section_id_list,
        student_id,
      ),

      prisma.course_sections.findMany({
        where: {
          section_id: { in: section_id_list },
        },

        select: {
          section_id: true,
          semester_courses: {
            select: {
              subjects: {
                select: { subject_name_en: true, subject_id: true },
              },
            },
          },
        },
      }),
    ]);

    const courseInfoMap = new Map<
      number,
      { name: string; subject_id: string }
    >();

    sectionsInfo.forEach((s) => {
      const subject = s.semester_courses.subjects;
      courseInfoMap.set(s.section_id, {
        name: subject.subject_name_en,
        subject_id: subject.subject_id,
      });
    });

    const response: AllClassworkDetailResp = {
      late: [],
      this_week: [],
      upcoming: [],
      submitted: [],
    };

    const week = this.getWeekRange();

    for (const item of activities) {
      const sectionId = item.section_id ?? 0;
      const courseInfo = courseInfoMap.get(sectionId);
      const courseName = courseInfo?.name || "";
      const subjectId = courseInfo?.subject_id || "";

      const detail =
        await this.studentMapper.mapGetAllStudentActivityToClassworkDetail(
          item,
          courseName,
          subjectId,
        );

      const bucket = this.classifyClasswork(detail, week);
      response[bucket].push(detail);
    }

    for (const item of learningActivities) {
      const sectionId = item.section_id ?? 0;
      const courseInfo = courseInfoMap.get(sectionId);
      const courseName = courseInfo?.name || "";
      const subjectId = courseInfo?.subject_id || "";

      const detail =
        await this.studentMapper.mapGetAllStudentLearningActivityToClassworkDetail(
          item,
          courseName,
          subjectId,
        );

      const bucket = this.classifyClasswork(detail, week);
      response[bucket].push(detail);
    }

    response.late.sort(this.sortByDate);
    response.this_week.sort(this.sortByDate);
    response.upcoming.sort(this.sortByDate);

    return response;
  }

  private sortByDate = (a: ClassworkDetail, b: ClassworkDetail) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  };

  private classifyClasswork = (
    work: ClassworkDetail,
    week: { monday: Date; sunday: Date; now: Date },
  ): keyof AllClassworkDetailResp => {
    if (!work.date) return "upcoming";

    const time = new Date(work.date).getTime();

    if (work.status !== "NOT_SUBMITTED") return "submitted";
    if (time < week.now.getTime()) return "late";
    if (time >= week.monday.getTime() && time <= week.sunday.getTime())
      return "this_week";

    return "upcoming";
  };

  async getEnrolledSubjects(student_id: string): Promise<EnrolledSubject[]> {
    const enrollments = await prisma.student_course.findMany({
      where: { student_id },
      select: {
        section_id: true,
        course_sections: {
          select: {
            semester_courses: {
              select: {
                subjects: {
                  select: {
                    subject_name_en: true,
                    subject_name_th: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { section_id: "asc" },
    });

    return enrollments.map((enrollment) => ({
      section_id: enrollment.section_id,
      subject_name_en:
        enrollment.course_sections.semester_courses.subjects.subject_name_en,
      subject_name_th:
        enrollment.course_sections.semester_courses.subjects.subject_name_th,
    }));
  }

  async getActivitiesBySectionId(
    section_id: number,
    student_id: string,
  ): Promise<SectionActivityOption[]> {
    const activities = await prisma.activities.findMany({
      where: { section_id },
      select: {
        id: true,
        activity_name: true,
        student_activity: {
          where: { student_id },
          select: {
            id: true,
            status: true,
            score: true,
            feedback: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    return activities.map((a) => {
      const sub = a.student_activity[0] ?? null;
      return {
        activity_id: a.id,
        activity_name: a.activity_name,
        student_activity_id: sub?.id ?? null,
        status: sub?.status ?? null,
        // Decimal(5,2) — a string on the wire if it is not converted (#33).
        score: sub?.score != null ? Number(sub.score) : null,
        feedback: sub?.feedback ?? null,
      };
    });
  }

  private getWeekRange = (base = new Date()) => {
    const now = new Date(base);

    const currentDay = now.getDay();
    const diffToMon = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);

    const monday = new Date(now);
    monday.setDate(diffToMon);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday, now };
  };

  /**
   * One submission, for the e-Portfolio's work picker.
   *
   * The `include` this used to carry went four tables deep —
   * `activities` → `subject_score_ratio` → `course_sections` →
   * `semester_courses` → `subjects`, every column of each — to reach the
   * subject that the `course` key below already names by a shorter road. The
   * row itself had no `select`, so `graded_by`, `created_at` and `updated_at`
   * went out with it. Neither was decided (ADR-0044 §1); what a caller reads is
   * the ten fields and two relations named here.
   */
  async getActivityDetailsByStudentActivityId(
    studentActivityId: number,
  ): Promise<SubmissionWithCourse | null> {
    const studentActivity = await prisma.student_activity.findUnique({
      where: { id: studentActivityId },
      select: {
        id: true,
        student_id: true,
        activity_id: true,
        status: true,
        score: true,
        feedback: true,
        submitted_at: true,
        graded_at: true,
        is_bookmark: true,
        remark: true,

        activities: {
          select: {
            id: true,
            activity_name: true,
            section_id: true,
          },
        },
      },
    });

    if (!studentActivity) return null;

    // score is Decimal(5,2) — a string on the wire unless it is converted
    // here (#33) — and the two dates are written out rather than left to
    // res.json, which calls the same toJSON() on the way past (#68).
    const submission = {
      ...studentActivity,
      score:
        studentActivity.score !== null ? Number(studentActivity.score) : null,
      submitted_at: studentActivity.submitted_at?.toISOString() ?? null,
      graded_at: studentActivity.graded_at?.toISOString() ?? null,
    };

    if (studentActivity.activities.section_id) {
      const section = await prisma.course_sections.findUnique({
        where: { section_id: studentActivity.activities.section_id },
        include: {
          semester_courses: {
            include: {
              subjects: true,
            },
          },
        },
      });

      if (section) {
        return {
          ...submission,
          course: {
            course_id: section.semester_courses.subjects.subject_id,
            course_name_en: section.semester_courses.subjects.subject_name_en,
            course_name_th: section.semester_courses.subjects.subject_name_th,
          },
        };
      }
    }

    return submission;
  }
}
