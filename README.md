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
ถูกอ่านที่ไหนและใส่ค่าอะไรได้บ้าง

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

> `npm run typecheck` ตอนนี้ยังเหลือ error 1 จุดที่ `apps/api` (`full_name_th` ใน
> `user.service.ts`) เป็นบั๊กที่ติดมาตั้งแต่ตอนรับมอบ ไม่ใช่ผลจากการย้ายโครงสร้าง
> และจะถูกแก้ในขั้นตอนหลังจากที่มี test คุมพฤติกรรมแล้ว ตามลำดับใน spec
