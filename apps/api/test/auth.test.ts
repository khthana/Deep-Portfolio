import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import { createStudent, createTeacher, createUser } from "./factories";
import { refreshCookie, sessionCookie } from "./helpers/session";
import { useFakeIdentityProvider } from "./helpers/identity";

/**
 * The auth middleware and the endpoints that hand out its cookies.
 *
 * Every route in the application sits behind one of the two middlewares
 * exercised here, so this file is what the rest of the suite is relying on when
 * it sets a cookie and expects to be let in. It uses two real routes as the
 * subject — GET /auth for requireUser, GET /user/student and GET /course/list
 * for requireRole — because a middleware tested in isolation proves nothing
 * about whether it was actually mounted.
 */

/** The attributes of one Set-Cookie header, as the browser would read them. */
function setCookie(response: request.Response, name: string) {
  const header = response.headers["set-cookie"] as unknown as
    | string[]
    | undefined;
  const raw = (header ?? []).find((cookie) => cookie.startsWith(`${name}=`));

  if (!raw) {
    return undefined;
  }

  const [pair, ...attributes] = raw.split("; ");
  const parsed: Record<string, string> = {};

  for (const attribute of attributes) {
    const [key, value = ""] = attribute.split("=");
    parsed[key.toLowerCase()] = value;
  }

  return {
    value: pair.slice(name.length + 1),
    /** Absent means the cookie is host-only, which is the default here. */
    domain: parsed.domain,
    path: parsed.path,
    sameSite: parsed.samesite,
    expires: parsed.expires,
  };
}

describe("requireUser", () => {
  it("rejects a request with no cookie", async () => {
    const response = await request(app).get("/auth");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("rejects a token signed with the wrong secret", async () => {
    // The point of signing rather than stubbing: this is the case a mocked
    // middleware could never fail on. The user in it is real, so the only
    // reason to refuse is the signature.
    const user = await createUser();

    const response = await request(app)
      .get("/auth")
      .set(
        "Cookie",
        sessionCookie({
          userId: user.user_id,
          secret: "a-different-secret-entirely",
        }),
      );

    expect(response.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const user = await createUser();

    const response = await request(app)
      .get("/auth")
      .set("Cookie", sessionCookie({ userId: user.user_id, expiresIn: "-1s" }));

    expect(response.status).toBe(401);
  });

  it("rejects a valid token for a user who does not exist", async () => {
    // A signature only proves this server minted the token. Whether the account
    // it names is still there is a separate question, and this is the one the
    // middleware used to skip.
    const response = await request(app)
      .get("/auth")
      .set("Cookie", sessionCookie({ userId: "99999999" }));

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("lets a real user through, whatever roles they hold", async () => {
    // No role at all: requireUser asks who you are, not what you may do.
    const user = await createUser({
      title_th: "อ.",
      first_name_th: "สมชาย",
      last_name_th: "ใจดี",
    });

    const response = await request(app)
      .get("/auth")
      .set("Cookie", sessionCookie({ userId: user.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      user_id: user.user_id,
      email: user.email,
      name: "อ. สมชาย ใจดี",
      roles: [],
    });
  });

  it("reports the active roles of a user who has them", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .get("/auth")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data.roles).toEqual(["TEACHER"]);
  });
});

describe("requireRole", () => {
  it("rejects a request with no cookie", async () => {
    const response = await request(app).get("/user/student");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("rejects a token signed with the wrong secret", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/user/student")
      .set(
        "Cookie",
        sessionCookie({
          userId: student.student_id,
          secret: "a-different-secret-entirely",
        }),
      );

    expect(response.status).toBe(401);
  });

  it("refuses a valid session that lacks the role", async () => {
    // Authenticated is not authorised, and the token does not get a vote: the
    // claim below says STUDENT and the middleware reads user_roles anyway.
    const teacher = await createTeacher();

    const response = await request(app)
      .get("/user/student")
      .set(
        "Cookie",
        sessionCookie({ userId: teacher.user_id, role: "STUDENT" }),
      );

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "สิทธิ์การเข้าถึงเฉพาะนักศึกษาเท่านั้น",
    });
  });

  it("refuses a role that has been deactivated", async () => {
    // is_active is how a role is taken away — the row stays for the audit
    // trail. A middleware that only checked the row's existence would keep
    // letting this person in.
    const teacher = await createTeacher();

    await prisma.user_roles.updateMany({
      where: { user_id: teacher.user_id, role_id: "TEACHER" },
      data: { is_active: false },
    });

    const response = await request(app)
      .get("/course/list")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });
  });

  it("admits a user holding the role", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .get("/course/list")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
  });

  it("names the role it wanted, per role", async () => {
    // The two messages come from one middleware now. This is what stops the
    // consolidation from quietly replacing them with one generic sentence.
    const student = await createStudent();

    const response = await request(app)
      .get("/course/list")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });
  });
});

/**
 * One fake for the whole file. The override lives in module scope, so a second
 * one installed per describe would replace the first at collection time and
 * take its registered tokens with it.
 */
const google = useFakeIdentityProvider();

