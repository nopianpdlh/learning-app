# Development Roadmap

# Platform E-Learning Tutor Nomor Satu

**Version:** 1.0  
**Last Updated:** November 15, 2025  
**Timeline:** 6 Months to MVP + Full Feature Set

---

## Overview

This roadmap outlines the development timeline for the E-Learning platform from initial setup to full production launch. Development is divided into 6 phases over 6 months.

---

## Phase 1: Foundation & Setup (Week 1-2)

### Goals

- Project setup and infrastructure configuration
- Database schema finalization
- Authentication system

### Tasks

#### Week 1: Project Initialization

- [x] Create Next.js 15 project with App Router
- [x] Setup TailwindCSS 4 + Shadcn UI
- [x] Configure TypeScript, ESLint, Prettier
- [x] Setup Git repository
- [x] Create Vercel project (staging + production)
- [ ] Setup Supabase project
  - [ ] Create PostgreSQL database
  - [ ] Configure authentication
  - [ ] Setup storage buckets
- [ ] Initialize Prisma
  - [ ] Define schema
  - [ ] Run initial migration
  - [ ] Setup Prisma Client

#### Week 2: Authentication & User Management

- [ ] Implement Supabase Auth integration
  - [ ] Email/password registration
  - [ ] Login with JWT
  - [ ] Email verification (OTP)
  - [ ] Password reset flow
- [ ] Create user roles (Admin, Tutor, Student)
- [ ] Implement role-based middleware
- [ ] Create user profile pages
- [ ] Admin: User management CRUD
  - [ ] List users with filters
  - [ ] Create/edit/delete users
  - [ ] Bulk import via CSV

### Deliverables

- ✅ Working authentication system
- ✅ Role-based access control
- ✅ Admin panel for user management
- ✅ Database deployed and migrated

### Success Metrics

- [ ] Users can register and login
- [ ] Admin can create users with roles
- [ ] Middleware correctly restricts access by role

---

## Phase 2: Class Management & Payment (Week 3-5)

### Goals

- Class catalog and enrollment system
- Payment gateway integration
- Basic dashboards for all roles

### Tasks

#### Week 3: Class Management

- [ ] Database models for Class, Enrollment
- [ ] Admin: Create/Edit/Delete classes
  - [ ] Class form with all fields (title, description, tutor, price, schedule, capacity)
  - [ ] Publish/unpublish toggle
  - [ ] Assign tutor to class
- [ ] Public: Class catalog page
  - [ ] Display published classes
  - [ ] Search and filter (subject, grade, price)
  - [ ] Class detail page
- [ ] Student: Enroll in class (pre-payment)
  - [ ] Enrollment flow (select class → create enrollment with PENDING status)

#### Week 4: Payment Integration (Pakasir)

- [ ] Setup Pakasir merchant account
- [ ] Implement payment API integration
  - [ ] Create payment transaction
  - [ ] Generate payment URL (QRIS, VA, E-Wallet)
  - [ ] Redirect student to payment page
- [ ] Webhook endpoint for payment confirmation
  - [ ] Verify webhook signature
  - [ ] Update enrollment status to PAID
  - [ ] Grant class access
  - [ ] Send confirmation email
- [ ] Payment history page (student + admin)
  - [ ] List all payments
  - [ ] Download invoice PDF

#### Week 5: Dashboards

- [ ] Student Dashboard
  - [ ] "My Classes" section (enrolled classes)
  - [ ] Upcoming live classes widget
  - [ ] Pending assignments widget
  - [ ] Recent notifications
- [ ] Tutor Dashboard
  - [ ] Classes taught
  - [ ] Assignments to grade (count)
  - [ ] Upcoming live classes
  - [ ] Recent student activities
- [ ] Admin Dashboard
  - [ ] Total users (students, tutors)
  - [ ] Revenue summary (this month, all time)
  - [ ] Pending payments
  - [ ] Active classes
  - [ ] Recent enrollments table

### Deliverables

- ✅ Functional class catalog
- ✅ End-to-end enrollment + payment flow
- ✅ Role-specific dashboards

### Success Metrics

- [ ] Student can browse, enroll, and pay for class
- [ ] Payment webhook correctly updates enrollment status
- [ ] Dashboards display real-time data

---

## Phase 3: Learning Materials (Week 6-7)

