import prisma from "../config/prisma";
import StudentMapper from "../mappers/student.mapper";
import {
  AllClassworkDetailResp,
  CalendarClassworkEvent,
  CalendarCourseEvent,
  CalendarEventResp,
  ClassworkDetail,
  ClassworkDetailResp,
  SubmitActivityBody,
  SubmitLearningActivityBody,
} from "../models/student.model";
import ActivityService from "./activity.service";
import AttachmentsService from "./attachments.service";
import CourseService from "./course.service";
import LearningActivityService from "./learning-activity.service";
import StudentActivityService from "./student-activity.service";
import StudentLearningActivityService from "./student-learning-activity.service";
import { CourseDetail } from "../models/course.model";
import { sortByDate } from "../utils/sort-by-date";
import { checkIsOverAnnouncementDate } from "../utils/check-announcement-date";
import { GetStudentActivityDetailResp } from "../models/student-activity.model";
import { GetLearningActivityDetailResp } from "../models/learning-activity.model";
import { GetStudentLearningActivityDetailResp } from "../models/student-learning-activity.model";

export default class StudentService {
  private readonly courseService: CourseService;
  private readonly attachmentsService: AttachmentsService;
  private readonly studentActivityService: StudentActivityService;
  private readonly studentLearningActivityService: StudentLearningActivityService;
  private readonly learningActivityService: LearningActivityService;

  private readonly studentMapper: StudentMapper;

  constructor() {
    this.courseService = new CourseService();
    this.attachmentsService = new AttachmentsService();
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

    const calendarActivities = activities.map(
      (c) =>
        (checkIsOverAnnouncementDate(c.activities.announcement_date) && {
          id: c.id,
          name: c.activities.activity_name,
          deadline_date: c.activities.deadline_date,
          type: c.activities.activity_type,
          status: c.status,
          course: studentCourses.find(
            (sc) => sc.section_id === c.activities.section_id,
          )?.course_name_en,
        }) as CalendarClassworkEvent,
    );

    const calendarLearningActivities = learningActivities.map(
      (c) =>
        (checkIsOverAnnouncementDate(
          c.learning_activities.announcement_date,
        ) && {
          id: c.id,
          name: c.learning_activities.learning_activity_name,
          deadline_date: c.learning_activities.deadline_date,
          type: c.learning_activities.learning_activity_type,
          status: c.status,
          course: studentCourses.find(
            (sc) => sc.section_id === c.learning_activities.section_id,
          )?.course_name_en,
        }) as CalendarClassworkEvent,
    );

    const courses = studentCourses.map(
      (sc) =>
        ({
          id: sc.section_id,
          name: sc.course_name_en,
          // start_date: sc.course_sections.start_date,
          // end_date: sc.course_sections.end_date,
          day_of_week: sc.day_of_week,
          start_time: sc.start_time,
          end_time: sc.end_time,
          classroom: sc.classroom,
        }) as CalendarCourseEvent,
    );

    return {
      activities: calendarActivities,
      learning_activities: calendarLearningActivities,
      courses: courses,
    };
  }

  async getStudentInSec(section_id: number) {
    const students = await prisma.student_course.findMany({
      where: { section_id: section_id },
      orderBy: { student_id: "asc" },
    });

    const result = await Promise.all(
      students.map(async (student) => {
        const result = await prisma.student.findUnique({
          where: { student_id: student.student_id },
        });

        return {
          ...result,
        };
      }),
    );

    return result;
  }

  async submitActivity(
    data: SubmitActivityBody,
  ): Promise<GetStudentActivityDetailResp> {
    return prisma.$transaction(async (tx) => {
      // 1. ดึง activity พร้อม attachments เดิม
      const activity = await tx.student_activity.findUnique({
        where: { id: data.student_activity_id },
        include: {
          student_activity_attachments: true,
        },
      });

      if (!activity) {
        throw new Error("Student activity not found");
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
        tx,
      );

      const allAttachmentsIds = [...data.existing_files_ids, ...attachmentIds];

      if (allAttachmentsIds.length > 0) {
        await tx.student_activity_attachments.createMany({
          data: allAttachmentsIds.map((attId) => ({
            student_activity_id: updatedActivity.id,
            attachment_id: attId,
          })),
        });
      }

      const result = await this.studentActivityService.getStudentActivityDetail(
        updatedActivity.id,
        tx,
      );

      return result;
    });
  }

