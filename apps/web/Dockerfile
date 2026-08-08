# Stage 1: Build React/Vite Code
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Vite จะ build ไฟล์ไปไว้ที่โฟลเดอร์ dist
RUN npm run build 

# Stage 2: Serve ด้วย Nginx (ตัวเล็กสำหรับรันเว็บ Frontend โดยเฉพาะ)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# จัดการ React Router (ป้องกันปัญหาเวลากด Refresh หน้าเว็บแล้วขึ้น 404)
RUN echo 'server { \
    listen 80; \
    location / { \
    root   /usr/share/nginx/html; \
    index  index.html index.htm; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]