describe("POST /auth/google", () => {
  it("refuses a request with no credential", async () => {
    const response = await request(app).post("/auth/google").send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "ไม่พบข้อมูลการเข้าสู่ระบบจาก Google",
    });
  });

  it("refuses a credential Google does not recognise", async () => {
    // Expired, tampered with, or issued for a different OAuth client — the
    // provider collapses all of them to "no", and so does the response.
    const response = await request(app)
      .post("/auth/google")
      .send({ credential: "a-token-nobody-issued" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "ยืนยันตัวตนกับ Google ไม่สำเร็จ",
    });
  });

  it("refuses a verified email that is not in users, without creating one", async () => {
    // The acceptance criterion this file exists for. A Google account proves
    // who you are; it does not make you a member of this university. user_id is
    // a VarChar(8) issued elsewhere, so there is nothing to auto-create.
    const stranger = "not-a-member@example.test";
    const credential = google.issue("token-for-a-stranger", stranger);

    const response = await request(app)
      .post("/auth/google")
      .send({ credential });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "ไม่พบบัญชีผู้ใช้ของอีเมลนี้ในระบบ กรุณาติดต่อผู้ดูแลระบบ",
    });

    // No session, and no account quietly conjured up on the way past.
    expect(response.headers["set-cookie"]).toBeUndefined();
    expect(
      await prisma.users.findFirst({ where: { email: stranger } }),
    ).toBeNull();
  });

  it("issues a session the rest of the API accepts", async () => {
    const teacher = await createTeacher();
    const credential = google.issue("token-for-a-teacher", teacher.email);

    const login = await request(app).post("/auth/google").send({ credential });

    expect(login.status).toBe(200);

    const access = setCookie(login, "access_token");
    expect(access).toBeDefined();
    expect(setCookie(login, "refresh_token")).toBeDefined();

    // End to end rather than by inspecting the payload: the cookie is only
    // worth anything if a protected route takes it.
    const profile = await request(app)
      .get("/auth")
      .set("Cookie", `access_token=${access?.value}`);

    expect(profile.status).toBe(200);
    expect(profile.body.data.user_id).toBe(teacher.user_id);
  });

  it("still reads roles from user_roles, not from the login", async () => {
    // Nothing about the identity provider says what anyone may do. The token
    // minted below carries no role at all, and requireRole lets this request
    // through because the database says TEACHER.
    const teacher = await createTeacher();
    const credential = google.issue("token-for-a-role-holder", teacher.email);

    const login = await request(app).post("/auth/google").send({ credential });
    const access = setCookie(login, "access_token");

    const courses = await request(app)
      .get("/course/list")
      .set("Cookie", `access_token=${access?.value}`);

    expect(courses.status).toBe(200);
  });

  it("matches the email regardless of case", async () => {
    // Google hands back a lower-cased address; imported user rows keep whatever
    // capitalisation the source had. An account that exists must not be
    // unreachable over a difference nobody can see.
    const teacher = await createTeacher({ email: "Somchai.J@Example.test" });
    const credential = google.issue(
      "token-for-a-capitalised-address",
      "Somchai.J@Example.test",
    );

    const login = await request(app).post("/auth/google").send({ credential });

    expect(login.status).toBe(200);
    expect(setCookie(login, "access_token")).toBeDefined();
    expect(teacher.email).toBe("Somchai.J@Example.test");
  });

  it("scopes the session cookies to the whole API", async () => {
    const teacher = await createTeacher();
    const credential = google.issue("token-for-cookie-scope", teacher.email);

    const login = await request(app).post("/auth/google").send({ credential });

    for (const name of ["access_token", "refresh_token"]) {
      const cookie = setCookie(login, name);

      expect(cookie?.path).toBe("/");
      // COOKIE_DOMAIN is unset in this suite, so the cookies are host-only.
      expect(cookie?.domain).toBeUndefined();
    }
  });
});

describe("POST /auth/logout", () => {
  it("clears the session cookies with the attributes they were set with", async () => {
    // The bug this is here for: a cookie is identified by name, domain and
    // path, so clearing it on a different domain expires nothing and leaves the
    // live session in place. Comparing the two responses is the only way to
    // catch the two sides drifting apart again.
    const teacher = await createTeacher();
    const credential = google.issue("token-for-a-logout", teacher.email);

    const login = await request(app).post("/auth/google").send({ credential });

    const logout = await request(app).post("/auth/logout");

    expect(logout.status).toBe(200);

    for (const name of ["access_token", "refresh_token"]) {
      const set = setCookie(login, name);
      const cleared = setCookie(logout, name);

      expect(cleared).toBeDefined();
      expect(cleared?.domain).toBe(set?.domain);
      expect(cleared?.path).toBe(set?.path);
      expect(cleared?.sameSite).toBe(set?.sameSite);

      // An empty value with an expiry in the past is how a cookie is deleted.
      expect(cleared?.value).toBe("");
      expect(new Date(cleared?.expires ?? "").getTime()).toBeLessThan(
        Date.now(),
      );
    }
  });
});

describe("POST /auth/refresh", () => {
  it("refuses a request with no refresh cookie", async () => {
    const response = await request(app).post("/auth/refresh");

    expect(response.status).toBe(401);
  });

  it("refuses a refresh token signed with the wrong secret", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .post("/auth/refresh")
      .set(
        "Cookie",
        refreshCookie({
          userId: teacher.user_id,
          secret: "not-the-refresh-secret",
        }),
      );

    expect(response.status).toBe(401);
  });

  it("issues an access token that works on the rest of the API", async () => {
    // The regression: the replacement cookie used to be set without a path, so
    // it landed scoped to /auth/refresh and was never sent anywhere else — the
    // caller was refreshed into a session it could not use.
    const teacher = await createTeacher();

    const response = await request(app)
      .post("/auth/refresh")
      .set("Cookie", refreshCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);

    const access = setCookie(response, "access_token");
    expect(access?.path).toBe("/");

    const courses = await request(app)
      .get("/course/list")
      .set("Cookie", `access_token=${access?.value}`);

    expect(courses.status).toBe(200);
  });
});
