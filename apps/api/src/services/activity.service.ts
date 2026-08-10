import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "../config/prisma";
import {
  GetActivityDetailResp,
  CreateActivityReqBody,
  GetAllActivityList,
  UpdateActivityReqBody,
} from "../models/activity.model";
import { AttachmentDetailResp } from "../models/announcement.model";
import { ClassworkType } from "../models/student.model";
import { HttpError } from "../utils/http-error";
import AttachmentsService from "./attachments.service";
import MinIOService from "./upload.service";

/** The ids of the criteria the teacher kept — the ones that came back carrying
 *  the id `GET /activity` gave them. A criterion with no id is a new one. */
const keptRubricIds = (rubric: UpdateActivityReqBody["rubric"]) =>
  rubric.flatMap((criterion) =>
    criterion.id === undefined ? [] : [criterion.id],
  );

/**
 * Refuse a rubric that names criteria this activity was never given.
 *
 * A criterion id arrives in the body, and an id says nothing about which
 * activity it belongs to, so writing to one unchecked would let a save on one
 * activity rewrite another's rubric — `PUT /activity` is among the routes
 * ADR-0002 lists as having no ownership check on them at all. The same id sent
 * twice is refused as well: both entries would be written onto the one row, and
 * the teacher would come away with one criterion fewer than the form showed
 * them.
 *
 * Answered `400`, not the `403` of `assertOwnSkills` in
 * portfolio-skill.service.ts. There the question is whose the row is and the
 * answer is a permission; here any teacher may edit the activity, and what is
 * wrong is the rubric itself, naming criteria that are not part of it.
 */
function assertOwnRubric(
  rubric: UpdateActivityReqBody["rubric"],
  existingIds: ReadonlySet<number>,
) {
  const sentIds = keptRubricIds(rubric);

  if (new Set(sentIds).size < sentIds.length) {
    throw new HttpError(400, "มีเกณฑ์เดียวกันถูกส่งมาซ้ำ");
  }

  if (sentIds.some((id) => !existingIds.has(id))) {
    throw new HttpError(400, "มีเกณฑ์บางรายการที่ไม่ใช่ของกิจกรรมนี้");
  }
}

export default class ActivityService {
  private readonly attachmentsService: AttachmentsService;
  private readonly uploadService: MinIOService;

  constructor() {
    this.attachmentsService = new AttachmentsService();
    this.uploadService = new MinIOService();
  }

