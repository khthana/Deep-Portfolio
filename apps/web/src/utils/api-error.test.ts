import { describe, expect, it } from "vitest";
import {
  GENERIC_ERROR_MESSAGE,
  messageToCarry,
  messageToShow,
} from "./api-error";

/**
 * Getting the sentence the API wrote for the user onto the user's screen.
 *
 * Every rejection the API sends leaves in one envelope — `{ success: false,
 * message }` — and `message` is Thai, written to be shown as it is. Two things
 * stand between it and the screen, and these two functions are what each of
 * them uses: the axios interceptor, which puts the sentence where a thrown
 * error still carries it, and the components, which have to decide what to show
 * when there is no sentence at all.
 *
 * The cases that matter are the ones where there is nothing to read. A network
 * that never reached the server, a body that is not JSON, a `message` that is
 * blank — each has to end at the caller's own words rather than at an empty
 * toast, the word "undefined", or a line of English axios wrote for a
 * developer.
 */

/** The errors axios really throws, as it builds them. `Network Error` and the
 *  status line are `AxiosError`'s own wording; the response is present only
 *  when one arrived. */
const axiosError = {
  networkDown: {
    name: "AxiosError",
    message: "Network Error",
    code: "ERR_NETWORK",
    request: {},
  },
  timedOut: {
    name: "AxiosError",
    message: "timeout of 5000ms exceeded",
    code: "ECONNABORTED",
    request: {},
  },
  refusedWithSentence: {
    name: "AxiosError",
    message: "Request failed with status code 400",
    code: "ERR_BAD_REQUEST",
    response: {
      status: 400,
      data: {
        success: false,
        message: "กิจกรรมนี้ยังไม่ได้เลือกประเภทสัดส่วนคะแนน",
      },
    },
  },
  refusedSilently: {
    name: "AxiosError",
    message: "Request failed with status code 502",
    code: "ERR_BAD_RESPONSE",
    response: { status: 502, data: "<html>502 Bad Gateway</html>" },
  },
};

/**
 * What a component actually catches, for an error that went the long way.
 *
 * Two steps, in the order they happen: the interceptor writes the message it
 * wants carried, then Redux Toolkit reduces the error to a `SerializedError`
 * on the way into the store — `name`, `message`, `stack` and `code`, and the
 * response is gone. What `unwrap()` throws is this, and nothing else, which is
 * the whole reason the sentence has to be moved onto `message` first.
 */
function throughAThunk(error: Record<string, unknown>): unknown {
  const carried: Record<string, unknown> = {
    ...error,
    message: messageToCarry(error),
  };

  return {
    name: carried.name,
    message: carried.message,
    stack: carried.stack,
    code: carried.code,
  };
}

describe("messageToCarry", () => {
  it("carries the sentence the API sent", () => {
    expect(messageToCarry(axiosError.refusedWithSentence)).toBe(
      "กิจกรรมนี้ยังไม่ได้เลือกประเภทสัดส่วนคะแนน",
    );
  });

  it("carries nothing when the request never reached the server", () => {
    // The point of returning a string rather than leaving `message` alone:
    // axios has already written English on both of these, and it would be
    // read downstream as if the API had sent it.
    expect(messageToCarry(axiosError.networkDown)).toBe("");
    expect(messageToCarry(axiosError.timedOut)).toBe("");
  });

  it("carries nothing when the answer had no sentence in it", () => {
    // A proxy's HTML error page, a download route answering with a Blob, an
    // envelope with the message missing — no one wrote any of these for a
    // user, and axios's status line is not a substitute.
    expect(messageToCarry(axiosError.refusedSilently)).toBe("");
    expect(messageToCarry({ response: { status: 502, data: {} } })).toBe("");
    expect(messageToCarry({ response: { status: 502 } })).toBe("");
    expect(messageToCarry({ response: { data: { message: 500 } } })).toBe("");
  });

  it("treats a blank message as no message", () => {
    expect(messageToCarry({ response: { data: { message: "   " } } })).toBe("");
  });

  it("carries nothing for a value that is not an error object", () => {
    expect(messageToCarry(null)).toBe("");
    expect(messageToCarry(undefined)).toBe("");
    expect(messageToCarry("ผิดพลาด")).toBe("");
  });
});

describe("messageToShow", () => {
  it("shows the sentence the API sent, through a rejected thunk", () => {
    // #51 itself: the teacher asks to map an activity, the API refuses in
    // Thai and names what to go and fix, and that is what reaches the screen.
    expect(throughAThunk(axiosError.refusedWithSentence)).toMatchObject({
      message: "กิจกรรมนี้ยังไม่ได้เลือกประเภทสัดส่วนคะแนน",
    });
    expect(
      messageToShow(
        throughAThunk(axiosError.refusedWithSentence),
        "ไม่สามารถเพิ่มกิจกรรมได้ กรุณาลองใหม่อีกครั้ง",
      ),
    ).toBe("กิจกรรมนี้ยังไม่ได้เลือกประเภทสัดส่วนคะแนน");
  });

  it("falls back to the caller's own words when the network is down", () => {
    // The other half of the same screen, and the reason the interceptor
    // clears the message instead of only filling it in: left alone, this
    // shows the teacher `Network Error`.
    expect(
      messageToShow(
        throughAThunk(axiosError.networkDown),
        "ไม่สามารถเพิ่มกิจกรรมได้ กรุณาลองใหม่อีกครั้ง",
      ),
    ).toBe("ไม่สามารถเพิ่มกิจกรรมได้ กรุณาลองใหม่อีกครั้ง");
    expect(
      messageToShow(
        throughAThunk(axiosError.refusedSilently),
        "ไม่สามารถเพิ่มกิจกรรมได้ กรุณาลองใหม่อีกครั้ง",
      ),
    ).toBe("ไม่สามารถเพิ่มกิจกรรมได้ กรุณาลองใหม่อีกครั้ง");
  });

  it("shows the sentence when the component caught the error itself", () => {
    // No thunk in between, so the response is still on the error — but the
    // interceptor ran all the same, because every service in this app calls
    // through `axiosInstance`.
    const caught = {
      ...axiosError.refusedWithSentence,
      message: messageToCarry(axiosError.refusedWithSentence),
    };

    expect(messageToShow(caught)).toBe(
      "กิจกรรมนี้ยังไม่ได้เลือกประเภทสัดส่วนคะแนน",
    );
  });

  it("shows an error the app threw for itself", () => {
    // `accept-invite-page.tsx` throws one of these when the invitation is
    // answered but the answer is not one it can act on. It never went near
    // axios, and its message is already Thai for this screen.
    expect(messageToShow(new Error("เกิดข้อผิดพลาดในการดำเนินการ"))).toBe(
      "เกิดข้อผิดพลาดในการดำเนินการ",
    );
  });

  it("falls back for a message that is blank or not a string", () => {
    expect(messageToShow({ message: "  " }, "ลบไม่สำเร็จ")).toBe("ลบไม่สำเร็จ");
    expect(messageToShow({ message: 42 }, "ลบไม่สำเร็จ")).toBe("ลบไม่สำเร็จ");
  });

  it("falls back to the generic sentence when the caller gave none", () => {
    expect(messageToShow(null)).toBe(GENERIC_ERROR_MESSAGE);
    expect(messageToShow(undefined)).toBe(GENERIC_ERROR_MESSAGE);
  });

  it("has a generic sentence that is Thai", () => {
    // The point of the whole exercise: what the user is shown is a sentence
    // somebody wrote for them, in the language the rest of the screen is in.
    expect(GENERIC_ERROR_MESSAGE).toMatch(/[฀-๿]/);
  });
});
