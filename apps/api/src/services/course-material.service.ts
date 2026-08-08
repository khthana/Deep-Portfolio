import prisma from "../config/prisma";
import {
  CreateCourseMaterialReqBody,
  GetCourseMaterialDetailResp,
} from "../models/course-material.model";
import AttachmentsService from "./attachments.service";

export default class CourseMaterialService {
  private readonly attachmentsService: AttachmentsService;

  constructor() {
    this.attachmentsService = new AttachmentsService();
  }

  async createCourseMaterial(data: CreateCourseMaterialReqBody) {
    return prisma.$transaction(async (tx) => {
      if (data.lecture.urls.length > 0 || data.lecture.files.length > 0) {
        console.log("data.lecture.urls : ", data.lecture.urls);
        const attachmentIds = await this.attachmentsService.createAttachments(
          data.lecture,
          `course-material/${data.section_id}/${data.course_syllabus_id}/lecture`,
        );

        if (attachmentIds.length > 0) {
          await tx.course_material.createMany({
            data: attachmentIds.map((attId) => ({
              course_syllabus_id: data.course_syllabus_id,
              attachment_id: attId,
              type: "LECTURE",
            })),
          });
        }
      }

      if (data.record.urls.length > 0 || data.record.files.length > 0) {
        const attachmentIds = await this.attachmentsService.createAttachments(
          data.record,
          `course-material/${data.section_id}/${data.course_syllabus_id}/record`,
        );

        if (attachmentIds.length > 0) {
          await tx.course_material.createMany({
            data: attachmentIds.map((attId) => ({
              course_syllabus_id: data.course_syllabus_id,
              attachment_id: attId,
              type: "RECORD",
            })),
          });
        }
      }
    });
  }

  async getCourseMaterial(
    section_id: number,
  ): Promise<GetCourseMaterialDetailResp[] | null> {
    const courseSyllabus = await prisma.course_syllabus.findMany({
      where: { section_id: section_id },
      orderBy: { week_no: "asc" },
      select: {
        id: true,
        week_no: true,
        title: true,

        course_material: {
          select: {
            id: true,
            attachment_id: true,
            type: true,
          },
        },
      },
    });

    const allAttachmentIds = courseSyllabus
      .flatMap((syllabus) => syllabus.course_material)
      .map((material) => ({
        attachment_id: material.attachment_id,
      }));

    const allAttachments =
      await this.attachmentsService.getAttachments(allAttachmentIds);

    const result = courseSyllabus.map((syllabus) => {
      const lectureIds = syllabus.course_material
        .filter((m) => m.type === "LECTURE")
        .map((m) => m.attachment_id);

      const recordIds = syllabus.course_material
        .filter((m) => m.type === "RECORD")
        .map((m) => m.attachment_id);

      const lectureAttachments = {
        file: allAttachments.file.filter((f) =>
          lectureIds.includes(f.attachment_id),
        ),
        url: allAttachments.url.filter((u) =>
          lectureIds.includes(u.attachment_id),
        ),
      };

      const recordAttachments = {
        file: allAttachments.file.filter((f) =>
          recordIds.includes(f.attachment_id),
        ),
        url: allAttachments.url.filter((u) =>
          recordIds.includes(u.attachment_id),
        ),
      };

      return {
        course_syllabus_id: syllabus.id,
        week_no: syllabus.week_no,
        title: syllabus.title,
        course_materials: {
          lecture: lectureAttachments,
          record: recordAttachments,
        },
      };
    }) as GetCourseMaterialDetailResp[];

    return result;
  }

  async deleteCourseMaterial(attachment_id: number) {
    return prisma.$transaction(async (tx) => {
      await tx.course_material.deleteMany({
        where: { attachment_id: attachment_id },
      });

      await tx.attachments.delete({
        where: { attachment_id: attachment_id },
      });
    });
  }

  //   async deleteCourseMaterial(course_material_id: number) {
  //     return prisma.$transaction(async (tx) => {
  //       const courseMaterial = await tx.course_material.findUnique({
  //         where: { id: course_material_id },
  //         select: { attachment_id: true },
  //       });

  //       await tx.course_material.delete({
  //         where: { id: course_material_id },
  //       });

  //       await tx.attachments.delete({
  //         where: { attachment_id: courseMaterial?.attachment_id },
  //       });
  //     });
  //   }
}
