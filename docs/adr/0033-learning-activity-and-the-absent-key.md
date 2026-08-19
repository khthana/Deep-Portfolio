# ADR-0033 — คีย์ที่ไม่มีอยู่ กับคีย์ที่เป็น null ไม่ใช่อย่างเดียวกัน

- **สถานะ**: ตัดสินแล้ว 19 สิงหาคม 2569
- **ที่มา**: [issue #68](https://github.com/khthana/Deep-Portfolio/issues/68)
  รอบ learning-activity
- **เกี่ยวข้อง**: [ADR-0029](0029-api-types-per-feature.md) กติกาของแต่ละรอบ,
  [ADR-0032](0032-activity-follows-the-row.md) รอบ activity ซึ่งเป็นครึ่งที่คู่กัน
  ใบนี้ไม่ได้ทบทวนข้อไหนของทั้งสองใบ ข้อ 4 ข้างล่างคือการ**ทำตาม**สิ่งที่ ADR-0032
  บอกไว้ล่วงหน้าว่าจะทำได้เมื่อรอบนี้มาถึง ไม่ใช่การกลับคำ

## บริบท

learning-activity เป็นครึ่งที่คู่กับ activity — หน้าจอเดียวกัน ตารางคนละชุด
ทั้งหมด และไม่มีคะแนน ไม่มี rubric ไม่มีหมวดคะแนน ตาม ADR-0032 ข้อผลที่ตามมา
รอบนี้ควรมาต่อจาก activity เพราะขาออกเดียวที่มันมีคือ `AttachmentDetailResp`
ซึ่งย้ายไปตั้งแต่รอบ attachment แล้ว

`learning-activity.service.ts` สร้างคำตอบสองเส้นด้วยวิธีเดียวกับ
`activity.service.ts` — spread แถว Prisma แล้ว `as` ทับ — จึงเจอปัญหาแบบเดียวกัน
รอบนี้จึงทำแบบเดียวกัน: เขียน test สองเคสที่ไล่ชื่อ**ทุกคีย์**ของทั้งสองเส้นก่อน
(`apps/api/test/learning-activity.test.ts`) แล้วเขียน type ตามเคสนั้น

ทั้งสองเคสตั้งวันที่จริงลงไปแล้วเทียบเป็น string ระดับมิลลิวินาที ไม่ใช่
`expect.any(String)` — ตามมาตรฐานที่ ADR-0029 ตั้งไว้ตอนรอบ gradebook ว่าการ
เปลี่ยนมาเขียน `toISOString()` เองต้องมีเคสที่รอยต่อ HTTP ยืนยันว่าไบต์ที่ออกไป
เหมือนเดิม ไม่ใช่ยืนยันแค่ชนิดของมัน

## สิ่งที่ `as` ปิดไว้

| จุด                                     | type เดิมบอก              | ของจริงที่ส่ง                             |
| --------------------------------------- | ------------------------- | ----------------------------------------- |
| `id` (เส้น detail)                      | ไม่ได้ประกาศ              | ส่ง (คู่กับ `learning_activity_id`)       |
| `learning_activity_type` (เส้น list)    | ไม่ได้ประกาศ              | ส่ง — `select` เลือกมาแล้วไม่มีใครเขียนถึง |
| `course_syllabus_id` (เส้น list)        | ไม่ได้ประกาศ              | ส่ง                                       |
| `course_syllabus_id` (เส้น detail)      | `number`                  | `number \| null` — คอลัมน์เป็น `Int?`      |
| `section_id` (เส้น list)                | `number \| null`          | `number` — คอลัมน์ NOT NULL               |
| `week_no` (เส้น detail)                 | ประกาศไว้ฝั่ง web         | **ไม่เคยส่ง** — โค้ดที่จะอ่านถูกคอมเมนต์ไว้ |
| `attachments` (ฝั่ง web)                | `... \| null`             | ไม่เคยเป็น null                           |
| สามตัวนับ                                | `... \| null`             | `number` — เป็น `.length` ของ array        |
| `detail`                                | `Prisma.InputJsonValue`   | JSON อะไรก็ได้ (ฝั่ง API เอา type ของ Prisma มาใส่ในรูปของสาย) |
| วันที่ทั้งสี่                            | `Date`                    | string                                    |

## การตัดสินใจ

**1. `week_no` เป็น optional ไม่ใช่ nullable**

เส้น list อ่านสัปดาห์จาก `course_syllabus` ก็ต่อเมื่อแถวมี `course_syllabus_id`
ถ้าไม่มี ตัวแปรเป็น `undefined` แล้ว `JSON.stringify` **ตัดคีย์ทิ้งทั้งคีย์**
ผลที่ผู้เรียกได้จึงไม่ใช่ `week_no: null` แต่เป็นแถวที่ไม่มี `week_no` อยู่เลย

สองอย่างนี้ต่างกันจริงสำหรับผู้เรียก — `"week_no" in row` ตอบคนละคำตอบ และ
`Object.keys()` ยาวไม่เท่ากัน type จึงเขียนว่า `week_no?: number` ไม่ใช่
`week_no: number | null` ทางเลือกที่ไม่เอาคือแก้ service ให้ตอบ `null` ให้เท่ากัน
ทุกแถว ซึ่งเป็นการเปลี่ยนสิ่งที่ผู้เรียกได้รับ และ #68 บอกว่ารอบแบบนี้รักษา
พฤติกรรมเดิม

เคส `answers with exactly the keys the list row has` จึงมีสองแถว — แถวที่มี
สัปดาห์กับแถวที่ไม่มี — และปิดท้ายด้วย `not.toHaveProperty("week_no")` เพราะ
`toEqual` อย่างเดียวไม่แยกคีย์ที่หายไปออกจากคีย์ที่เป็น `undefined`

ส่วนเส้น detail ไม่มี `week_no` เลย: โค้ดที่จะไปอ่านมันถูกคอมเมนต์ทิ้งไว้ใน
service ฝั่ง web ประกาศไว้ว่ามีมาตลอด รอบนี้จึงลบทิ้ง ใครอยากให้มันมี ต้องไป
แก้ service ไม่ใช่แก้ type

**2. `LearningActivityType` เป็นคนละตัวกับ `ActivityType` ทั้งที่ค่าเหมือนกัน**

ทั้งคู่คือ `"INDIVIDUAL" | "GROUP"` แต่เป็นคนละคอลัมน์ของคนละตาราง
(`activities.activity_type` กับ `learning_activities.learning_activity_type`)
แต่ละตัวมี zod กั้นทางเข้าของตัวเอง ถ้าวันหนึ่งฝั่งใดฝั่งหนึ่งเพิ่มค่าที่สาม อีก
ฝั่งไม่ควรกว้างตามไปด้วยเงียบ ๆ

ทางเลือกที่ไม่เอาคือทำ `packages/api-types/src/classwork.ts` ถือ `ClassworkType`
ตัวเดียวให้ทั้งคู่ใช้ — ชื่อนั้นตรงกับที่ทั้งสองแอปเรียกมันอยู่แล้วก็จริง แต่
`ClassworkType` ที่มีอยู่ทั้งสองฝั่งเป็น**ค่า runtime** (ฝั่ง API `controller`
เทียบ `ClassworkType.INDIVIDUAL` จริง ๆ) ซึ่ง package ถือไม่ได้ตาม ADR-0028 ข้อ 4
การเอาชื่อเดียวกันไปตั้งให้ type ล้วนใน package จึงทำให้ไฟล์ที่ import ทั้งสอง
อย่างชนกัน

`toLearningActivityType()` ใน service จึงซ้ำรูปกับ `toActivityType()` ของรอบก่อน
เกือบทุกตัวอักษร รวมทั้งคอมเมนต์ที่กำกับมันด้วย ทางเลือกที่ไม่เอาคือรวบเป็น
helper ตัวเดียวรับ type parameter — เพราะสิ่งที่มีค่าใน assertion นี้ไม่ใช่
`toUpperCase()` แต่เป็น**เหตุผล**ว่าทำไมค่าที่ได้ถึงอยู่ในสองค่านั้น ซึ่งอ้างถึง
คอลัมน์และ schema คนละตัวกัน helper กลางจะรับ type มาโดยไม่มีที่ให้เขียนว่า
ใครรับประกันมัน แล้วก็จะกลายเป็น `as` ที่ไม่มีเหตุผลกำกับอีกตัวหนึ่ง ซึ่งคือสิ่ง
ที่รอบนี้กับรอบก่อนกำลังเก็บกวาดอยู่

**3. `detail` เป็น `unknown` ด้วยเหตุผลเดียวกับ ADR-0032 ข้อ 4**

ของเดิมฝั่ง API เขียนว่า `Prisma.InputJsonValue` ซึ่งผิดสองชั้น: มันเป็น type
ของ**ขาเข้า** ของ Prisma ไม่ใช่รูปที่ออกสาย และมันดึง type ของ ORM เข้ามาอยู่ใน
รูปของ response ทั้งที่ package ตั้งใจไม่พึ่ง Prisma เลย

`mapLearningActivityDetail` จึงต้อง cast เป็น `JSONContent | null` หนึ่งจุด
เหมือนที่ `mapActivityDetail` ทำในรอบก่อน — จุดเดียวกัน ไฟล์เดียวกัน เหตุผล
เดียวกัน

**4. `ClassworkDetailFull.deadline_date` แคบกลับเป็น `string | null` แล้ว**

ADR-0032 ขยายมันเป็น `Date | string | null` ไว้ชั่วคราว เพราะตอนนั้นครึ่ง
learning-activity ยังเติมค่าเป็น `Date` อยู่ รอบนี้คือรอบที่ครึ่งนั้นตามมา —
`mapActivityDetail` กับ `mapLearningActivityDetail` เป็นสองจุดเดียวที่สร้าง
`ClassworkDetailFull` และทั้งคู่รับมาจาก package แล้ว จึงแคบได้จริงและแคบแล้ว

ส่วน `checkIsOverSubmittionDeadline` **ไม่แคบตาม** แม้ผู้เรียกที่ยังใช้งานอยู่
รายเดียวจะส่ง string มาแล้วก็ตาม กติกาที่ตัดสินข้อนี้คือหัวข้อของ ADR-0029 ข้อ 5
— "helper ฝั่ง web ที่รับวันที่ ให้ขยาย ไม่ใช่บีบ"

แต่ต้องพูดให้ตรง: **เหตุผลสองข้อที่ ADR-0029 ข้อ 5 ยกมา ไม่ถึง helper ตัวนี้**
ทั้งคู่พูดถึง `convertDateToThaiFormat` โดยเฉพาะ — ข้อหนึ่งว่าการบีบจะทำให้ 21
จุดของ feature ที่ยังไม่ย้ายพังพร้อมกัน (ตัวนี้มีผู้เรียกที่ยังใช้งานอยู่รายเดียว
บีบแล้วไม่พังสักจุด) ข้อสองว่ามีสองจุดห่อ `new Date()` เองก่อนเรียก (ตัวนี้ไม่มี)
เหตุผลที่ถึงจริงจึงเป็นของใบนี้เอง: มันเป็น helper วันที่ทั่วไปที่วางอยู่ติดกับ
`convertDateToThaiFormat` ซึ่งยังต้องรับทั้งสองแบบอยู่ดี (22 จุดเรียก และสองจุด
ในปฏิทินห่อ `new Date()` มาก่อน) การบีบตัวเดียวของคู่ที่ทำงานเหมือนกันเป๊ะ ทำให้
คนอ่านต้องหาเหตุผลของความต่างที่ไม่มีอยู่จริง

## ผลที่ตามมา

- เหลือสำเนาฝั่ง web 38 ไฟล์ 2,035 บรรทัด (จาก 2,055 หลังรอบ activity)
- `apps/web/src/types/activity-type.type.ts` เหลือ export เดียวคือ
  `UnacceptedMember` พร้อมป้ายบอกทางสามใบ — ไฟล์นี้จะหมดไปเมื่อรอบ
  student-activity มาถึง
- `GetStudentLearningActivityDetailResp` ทั้งสองฝั่งอิง
  `LearningActivityDetailResp` จาก package แล้ว
- `GET /learning-activity/options` ไม่ได้ย้าย ด้วยเหตุผลเดียวกับ
  `GET /activity/options` ใน ADR-0032 เป๊ะ ๆ — มันตอบรูป `Options` ที่หลาย
  feature ตอบเหมือนกัน
- `GET /learning-activity/student/detail` กับ `/submitted/list` ก็ไม่ได้ย้าย
  ทั้งสองเส้นเสิร์ฟด้วย `StudentLearningActivityService` จึงเป็นของรอบ
  student-learning-activity ไม่ใช่รอบนี้
- รอบต่อไปตามกราฟคือ `student-activity` กับ `student-learning-activity` ซึ่ง
  ตอนนี้เป็นคู่แฝดกันเป๊ะ ๆ: ไฟล์ type ฝั่ง web ของทั้งคู่อิง package หมดแล้ว
  ยกเว้น `ClassworkStatus` ตัวเดียว ซึ่งเป็น `keyof typeof` ของ object `as const`
  ใน `course-type.ts` — คือกรณีค่า runtime แบบเดียวกับข้อ 2 ข้างบน จะย้ายได้ก็
  ต้องแยกค่ากับ type ออกจากกันก่อน เหมือนที่ ADR-0031 ทำกับ `AttachmentType`
