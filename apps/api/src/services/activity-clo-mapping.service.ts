import prisma from "../config/prisma";
import { CreateActivityCLOMappingBodyReq } from "../models/activity-clo-mapping.model";
import { HttpError } from "../utils/http-error";

/**
 * The three ways an activity can turn out not to be mappable, and what the
 * teacher is told about each (#43, ADR-0015).
 *
 * They used to reach the caller as 500s two different ways: one hand-written
 * `Error("Activity not found")` covering both the missing activity and the
 * scoreless one, and — for the activity with no category — no throw at all, just
 * a `?? 0` that wrote an id owning no row and left Postgres to refuse it. All
 * three said "the server failed" about a request that was well formed and about
 * a database that was intact.
 */
const NOT_FOUND = () => new HttpError(404, "ไม่พบกิจกรรมที่ต้องการ");

const NO_SCORE_CATEGORY = () =>
  new HttpError(400, "กิจกรรมนี้ยังไม่ได้เลือกประเภทสัดส่วนคะแนน");

const NO_SCORE = () =>
  new HttpError(400, "กิจกรรมนี้ยังไม่มีคะแนนให้แบ่งตามผลการเรียนรู้");

export default class ActivityCLOMappingService {
  async createActivityCLOMapping(data: CreateActivityCLOMappingBodyReq) {
    const activity = await prisma.activities.findUnique({
      where: { id: data.activity_id },
    });

    if (!activity) throw NOT_FOUND();

    // Asked in this order because an activity can be short of both, and the
    // category is the one the mapping's own column needs — the score only
    // decides what the mapping is worth.
    if (!activity.score_ratio_id) throw NO_SCORE_CATEGORY();

    // Zero counts as no score: `score_number` defaults to 0, so an activity
    // nobody has put a mark against arrives worth nothing, and there is as
    // little to divide between CLOs as there is when the column is null.
    if (!activity.score_number) throw NO_SCORE();

    // Counted only once the activity is known to be mappable — the three
    // refusals above write nothing, so there is no sequence to reserve.
    const lastSequence = await prisma.activity_clo_mapping.aggregate({
      where: {
        activity_id: data.activity_id,
      },
      _max: {
        sequence_order: true,
      },
    });

    const nextSequence = (lastSequence._max.sequence_order ?? 0) + 1;

    const score = activity.score_number * (data.weight / 100);

    const result = await prisma.activity_clo_mapping.create({
      data: {
        activity_id: data.activity_id,
        weight: data.weight,
        clo_id: data.clo_id,
        sequence_order: nextSequence,
        score: score,
        score_ratio_id: activity.score_ratio_id,
      },
    });

    // The created row is the response, and score is Decimal(5,2) — a string on
    // the wire unless it is converted here (#33).
    return { ...result, score: Number(result.score) };
  }

  async getActivity(clo_id: number) {
    const activities = await prisma.activity_clo_mapping.findMany({
      where: { clo_id: clo_id },
      orderBy: { sequence_order: "asc" },
    });

    const result = await Promise.all(
      activities.map(async (activity) => {
        const activityDetail = await prisma.activities.findUnique({
          where: { id: activity.activity_id },
        });

        const rubric = await prisma.rubric_activity_mapping.findFirst({
          where: { activity_id: activity.activity_id },
        });

        // Guarded rather than relying on `rubric?.id`: an undefined value in a
        // where clause means "do not filter on this column" to Prisma, not
        // "match nothing", so an activity with no rubric used to be answered
        // with the highest level number in the whole table — some other
        // activity's rubric.
        const rubric_level = rubric
          ? await prisma.rubric_levels.aggregate({
              where: {
                rubric_id: rubric.id,
              },
              _max: {
                level_no: true,
              },
            })
          : null;

        return {
          ...activityDetail,
          level_no: rubric_level?._max.level_no ?? null,
          weight: activity.weight,
        };
      }),
    );

    return result;
  }

  async validateActivityCLOMapping(activity_id: number): Promise<boolean> {
    const activities = await prisma.activity_clo_mapping.findMany({
      where: { activity_id: activity_id },
    });

    return activities.length > 0;
  }
}
