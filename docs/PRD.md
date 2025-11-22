# Product Requirements Document (PRD)

# Platform E-Learning Tutor Nomor Satu

**Version:** 1.0  
**Last Updated:** November 15, 2025  
**Document Owner:** Product Team  
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Product Vision

Platform E-Learning Tutor Nomor Satu adalah Learning Management System (LMS) terpusat yang dirancang untuk menggantikan proses manual dan terfragmentasi dalam pengelolaan bimbingan belajar, dengan mengintegrasikan pendaftaran, pembelajaran, evaluasi, dan pembayaran dalam satu platform web.

### 1.2 Business Objectives

- **Efisiensi Operasional**: Mengurangi 80% beban administratif manual
- **Pengalaman Pengguna**: Meningkatkan kepuasan siswa dan tutor melalui centralized platform
- **Skalabilitas**: Memungkinkan pertumbuhan jumlah siswa tanpa menambah beban admin
- **Revenue Growth**: Otomasi pembayaran dan pengurangan drop-off saat pendaftaran

### 1.3 Success Metrics

| Metric                     | Target                                | Timeline |
| -------------------------- | ------------------------------------- | -------- |
| User Adoption Rate         | 80% siswa aktif                       | 3 bulan  |
| Admin Time Reduction       | 70% pengurangan waktu admin           | 6 bulan  |
| Payment Success Rate       | 95% pembayaran otomatis terverifikasi | 1 bulan  |
| Student Satisfaction (NPS) | > 70                                  | 6 bulan  |
| Assignment Submission Rate | 85% submit tepat waktu                | 3 bulan  |

---

## 2. Problem Statement

### 2.1 Current Pain Points

#### 2.1.1 Pendaftaran (WhatsApp)

- **Problem**: Koordinasi manual, data tercecer, rentan human error
- **Impact**: Admin overload, poor tracking, kehilangan calon siswa

#### 2.1.2 Pembelajaran (Zoom + Google Drive)

- **Problem**: Link tercecer, materi tidak terorganisir
- **Impact**: Siswa kesulitan akses, waktu terbuang mencari link/materi

#### 2.1.3 Evaluasi (Google Forms)

- **Problem**: Penilaian manual, rekap nilai terpisah
- **Impact**: Tidak ada tracking progress real-time, feedback terlambat

#### 2.1.4 Komunikasi (WhatsApp Group)

- **Problem**: Informasi penting tenggelam dalam chat sehari-hari
- **Impact**: Missed announcements, diskusi tidak terstruktur

### 2.2 Target Users

1. **Admin (1-2 orang)**: Mengelola platform, user, kelas, dan pembayaran
2. **Tutor/Pengajar (10-50 orang)**: Mengajar, upload materi, buat tugas/kuis
3. **Siswa (100-1000+ orang)**: Belajar, submit tugas, lihat progress

---

## 3. Product Requirements

### 3.1 User Roles & Permissions

#### 3.1.1 Admin

**Capabilities:**

- CRUD semua user (siswa, tutor, admin)
- CRUD kelas dan assign tutor
- Monitor pembayaran dan enrollment
- Generate laporan (revenue, attendance, grades)
- Manage platform settings
- Audit logs access
- analytics & reports,

#### 3.1.2 Tutor

**Capabilities:**

- View kelas yang diampu
- CRUD materi pembelajaran
- CRUD tugas dan kuis
- Grade assignments dan provide feedback
- Manage forum diskusi kelas
- View student progress dalam kelasnya
- Input/generate live class link

#### 3.1.3 Siswa

**Capabilities:**

- Browse dan enroll kelas
- View materi pembelajaran
- Submit tugas dan mengerjakan kuis
- Join live class (Zoom/Meet)
- Participate in forum diskusi
- View personal gradebook/rapor
- Receive notifications

---

## 4. Feature Requirements

### 4.1 Authentication & Authorization

#### FR-AUTH-001: User Registration

- **Priority:** P0 (Must Have)
- **Description:** Siswa dapat mendaftar dengan email/phone
- **Acceptance Criteria:**
  - Form validasi email format dan phone number
  - Email verification OTP
  - Password strength requirement (min 8 char, 1 uppercase, 1 number)
  - Auto-create user profile upon successful registration

#### FR-AUTH-002: Login Multi-Role