### Goals

- Material upload and management system
- Student material viewing interface

### Tasks

#### Week 6: Material Upload (Tutor)

- [ ] Database model for Material
- [ ] File upload to Supabase Storage
  - [ ] Support PDF, DOCX, PPTX (max 50MB)
  - [ ] File validation (type, size)
  - [ ] Progress indicator for large files
- [ ] Create material form
  - [ ] Title, description, session number, file upload
  - [ ] YouTube/Vimeo embed support (video URL)
  - [ ] Publish toggle
- [ ] Material management page
  - [ ] List materials per class
  - [ ] Edit/delete materials
  - [ ] Sort by session number
  - [ ] Drag-and-drop reordering

#### Week 7: Material Viewing (Student)

- [ ] Class materials page (student view)
  - [ ] Display materials organized by session (Pertemuan 1, 2, 3...)
  - [ ] Accordion or tabs UI
  - [ ] PDF preview in-browser (iframe or PDF.js)
  - [ ] Video embed player
  - [ ] Download button for files
- [ ] Material access control
  - [ ] Only enrolled students can access
  - [ ] Middleware/RLS check

### Deliverables

- ✅ Tutor can upload materials (files + videos)
- ✅ Student can view and download materials

### Success Metrics

- [ ] Tutor successfully uploads 10MB PDF
- [ ] Student sees materials organized by session
- [ ] Video embeds play correctly

---

## Phase 4: Assignments & Grading (Week 8-10)

### Goals

- Assignment creation and submission system
- Grading interface for tutors
- Gradebook

### Tasks

#### Week 8: Assignment Creation

- [ ] Database models for Assignment, AssignmentSubmission
- [ ] Tutor: Create assignment form
  - [ ] Title, description (rich text editor - Tiptap)
  - [ ] Due date & time picker
  - [ ] Max points
  - [ ] Attach reference file (optional)
  - [ ] Publish/draft toggle
- [ ] Assignment management
  - [ ] List assignments per class
  - [ ] Edit/delete assignments
  - [ ] View submission count

#### Week 9: Assignment Submission (Student)

- [ ] Student: View assignments
  - [ ] List all assignments (upcoming, past due)
  - [ ] Assignment detail page
  - [ ] Countdown timer to deadline
- [ ] Submit assignment
  - [ ] File upload (PDF, DOCX, JPG, max 20MB)
  - [ ] Prevent submission after deadline (unless late allowed)
  - [ ] Overwrite previous submission (re-submit)
  - [ ] Submission confirmation message
- [ ] View submission status
  - [ ] "Submitted" vs "Not Submitted"
  - [ ] Show score if graded

#### Week 10: Grading & Gradebook

- [ ] Tutor: Grading interface
  - [ ] List all submissions for an assignment
  - [ ] View submitted file in-browser
  - [ ] Input score (0 - max points)
  - [ ] Provide text feedback
  - [ ] Save grade → auto-update gradebook
- [ ] Gradebook (Tutor view)
  - [ ] Table: students (rows) x assignments (columns)
  - [ ] Display scores
  - [ ] Calculate total/average
  - [ ] Export to Excel/CSV
- [ ] Gradebook (Student view)
  - [ ] Display all grades (assignments, quizzes)
  - [ ] Show total score and percentage
  - [ ] Progress chart (line graph)

### Deliverables

- ✅ Complete assignment workflow (create → submit → grade)
- ✅ Functional gradebook for tutor and student

### Success Metrics

- [ ] Tutor creates assignment with due date
- [ ] Student submits before deadline
- [ ] Tutor grades submission, student sees score
- [ ] Gradebook correctly calculates totals

---

## Phase 5: Quizzes (Week 11-12)

### Goals

- Online quiz system with auto-grading
- Multiple question types (MCQ, True/False, Short Answer)

### Tasks

#### Week 11: Quiz Creation

- [ ] Database models for Quiz, QuizQuestion, QuizAttempt, QuizAnswer
- [ ] Tutor: Create quiz form
  - [ ] Title, description
  - [ ] Time limit (minutes)
  - [ ] Max attempts
  - [ ] Start/end time (availability period)
  - [ ] Passing score (optional)
