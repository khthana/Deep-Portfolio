# packages/

เว้นไว้สำหรับ shared package ในอนาคต ตอนนี้ยังว่าง และ**ตั้งใจให้ว่าง**

`apps/web` มี type ที่เขียนมิเรอร์ response ของ `apps/api` อยู่ราว 2,188 บรรทัดใน 38 ไฟล์
ซึ่งเป็นความซ้ำซ้อนจริงและควรยุบมาเป็น shared package ในที่นี้ แต่การย้ายอยู่นอกขอบเขต
ที่ตกลงกันในเฟสนี้ ดู [D1](../docs/spec-refactor-redeploy.md) และหัวข้อ Out of Scope

`package.json` ที่ root ประกาศ `packages/*` เป็น workspace ไว้แล้ว การเพิ่ม package ใหม่
จึงทำได้โดยสร้างโฟลเดอร์พร้อม `package.json` ที่นี่แล้วรัน `npm install` ที่ root
