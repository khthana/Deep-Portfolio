import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import type { UploadFile } from "antd";
import { appendAttachments, appendPrimitive } from "./append-form-data";
import type { AttachmentDetailItem } from "../features/teacher/announcement/types/announement-type";

/**
 * Flattening a form into the multipart body the API is posted.
 *
 * Every create/edit form in the app goes through these two functions, and they
 * decide what the API's validators actually receive: a browser cannot put a
 * dayjs, a tiptap document or an antd upload list on the wire, so whatever
 * shape is chosen here is the contract. `FormData` and `File` are Node globals,
 * so none of this needs a DOM.
 */

/** An antd upload entry. `originFileObj` is optional on antd's own type — a
 *  file the user has just picked has one, a file already stored on the server
 *  does not — so the cast is where that optionality is admitted. */
const uploadEntry = (name: string, picked?: File): UploadFile =>
  ({ uid: name, name, originFileObj: picked }) as UploadFile;

const png = (name: string) =>
  new File([new Uint8Array([137, 80, 78, 71])], name, { type: "image/png" });

describe("appendPrimitive", () => {
  it("leaves the key out entirely when there is no value", () => {
    const formData = new FormData();

    appendPrimitive(formData, "remark", null);
    appendPrimitive(formData, "deadline_date", undefined);

    expect(Array.from(formData.keys())).toEqual([]);
  });

  it("writes a dayjs as an ISO 8601 instant", () => {
    const formData = new FormData();

    appendPrimitive(formData, "deadline_date", dayjs("2024-01-05T13:45:00Z"));

    expect(formData.get("deadline_date")).toBe("2024-01-05T13:45:00.000Z");
  });

  it("writes an object as JSON", () => {
    const formData = new FormData();

    appendPrimitive(formData, "members", [{ student_id: "65000001" }]);
    appendPrimitive(formData, "schedule", { day_of_week: "WED" });

    expect(formData.get("members")).toBe('[{"student_id":"65000001"}]');
    expect(formData.get("schedule")).toBe('{"day_of_week":"WED"}');
  });

  it("writes `detail` as JSON even when it is already a string", () => {
    // The one key with a rule of its own. `detail` holds a tiptap document,
    // which is an object every time it comes from the editor — but the rule is
    // written on the key, not on the value, so a plain string sent under that
    // name arrives quoted rather than bare.
    const formData = new FormData();

    appendPrimitive(formData, "detail", "งานเดี่ยว");

    expect(formData.get("detail")).toBe('"งานเดี่ยว"');
  });

  it("writes everything else through String()", () => {
    const formData = new FormData();

    appendPrimitive(formData, "activity_name", "งานที่หนึ่ง");
    appendPrimitive(formData, "score_number", 20);
    appendPrimitive(formData, "is_published", false);

    expect(formData.get("activity_name")).toBe("งานที่หนึ่ง");
    expect(formData.get("score_number")).toBe("20");
    expect(formData.get("is_published")).toBe("false");
  });
});

describe("appendAttachments", () => {
  it("writes nothing for an empty attachment list", () => {
    const formData = new FormData();

    appendAttachments(formData, []);

    expect(Array.from(formData.keys())).toEqual([]);
  });

  it("collects every link into a single urls field", () => {
    const formData = new FormData();

    appendAttachments(formData, [
      {
        attachmentType: "LINK",
        attachmentItems: {
          title: "เอกสารประกอบ",
          url: "https://example.test/a",
        },
      },
      {
        attachmentType: "LINK",
        attachmentItems: { title: "วิดีโอ", url: "https://example.test/b" },
      },
    ]);

    expect(formData.getAll("urls")).toEqual([
      JSON.stringify([
        { title: "เอกสารประกอบ", url: "https://example.test/a" },
        { title: "วิดีโอ", url: "https://example.test/b" },
      ]),
    ]);
  });

  it("leaves urls out when nothing was linked", () => {
    const formData = new FormData();

    appendAttachments(formData, [
      {
        attachmentType: "FILE",
        attachmentItems: uploadEntry("a.pdf", png("a.pdf")),
      },
    ]);

    expect(formData.has("urls")).toBe(false);
  });

  it("appends files and images under the same files key", () => {
    // The API does not distinguish the two — FILE and IMAGE are a UI
    // distinction, and both arrive as one repeated multipart field.
    const formData = new FormData();

    appendAttachments(formData, [
      {
        attachmentType: "FILE",
        attachmentItems: uploadEntry("report.pdf", png("report.pdf")),
      },
      {
        attachmentType: "IMAGE",
        attachmentItems: uploadEntry("diagram.png", png("diagram.png")),
      },
      {
        attachmentType: "LINK",
        attachmentItems: { title: "อ้างอิง", url: "https://example.test/c" },
      },
    ]);

    expect(
      formData.getAll("files").map((entry) => (entry as File).name),
    ).toEqual(["report.pdf", "diagram.png"]);
  });

  it('appends the string "undefined" for an attachment with no file picked', () => {
    // Pinned, not endorsed. An antd entry that came back from the server has no
    // `originFileObj`, and `FormData.append` stringifies whatever is not a
    // Blob — so re-saving a form without touching its existing attachments
    // posts a field the API has to recognise as junk.
    const formData = new FormData();

    appendAttachments(formData, [
      {
        attachmentType: "FILE",
        attachmentItems: uploadEntry("already-stored.pdf"),
      },
    ]);

    expect(formData.get("files")).toBe("undefined");
  });

  it("keeps a link that was never given a url", () => {
    // Nothing here validates: a half-filled link row is sent as-is and the API
    // is left to reject it.
    const formData = new FormData();
    const linkWithoutUrl = {
      attachmentType: "LINK",
      attachmentItems: { title: "ยังไม่ได้ใส่ลิงก์" },
    } as unknown as AttachmentDetailItem;

    appendAttachments(formData, [linkWithoutUrl]);

    expect(formData.get("urls")).toBe('[{"title":"ยังไม่ได้ใส่ลิงก์"}]');
  });
});
