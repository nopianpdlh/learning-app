# Technical Architecture Document
# Platform E-Learning Tutor Nomor Satu

**Version:** 1.0  
**Last Updated:** November 15, 2025  
**Document Owner:** Engineering Team  

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Web Browser (Desktop & Mobile)                                 │
│  - Next.js 15 App Router (React 19)                             │
│  - TailwindCSS 4 + Shadcn UI                                    │
│  - Client-side State Management (React Context/Zustand)         │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Vercel Edge Network (CDN)                                      │
│  Next.js Server (Vercel Serverless Functions)                  │
│  - Server Components                                             │
│  - API Routes (App Router)                                       │
│  - Server Actions                                                │
│  - Middleware (Auth, Rate Limiting, RBAC)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICES LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Supabase    │  │  Supabase    │  │  Supabase    │          │
│  │  PostgreSQL  │  │  Auth        │  │  Storage     │          │
│  │  (Database)  │  │  (JWT)       │  │  (Files)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Pakasir     │  │  Upstash     │  │  Supabase    │          │
│  │  Payment API │  │  Redis       │  │  Realtime    │          │
│  │              │  │  (Rate Limit)│  │  (Notif)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│  - Zoom API (Future: auto-generate meeting links)              │
│  - Google Meet API (Future)                                     │
│  - Email Service (Supabase built-in / Resend)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 15+ | React framework with App Router, Server Components |
| UI Library | React | 19 | Component-based UI library |
| Styling | TailwindCSS | 4 | Utility-first CSS framework |
| Component Library | Shadcn UI | Latest | Pre-built accessible components |
| Forms | React Hook Form | 7+ | Form validation & management |
| Schema Validation | Zod | 3+ | TypeScript-first schema validation |
| State Management | Zustand / React Context | Latest | Client-side state (if needed) |
| Icons | Lucide React | Latest | Icon library |
| Rich Text Editor | Tiptap / Lexical | Latest | WYSIWYG editor for materials |

### 2.2 Backend Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Runtime | Node.js | 20+ LTS | JavaScript runtime (via Vercel) |
| Framework | Next.js App Router | 15+ | API Routes, Server Actions, Middleware |
| ORM | Prisma | 5+ | Type-safe database client |
| Validation | Zod | 3+ | Input validation for API endpoints |
| Authentication | Supabase Auth | Latest | JWT-based auth with RLS |
| Rate Limiting | Upstash Redis | Latest | Prevent API abuse |

### 2.3 Database & Storage

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Primary Database | Supabase PostgreSQL | Relational data (users, classes, assignments, etc.) |
| File Storage | Supabase Storage | Materials, assignment submissions, profile pictures |
| Cache | Upstash Redis | Rate limiting, session cache (optional) |
| ORM | Prisma | Database schema management & queries |

### 2.4 Third-Party Services

| Service | Purpose | Criticality |
|---------|---------|-------------|
| Pakasir | Payment gateway (QRIS, VA, E-Wallet) | Critical |
| Supabase Auth | Authentication & authorization | Critical |
| Supabase Realtime | Real-time notifications | High |
| Vercel | Hosting & deployment | Critical |
| Resend / SendGrid | Transactional emails (optional) | Medium |

### 2.5 DevOps & Monitoring

| Tool | Purpose |
|------|---------|
| GitHub | Version control & CI/CD |
| Vercel | Automatic deployment from Git |
| Prisma Migrate | Database migrations |
| Sentry (optional) | Error tracking & monitoring |
| Vercel Analytics | Performance monitoring |

---

## 3. Application Architecture

### 3.1 Folder Structure

