import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FormInstance } from "antd";
import { scrollToErrorField } from "./handle-form-status";

/**
 * Bringing the first invalid field of a long form back into view after a
 * failed submit.
 *
 * There is no DOM here and no module mocking: the form is a hand-written
 * object that records what it was asked to scroll to, which is all the
 * function ever touches of antd's FormInstance. The one thing that cannot be
 * hand-written is the 100ms wait — antd needs the render pass to finish before
 * the field exists — so the cases drive Vitest's timer clock forward instead of
 * sleeping.
 */

type Scroll = { name: unknown; options: unknown };

/** A FormInstance with only the method under test on it. Any other member
 *  would be a lie about what this function needs. */
const recordingForm = (scrolls: Scroll[]) =>
  ({
    scrollToField: (name: unknown, options: unknown) =>
      scrolls.push({ name, options }),
  }) as unknown as FormInstance;

describe("scrollToErrorField", () => {
  let scrolls: Scroll[];
  let form: FormInstance;

  beforeEach(() => {
    vi.useFakeTimers();
    scrolls = [];
    form = recordingForm(scrolls);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("scrolls to the first invalid field", () => {
    scrollToErrorField(form, {
      errorFields: [
        { name: ["activity_name"], errors: ["กรุณากรอกชื่อกิจกรรม"] },
        { name: ["deadline_date"], errors: ["กรุณาเลือกวันที่"] },
      ],
    });

    vi.advanceTimersByTime(100);

    expect(scrolls).toEqual([
      {
        name: ["activity_name"],
        options: {
          behavior: "smooth",
          block: "center",
          scrollMode: "if-needed",
        },
      },
    ]);
  });

  it("waits for the render pass before scrolling", () => {
    scrollToErrorField(form, {
      errorFields: [{ name: ["activity_name"], errors: ["กรุณากรอก"] }],
    });

    expect(scrolls).toEqual([]);

    vi.advanceTimersByTime(99);
    expect(scrolls).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(scrolls).toHaveLength(1);
  });

  it("does nothing for a submit that succeeded", () => {
    // The callers hand this whatever `form.validateFields()` rejected with, and
    // an antd success is not an error object at all.
    scrollToErrorField(form, undefined);
    scrollToErrorField(form, null);
    scrollToErrorField(form, {});
    scrollToErrorField(form, { errorFields: [] });

    vi.advanceTimersByTime(100);

    expect(scrolls).toEqual([]);
  });

  it("does nothing for a rejection that is not a validation failure", () => {
    // A network error reaches the same catch block. It has a message, not
    // errorFields, and there is nothing to scroll to.
    scrollToErrorField(form, new Error("Network Error"));

    vi.advanceTimersByTime(100);

    expect(scrolls).toEqual([]);
  });
});