- **Priority:** P0
- **Description:** Login dengan role-based redirect
- **Acceptance Criteria:**
  - Support email/phone + password login
  - Remember me functionality
  - Redirect based on role (admin → admin dashboard, tutor → tutor dashboard, siswa → student dashboard)
  - Session management (JWT via Supabase Auth)

#### FR-AUTH-003: Password Reset

- **Priority:** P1
- **Description:** Forgot password via email
- **Acceptance Criteria:**
  - Send reset link to registered email
  - Expire link after 1 hour
  - Allow password update

---

### 4.2 User Management (Admin)

#### FR-USER-001: Manage Students

- **Priority:** P0
- **Description:** Admin can create, read, update, delete student accounts
- **Acceptance Criteria:**
  - Bulk import students via CSV
  - Individual student edit (name, email, phone, status)
  - Soft delete (archive) instead of hard delete
  - View student enrollment history

#### FR-USER-002: Manage Tutors

- **Priority:** P0
- **Description:** Admin can manage tutor accounts
- **Acceptance Criteria:**
  - Create tutor with assigned subjects
  - Edit tutor profile and permissions
  - View tutor's class list
  - Deactivate tutor account

---

### 4.3 Class Management

#### FR-CLASS-001: Create Class

- **Priority:** P0
- **Description:** Admin creates class with details
- **Acceptance Criteria:**
  - Input: Class name, description, subject, grade level, price, schedule, tutor assignment
  - Set capacity limit (max students)
  - Set enrollment open/close dates
  - Publish/unpublish toggle

#### FR-CLASS-002: Class Catalog (Public)

- **Priority:** P0
- **Description:** Siswa dapat browse kelas tersedia
- **Acceptance Criteria:**
  - Display kelas yang published
  - Filter by subject, grade level, price range
  - Search by keyword
  - Show enrolled count / capacity
  - CTA "Daftar Sekarang"

#### FR-CLASS-003: Enrollment

- **Priority:** P0
- **Description:** Siswa enroll ke kelas
- **Acceptance Criteria:**
  - Prevent duplicate enrollment
  - Redirect to payment gateway setelah enroll
  - Auto-grant access setelah payment confirmed
  - Send enrollment confirmation email

---

### 4.4 Payment Integration

#### FR-PAY-001: Payment Gateway Integration (Pakasir)

- **Priority:** P0
- **Description:** Integrasi Pakasir untuk pembayaran kelas
- **Acceptance Criteria:**
  - Support QRIS, Virtual Account, E-Wallet
  - Display payment instructions
  - Webhook callback untuk auto-verification
  - Update enrollment status to "PAID" upon success
  - Send payment receipt via email

#### FR-PAY-002: Payment History

- **Priority:** P1
- **Description:** Siswa dan admin dapat lihat riwayat pembayaran
- **Acceptance Criteria:**
  - Display payment date, amount, method, status
  - Download invoice PDF
  - Filter by date range and status

---

### 4.5 Learning Materials

#### FR-MAT-001: Upload Materials

- **Priority:** P0
- **Description:** Tutor dapat upload materi per pertemuan
- **Acceptance Criteria:**
  - Support file types: PDF, PPTX, DOCX (max 50MB)
  - Support video embed (YouTube, Vimeo)
  - Organize materials by session (Pertemuan 1, 2, 3...)
  - Rich text editor untuk deskripsi materi

#### FR-MAT-002: View Materials (Student)

- **Priority:** P0
- **Description:** Siswa dapat akses materi kelas yang diikuti
- **Acceptance Criteria:**
  - Display materials organized by session
  - Preview PDF/docs in-browser
  - Download materials
  - Track material view (analytics)

---

### 4.6 Assignments (Tugas)

#### FR-ASG-001: Create Assignment

- **Priority:** P0
- **Description:** Tutor membuat tugas dengan deadline
- **Acceptance Criteria:**
  - Input: Title, instructions (rich text), deadline, max points
  - Attach reference files (optional)
  - Set visibility (draft/published)
  - Send notification to enrolled students upon publish

#### FR-ASG-002: Submit Assignment

- **Priority:** P0
- **Description:** Siswa submit tugas sebelum deadline
- **Acceptance Criteria:**
  - Upload file jawaban (PDF, DOCX, JPG, max 20MB)
  - Show countdown timer to deadline
  - Prevent submit after deadline (unless tutor allows late submission)
  - Allow re-submit (overwrite previous submission)
  - Show submission confirmation

#### FR-ASG-003: Grade Assignment

