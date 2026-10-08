# 🚀 DevPlus App (Thao Project)

> **ระบบเว็บแอปพลิเคชันจัดการการฝึกงานและบุคลากร DevPlus (Attendance, Leave Requests, Training & Management System)**

โปรเจกต์ Full-Stack Application พัฒนาด้วย **React Native Web (Expo)** สำหรับ Frontend Web Application และ **Go (Fiber)** สำหรับ Backend API โดยเชื่อมต่อฐานข้อมูลและ Authentication ผ่าน **Supabase**

---

## 📋 สารบัญ (Table of Contents)
- [✨ ฟีเจอร์หลัก (Key Features)](#-ฟีเจอร์หลัก-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🐳 วิธีรันด้วย Docker (วิธีที่ง่ายที่สุดสำหรับเพื่อนๆ)](#-วิธีรันด้วย-docker-วิธีที่ง่ายที่สุดสำหรับเพื่อนๆ)
- [💻 วิธีรันแบบ Local Development (ไม่ใช้ Docker)](#-วิธีรันแบบ-local-development-ไม่ใช้-docker)
- [📂 โครงสร้างโปรเจกต์ (Project Structure)](#-โครงสร้างโปรเจกต์-project-structure)
- [⚙️ Environment Variables](#️-environment-variables)

---

## ✨ ฟีเจอร์หลัก (Key Features)
1. **ระบบล็อกอิน & สิทธิ์ผู้ใช้ (Role-based Authentication)**:
   - รองรับสิทธิ์ **BD Team (Admin)**, **Mentor**, และ **Student (Intern)**
2. **ระบบลงเวลาเข้า-ออกงาน (Attendance & Geolocation)**:
   - เช็คอิน/เช็คเอาท์พร้อมคำนวณพิกัดระยะทาง (Office Radius GPS)
   - หน้าประวัติการลงเวลาย้อนหลัง (Attendance History)
3. **ระบบจัดการการลา (Leave Management)**:
   - ส่งคำขอลา (Leave Request)
   - ดูสถานะการลา (Leave Status)
   - อนุมัติ/ปฏิเสธคำขอลาสำหรับ Mentor & BD Team (Leave Approvals)
4. **หลักสูตรการอบรม (Training Programs)**:
   - ดูแผนการฝึกอบรมและเนื้อหาโมดูล (PDF & Video viewer)
   - สร้างหลักสูตรอบรมใหม่ (Create Training)
5. **ปฏิทินและตารางนัดหมาย (Schedule Management)**:
   - ดูตารางนัดหมายและสร้างกิจกรรมใหม่
6. **บอร์ดถาม-ตอบ และประกาศ (Q&A & Announcements)**:
   - กระดานส่งคำถาม ถาม-ตอบสำหรับนักศึกษาและพี่เลี้ยง
   - ประกาศข่าวสารสำคัญภายในทีม

---

## 🛠️ Tech Stack
- **Frontend**: React Native Web / Expo, TypeScript, Lucide Icons, React Navigation
- **Backend**: Golang (Fiber v2 Framework)
- **Database / Auth**: Supabase (PostgreSQL & Supabase Auth)
- **DevOps**: Docker, Docker Compose

---

## 🐳 วิธีรันด้วย Docker (วิธีที่ง่ายที่สุดสำหรับเพื่อนๆ)

เพียงมี **Docker Desktop** ติดตั้งอยู่ในเครื่อง สามารถรันโปรเจกต์ได้ครบทั้ง Frontend และ Backend ในคำสั่งเดียว:

### 1. Clone โปรเจกต์
```bash
git clone https://github.com/New-Sirawat/thao-project.git
cd thao-project
```

### 2. รันด้วย Docker Compose
```bash
docker compose up --build
```

### 3. เข้าใช้งานผ่าน Web Browser
- 🌐 **Frontend Web App**: [http://localhost:8081](http://localhost:8081)
- 🔌 **Backend REST API**: [http://localhost:3000](http://localhost:3000)

*(หากต้องการหยุดการทำงาน กด `Ctrl + C` หรือสั่ง `docker compose down`)*

---

## 💻 วิธีรันแบบ Local Development (ไม่ใช้ Docker)

หากต้องการรันแก้ไขโค้ดและทดสอบในเครื่องโดยตรง:

### สิ่งที่ต้องมีล่วงหน้า (Prerequisites)
- [Node.js](https://nodejs.org/) (เวอร์ชัน 18 ขึ้นไป)
- [Go](https://go.dev/) (เวอร์ชัน 1.22 ขึ้นไป)

### ขั้นตอนที่ 1: รัน Backend API
```bash
cd backend
go run main.go
```
> Backend จะเริ่มทำงานที่ `http://localhost:3000`

### ขั้นตอนที่ 2: รัน Frontend Web App (เปิดอีกหน้าต่าง Terminal)
```bash
cd frontend
npm install
npm run web
```
> Web Browser จะเปิดอัตโนมัติที่ `http://localhost:8081` (หรือกด `w` ใน terminal เพื่อเปิดเบราว์เซอร์)

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```text
thao-project/
├── backend/
│   ├── main.go             # เซิร์ฟเวอร์ Go Fiber REST API
│   ├── Dockerfile          # Docker build สำหรับ Backend
│   ├── .env.example        # ตัวอย่าง Environment variables
│   └── uploads/            # โฟลเดอร์จัดเก็บไฟล์อัปโหลด
├── frontend/
│   ├── App.tsx             # จุดเริ่มต้นแอพพลิเคชันและการจัดการ Auth/Routes
│   ├── src/
│   │   ├── screens/        # หน้าจอทั้งหมด (Home, Login, Attendance, Leave, etc.)
│   │   ├── lib/            # โมดูลเชื่อมต่อ Supabase และ API client
│   │   └── theme.ts        # ธีม สี และ Style พื้นฐาน
│   ├── Dockerfile          # Docker build สำหรับ Expo Web
│   └── package.json
├── docker-compose.yml       # รัน Full-Stack พร้อมกันด้วยคำสั่งเดียว
├── use_cases.md            # เอกสาร Use Case Specification
└── README.md               # คู่มือการใช้งาน
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
สามารถคัดลอกจาก `backend/.env.example` ได้ทันที (มีค่า Default เชื่อมต่อ Supabase สำเร็จรูป):
```env
PORT=3000
SUPABASE_URL=https://vescjjkwgkmjhbsgbvvt.supabase.co
SUPABASE_KEY=sb_publishable_b8XTCsANXZ6VAzy4pICO6Q__XsIpI5Y
```

### Frontend (`frontend/.env` หรือ Environment)
- `EXPO_PUBLIC_API_URL` (Optional): URL ของ Backend API (ค่าเริ่มต้นคือ `http://localhost:3000`)
