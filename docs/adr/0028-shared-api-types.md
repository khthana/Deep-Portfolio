# ADR-0028 — type ของ response อยู่ใน package กลาง เขียนมือตามที่ JSON ส่งจริง

- **สถานะ**: ตัดสินแล้ว 13 สิงหาคม 2569
- **ที่มา**: [issue #61](https://github.com/khthana/Deep-Portfolio/issues/61)
- **เกี่ยวข้อง**: [ADR-0023](0023-unaccepted-members-have-their-own-field.md)
  คือครั้งล่าสุดที่รูปของ response เปลี่ยนแล้วฝั่ง web ต้องตามเป็นตั๋วแยก (#53
  แล้ว #54) ใบนี้ทำให้ครั้งหน้าคอมไพเลอร์เป็นคนบอก

## บริบท

`apps/web` เขียน type ที่มิเรอร์ response ของ `apps/api` ไว้เอง 38 ไฟล์ 2,234
บรรทัด (นับก่อนใบนี้ 13 สิงหาคม 2569 จาก `apps/web/src/types/*.ts`,
`apps/web/src/features/**/types/*.ts` และ `apps/web/src/features/**/types.ts` —
ในนั้นมี type ของ request ปนอยู่ด้วย ซึ่งไม่ได้เป็นสำเนาของอะไร)
ฝั่ง API ไม่รู้จักไฟล์เหล่านั้นเลย เวลารูป
ของ response เปลี่ยน จึงไม่มีอะไรบอกว่าฝั่ง web ตามหรือยัง — คอมไพเลอร์เห็นแค่
สำเนาที่ web เขียนไว้เอง ซึ่งยังคอมไพล์ผ่านแม้จะเลิกตรงกับของจริงไปแล้ว

ที่สำคัญกว่าคือ **มันไม่ตรงอยู่แล้วตั้งแต่ก่อนเริ่มใบนี้** วัดจาก course feature
อย่างเดียวก็เจอสี่แบบ

1. `CLOResp.created_at` กับ `PLOResp.created_at`/`updated_at` ถูกเขียนเป็น `Date`
   ทั้งที่ JSON ไม่มีชนิดวันที่ — สิ่งที่ผู้เรียกได้รับคือ string เสมอ
2. `clo_number`, `clo_detail`, `plo_id` ถูกเขียนว่าไม่มีวันว่าง ทั้งที่ทั้งสาม
   คอลัมน์ใน `schema.prisma` เป็น nullable
3. `PLOResp` ไม่มี `section_id` ทั้งที่ API ส่งทั้งแถว
4. `outcome_type` ถูกเขียนเป็น `string` ทั้งที่ enum มีสี่ค่า

ไม่มีอันไหนเคยทำให้จอพัง เพราะไม่มีใครอ่านฟิลด์ที่ผิด แต่ก็ไม่มีอะไรมาบอกด้วยว่า
มันผิด

## การตัดสินใจ

**1. เขียนมือเป็น wire type ไม่ generate**

`packages/api-types/src/*.ts` เขียนด้วยมือ ตามสิ่งที่ endpoint ตอบจริง ที่ไม่
generate เพราะไม่มีต้นทางให้ generate จริง ๆ สักทาง

- zod schema ที่ `apps/api/src/validation/` ครอบ **request** อย่างเดียว ไม่มี
  endpoint ไหนมี schema ของ response เลยแม้แต่ตัวเดียว
- generate จาก `schema.prisma` จะได้รูปของ*ฐานข้อมูล* ไม่ใช่รูปของ JSON ข้อ 1
  ในบริบทข้างบนคือตัวอย่างที่ชัดที่สุด: Prisma ถือ `DateTime` แต่ผู้เรียกอ่าน
  string เสมอ generator ที่ซื่อสัตย์กับ schema จะโกหกผู้เรียก

ชื่อในไฟล์จึงลงท้ายด้วยสิ่งที่มันเป็น (`…Resp`) และคอมเมนต์เขียนกำกับไว้ว่า
"อ่านอย่างที่ JSON อ่าน"

**2. ทั้งสองฝั่ง import ไม่ใช่ทางเดียว**

`apps/api` ไม่ได้แค่เป็นเจ้าของนิยาม แต่ import มาใช้เองด้วย นี่คือข้อที่ทำให้
ใบนี้มีค่ามากกว่าการย้ายไฟล์: `course.service.ts` ผูก return ของตัวเองไว้กับ
`CourseDetail`/`TeacherCourseListResp` จาก package แล้ว วันที่ใครแก้ service
จนรูปเปลี่ยน คอมไพเลอร์ฝั่ง API จะเป็นคนทัก ไม่ใช่ผู้ใช้ฝั่ง web

`utils/response.ts` กับ `validation/validation-error.ts` เลิกประกาศ envelope
เองแล้ว ทั้งสองไฟล์อ่าน `ApiResponse`/`ApiError`/`FieldError` จาก package และ
`satisfies` สองบรรทัดใน `successResponse`/`errorResponse` คือสิ่งที่ผูกไว้

**3. นำร่อง feature เดียวก่อน**

รอบนี้ย้ายแค่ envelope กับ course — `Weekday`, `CourseDetail`,
`CourseDetailBrief`, `TeacherCourseListResp`, `LearningOutcomeType`, `PLOResp`,
`CLOResp` กองที่เหลือ — 38 ไฟล์ 2,172 บรรทัดหลังใบนี้ — อยู่ใน
[#68](https://github.com/khthana/Deep-Portfolio/issues/68) ทำทีละ feature
เพราะ diff ที่ใหญ่กว่านี้ตรวจไม่ไหว และเพราะรอบแรกยังไม่รู้ว่าจะเจออะไร (คำตอบ
คือเจอสี่แบบตามบริบทข้างบน)

`ResponseWrapper` ฝั่ง web ยังอยู่ที่เดิม 277 จุดใน 50 ไฟล์ พร้อมคอมเมนต์ชี้ไป
ที่ [#67](https://github.com/khthana/Deep-Portfolio/issues/67) — มันไม่ตรงกับ
`ApiResponse` ที่ API ตอบจริง (`data` เป็น optional, คำปฏิเสธรายฟิลด์ชื่อ
`errors` ไม่ใช่ `error`) และการแก้ให้ตรงคือการแตะผู้อ่านทุกราย ซึ่งเป็นงานคนละ
ก้อนกับการย้าย type ของ feature

**4. package ไม่ต้อง build ทั้งสองฝั่งอ่าน `.ts` ตรง ๆ**

`packages/api-types/package.json` ชี้ทั้ง `types` และ `exports` ไปที่
`./src/index.ts` ไม่มี `dist` ไม่มี `tsc` ไม่มีลำดับ build ที่ต้องจำ ที่ทำได้
เพราะทุกอย่างในนั้นเป็น type ล้วน — `import type` ถูกลบทิ้งตอนคอมไพล์ ไฟล์ของ
package จึงไม่เคยไปโผล่ใน `dist/` ของ API และ `rootDir: ./src` ไม่ถูกละเมิด
(ตรวจแล้วด้วยการรัน `npm run build -w @deep-portfolio/api` — โครงของ `dist/`
เหมือนเดิมทุกไฟล์)

สองฝั่งหาไฟล์เจอด้วยกลไกคนละตัวและถูกทั้งคู่: `apps/api` เป็น CommonJS ใช้
module resolution แบบ node ซึ่งอ่านฟิลด์ `types`, ส่วน `apps/web` ตั้ง
`moduleResolution: "bundler"` ซึ่งอ่าน `exports` — จึงเขียนไว้ทั้งสองฟิลด์

package นี้ไม่มี script `lint` และ `typecheck` ของตัวเอง (`--if-present` ที่
root จึงข้ามมันไป) ไม่ใช่การลืม: Prettier ที่ root จัดรูปแบบมันอยู่แล้ว และทั้ง
สอง app คอมไพล์ไฟล์ของมันทุกครั้งที่ typecheck เพราะ import มันเข้าไป — type
ที่พังจะทำให้ `npm run typecheck` แดงทั้งสองฝั่ง

## ขอบเขต: เก็บเฉพาะ response

package นี้เก็บรูปของ **สิ่งที่ API ตอบ** เท่านั้น request body ยังเป็นของ zod
schema ที่ `apps/api/src/validation/` เหมือนเดิม เพราะ schema เหล่านั้นไม่ได้
เป็นแค่ type — มันคือสิ่งที่ปฏิเสธ request จริง ๆ ตอน runtime และ type ของมัน
คือผลพลอยได้จาก `z.infer` การเขียน type ของ request ซ้ำใน package จะได้สำเนา
ที่เพี้ยนจากตัวจริงได้อีกที่หนึ่ง ซึ่งเป็นปัญหาเดียวกับที่ใบนี้มาแก้

`GetAllCoursesParams` ที่เคยอยู่ใน `models/course.model.ts` จึงยังอยู่ที่นั่น —
มันคืออาร์กิวเมนต์ที่ service รับ ไม่ใช่สิ่งที่ผู้เรียกเห็น

## สิ่งที่นำร่องเจอ และวิธีรับมือ

**service ที่ส่งแถว Prisma ออกไปดิบ ๆ ผูก type ไม่ได้ถ้าไม่แปลงวันที่**

`getCLO`/`getPLOList` เดิมคืนแถวจาก Prisma ทั้งแถว ซึ่งถือ `Date` แต่ `CLOResp`
กับ `PLOResp` บอกว่าเป็น string — สองอย่างนี้ผูกเข้าหากันตรง ๆ ไม่ได้ ทางออกคือ
เขียน `created_at`/`updated_at` ออกมาเป็น `toISOString()` ที่ service **ซึ่งไม่
เปลี่ยนอะไรเลยสำหรับผู้เรียก** เพราะ `JSON.stringify` เรียก `toJSON()` ของ `Date`
อยู่แล้ว และ `toJSON()` ก็คือ `toISOString()` response จึงเหมือนเดิมทุกไบต์ แต่
คราวนี้มี type คุมอยู่ มีเทสต์ที่รอยต่อ HTTP ยืนยันไว้ด้วยว่า timestamp ที่ออกไป
เป็น string

**คีย์ที่หายไปทั้งคีย์ ไม่ใช่ null**

`getCLO` spread ผลของ PLO ที่หาไม่เจอ ซึ่งเป็น `undefined` ทั้งสามฟิลด์ แล้ว
`JSON.stringify` ตัดคีย์ที่มีค่าเป็น `undefined` ทิ้ง `CLOResp` จึงเขียน
`outcome_code?`, `outcome_title?`, `outcome_description?` เป็น optional ไม่ใช่
`| null` — และมีเทสต์ที่ยืนยันว่าคีย์หายไปจริง

**ฝั่ง web มีสามจุดที่คอมไพเลอร์ทักทันทีที่ type ตรงกับความจริง**

ทั้งสามจุดอ่าน `clo_number`/`clo_detail`/`plo_id` ราวกับว่าไม่มีวันว่าง

`clo_number` กับ `clo_detail` แก้ด้วย `??` ได้ตรง ๆ เพราะเลือกค่าที่ให้ผลเดิม
เป๊ะ — `parseInt(null)` กับ `parseInt("")` ได้ `NaN` เท่ากัน และข้อความว่างกับ
null เรนเดอร์เหมือนกัน (ที่หน้า mapping ยิ่งชัดกว่านั้น: `MappingSection`
ประกาศทั้งสองฟิลด์ไว้ใน props แต่ไม่ได้อ่านสักตัว)

`plo_id` **แก้ด้วย `??` ไม่ได้** และรอบแรกของใบนี้เผลอเขียน `?? 0` ไปก่อนจะจับได้
ตอน review: ช่องอ่านอย่างเดียวเรนเดอร์เหมือนกันจริง (`ploList.find` หาไม่เจอทั้ง
`null` และ `0`) แต่ตอนกดแก้ไข `form.setFieldsValue` เอาค่านั้นลง Select ที่ตั้ง
`required` ไว้ ซึ่ง antd ถือว่า `null` คือว่าง แต่ `0` คือคำตอบ — CLO เก่าที่ยัง
ไม่ผูก PLO จึงกลายเป็นบันทึกผ่านได้แล้วส่ง `plo_id: 0` ไปชน foreign key แทนที่
จะถูกบังคับให้เลือกก่อนเหมือนเดิม ทางที่ถูกคือให้ `DataType.plo` เป็น
`number | null` ตามความจริง แล้วประกาศ `ValidatedRow` สำหรับแถวที่ผ่าน
`validateFields()` มาแล้ว ซึ่งเป็นจุดเดียวที่รู้ว่ามันไม่ว่าง

ผลสุดท้ายจึงไม่มีอะไรลง `BEHAVIOR-CHANGES.md` — ไม่มีสิ่งที่ผู้ใช้เห็นเปลี่ยน
แต่เหตุผลไม่ใช่ "`??` ปลอดภัยเสมอ" กติกาคือค่าแทนต้องเหมือนของเดิม**ทุกทางที่มี
คนอ่านมัน** ไม่ใช่เฉพาะทางที่เรนเดอร์

## ผลที่ตามมา

- รูปของ response ของ course มีนิยามเดียวในระบบ และฝั่ง API ผูกไว้กับมันแล้ว
- ยังเหลืออีก 38 ไฟล์ที่ยังถือสำเนาอยู่ — #68 ไล่ทีละ feature, #67 เอา envelope
- การเพิ่ม type ใหม่ต้องเขียนตามที่ JSON ส่ง ไม่ใช่ตามที่ Prisma ถือ ถ้าเผลอ
  ก๊อป type จาก Prisma มาใส่ package จะได้ `Date` ที่ไม่มีจริงในสาย
- ใครแก้ `course.service.ts` แล้วรูปเปลี่ยน `npm run typecheck` แดงตั้งแต่ฝั่ง
  API — ซึ่งคือทั้งหมดที่ใบนี้ต้องการ