- **Priority:** P0
- **Description:** Tutor menilai tugas siswa
- **Acceptance Criteria:**
  - View submitted file in-browser
  - Input score (0 - max points)
  - Provide text feedback
  - File annotation (optional - future enhancement)
  - Auto-update gradebook upon grading

---

### 4.7 Quizzes (Kuis)

#### FR-QZ-001: Create Quiz

- **Priority:** P0
- **Description:** Tutor membuat kuis online
- **Acceptance Criteria:**
  - Support question types: Multiple Choice, True/False, Short Answer
  - Set time limit (minutes)
  - Set available period (start & end time)
  - Randomize question order (optional)
  - Set passing grade (optional)

#### FR-QZ-002: Take Quiz

- **Priority:** P0
- **Description:** Siswa mengerjakan kuis
- **Acceptance Criteria:**
  - Show countdown timer
  - Auto-submit upon time expiry
  - Save answers in real-time (prevent data loss)
  - Prevent multiple attempts (configurable by tutor)
  - Show immediate result for auto-graded questions (MCQ, T/F)

#### FR-QZ-003: Quiz Results

- **Priority:** P0
- **Description:** Tampilkan hasil kuis
- **Acceptance Criteria:**
  - Show score, correct/incorrect answers
  - Show correct answer explanations (if tutor enabled)
  - Auto-update gradebook
  - Send quiz result notification

---

### 4.8 Live Class Integration

#### FR-LIVE-001: Manual Link Input

- **Priority:** P0
- **Description:** Tutor input link Zoom/Meet manual
- **Acceptance Criteria:**
  - Input: Meeting URL, scheduled date/time, duration
  - Validate URL format
  - Display "Join Class" button on student dashboard
  - Show countdown to class start

#### FR-LIVE-002: Auto-Generate Link (Future)

- **Priority:** P2
- **Description:** Generate Zoom/Meet link via API
- **Acceptance Criteria:**
  - Integrate Zoom API (OAuth)
  - Create meeting via platform
  - Auto-populate link to class schedule
  - Sync with calendar

#### FR-LIVE-003: Live Class Reminders

- **Priority:** P1
- **Description:** Reminder notifikasi sebelum kelas
- **Acceptance Criteria:**
  - Send in-app notification H-1 (24 hours before)
  - Send notification 1 hour before class
  - Highlight "Today's Class" card on dashboard

---

### 4.9 Forum Diskusi

#### FR-FORUM-001: Class Forum

- **Priority:** P1
- **Description:** Forum diskusi per kelas
- **Acceptance Criteria:**
  - Create discussion thread (siswa & tutor)
  - Reply to threads
  - Nested comments (1 level)
  - Sort by latest/oldest
  - Pin important threads (tutor only)

#### FR-FORUM-002: Moderation

- **Priority:** P2
- **Description:** Tutor can moderate forum
- **Acceptance Criteria:**
  - Delete inappropriate comments
  - Edit own posts
  - Mark as "Answered" (for Q&A threads)

---

### 4.10 Gradebook / Rapor

#### FR-GRADE-001: Auto-Calculate Grades

- **Priority:** P0
- **Description:** Sistem otomatis menghitung nilai
- **Acceptance Criteria:**
  - Aggregate scores from assignments, quizzes
  - Calculate weighted average (if configured)
  - Display total score and percentage

#### FR-GRADE-002: Student Gradebook View

- **Priority:** P0
- **Description:** Siswa lihat rapor sendiri
- **Acceptance Criteria:**
  - Display per-class grades
  - Show breakdown: assignments, quizzes, participation (future)
  - Display progress chart (line/bar graph)

#### FR-GRADE-003: Tutor Gradebook View

- **Priority:** P0
- **Description:** Tutor lihat nilai semua siswa di kelasnya
- **Acceptance Criteria:**
  - Table view: student names vs assignment/quiz columns
  - Export to Excel/CSV
  - Sort by name, score
  - Filter by assignment/quiz

---

### 4.11 Dashboard

#### FR-DASH-001: Student Dashboard

- **Priority:** P0
- **Description:** Halaman utama siswa
- **Components:**
  - Enrolled classes (card view)
  - Upcoming live classes (today & this week)
  - Pending assignments (due soon)
  - Recent quiz results
  - Notifications panel

#### FR-DASH-002: Tutor Dashboard

- **Priority:** P0
- **Description:** Halaman utama tutor
- **Components:**
  - Classes taught (card view)
  - Assignments to grade (pending count)
  - Upcoming live classes
  - Recent student activities

