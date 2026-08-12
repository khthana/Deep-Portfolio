import { describe, expect, it } from "vitest";
import {
  GENERIC_ERROR_MESSAGE,
  apiErrorMessage,
  messageToShow,
} from "./api-error";

/**
 * Reading the sentence the API wrote for the user.
 *
 * Every rejection the API sends leaves in one envelope — `{ success: false,
 * message }` — and `message` is Thai, written to be shown as it is. Two things
 * stand between it and the screen, and these two functions are what each of
 * them uses: the axios interceptor, which puts the sentence where a thrown
 * error carries it, and the components, which have to decide what to show when
 * there is no sentence at all.
 *
 * The cases that matter are the ones where there is nothing to read. A network
 * that never reached the server, a body that is not JSON, a `message` that is
 * blank — each has to end at the caller's own words rather than at an empty
 * toast or the word "undefined".
 */

describe("apiErrorMessage", () => {
  it("returns the sentence the API sent", () => {
    expect(
      apiErrorMessage({
        response: {
          status: 400,
          data: {
            success: false,
            message: "กิจกรรมนี้ยังไม่ได้เลือกประเภทสัดส่วนคะแนน",
          },
        },
      }),
    ).toBe("กิจกรรมนี้ยังไม่ได้เลือกประเภทสัดส่วนคะแนน");
  });

  it("returns nothing when the request never reached the server", () => {
    // What axios throws when the network is down: a real error, with a
    // `request` and no `response` at all.
    expect(apiErrorMessage({ request: {}, message: "Network Error" })).toBe(
      undefined,
    );
  });

  it("returns nothing when the body carries no message", () => {
    expect(apiErrorMessage({ response: { status: 502, data: {} } })).toBe(
      undefined,
    );
    expect(apiErrorMessage({ response: { status: 502 } })).toBe(undefined);
  });

  it("returns nothing when the body is not the envelope", () => {
    // A proxy's HTML error page, or a download route answering with a Blob —
    // neither has a `message`, and neither may be shown to anybody.
    expect(
      apiErrorMessage({ response: { data: "<html>502 Bad Gateway</html>" } }),
    ).toBe(undefined);
    expect(apiErrorMessage({ response: { data: { message: 500 } } })).toBe(
      undefined,
    );
  });

  it("treats a blank message as no message", () => {
    expect(apiErrorMessage({ response: { data: { message: "   " } } })).toBe(
      undefined,
    );
  });

  it("returns nothing for a value that is not an error object", () => {
    expect(apiErrorMessage(null)).toBe(undefined);
    expect(apiErrorMessage(undefined)).toBe(undefined);
    expect(apiErrorMessage("ผิดพลาด")).toBe(undefined);
  });
});

describe("messageToShow", () => {
  it("prefers the sentence in the response body", () => {
    // A component that caught an axios error itself, without a thunk in
    // between. `message` is axios's own and says nothing a user can act on.
    expect(
      messageToShow({
        message: "Request failed with status code 400",
        response: { data: { message: "ไม่พบกิจกรรมที่ต้องการ" } },
      }),
    ).toBe("ไม่พบกิจกรรมที่ต้องการ");
  });

  it("reads the message off what a rejected thunk throws", () => {
    // `unwrap()` throws a `SerializedError` — a plain object, not an Error,
    // and with no response on it. The sentence is there because the
    // interceptor put it on the error the thunk failed with.
    expect(
      messageToShow({ name: "Error", message: "ไม่พบกิจกรรมที่ต้องการ" }),
    ).toBe("ไม่พบกิจกรรมที่ต้องการ");
  });

  it("falls back to the caller's own words when there is no sentence", () => {
    expect(
      messageToShow(
        { request: {} },
        "ไม่สามารถเพิ่มกิจกรรมได้ กรุณาลองใหม่อีกครั้ง",
      ),
    ).toBe("ไม่สามารถเพิ่มกิจกรรมได้ กรุณาลองใหม่อีกครั้ง");
  });

  it("falls back for a message that is blank or not a string", () => {
    expect(messageToShow({ message: "  " }, "ลบไม่สำเร็จ")).toBe("ลบไม่สำเร็จ");
    expect(messageToShow({ message: 42 }, "ลบไม่สำเร็จ")).toBe("ลบไม่สำเร็จ");
  });

  it("falls back to the generic sentence when the caller gave none", () => {
    expect(messageToShow(null)).toBe(GENERIC_ERROR_MESSAGE);
  });

  it("has a generic sentence that is Thai", () => {
    // The point of the whole exercise: what the user is shown is a sentence
    // somebody wrote for them, in the language the rest of the screen is in.
    expect(GENERIC_ERROR_MESSAGE).toMatch(/[฀-๿]/);
  });
});