```
learning-app/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (no dashboard layout)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx            # Simple layout (no sidebar)
│   │
│   ├── (dashboard)/              # Dashboard route group (Holy Grail layout)
│   │   ├── admin/
│   │   │   ├── users/
│   │   │   ├── classes/
│   │   │   ├── payments/
│   │   │   └── page.tsx          # Admin dashboard home
│   │   ├── tutor/
│   │   │   ├── classes/
│   │   │   ├── materials/
│   │   │   ├── assignments/
│   │   │   ├── quizzes/
│   │   │   └── page.tsx          # Tutor dashboard home
│   │   ├── student/
│   │   │   ├── classes/
│   │   │   ├── assignments/
│   │   │   ├── quizzes/
│   │   │   ├── grades/
│   │   │   └── page.tsx          # Student dashboard home
│   │   └── layout.tsx            # Holy Grail layout
│   │
│   ├── (public)/                 # Public pages (no auth required)
│   │   ├── catalog/              # Class catalog
│   │   └── layout.tsx
│   │
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── register/route.ts
│   │   ├── classes/
│   │   │   ├── route.ts          # GET /api/classes, POST /api/classes
│   │   │   └── [id]/route.ts     # GET/PUT/DELETE /api/classes/:id
│   │   ├── enrollments/
│   │   ├── assignments/
│   │   ├── quizzes/
│   │   ├── materials/
│   │   ├── payments/
│   │   │   └── webhook/route.ts  # Pakasir webhook
│   │   └── upload/route.ts       # File upload handler
│   │
│   ├── globals.css
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page (optional)
│
├── components/
│   ├── ui/                       # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── layouts/
│   │   ├── HolyGrailLayout.tsx   # Dashboard layout
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── classes/
│   │   │   ├── ClassCard.tsx
│   │   │   └── ClassList.tsx
│   │   ├── assignments/
│   │   ├── quizzes/
│   │   └── gradebook/
│   └── shared/
│       ├── Navbar.tsx
│       └── Loading.tsx
│
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── auth.ts                   # Supabase auth helpers
│   ├── supabase/
│   │   ├── client.ts             # Supabase client (browser)
│   │   └── server.ts             # Supabase client (server)
│   ├── validations/              # Zod schemas
│   │   ├── auth.schema.ts
│   │   ├── class.schema.ts
│   │   └── assignment.schema.ts
│   ├── utils.ts                  # Utility functions (cn, formatDate, etc.)
│   ├── constants.ts              # App constants
│   └── types.ts                  # TypeScript types
│
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Migration history
│   └── seed.ts                   # Database seeding script
│
├── public/
│   ├── images/
│   └── icons/
│
├── middleware.ts                 # Next.js middleware (auth, rate limit)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.local                    # Environment variables
└── README.md
```

---

## 4. Data Architecture

### 4.1 Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum Role {
  ADMIN
  TUTOR
  STUDENT
}

enum EnrollmentStatus {
  PENDING   // Awaiting payment
  PAID      // Payment confirmed
  ACTIVE    // Currently enrolled
  COMPLETED // Class finished
  CANCELLED // Enrollment cancelled
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum AssignmentStatus {
  DRAFT
  PUBLISHED
}

enum SubmissionStatus {
  NOT_SUBMITTED
  SUBMITTED
  GRADED
  LATE
}

enum QuizStatus {
  DRAFT
  PUBLISHED
  CLOSED
}

// ============================================
// MODELS
// ============================================

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  phone     String?  @unique
  name      String
  role      Role     @default(STUDENT)
  avatar    String?
  
  // Supabase Auth ID (foreign key to auth.users)
  authId    String   @unique
  
  // Profile extensions
  studentProfile  StudentProfile?
  tutorProfile    TutorProfile?
  
  // Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([email])
  @@index([role])
}

model StudentProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  grade     String?  // e.g., "12", "SMA", etc.
  school    String?
  parentName  String?
  parentPhone String?
  
  // Relations
  enrollments     Enrollment[]
  submissions     AssignmentSubmission[]
  quizAttempts    QuizAttempt[]
  forumPosts      ForumPost[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model TutorProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  bio       String?
  subjects  String[] // e.g., ["Matematika", "Fisika"]
  
  // Relations
  classes   Class[]
  materials Material[]
  assignments Assignment[]
  quizzes   Quiz[]
  forumPosts ForumPost[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Class {
  id          String   @id @default(cuid())
  title       String
  description String?  @db.Text
  subject     String   // e.g., "Matematika"
  gradeLevel  String   // e.g., "12", "SMA"
  price       Decimal  @db.Decimal(10, 2)
  capacity    Int      @default(30)
  
  // Schedule
  schedule    String?  // e.g., "Senin & Rabu 19:00 - 21:00"
  startDate   DateTime?
  endDate     DateTime?
  
  // Status
  published   Boolean  @default(false)
  
  // Relations
  tutorId     String
  tutor       TutorProfile @relation(fields: [tutorId], references: [id])
  
  enrollments Enrollment[]
  materials   Material[]
  assignments Assignment[]
  quizzes     Quiz[]
  liveClasses LiveClass[]
  forumThreads ForumThread[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([tutorId])
  @@index([published])
  @@index([subject])
}

model Enrollment {
  id        String   @id @default(cuid())
  
  studentId String
  student   StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  classId   String
  class     Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  
  status    EnrollmentStatus @default(PENDING)
  
  // Payment
  payment   Payment?
  
  enrolledAt DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@unique([studentId, classId]) // Prevent duplicate enrollment
  @@index([studentId])
  @@index([classId])
  @@index([status])
}

model Payment {
  id            String   @id @default(cuid())
  
  enrollmentId  String   @unique
  enrollment    Enrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  
  amount        Decimal  @db.Decimal(10, 2)
  method        String   // "QRIS", "VA_BCA", "EWALLET_OVO", etc.
  status        PaymentStatus @default(PENDING)
  
  // Pakasir data
  externalId    String?  @unique // Pakasir transaction ID
  paymentUrl    String?  // Payment page URL
  paidAt        DateTime?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([status])
  @@index([externalId])
}

model Material {
  id          String   @id @default(cuid())
  
  classId     String
  class       Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  
  tutorId     String
  tutor       TutorProfile @relation(fields: [tutorId], references: [id])
  
  title       String
  description String?  @db.Text
  type        String   // "PDF", "VIDEO", "LINK", "DOCUMENT"
  fileUrl     String?  // Supabase Storage URL or YouTube embed URL
  fileName    String?
  fileSize    Int?     // in bytes
  
  session     Int      // Pertemuan ke-1, 2, 3, etc.
  order       Int      @default(0) // For sorting within session
  
  published   Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([classId])
  @@index([session])
}

model Assignment {
  id          String   @id @default(cuid())
  
  classId     String
  class       Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  
  tutorId     String
  tutor       TutorProfile @relation(fields: [tutorId], references: [id])
  
  title       String
  description String   @db.Text
  maxPoints   Int      @default(100)
  dueDate     DateTime
  
  // Attachments
  attachmentUrl String?
  
  status      AssignmentStatus @default(DRAFT)
  
  // Relations
  submissions AssignmentSubmission[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([classId])
  @@index([status])
  @@index([dueDate])
}

model AssignmentSubmission {
  id          String   @id @default(cuid())
  
  assignmentId String
  assignment  Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  
  studentId   String
  student     StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  fileUrl     String   // Supabase Storage URL
  fileName    String
  fileSize    Int
  
  status      SubmissionStatus @default(SUBMITTED)
  score       Int?     // 0 to maxPoints
  feedback    String?  @db.Text
  
  submittedAt DateTime @default(now())
  gradedAt    DateTime?
  updatedAt   DateTime @updatedAt
  
  @@unique([assignmentId, studentId]) // One submission per student
  @@index([assignmentId])
  @@index([studentId])
  @@index([status])
}

model Quiz {
  id          String   @id @default(cuid())
  
  classId     String
  class       Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  
  tutorId     String
  tutor       TutorProfile @relation(fields: [tutorId], references: [id])
  
  title       String
  description String?  @db.Text
  timeLimit   Int?     // in minutes
  maxAttempts Int      @default(1)
  passingScore Int?    // percentage (0-100)
  
  // Availability
  startTime   DateTime?
  endTime     DateTime?
  
  status      QuizStatus @default(DRAFT)
  
  // Relations
  questions   QuizQuestion[]
  attempts    QuizAttempt[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([classId])
  @@index([status])
}

model QuizQuestion {
  id          String   @id @default(cuid())
  
  quizId      String
  quiz        Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  
  type        String   // "MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"
  question    String   @db.Text
  points      Int      @default(1)
  order       Int      // Question order
  
  // For MCQ & T/F
  options     Json?    // { "A": "...", "B": "...", "C": "...", "D": "..." }
  correctAnswer String? // "A", "B", "TRUE", "FALSE", or exact text for short answer
  
  explanation String?  @db.Text
  
  // Relations
  answers     QuizAnswer[]
  
  createdAt   DateTime @default(now())
  
  @@index([quizId])
}

model QuizAttempt {
  id          String   @id @default(cuid())
  
  quizId      String
  quiz        Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  
  studentId   String
  student     StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  score       Int?     // Total score
  maxScore    Int?     // Total possible score
  percentage  Int?     // 0-100
  
  startedAt   DateTime @default(now())
  submittedAt DateTime?
  
  // Relations
  answers     QuizAnswer[]
  
  @@index([quizId])
  @@index([studentId])
}

model QuizAnswer {
  id          String   @id @default(cuid())
  
  attemptId   String
  attempt     QuizAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  
  questionId  String
  question    QuizQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  answer      String   // Student's answer
  isCorrect   Boolean?
  pointsAwarded Int?
  
  createdAt   DateTime @default(now())
  
  @@index([attemptId])
  @@index([questionId])
}

model LiveClass {
  id          String   @id @default(cuid())
  
  classId     String
  class       Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  
  title       String
  meetingUrl  String   // Zoom/Meet link
  scheduledAt DateTime
  duration    Int      // in minutes
  
  // Future: auto-generated via API
  externalMeetingId String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([classId])
  @@index([scheduledAt])
}

model ForumThread {
  id          String   @id @default(cuid())
  
  classId     String
  class       Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  
  title       String
  isPinned    Boolean  @default(false)
  isLocked    Boolean  @default(false)
  
  // Relations
  posts       ForumPost[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([classId])
}

model ForumPost {
  id          String   @id @default(cuid())
  
  threadId    String
  thread      ForumThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  
  authorId    String   // Can be student or tutor
  authorType  Role     // To differentiate
  
  // Relations (polymorphic-ish)
  studentAuthor StudentProfile? @relation(fields: [authorId], references: [id], onDelete: Cascade)
  tutorAuthor   TutorProfile?   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  content     String   @db.Text
  
  parentId    String?  // For nested replies
  parent      ForumPost? @relation("PostReplies", fields: [parentId], references: [id])
  replies     ForumPost[] @relation("PostReplies")
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([threadId])
  @@index([authorId])
}

model Notification {
  id          String   @id @default(cuid())
  
  userId      String   // Recipient
  type        String   // "ASSIGNMENT_GRADED", "NEW_MATERIAL", "LIVE_CLASS_REMINDER", etc.
  title       String
  message     String   @db.Text
  link        String?  // URL to navigate when clicked
  
  read        Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([read])
}

model AuditLog {
  id          String   @id @default(cuid())
  
  userId      String   // Who performed the action
  action      String   // "CREATE_CLASS", "DELETE_USER", "UPDATE_PAYMENT", etc.
  entity      String   // "Class", "User", "Payment", etc.
  entityId    String?  // ID of affected entity
  metadata    Json?    // Additional context
  
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

### 4.2 Database Relationships

```
User (1) ────────→ (0..1) StudentProfile
User (1) ────────→ (0..1) TutorProfile

TutorProfile (1) ─→ (*) Class
Class (1) ────────→ (*) Enrollment
StudentProfile (1) ─→ (*) Enrollment

Enrollment (1) ───→ (0..1) Payment

Class (1) ────────→ (*) Material
Class (1) ────────→ (*) Assignment
Class (1) ────────→ (*) Quiz
Class (1) ────────→ (*) LiveClass
Class (1) ────────→ (*) ForumThread

Assignment (1) ───→ (*) AssignmentSubmission
StudentProfile (1) ─→ (*) AssignmentSubmission

Quiz (1) ─────────→ (*) QuizQuestion
Quiz (1) ─────────→ (*) QuizAttempt
StudentProfile (1) ─→ (*) QuizAttempt
QuizAttempt (1) ──→ (*) QuizAnswer
QuizQuestion (1) ─→ (*) QuizAnswer

ForumThread (1) ──→ (*) ForumPost
ForumPost (1) ────→ (*) ForumPost (self-referencing for replies)
```

---

## 5. API Architecture

### 5.1 API Design Principles

- **RESTful**: Follow REST conventions where applicable
- **Server Actions**: Use Next.js Server Actions for mutations (form submissions)
- **Type-safe**: All inputs/outputs validated with Zod schemas
- **Consistent Response Format**:

```typescript
// Success response
{
  success: true,
  data: { ... }
}

// Error response
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid email format",
    details: { ... }
  }
}
```

### 5.2 API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (handled by Supabase)
- `POST /api/auth/logout` - Logout
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/verify-email` - Verify email with OTP

#### Users (Admin only)
- `GET /api/users` - List all users (with filters)
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (soft delete)

#### Classes
- `GET /api/classes` - List classes (public, filterable)
- `POST /api/classes` - Create class (admin/tutor)
- `GET /api/classes/:id` - Get class details
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

#### Enrollments
- `POST /api/enrollments` - Enroll in class (creates pending enrollment + payment)
- `GET /api/enrollments/my` - Get current user's enrollments
- `GET /api/classes/:classId/enrollments` - Get class enrollments (tutor/admin)

#### Payments
- `POST /api/payments/webhook` - Pakasir webhook callback
- `GET /api/payments/:id` - Get payment details
- `GET /api/payments/my` - Get user's payment history

#### Materials
- `GET /api/classes/:classId/materials` - List materials
- `POST /api/classes/:classId/materials` - Upload material
- `GET /api/materials/:id` - Get material details
- `PUT /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Delete material

#### Assignments
- `GET /api/classes/:classId/assignments` - List assignments
- `POST /api/classes/:classId/assignments` - Create assignment
- `GET /api/assignments/:id` - Get assignment details
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment
- `POST /api/assignments/:id/submit` - Submit assignment
- `GET /api/assignments/:id/submissions` - Get submissions (tutor)
- `PUT /api/submissions/:id/grade` - Grade submission

#### Quizzes
- `GET /api/classes/:classId/quizzes` - List quizzes
- `POST /api/classes/:classId/quizzes` - Create quiz
- `GET /api/quizzes/:id` - Get quiz (with questions for tutor, without answers for student)
- `POST /api/quizzes/:id/start` - Start quiz attempt
- `POST /api/quizzes/:id/submit` - Submit quiz
- `GET /api/quizzes/:id/results` - Get quiz results

#### Live Classes
- `GET /api/classes/:classId/live-classes` - List live classes
- `POST /api/classes/:classId/live-classes` - Create/schedule live class
- `PUT /api/live-classes/:id` - Update live class
- `DELETE /api/live-classes/:id` - Delete live class

#### Forum
- `GET /api/classes/:classId/forum` - List forum threads
- `POST /api/classes/:classId/forum` - Create thread
- `GET /api/forum/threads/:id` - Get thread with posts
- `POST /api/forum/threads/:id/posts` - Add post to thread
- `DELETE /api/forum/posts/:id` - Delete post

#### Gradebook
- `GET /api/classes/:classId/gradebook` - Get class gradebook (tutor)
- `GET /api/students/my/grades` - Get student's own grades

#### Notifications
- `GET /api/notifications/my` - Get user's notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all as read

#### File Upload
- `POST /api/upload` - Generic file upload to Supabase Storage

---

## 6. Security Architecture

### 6.1 Authentication Flow

```
1. User submits credentials → Supabase Auth
2. Supabase returns JWT access token + refresh token
3. Token stored in httpOnly cookie (server-side)
4. Middleware validates JWT on each request
5. User info extracted from token (userId, role)
6. Authorization check via RBAC
```

### 6.2 Authorization (RBAC)

**Middleware-based Authorization:**

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.redirect('/login')
  }
  
  // Check role-based access
  const path = request.nextUrl.pathname
  const userRole = user.user_metadata.role
  
  if (path.startsWith('/admin') && userRole !== 'ADMIN') {
    return NextResponse.redirect('/unauthorized')
  }
  
  if (path.startsWith('/tutor') && !['TUTOR', 'ADMIN'].includes(userRole)) {
    return NextResponse.redirect('/unauthorized')
  }
  
  return NextResponse.next()
}
```

**Database-level Authorization (RLS):**

```sql
-- Example: Students can only see their own submissions
CREATE POLICY "Students can view own submissions"
ON assignment_submissions
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM student_profiles WHERE user_id = auth.uid()
  )
);

-- Tutors can see submissions for their classes
CREATE POLICY "Tutors can view class submissions"
ON assignment_submissions
FOR SELECT
USING (
  assignment_id IN (
    SELECT a.id FROM assignments a
    JOIN classes c ON a.class_id = c.id
    JOIN tutor_profiles t ON c.tutor_id = t.id
    WHERE t.user_id = auth.uid()
  )
);
```

### 6.3 Input Validation

All API inputs validated with Zod:

```typescript
// lib/validations/assignment.schema.ts
import { z } from 'zod'

export const createAssignmentSchema = z.object({
  classId: z.string().cuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(10),
  maxPoints: z.number().int().min(1).max(1000),
  dueDate: z.string().datetime(),
  attachmentUrl: z.string().url().optional(),
})

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>
```

### 6.4 Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
})

// Usage in API route
const identifier = request.ip ?? 'anonymous'
const { success } = await ratelimit.limit(identifier)

if (!success) {
  return new Response('Too Many Requests', { status: 429 })
}
```

### 6.5 File Upload Security

```typescript
// lib/upload-validation.ts
const ALLOWED_MIME_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function validateFile(file: File) {
  if (!ALLOWED_MIME_TYPES[file.type]) {
    throw new Error('Invalid file type')
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large')
  }
  
  // Additional: virus scan via external API (optional)
}
```

---

## 7. Performance Optimization

### 7.1 Caching Strategy

- **Static Pages**: ISR (Incremental Static Regeneration) for public catalog
- **Dynamic Data**: React Query with stale-while-revalidate
- **CDN**: Vercel Edge Network for static assets
- **Database**: Prisma query result caching

### 7.2 Code Splitting

- **Route-based**: Automatic with Next.js App Router
- **Component-based**: React.lazy() for heavy components (e.g., rich text editor)

### 7.3 Image Optimization

- Use Next.js `<Image />` component
- Lazy loading below fold
- WebP format with fallback

### 7.4 Database Query Optimization

```typescript
// Use Prisma select to fetch only needed fields
const classes = await prisma.class.findMany({
  select: {
    id: true,
    title: true,
    price: true,
    tutor: {
      select: {
        user: {
          select: { name: true }
        }
      }
    }
  },
  where: { published: true }
})

// Use pagination
const classes = await prisma.class.findMany({
  take: 20,
  skip: (page - 1) * 20,
})
```

---

## 8. Deployment Architecture

### 8.1 Deployment Pipeline

```
1. Developer pushes to GitHub (main branch)
2. Vercel detects push → triggers build
3. Run tests (unit, integration)
4. Build Next.js app
5. Deploy to Vercel Edge Network
6. Run Prisma migrations (if any)
7. Deployment complete
```

### 8.2 Environment Variables

```bash
# .env.local (development)
# .env.production (Vercel)

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..." # For migrations (bypasses pooler)

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..." # Server-side only

# Pakasir
PAKASIR_API_KEY="..."
PAKASIR_MERCHANT_ID="..."
PAKASIR_WEBHOOK_SECRET="..."

# Upstash Redis
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# App
NEXT_PUBLIC_APP_URL="https://belajar.tutornomor1.com"
```

### 8.3 Infrastructure

- **Hosting**: Vercel (Serverless)
- **Database**: Supabase Cloud (PostgreSQL)
- **Storage**: Supabase Storage (S3-compatible)
- **CDN**: Vercel Edge Network
- **DNS**: Cloudflare (optional, for DDoS protection)

---

## 9. Monitoring & Logging

### 9.1 Error Tracking

- **Tool**: Sentry (optional)
- **What to track**: API errors, client-side errors, unhandled exceptions

### 9.2 Performance Monitoring

- **Tool**: Vercel Analytics (built-in)
- **Metrics**: Core Web Vitals, serverless function execution time

### 9.3 Logging

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date() }))
  },
  error: (message: string, error?: Error, meta?: any) => {
    console.error(JSON.stringify({ level: 'error', message, error: error?.stack, ...meta, timestamp: new Date() }))
  }
}

