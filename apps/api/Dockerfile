FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install

# Copy ไฟล์ทั้งหมด (รวมถึงโฟลเดอร์ prisma)
COPY . .

# ✨ เพิ่มบรรทัดนี้: สั่ง generate prisma client ภายใน container
RUN npx prisma generate

EXPOSE 4001

# คำสั่งรัน (ถ้าเป็น Production แนะนำใช้ npm start แต่ถ้าจะรัน dev แบบนี้ก็ได้ครับ)
CMD ["npm", "run", "dev"]