  async createActivity(data: CreateActivityReqBody) {
    return prisma.$transaction(async (tx) => {
      const activity = await tx.activities.create({
        data: {
          announcement_date: data.announcement_date,
          deadline_date: data.deadline_date,
          course_syllabus_id: data.course_syllabus_id,
          activity_name: data.activity_name,
          score_number: data.score_number,
          activity_type: data.activity_type.toLowerCase(),
          detail: data.detail,
          is_average_score: data.is_average_score,
          is_self_assessment: data.is_self_assessment,
          section_id: data.section_id,
          expected_level: data.expected_level,
          subject_score_ratio: data.score_ratio_id
            ? { connect: { score_ratio_id: data.score_ratio_id } }
            : undefined,
        },
      });

      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: data.urls,
          files: data.files,
        },
        "activity",
      );

      if (attachmentIds.length > 0) {
        await tx.activity_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            activity_id: activity.id,
            attachment_id: attId,
          })),
        });
      }

      // Nothing to reconcile against: the activity was made a moment ago, so
      // every criterion in the body is a new one.
      await this.saveRubric(tx, activity.id, data.rubric, new Set<number>());

      const studentIds = await tx.student_course.findMany({
        where: { section_id: data.section_id },
        select: { student_id: true },
      });

      if (studentIds.length > 0) {
        await tx.student_activity.createMany({
          data: studentIds.map((student) => ({
            student_id: student.student_id,
            activity_id: activity.id,
          })),
        });
      }

      return activity;
    });
  }

  async updateActivity(data: UpdateActivityReqBody) {
    const { activity, objects } = await prisma.$transaction(async (tx) => {
      // Asked before anything is written, because not everything below rolls
      // back: createAttachments uploads to MinIO and writes its rows outside
      // this transaction, so a refusal after it would leave both behind.
      const existingRubricIds = await this.rubricIdsOf(tx, data.activity_id);
      assertOwnRubric(data.rubric, existingRubricIds);

      const activity = await tx.activities.update({
        where: { id: data.activity_id },
        data: {
          announcement_date: data.announcement_date,
          deadline_date: data.deadline_date,
          course_syllabus_id: data.course_syllabus_id,
          activity_name: data.activity_name,
          score_number: data.score_number,
          activity_type: data.activity_type.toLowerCase(),
          detail: data.detail,
          is_average_score: data.is_average_score,
          is_self_assessment: data.is_self_assessment,
          section_id: data.section_id,
          expected_level: data.expected_level,
          subject_score_ratio: data.score_ratio_id
            ? { connect: { score_ratio_id: data.score_ratio_id } }
            : undefined,
        },
      });

      // Scoped by the activity being edited: the id of an attachment says
      // nothing about who owns it, and matching on it alone unlinked the file
      // from every other activity that had it too. See BEHAVIOR-CHANGES.md.
      await tx.activity_attachments.deleteMany({
        where: {
          activity_id: activity.id,
          attachment_id: { in: data.remove_attachment_ids },
        },
      });

      // A join row is what makes an attachment reachable. Dropping the last
      // one strands it, so it goes with the link (#34).
      const objects = await this.attachmentsService.deleteUnreferenced(
        data.remove_attachment_ids,
        tx,
      );

      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: data.urls,
          files: data.files,
        },
        "activity",
      );

      if (attachmentIds.length > 0) {
        await tx.activity_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            activity_id: activity.id,
            attachment_id: attId,
          })),
        });
      }

      await this.saveRubric(tx, activity.id, data.rubric, existingRubricIds);

      return { activity, objects };
    });

    await this.uploadService.removeFiles(objects);

    return activity;
  }

  /** The ids of the criteria an activity has as it stands — what an incoming
   *  rubric is checked against, and then reconciled against. */
  private async rubricIdsOf(
    tx: Prisma.TransactionClient,
    activity_id: number,
  ): Promise<ReadonlySet<number>> {
    const existing = await tx.rubric_activity_mapping.findMany({
      where: { activity_id },
      select: { id: true },
    });

    return new Set(existing.map((criterion) => criterion.id));
  }

  /**
   * Bring an activity's rubric to what the teacher just sent, criterion by
   * criterion.
   *
   * Every save used to delete the whole rubric and write it again.
   * `student_activity_rubric_score` hangs off the criterion with ON DELETE
   * CASCADE, so that threw away every mark the activity had ever been given —
   * for a change of deadline as readily as a change of rubric (#25).
   *
   * A criterion the teacher kept comes back carrying the id GET /activity gave
   * it, and is written over in place, which is what lets the marks against it
   * stand. One with no id is new. One whose id does not come back is gone, and
   * takes its marks with it, because that is what deleting a criterion means.
   * Creating an activity is the same job with nothing to keep, which is why
   * `createActivity` comes through here too, with an empty `existingIds`.
   *
   * The ids are `assertOwnRubric`'s to check; `existingIds` is what they were
   * checked against, handed on so it is not read twice.
   *
   * What is not repaired here is the total: `student_activity.score` was worked
   * out from a rubric that has since changed, and nothing recalculates it. That
   * was true before #25 as well — it is the teacher's to fix by marking again.
   */
  private async saveRubric(
    tx: Prisma.TransactionClient,
    activity_id: number,
    rubric: UpdateActivityReqBody["rubric"],
    existingIds: ReadonlySet<number>,
  ) {
    const keptIds = new Set(keptRubricIds(rubric));
    const removedIds = [...existingIds].filter((id) => !keptIds.has(id));

    if (removedIds.length > 0) {
      await tx.rubric_activity_mapping.deleteMany({
        where: { id: { in: removedIds } },
      });
    }

    for (const criterion of rubric) {
      if (criterion.id === undefined) {
        const created = await tx.rubric_activity_mapping.create({
          data: {
            activity_id,
            criteria: criterion.criteria,
            weight: criterion.weight,
          },
        });

        await tx.rubric_levels.createMany({
          data: criterion.levels.map((level) => ({
            rubric_id: created.id,
            level_no: level.level_no,
            description: level.description,
          })),
        });

        continue;
      }

      await tx.rubric_activity_mapping.update({
        where: { id: criterion.id },
        data: { criteria: criterion.criteria, weight: criterion.weight },
      });

      await this.saveRubricLevels(tx, criterion.id, criterion.levels);
    }
  }

  /**
   * The same reconciliation one level down, keyed on `level_no`.
   *
   * The levels of a criterion have no id of their own in the form — the table
   * is drawn a column per level and the teacher writes in the cells — so
   * `level_no` is what identifies one, which the database agrees with: it is
   * unique per criterion. A level that survives keeps its row, and with it the
   * marks given at it.
   *
   * Which is right only as far as `level_no` stays put, and it does not:
   * deleting a column renumbers the ones under it (`deleteScoreColumn` in
   * rubric-form.tsx), so a mark given at level 3 of four stays on the row now
   * numbered 3 and comes to read as whatever the teacher wrote a level up.
   * Pinned rather than fixed — the form has no level ids to send back, and
   * giving it some changes what GET /activity returns. See BEHAVIOR-CHANGES.md.
   */
  private async saveRubricLevels(
    tx: Prisma.TransactionClient,
    rubric_id: number,
    levels: UpdateActivityReqBody["rubric"][number]["levels"],
  ) {
    const existing = await tx.rubric_levels.findMany({
      where: { rubric_id },
      select: { id: true, level_no: true },
    });

    const kept = new Set(levels.map((level) => level.level_no));
    const removedIds = existing
      .filter((level) => !kept.has(level.level_no))
      .map((level) => level.id);

    if (removedIds.length > 0) {
      // A mark names the level it was given, and that foreign key does not
      // cascade — the level cannot go while the mark still points at it. The
      // mark goes first: a level the teacher deleted is not one anybody can be
      // said to have reached.
      await tx.student_activity_rubric_score.deleteMany({
        where: { rubric_level_id: { in: removedIds } },
      });

      await tx.rubric_levels.deleteMany({ where: { id: { in: removedIds } } });
    }

    for (const level of levels) {
      await tx.rubric_levels.upsert({
        where: { rubric_id_level_no: { rubric_id, level_no: level.level_no } },
        create: {
          rubric_id,
          level_no: level.level_no,
          description: level.description,
        },
        update: { description: level.description },
      });
    }
  }

  async getAllActivity(section_id: number): Promise<GetAllActivityList[]> {
    const allActivity = await prisma.activities.findMany({
      where: { section_id: section_id },
      select: {
        id: true,
        activity_name: true,
        activity_type: true,
        score_ratio_id: true,
        deadline_date: true,
        announcement_date: true,
        section_id: true,
      },
      orderBy: { id: "asc" },
    });

    const result = await Promise.all(
      allActivity.map(async (activity) => {
        const scoreRatio = await prisma.subject_score_ratio.findUnique({
          where: { score_ratio_id: activity.score_ratio_id ?? 0 },
          select: {
            score_ratio_id: true,
            sequence_order: true,
            score_category: true,
            weight: true,
            section_id: true,
          },
        });

        const studentCount = await prisma.student_activity.findMany({
          where: { activity_id: activity.id },
        });

        const submittedCount = studentCount.filter(
          (student) => student.status !== "NOT_SUBMITTED",
        );
        const pendingGradingCount = studentCount.filter(
          (student) =>
            student.status === "SUBMITTED" || student.status === "GRADING",
        );

        // const attachments = await this.getAllAttachments(activity.id);

        return {
          ...activity,
          subject_score_ratio: scoreRatio,
          student_count: studentCount.length,
          submitted_count: submittedCount.length,
          pending_grading_count: pendingGradingCount.length,
          // attachments,
          activity_type: activity.activity_type.toUpperCase(),
        } as GetAllActivityList;
      }),
    );

    return result;
  }

  async getActivityDetail(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<GetActivityDetailResp | undefined> {
    const prismaClient = tx ?? prisma;

    const activity = await prismaClient.activities.findUnique({
      where: { id },
      include: {
        rubric_activity_mapping: {
          include: {
            rubric_levels: true,
          },
        },
        subject_score_ratio: true,
      },
    });

    if (!activity) return;

    const attachments = await this.getAllAttachments(activity.id, tx);

    return {
      ...activity,
      activity_id: activity.id,
      activity_type: activity.activity_type.toUpperCase() as ClassworkType,
      attachments,
    } as GetActivityDetailResp;
  }

  async getAllAttachments(
    activity_id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<AttachmentDetailResp> {
    const prismaClient = tx ?? prisma;

    const attachmentsIds = await prismaClient.activity_attachments.findMany({
      where: { activity_id: activity_id },
      select: { attachment_id: true },
    });

    const activity_attachments =
      await this.attachmentsService.getAttachments(attachmentsIds);

    return activity_attachments;
  }

  async getActivityOptions(section_id: number) {
    const activities = await prisma.activities.findMany({
      where: { section_id: section_id },
      orderBy: { id: "asc" },
    });

    return activities.map((activity) => ({
      value: activity.id,
      label: activity.activity_name,
    }));
  }

  async deleteActivity(activity_id: number) {
    const { result, objects } = await prisma.$transaction(async (tx) => {
      // Both sides of the work hang off this row — what the teacher handed out
      // and what the students handed in — and deleting it cascades every join
      // row away, so read them while they are still there (#34).
      const handedOut = await tx.activity_attachments.findMany({
        where: { activity_id },
        select: { attachment_id: true },
      });
      const handedIn = await tx.student_activity_attachments.findMany({
        where: { student_activity: { activity_id } },
        select: { attachment_id: true },
      });

      const result = await tx.activities.delete({
        where: { id: activity_id },
      });

      return {
        result,
        objects: await this.attachmentsService.deleteUnreferenced(
          [...handedOut, ...handedIn].map((link) => link.attachment_id),
          tx,
        ),
      };
    });

    await this.uploadService.removeFiles(objects);

    return result;
  }
}
