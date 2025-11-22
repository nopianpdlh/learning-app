# Software Requirements Specification (SRS)

# Platform E-Learning Tutor Nomor Satu

**Version:** 1.0  
**Last Updated:** November 15, 2025  
**Prepared By:** Development Team  
**Document Status:** Draft

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document provides a complete description of all the functions and specifications of the E-Learning Platform for Tutor Nomor Satu. This document is intended for developers, project managers, testers, and stakeholders.

### 1.2 Scope

The E-Learning Platform is a web-based Learning Management System (LMS) that enables:

- **Students**: Browse classes, enroll with online payment, access materials, submit assignments, take quizzes, and track grades
- **Tutors**: Manage classes, upload materials, create assignments/quizzes, grade submissions, and interact with students
- **Admins**: Manage users, classes, monitor payments, and generate reports

**System Name**: Platform E-Learning Tutor Nomor Satu  
**System Type**: Web Application (SaaS)  
**Primary Users**: Students (100-1000+), Tutors (10-50), Admins (1-2)

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition                                        |
| ---- | ------------------------------------------------- |
| LMS  | Learning Management System                        |
| RBAC | Role-Based Access Control                         |
| RLS  | Row Level Security (database-level authorization) |
| JWT  | JSON Web Token (authentication)                   |
| API  | Application Programming Interface                 |
| CRUD | Create, Read, Update, Delete                      |
| SPA  | Single Page Application                           |
| SSR  | Server-Side Rendering                             |
| ORM  | Object-Relational Mapping                         |

### 1.4 References

- Product Requirements Document (PRD.md)
- Technical Architecture Document (TECHNICAL_ARCHITECTURE.md)
- Development Roadmap (ROADMAP.md)
- Next.js 15 Documentation: https://nextjs.org/docs
- Supabase Documentation: https://supabase.com/docs
- Prisma Documentation: https://www.prisma.io/docs

### 1.5 Overview

This SRS is organized into the following sections:

- Section 2: Overall Description (context, constraints, assumptions)
- Section 3: System Features (detailed functional requirements)
- Section 4: External Interface Requirements (UI, API, hardware)
- Section 5: Non-Functional Requirements (performance, security, etc.)
- Section 6: Other Requirements (legal, regulatory)

---

## 2. Overall Description

### 2.1 Product Perspective

The E-Learning Platform is a **standalone web application** that replaces fragmented manual processes (WhatsApp, Google Drive, Google Forms, Zoom) with a centralized system.

**System Context:**

```
┌──────────────┐
│   Students   │──┐
└──────────────┘  │
                  │    ┌─────────────────────┐
┌──────────────┐  ├───→│  E-Learning Platform│
│   Tutors     │──┤    │  (Web Application)  │
└──────────────┘  │    └─────────────────────┘
                  │              │
┌──────────────┐  │              ├──→ Supabase (Auth, DB, Storage)
│   Admins     │──┘              ├──→ Pakasir (Payment Gateway)
└──────────────┘                 ├──→ Zoom/Meet (External Live Class)
                                 └──→ Email Service (Notifications)
```

### 2.2 Product Functions

The platform provides the following major functions:

1. **User Management**

   - Registration, login, role assignment
   - Profile management

2. **Class Management**

   - Class catalog, enrollment, payment integration
   - Class scheduling

3. **Content Delivery**

   - Material upload and viewing
   - Video embedding

4. **Assessment**

   - Assignment submission and grading
   - Online quizzes with auto-grading

5. **Communication**

   - Forum discussions
   - In-app notifications

6. **Live Learning**

   - Live class scheduling (Zoom/Meet integration)
   - Reminders

7. **Progress Tracking**
   - Gradebook for students and tutors
   - Analytics dashboard

### 2.3 User Classes and Characteristics

#### 2.3.1 Student

- **Description**: End-user who enrolls in classes to learn
- **Technical Expertise**: Low to medium (basic computer literacy)
- **Frequency of Use**: Daily (during active enrollment)
- **Key Needs**: Easy access to materials, simple submission process, clear progress tracking

#### 2.3.2 Tutor

- **Description**: Instructor who teaches classes and creates content
- **Technical Expertise**: Medium (comfortable with file uploads, online tools)
- **Frequency of Use**: Daily (creating materials, grading)
- **Key Needs**: Efficient grading workflow, class management tools, student analytics

#### 2.3.3 Admin

- **Description**: Platform administrator who manages users and operations
- **Technical Expertise**: Medium to high
- **Frequency of Use**: Daily (monitoring, user management)
- **Key Needs**: Comprehensive dashboard, user management, payment tracking, audit logs

### 2.4 Operating Environment

- **Client-side**: Modern web browsers (Chrome 100+, Firefox 100+, Safari 15+, Edge 100+)
- **Server-side**: Vercel serverless infrastructure (Node.js 20 LTS)
- **Database**: Supabase PostgreSQL (Cloud-hosted)
- **Storage**: Supabase Storage (S3-compatible)
- **Network**: Requires internet connection (minimum 4G/broadband)

