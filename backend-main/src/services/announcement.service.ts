import prisma from "../config/prisma";
import {
  AnnouncementDetailResp,
  AttachmentDetailResp,
  CreateAnnouncementReqBody,
  FileDetail,
  URLDetail,
} from "../models/announcement.model";
import { formatFileType } from "../utils/format-file-type";
import AttachmentsService from "./attachments.service";
import MinIOService from "./upload.service";

export default class AnnouncementService {
  private readonly uploadService: MinIOService;
  private readonly attachmentsService: AttachmentsService;

  constructor() {
    this.uploadService = new MinIOService();
    this.attachmentsService = new AttachmentsService();
  }

  async createAnnouncement(
    data: CreateAnnouncementReqBody
  ): Promise<{ announcement_id: number }> {
    return prisma.$transaction(async (tx) => {
      let targetSectionIds = [data.section_id];

      if (data.all_section) {
        const section = await tx.course_sections_teacher.findFirst({
          where: { section_id: data.section_id },
        });

        if (section) {
          const sectionInSameCourse = await tx.course_sections.findMany({
            where: { semester_course_id: section.semester_course_id },
          });
          targetSectionIds = sectionInSameCourse.map((s) => s.section_id);
        }
      }

      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: data.urls,
          files: data.files,
        },
        "announcements"
      );

      let firstAnnouncementId: number | null = null;

      for (const sectionId of targetSectionIds) {
        const announcement = await tx.announcements.create({
          data: {
            title: data.title,
            content: data.content,
            created_by: data.created_by,
            section_id: sectionId,
          },
        });

        if (!firstAnnouncementId) {
          firstAnnouncementId = announcement.announcement_id;
        }

        if (attachmentIds.length > 0) {
          await tx.announcement_attachments.createMany({
            data: attachmentIds.map((attId) => ({
              announcement_id: announcement.announcement_id,
              attachment_id: attId,
            })),
          });
        }
      }

      return { announcement_id: firstAnnouncementId! };
    });
  }
  //-----------------------------------

  async getAnnouncements(
    section_id: number
  ): Promise<AnnouncementDetailResp[]> {
    const announcements = await prisma.announcements.findMany({
      where: {
        section_id: section_id,
      },
      orderBy: { updated_at: "desc" },
    });

    const result: AnnouncementDetailResp[] = await Promise.all(
      announcements.map(async (announcement) => {
        const attachments = await this.getAllAttachments(
          announcement.announcement_id
        );
        return {
          ...announcement,
          attachments,
        } as AnnouncementDetailResp;
      })
    );

    return result;
  }

  async getAllAttachments(
    announcement_id: number
  ): Promise<AttachmentDetailResp> {
    const attachmentsIds = await prisma.announcement_attachments.findMany({
      where: { announcement_id },
      select: { attachment_id: true },
    });

    const announcement_attachments =
      this.attachmentsService.getAttachments(attachmentsIds);

    return announcement_attachments;
  }
}