  async submitGroupActivity(
    data: SubmitActivityBody,
  ): Promise<GetStudentActivityDetailResp> {
    return prisma.$transaction(async (tx) => {
      // 1. ดึงสมาชิกในกลุ่ม
      const members = await tx.student_activity_group_member.findMany({
        where: {
          group_id: data.group_id,
          status: "ACCEPT",
        },
        select: { student_id: true, student_activity_id: true },
      });

      if (members.length === 0) {
        throw new Error("Group has no accepted members");
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
        throw new Error("Student activities not found");
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
        tx,
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

      const result = await this.studentActivityService.getStudentActivityDetail(
        data.student_activity_id,
        tx,
      );

      return result;
    });
  }

  async submitLearningActivity(
    data: SubmitLearningActivityBody,
  ): Promise<GetStudentLearningActivityDetailResp> {
    return prisma.$transaction(async (tx) => {
      const existingActivity = await tx.student_learning_activity.findUnique({
        where: { id: data.student_learning_activity_id },
        include: {
          student_learning_activity_attachments: true,
        },
      });

      if (!existingActivity) {
        throw new Error("student_learning_activity not found");
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
        tx,
      );

      const allAttachmentsIds = [...data.existing_files_ids, ...attachmentIds];
      if (allAttachmentsIds.length > 0) {
        await tx.student_learning_activity_attachments.createMany({
          data: allAttachmentsIds.map((attId) => ({
            student_learning_activity_id: activity.id,
            attachment_id: attId,
          })),
        });
      }

      const result =
        await this.studentLearningActivityService.getStudentLearningActivityDetail(
          data.student_learning_activity_id,
          tx,
        );

      return result;
    });
  }

  async submitGroupLearningActivity(data: SubmitLearningActivityBody) {
    return prisma.$transaction(async (tx) => {
      // 1. ดึงสมาชิกในกลุ่ม
      const members = await tx.student_learning_activity_group_member.findMany({
        where: {
          group_id: data.group_id,
          status: "ACCEPT",
        },
        select: { student_id: true, student_learning_activity_id: true },
      });

      if (members.length === 0) {
        throw new Error("Group has no accepted members");
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
        throw new Error("Student activities not found");
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
        tx,
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

      const result =
        await this.studentLearningActivityService.getStudentLearningActivityDetail(
          data.student_learning_activity_id,
          tx,
        );

      return result;
    });
  }

  async getStudentCourseList(
    student_id: string,
    semester: number,
    academic_year: string,
  ) {
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

  private isToday = (date: Date | null): boolean => {
    if (!date) return false;

    const today = new Date().toISOString().split("T")[0];
    const dateStr = date.toISOString().split("T")[0];
    return dateStr === today;
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

    const time = work.date.getTime();

    if (work.status !== "NOT_SUBMITTED") return "submitted";
    if (time < week.now.getTime()) return "late";
    if (time >= week.monday.getTime() && time <= week.sunday.getTime())
      return "this_week";

    return "upcoming";
  };

  async getEnrolledSubjects(student_id: string) {
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

  async getActivitiesBySectionId(section_id: number, student_id: string) {
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
        score: sub?.score ?? null,
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

  async getActivityDetailsByStudentActivityId(studentActivityId: number) {
    const studentActivity = await prisma.student_activity.findUnique({
      where: { id: studentActivityId },
      include: {
        activities: {
          include: {
            subject_score_ratio: {
              include: {
                course_sections: {
                  include: {
                    semester_courses: {
                      include: {
                        subjects: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (studentActivity && studentActivity.activities.section_id) {
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
          ...studentActivity,
          course: {
            course_id: section.semester_courses.subjects.subject_id,
            course_name_en: section.semester_courses.subjects.subject_name_en,
            course_name_th: section.semester_courses.subjects.subject_name_th,
          },
        };
      }
    }

    return studentActivity;
  }
}