// Usage
logger.info('User enrolled in class', { userId, classId })
logger.error('Payment webhook failed', error, { enrollmentId })
```

---

## 10. Scalability Considerations

### 10.1 Current Capacity

- **Users**: Up to 1,000 concurrent users (Vercel serverless)
- **Database**: Supabase free tier (500MB, upgrade to Pro for unlimited)
- **Storage**: Supabase Storage (1GB free, upgrade for more)

### 10.2 Scaling Strategy

**When to scale:**
- Database > 80% capacity → Upgrade Supabase plan
- > 1,000 concurrent users → Optimize queries, add caching
- File storage > 1GB → Upgrade or migrate to Cloudflare R2

**Horizontal scaling:**
- Vercel automatically scales serverless functions
- Database: Supabase connection pooler (built-in)

---

## 11. Backup & Disaster Recovery

### 11.1 Database Backup

- **Automated**: Supabase daily backups (7-day retention on free tier, 30-day on paid)
- **Manual**: Export SQL dump before major migrations

### 11.2 File Storage Backup

- **Automated**: Supabase automatic backups
- **Manual**: Periodic download of critical files to external storage

### 11.3 Disaster Recovery Plan

1. Restore database from latest backup
2. Restore files from backup
3. Redeploy app from Git (Vercel)
4. Verify data integrity
5. RTO (Recovery Time Objective): < 2 hours
6. RPO (Recovery Point Objective): < 24 hours (daily backups)

---

## 12. Testing Strategy

### 12.1 Unit Tests

- **Framework**: Vitest
- **Coverage**: Utility functions, validation schemas, business logic

### 12.2 Integration Tests

- **Framework**: Playwright or Cypress
- **Coverage**: API endpoints, critical user flows (enroll → pay → access class)

### 12.3 E2E Tests

- **Framework**: Playwright
- **Coverage**: Complete user journeys for each role

---

## 13. Documentation

### 13.1 Code Documentation

- **JSDoc**: For complex functions
- **README**: Setup instructions, architecture overview
- **ADR (Architecture Decision Records)**: Document key technical decisions

### 13.2 API Documentation

- **Tool**: Generate OpenAPI spec from Zod schemas
- **Hosted**: Swagger UI or similar

---

**Document End**
