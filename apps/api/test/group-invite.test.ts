import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import { createActivityGroup, createLearningActivityGroup } from "./factories";

/**
 * Answering a group invitation — /group.
 *
 * These two endpoints are reached from a link in an email, by someone who is
 * not necessarily signed in to the system at the time, so neither carries a
 * session check. The invite token is the whole of the authorisation: whoever
 * holds it can answer for the student it was issued to. That is a deliberate
 * design in the original — the token is 32 random bytes with a seven-day
 * expiry — and not something this suite changes.
 *
 * `type` picks which of the two parallel tables to look in. Every case here
 * runs against both, because "activity" and anything else are separate code
 * paths that were written twice.
 */

describe("POST /group/validate-invite", () => {
  it("reports the current status of an activity invite", async () => {
    const group = await createActivityGroup({
      members: [{}, { invite_token: "validate-activity" }],
    });

    const response = await request(app)
      .post("/group/validate-invite")
      .send({ token: "validate-activity", type: "activity" });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ status: "PENDING" });

    // Read-only: asking about an invite must not answer it. Read the rows back
    // rather than trusting what the factory returned, or the case would pass
    // whatever the endpoint did to them.
    const members = await prisma.student_activity_group_member.findMany({
      where: { group_id: group.id },
      orderBy: { id: "asc" },
    });
    expect(members.map((member) => member.status)).toEqual([
      "ACCEPT",
      "PENDING",
    ]);
  });

  it("reports the current status of a learning-activity invite", async () => {
    await createLearningActivityGroup({
      members: [{}, { invite_token: "validate-learning", status: "ACCEPT" }],
    });

    const response = await request(app)
      .post("/group/validate-invite")
      .send({ token: "validate-learning", type: "learning-activity" });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ status: "ACCEPT" });
  });

  it("refuses a request with no token", async () => {
    const response = await request(app)
      .post("/group/validate-invite")
      .send({ type: "activity" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "ต้องระบุ Token" });
  });

  it("refuses a token that belongs to nobody", async () => {
    const response = await request(app)
      .post("/group/validate-invite")
      .send({ token: "not-a-token-anyone-was-given", type: "activity" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe(
      "โทเค็นคำเชิญไม่ถูกต้องหรือหมดอายุแล้ว",
    );
  });

  it("refuses an expired token", async () => {
    await createActivityGroup({
      members: [
        {},
        { invite_token: "expired-token", token_expiry: new Date("2020-01-01") },
      ],
    });

    const response = await request(app)
      .post("/group/validate-invite")
      .send({ token: "expired-token", type: "activity" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe(
      "โทเค็นคำเชิญไม่ถูกต้องหรือหมดอายุแล้ว",
    );
  });

  it("does not answer an activity token asked about as a learning one", async () => {
    // The two tables have separate token spaces. Sending the wrong `type` is
    // the same as sending a token that does not exist.
    await createActivityGroup({
      members: [{}, { invite_token: "activity-side-token" }],
    });

    const response = await request(app)
      .post("/group/validate-invite")
      .send({ token: "activity-side-token", type: "learning-activity" });

    expect(response.status).toBe(500);
  });
});

describe("POST /group/accept-invite", () => {
  it("accepts an invitation to an activity group", async () => {
    const group = await createActivityGroup({
      members: [{}, { invite_token: "accept-activity" }],
    });
    const invited = group.student_activity_group_member[1];

    const response = await request(app)
      .post("/group/accept-invite")
      .send({ token: "accept-activity", action: "ACCEPT", type: "activity" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "เข้าร่วมกลุ่มสำเร็จ",
    });

    expect(
      await prisma.student_activity_group_member.findUniqueOrThrow({
        where: { id: invited.id },
      }),
    ).toMatchObject({ status: "ACCEPT" });
  });

  it("records a refusal without removing the member from the group", async () => {
    const group = await createActivityGroup({
      members: [{}, { invite_token: "reject-activity" }],
    });
    const invited = group.student_activity_group_member[1];

    const response = await request(app)
      .post("/group/accept-invite")
      .send({
        token: "reject-activity",
        action: "REJECTED",
        type: "activity",
      });

    expect(response.status).toBe(200);
    expect(
      await prisma.student_activity_group_member.findUniqueOrThrow({
        where: { id: invited.id },
      }),
    ).toMatchObject({ status: "REJECTED", group_id: group.id });
  });

  it("accepts an invitation to a learning-activity group", async () => {
    const group = await createLearningActivityGroup({
      members: [{}, { invite_token: "accept-learning" }],
    });
    const invited = group.student_learning_activity_group_member[1];

    const response = await request(app)
      .post("/group/accept-invite")
      .send({
        token: "accept-learning",
        action: "ACCEPT",
        type: "learning-activity",
      });

    expect(response.status).toBe(200);
    expect(
      await prisma.student_learning_activity_group_member.findUniqueOrThrow({
        where: { id: invited.id },
      }),
    ).toMatchObject({ status: "ACCEPT" });
  });

  it("refuses a request with no token", async () => {
    const response = await request(app)
      .post("/group/accept-invite")
      .send({ action: "ACCEPT", type: "activity" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "ต้องระบุ Token" });
  });

  it("refuses an expired token, leaving the invitation unanswered", async () => {
    const group = await createActivityGroup({
      members: [
        {},
        {
          invite_token: "expired-on-accept",
          token_expiry: new Date("2020-01-01"),
        },
      ],
    });
    const invited = group.student_activity_group_member[1];

    const response = await request(app)
      .post("/group/accept-invite")
      .send({
        token: "expired-on-accept",
        action: "ACCEPT",
        type: "activity",
      });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe(
      "โทเค็นคำเชิญไม่ถูกต้องหรือหมดอายุแล้ว",
    );
    expect(
      await prisma.student_activity_group_member.findUniqueOrThrow({
        where: { id: invited.id },
      }),
    ).toMatchObject({ status: "PENDING" });
  });

  it("writes whatever action it is given", async () => {
    // Recorded, not endorsed. `action` goes into the status column unchecked,
    // so a caller can put the member back to PENDING after accepting, and a
    // value the enum does not have is a 500 from Postgres rather than a 400.
    // Request validation is #20's job; the point here is that this endpoint
    // does none of its own.
    const group = await createActivityGroup({
      members: [{}, { invite_token: "any-action", status: "ACCEPT" }],
    });
    const invited = group.student_activity_group_member[1];

    const response = await request(app)
      .post("/group/accept-invite")
      .send({ token: "any-action", action: "PENDING", type: "activity" });

    expect(response.status).toBe(200);
    expect(
      await prisma.student_activity_group_member.findUniqueOrThrow({
        where: { id: invited.id },
      }),
    ).toMatchObject({ status: "PENDING" });
  });
});
