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
รูปของไฟล์แนบ (`AttachmentDetailResp`, `FileDetail`, `URLDetail`) และ
`StudentActivityStatusDB` ฝั่ง web ยังเหลือไฟล์ type ที่เขียนเองอีก 38 ไฟล์
2,096 บรรทัด (นับ 19 สิงหาคม 2569 — ในนั้นมี type ของ request ปนอยู่ด้วย
ซึ่งไม่ต้องย้าย) ซึ่งไล่ย้ายทีละ
feature ที่ [#68](https://github.com/khthana/Deep-Portfolio/issues/68) ส่วน
envelope ฝั่ง web (`ResponseWrapper`) อยู่ที่
[#67](https://github.com/khthana/Deep-Portfolio/issues/67)

เหตุผลทั้งหมดอยู่ใน [ADR-0028](../docs/adr/0028-shared-api-types.md) — อ่านก่อน
เพิ่ม type ใหม่เข้ามา — และ
[ADR-0029](../docs/adr/0029-api-types-per-feature.md) คือกติกาของแต่ละรอบที่ย้าย
feature เข้ามา ส่วน [ADR-0030](../docs/adr/0030-evaluation-row-union.md) คือรอบ
evaluation ซึ่งตัดสินว่า response ที่ถือแถวหลายแบบให้เขียนเป็น union และ
[ADR-0031](../docs/adr/0031-attachments-are-the-leaf.md) คือลำดับของรอบที่เหลือ
ซึ่งกำหนดโดยกราฟการพึ่งพา — อ่านก่อนเลือก feature ถัดไป

## เพิ่ม package ใหม่

`package.json` ที่ root ประกาศ `packages/*` เป็น workspace ไว้แล้ว สร้างโฟลเดอร์
พร้อม `package.json` ที่นี่ ใส่ชื่อลงใน `dependencies` ของ app ที่จะใช้เป็น `"*"`
แล้วรัน `npm install` **ที่ root** ครั้งเดียว
