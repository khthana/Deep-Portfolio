import prisma from "../config/prisma";
import type { AttachmentDetailResp } from "@deep-portfolio/api-types";
import {
  AnnouncementDetailResp,
  CreateAnnouncementReqBody,
} from "../models/announcement.model";
import AttachmentsService, {
  transactionWithUploads,
} from "./attachments.service";
import MinIOService from "./upload.service";

export default class AnnouncementService {
  private readonly uploadService: MinIOService;
  private readonly attachmentsService: AttachmentsService;

  constructor() {
    this.uploadService = new MinIOService();
    this.attachmentsService = new AttachmentsService();
  }

  async createAnnouncement(
    data: CreateAnnouncementReqBody,
  ): Promise<{ announcement_id: number }> {
    return transactionWithUploads(async (tx, uploads) => {
      let targetSectionIds = [data.section_id];

      if (data.all_section) {
        // "Every section" means every section of this course that this teacher
        // teaches — not every section of the course. The fan-out used to read
        // course_sections_teacher for *any* teacher of the named section and
        // then post to all the course's sections, which handed a teacher of
        // one section the noticeboard of a colleague's (#30, ADR-0002).
        const named = await tx.course_sections.findUnique({
          where: { section_id: data.section_id },
          select: { semester_course_id: true },
        });

        if (named) {
          const mine = await tx.course_sections_teacher.findMany({
            where: {
              user_id: data.created_by,
              course_sections: {
                semester_course_id: named.semester_course_id,
              },
            },
            select: { section_id: true },
            orderBy: { section_id: "asc" },
          });

          targetSectionIds = mine
            .map((row) => row.section_id)
            .filter((id): id is number => id !== null);
        }
      }

      // One set of attachments serves every section the announcement fans out
      // to, so the rows have to live or die with the whole fan-out (#50).
      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: data.urls,
          files: data.files,
        },
        "announcements",
        { tx, uploads },
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
    section_id: number,
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
          announcement.announcement_id,
        );
        return {
          ...announcement,
          attachments,
        } as AnnouncementDetailResp;
      }),
    );

    return result;
  }

  async getAllAttachments(
    announcement_id: number,
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
