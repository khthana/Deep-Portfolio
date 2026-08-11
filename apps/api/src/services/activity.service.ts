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

/** A level as it stands in the database: what it is, and where in the scale it
 *  currently sits. */
type ExistingLevel = { id: number; level_no: number };

/** An activity's rubric as it stands, criterion id to the levels hanging off
 *  it — what the rubric in the body is reconciled against. */
type ExistingRubric = ReadonlyMap<number, ExistingLevel[]>;

/** The ids the sender declared, from rows that may or may not carry one — the
 *  criteria the teacher kept, or the levels within one. A row with no id is a
 *  new one, and drops out here. */
const declaredIds = (rows: readonly { id?: number }[]) =>
  rows.flatMap((row) => (row.id === undefined ? [] : [row.id]));

/** The levels the criterion a level was sent under already has. A criterion
 *  with no id of its own is a new one, and has none. */
const levelIdsOf = (existing: ExistingRubric, criterion_id?: number) =>
  new Set(
    (criterion_id === undefined ? [] : (existing.get(criterion_id) ?? [])).map(
      (level) => level.id,
    ),
  );

/**
 * Refuse a rubric no endpoint could write as it was sent.
 *
 * `level_no` is unique per criterion, so two levels sent at one position cannot
 * both exist. Before the levels had ids the second quietly wrote over the
 * first, and the teacher came away with one level fewer than the form showed
 * them; now the two would collide on the constraint (#39). Creating an activity
 * and updating one are alike in this, so both go through here.
 */
function assertRubricPositions(
  rubric: readonly { levels: readonly { level_no: number }[] }[],
) {
  for (const criterion of rubric) {
    const positions = criterion.levels.map((level) => level.level_no);

    if (new Set(positions).size < positions.length) {
      throw new HttpError(400, "มีระดับคะแนนซ้ำลำดับกันในเกณฑ์เดียวกัน");
    }
  }
}

/**
 * Refuse a rubric that names criteria this activity was never given, or levels
 * the criterion they are sent under was never given.
 *
 * A criterion id arrives in the body, and an id says nothing about which
 * activity it belongs to, so writing to one unchecked would let a save on one
 * activity rewrite another's rubric — `PUT /activity` is among the routes
 * ADR-0002 lists as having no ownership check on them at all. The same id sent
 * twice is refused as well: both entries would be written onto the one row, and
 * the teacher would come away with one criterion fewer than the form showed
 * them.
 *
 * Both hold one level down (#39), against the levels of the criterion the level
 * was sent under — a level id belongs to its criterion, not to the activity, so
 * a criterion with no id of its own has no levels yet and any id sent under it
 * is somebody else's.
 *
 * Answered `400`, not the `403` of `assertOwnSkills` in
 * portfolio-skill.service.ts. There the question is whose the row is and the
 * answer is a permission; here any teacher may edit the activity, and what is
 * wrong is the rubric itself, naming criteria that are not part of it.
 */
function assertOwnRubric(
  rubric: UpdateActivityReqBody["rubric"],
  existing: ExistingRubric,
) {
  assertRubricPositions(rubric);

  const sentIds = declaredIds(rubric);

  if (new Set(sentIds).size < sentIds.length) {
    throw new HttpError(400, "มีเกณฑ์เดียวกันถูกส่งมาซ้ำ");
  }

  if (sentIds.some((id) => !existing.has(id))) {
    throw new HttpError(400, "มีเกณฑ์บางรายการที่ไม่ใช่ของกิจกรรมนี้");
  }

  for (const criterion of rubric) {
    assertOwnLevels(criterion.levels, levelIdsOf(existing, criterion.id));
  }
}