### 2.5 Design and Implementation Constraints

#### 2.5.1 Technology Constraints

- **Must use**: Next.js 15+ App Router (no Pages Router)
- **Must use**: Supabase for auth, database, and storage
- **Must use**: Pakasir for payment gateway
- **Must use**: Prisma ORM (no raw SQL for application logic)

#### 2.5.2 Regulatory Constraints

- **Data Privacy**: Comply with Indonesian data protection regulations (UU ITE)
- **Payment Security**: PCI DSS compliance via Pakasir (payment data not stored locally)
- **Age Verification**: Students under 13 require parental consent (optional enforcement)

#### 2.5.3 Business Constraints

- **Budget**: Limited budget for third-party services (utilize free tiers where possible)
- **Timeline**: MVP launch within 5 months
- **Scalability**: System must handle up to 1,000 concurrent users without degradation

### 2.6 Assumptions and Dependencies

#### 2.6.1 Assumptions

- Users have access to devices with web browsers (desktop or mobile)
- Users have email addresses for registration
- Internet connectivity is available during use
- Tutors are comfortable using online tools

#### 2.6.2 Dependencies

- **Supabase**: Platform relies on Supabase uptime and service availability
- **Pakasir**: Payment processing depends on Pakasir API availability
- **Vercel**: Hosting and deployment depend on Vercel infrastructure
- **External Meeting Tools**: Live class functionality depends on Zoom/Google Meet

---

## 3. System Features

### 3.1 Authentication and Authorization

#### 3.1.1 User Registration

**Priority**: P0 (Critical)  
**Description**: New users can create an account with email and password.

**Functional Requirements**:

- **FR-3.1.1.1**: System shall allow users to register with email and password
- **FR-3.1.1.2**: System shall validate email format (RFC 5322 compliant)
- **FR-3.1.1.3**: System shall enforce password requirements (min 8 characters, 1 uppercase, 1 number)
- **FR-3.1.1.4**: System shall send email verification link upon registration
- **FR-3.1.1.5**: System shall prevent registration with duplicate email
- **FR-3.1.1.6**: System shall create a user profile with role "STUDENT" by default
- **FR-3.1.1.7**: System shall store passwords securely using bcrypt hashing (via Supabase Auth)

**Input**: Email, password, name, phone (optional)  
**Output**: User account created, verification email sent  
**Preconditions**: None  
**Postconditions**: User exists in database with unverified status

#### 3.1.2 User Login

**Priority**: P0 (Critical)  
**Description**: Registered users can authenticate to access the platform.

**Functional Requirements**:

- **FR-3.1.2.1**: System shall authenticate users with email and password
- **FR-3.1.2.2**: System shall issue JWT access token upon successful authentication
- **FR-3.1.2.3**: System shall redirect users to role-specific dashboard after login
  - Admin → `/admin`
  - Tutor → `/tutor`
  - Student → `/student`
- **FR-3.1.2.4**: System shall implement "Remember Me" functionality (persistent session)
- **FR-3.1.2.5**: System shall lock account after 5 failed login attempts
- **FR-3.1.2.6**: System shall display error message for invalid credentials (generic message to prevent user enumeration)

**Input**: Email, password  
**Output**: JWT token, user profile data, redirect to dashboard  
**Preconditions**: User is registered and email is verified  
**Postconditions**: User is authenticated, session created

#### 3.1.3 Password Reset

**Priority**: P1 (High)  
**Description**: Users can reset forgotten password via email.

**Functional Requirements**:

- **FR-3.1.3.1**: System shall provide "Forgot Password" link on login page
- **FR-3.1.3.2**: System shall send password reset link to registered email
- **FR-3.1.3.3**: System shall expire reset link after 1 hour
- **FR-3.1.3.4**: System shall allow user to set new password via reset link
- **FR-3.1.3.5**: System shall invalidate old password upon successful reset

#### 3.1.4 Role-Based Access Control

**Priority**: P0 (Critical)  
**Description**: System enforces access control based on user role.

**Functional Requirements**:

- **FR-3.1.4.1**: System shall restrict access to admin routes (`/admin/*`) to users with ADMIN role
- **FR-3.1.4.2**: System shall restrict access to tutor routes (`/tutor/*`) to users with TUTOR or ADMIN role
- **FR-3.1.4.3**: System shall restrict access to student routes (`/student/*`) to authenticated users
- **FR-3.1.4.4**: System shall implement middleware to check role before rendering protected pages
- **FR-3.1.4.5**: System shall redirect unauthorized users to `/unauthorized` page

---

### 3.2 User Management (Admin)

#### 3.2.1 Create User