#### FR-DASH-003: Admin Dashboard

- **Priority:** P0
- **Description:** Halaman utama admin
- **Components:**
  - Total users (students, tutors)
  - Total revenue (this month)
  - Pending payments
  - Active classes
  - Recent enrollments

---

### 4.12 Notifications

#### FR-NOTIF-001: In-App Notifications

- **Priority:** P1
- **Description:** Real-time notifications di platform
- **Acceptance Criteria:**
  - Bell icon with unread count badge
  - Notification types: new assignment, quiz published, graded, payment success, live class reminder
  - Mark as read
  - Notification list (latest 50)

#### FR-NOTIF-002: Email Notifications

- **Priority:** P1
- **Description:** Email untuk event penting
- **Acceptance Criteria:**
  - Enrollment confirmation
  - Payment receipt
  - Assignment graded
  - Class reminder (H-1)

---

## 5. Non-Functional Requirements

### 5.1 Performance

- **NFR-PERF-001**: Page load time < 2 seconds on 4G connection
- **NFR-PERF-002**: API response time < 500ms for 95% of requests
- **NFR-PERF-003**: Support 500 concurrent users without degradation
- **NFR-PERF-004**: File upload progress indicator for files > 5MB

### 5.2 Security

- **NFR-SEC-001**: All API endpoints require authentication (JWT)
- **NFR-SEC-002**: Role-based access control (RBAC) enforced at middleware & database (RLS)
- **NFR-SEC-003**: File upload validation: type whitelist, size limit, malware scan
- **NFR-SEC-004**: Rate limiting: 100 req/min per user, 1000 req/min per IP
- **NFR-SEC-005**: Input sanitization for all user inputs (XSS prevention)
- **NFR-SEC-006**: HTTPS only, secure cookies, CSRF protection

### 5.3 Scalability

- **NFR-SCALE-001**: Horizontal scaling via serverless (Vercel)
- **NFR-SCALE-002**: Database connection pooling (Supabase/Prisma)
- **NFR-SCALE-003**: CDN for static assets (Vercel Edge Network)
- **NFR-SCALE-004**: Lazy loading for materials and images

### 5.4 Usability

- **NFR-USA-001**: Mobile-responsive design (min 375px viewport)
- **NFR-USA-002**: Accessible (WCAG 2.1 Level AA)
- **NFR-USA-003**: Support latest 2 versions of Chrome, Firefox, Safari, Edge
- **NFR-USA-004**: Maximum 3 clicks to reach any feature from dashboard

### 5.5 Reliability

- **NFR-REL-001**: 99.5% uptime SLA
- **NFR-REL-002**: Automated daily database backups (retention: 30 days)
- **NFR-REL-003**: Graceful error handling with user-friendly messages
- **NFR-REL-004**: Retry logic for payment webhook callbacks

### 5.6 Maintainability

- **NFR-MAIN-001**: Code coverage > 70% for critical paths
- **NFR-MAIN-002**: Comprehensive error logging (Sentry or similar)
- **NFR-MAIN-003**: API documentation (OpenAPI/Swagger)
- **NFR-MAIN-004**: Database migration versioning (Prisma Migrate)

---

## 6. User Stories

### 6.1 Student User Stories

**US-STU-001**: As a student, I want to browse available classes so that I can choose the right subject for me.

**US-STU-002**: As a student, I want to pay for class enrollment online so that I don't have to manually transfer and confirm with admin.

**US-STU-003**: As a student, I want to see all my class materials in one place so that I don't have to search through WhatsApp or Google Drive.

**US-STU-004**: As a student, I want to receive reminders for upcoming live classes so that I don't miss any sessions.

**US-STU-005**: As a student, I want to submit my assignments before the deadline so that I can get graded.

**US-STU-006**: As a student, I want to see my grades in real-time so that I can track my progress.

**US-STU-007**: As a student, I want to take quizzes online and see my score immediately so that I know where I stand.

### 6.2 Tutor User Stories

**US-TUT-001**: As a tutor, I want to upload learning materials organized by session so that students can follow the curriculum.

**US-TUT-002**: As a tutor, I want to create assignments with deadlines so that students complete them on time.

**US-TUT-003**: As a tutor, I want to grade assignments and provide feedback so that students can improve.

**US-TUT-004**: As a tutor, I want to create quizzes with auto-grading so that I save time on evaluation.

