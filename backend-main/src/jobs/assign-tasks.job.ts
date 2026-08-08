import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function setupAssignTasksCron() {
  cron.schedule("0 0 * * *", async () => {
    console.log("⏳ เริ่มทำงาน: ตรวจสอบผู้เรียนใหม่และ Assign งาน...");

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const newStudentCourses = await prisma.student_course.findMany({
        where: {
          created_at: {
            gte: yesterday,
          },
        },
      });

      if (newStudentCourses.length === 0) {
        console.log("ไม่มีผู้เรียนใหม่ในระบบ");
        return;
      }

      console.log(`🔍 พบผู้เรียนใหม่จำนวน ${newStudentCourses.length} รายการ`);

      const newStudentActivities: any[] = [];
      const newStudentLearningActivities: any[] = [];

      for (const sc of newStudentCourses) {
        const activities = await prisma.activities.findMany({
          where: {
            section_id: sc.section_id,
          },
          select: { id: true },
        });

        if (activities.length > 0) {
          const existingActivities = await prisma.student_activity.findMany({
            where: {
              student_id: sc.student_id,
              activity_id: { in: activities.map((a) => a.id) },
            },
            select: { activity_id: true },
          });

          const existingActivityIds = existingActivities.map(
            (e) => e.activity_id,
          );

          const activitiesToAssign = activities.filter(
            (a) => !existingActivityIds.includes(a.id),
          );

          for (const act of activitiesToAssign) {
            newStudentActivities.push({
              student_id: sc.student_id,
              activity_id: act.id,
              status: "NOT_SUBMITTED",
            });
          }
        }

        const learningActivities = await prisma.learning_activities.findMany({
          where: {
            section_id: sc.section_id,
          },
          select: { id: true },
        });

        if (learningActivities.length > 0) {
          const existingLearningActivities =
            await prisma.student_learning_activity.findMany({
              where: {
                student_id: sc.student_id,
                learning_activity_id: {
                  in: learningActivities.map((la) => la.id),
                },
              },
              select: { learning_activity_id: true },
            });

          const existingLearningActivityIds = existingLearningActivities.map(
            (e) => e.learning_activity_id,
          );

          const learningActivitiesToAssign = learningActivities.filter(
            (la) => !existingLearningActivityIds.includes(la.id),
          );

          for (const lact of learningActivitiesToAssign) {
            newStudentLearningActivities.push({
              student_id: sc.student_id,
              learning_activity_id: lact.id,
              status: "NOT_SUBMITTED",
            });
          }
        }
      }

      if (newStudentActivities.length > 0) {
        const resultAct = await prisma.student_activity.createMany({
          data: newStudentActivities,
        });
        console.log(`Assign Activities สำเร็จ ${resultAct.count} รายการ`);
      } else {
        console.log(
          "ไม่มี Activities ใหม่ที่ต้อง Assign (ผู้เรียนมีข้อมูลครบแล้ว)",
        );
      }

      if (newStudentLearningActivities.length > 0) {
        const resultLAct = await prisma.student_learning_activity.createMany({
          data: newStudentLearningActivities,
        });
        console.log(
          `Assign Learning Activities สำเร็จ ${resultLAct.count} รายการ`,
        );
      } else {
        console.log(
          "ไม่มี Learning Activities ใหม่ที่ต้อง Assign (ผู้เรียนมีข้อมูลครบแล้ว)",
        );
      }

      console.log("อัปเดตข้อมูลผู้เรียนใหม่เสร็จสิ้น");
    } catch (error) {
      console.error("เกิดข้อผิดพลาดใน Cron Job:", error);
    }
  });
}
