import prisma from "../config/prisma";
import {
  CreateCourseMaterialReqBody,
  GetCourseMaterialDetailResp,
} from "../models/course-material.model";
import AttachmentsService, {
  transactionWithUploads,
} from "./attachments.service";
import MinIOService from "./upload.service";

export default class CourseMaterialService {
  private readonly attachmentsService: AttachmentsService;
  private readonly uploadService: MinIOService;

  constructor() {
    this.attachmentsService = new AttachmentsService();
    this.uploadService = new MinIOService();
  }

  async createCourseMaterial(data: CreateCourseMaterialReqBody) {
    const folder = `course-material/${data.section_id}/${data.course_syllabus_id}`;

    // Two rounds of upload-then-link under one transaction, so a week that
    // does not exist takes back the lecture files as well as the recordings —
    // the foreign key on course_material only refuses once the attachments
    // have been made (#50).
    return transactionWithUploads(async (tx, uploads) => {
      if (data.lecture.urls.length > 0 || data.lecture.files.length > 0) {
        const attachmentIds = await this.attachmentsService.createAttachments(
          data.lecture,
          `${folder}/lecture`,
          tx,
          uploads,
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
          `${folder}/record`,
          tx,
          uploads,
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
    const objects = await prisma.$transaction(async (tx) => {
      // Unchanged: naming an attachment that is not there is still an error,
      // which the route answers as it always has.
      await tx.attachments.findUniqueOrThrow({ where: { attachment_id } });

      await tx.course_material.deleteMany({
        where: { attachment_id: attachment_id },
      });

      return this.attachmentsService.deleteUnreferenced([attachment_id], tx);
    });

    await this.uploadService.removeFiles(objects);
  }
}
