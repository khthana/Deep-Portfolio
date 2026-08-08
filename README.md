# DEEP Portfolio

แพลตฟอร์มการศึกษาแบบ outcome-based (CLO/PLO, rubric, gradebook, e-Portfolio ของผู้เรียน)

โปรเจกต์นี้รับมอบมาจากปริญญานิพนธ์ของนักศึกษา และกำลังอยู่ระหว่างการ re-deploy และ refactor
แผนงานหลักอยู่ที่ [`docs/spec-refactor-redeploy.md`](docs/spec-refactor-redeploy.md)
ติดตามความคืบหน้าได้ที่ [issue #1](https://github.com/khthana/Deep-Portfolio/issues/1)

## โครงสร้าง

repo นี้เป็น monorepo ที่ใช้ [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces)

| โฟลเดอร์     | ชื่อ workspace          | คืออะไร                                    |
| ------------ | ----------------------- | ------------------------------------------ |
| `apps/api`   | `@deep-portfolio/api`   | REST API — Express 5 + Prisma + PostgreSQL |
| `apps/web`   | `@deep-portfolio/web`   | หน้าเว็บ — React 19 + Vite + Ant Design    |
| `packages/`  | —                       | เว้นไว้สำหรับ shared package ([อ่านเพิ่ม](packages/README.md)) |
| `docs/`      | —                       | เอกสารประกอบ (spec, schema, test case, requirement) |

dependency ทั้งหมดถูกล็อกด้วย `package-lock.json` ไฟล์เดียวที่ root และติดตั้งลง
`node_modules/` ที่ root เป็นหลัก — **ห้ามรัน `npm install` ในโฟลเดอร์ย่อย** เพราะจะสร้าง
lockfile ซ้อนขึ้นมาแล้วทำให้เวอร์ชันของ dependency แตกจากที่ล็อกไว้

## เริ่มต้นใช้งาน

ต้องมี Node.js 22 ขึ้นไป

```bash
npm install                    # ติดตั้ง dependency ของทุก workspace ในคำสั่งเดียว
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

แล้วเติมค่าใน `.env` ทั้งสองไฟล์ให้ครบ ในไฟล์ `.env.example` มีคำอธิบายกำกับทุกตัวแปรว่า
ถูกอ่านที่ไหนและใส่ค่าอะไรได้บ้าง ตัวไหนจำเป็นตัวไหนไม่จำเป็น

ฝั่ง API มี `src/config/env.ts` เป็น **โมดูลเดียวที่อ่าน `process.env`** และตรวจค่าทั้งหมด
ตอน startup ถ้าค่าจำเป็นขาด server จะล้มทันทีพร้อมบอกว่าขาดตัวไหนบ้าง แทนที่จะไปพังทีหลัง
ตอนมี request มาโดน — และ **ค่าลับไม่มี fallback เด็ดขาด** เพราะ fallback จะทำให้ระบบที่ตั้งค่า
ไม่ครบกลายเป็นระบบที่ token ปลอมได้โดยไม่มีสัญญาณเตือน

> ตอนนี้ยังต้องเตรียม PostgreSQL และ MinIO ขึ้นมาเอง การรวม service เหล่านี้เข้าเป็น
> local stack ชุดเดียวเป็นงานของ ticket ถัดไป — `Dockerfile` และ `docker-compose.yml`
> ที่ยังค้างอยู่ใน `apps/api/` และ `apps/web/` เป็นของเดิมจากตอนรับมอบ ยังไม่ได้ปรับ
> ให้เข้ากับโครง monorepo

## คำสั่งที่ root

| คำสั่ง              | ทำอะไร                                          |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | รัน API กับเว็บพร้อมกัน (API :4001, เว็บ :3000) |
| `npm run dev:api`   | รันเฉพาะ API                                    |
| `npm run dev:web`   | รันเฉพาะเว็บ                                    |
| `npm start`         | รัน API ที่ build แล้วจาก `dist/` (ต้อง `npm run build` ก่อน) |
| `npm run db:migrate` | สร้าง/อัปเดตตารางในฐานข้อมูลให้ตรงกับ migration |
| `npm run db:status` | ดูว่าฐานข้อมูลตามหลัง migration อยู่กี่ไฟล์      |
| `npm run db:reset`  | ล้างฐานข้อมูลแล้วสร้างใหม่ตั้งแต่ต้น            |
| `npm run build`     | build ทุก workspace                             |
| `npm run typecheck` | ตรวจ type ทุก workspace                         |
| `npm run lint`      | รัน lint ทุก workspace                          |
| `npm test`          | รัน test ทุก workspace (ยังไม่มี test — [issue #1](https://github.com/khthana/Deep-Portfolio/issues/1)) |

`build` / `typecheck` / `lint` / `test` ใช้ `--workspaces --if-present` ทั้งหมด
workspace ที่ยังไม่มี script นั้นจะถูกข้ามไปเงียบ ๆ ไม่ทำให้คำสั่งล้ม

สั่งงานเฉพาะ workspace เดียวได้ด้วย `-w`

```bash
npm run typecheck -w @deep-portfolio/api
npm run prisma:generate -w @deep-portfolio/api
```

## ฐานข้อมูล

`apps/api/prisma/schema.prisma` เป็น source of truth ของ schema ทั้งหมด (72 ตาราง)
และ `apps/api/prisma/migrations/` มี migration ตัวแรกที่สร้างทุกอย่างจากศูนย์

**ตั้งฐานข้อมูลขึ้นใหม่**

```bash
# 1. เตรียม PostgreSQL 16 สักตัว แล้วชี้ DATABASE_URL ใน apps/api/.env ไปที่ฐานข้อมูลเปล่า
# 2. สร้างตารางทั้งหมด
npm run db:migrate
```

จบแล้วจะได้ 72 ตาราง กับ enum 17 ตัว (บวกตาราง `_prisma_migrations` ที่ Prisma
ใช้จดว่ารัน migration ไหนไปแล้ว) รันซ้ำได้ไม่พัง — Prisma ข้าม migration ที่ลงไปแล้ว

**ล้างแล้วเริ่มใหม่**

```bash
npm run db:reset
```

คำสั่งนี้ **ลบข้อมูลทั้งหมดทิ้ง** แล้วรัน migration ใหม่ตั้งแต่ต้น ใช้กับฐานข้อมูล
local เท่านั้น Prisma จะถามยืนยันก่อน (ใน CI ที่ไม่มีคนตอบ ให้เรียก
`npm run db:reset -- --force` จากในโฟลเดอร์ `apps/api`)

**ตรวจว่า schema กับฐานข้อมูลยังตรงกัน**

```bash
cd apps/api
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
                        --to-schema-datamodel  prisma/schema.prisma --exit-code
```

ต้องได้ `No difference detected.` ถ้าไม่ตรงแปลว่ามีคนแก้ `schema.prisma` โดยไม่ได้
สร้าง migration คู่กัน

**ข้อควรรู้ 3 ข้อเกี่ยวกับ migration ตัวแรก** — รายละเอียดเต็มอยู่ใน
[D2 ของ spec](docs/spec-refactor-redeploy.md) และในคอมเมนต์ของไฟล์ migration เอง

1. `student.full_name_th` กับ `student.admission_year` เป็น generated column
   (`GENERATED ALWAYS AS ... STORED`) ไม่ใช่คอลัมน์ธรรมดา — เขียนค่าลงไปตรง ๆ ไม่ได้
2. enum `learning_activity_enum` กับ `cognitive_level_enum` ถูกสร้างเป็น **enum ว่าง**
   เพราะไม่มีที่ไหนบันทึกค่าจริงไว้ ตาราง `subject_clo_measurable_behavior`
   จึงยัง insert ไม่ได้จนกว่าจะเติมค่าเข้าไป
3. check constraint ของเดิม 4 ตารางหายไป เพราะ Prisma ไม่รองรับ — ต้องเพิ่มกลับเองถ้าจำเป็น
