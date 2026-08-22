# packages/

shared package ที่ทั้ง `apps/api` และ `apps/web` ใช้ร่วมกัน ตอนนี้มีตัวเดียว

## `api-types` — `@deep-portfolio/api-types`

รูปของสิ่งที่ `apps/api` ตอบ เขียนด้วยมือตามที่ JSON ส่งจริง (วันที่เป็น string
ไม่ใช่ `Date`) และ**ทั้งสองฝั่ง import จากที่นี่** ฝั่ง API ผูก return ของ
service ไว้กับมัน คอมไพเลอร์จึงเป็นคนบอกเวลารูปเปลี่ยน ไม่ใช่ผู้ใช้ฝั่ง web

ไม่มี build step — `package.json` ชี้ทั้ง `types` และ `exports` ไปที่
`src/index.ts` ตรง ๆ เพราะข้างในเป็น type ล้วน ซึ่งถูกลบทิ้งตอนคอมไพล์อยู่แล้ว
แก้ไฟล์แล้วอีกฝั่งเห็นทันที ไม่ต้องสั่งอะไรก่อน

**request body ไม่อยู่ที่นี่** เจ้าของคือ zod schema ที่
`apps/api/src/validation/` ซึ่งเป็นสิ่งที่ปฏิเสธ request จริง ๆ ตอน runtime