**Priority**: P0 (Critical)  
**Description**: Admin can create user accounts manually.

**Functional Requirements**:

- **FR-3.2.1.1**: Admin shall be able to create user with email, name, role, and temporary password
- **FR-3.2.1.2**: System shall send account creation email with login credentials
- **FR-3.2.1.3**: System shall force user to change password on first login
- **FR-3.2.1.4**: System shall validate email uniqueness before creation

#### 3.2.2 Edit User

**Priority**: P0 (Critical)  
**Description**: Admin can update user information.

**Functional Requirements**:

- **FR-3.2.2.1**: Admin shall be able to edit user name, email, phone, role
- **FR-3.2.2.2**: Admin shall be able to activate/deactivate user account
- **FR-3.2.2.3**: System shall log all user modifications in audit log

#### 3.2.3 Delete User

**Priority**: P1 (High)  
**Description**: Admin can delete user accounts.

**Functional Requirements**:

- **FR-3.2.3.1**: Admin shall be able to soft delete user (archive, not permanently remove)
- **FR-3.2.3.2**: System shall prevent deletion of user with active enrollments (must be transferred or cancelled first)
- **FR-3.2.3.3**: System shall display confirmation dialog before deletion

#### 3.2.4 Bulk Import Users

**Priority**: P2 (Medium)  
**Description**: Admin can import multiple users via CSV upload.

**Functional Requirements**:

- **FR-3.2.4.1**: Admin shall be able to upload CSV file with columns: email, name, role, phone
- **FR-3.2.4.2**: System shall validate CSV format and display errors before import
- **FR-3.2.4.3**: System shall create users in batch and send welcome emails
- **FR-3.2.4.4**: System shall provide import summary (success count, error count)

---

### 3.3 Class Management

#### 3.3.1 Create Class (Admin)

**Priority**: P0 (Critical)  
**Description**: Admin can create new class offerings.

**Functional Requirements**:

- **FR-3.3.1.1**: Admin shall input class title, description, subject, grade level, price, capacity, schedule, start/end date
- **FR-3.3.1.2**: Admin shall assign a tutor to the class
- **FR-3.3.1.3**: Admin shall set class as published or draft
- **FR-3.3.1.4**: System shall validate that tutor exists before assignment
- **FR-3.3.1.5**: System shall store class in database with all metadata

#### 3.3.2 Class Catalog (Public)

**Priority**: P0 (Critical)  
**Description**: Students can browse available classes.

**Functional Requirements**:

- **FR-3.3.2.1**: System shall display all published classes in catalog page
- **FR-3.3.2.2**: System shall show class title, description, tutor name, price, schedule, enrolled count
- **FR-3.3.2.3**: System shall provide search functionality (by title, subject)
- **FR-3.3.2.4**: System shall provide filters (subject, grade level, price range)
- **FR-3.3.2.5**: System shall paginate results (20 classes per page)
- **FR-3.3.2.6**: System shall display "Class Full" badge if enrolled count >= capacity

#### 3.3.3 Enroll in Class

**Priority**: P0 (Critical)  
**Description**: Students can enroll in available classes.

**Functional Requirements**:

- **FR-3.3.3.1**: Student shall click "Enroll" button on class detail page
- **FR-3.3.3.2**: System shall create enrollment record with status PENDING
- **FR-3.3.3.3**: System shall redirect student to payment page
- **FR-3.3.3.4**: System shall prevent duplicate enrollment (same student, same class)
- **FR-3.3.3.5**: System shall prevent enrollment if class is full (enrolled >= capacity)
- **FR-3.3.3.6**: System shall send enrollment confirmation email after payment success

---

### 3.4 Payment Integration

#### 3.4.1 Generate Payment

**Priority**: P0 (Critical)  
**Description**: System generates payment transaction via Pakasir API.

**Functional Requirements**:

- **FR-3.4.1.1**: System shall create payment record linked to enrollment
- **FR-3.4.1.2**: System shall call Pakasir API to create transaction (with amount, student info)
- **FR-3.4.1.3**: System shall receive payment URL from Pakasir
- **FR-3.4.1.4**: System shall redirect student to Pakasir payment page
- **FR-3.4.1.5**: System shall store Pakasir transaction ID (externalId) for tracking

#### 3.4.2 Payment Confirmation (Webhook)

**Priority**: P0 (Critical)  
**Description**: System receives payment confirmation from Pakasir webhook.

**Functional Requirements**:

- **FR-3.4.2.1**: System shall expose webhook endpoint `/api/payments/webhook`
- **FR-3.4.2.2**: System shall verify webhook signature (HMAC-SHA256) to prevent fraud
- **FR-3.4.2.3**: System shall update payment status to PAID upon successful webhook
- **FR-3.4.2.4**: System shall update enrollment status to PAID
- **FR-3.4.2.5**: System shall grant student access to class (add to class roster)
- **FR-3.4.2.6**: System shall send payment receipt email to student
- **FR-3.4.2.7**: System shall handle idempotency (ignore duplicate webhooks)

