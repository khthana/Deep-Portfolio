# ADR-0030 — แถวของรายการผลการประเมินเป็น union ไม่ใช่แถวเดียวที่มี field optional

- **สถานะ**: ตัดสินแล้ว 19 สิงหาคม 2569
- **ที่มา**: [issue #68](https://github.com/khthana/Deep-Portfolio/issues/68)
  รอบ evaluation
- **เกี่ยวข้อง**: [ADR-0029](0029-api-types-per-feature.md) คือกติกาห้าข้อของ
  แต่ละรอบ ใบนี้ไม่ได้ทบทวนข้อไหนของมันเลย รอบนี้ใช้ข้อ 1 (ตั้งชื่อให้บอก
  feature), ข้อ 2 (`StudentActivityStatusDB` อยู่ไฟล์ของ feature ตัวเอง) และ
  ข้อ 3 (ลบไฟล์ model ที่ว่าง) ส่วนข้อ 4 กับ 5 ไม่มีสถานการณ์ให้ใช้ในรอบนี้ —
  สิ่งที่ใบนี้ตัดสินคือคำถามที่ ADR-0029 ไม่ได้ตอบ เพราะสองเส้นของ gradebook
  ตอบด้วยแถวรูปเดียวกันทั้งคู่

## บริบท

`GET /evaluation/list` คือเส้นเดียวที่นักศึกษาใช้ดูผลของตัวเอง มันสร้างต่อจาก
`/gradebook/per-activity` ของอาจารย์ แล้วเอาแถวของ gradebook มา spread ทั้งแถว
ผลคือ response หนึ่งชุดถือแถวสองแบบที่**ไม่ใช่รูปเดียวกัน**

| แบบ                 | field         | มาจาก                                              |
| ------------------- | ------------- | -------------------------------------------------- |
| `activity`          | 14 field      | แถวของ gradebook ทั้งแถว + `id`, `score`, `status`, `type` |
| `learning_activity` | 5 field       | `id`, `activity_id`, `activity_name`, `status`, `type` |

งานในชั้นเรียนไม่มีคอลัมน์คะแนน แถวของมันจึงไม่มีคีย์เหล่านั้น**เลย** ไม่ใช่มี
แล้วเป็น `null` — ซึ่ง #28 ตัดสินไว้แล้วและ test ที่รอยต่อ HTTP ยืนยันด้วย
`toEqual` ทั้งสองแบบอยู่แล้ว

`StudentEvaluationData` เดิม (ทั้งฝั่ง API และสำเนาฝั่ง web) เขียนเป็นแถวเดียวที่มี
field ของสถิติเป็น optional ทั้งหมด

## การตัดสินใจ

**เขียนเป็น union ที่แยกด้วย `type`**

```ts
export type StudentEvaluationRow =
  | StudentEvaluationActivityRow
  | StudentEvaluationLearningActivityRow;
```

เหตุผลคือ**รูปที่มี optional ทั้งแถวเป็น superset ของสิ่งที่ endpoint ส่งจริง**
มันยอมให้แถว `learning_activity` มี `score` ได้ ทั้งที่ไม่เคยมี และยอมให้แถว
`activity` ไม่มี `full_score` ได้ ทั้งที่มีเสมอ #68 บอกว่าให้เขียนตามที่ JSON ส่ง
จริง — superset ไม่ใช่ "ตามที่ส่งจริง" แต่คือ "ครอบสิ่งที่ส่งจริงไว้"

ทางเลือกที่ไม่เอาคือคง optional ไว้ตามเดิม ซึ่งไม่ต้องแก้ฝั่ง web เลย ราคาที่จ่าย
คือ type ที่ย้ายเข้า package จะพูดไม่ตรงกับ endpoint ตั้งแต่วันแรกที่ย้าย ซึ่งเป็น
สิ่งเดียวกับที่ #61 มาแก้

**แถว `activity` เขียนเป็น intersection กับ `GradebookActivity` ไม่ใช่คัดลอกฟิลด์มา**

```ts
export type StudentEvaluationActivityRow = StudentEvaluationRowBase &
  GradebookActivity & { type: "activity"; score: number | null };
```

เพราะ service **spread แถวของ gradebook ลงมาทั้งแถวจริง ๆ** การเขียนสิบฟิลด์ซ้ำ
คือการสร้างสำเนาที่จะเพี้ยนได้ ซึ่งเป็นความเพี้ยนแบบเดียวกับที่ ADR-0029 ข้อ 4
แก้ ต่างกันแค่ว่าคราวนั้นสำเนาอยู่คนละฝั่ง (API กับ web) คราวนี้จะอยู่ในไฟล์ข้าง
กันใน package เดียว เขียนแบบนี้แล้ว
`GradebookActivity` เปลี่ยนเมื่อไร แถวนี้ตามทันทีโดยไม่มีใครต้องจำ

**ราคาที่ฝั่ง web จ่าย และทำไมถึงถูก**

`evaluation-table.tsx` เป็นที่เดียวที่อ่าน `evaluations` มันอ่าน `score`,
`full_score`, `max_score`, `min_score`, `mean_score` ตรง ๆ ซึ่ง union ไม่ยอม
คอมไพเลอร์ทัก 5 บรรทัด แก้ด้วยการถาม `type` ก่อนหนึ่งครั้ง

```ts
const activityRow = classwork.type === "activity" ? classwork : null;
```

แล้ว `activityRow?.score ?? null` ให้ผลเท่าเดิมทุกทาง — ของเดิม
`classwork.score ?? null` ได้ `null` จาก `undefined` ของแถวงานในชั้นเรียน ของใหม่
ได้ `null` จาก `activityRow` ที่เป็น `null` พฤติกรรมไม่เปลี่ยน จึงไม่มีอะไรลง `BEHAVIOR-CHANGES.md` จาก
การย้ายครั้งนี้

## `status` ถูกบีบจาก `string` เป็น `StudentActivityStatusDB`

ทั้งสองฝั่งเขียน `status: string` ของจริงคือคอลัมน์ `student_activity.status` กับ
`student_learning_activity.status` ซึ่งเป็น enum `student_activity_status` ตัว
เดียวกันทั้งคู่ (`NOT_SUBMITTED`, `SUBMITTED`, `GRADING`, `GRADED`) — ตรงกับข้อ
"enum ที่ web เขียนกว้างกว่าของจริง" ที่ #68 เตือนไว้ type ตัวนั้นย้ายเข้า package
ไปแล้วตั้งแต่รอบ gradebook ตาม ADR-0029 ข้อ 2 รอบนี้จึง import มาใช้ ไม่ได้สร้างใหม่

การบีบครั้งนี้ทำให้เห็นข้อบกพร่องที่ไม่มีใครเห็นมาก่อน คอลัมน์ "สถานะ" ของตาราง
เรนเดอร์ `classworkStatusLabel[status]` ซึ่ง keyed ด้วย `ClassworkStatus` — สี่ค่า
คนละชุด มี `LATE` ที่ endpoint นี้ไม่เคยส่ง แทนที่ `GRADING` ถ้า `GRADING` มาถึง
ช่องจะว่างเปล่า ไม่ใช่ขีด

รอบนี้**ไม่แก้** ด้วยสองเหตุผล หนึ่ง ไม่มีที่ไหนใน `apps/api/src` เขียน `GRADING`
ลงคอลัมน์เลย มีแต่ที่อ่านมัน ค่านั้นจึงยังมาถึงหน้าจอไม่ได้จากตัวระบบเอง สอง คำที่
จะแสดงเป็นการตัดสินใจเรื่องถ้อยคำที่ผู้ใช้จริงเห็น ไม่ใช่สิ่งที่ตัดสินจากในโค้ดได้
จึงปักหมุดด้วยคอมเมนต์ที่ `evaluation-column.tsx` บันทึกในรายการปักหมุดของ
`BEHAVIOR-CHANGES.md` แล้วแยกไปเป็น
[#69](https://github.com/khthana/Deep-Portfolio/issues/69)

การปักหมุดครั้งนี้ไม่มี test คู่กัน ซึ่งต่างจากที่ CLAUDE.md เขียนไว้ว่าให้ปักด้วย
test เหตุผลคือมันเป็นการเรนเดอร์ ฝั่ง web มีรอยต่อเดียวคือฟังก์ชันบริสุทธิ์ (T2)
และ component test เป็นสิ่งที่ spec ตัดออกไว้ ตอนนี้คือ #62 คอมเมนต์กับรายการ
ปักหมุดจึงเป็นที่ที่ใกล้ที่สุดที่มี

## controller ไม่ได้ผูก type และไม่ต้องผูก

#68 เขียนว่า "ผูก service/controller ฝั่ง API ด้วย type นั้น ถ้าผูกไม่ได้ให้เขียน
ไว้ใน ADR ว่าทำไม (ดู §4 ของ ADR-0028)" รอบนี้ผูกที่ `evaluation-service.service.ts`
อย่างเดียว `evalution.controller.ts` ไม่มี annotation ใหม่เลย ด้วยสองเหตุผล

หนึ่ง controller ได้ type มาจาก return ของ service อยู่แล้ว มันรับค่ามาแล้วส่งต่อ
ให้ `successResponse` การเขียน annotation ซ้ำจึงไม่ได้ตรวจอะไรเพิ่ม สอง นี่คือ
รูปแบบเดียวกันทั้งระบบ — ไม่มี controller สักตัวใน `apps/api/src/controllers/`
ที่ import จาก `@deep-portfolio/api-types` และรอบ course กับรอบ gradebook ก็ผูกที่
service เหมือนกัน

ส่วนวงเล็บ "(ดู §4 ของ ADR-0028)" ใน #68 **ชี้ผิดข้อ** §4 ของ ADR-0028 คือเรื่อง
package ไม่ต้อง build ข้อที่ว่าด้วยการผูกคือ §2 ซึ่งเขียนไว้ว่า
`course.service.ts` ผูก return ของตัวเองไว้กับ type ใน package — เป็น service
ไม่ใช่ controller ตั้งแต่ต้น ได้แก้ที่ตัว issue แล้วตามกติกาใน CLAUDE.md ว่า
เกณฑ์ของ issue ผิดได้และให้แก้ที่ issue ไม่ใช่ทำตามมัน

## `ClassworkCategory` ไม่ได้ย้าย

ADR-0029 ข้อ 2 บอกว่า type ข้าม feature ให้อยู่ในไฟล์ของ feature ที่มันเป็นของ
รอบนี้จึงจะต้องสร้างไฟล์ให้ `ClassworkCategory` (ของ feature รายการงาน) — แต่
**ไม่ต้องเลย** เพราะ union เขียน `type: "activity"` กับ
`type: "learning_activity"` เป็นค่าตัวอักษรอยู่ในตัวสมาชิกแต่ละตัว ไม่มีอะไรต้อง
import สำเนาที่ `apps/web/.../course-type.ts` ยังอยู่และยังถูกใช้โดยตารางในหน้า
เดียวกัน จะย้ายเมื่อรอบของ feature นั้นมาถึง

## ผลที่ตามมา

- เหลือสำเนาฝั่ง web 38 ไฟล์ 2,111 บรรทัด (จาก 2,136 หลังรอบ gradebook) — ไฟล์
  ยังเท่าเดิมเพราะ `course-type.ts` ถือ type ของรายการงาน กลุ่ม แผนการสอน และ
  request param อีกหลายสิบตัวที่ยังไม่ถึงคิว
- `apps/api/src/models/evaluation.model.ts` ถูกลบทั้งไฟล์ ตาม ADR-0029 ข้อ 3
  เพราะไม่เหลืออะไรในนั้น
- รอบต่อไปที่เจอ response ซึ่งถือแถวหลายแบบ ให้ใช้ union แบบเดียวกัน ถ้าเจอ
  สถานการณ์ที่ใบนี้ไม่ครอบคลุม ให้เขียน ADR ใบใหม่ อย่าแก้ใบนี้ย้อนหลัง