ตอนนี้ถือ envelope (`ApiResponse`, `ApiError`, `FieldError`, `FieldLocation`),
response ของ course, response ของ gradebook, response ของรายการผลการประเมิน,
response ของ activity พร้อม rubric กับหมวดคะแนน, response ของ
learning-activity, response ของสองเส้นส่งงานพร้อมรูปกลุ่มกับชื่อนักศึกษา,
response ของหน้ากลุ่มฝั่งนักศึกษาทั้งสิบเส้นพร้อมเส้นตรวจคำเชิญ,
response ของสัดส่วนคะแนน (ซึ่งรอบ activity เขียนไว้ให้ล่วงหน้าแล้ว),
response ของประกาศ, response ของเอกสารประกอบการสอน,
response ของแผนการสอนรายสัปดาห์ทั้งฝั่งอาจารย์และฝั่งนักศึกษา,
response ของ e-Portfolio แปด section (รายละเอียดส่วนตัว, ประวัติการศึกษา,
การอบรม, ใบประกาศ, รางวัล, ปริญญานิพนธ์, กิจกรรม, ฝึกงาน) พร้อมรูปของไฟล์แนบ
ที่หก section ในนั้นใช้ร่วมกัน,
รูปของไฟล์แนบ (`AttachmentDetailResp`, `FileDetail`, `URLDetail`) และ
`StudentActivityStatusDB`
ฝั่ง web ยังเหลือไฟล์ type ที่เขียนเองอีก 33 ไฟล์ 1,650 บรรทัด (นับหลังรอบหก
section ที่เหลือของ e-Portfolio 22 สิงหาคม 2569 ด้วย glob ที่ ADR-0028 ประกาศไว้ — ในนั้นมี type
ของ request ปนอยู่ด้วย ซึ่งไม่ต้องย้าย) ซึ่งไล่ย้ายทีละ
feature ที่ [#68](https://github.com/khthana/Deep-Portfolio/issues/68) ส่วน
envelope ฝั่ง web (`ResponseWrapper`) อยู่ที่
[#67](https://github.com/khthana/Deep-Portfolio/issues/67)

เหตุผลทั้งหมดอยู่ใน [ADR-0028](../docs/adr/0028-shared-api-types.md) — อ่านก่อน
เพิ่ม type ใหม่เข้ามา — และ
[ADR-0029](../docs/adr/0029-api-types-per-feature.md) คือกติกาของแต่ละรอบที่ย้าย
feature เข้ามา ส่วน [ADR-0030](../docs/adr/0030-evaluation-row-union.md) คือรอบ
evaluation ซึ่งตัดสินว่า response ที่ถือแถวหลายแบบให้เขียนเป็น union และ
[ADR-0031](../docs/adr/0031-attachments-are-the-leaf.md) คือลำดับของรอบที่เหลือ
ซึ่งกำหนดโดยกราฟการพึ่งพา — อ่านก่อนเลือก feature ถัดไป ส่วน
[ADR-0032](../docs/adr/0032-activity-follows-the-row.md) คือรอบ activity ซึ่งเจอ
ว่า `as` ที่ครอบทั้งวัตถุกลบรูปของทุก field ที่เหลือไปด้วย และ
[ADR-0033](../docs/adr/0033-learning-activity-and-the-absent-key.md) คือรอบ
learning-activity ซึ่งแยกคีย์ที่ไม่มีอยู่ออกจากคีย์ที่เป็น `null` และ
[ADR-0034](../docs/adr/0034-submissions-move-as-a-pair.md) คือรอบส่งงาน ซึ่งอธิบาย
ว่าทำไมสอง feature ที่ใช้รูปเดียวกันจริง ๆ ถึงย้ายรอบเดียวกัน และ
[ADR-0035](../docs/adr/0035-one-group-shape-for-both-halves.md) คือรอบกลุ่ม ซึ่ง
ตัดสินว่าสองครึ่งที่ตอบเหมือนกันทุกฟิลด์ใช้ประกาศชุดเดียว ไม่ทำคู่แฝดตามชื่อ route
และรอบหนึ่งกินทั้งเส้นอ่านและเส้นเขียนของ feature นั้น ส่วน
[ADR-0036](../docs/adr/0036-a-bare-scalar-gets-no-name.md) คือรอบสัดส่วนคะแนน
ซึ่งตัดสินว่า response ที่เป็นค่าเดี่ยวไม่ต้องตั้งชื่อให้ และ
[ADR-0037](../docs/adr/0037-the-package-says-what-the-wire-says.md) คือรอบประกาศ
ซึ่งตัดสินว่า enum ในนี้สะกดตามที่ออกสายจริง ไม่ใช่ตามธรรมเนียมของ package และ
[ADR-0038](../docs/adr/0038-a-factory-must-be-able-to-say-null.md) คือรอบเอกสาร
ประกอบการสอน ซึ่งตัดสินว่า factory ต้องแยก "ไม่ส่ง" ออกจาก "ส่ง null" ให้ได้ และ
[ADR-0039](../docs/adr/0039-the-row-and-what-is-added-to-it.md) คือรอบแผนการสอน
ซึ่งตัดสินว่าเส้นที่ตอบ "แถวเดิมบวกอะไรบางอย่าง" เขียนเป็นการต่อ type ไม่ใช่
เขียนคอลัมน์ซ้ำใหม่ทั้งแถว และ
[ADR-0040](../docs/adr/0040-the-portfolio-is-ten-features.md) คือรอบแรกของ
e-Portfolio ซึ่งตัดสินว่าชื่อที่ router สิบตัวใช้ร่วมกันเป็นคำนำหน้า URL ไม่ใช่
feature เดียว จึงเดินเป็นหลายรอบ โดยรอบที่รวมทุกส่วนไปท้ายสุด และ
[ADR-0041](../docs/adr/0041-one-attachment-shape-for-six-sections.md) คือรอบหก
section ที่เหลือ ซึ่งตัดสินว่ารูปที่หลาย feature เขียนซ้ำกันเองมีชื่อเดียว และ
ความ nullable ของมันอ่านจากโค้ดที่สร้างค่า ไม่ใช่จากสำเนาไหน

## เพิ่ม package ใหม่

`package.json` ที่ root ประกาศ `packages/*` เป็น workspace ไว้แล้ว สร้างโฟลเดอร์
พร้อม `package.json` ที่นี่ ใส่ชื่อลงใน `dependencies` ของ app ที่จะใช้เป็น `"*"`
แล้วรัน `npm install` **ที่ root** ครั้งเดียว