#### 3.4.3 Payment History

**Priority**: P1 (High)  
**Description**: Users can view payment history.

**Functional Requirements**:

- **FR-3.4.3.1**: Student shall view own payment history (all enrollments)
- **FR-3.4.3.2**: Admin shall view all payments with filters (date range, status, student)
- **FR-3.4.3.3**: System shall display payment date, amount, method, status, invoice link
- **FR-3.4.3.4**: System shall allow download of invoice PDF

---

### 3.5 Learning Materials

#### 3.5.1 Upload Material (Tutor)

**Priority**: P0 (Critical)  
**Description**: Tutor can upload learning materials for a class.

**Functional Requirements**:

- **FR-3.5.1.1**: Tutor shall upload files (PDF, DOCX, PPTX) up to 50MB per file
- **FR-3.5.1.2**: Tutor shall input material title, description, session number
- **FR-3.5.1.3**: Tutor shall optionally embed video URL (YouTube, Vimeo)
- **FR-3.5.1.4**: System shall validate file type (whitelist: PDF, DOCX, PPTX, JPG, PNG)
- **FR-3.5.1.5**: System shall upload file to Supabase Storage
- **FR-3.5.1.6**: System shall store file metadata (URL, size, name) in database
- **FR-3.5.1.7**: System shall display upload progress indicator for large files
- **FR-3.5.1.8**: Tutor shall publish/unpublish material

#### 3.5.2 View Materials (Student)

**Priority**: P0 (Critical)  
**Description**: Students can access materials for enrolled classes.

**Functional Requirements**:

- **FR-3.5.2.1**: Student shall view materials page for each enrolled class
- **FR-3.5.2.2**: System shall organize materials by session (Pertemuan 1, 2, 3...)
- **FR-3.5.2.3**: System shall display material title, description, file name, upload date
- **FR-3.5.2.4**: Student shall preview PDF files in-browser (iframe or PDF.js)
- **FR-3.5.2.5**: Student shall play embedded videos inline
- **FR-3.5.2.6**: Student shall download files
- **FR-3.5.2.7**: System shall restrict access to enrolled students only (enforce via RLS)

---

### 3.6 Assignments

#### 3.6.1 Create Assignment (Tutor)

**Priority**: P0 (Critical)  
**Description**: Tutor can create assignments for a class.

**Functional Requirements**:

- **FR-3.6.1.1**: Tutor shall input title, description (rich text), due date, max points
- **FR-3.6.1.2**: Tutor shall optionally attach reference files
- **FR-3.6.1.3**: Tutor shall set assignment status (draft or published)
- **FR-3.6.1.4**: System shall send notification to enrolled students upon publishing
- **FR-3.6.1.5**: System shall validate due date is in the future

#### 3.6.2 Submit Assignment (Student)

**Priority**: P0 (Critical)  
**Description**: Students can submit assignment files.

**Functional Requirements**:

- **FR-3.6.2.1**: Student shall view assignment details (instructions, due date, max points)
- **FR-3.6.2.2**: Student shall upload submission file (PDF, DOCX, JPG, max 20MB)
- **FR-3.6.2.3**: System shall validate file type and size
- **FR-3.6.2.4**: System shall display countdown timer to due date
- **FR-3.6.2.5**: System shall prevent submission after deadline (unless late submission enabled by tutor)
- **FR-3.6.2.6**: Student shall be able to overwrite previous submission before grading
- **FR-3.6.2.7**: System shall show submission confirmation message
- **FR-3.6.2.8**: System shall update submission status to SUBMITTED

#### 3.6.3 Grade Assignment (Tutor)

**Priority**: P0 (Critical)  
**Description**: Tutor can grade student submissions.

**Functional Requirements**:

- **FR-3.6.3.1**: Tutor shall view list of submissions for an assignment
- **FR-3.6.3.2**: Tutor shall view submitted file in-browser
- **FR-3.6.3.3**: Tutor shall input score (0 to max points)
- **FR-3.6.3.4**: Tutor shall provide text feedback (optional)
- **FR-3.6.3.5**: System shall update submission status to GRADED
- **FR-3.6.3.6**: System shall update gradebook with score
- **FR-3.6.3.7**: System shall send notification to student when graded

---

### 3.7 Quizzes

#### 3.7.1 Create Quiz (Tutor)

**Priority**: P0 (Critical)  
**Description**: Tutor can create online quizzes.

**Functional Requirements**:

- **FR-3.7.1.1**: Tutor shall input quiz title, description, time limit, max attempts
- **FR-3.7.1.2**: Tutor shall set availability period (start/end time)
- **FR-3.7.1.3**: Tutor shall set passing score (optional)
- **FR-3.7.1.4**: Tutor shall add questions with types: Multiple Choice, True/False, Short Answer
- **FR-3.7.1.5**: For MCQ: Tutor shall input question, 4 options (A, B, C, D), correct answer
- **FR-3.7.1.6**: For True/False: Tutor shall input question, correct answer (TRUE or FALSE)
- **FR-3.7.1.7**: For Short Answer: Tutor shall input question, expected answer (for manual grading)
- **FR-3.7.1.8**: Tutor shall set points per question
- **FR-3.7.1.9**: Tutor shall optionally add explanation for each question
- **FR-3.7.1.10**: Tutor shall reorder questions (drag-and-drop)
- **FR-3.7.1.11**: System shall store quiz in draft or published status

#### 3.7.2 Take Quiz (Student)

**Priority**: P0 (Critical)  
**Description**: Students can take published quizzes.

**Functional Requirements**:

- **FR-3.7.2.1**: Student shall view available quizzes for enrolled class
- **FR-3.7.2.2**: Student shall click "Start Quiz" to begin (creates QuizAttempt)
- **FR-3.7.2.3**: System shall display questions (all at once or one-by-one, configurable by tutor)
- **FR-3.7.2.4**: System shall display countdown timer (if time limit set)
- **FR-3.7.2.5**: Student shall select answer for each question
- **FR-3.7.2.6**: System shall auto-save answers in real-time (prevent data loss)
- **FR-3.7.2.7**: Student shall submit quiz manually or system auto-submits on timer expiry
- **FR-3.7.2.8**: System shall prevent starting quiz before start time or after end time
- **FR-3.7.2.9**: System shall prevent exceeding max attempts

#### 3.7.3 Quiz Results

**Priority**: P0 (Critical)  
**Description**: System displays quiz results to student.

**Functional Requirements**:

- **FR-3.7.3.1**: System shall auto-grade MCQ and True/False questions
- **FR-3.7.3.2**: System shall calculate total score and percentage
- **FR-3.7.3.3**: Student shall view score immediately after submission
- **FR-3.7.3.4**: Student shall view correct/incorrect answers (if enabled by tutor)
- **FR-3.7.3.5**: Student shall view explanations for each question (if provided)
- **FR-3.7.3.6**: System shall update gradebook with quiz score
- **FR-3.7.3.7**: Tutor shall manually grade Short Answer questions

---

### 3.8 Gradebook

#### 3.8.1 Student Gradebook

**Priority**: P0 (Critical)  
**Description**: Students can view their own grades.

**Functional Requirements**:

- **FR-3.8.1.1**: Student shall view grades for all enrolled classes
- **FR-3.8.1.2**: System shall display breakdown: assignments, quizzes
- **FR-3.8.1.3**: System shall calculate total score and percentage
- **FR-3.8.1.4**: System shall display progress chart (line graph showing improvement over time)
- **FR-3.8.1.5**: Student shall view feedback for graded assignments

#### 3.8.2 Tutor Gradebook

**Priority**: P0 (Critical)  
**Description**: Tutors can view grades for all students in their classes.

**Functional Requirements**:

- **FR-3.8.2.1**: Tutor shall view gradebook table (rows: students, columns: assignments/quizzes)
- **FR-3.8.2.2**: System shall display scores for each assessment
- **FR-3.8.2.3**: System shall calculate total/average per student
- **FR-3.8.2.4**: Tutor shall sort by student name or score
- **FR-3.8.2.5**: Tutor shall filter by specific assignment/quiz
- **FR-3.8.2.6**: Tutor shall export gradebook to Excel/CSV

---

### 3.9 Live Classes

#### 3.9.1 Schedule Live Class (Tutor)

**Priority**: P1 (High)  
**Description**: Tutor can schedule live class sessions.

**Functional Requirements**:

- **FR-3.9.1.1**: Tutor shall input meeting URL (Zoom/Google Meet link)
- **FR-3.9.1.2**: Tutor shall input scheduled date/time and duration
- **FR-3.9.1.3**: Tutor shall input class title (e.g., "Pertemuan 3: Integral")
- **FR-3.9.1.4**: System shall validate URL format
- **FR-3.9.1.5**: System shall store live class in database

#### 3.9.2 Join Live Class (Student)

**Priority**: P1 (High)  
**Description**: Students can join scheduled live classes.

**Functional Requirements**:

- **FR-3.9.2.1**: Student shall view upcoming live classes on dashboard
- **FR-3.9.2.2**: System shall display countdown to class start time
- **FR-3.9.2.3**: Student shall click "Join Class" button (opens meeting URL in new tab)
- **FR-3.9.2.4**: System shall highlight live class if scheduled today

#### 3.9.3 Live Class Reminders

**Priority**: P1 (High)  
**Description**: System sends reminders before live class starts.

**Functional Requirements**:

- **FR-3.9.3.1**: System shall send in-app notification H-1 (24 hours before class)
- **FR-3.9.3.2**: System shall send in-app notification 1 hour before class
- **FR-3.9.3.3**: System shall display "Class Starting Soon" card on dashboard

---

### 3.10 Forum Discussion

#### 3.10.1 Create Discussion Thread

**Priority**: P1 (High)  
**Description**: Students and tutors can create discussion threads.

**Functional Requirements**:

- **FR-3.10.1.1**: User shall create thread with title and initial post content
- **FR-3.10.1.2**: System shall associate thread with specific class
- **FR-3.10.1.3**: System shall display thread in class forum page

#### 3.10.2 Reply to Thread

**Priority**: P1 (High)  
**Description**: Users can reply to discussion threads.

**Functional Requirements**:

- **FR-3.10.2.1**: User shall reply to thread with text content
- **FR-3.10.2.2**: User shall optionally reply to specific post (nested reply, 1 level deep)
- **FR-3.10.2.3**: System shall display replies chronologically

#### 3.10.3 Forum Moderation (Tutor)

**Priority**: P2 (Medium)  
**Description**: Tutors can moderate forum discussions.

**Functional Requirements**:

- **FR-3.10.3.1**: Tutor shall pin important threads to top
- **FR-3.10.3.2**: Tutor shall lock threads (prevent new replies)
- **FR-3.10.3.3**: Tutor shall delete inappropriate posts
- **FR-3.10.3.4**: Tutor shall mark thread as "Answered" (for Q&A threads)

---

### 3.11 Notifications

#### 3.11.1 In-App Notifications

**Priority**: P1 (High)  
**Description**: Users receive real-time notifications within the platform.

**Functional Requirements**:

- **FR-3.11.1.1**: System shall display bell icon in header with unread count badge
- **FR-3.11.1.2**: User shall click bell to view notification dropdown
- **FR-3.11.1.3**: System shall display notification title, message, timestamp
- **FR-3.11.1.4**: User shall click notification to navigate to relevant page (e.g., graded assignment)
- **FR-3.11.1.5**: User shall mark notification as read
- **FR-3.11.1.6**: User shall mark all notifications as read
- **FR-3.11.1.7**: System shall display latest 50 notifications in dropdown
- **FR-3.11.1.8**: System shall use Supabase Realtime to push notifications instantly

**Notification Types**:

- NEW_MATERIAL: "New material uploaded: [Title]"
- NEW_ASSIGNMENT: "New assignment posted: [Title]"
- ASSIGNMENT_GRADED: "Your assignment has been graded"
- NEW_QUIZ: "New quiz available: [Title]"
- LIVE_CLASS_REMINDER: "Live class starts in 1 hour"
- PAYMENT_SUCCESS: "Payment confirmed for [Class]"

#### 3.11.2 Email Notifications (Optional)

**Priority**: P2 (Medium)  
**Description**: System sends email notifications for critical events.

**Functional Requirements**:

- **FR-3.11.2.1**: System shall send email upon enrollment confirmation
- **FR-3.11.2.2**: System shall send email upon payment success (receipt)
- **FR-3.11.2.3**: System shall send email when assignment is graded
- **FR-3.11.2.4**: System shall send email reminder H-1 before live class

---

### 3.12 Admin Dashboard & Reports

#### 3.12.1 Admin Dashboard

**Priority**: P0 (Critical)  
**Description**: Admin can view platform overview and metrics.

**Functional Requirements**:

- **FR-3.12.1.1**: Dashboard shall display total users (students, tutors, admins)
- **FR-3.12.1.2**: Dashboard shall display total revenue (this month, all time)
- **FR-3.12.1.3**: Dashboard shall display pending payments count
- **FR-3.12.1.4**: Dashboard shall display active classes count
- **FR-3.12.1.5**: Dashboard shall display recent enrollments table (latest 10)

#### 3.12.2 Audit Logs

**Priority**: P2 (Medium)  
**Description**: Admin can view audit logs for security and compliance.

**Functional Requirements**:

- **FR-3.12.2.1**: System shall log all admin actions (create user, delete class, update payment, etc.)
- **FR-3.12.2.2**: Admin shall view audit log table with filters (action, date range, user)
- **FR-3.12.2.3**: System shall store action, timestamp, user ID, entity type, entity ID, metadata

---

## 4. External Interface Requirements

### 4.1 User Interfaces

#### 4.1.1 General UI Requirements