- [ ] Add questions
  - [ ] Question text (rich text)
  - [ ] Question type: Multiple Choice, True/False, Short Answer
  - [ ] Options (for MCQ)
  - [ ] Correct answer
  - [ ] Points per question
  - [ ] Explanation (shown after submission)
  - [ ] Reorder questions (drag-and-drop)
- [ ] Publish/draft toggle

#### Week 12: Taking Quizzes & Results

- [ ] Student: View available quizzes
  - [ ] List quizzes (available, upcoming, past)
  - [ ] Quiz detail page (without answers)
- [ ] Take quiz
  - [ ] Start quiz → create QuizAttempt
  - [ ] Display questions one-by-one or all at once (configurable)
  - [ ] Countdown timer (auto-submit on expiry)
  - [ ] Save answers in real-time (prevent data loss)
  - [ ] Submit quiz
- [ ] Auto-grading
  - [ ] For MCQ & True/False: instant grading
  - [ ] Calculate score and percentage
  - [ ] Store in QuizAttempt
- [ ] Quiz results page
  - [ ] Show score, correct/incorrect answers
  - [ ] Show explanations (if enabled by tutor)
  - [ ] Update gradebook
- [ ] Tutor: View quiz results
  - [ ] List all attempts per quiz
  - [ ] View individual student attempt (for manual grading of short answers)

### Deliverables

- ✅ Full quiz creation and taking workflow
- ✅ Auto-grading for MCQ/True-False
- ✅ Quiz results integrated with gradebook

### Success Metrics

- [ ] Tutor creates 10-question MCQ quiz
- [ ] Student completes quiz within time limit
- [ ] Student sees score immediately after submission
- [ ] Gradebook reflects quiz score

---

## Phase 6: Live Classes, Forum & Notifications (Week 13-16)

### Goals

- Live class scheduling and reminders
- Forum discussion system
- Real-time notifications

### Tasks

#### Week 13: Live Class Integration

- [ ] Database model for LiveClass
- [ ] Tutor: Schedule live class
  - [ ] Manual link input (Zoom/Meet URL)
  - [ ] Scheduled date/time, duration
  - [ ] Save to database
- [ ] Student: View live class schedule
  - [ ] "Upcoming Live Classes" widget on dashboard
  - [ ] Countdown to class start
  - [ ] "Join Class" button (opens meeting URL)
- [ ] Reminder system
  - [ ] Background job (cron) to check upcoming classes
  - [ ] Send in-app notification H-1 (24 hours before)
  - [ ] Send notification 1 hour before
  - [ ] Highlight "Today's Class" on dashboard
- [ ] (Future enhancement): Zoom API auto-generation
  - [ ] OAuth setup
  - [ ] Create meeting via API
  - [ ] Auto-populate link

#### Week 14: Forum Discussion

- [ ] Database models for ForumThread, ForumPost
- [ ] Class forum page
  - [ ] List discussion threads
  - [ ] Create new thread (title + initial post)
  - [ ] Pin/lock threads (tutor only)
- [ ] Thread detail page
  - [ ] Display all posts
  - [ ] Nested replies (1 level deep)
  - [ ] Reply to thread/post
  - [ ] Edit own posts
  - [ ] Delete posts (author or tutor)
- [ ] Moderation (tutor)
  - [ ] Mark thread as "Answered"
  - [ ] Delete inappropriate posts
  - [ ] Pin important threads to top

#### Week 15: Notifications

- [ ] Database model for Notification
- [ ] Notification types
  - [ ] NEW_MATERIAL: "Tutor uploaded new material for [Class]"
  - [ ] NEW_ASSIGNMENT: "New assignment posted: [Title]"
  - [ ] ASSIGNMENT_GRADED: "Your assignment has been graded"
  - [ ] NEW_QUIZ: "New quiz available: [Title]"
  - [ ] LIVE_CLASS_REMINDER: "Class starts in 1 hour"
  - [ ] PAYMENT_SUCCESS: "Payment confirmed for [Class]"
- [ ] In-app notifications
  - [ ] Bell icon in header with unread count badge
  - [ ] Notification dropdown list
  - [ ] Mark as read
  - [ ] Click to navigate to relevant page
- [ ] Real-time notifications (Supabase Realtime)
  - [ ] Subscribe to notification channel
  - [ ] Push notification to user when created
