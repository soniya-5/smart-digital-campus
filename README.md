# Smart Digital Campus Infrastructure Issue Reporting & Resolution System

A full-stack college web application designed for academic evaluation, faculty demonstrations, and production-grade campus facility operations. Built with React, TypeScript, Tailwind CSS, Node.js, Express, and Prisma ORM.

---

## 🏛️ Project Overview

The **Smart Digital Campus** platform connects students, maintenance departments, and campus administrators into a unified, transparent operational workflow:
- **Students**: Report facilities/infrastructure defects with automated routing, duplicate-similarity checking, real-time audit timelines, community verification, and access everyday campus modules (Marketplace, Study Groups, Lost & Found, Timetable, Exams, Attendance, and SOS alerts).
- **Staff / Maintenance Personnel**: Manage task queues, view assignments by department, log progress notes, update repair statuses, and close work orders.
- **Administrators**: Complete operational oversight with KPI analytics dashboards, department resolution metrics, automated category routing, user role management, safety audit logs, and an emergency SOS dispatch desk.

---

## 🎨 Visual Design System

- **Color Palette**: Royal Blue (`#2563eb`, `#1d4ed8`, `#1e3a8a`) primary with clean white backgrounds and secondary soft blue/slate tints (`#f8fafc`, `#eff6ff`).
- **Typography**: Clean, readable sans-serif hierarchy with Inter.
- **UI Components**: Consistent status badges, accessible modals with focus trapping, desktop sidebar navigation with mobile drawer, and empty/loading states.

---

## ⚙️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, React Router v7 |
| **Backend** | Node.js, Express.js, TypeScript, Helmet, CORS, Cookie-Parser, Multer, Rate-Limit |
| **Database & ORM** | Prisma ORM, SQLite (`dev.db`) for zero-config local development, configurable to PostgreSQL |
| **Authentication & Security** | Bcrypt password hashing, JWT signed session in `HttpOnly` `SameSite=Lax` cookies, Role-Based Access Control (RBAC), Object-Level Authorization |
| **Automated Testing** | Vitest, Supertest integration suite |

### 💡 Database Configuration (SQLite vs. PostgreSQL)
- **Local Development & Demo**: Configured with SQLite (`file:./dev.db`) out-of-the-box so the project runs immediately with zero external service dependencies.
- **PostgreSQL Production Mode**: To switch to PostgreSQL, change `provider = "postgresql"` in `backend/prisma/schema.prisma` and supply your PostgreSQL connection string in `DATABASE_URL` (e.g. `postgresql://user:pass@localhost:5432/campus_db`). Run `npx prisma db push` to synchronize.

---

## 👥 User Roles & Demo Accounts

The project includes pre-seeded demo records for academic evaluation:

| Role | Email | Password | Primary Permissions |
|---|---|---|---|
| **Student** | `student.alice@campus.edu` | `DemoPass@123` | File issues, track timeline, rate resolutions, study groups, timetable, marketplace |
| **Student (Alt)** | `student.bob@campus.edu` | `DemoPass@123` | File issues, verify community defects, join study circles |
| **Staff (Electric)** | `staff.electric@campus.edu` | `DemoPass@123` | Electrical department queue, add progress notes, update status |
| **Administrator** | `admin@campus.edu` | `AdminPass@2026` | Full analytics dashboard, assign staff/dept, user roles, audit trail, SOS center |

> **Note on Public Registration**: Public sign-ups are strictly enforced as `STUDENT` on the server. Staff accounts are provisioned by Administrators, and Administrators are provisioned via the secure CLI command below.

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- **Node.js** (v18 or higher recommended; developed on Node v24)
- **npm** (v9 or higher)

### 2. Clone / Open Workspace
```bash
cd smart-digital-campus
```