function assertOwnLevels(
  levels: UpdateActivityReqBody["rubric"][number]["levels"],
  existingIds: ReadonlySet<number>,
) {
  const sentIds = declaredIds(levels);

  if (new Set(sentIds).size < sentIds.length) {
    throw new HttpError(400, "มีระดับคะแนนเดียวกันถูกส่งมาซ้ำ");
  }

  if (sentIds.some((id) => !existingIds.has(id))) {
    throw new HttpError(400, "มีระดับคะแนนบางรายการที่ไม่ใช่ของเกณฑ์นี้");
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
      // Asked before anything is written, for the reason updateActivity gives
      // below: createAttachments does not roll back with this transaction.
      assertRubricPositions(data.rubric);

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
      await this.saveRubric(tx, activity.id, data.rubric, new Map());

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
      const existingRubric = await this.rubricOf(tx, data.activity_id);
      assertOwnRubric(data.rubric, existingRubric);

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

      await this.saveRubric(tx, activity.id, data.rubric, existingRubric);

      return { activity, objects };
    });

    await this.uploadService.removeFiles(objects);

    return activity;
  }

  /** The rubric an activity has as it stands, down to the levels — what an
   *  incoming rubric is checked against, and then reconciled against. Read once
   *  and handed on, so both jobs work from the one picture. */
  private async rubricOf(
    tx: Prisma.TransactionClient,
    activity_id: number,
  ): Promise<ExistingRubric> {
    const existing = await tx.rubric_activity_mapping.findMany({
      where: { activity_id },
      select: {
        id: true,
        rubric_levels: { select: { id: true, level_no: true } },
      },
    });

    return new Map(
      existing.map((criterion) => [criterion.id, criterion.rubric_levels]),
    );
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
   * The ids are `assertOwnRubric`'s to check; `existing` is what they were
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
    existing: ExistingRubric,
  ) {
    const keptIds = new Set(declaredIds(rubric));
    const removedIds = [...existing.keys()].filter((id) => !keptIds.has(id));

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

      await this.saveRubricLevels(
        tx,
        criterion.id,
        criterion.levels,
        existing.get(criterion.id) ?? [],
      );
    }
  }

  /**
   * The same reconciliation one level down, keyed on the level's own id.
   *
   * It used to be keyed on `level_no`, which the database agrees is unique per
   * criterion — but unique is not the same as fixed. `level_no` is a position,
   * and deleting a column in the edit form renumbers the ones under it
   * (`deleteScoreColumn` in rubric-form.tsx). So a mark given at level 3 of
   * four stayed on the row now numbered 3, and came to read as whatever the
   * teacher had written a level up: the mark said something nobody had said
   * (#39, ADR-0010). The form now sends each level back with its id, and the id
   * is what says which level a row is.
   *
   * A level with no id is matched on `level_no` against a row no id claimed,
   * and failing that is created. That fallback is what keeps every caller
   * written before the ids working: a rubric sent back level-for-level with no
   * ids at all reconciles exactly as it did, and only the case the ids were
   * added for — a scale whose order changed — needs them.
   *
   * The writing is in two passes when anything moved, because `level_no` is
   * unique per criterion and a renumber walks through positions that are still
   * taken: level 3 becoming level 2 collides with the level 2 that has not been
   * moved off it yet. So every kept row is parked above the top of the scale
   * first, and only then given the number it is going to keep.
   */
  private async saveRubricLevels(
    tx: Prisma.TransactionClient,
    rubric_id: number,
    levels: UpdateActivityReqBody["rubric"][number]["levels"],
    existing: readonly ExistingLevel[],
  ) {
    const claimedIds = new Set(declaredIds(levels));
    const unclaimedByPosition = new Map(
      existing
        .filter((level) => !claimedIds.has(level.id))
        .map((level) => [level.level_no, level.id]),
    );

    // Each incoming level and the row it is going to be written to, or none if
    // there is no such row and it has to be created.
    const assignments = levels.map((level) => ({
      level,
      id: level.id ?? unclaimedByPosition.get(level.level_no),
    }));

    const keptIds = new Set(declaredIds(assignments));
    const removedIds = existing
      .filter((level) => !keptIds.has(level.id))
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

    const positionOf = new Map(
      existing.map((level) => [level.id, level.level_no]),
    );
    const moved = assignments.some(
      (write) =>
        write.id !== undefined &&
        positionOf.get(write.id) !== write.level.level_no,
    );

    if (moved) {
      const aboveTheScale =
        1 +
        Math.max(
          ...existing.map((level) => level.level_no),
          ...levels.map((level) => level.level_no),
        );

      for (const [index, write] of assignments.entries()) {
        if (write.id === undefined) continue;

        await tx.rubric_levels.update({
          where: { id: write.id },
          data: { level_no: aboveTheScale + index },
        });
      }
    }

    for (const write of assignments) {
      if (write.id === undefined) {
        await tx.rubric_levels.create({
          data: {
            rubric_id,
            level_no: write.level.level_no,
            description: write.level.description,
          },
        });

        continue;
      }

      await tx.rubric_levels.update({
        where: { id: write.id },
        data: {
          level_no: write.level.level_no,
          description: write.level.description,
        },
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