- [ ] Email notifications (optional)
  - [ ] Send email for critical events (payment success, graded, class reminder)
  - [ ] Use Supabase email or integrate Resend

#### Week 16: Polish & Bug Fixes

- [ ] UI/UX refinements
  - [ ] Consistent spacing, colors, typography
  - [ ] Mobile responsiveness check (all pages)
  - [ ] Accessibility audit (keyboard navigation, ARIA labels)
- [ ] Performance optimization
  - [ ] Lazy load images below fold
  - [ ] Code splitting for heavy components
  - [ ] Database query optimization (add indexes)
  - [ ] Implement caching where applicable
- [ ] Bug fixes
  - [ ] Fix reported bugs from beta testing
  - [ ] Edge case handling
  - [ ] Error messages improvement
- [ ] Testing
  - [ ] Write integration tests for critical flows
  - [ ] E2E tests with Playwright
  - [ ] Load testing (simulate 100 concurrent users)

### Deliverables

- ✅ Live class scheduling and reminders
- ✅ Forum discussion system
- ✅ Real-time in-app notifications
- ✅ Polished, production-ready platform

### Success Metrics

- [ ] Student receives live class reminder and joins via dashboard
- [ ] Users can create and reply to forum threads
- [ ] Notifications appear in real-time
- [ ] No critical bugs remaining

---

## Phase 7: Beta Testing & Launch Prep (Week 17-20)

### Goals

- Beta testing with real users
- Gather feedback and iterate
- Prepare for production launch

### Tasks

#### Week 17-18: Beta Testing

- [ ] Recruit beta testers
  - [ ] 3-5 tutors
  - [ ] 20-30 students
  - [ ] 1 admin
- [ ] Onboarding
  - [ ] Create user guides (PDF/video)
  - [ ] Host onboarding session (Zoom walkthrough)
- [ ] Beta testing period (2 weeks)
  - [ ] Users complete real workflows (enroll, pay, submit assignments, etc.)
  - [ ] Collect feedback via form
  - [ ] Monitor error logs (Sentry)
  - [ ] Track usage analytics (Vercel)
- [ ] Iterate based on feedback
  - [ ] Fix bugs
  - [ ] Improve UX based on feedback
  - [ ] Add small feature requests (if feasible)

#### Week 19: Documentation & Training

- [ ] User documentation
  - [ ] Student guide (how to enroll, submit assignments, take quizzes)
  - [ ] Tutor guide (how to create materials, grade assignments, manage classes)
  - [ ] Admin guide (how to manage users, classes, payments)
  - [ ] FAQ page
- [ ] Video tutorials
  - [ ] Screen recordings for key workflows
  - [ ] Upload to YouTube (unlisted)
  - [ ] Embed in help section
- [ ] Training sessions
  - [ ] Host live training for tutors and admin
  - [ ] Q&A session

#### Week 20: Production Launch

- [ ] Final pre-launch checklist
  - [ ] Security audit (penetration testing, OWASP Top 10 check)
  - [ ] Performance audit (Lighthouse score > 90)
  - [ ] Database backup verified
  - [ ] Payment gateway in production mode (real transactions)
  - [ ] Domain setup (belajar.tutornomor1.com)
  - [ ] SSL certificate active
  - [ ] All environment variables configured in Vercel
- [ ] Soft launch
  - [ ] Open to existing students (limited scale)
  - [ ] Monitor for 1 week
- [ ] Full launch
  - [ ] Announce to all students
  - [ ] Social media / email marketing campaign
  - [ ] Monitor traffic, errors, performance

### Deliverables

- ✅ Beta testing complete with feedback incorporated
- ✅ User documentation and training materials
- ✅ Production-ready platform launched

### Success Metrics

- [ ] 80% of beta testers successfully complete key workflows
- [ ] No critical bugs reported in beta
- [ ] Lighthouse performance score > 90
- [ ] Successful launch with zero downtime

---

## Post-Launch: Iteration & Feature Enhancements (Month 6+)

### Short-term Enhancements (1-3 months post-launch)

- [ ] **Analytics Dashboard (Admin)**
  - Revenue trends (monthly, yearly)
  - User growth chart
  - Class popularity metrics
  - Assignment submission rates
- [ ] **Parent Portal**
  - Parents can view student's grades and progress
  - Receive notifications about student activity