### 3. Backend Setup
```bash
cd backend
npm install
# Generate Prisma Client and initialize SQLite database
npx prisma generate
npx prisma db push
# Seed demo campus data
npm run seed
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

### 5. Running the Application in Development
Open two terminal windows:

**Terminal 1 (Backend API on http://localhost:5000):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend on http://localhost:5173):**
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your web browser.

---

## 🛡️ Secure Administrator Creation (CLI Tool)

To provision an Administrator account without hardcoding credentials into source code, run the protected CLI script:

```bash
cd backend
npm run create-admin -- --email sysadmin@campus.edu --password MySecurePass@2026 --name "Systems Administrator"
```

The script hashes the password with bcrypt, verifies strength, and provisions or promotes the specified user to `ADMIN`.

---

## 🧪 Automated Testing

To run the automated integration test suite:

```bash
cd backend
npm test
```

### Test Coverage Highlights:
- **Auth & Escalation Protection**: Verifies student registration and blocks client-side role manipulation.
- **Privacy & Object-Level Authorization**: Ensures Student B receives `403 Forbidden` when attempting to access Student A's private complaint.
- **Status & Workflow Rules**: Verifies CMP-YYYY-XXXX generation, staff notes, and resolution feedback.
- **Community Verifications**: Prevents duplicate issue verification votes.
- **Academic Timetable**: Validates and rejects overlapping class times.
- **Campus Health Score**: Tests bounding `[10, 100]` and formula logic.
- **SOS Dispatch & Acknowledgment**: Verifies alert triage workflow.

---

## 📊 Campus Health Score Formula

The transparent Campus Health Index is calculated as:

$$\text{Health Score} = 100 - (\text{Active} \times 2) - (\text{Critical} \times 6) - (\text{Overdue} > 72\text{h} \times 4) + \left(\frac{\text{Resolved}}{\text{Total}} \times 15\right)$$

- **Baseline**: 100 points
- **Active Issues Penalty**: -2 pts per open issue (Max 30)
- **Critical Unresolved Penalty**: -6 pts per open critical issue (Max 25)
- **Overdue Penalty**: -4 pts per issue unresolved after 72 hours (Max 20)
- **Resolution Efficiency Bonus**: Up to +15 pts based on completion ratio
- **Clamped Range**: 10 to 100
- *Notice*: This is an application-generated operational metric and not a certified safety rating.

---

## 📁 Project Architecture & Directory Structure

```
smart-digital-campus/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Normalized relational database schema
│   │   ├── seed.ts              # Fictional demo seed script
│   │   └── create-admin.ts      # Secure admin provisioning CLI
│   ├── src/
│   │   ├── config/              # Constants, routing rules, db singleton
│   │   ├── controllers/         # Auth, Complaints, Dashboards, Community, Campus, Academic, SOS, Admin
│   │   ├── middleware/          # JWT auth, role guard, rate limit, upload, error handler
│   │   ├── routes/              # RESTful express route definitions
│   │   ├── services/            # In-app notifications service
│   │   ├── utils/               # Complaint ID generator, text similarity, health score, audit logger
│   │   ├── __tests__/           # Vitest integration test suites
│   │   ├── app.ts               # Express configuration, Helmet, CORS, upload routes
│   │   └── server.ts            # Server entrypoint
│   ├── uploads/                 # Safe static upload storage
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/                 # Typed fetch client with cookie credentials
│   │   ├── components/          # Navbar, Sidebar, StatusBadge, Modal, Layout
│   │   ├── context/             # AuthContext, NotificationContext
│   │   ├── pages/               # 18 fully implemented application pages
│   │   ├── types/               # TypeScript interfaces
│   │   ├── App.tsx              # Router setup with role-based route guards
│   │   ├── main.tsx             # React entrypoint
│   │   └── index.css            # Tailwind Royal Blue stylesheet
│   ├── index.html
│   ├── vite.config.ts           # Proxy config to port 5000
│   ├── tailwind.config.js       # Royal blue theme extensions
│   └── tsconfig.json
├── package.json                 # Monorepo root scripts
├── .env.example
└── README.md
```

---

## 📡 Key REST API Endpoints

### Authentication & Users
- `POST /api/auth/register` - Student registration (defaults to STUDENT)
- `POST /api/auth/login` - Secure session login (sets HttpOnly cookie)
- `POST /api/auth/logout` - Invalidate session & clear cookie
- `GET /api/auth/me` - Authenticated user details
- `PUT /api/auth/profile` - Update profile information
- `PUT /api/auth/change-password` - Change account password

### Complaint Operations
- `POST /api/complaints/check-duplicate` - Text similarity search
- `POST /api/complaints` - File new complaint with auto-routing
- `GET /api/complaints` - Role-scoped list with pagination and search
- `GET /api/complaints/:id` - Detailed record, timeline, comments
- `POST /api/complaints/:id/status` - Staff/Admin status update
- `POST /api/complaints/:id/assign` - Admin department/staff assignment
- `POST /api/complaints/:id/comments` - Post comment or staff note
- `POST /api/complaints/:id/feedback` - Student resolution rating (1-5)
- `POST /api/complaints/:id/reopen` - Reopen within 7 days
- `POST /api/complaints/:id/verify` - Community issue confirmation (+2 pts)

### Dashboards & Analytics
- `GET /api/dashboards/student` - Student metrics & personal complaints
- `GET /api/dashboards/staff` - Maintenance task queue & progress
- `GET /api/dashboards/admin` - Campus KPIs, category charts, throughput

### Campus Modules
- `GET /api/community/hotspots` - Building coordinates and defect density
- `GET /api/community/leaderboard` - Civic participation points
- `GET /api/community/health-score` - Live health score calculation
- `GET/POST /api/campus/marketplace` - Peer-to-peer buy/sell
- `GET/POST /api/campus/study-groups` - Course study group finder
- `GET/POST /api/campus/ratings` - Facility ratings & reviews
- `GET/POST /api/campus/lost-found` - Misplaced items registry
- `GET/POST /api/campus/canteen` - Menu items and availability
- `GET/POST /api/academic/timetable` - Personal class schedule & conflict checks
- `GET/POST /api/academic/events` - Calendar and registration
- `GET/POST /api/academic/announcements` - Circulars & bulletins
- `GET/POST /api/academic/exams` - Official countdown schedules
- `GET/POST /api/academic/attendance` - Self-recorded attendance tracker
- `POST /api/sos` - Dispatch internal campus emergency alert
- `GET /api/health` - Application & database health check

---

## 🛠️ Production Build

To compile both frontend and backend for production deployment:

```bash
# In backend:
cd backend && npm run build

# In frontend:
cd ../frontend && npm run build
```

This generates:
- Backend: CommonJS build in `backend/dist/`
- Frontend: Minified static assets in `frontend/dist/`

---

## 🔒 Security Best Practices Implemented

1. **Password Security**: Passwords hashed with bcrypt and per-user salt.
2. **Session Cookies**: Authenticated sessions stored in `HttpOnly`, `SameSite=Lax` cookies, blocking client-side JavaScript access.
3. **Strict RBAC**: Role validation enforced on the backend for every route.
4. **Object-Level Authorization**: Students cannot read or mutate other students' private complaints or marketplace items.
5. **Rate Limiting**: Express rate limiting protects authentication endpoints against brute force attempts.
6. **Input Validation**: Sanitization and payload length restrictions.
7. **Secure File Storage**: File uploads validate MIME type and extension, generate unique random filenames, and reject executables.
8. **Audit Trail**: Sensitive administrative actions and logins logged to the `AuditLog` table.
