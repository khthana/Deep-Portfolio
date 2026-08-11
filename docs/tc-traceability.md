# ตารางเทียบ TC-01..TC-75 กับ automated test

เทียบ test case TC-01 ถึง TC-75 จากบทที่ 4 ของปริญญานิพนธ์ (ถอดไว้ที่
[`test-cases.md`](test-cases.md)) กับ automated test ที่มีอยู่จริงในโค้ด
เอกสารนี้คือผลของ [issue #22](https://github.com/khthana/Deep-Portfolio/issues/22)
และเป็นส่วนที่ค้างอยู่ของ T5 ใน [`spec-refactor-redeploy.md`](spec-refactor-redeploy.md)

ตารางนี้ทำหน้าที่สองอย่างพร้อมกัน — เป็นเครื่องมือวัดว่า test ที่เขียนไปครอบ
อะไรบ้าง และเป็นเอกสารที่ยอมรับข้อจำกัดว่ามันครอบไม่ได้ทุกอย่าง

## ข้อจำกัดที่ยอมรับไว้ตั้งแต่ต้น

TC ทั้ง 75 ข้อเป็น **manual UI test** ระดับ "กดปุ่มแล้วเห็นอะไรบนหน้าจอ"
ส่วน automated test ในโปรเจกต์นี้มีสองรอยต่อเท่านั้นตามที่ T2 กำหนดไว้

- **API — ขอบ HTTP** `apps/api/test/*.test.ts` ยิง request เข้า Express app
  ที่ประกอบเสร็จแล้วด้วย supertest ต่อ PostgreSQL และ MinIO จริง ตรวจได้แค่
  status, response body และสถานะฐานข้อมูล
- **Web — ฟังก์ชันบริสุทธิ์** test วางข้างไฟล์ที่มันครอบ ไม่มี DOM ไม่มีการ
  mock module ไม่มีการ render component — component test และ E2E test อยู่นอก
  ขอบเขตโดยตั้งใจ

รอยต่อทั้งสองแตะ "หน้าจอ" ไม่ได้เลย ดังนั้น TC หนึ่งข้ออาจกลายเป็น test
หลายตัว เป็น test ตัวเดียว หรือไม่กลายเป็นอะไรเลยก็ได้ ตารางนี้บอกว่าข้อไหน
เป็นแบบไหน และเพราะอะไร

## กติกาการให้สถานะ

| สถานะ | ความหมาย |
| --- | --- |
| **ครอบคลุมแล้ว** | สิ่งที่ TC ตรวจ — คือระบบทำอะไรกับข้อมูล — มี automated test ยืนยันครบ |
| **ครอบคลุมบางส่วน** | มีส่วนที่ยังไม่มี test ยืนยัน นอกเหนือจากการวาดหน้าจอ — ไม่ว่าจะเพราะรอยต่อแตะไม่ถึง หรือเพราะเขียนได้แต่ยังไม่มีคนเขียน ซึ่งสองอย่างนี้แยกกันไว้ในหัวข้อ "ช่องว่างที่พบ" ท้ายเอกสาร |
| **ครอบคลุมไม่ได้** | flow ที่ TC บรรยายไม่มีอยู่ในระบบปัจจุบันแล้ว |

สองข้อที่ต้องตกลงกันก่อนอ่านตาราง

1. **ข้อความยืนยันบนหน้าจอไม่นับเป็นข้อกำหนดแยก** TC ส่วนใหญ่เขียนผลที่คาดหวัง
   ว่า "ระบบแสดงข้อความว่าบันทึกข้อมูลสำเร็จ" ซึ่งเป็นการ *วาด* ผลของการเปลี่ยน
   สถานะเดียวกันกับที่ test ยืนยันไว้แล้ว ถ้านับข้อความบนหน้าจอเป็นอีกข้อกำหนด
   หนึ่ง ทั้ง 75 ข้อจะกลายเป็น "ครอบคลุมบางส่วน" หมดและตารางจะไม่บอกอะไรเลย
   จึงถือว่าการเปลี่ยนสถานะที่ถูกต้องคือสิ่งที่วัด
2. **inline error ในฟอร์มคือด่านที่ test แตะไม่ถึง** TC กลุ่ม "กรอกข้อมูลไม่ครบ"
   คาดสองอย่าง — บันทึกไม่สำเร็จ และมี inline error ขึ้นในฟอร์ม อย่างแรก API
   ยืนยันได้ อย่างหลังเกิดใน browser ก่อนที่ request จะถูกยิงออกมาด้วยซ้ำ
   ทุกข้อในกลุ่มนี้จึงเป็น "ครอบคลุมบางส่วน" อย่างน้อยที่สุด และ test ฝั่ง API
   ที่อ้างถึงคือด่านที่สอง ไม่ใช่ด่านเดียวกับที่ TC ทดสอบ บางข้อในกลุ่มนี้ยัง
   ขาดด่านที่สองอีกด้วย ซึ่งช่องหมายเหตุระบุไว้ทีละข้อ

ชื่อ test ในตารางเป็นชื่อจริงที่อยู่ในโค้ด (ภาษาอังกฤษตาม convention) ค้นด้วย
ชื่อนั้นตรง ๆ ได้ในไฟล์ที่ระบุ

## สรุป

| สถานะ | จำนวน |
| --- | --- |
| ครอบคลุมแล้ว | 69 |
| ครอบคลุมบางส่วน | 4 |
| ครอบคลุมไม่ได้ | 2 |
| **รวม** | **75** |

## ฝั่งผู้สอน (TC-01..TC-41)

### การเข้าสู่ระบบ

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-01 | เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน แล้วเลือกระบบ | ครอบคลุมไม่ได้ | — | flow นี้ไม่มีแล้ว ตาม D3 การเข้าสู่ระบบเปลี่ยนเป็น Google sign-in ไม่มีการ login ด้วยรหัสผ่าน และไม่มีหน้าเลือกระบบของ DEEP Core ที่ใกล้เคียงที่สุดคือ `auth.test.ts` — `POST /auth/google` "issues a session the rest of the API accepts" แต่คนละขั้นตอนกับที่ TC บรรยาย |
| TC-02 | เข้าสู่ระบบด้วยอีเมลหรือรหัสผ่านที่ผิด | ครอบคลุมไม่ได้ | — | เหตุผลเดียวกับ TC-01 การปฏิเสธผู้ใช้ที่ไม่มีสิทธิ์ยังมีอยู่และครอบไว้แล้วที่ `auth.test.ts` — "refuses a credential Google does not recognise", "refuses a verified email that is not in users, without creating one" แต่เป็นคนละกลไกกับรหัสผ่านที่ TC ตรวจ |

### การจัดการรายวิชา

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-03 | ดูรายวิชาที่สอนในเทอมปัจจุบัน | ครอบคลุมแล้ว | `course.test.ts` — `GET /course/list` "splits the teacher's sections by the term asked for", "returns only the sections this teacher is assigned to", "orders the active list by day of week, then by start time" | |
| TC-04 | ดูรายวิชาที่จัดเก็บ | ครอบคลุมแล้ว | `course.test.ts` — `GET /course/list` "splits the teacher's sections by the term asked for", "returns empty lists for a teacher who teaches nothing" | endpoint เดียวกันคืนทั้งสองรายการ การแยกรายวิชาปัจจุบันกับที่จัดเก็บคือสิ่งที่ test ตัวนี้ยืนยัน |
| TC-05 | ดูรายละเอียดรายวิชา | ครอบคลุมแล้ว | `course.test.ts` — `GET /course` "returns the section, its subject, its teacher and its schedule" | |
| TC-06 | แก้ไขวัน เวลา และห้องเรียน | ครอบคลุมแล้ว | `course.test.ts` — `POST /course/schedule` "gives an unscheduled section a schedule", "moves the existing schedule rather than adding a second one" | ครอบทั้งสามฟิลด์ — case ที่สองยืนยันว่า `classroom` เปลี่ยนเป็นค่าใหม่และไม่มีตารางซ้อนขึ้นมาอีกแถว |
| TC-07 | เพิ่มเกณฑ์คะแนน | ครอบคลุมแล้ว | `score-weight.test.ts` — `POST /score-weight` "adds a category and returns its id", "puts each new category after the last one in the section" | |
| TC-08 | เพิ่มเกณฑ์คะแนนโดยกรอกข้อมูลไม่ครบ | ครอบคลุมแล้ว | `score-weight.test.ts` — `POST /score-weight` "answers 400 when the request carries neither a category nor a weight", "answers 400 for a weight that is not a number" | ตามกติกาข้อ 2 — case แรกคือการส่ง**ไม่ครบ** ตามที่ TC บรรยาย และยืนยันว่าไม่มีแถวไหนถูกเขียนลง section case ที่สองคือการส่ง**ผิดชนิด** ซึ่งเป็นคนละความผิดพลาด ([#35](https://github.com/khthana/Deep-Portfolio/issues/35)) |
| TC-09 | แก้ไขเกณฑ์คะแนน | ครอบคลุมแล้ว | `score-weight.test.ts` — `PUT /score-weight` "changes the category name and its weight" | |
| TC-10 | ลบเกณฑ์คะแนน | ครอบคลุมแล้ว | `score-weight.test.ts` — `DELETE /score-weight` "removes the category", "leaves the activities that used it, unassigned", "does not leave the section's numbering contiguous" | case ที่สามบันทึกไว้ว่าเลขลำดับไม่ถูกเรียงใหม่หลังลบ ซึ่งต่างจากแผนการสอนที่เรียงใหม่ |
| TC-11 | เพิ่มผลการเรียนรู้ระดับรายวิชา (CLO) | ครอบคลุมแล้ว | `course-clo.test.ts` — `POST /course/clo` "adds an outcome to the section and returns its id" | |
| TC-12 | เพิ่ม CLO โดยกรอกข้อมูลไม่ครบ | ครอบคลุมแล้ว | `course-clo.test.ts` — `POST /course/clo` "answers 400 when the request carries neither a number nor a detail", "fails when the section already has that outcome number" | ตามกติกาข้อ 2 — case แรกยิง request ที่ขาดฟิลด์บังคับของ `addCLOBody` เข้าไปตรง ๆ และได้ 400 พร้อมชื่อฟิลด์ทั้งสอง ส่วน `plo_id` ไม่ถูกนับเพราะเป็นฟิลด์ที่เว้นได้ ([#35](https://github.com/khthana/Deep-Portfolio/issues/35)) |
| TC-13 | แก้ไข CLO | ครอบคลุมแล้ว | `course-clo.test.ts` — `PUT /course/clo` "changes the detail and the PLO it maps onto", "leaves the outcome number alone" | |
| TC-14 | ลบ CLO | ครอบคลุมแล้ว | `course-clo.test.ts` — `DELETE /course/clo` "removes the outcome and renumbers what is left", "renumbers only the section the outcome belonged to" | |

### การจัดการประกาศ

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-15 | สร้างประกาศพร้อมไฟล์ รูปภาพ และลิงก์ | ครอบคลุมแล้ว | `announcement.test.ts` — `POST /announcement` "posts to the section and answers with the new id", "uploads the attached files and links them to the announcement", "posts to every section of the course the teacher teaches when all_section is set" | ตั้งแต่ [#30](https://github.com/khthana/Deep-Portfolio/issues/30) "ทุกกลุ่มเรียน" หมายถึงทุกกลุ่มเรียนของรายวิชานั้น**ที่ผู้โพสต์สอน** ดู [ADR-0002](adr/0002-section-access.md) |
| TC-16 | สร้างประกาศโดยกรอกข้อมูลไม่ครบ | ครอบคลุมแล้ว | `announcement.test.ts` — `POST /announcement` "answers 400 when the post has no title and no content, and uploads nothing", "answers 400 when the request leaves out all_section", "answers 400 for content that is not JSON, and uploads nothing" | ตามกติกาข้อ 2 — case แรกยิงเข้า `title` กับ `content` ซึ่งเป็นเนื้อของประกาศตามที่ TC บรรยาย และยืนยันด้วยว่าไฟล์ที่แนบมากับ request ที่ไม่ครบไม่ได้ขึ้น bucket ([#35](https://github.com/khthana/Deep-Portfolio/issues/35)) |
| TC-17 | ดูประกาศและดาวน์โหลดไฟล์แนบ | ครอบคลุมแล้ว | `announcement.test.ts` — `GET /announcement` "returns the section's announcements, newest first", "splits each announcement's attachments into files and links"; `GET /announcement/:id/attachments` "returns the announcement's files and links"; `files.test.ts` — `GET /files` "serves the object when the URL is one this API signed" | การอ่านไฟล์ออกจาก MinIO จริงยืนยันที่ `GET /files` ซึ่งเป็น endpoint กลางไม่ผูกกับประกาศ — case ของมันอัปโหลดไฟล์ของตัวเองไปทดสอบ ไม่ใช่ไฟล์แนบของประกาศ ส่วนที่ผูกไฟล์เข้ากับประกาศยืนยันที่ `GET /announcement/:id/attachments` ตั้งแต่ [#36](https://github.com/khthana/Deep-Portfolio/issues/36) การดาวน์โหลดต้องมีลายเซ็นที่ API ออกให้ ดู [ADR-0006](adr/0006-file-access.md) |

### การจัดการแผนการสอน

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-18 | เพิ่มแผนการสอนรายสัปดาห์ | ครอบคลุมแล้ว | `lesson-plan.test.ts` — `POST /lesson-plan` "adds a week and returns its id", "takes the week number from the caller, duplicates and all" | |
| TC-19 | เพิ่มแผนการสอนโดยกรอกข้อมูลไม่ครบ | ครอบคลุมบางส่วน | `lesson-plan.test.ts` — `POST /lesson-plan` "answers 400 when week_no is missing", "answers 400 for a week number that is not a positive number" | ตามกติกาข้อ 2 |
| TC-20 | แก้ไขแผนการสอน | ครอบคลุมแล้ว | `lesson-plan.test.ts` — `PUT /lesson-plan` "changes the title, description and remark" | ช่อง "ผลที่คาดหวัง" ของ TC ข้อนี้ในเอกสารต้นฉบับเขียนว่า "ไม่สามารถบันทึกได้" ซึ่งขัดกับชื่อและขั้นตอนของมันเอง — เป็นการคัดลอกมาจาก TC-19 เทียบกับพฤติกรรมที่ขั้นตอนบรรยายไว้ |
| TC-21 | ลบแผนการสอน | ครอบคลุมแล้ว | `lesson-plan.test.ts` — `DELETE /lesson-plan` "removes the week and closes the gap in the numbering", "keeps the work that was planned in it, now in no week", "takes the week's material with it" | ช่อง "ผลที่คาดหวัง" ในเอกสารต้นฉบับคัดลอกผิดแบบเดียวกับ TC-20 |

### การจัดการสื่อการสอน

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-22 | เพิ่มเอกสารประกอบการเรียน | ครอบคลุมแล้ว | `course-material.test.ts` — `POST /course-material` "uploads a lecture file and attaches it to the week", "attaches a recording link without uploading anything", "adds to the week rather than replacing what is there" | |
| TC-23 | เพิ่มบันทึกการสอน | ครอบคลุมแล้ว | `course-material.test.ts` — `POST /course-material` (case เดียวกับ TC-22) และ `GET /course-material` "returns each week's material, split by kind" | endpoint เดียวกัน ต่างกันที่ชนิดของสื่อ ซึ่ง `GET` แยกให้เห็นในคำตอบ |
| TC-24 | ลบสื่อการสอน | ครอบคลุมแล้ว | `course-material.test.ts` — `DELETE /course-material` "removes the material and the attachment behind it", "removes the uploaded object from the bucket", "keeps the object of an attachment another record still points at" | ตั้งแต่ #34 ทั้งแถวใน `attachments` และ object ใน MinIO หายไปพร้อมสื่อการสอน ตามที่ TC คาด ดู [ADR-0008](adr/0008-attachment-lifecycle.md) |

### การวางแผนรายวิชา

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-25 | เชื่อม CLO เข้ากับกิจกรรมการประเมิน | ครอบคลุมแล้ว | `clo-mapping.test.ts` — `POST /mapping/activity` "maps the activity to the CLO and works out what it is worth", "numbers the next mapping after the ones already there"; `GET /mapping/activity` "returns the activities a CLO is measured by" | |
| TC-26 | เชื่อม CLO เข้ากับกิจกรรมการเรียนรู้ | ครอบคลุมแล้ว | `clo-mapping.test.ts` — `POST /mapping/learning-activity` "maps the learning activity to the CLO"; `GET /mapping/learning-activity` "returns the learning activities a CLO is measured by" | |
| TC-27 | วางแผนรายวิชาไม่ได้เมื่อยังไม่มี CLO | ครอบคลุมบางส่วน | `course-clo.test.ts` — `GET /course/clo` "returns an empty list for a section that has none" | ข้อมูลที่หน้าจอใช้ตัดสินใจ — รายการ CLO ที่ว่างเปล่า — ยืนยันแล้ว แต่ตัวการ์ดที่ห้ามวางแผนอยู่ในฝั่ง frontend ทั้งหมด API ไม่ปฏิเสธ request ด้วยเหตุผลนี้ |

### กิจกรรมการประเมิน

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-28 | ดูภาพรวมกิจกรรมการประเมิน | ครอบคลุมแล้ว | `activity.test.ts` — `GET /activity/list` "lists the section's activities with how far along marking is", "returns null for the score category when the activity has none" | |
| TC-29 | เพิ่มกิจกรรมการประเมิน | ครอบคลุมแล้ว | `activity.test.ts` — `POST /activity` "creates the activity, its rubric, and a row for every student enrolled", "uploads an attached brief and hangs it off the activity" | |
| TC-30 | เพิ่มกิจกรรมการประเมินโดยกรอกข้อมูลไม่ครบ | ครอบคลุมบางส่วน | `activity.test.ts` — `POST /activity` "answers 400 when the request carries no rubric", "answers 400 for a kind of work it does not have", "answers 400 for a rubric that is not JSON, and uploads nothing" | ตามกติกาข้อ 2 |
| TC-31 | แก้ไขกิจกรรมการประเมิน | ครอบคลุมแล้ว | `activity.test.ts` — `PUT /activity` "updates the activity and replaces its rubric", "keeps the marks already given when the rubric comes back untouched", "rewrites a kept criterion in place, wording and weight alike", "adds a criterion without disturbing the one already marked", "drops the marks of a criterion the teacher deleted, and only those", "drops a mark given at a level the teacher deleted", "pins: a mark stays on its level_no when the form renumbers the levels", "answers 400 for the same criterion sent twice", "answers 400 for a criterion that belongs to another activity" | [#25](https://github.com/khthana/Deep-Portfolio/issues/25) แก้แล้ว — เกณฑ์ที่ส่ง `id` กลับมาถูกเขียนทับที่เดิม คะแนนที่ตรวจไปแล้วจึงอยู่ครบ ส่วนการเรียงเลข `level_no` ใหม่ตอนลบช่วงคะแนน ปักหมุดไว้ใน [`BEHAVIOR-CHANGES.md`](../BEHAVIOR-CHANGES.md) |
| TC-32 | ลบกิจกรรมการประเมิน | ครอบคลุมแล้ว | `activity.test.ts` — `DELETE /activity` "deletes the activity and everything hanging off it" | |
| TC-33 | ดูภาพรวมการส่งงาน | ครอบคลุมแล้ว | `activity.test.ts` — `GET /activity/submitted/list` "returns the students who have handed something in"; `GET /activity/student/detail` "returns one student's submission alongside the activity itself" | |
| TC-34 | ตรวจงานด้วย rubric พร้อมให้ feedback | ครอบคลุมแล้ว | `student-activity.test.ts` — `POST /student-activity/grade` "scores an individual submission from the levels it is given", "replaces the levels a re-marked submission was given before", "writes the student's share of every CLO the activity is mapped to", "gives every member of a group the same score" | การคำนวณคะแนนและการเขียนคะแนนกลับเข้า CLO ยืนยันด้วยตัวเลขจริงในฐานข้อมูล |
| TC-35 | บันทึก (bookmark) งานที่ส่ง | ครอบคลุมแล้ว | `student-activity.test.ts` — `PATCH /student-activity/bookmark` "bookmarks an individual submission", "clears a bookmark it was asked to clear", "bookmarks every member's submission for group work" | |

### กิจกรรมการเรียนรู้

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-36 | สร้างกิจกรรมการเรียนรู้ | ครอบคลุมแล้ว | `learning-activity.test.ts` — `POST /learning-activity` "creates the activity and a row for every student enrolled", "uploads an attached worksheet and hangs it off the activity" | |
| TC-37 | แก้ไขกิจกรรมการเรียนรู้ | ครอบคลุมแล้ว | `learning-activity.test.ts` — `PUT /learning-activity` "updates the activity, adding and removing attachments" | |
| TC-38 | ลบกิจกรรมการเรียนรู้ | ครอบคลุมแล้ว | `learning-activity.test.ts` — `DELETE /learning-activity` "deletes the activity and the students' rows with it" | |
| TC-39 | ตรวจกิจกรรมการเรียนรู้ | ครอบคลุมแล้ว | `student-learning-activity.test.ts` — `POST /student-learning-activity/grade` "marks an individual submission graded with the feedback given", "marks every member of a group graded at once", "marks a PENDING member graded along with the rest" | |

### สมุดคะแนน

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-40 | ดูสมุดคะแนน | ครอบคลุมแล้ว | `gradebook.test.ts` — `GET /gradebook/per-student` "reports each student's marks, counts and total", "counts a submission handed in after the deadline as late", "adds marks of 10 and 10.01 up to exactly 20.01"; `GET /gradebook/per-activity` "reports the spread of the class across each piece of work", "rounds the mean to the two decimal places a score is stored with", "reports nothing, not zero, for work nobody has a mark for", "still reports zero for a class that was marked and scored zero" | ครอบทั้งสองมุมมองของสมุดคะแนน รวมถึงการปัดเศษ และสถิติของงานที่ยังไม่มีใครถูกตรวจ ซึ่งเคย pin ไว้และปิดแล้วใน [#28](https://github.com/khthana/Deep-Portfolio/issues/28) ส่วนการตรวจว่าอาจารย์สอนกลุ่มเรียนนั้นจริง ปิดแล้วใน [#30](https://github.com/khthana/Deep-Portfolio/issues/30) — case "refuses a teacher who does not teach the section" ทั้งสอง endpoint ดู [ADR-0002](adr/0002-section-access.md) |

### ข้อมูลนักศึกษา

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-41 | ดูข้อมูลนักศึกษาในรายวิชา | ครอบคลุมแล้ว | `student.test.ts` — `GET /student/list` "returns the students enrolled in a section, by id", "leaves out students enrolled in a different section" | |

## ฝั่งผู้เรียน (TC-42..TC-75)

### การส่งงาน

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-42 | สร้างกลุ่มสำหรับงานกลุ่ม | ครอบคลุมแล้ว | `activity-group.test.ts` — `POST /student-activity-group` "creates the group, its members and a submission row for each", "reuses a submission row the student already had"; `PATCH /student-activity-group` "adds a member and keeps the answers the existing ones already gave", "removes a member left out of the new list"; `DELETE /student-activity-group/:group_id` "disbands the group and leaves everyone's submission behind" | สาม `GET` ที่หน้าจอนี้ใช้อ่านกลุ่ม อ่านนักศึกษาจาก session แล้วตั้งแต่ [#26](https://github.com/khthana/Deep-Portfolio/issues/26) — case "answers about the caller, whoever the request names" และ "refuses a student who is not enrolled in the section" ทั้งสองไฟล์ ดู [ADR-0003](adr/0003-enrolment-access.md) ส่วนการแก้รายชื่อเป็นสิทธิ์ของหัวหน้ากลุ่มแล้วตั้งแต่ [#27](https://github.com/khthana/Deep-Portfolio/issues/27) — case "refuses a member who is not the leader" ทั้ง `PATCH` และ `DELETE` ทั้งสองไฟล์ ดู [ADR-0004](adr/0004-group-leader.md) ส่วนตัว `POST` เอง ปิดแล้วใน [#37](https://github.com/khthana/Deep-Portfolio/issues/37) — ผู้สร้างต้องเป็นหัวหน้าของรายชื่อที่ส่งมา case "refuses a caller who leads none of the list they sent" และ "refuses a caller who is not in the list at all" และสมาชิกทุกคนต้องลงทะเบียนกลุ่มเรียนนั้น case "refuses a member who is not enrolled in the section" ทั้ง `POST` และ `PATCH` ทั้งสองไฟล์ ดู [ADR-0007](adr/0007-group-membership.md) |
| TC-43 | ส่งงานพร้อมไฟล์แนบและลิงก์ | ครอบคลุมแล้ว | `student-submit.test.ts` — `POST /student/submit/activity` "marks the submission SUBMITTED and stores the uploaded file", "records a link without uploading anything", "drops an attachment the resubmission does not name again", "submits for every accepted member of a group at once"; `submission.test.ts` — "uploads the files, records them and marks the work submitted" | |
| TC-44 | ดูผลการประเมิน | ครอบคลุมแล้ว | `evaluation.test.ts` — `GET /evaluation/list` "lists an announced activity with the student's mark and the class spread", "leaves the class spread empty until somebody has been marked", "shows each student their own mark", "hides work whose announcement date has not arrived", "shows work that was never given an announcement date" | สถิติของชั้นเรียนที่ endpoint นี้ส่งต่อมา ปิดแล้วใน [#28](https://github.com/khthana/Deep-Portfolio/issues/28) ส่วนงานที่ไม่เคยกรอกวันประกาศ ปิดแล้วใน [#29](https://github.com/khthana/Deep-Portfolio/issues/29) — ค่าว่างแปลว่าประกาศแล้ว ดู [ADR-0005](adr/0005-announcement-date.md) |

### ปฏิทินการเรียน

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-45 | ดูปฏิทินการเรียน | ครอบคลุมแล้ว | `student-calendar.test.ts` — `GET /student/calendar` "returns the student's classes and announced work for the term", "leaves out another student's work in the same section", "reads the student from the session, not from the query" | |

### e-Portfolio หน้าข้อมูลส่วนตัว

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-46 | ข้อมูลส่วนตัวเริ่มต้นถูกดึงมาจากบัญชี | ครอบคลุมแล้ว | `portfolio-personal.test.ts` — `GET /portfolio-personal/:user_id` "falls back to the account's email and telephone", "answers with the account's details for a student who has entered none", "does not hand back the account row the fallback came from" | |
| TC-47 | บันทึกข้อมูลส่วนตัวพร้อมรูปโปรไฟล์ | ครอบคลุมแล้ว | `portfolio-personal.test.ts` — `POST /portfolio-personal` "creates the details and hands them back", "uploads the profile picture and points the row at it"; `PUT /portfolio-personal/:user_id` "overwrites the fields the request carries" | |

### e-Portfolio ส่วนประวัติการศึกษา

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-48 | เพิ่มประวัติการศึกษา | ครอบคลุมแล้ว | `portfolio-education.test.ts` — `POST /portfolio-education` "creates an entry and hands it back"; `GET /portfolio-education/:id` "sends the grade average as a number" | |
| TC-49 | แก้ไขประวัติการศึกษา | ครอบคลุมแล้ว | `portfolio-education.test.ts` — `PUT /portfolio-education/:id` "overwrites the fields the request carries" | |
| TC-50 | ลบประวัติการศึกษา | ครอบคลุมแล้ว | `portfolio-education.test.ts` — `DELETE /portfolio-education/:id` "removes the entry and leaves the others alone" | รายการนี้ไม่มีไฟล์แนบ จึงไม่เคยติดปัญหาแบบ TC-56 และ TC-62 |

### e-Portfolio ส่วนการฝึกอบรม

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-51 | เพิ่มประวัติการอบรมพร้อมไฟล์แนบ | ครอบคลุมแล้ว | `portfolio-training.test.ts` — `POST /portfolio-training` "creates an entry and hands it back", "uploads the certificates and attaches them to the entry", "reads the year and the visibility flag back out of multipart strings" | |
| TC-52 | แก้ไขประวัติการอบรม | ครอบคลุมแล้ว | `portfolio-training.test.ts` — `PUT /portfolio-training/:id` "overwrites the fields the request carries", "adds the uploaded files to what is already attached", "deletes what the request asks to be rid of, row and object" | ตั้งแต่ #34 สิ่งที่ `ids_to_delete` เอ่ยถึงถูกลบจริงทั้งแถวและ object ไม่ใช่แค่ตัดการเชื่อม |
| TC-53 | ลบประวัติการอบรม | ครอบคลุมแล้ว | `portfolio-training.test.ts` — `DELETE /portfolio-training/:id` "removes the entry and what was attached to it", "keeps an attachment another entry still points at" | TC ข้อนี้คาดแค่ว่ารายการหายจากฐานข้อมูล ไม่ได้พูดถึงไฟล์แนบ แต่ตั้งแต่ #34 ไฟล์แนบก็หายไปด้วยเหมือน TC-56 |

### e-Portfolio ส่วนคุณวุฒิทางวิชาชีพ

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-54 | เพิ่มคุณวุฒิทางวิชาชีพ | ครอบคลุมแล้ว | `portfolio-certificate.test.ts` — `POST /portfolio-certificate` "creates a certificate and hands it back", "uploads the certificates and attaches them to the entry" | |
| TC-55 | แก้ไขคุณวุฒิ พร้อมลบไฟล์แนบเดิมและอัปโหลดใหม่ | ครอบคลุมแล้ว | `portfolio-certificate.test.ts` — `PUT /portfolio-certificate/:id` "overwrites the fields the request carries", "swaps an attachment out for a new one in a single request" | case ที่สองครอบทั้งสามอย่างที่ TC บรรยายในคำขอเดียว — แก้ฟิลด์ ลบของเดิม อัปโหลดของใหม่ — และเป็นของ route นี้เอง ไม่ใช่การชี้ไปที่ test ของ training ของที่ถูกลบหายทั้ง join row แถวใน `attachments` และ object ใน MinIO ตาม [ADR-0008](adr/0008-attachment-lifecycle.md) ([#35](https://github.com/khthana/Deep-Portfolio/issues/35)) |
| TC-56 | ลบคุณวุฒิ โดยไฟล์แนบต้องหายจากฐานข้อมูลด้วย | ครอบคลุมแล้ว | `portfolio-certificate.test.ts` — `DELETE /portfolio-certificate/:id` "removes the certificate and what was attached to it" | ตั้งแต่ #34 แถวใน `attachments` หายไปพร้อมคุณวุฒิ ซึ่งเป็นครึ่งที่ TC ระบุไว้ตรง ๆ ดู [ADR-0008](adr/0008-attachment-lifecycle.md) |

### e-Portfolio ส่วนทักษะและผลงาน

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-57 | เพิ่มข้อมูลผลงานและเชื่อมกับงานที่ส่ง | ครอบคลุมแล้ว | `portfolio-skill.test.ts` — `POST /portfolio-skill` "creates a skill and hands it back", "writes the mappings the request carries along with the skill"; `POST /portfolio-skill/assign-work` "maps the submission onto every skill the request names" | |
| TC-58 | แก้ไขข้อมูลผลงาน | ครอบคลุมแล้ว | `portfolio-skill.test.ts` — `PUT /portfolio-skill/:id` "renames the skill", "replaces the mappings rather than adding to them", "leaves the mappings alone when the request says nothing about them" | |
| TC-59 | ลบข้อมูลผลงาน | ครอบคลุมแล้ว | `portfolio-skill.test.ts` — `DELETE /portfolio-skill/:id` "removes the skill and the mappings hanging off it"; `DELETE /portfolio-skill/mapping/:id` "removes the mapping and leaves the skill standing" | |

### e-Portfolio ส่วนการฝึกงาน/สหกิจศึกษา

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-60 | เพิ่มประวัติฝึกงาน/สหกิจศึกษา | ครอบคลุมแล้ว | `portfolio-internship.test.ts` — `POST /portfolio-internship` "creates a placement and hands it back", "reads the is_show flags out of the strings multipart carries", "uploads the files and hangs them off the placement" | |
| TC-61 | แก้ไขข้อมูลฝึกงาน/สหกิจศึกษา | ครอบคลุมแล้ว | `portfolio-internship.test.ts` — `PUT /portfolio-internship/:id` "overwrites the fields the request carries", "adds the uploaded files to the ones already there", "deletes the attachment ids_to_delete names" | ตั้งแต่ #34 ไฟล์แนบที่ถูกเอาออกจากรายการสุดท้ายที่ถืออยู่ ถูกลบจริง ไม่ใช่แค่ตัดการเชื่อม |
| TC-62 | ลบข้อมูลฝึกงาน โดยไฟล์แนบต้องถูกเคลียร์ด้วย | ครอบคลุมแล้ว | `portfolio-internship.test.ts` — `DELETE /portfolio-internship/:id` "removes the placement, its join rows and what they pointed at" | เหมือน TC-56 — ตั้งแต่ #34 แถวใน `attachments` หายไปด้วย ดู [ADR-0008](adr/0008-attachment-lifecycle.md) |

### e-Portfolio ส่วนโครงงานปริญญาตรี

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-63 | เพิ่มโครงงานปริญญาตรี | ครอบคลุมแล้ว | `portfolio-thesis.test.ts` — `POST /portfolio-thesis` "creates a project and hands it back", "reads the four is_show flags out of the strings multipart carries", "uploads the files and hangs them off the project" | |
| TC-64 | แก้ไขโครงงานปริญญาตรี | ครอบคลุมแล้ว | `portfolio-thesis.test.ts` — `PUT /portfolio-thesis/:id` "overwrites the fields the request carries", "adds the uploaded files to the ones already there", "deletes the attachment ids_to_delete names" | ตั้งแต่ #34 ไฟล์แนบที่ถูกเอาออกจากรายการสุดท้ายที่ถืออยู่ ถูกลบจริง ไม่ใช่แค่ตัดการเชื่อม |
| TC-65 | ลบโครงงานปริญญาตรี | ครอบคลุมแล้ว | `portfolio-thesis.test.ts` — `DELETE /portfolio-thesis/:id` "removes the project, its join rows and what they pointed at" | TC ข้อนี้คาดแค่ว่าการ์ดหายและข้อมูลถูกลบ ไม่ได้ระบุถึงไฟล์แนบ ซึ่งตั้งแต่ #34 ก็หายไปด้วย |

### e-Portfolio ส่วนรางวัลและการแข่งขัน

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-66 | เพิ่มรางวัล | ครอบคลุมแล้ว | `portfolio-award.test.ts` — `POST /portfolio-award` "creates a prize and hands it back", "stores no date when the request carries none", "uploads the files and hangs them off the prize" | |
| TC-67 | แก้ไขรางวัล | ครอบคลุมแล้ว | `portfolio-award.test.ts` — `PUT /portfolio-award/:id` "overwrites the fields the request carries", "clears the date when the request sends an empty one", "deletes the attachment ids_to_delete names" | ตั้งแต่ #34 ไฟล์แนบที่ถูกเอาออกจากรายการสุดท้ายที่ถืออยู่ ถูกลบจริง ไม่ใช่แค่ตัดการเชื่อม |
| TC-68 | ลบรางวัล | ครอบคลุมแล้ว | `portfolio-award.test.ts` — `DELETE /portfolio-award/:id` "removes the prize, its join rows and what they pointed at" | เอกสารต้นฉบับพิมพ์เลขข้อนี้ผิดเป็น TC-65 ตารางนี้เดินตามลำดับหัวข้อ |

### e-Portfolio ส่วนกิจกรรม

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-69 | เพิ่มกิจกรรม | ครอบคลุมแล้ว | `portfolio-activity.test.ts` — `POST /portfolio-activity` "creates an activity and hands it back", "drops an empty date rather than sending it on", "uploads the files and hangs them off the activity" | |
| TC-70 | แก้ไขกิจกรรม | ครอบคลุมแล้ว | `portfolio-activity.test.ts` — `PUT /portfolio-activity/:id` "overwrites the fields the request carries", "deletes the attachment ids_to_delete names" | ตั้งแต่ #34 ไฟล์แนบที่ถูกเอาออกจากรายการสุดท้ายที่ถืออยู่ ถูกลบจริง ไม่ใช่แค่ตัดการเชื่อม |
| TC-71 | ลบกิจกรรม | ครอบคลุมแล้ว | `portfolio-activity.test.ts` — `DELETE /portfolio-activity/:id` "removes the activity, its join rows and what they pointed at" | |

### e-Portfolio ส่วน e-Portfolio

| TC | เรื่อง | สถานะ | test ที่ครอบ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| TC-72 | เพิ่ม e-Portfolio | ครอบคลุมแล้ว | `portfolio.test.ts` — `POST /portfolio` "creates a portfolio and hands it back", "puts the chosen skills on the new portfolio" | |
| TC-73 | แก้ไขข้อมูล e-Portfolio | ครอบคลุมแล้ว | `portfolio.test.ts` — `PUT /portfolio/:id` "overwrites the fields the request carries", "replaces the chosen skills rather than adding to them"; `PATCH /portfolio/:id` "updates the same way PUT does" | |
| TC-74 | ลบ e-Portfolio | ครอบคลุมแล้ว | `portfolio.test.ts` — `DELETE /portfolio/:id` "removes the portfolio and the skills chosen for it" | |
| TC-75 | e-Portfolio แสดงผลถูกต้อง | ครอบคลุมบางส่วน | `portfolio.test.ts` — `GET /portfolio/public/:token` "returns the whole portfolio to a caller with the link", "shows only the sections belonging to the portfolio's owner", "answers 410 once the link has expired" | ข้อนี้เป็น TC เดียวที่การแสดงผล *คือ* ตัวข้อกำหนดทั้งหมด ไม่ใช่การวาดผลของการเปลี่ยนสถานะ ข้อมูลที่ API ส่งออกมาตรงกับฐานข้อมูล — ยืนยันแล้ว ส่วนที่ว่าหน้าเว็บวาดข้อมูลนั้นถูกต้องหรือไม่ ไม่มีรอยต่อไหนตรวจได้ |

## ช่องว่างที่พบระหว่างไล่ตาราง

"ครอบคลุมบางส่วน" เคยมี 8 ข้อ แยกเป็นสองกอง

- **4 ข้อติดที่รอยต่อจริง ๆ** — TC-19, TC-27, TC-30, TC-75 ยังเป็น
  "ครอบคลุมบางส่วน" อยู่
- **4 ข้อมีครึ่งที่เขียน test ได้ที่รอยต่อเดิมแต่ยังไม่มีคนเขียน** — TC-08,
  TC-12, TC-16, TC-55 เขียนแล้วใน #35 ทั้งสี่ข้อจึงเป็น "ครอบคลุมแล้ว"

กองหลังคือช่องว่างจริง ไม่ใช่ข้อจำกัด เปิดเป็น issue แยกไว้ตามที่ #22 กำหนด
ไม่กลบไว้ในช่องหมายเหตุ

### ไฟล์แนบค้างอยู่หลังลบเจ้าของรายการ — [#34](https://github.com/khthana/Deep-Portfolio/issues/34) **แก้แล้ว**

TC-24, TC-56 และ TC-62 เคยเป็น "ครอบคลุมบางส่วน" ด้วยเหตุผลเดียวกัน — ทั้งสามข้อ
คาดว่าไฟล์แนบจะหายไปพร้อมกับรายการที่มันแขวนอยู่ แต่ endpoint ลบเฉพาะ join row
แล้วปล่อยแถวใน `attachments` กับ object ใน MinIO ทิ้งไว้ และ test ก็ยืนยันพฤติกรรม
ที่ผิดนั้นไว้ตรง ๆ

#34 ปิดเรื่องนี้แล้ว ไฟล์แนบที่ไม่มีตารางไหนชี้ถึงอีกถูกลบทั้งแถวและ object ทุก
endpoint ที่ลบรายการ test ทั้งสามชุดถูกแก้ให้ยืนยันพฤติกรรมใหม่ ไม่ใช่ถูกลบทิ้ง
ทั้งสามข้อจึงเป็น "ครอบคลุมแล้ว" การตัดสินใจอยู่ใน
[ADR-0008](adr/0008-attachment-lifecycle.md) และสิ่งที่ผู้เรียกเห็นต่างไปอยู่ใน
[`BEHAVIOR-CHANGES.md`](../BEHAVIOR-CHANGES.md)

### test ที่เขียนได้แต่ยังไม่มีคนเขียน — [#35](https://github.com/khthana/Deep-Portfolio/issues/35) **เขียนแล้ว**

TC-08, TC-12, TC-16 และ TC-55 ถูกให้สถานะ "ครอบคลุมบางส่วน" โดยที่ครึ่งซึ่งขาด
ไปไม่ได้ติดอะไรเลยนอกจากยังไม่มีคนเขียน — ไม่ใช่เพราะรอยต่อแตะไม่ถึง

- `POST /score-weight` และ `POST /course/clo` บังคับฟิลด์ผ่าน validator ตั้งแต่
  #20 แต่ไม่มี case ไหนยิง request ที่ขาดฟิลด์เข้าไปตรง ๆ — case ที่มีเป็นการส่ง
  ผิดชนิดและการชนกันของข้อมูลที่มีอยู่ ซึ่งคนละอย่างกับที่ TC บรรยาย
- `POST /announcement` เหมือนกัน — case ที่มียิงเข้า `all_section` และ `content`
  ไม่ใช่ `title`
- `PUT /portfolio-certificate/:id` ไม่มี case ของ `ids_to_delete` ของตัวเอง

#35 เขียนครบทั้งสี่ข้อแล้วที่รอยต่อเดิมด้วย supertest ตามที่คาดไว้ ไม่มีข้อไหน
ต้องแก้พฤติกรรมตาม D9 — validator ปฏิเสธ request ที่ขาดฟิลด์อยู่แล้วจริง สิ่งที่
ขาดคือ case ที่ยืนยันมัน ข้อ TC-55 เขียนตามพฤติกรรมหลัง [#34](https://github.com/khthana/Deep-Portfolio/issues/34)
คือไฟล์ที่ถูกดึงออกหายไปจริงทั้งแถวและ object ไม่ใช่แค่ join row

### ส่วนที่ไม่เปิด issue ให้

TC-19, TC-27, TC-30 และ TC-75 เป็น "ครอบคลุมบางส่วน" ด้วยเหตุผลของรอยต่อล้วน ๆ
— ครึ่งที่ขาดคือ inline error ในฟอร์ม การ์ดฝั่ง frontend และการวาดหน้าเว็บ
ซึ่งการจะครอบมันได้ต้องเพิ่มรอยต่อที่สาม (component test หรือ E2E) ที่ T2 ตัดออก
ไปตั้งแต่ต้น ไม่ใช่ช่องว่างที่ตั้งตั๋วแล้วจะมีคนปิดได้