- [ ] **Advanced Gradebook Features**
  - Weighted grading (assignments 60%, quizzes 40%)
  - Letter grade calculation (A, B, C, D, E)
  - Grade distribution chart
- [ ] **Attendance Tracking**
  - Mark attendance for live classes
  - Attendance report for admin/tutor
- [ ] **Certificate Generation**
  - Auto-generate completion certificate (PDF) when class ends
  - Download/email certificate to student

### Medium-term Enhancements (3-6 months post-launch)

- [ ] **Zoom API Auto-Generation**
  - OAuth integration
  - Create Zoom meetings via platform
  - Auto-populate meeting links
- [ ] **Mobile App (React Native or PWA)**
  - Native iOS/Android app
  - Push notifications
  - Offline mode for downloaded materials
- [ ] **Gamification**
  - Badges for achievements (first submission, perfect quiz score)
  - Leaderboard per class
  - Points system
- [ ] **AI-Powered Features**
  - Quiz question generation (AI-assisted)
  - Automated grading for short answer questions (NLP)
  - Personalized learning recommendations

### Long-term Vision (6-12 months post-launch)

- [ ] **Multi-language Support**
  - English, Indonesian
  - i18n implementation
- [ ] **Live Streaming (Built-in)**
  - Replace Zoom with in-platform video conferencing
  - Use WebRTC or integrate with Agora/Twilio
- [ ] **Content Marketplace**
  - Tutors can sell courses to external students
  - Revenue sharing model
- [ ] **Advanced Analytics (AI/ML)**
  - Predict at-risk students (low engagement, poor grades)
  - Recommend interventions for tutors

---

## Milestones Summary

| Phase   | Duration   | Key Milestone                      | Completion Date (Estimate) |
| ------- | ---------- | ---------------------------------- | -------------------------- |
| Phase 1 | Week 1-2   | Authentication & User Management   | Week 2                     |
| Phase 2 | Week 3-5   | Class Management & Payment         | Week 5                     |
| Phase 3 | Week 6-7   | Learning Materials                 | Week 7                     |
| Phase 4 | Week 8-10  | Assignments & Grading              | Week 10                    |
| Phase 5 | Week 11-12 | Quizzes                            | Week 12                    |
| Phase 6 | Week 13-16 | Live Classes, Forum, Notifications | Week 16                    |
| Phase 7 | Week 17-20 | Beta Testing & Launch              | Week 20                    |

**Total Timeline: 20 weeks (~5 months) to launch**

---

## Resource Allocation

### Development Team

- **Full-stack Developer (1)**: All features
- **UI/UX Designer (0.5)**: Part-time, design system and mockups
- **QA Tester (0.5)**: Part-time, testing during beta phase

### Estimated Effort

- **Total Development Hours**: ~800 hours
- **Phase 1**: 80 hours
- **Phase 2**: 120 hours
- **Phase 3**: 80 hours
- **Phase 4**: 160 hours
- **Phase 5**: 120 hours
- **Phase 6**: 160 hours
- **Phase 7**: 80 hours (testing, docs, launch)

---

## Risk Mitigation

| Risk                               | Impact   | Mitigation                                                              |
| ---------------------------------- | -------- | ----------------------------------------------------------------------- |
| Payment gateway integration delays | High     | Start integration early (Phase 2), use test mode extensively            |
| Scope creep (feature requests)     | Medium   | Strict adherence to roadmap, defer non-critical features to post-launch |
| Developer illness/unavailability   | High     | Buffer time built into estimates, documentation for continuity          |
| Security vulnerability discovered  | Critical | Regular security audits, implement all NFRs from PRD                    |
| User adoption resistance (tutors)  | Medium   | Early training, onboarding support, gather feedback                     |

---

## Success Criteria (Launch Readiness)

Platform is ready to launch when:

- [x] All Phase 1-6 features implemented and tested
- [x] Beta testing completed with > 80% positive feedback
- [x] No P0 (critical) bugs remaining
- [x] Security audit passed
- [x] Performance benchmarks met (page load < 2s, API < 500ms)
- [x] Documentation complete (user guides for all roles)
- [x] Training conducted for tutors and admin
- [x] Payment gateway tested with real transactions (test mode)
- [x] Database backups automated and verified
- [x] Vercel production deployment stable

---

**Document End**
