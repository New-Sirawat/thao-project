# 🚀 DevPlus App (Thao Project)

> **Full-Stack Internship & Personnel Management Application (Attendance Tracking, Leave Requests, Training Programs, and Team Administration)**

A full-stack web application built with **React Native Web (Expo)** for the frontend web interface, and **Go (Fiber v2)** for the backend REST API, integrated with **Supabase** for database management and authentication.

---

## 📋 Table of Contents

- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🐳 Quick Start with Docker (Recommended)](#-quick-start-with-docker-recommended)
- [💻 Local Development Setup (Without Docker)](#-local-development-setup-without-docker)
- [📂 Project Structure](#-project-structure)
- [⚙️ Environment Variables](#️-environment-variables)

---

## ✨ Key Features

1. **Role-based Authentication & Access Control**:
   - Supports **BD Team (Admin)**, **Mentor**, and **Student (Intern)** roles with tailored dashboards.
2. **Attendance Tracking & Geolocation Check-in**:
   - GPS-radius-based Check-In and Check-Out.
   - Comprehensive Attendance History log with real-time status.
3. **Leave Management System**:
   - Submit leave requests with reason and date range.
   - Live tracking of leave approval status.
   - Approval/Rejection interface for Mentors and BD Team admins.
4. **Training Program & Course Modules**:
   - View structured course modules, documentation (PDF viewer), and video sessions.
   - Create and publish new training programs and modules.
5. **Interactive Schedule & Calendar**:
   - Meeting and workshop scheduling with location details.
6. **Community Board (Q&A & Announcements)**:
   - Team announcements feed.
   - Interactive Q&A thread system between interns and mentors.

---

## 🛠️ Tech Stack

- **Frontend**: React Native Web / Expo (SDK 52+), TypeScript, Lucide Icons, React Navigation
- **Backend**: Golang (Fiber v2 Web Framework)
- **Database & Auth**: Supabase (PostgreSQL & Supabase Auth)
- **DevOps / Containerization**: Docker, Docker Compose

---

## 🐳 Quick Start with Docker (Recommended)

With **Docker Desktop** installed, you can spin up both the Frontend Web App and Backend API with a single command:

### 1. Clone the Repository

```bash
git clone https://github.com/New-Sirawat/thao-project.git
cd thao-project
```

### 2. Run with Docker Compose

```bash
docker compose up --build
```

### 3. Open in Browser

- 🌐 **Frontend Web Application**: [http://localhost:8081](http://localhost:8081)
- 🔌 **Backend REST API**: [http://localhost:3000](http://localhost:3000)

*(To stop the containers, press `Ctrl + C` or execute `docker compose down`)*

---

## 💻 Local Development Setup (Without Docker)

If you prefer running and debugging the application natively on your machine:

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Go](https://go.dev/) (v1.22 or higher)

### Step 1: Start Backend API

```bash
cd backend
go run main.go
```

> The backend server starts listening on `http://localhost:3000`

### Step 2: Start Frontend Web Application (In a separate terminal window)

```bash
cd frontend
npm install
npm run web
```

> The Expo web server will launch and automatically open in your browser at `http://localhost:8081` (or press `w` in the terminal to open).

---

## 📂 Project Structure

```text
thao-project/
├── backend/
│   ├── main.go             # Go Fiber REST API server
│   ├── Dockerfile          # Multi-stage Docker build for backend
│   ├── .env.example        # Environment variables template
│   └── uploads/            # Uploaded assets and media
├── frontend/
│   ├── App.tsx             # Application entrypoint, auth provider & routing
│   ├── src/
│   │   ├── screens/        # UI Screens (Home, Login, Attendance, Leave, etc.)
│   │   ├── lib/            # Supabase client and dynamic API config
│   │   └── theme.ts        # App design system & color scheme
│   ├── Dockerfile          # Docker build for Expo Web
│   └── package.json
├── docker-compose.yml       # Orchestrates full-stack containers
├── use_cases.md            # Detailed system use case specifications
└── README.md               # Project documentation and setup guide
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

A ready-to-use template is provided in `backend/.env.example`. Pre-configured fallback credentials to Supabase are included out of the box:

```env
PORT=3000
SUPABASE_URL=https://vescjjkwgkmjhbsgbvvt.supabase.co
SUPABASE_KEY=sb_publishable_b8XTCsANXZ6VAzy4pICO6Q__XsIpI5Y
```

### Frontend (`frontend/.env`)

- `EXPO_PUBLIC_API_URL` (Optional): Backend API base URL (defaults dynamically to `http://localhost:3000`).
