# ADR-0032 — type ของ activity เขียนตามแถวที่ส่งจริง ไม่ใช่ตามที่ `as` เคยบอกไว้

- **สถานะ**: ตัดสินแล้ว 19 สิงหาคม 2569
- **ที่มา**: [issue #68](https://github.com/khthana/Deep-Portfolio/issues/68)
  รอบ activity
- **เกี่ยวข้อง**: [ADR-0029](0029-api-types-per-feature.md) กติกาของแต่ละรอบ,
  [ADR-0031](0031-attachments-are-the-leaf.md) ลำดับของรอบ ใบนี้ไม่ได้ทบทวนข้อไหน
  ของทั้งสองใบ

## บริบท

ADR-0031 ข้อ "ผลที่ตามมา" บอกไว้ว่า activity ยังย้ายไม่ได้ ต้องจบ `RubricDetail`
กับ `ScoreWeightDetail` ก่อน — attachment อย่างเดียวไม่พอ รอบนี้จึงย้ายทั้งสามตัว
นั้นไปพร้อมกัน ซึ่งเป็นสิ่งที่ปลดล็อก activity เอง ไม่ใช่รอบก่อนหน้า

`activity.service.ts` สร้างคำตอบสองเส้นด้วยการ spread แถว Prisma ทั้งแถวแล้ว
`as` ทับ

```ts
return { ...activity, activity_id: activity.id, ... } as GetActivityDetailResp;
```

`as` แบบนี้ไม่ได้ตรวจอะไรเลย มันบอกคอมไพเลอร์ว่าผลลัพธ์คือ type นั้น แล้วปล่อยให้
แถวเป็นตัวตัดสินว่าจริง ๆ แล้วส่งอะไรออกไป ผลคือ type กับสายพูดไม่ตรงกัน**สองทาง
พร้อมกัน** ซึ่งเป็นสิ่งเดียวกับที่ ADR-0028 เจอตอนนำร่อง course

รอบนี้จึงเขียน test สองเคสที่ไล่ชื่อ**ทุกคีย์**ของทั้งสองเส้นก่อน
(`apps/api/test/activity.test.ts`) แล้วเขียน type ตามเคสนั้น ไม่ใช่ตามของเดิม

## สิ่งที่ `as` ปิดไว้

| จุด                                   | type เดิมบอก              | ของจริงที่ส่ง                                  |
| ------------------------------------- | ------------------------- | ---------------------------------------------- |
| `id`                                   | ไม่ได้ประกาศ              | ส่ง (คู่กับ `activity_id` ที่เป็นเลขเดียวกัน)   |
| `expected_level`                       | `?: number`               | `number \| null` มีเสมอ                        |
| `subject_score_ratio`                  | `ScoreWeightDetail`       | `... \| null` — relation เป็น optional          |
| `subject_score_ratio.created_at/updated_at` | ไม่ได้ประกาศ         | ส่ง (เส้น detail `include` ทั้งแถว)             |
| `subject_score_ratio.weight`, `.section_id` | `number`             | `number \| null` — สองคอลัมน์เป็น `Int?` ในสคีมา |
| `rubric_activity_mapping[].created_at/updated_at/created_by` | ไม่ได้ประกาศ | ส่ง                            |
| `rubric_levels[].created_at`           | ไม่ได้ประกาศ              | ส่ง                                            |
| `attachments`                          | `... \| null`             | ไม่เคยเป็น null — service ตอบสองรายการเสมอ      |
| `sequence_order`, `score_category`, `weight` (ชั้นบน) | `?:` สามตัว | **ไม่เคยส่งเลย** — ลบทิ้ง                       |
| วันที่ทั้งสี่                          | `Date`                    | string                                          |

เส้น list มีของตัวเองอีกข้อ: `subject_score_ratio` ที่นั่นเป็น `null` ได้เหมือนกัน
(ฝั่ง web เขียนเป็น `?:` ซึ่งคือ `undefined` คนละอย่างกับ `null`) และสามตัวนับ
(`student_count`, `submitted_count`, `pending_grading_count`) ไม่เคยเป็น null
ทั้งที่ทั้งสองฝั่งเขียนว่าเป็นได้

## การตัดสินใจ

**1. `ScoreWeightDetail` ตัวเดียวปิดสองรูปไว้ ต้องแยกเป็นสองตัว**

เส้น detail `include` relation ทั้งแถว จึงได้ `created_at`/`updated_at` ติดมา
ส่วนเส้น list `select` มาห้าคอลัมน์ สองอย่างนี้เป็นคนละรูป แต่ type เดิมตัวเดียว
ใช้กับทั้งคู่

`packages/api-types/src/score-weight.ts` จึงมี `ScoreWeightBrief` (ห้าคอลัมน์ที่
list เลือก) กับ `ScoreWeightDetail = ScoreWeightBrief & { created_at, updated_at }`
(แถวเต็มที่ detail join มา) ทางเลือกที่ไม่เอาคือให้ทั้งคู่เป็นแถวเต็มแล้วยัด
`select` เพิ่มให้เส้น list — นั่นคือการเปลี่ยนสิ่งที่ผู้เรียกได้รับ ซึ่งรอบนี้
ไม่ทำ (ดูข้อ 3)

**2. `rubric` กับ `score-weight` ได้ไฟล์ของตัวเอง ไม่ใช่อยู่ใน `activity.ts`**

ตาม ADR-0029 ข้อ 2 — ทั้งสองเป็น feature ของตัวเอง (`rubric.service.ts`,
`score-weight.service.ts` มีอยู่จริงทั้งคู่) activity แค่ฝังรูปของมันไว้
`GET /score-weight` ยังไม่ย้าย แต่มันตอบแถวเต็ม จึงจะเจอ `ScoreWeightDetail`
เขียนรออยู่แล้วตอนถึงคิว

**3. เขียน type ตามสาย ไม่ใช่ตัดสายให้ตรง type**

`created_by` ของแถว rubric กับ `created_at`/`updated_at` ของทั้งสองรูปถูกส่งออก
ไปหานักศึกษาด้วย ทางเลือกที่ชวนให้ทำคือใส่ `select` ตัดมันออก แต่ #68 บอกไว้ชัด
ว่ารอบแบบนี้ "รักษาพฤติกรรมเดิม" และการตัดคือการเปลี่ยนสิ่งที่ผู้เรียกได้รับ

รอบนี้จึงเขียนความจริงลงไป และ**ความจริงนั้นอ่านออกแล้ว** — ก่อนหน้านี้ไม่มีใคร
เห็นว่ามันถูกส่ง เพราะ type บอกว่าไม่ได้ส่ง ใครจะตัดสินว่าควรตัดหรือไม่ ตัดสินได้
จากที่นี่ ไม่ต้องไปอ่าน service

**4. `detail` เป็น `unknown` ไม่ใช่ union ของ JSON**

คอลัมน์เป็น `Json?` และ zod ที่กั้นทางเข้า (`jsonValue` ใน
`apps/api/src/validation/fields.ts`) รับ JSON อะไรก็ได้ API จึงไม่รู้รูปของมันจริง ๆ

รอบนี้ลอง `JsonValue` แบบ recursive ก่อน (`string | number | boolean | null |
JsonValue[] | JsonObject`) แล้ว**ใช้ไม่ได้** — ค่านี้ถูกเก็บใน Redux slice และ
`Draft<T>` ของ Immer ไล่ recursion ลงไปจนคอมไพเลอร์ยอมแพ้ (TS2589 ที่
`course-slice.ts`) เปลี่ยน `type` เป็น `interface` แล้วก็ยังไม่หาย

`unknown` จึงเป็นคำตอบ และเป็นคำตอบที่ตรงความจริงด้วย: มันแปลว่า "ไม่รู้รูป"
ซึ่งคือสิ่งที่ API รู้จริง ๆ ผู้อ่านแต่ละรายบีบเองตรงจุดที่มันตัดสินว่ากำลังดู
อะไรอยู่ ในทางปฏิบัติมีจุดเดียวที่ต้องเขียน cast — `mapActivityDetail` ที่แปลง
response เป็นรูปของหน้าจอ ส่วนสองจุดใน editor ผ่านได้เอง เพราะทั้งคู่บีบ `unknown`
ให้เหลือ `{}` ก่อนอยู่แล้ว (`if (props.activityDetail?.detail)` จุดหนึ่ง และ
`?? undefined` อีกจุดหนึ่ง) แล้ว `{}` ถึงจะเข้ากับ `JSONContent` ของ tiptap ได้
เพราะมันมี index signature — ต้องครบทั้งสองอย่าง อย่างเดียวไม่พอ

**5. เปลี่ยนชื่อสองตัวตอนย้าย**

| เดิม                     | ใน package           |
| ------------------------ | -------------------- |
| `GetActivityDetailResp`  | `ActivityDetailResp` |
| `GetAllActivityList`     | `ActivityListItem`   |

ตาม ADR-0029 ข้อ 1 และตามชื่อที่ package ใช้อยู่ (`TeacherCourseListResp`,
`GradebookPerActivityResp`, `StudentEvaluationListResp` — ไม่มีตัวไหนขึ้นต้นด้วย
`Get`) `GetAllActivityList` ผิดกว่านั้นอีกชั้นหนึ่ง เพราะมันคือ**หนึ่งแถว** ของ
list ไม่ใช่ทั้ง list — service คืน `ActivityListItem[]`

**6. `activity_type` ยังเป็น union สองค่า และ cast เหลือจุดเดียว**

คอลัมน์เป็น `VarChar(20)` ไม่มีอะไรบังคับ เก็บเป็นตัวพิมพ์เล็กแล้ว
`toUpperCase()` ตอนส่งออก สิ่งที่บังคับคือ**ทางเข้า** — `classworkType` เป็น enum
สองค่าและ `POST`/`PUT /activity` เป็นทางเดียวที่เขียนคอลัมน์นี้ ทุกแถวที่ระบบ
สร้างเองจึงเป็นหนึ่งในสองค่านี้

ชื่อ `ActivityType` เป็นชื่อใหม่ ไม่ได้ใช้ `ClassworkType` ที่สะกดค่าคู่เดียวกันนี้
อยู่แล้วทั้งสองฝั่ง เพราะทั้งสองฝั่งนิยามมันจาก**ค่า runtime** — ฝั่ง web เป็น
`keyof typeof ClassworkType` ของ object `as const` และฝั่ง API เป็น
`ClassworkType.INDIVIDUAL` ที่ controller เทียบค่าจริง ๆ — ซึ่ง package รับไม่ได้
ตาม ADR-0028 ข้อ 4 (ไม่มี build step จึงถือได้แต่ type) นี่เป็นสถานการณ์เดียวกับ
`AttachmentType` ในรอบ attachment ที่ ADR-0031 เจอ

จึงเหลือ `toActivityType()` ตัวเดียวใน `activity.service.ts` ที่ทำ assertion นี้
พร้อมเหตุผลกำกับ ต่างจากของเดิมตรงที่ `as` เดิมครอบทั้งวัตถุ จึงกลบรูปของทุก
field ที่เหลือไปด้วย ส่วนอันนี้กลบแค่สิ่งเดียวที่มันตั้งใจกลบ

## ผลที่ตามมา

- เหลือสำเนาฝั่ง web 38 ไฟล์ 2,055 บรรทัด (จาก 2,096 หลังรอบ attachment)
- `ClassworkDetailFull.deadline_date` กว้างเป็น `Date | string | null` และ
  `checkIsOverSubmittionDeadline` ก็กว้างตาม ด้วยเหตุผลเดียวกับ ADR-0029 ข้อ 5
  เป๊ะ ๆ — ครึ่ง learning-activity ยังไม่ย้าย ทั้งคู่แคบลงได้เมื่อครึ่งนั้นตามมา
- `GetStudentActivityDetailResp` ทั้งสองฝั่งอิง `ActivityDetailResp` จาก package
  แล้ว feature `student-activity` จึงเหลือแค่ครึ่งของตัวเองที่ยังไม่ย้าย
- **`GET /activity/options` ไม่ได้ย้ายไปกับรอบนี้** มันเป็นเส้นของ feature
  activity ก็จริง แต่รูปที่มันตอบคือ `Options` (`{ label, value }`) ซึ่งเป็นรูป
  ของ UI ที่หลาย feature ตอบเหมือนกันหมด — `learning-activity/options` ก็ตัวนี้
  ADR-0029 ข้อ 2 บอกได้แค่ว่ามัน**ไม่ควรอยู่ใน** `activity.ts` เพราะมันไม่ใช่ของ
  activity — ส่วนคำถามว่าควรอยู่ที่ไหน ใบนี้ตัดสินเองว่ายังไม่ตอบ เพราะมันเป็นรูป
  ที่ web กำหนดให้ API ตอบตาม ไม่ใช่รูปที่ API กำหนดขึ้น ซึ่งเป็นคำถามประเภทเดียว
  กับ envelope ใน #67 `getActivityOptions` จึงยังไม่มี return annotation
- รอบต่อไปตามกราฟคือ `learning-activity` (ใช้ `AttachmentDetailResp` อย่างเดียว
  ซึ่งย้ายแล้ว) แล้วค่อย `student-activity` ซึ่งตอนนี้เหลือแค่
  `ClassworkType` กับ `MemberStatus` เป็นขาออกที่ยังไม่ย้าย