- **REQ-UI-001**: All pages shall be responsive (mobile-first design, min viewport 375px)
- **REQ-UI-002**: UI shall follow Holy Grail layout for dashboard pages (header, sidebar, main content, footer)
- **REQ-UI-003**: UI shall use consistent color scheme (primary: #2563EB blue-600, secondary: #38BDF8 sky-400)
- **REQ-UI-004**: UI shall use Shadcn UI components for consistency
- **REQ-UI-005**: All forms shall display inline validation errors
- **REQ-UI-006**: Loading states shall display skeleton loaders or spinners
- **REQ-UI-007**: UI shall be accessible (WCAG 2.1 Level AA)

#### 4.1.2 Key Pages

1. **Login Page**: Email/password form, "Forgot Password" link, "Register" link
2. **Register Page**: Email, password, name, phone (optional), role (auto: STUDENT)
3. **Student Dashboard**: Enrolled classes, upcoming live classes, pending assignments, notifications
4. **Tutor Dashboard**: Classes taught, assignments to grade, upcoming live classes
5. **Admin Dashboard**: Metrics (users, revenue, pending payments), recent enrollments
6. **Class Catalog**: Grid of class cards with filters and search
7. **Class Detail**: Full description, tutor info, schedule, price, "Enroll" button
8. **Materials Page**: Accordion/tabs by session, file preview, download buttons
9. **Assignment Detail (Student)**: Instructions, due date, upload form, submission status
10. **Assignment Grading (Tutor)**: Submission list, file viewer, score input, feedback textarea
11. **Quiz Taking Page**: Questions display, timer, submit button
12. **Quiz Results**: Score, correct/incorrect answers, explanations
13. **Gradebook (Student)**: Table of grades, progress chart
14. **Gradebook (Tutor)**: Table (students x assignments), export button
15. **Forum Page**: Thread list, create thread button, search
16. **Thread Detail**: Posts, reply form, nested replies

### 4.2 Hardware Interfaces

- **REQ-HW-001**: System shall be accessible from any device with a modern web browser (desktop, laptop, tablet, smartphone)
- **REQ-HW-002**: No specific hardware requirements beyond standard input devices (keyboard, mouse, touchscreen)

### 4.3 Software Interfaces

#### 4.3.1 Supabase PostgreSQL

- **REQ-SW-001**: System shall use Supabase PostgreSQL for all relational data storage
- **REQ-SW-002**: System shall use Prisma ORM to interact with database
- **REQ-SW-003**: System shall enforce Row Level Security (RLS) policies in database

#### 4.3.2 Supabase Auth

- **REQ-SW-004**: System shall use Supabase Auth for authentication (JWT-based)
- **REQ-SW-005**: System shall store user auth data in Supabase `auth.users` table

#### 4.3.3 Supabase Storage

- **REQ-SW-006**: System shall use Supabase Storage for all file uploads (materials, submissions, profile pictures)
- **REQ-SW-007**: System shall organize files in buckets: `materials/`, `submissions/`, `profiles/`

#### 4.3.4 Pakasir Payment API

- **REQ-SW-008**: System shall integrate with Pakasir API for payment processing
- **REQ-SW-009**: System shall use Pakasir webhook for payment confirmation
- **REQ-SW-010**: System shall verify webhook signature (HMAC-SHA256) for security

#### 4.3.5 Email Service

- **REQ-SW-011**: System shall send emails via Supabase built-in email or external service (Resend)
- **REQ-SW-012**: Emails shall include: enrollment confirmation, payment receipt, password reset, notifications

#### 4.3.6 External Meeting Tools

- **REQ-SW-013**: System shall support manual input of Zoom and Google Meet URLs
- **REQ-SW-014**: (Future) System may integrate Zoom API for auto-generating meeting links

### 4.4 Communication Interfaces

#### 4.4.1 HTTP/HTTPS

- **REQ-COM-001**: All communication between client and server shall use HTTPS (TLS 1.2+)
- **REQ-COM-002**: API endpoints shall follow RESTful conventions
- **REQ-COM-003**: API responses shall use JSON format

#### 4.4.2 WebSockets (Supabase Realtime)

- **REQ-COM-004**: System shall use WebSocket connection for real-time notifications (Supabase Realtime)

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

- **NFR-PERF-001**: Page load time shall be < 2 seconds on 4G connection
- **NFR-PERF-002**: API response time shall be < 500ms for 95% of requests
- **NFR-PERF-003**: System shall support 500 concurrent users without performance degradation
- **NFR-PERF-004**: File upload shall display progress indicator for files > 5MB
- **NFR-PERF-005**: Database queries shall be optimized with proper indexing
- **NFR-PERF-006**: Images shall be lazy-loaded below the fold

### 5.2 Security Requirements

- **NFR-SEC-001**: All API endpoints shall require authentication (JWT)
- **NFR-SEC-002**: Role-based access control (RBAC) shall be enforced at middleware and database level (RLS)
- **NFR-SEC-003**: Passwords shall be hashed using bcrypt (via Supabase Auth)
- **NFR-SEC-004**: File uploads shall be validated (type whitelist, size limit, malware scan optional)
- **NFR-SEC-005**: Rate limiting shall be implemented (100 req/min per user, 1000 req/min per IP)
- **NFR-SEC-006**: Input sanitization shall prevent XSS attacks
- **NFR-SEC-007**: HTTPS shall be enforced (redirect HTTP to HTTPS)
- **NFR-SEC-008**: Cookies shall be httpOnly and secure
- **NFR-SEC-009**: CSRF protection shall be enabled (Next.js built-in)
- **NFR-SEC-010**: Webhook signatures shall be verified (Pakasir HMAC-SHA256)

### 5.3 Reliability Requirements

- **NFR-REL-001**: System shall have 99.5% uptime SLA
- **NFR-REL-002**: Database shall be backed up daily (automated, 30-day retention)
- **NFR-REL-003**: System shall handle errors gracefully with user-friendly messages
- **NFR-REL-004**: Payment webhook shall implement retry logic (exponential backoff)

### 5.4 Availability Requirements

- **NFR-AVA-001**: System shall be available 24/7 except planned maintenance (notified 48h in advance)
- **NFR-AVA-002**: Planned maintenance shall occur during low-traffic hours (2 AM - 5 AM)

### 5.5 Maintainability Requirements

- **NFR-MAIN-001**: Code shall follow consistent style guide (ESLint + Prettier)
- **NFR-MAIN-002**: Test coverage shall be > 70% for critical paths
- **NFR-MAIN-003**: API shall have documentation (OpenAPI/Swagger)
- **NFR-MAIN-004**: Database migrations shall be versioned (Prisma Migrate)
- **NFR-MAIN-005**: Error logging shall be comprehensive (Sentry or console logs)

### 5.6 Portability Requirements

- **NFR-PORT-001**: System shall be browser-agnostic (support Chrome, Firefox, Safari, Edge)
- **NFR-PORT-002**: System shall be deployable on Vercel platform
- **NFR-PORT-003**: Database shall be portable (can migrate to other PostgreSQL providers)

### 5.7 Usability Requirements

- **NFR-USA-001**: UI shall be intuitive (max 3 clicks to any feature from dashboard)
- **NFR-USA-002**: System shall provide onboarding tutorial for new users
- **NFR-USA-003**: Error messages shall be clear and actionable
- **NFR-USA-004**: Forms shall provide inline validation with helpful hints

### 5.8 Scalability Requirements

- **NFR-SCALE-001**: System shall horizontally scale via serverless functions (Vercel)
- **NFR-SCALE-002**: Database shall use connection pooling (Supabase/Prisma)
- **NFR-SCALE-003**: Static assets shall be served via CDN (Vercel Edge Network)
- **NFR-SCALE-004**: System shall support up to 10,000 users (with infrastructure upgrades)

---

## 6. Other Requirements

### 6.1 Legal Requirements

- **REQ-LEGAL-001**: System shall comply with Indonesian data protection laws (UU ITE No. 11/2008)
- **REQ-LEGAL-002**: System shall not store payment card data (PCI DSS compliance via Pakasir)
- **REQ-LEGAL-003**: System shall display Terms of Service and Privacy Policy (users must accept on registration)

### 6.2 Regulatory Requirements

- **REQ-REG-001**: System shall allow users to request data deletion (GDPR-like right to be forgotten)
- **REQ-REG-002**: System shall allow users to export their data (data portability)

### 6.3 Business Rules

- **BR-001**: Only enrolled students can access class materials, assignments, and quizzes
- **BR-002**: Students cannot enroll if class is full (enrolled count >= capacity)
- **BR-003**: Enrollment is pending until payment is confirmed
- **BR-004**: Late assignment submissions are not allowed unless tutor enables it
- **BR-005**: Quiz cannot be started before start time or after end time
- **BR-006**: Tutor can only manage classes assigned to them (except admin has full access)
- **BR-007**: Gradebook automatically updates when assignments/quizzes are graded

---

## 7. Appendix

### 7.1 Glossary

| Term       | Definition                                                                       |
| ---------- | -------------------------------------------------------------------------------- |
| Enrollment | The act of a student registering for a class (requires payment)                  |
| Material   | Learning resource (PDF, video, etc.) uploaded by tutor                           |
| Assignment | Task assigned by tutor, requiring student submission                             |
| Quiz       | Online test with auto-grading (MCQ, True/False) or manual grading (Short Answer) |
| Gradebook  | Aggregate view of all grades for assignments and quizzes                         |
| Live Class | Synchronous online class via Zoom/Google Meet                                    |
| Forum      | Asynchronous discussion board for class communication                            |

### 7.2 Analysis Models

See UML diagrams in separate document (UML_DIAGRAMS.md)

### 7.3 Issues List

_To be tracked during development_

---

**Document Approval**

| Role          | Name | Signature | Date |
| ------------- | ---- | --------- | ---- |
| Product Owner | -    | -         | -    |
| Tech Lead     | -    | -         | -    |
| QA Lead       | -    | -         | -    |

---

**Document End**