**US-TUT-005**: As a tutor, I want to see which students haven't submitted assignments so that I can follow up.

**US-TUT-006**: As a tutor, I want to schedule live classes and share links automatically so that students can join easily.

**US-TUT-007**: As a tutor, I want to see overall class performance so that I can adjust my teaching approach.

### 6.3 Admin User Stories

**US-ADM-001**: As an admin, I want to create classes and assign tutors so that the platform is up-to-date.

**US-ADM-002**: As an admin, I want to monitor payment status so that I can follow up on pending enrollments.

**US-ADM-003**: As an admin, I want to generate revenue reports so that I can track business performance.

**US-ADM-004**: As an admin, I want to manage user accounts (create, edit, deactivate) so that I have full control over the platform.

**US-ADM-005**: As an admin, I want to view audit logs so that I can track important actions for security and compliance.

---

## 7. Out of Scope (V1)

The following features are **NOT** included in the first version:

- **Video hosting**: Only embed YouTube/Vimeo (no self-hosted video)
- **Live streaming**: Only external Zoom/Meet links (no built-in live streaming)
- **Mobile app**: Web-only (responsive design)
- **Gamification**: No badges, points, leaderboards
- **Parent portal**: No separate parent view (future)
- **Advanced analytics**: Basic reports only
- **AI features**: No AI-powered recommendations or grading
- **Multi-language**: Indonesian only
- **Offline mode**: Internet required
- **Video conferencing built-in**: External links only

---

## 8. Technical Constraints

### 8.1 Technology Stack (Must Use)

- **Frontend**: Next.js 15+ App Router, React 19, TailwindCSS, Shadcn UI
- **Backend**: Next.js API Routes / Server Actions
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Payment**: Pakasir API
- **Deployment**: Vercel

### 8.2 Browser Support

- Chrome 100+
- Firefox 100+
- Safari 15+
- Edge 100+

### 8.3 External Dependencies

- Pakasir API for payments
- Supabase Cloud services
- Vercel hosting infrastructure

---

## 9. Assumptions & Dependencies

### 9.1 Assumptions

- Users have stable internet connection (min 4G/broadband)
- Students have email addresses for registration
- Tutors are computer-literate
- Admin has basic technical knowledge

### 9.2 Dependencies

- **Pakasir Account**: Active merchant account required
- **Supabase Project**: Free tier sufficient for MVP (upgrade for scale)
- **Vercel Account**: Pro plan for production deployment
- **Domain**: belajar.tutornomor1.com (or similar)

---

## 10. Risks & Mitigation

| Risk                        | Impact   | Probability | Mitigation                                                 |
| --------------------------- | -------- | ----------- | ---------------------------------------------------------- |
| Payment gateway downtime    | High     | Medium      | Implement retry logic, manual verification fallback        |
| File storage limit exceeded | Medium   | Low         | Monitor usage, implement compression, upgrade plan         |
| User adoption resistance    | High     | Medium      | Provide onboarding tutorial, in-person training for tutors |
| Security breach             | Critical | Low         | Regular security audits, implement all security NFRs       |
| Scalability issues          | Medium   | Low         | Load testing before launch, serverless architecture        |

---

## 11. Release Plan

### Phase 1: MVP (Month 1-2)

- Auth & user management
- Class catalog & enrollment
- Payment integration
- Basic dashboard

### Phase 2: Core Learning (Month 3-4)

- Materials upload/view
- Assignments create/submit/grade
- Quizzes
- Gradebook

### Phase 3: Engagement (Month 5-6)

- Live class integration
- Forum diskusi
- Notifications
- Analytics dashboard

---

## 12. Acceptance Criteria (MVP Launch)

**Platform is ready to launch when:**

- [ ] 100% of P0 features implemented and tested
- [ ] Security audit passed
- [ ] Load testing: 200 concurrent users without errors
- [ ] Payment flow tested with real transactions (test mode)
- [ ] At least 3 tutors onboarded and trained
- [ ] At least 20 beta students tested the platform
- [ ] All critical bugs resolved
- [ ] Documentation complete (user guide for students/tutors/admin)

---

## 13. Approval & Sign-off

| Role           | Name | Signature | Date |
| -------------- | ---- | --------- | ---- |
| Product Owner  | -    | -         | -    |
| Tech Lead      | -    | -         | -    |
| Business Owner | -    | -         | -    |

---

**Document End**
