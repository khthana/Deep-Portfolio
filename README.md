# DEEP Portfolio

แพลตฟอร์มการศึกษาแบบ outcome-based (CLO/PLO, rubric, gradebook, e-Portfolio ของผู้เรียน)

โปรเจกต์นี้รับมอบมาจากปริญญานิพนธ์ของนักศึกษา และกำลังอยู่ระหว่างการ re-deploy และ refactor
แผนงานหลักอยู่ที่ [`docs/spec-refactor-redeploy.md`](docs/spec-refactor-redeploy.md)
ติดตามความคืบหน้าได้ที่ [issue #1](https://github.com/khthana/Deep-Portfolio/issues/1)

ถ้ากำลังหาว่า API ตอบไม่เหมือนเดิมตรงไหนบ้างหลัง refactor ดูที่
[`BEHAVIOR-CHANGES.md`](BEHAVIOR-CHANGES.md)

เอกสารอื่นใน `docs/`

| ไฟล์ | คืออะไร |
| ---- | ------- |
| [`spec-refactor-redeploy.md`](docs/spec-refactor-redeploy.md) | แผนงานหลัก ข้อตกลงและเหตุผลของทุกการตัดสินใจ (D1–D13, T1–T7) |
| [`database-schema.md`](docs/database-schema.md) | data dictionary ของทั้ง 72 ตาราง — ดูความหมายของคอลัมน์ที่นี่ ไม่ต้องเปิดไฟล์ Word |
| [`requirements.md`](docs/requirements.md) | ความต้องการที่สกัดจากปริญญานิพนธ์ |
| [`test-cases.md`](docs/test-cases.md) | กรณีทดสอบด้วยมือ TC-01–TC-75 จากเอกสาร ใช้เป็น checklist ความครอบคลุม |

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

## เริ่มต้นใช้งาน — คำสั่งเดียวด้วย Docker

ต้องมี Docker Desktop (หรือ Docker Engine + Compose v2)

```bash
cp .env.example .env           # แล้วเติมค่าที่ว่างให้ครบ
docker compose up --build
```

จบแล้วจะได้ 4 service ทำงานอยู่ พร้อมฐานข้อมูลที่รัน migration ครบและ bucket ที่สร้างไว้ให้แล้ว

| บริการ | เข้าถึงที่ | หมายเหตุ |
| ------ | ---------- | -------- |
| เว็บ | http://localhost:3000 | React ที่ build แล้ว เสิร์ฟด้วย nginx |
| API | http://localhost:4001 | โค้ดที่ compile แล้วใน `dist/` ไม่ใช่ `tsx watch` |
| MinIO console | http://localhost:9001 | ล็อกอินด้วย `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` |
| PostgreSQL | `localhost:5432` | เปิด port ออกมาให้เครื่องมือฝั่ง host ต่อได้ |

`.env` ที่ root เก็บ**เฉพาะค่าลับ** (บวก `GOOGLE_CLIENT_ID` ซึ่งไม่ใช่ค่าลับแต่จำเป็น
— ดูหัวข้อถัดไป) ชื่อ host กับ port ที่ compose เป็นคนกำหนดเองอยู่ใน
`docker-compose.yml` ตรง ๆ ค่าที่จำเป็นเขียนเป็น `${VAR:?...}` ไว้ ถ้าลืมเติม compose
จะหยุดพร้อมบอกว่าขาดตัวไหน แทนที่จะสตาร์ตขึ้นมาโดยใช้รหัสผ่านว่าง

### การเข้าสู่ระบบด้วย Google

ระบบไม่มีบัญชีผู้ใช้กับรหัสผ่านของตัวเอง ทางเข้าเดียวคือปุ่ม Google บนหน้า `/login`
ก่อนจะล็อกอินได้ต้องมี **OAuth client id** หนึ่งตัว สร้างที่
[Google Cloud Console](https://console.cloud.google.com/apis/credentials) เลือกชนิด
**Web application** แล้วใส่ origin ของหน้าเว็บ (`http://localhost:3000` สำหรับเครื่อง dev)
ไว้ใน *Authorised JavaScript origins* จากนั้นเอาค่าที่ได้ไปใส่ `GOOGLE_CLIENT_ID` ใน `.env`

client id **ไม่ใช่ค่าลับ** — มันอยู่ใน bundle ของเว็บด้วย และ flow นี้ไม่มี client secret
อยู่เลย เพราะเบราว์เซอร์ขอ ID token จาก Google โดยตรง แล้ว API มีหน้าที่ verify อย่างเดียว

**อีเมลที่ไม่มีในตาราง `users` จะเข้าระบบไม่ได้** และระบบจะไม่สร้างผู้ใช้ใหม่ให้อัตโนมัติ
เพราะ `users.user_id` เป็นรหัส 8 หลักที่ออกจากนอกระบบ (รหัสนักศึกษา/บุคลากร) ผู้ใช้ต้อง
ถูกนำเข้ามาก่อน แล้วอีเมลใน `users.email` ต้องตรงกับอีเมลของบัญชี Google ที่ใช้ล็อกอิน

port ในตารางข้างบนเป็นค่า default เปลี่ยนได้ทุกตัวจาก `.env` (`WEB_PORT`, `API_PORT`,
`DB_PORT`, `MINIO_API_PORT`, `MINIO_CONSOLE_PORT`) ซึ่งจำเป็นบ่อยเพราะเครื่อง dev
มักมีของอื่นจับ 3000 หรือ 5432 อยู่แล้ว URL ที่ขึ้นกับ port ถูก derive จากตัวแปรเดียวกัน
เปลี่ยน `WEB_PORT` แล้ว origin ที่ API ยอมให้ผ่าน CORS ขยับตามเอง ไม่ต้องไล่แก้เป็นจุด ๆ

**migration รันเองอัตโนมัติ** — service ชื่อ `migrate` รัน `prisma migrate deploy` แล้วจบ
service `api` รอให้มันจบสำเร็จก่อนถึงจะเริ่ม ไม่ต้องสั่งอะไรเพิ่ม

คำสั่งที่ใช้บ่อย

```bash
docker compose logs -f api     # ดู log ของ API
docker compose down            # หยุดทั้งหมด (ข้อมูลยังอยู่)
docker compose down -v         # หยุดแล้วลบ volume ทิ้งด้วย — ฐานข้อมูลกับไฟล์หายหมด
docker compose up --build web  # build เว็บใหม่ (จำเป็นเมื่อแก้ VITE_BACKEND_URL)
```

> **stack นี้เป็นของ local เท่านั้น ยังเอาไป deploy จริงไม่ได้** — `NODE_ENV` ถูกตั้งเป็น
> `development` โดยตั้งใจ เพราะ production จะตั้ง `secure: true` บน cookie ทำให้เก็บ
> session บน `http://localhost` ไม่ได้ (ส่วนโดเมนของ cookie ไม่ hardcode แล้ว มาจาก
> `COOKIE_DOMAIN` ตั้งแต่ [issue #10](https://github.com/khthana/Deep-Portfolio/issues/10)
> ค่าเริ่มต้นคือเว้นว่าง แปลว่า cookie เป็นแบบ host-only)
>
> ตั้งแต่ [issue #11](https://github.com/khthana/Deep-Portfolio/issues/11) เป็นต้นมา
> **ล็อกอินบนเครื่องได้จริงแล้ว** ไม่ต้องพึ่ง SSO cookie จาก DEEP Core อีก ขอแค่มี
> `GOOGLE_CLIENT_ID` และมีแถวใน `users` ที่อีเมลตรงกับบัญชี Google ที่ใช้ (ดูหัวข้อข้างบน)

## รันบนเครื่องโดยตรง (ไม่ผ่าน Docker)

ต้องมี Node.js 22 ขึ้นไป

```bash
npm install                    # ติดตั้ง dependency ของทุก workspace ในคำสั่งเดียว
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
npm run dev
```

แล้วเติมค่าใน `.env` ทั้งสองไฟล์ให้ครบ ในไฟล์ `.env.example` มีคำอธิบายกำกับทุกตัวแปรว่า
ถูกอ่านที่ไหนและใส่ค่าอะไรได้บ้าง ตัวไหนจำเป็นตัวไหนไม่จำเป็น — ข้อที่พลาดกันบ่อยคือ
`GOOGLE_CLIENT_ID` (ฝั่ง API) กับ `VITE_GOOGLE_CLIENT_ID` (ฝั่งเว็บ) **ต้องเป็นค่าเดียวกัน**
ไม่อย่างนั้น token ที่เบราว์เซอร์ได้มาจะถูก API ปฏิเสธว่าออกให้คนอื่น

**`.env` ที่ root กับ `apps/api/.env` เป็นคนละไฟล์ที่ทำคนละหน้าที่ ไม่ใช่ของซ้ำกัน** —
ไฟล์ที่ root มีไว้ให้ docker compose อ่าน ส่วน `apps/api/.env` มีไว้ตอนรัน API บนเครื่องตรง ๆ
ค่าเดียวกันต้องใส่ต่างกันด้วย เช่นฐานข้อมูลอยู่ที่ `db:5432` เมื่อมองจากใน compose network
แต่อยู่ที่ `localhost:5432` เมื่อมองจาก host

ยัง `docker compose up db minio minio-init` เพื่อยืม PostgreSQL กับ MinIO จาก stack มาใช้
แล้วรันเฉพาะ API กับเว็บบนเครื่องได้ — ค่าใน `apps/api/.env.example` ตั้งมาให้ตรงกับกรณีนี้อยู่แล้ว

ฝั่ง API มี `src/config/env.ts` เป็น **โมดูลเดียวที่อ่าน `process.env`** และตรวจค่าทั้งหมด
ตอน startup ถ้าค่าจำเป็นขาด server จะล้มทันทีพร้อมบอกว่าขาดตัวไหนบ้าง แทนที่จะไปพังทีหลัง
ตอนมี request มาโดน — และ **ค่าลับไม่มี fallback เด็ดขาด** เพราะ fallback จะทำให้ระบบที่ตั้งค่า
ไม่ครบกลายเป็นระบบที่ token ปลอมได้โดยไม่มีสัญญาณเตือน

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
| `npm test`          | รัน test ทุก workspace (ยก container ของ test ให้เอง — ดูหัวข้อถัดไป) |
| `npm run test:down` | ปิดคอนเทนเนอร์ของ test แล้วลบ volume ทิ้ง       |

`build` / `typecheck` / `lint` / `test` ใช้ `--workspaces --if-present` ทั้งหมด
workspace ที่ยังไม่มี script นั้นจะถูกข้ามไปเงียบ ๆ ไม่ทำให้คำสั่งล้ม

สั่งงานเฉพาะ workspace เดียวได้ด้วย `-w`

```bash
npm run typecheck -w @deep-portfolio/api
npm run prisma:generate -w @deep-portfolio/api
```

## Test

```bash
npm test
```

ต้องมี Docker เปิดอยู่ นอกนั้นไม่ต้องเตรียมอะไรเลย — ไม่ต้องมี `.env` ไม่ต้องสร้าง
ฐานข้อมูลไว้ก่อน คำสั่งเดียวนี้ยก PostgreSQL กับ MinIO ของ test ขึ้นมา รัน migration
แล้วรัน test ทั้งสอง workspace

ปัจจุบันมี **690 เคสฝั่ง API** (38 ไฟล์ ยิงผ่าน HTTP เข้าหา Express app ตัวจริง) และ
**390 เคสฝั่งเว็บ** (22 ไฟล์ เฉพาะฟังก์ชันบริสุทธิ์) ทั้งหมดเขียนตามพฤติกรรมที่ระบบ
ทำอยู่จริง ไม่ใช่ตามที่เอกสารบอกว่าควรทำ จุดที่ต่างกันถูกบันทึกไว้ใน
[`BEHAVIOR-CHANGES.md`](BEHAVIOR-CHANGES.md)

**คอนเทนเนอร์ของ test แยกจาก stack ที่ใช้พัฒนาโดยสิ้นเชิง** — คนละ compose file
(`docker-compose.test.yml`) คนละชื่อ project และคนละ port (Postgres 55432, MinIO 59000)
เพราะชุด test สร้างและลบฐานข้อมูลตลอดเวลา จะไปแตะฐานข้อมูลที่กำลังพัฒนาอยู่ไม่ได้เด็ดขาด

**แต่ละ test file ได้ฐานข้อมูลของตัวเอง** สร้างจากฐานข้อมูลต้นแบบด้วย
`CREATE DATABASE ... TEMPLATE ...` (PostgreSQL คัดลอกไฟล์ให้ เร็วกว่ารัน migration ใหม่มาก)
และได้ bucket ของตัวเองใน MinIO ทั้งคู่ถูกลบทิ้งเมื่อไฟล์นั้นจบ ผลคือ **test รันขนานข้ามไฟล์ได้จริง**

จบแล้วคอนเทนเนอร์จะยังเปิดค้างไว้ เพื่อให้รอบถัดไปเริ่มเร็ว ปิดเมื่อไม่ใช้แล้วด้วย

```bash
npm run test:down
```

**ข้อมูลอ้างอิงมีอยู่แล้วตั้งแต่ต้น** — คณะ ภาควิชา หลักสูตร และบทบาททั้งเจ็ด ถูก seed ลง
ฐานข้อมูลต้นแบบครั้งเดียวต่อการรัน (`apps/api/test/seed.ts`) แล้วมาถึงทุกไฟล์พร้อมกับการคัดลอก
ทุกค่าเป็นข้อมูลสังเคราะห์ ไม่ผูกกับข้อมูลจริงของสถาบัน และไม่มีข้อมูลส่วนบุคคลใน repository

เขียน test เพิ่ม

- test ของ API อยู่ที่ `apps/api/test/` ยิง request เข้า Express app ที่ import มาด้วย supertest
- session ใน test สร้างด้วย helper ที่ `apps/api/test/helpers/session.ts` ซึ่งเซ็น token
  ด้วย secret ของ test แล้ว **วิ่งผ่าน middleware ตรวจสิทธิ์ตัวจริง ไม่ bypass** — token
  อย่างเดียวไม่พอ ถ้าเคสต้องการบทบาทไหนต้อง insert แถวใน `user_roles` ด้วย
  (หรือใช้ `createTeacher()` / `createStudent()` ซึ่งใส่ให้แล้ว)
- ข้อมูลของเคสสร้างด้วย factory ใน `apps/api/test/factories/` — `createUser`, `createTeacher`,
  `createStudent`, `createCourse`, `enrolStudent`, `createActivity`, `createSubmission`
  แต่ละตัวสร้าง parent ที่ยังไม่มีให้เอง เช่น `createSubmission()` เปล่าๆ จะได้ทั้งนักศึกษา
  กิจกรรม และหมู่เรียนครบ
- **ส่งเฉพาะค่าที่เคสนั้นสนใจให้ factory** ที่เหลือปล่อยให้เป็น default — คนอ่าน test
  จะได้รู้ทันทีว่าอะไรคือประเด็นของเคส ดูตัวอย่างได้ที่ `apps/api/test/course.test.ts`
- test ของเว็บวางไว้ข้างไฟล์ที่ทดสอบ (`*.test.ts`) และครอบคลุม**เฉพาะฟังก์ชันบริสุทธิ์**
  ตามที่ตกลงไว้ใน T2 คือ `utils/` ทั้ง 8 ไฟล์ กับ reducer ของ redux slice ทั้ง 14 ตัว
  — import มาเรียกตรง ๆ ไม่มี DOM ไม่ mock ไม่ render component (component test กับ
  E2E อยู่นอกขอบเขตของเฟสนี้ ถ้าจะเพิ่มต้องสลับ `environment` ใน `apps/web/vite.config.ts`
  เป็น `jsdom` ก่อน)
- slice ทั้ง 14 ตัวถูกเขียนด้วยรูปแบบเดียวกัน (หนึ่ง boolean ต่อหนึ่งคำขอ บวก `error`
  หนึ่งช่อง) เคสที่ซ้ำกันจึงอยู่รวมกันเป็นตารางที่ `apps/web/src/test/slice-cases.ts`
  แล้วไฟล์ของแต่ละ slice เขียนมือเฉพาะสิ่งที่เป็นของตัวเอง
- **ห้ามเขียนเคสที่อิงเขตเวลาของเครื่อง** — สร้าง `Date` จากส่วนประกอบเวลาท้องถิ่น
  (`new Date(2024, 0, 5, 9, 5)`) หรือถาม `now` จากนาฬิกาจริง ชุด test ปัจจุบันผ่าน
  เหมือนกันหมดทั้งใต้ `Asia/Bangkok`, `America/New_York` และ `Pacific/Kiritimati`
  ส่วน `TZ=UTC` ที่ pin ไว้ใน config มีไว้ให้ผลลัพธ์อ่านตรงกันทุกเครื่อง ไม่ใช่ให้ test พึ่ง

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
