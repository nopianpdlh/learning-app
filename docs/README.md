# 📚 Documentation Index
# Platform E-Learning Tutor Nomor Satu

**Version:** 1.0  
**Last Updated:** November 15, 2025  

---

## 📋 Document Overview

Ini adalah index lengkap dari semua dokumentasi teknis untuk Platform E-Learning Tutor Nomor Satu. Semua dokumen saling terhubung dan relevan untuk memastikan konsistensi dalam development.

---

## 🗂️ Core Documentation

### 1. **Konsep Awal** 📖
**File**: [`konsep-awal.md`](./konsep-awal.md)  
**Tujuan**: Dokumen foundational yang menjelaskan visi, masalah, solusi, dan fitur platform  
**Untuk Siapa**: Semua stakeholders (Product Owner, Developer, Designer, Business Owner)  
**Highlights**:
- Masalah sistem saat ini (manual & terfragmentasi)
- Solusi: Platform E-Learning terpusat (LMS)
- Fitur-fitur utama (Kuis, Tugas, Materi, Forum, dll)
- Arsitektur teknis (Next.js, Supabase, Pakasir)
- UI/UX design (Holy Grail layout, branding biru)

---

### 2. **Product Requirements Document (PRD)** 📝
**File**: [`PRD.md`](./PRD.md)  
**Tujuan**: Dokumen spesifikasi lengkap semua fitur dan requirement produk  
**Untuk Siapa**: Product Manager, Developer, QA Tester  
**Highlights**:
- **Business Objectives**: Efisiensi 80%, NPS > 70
- **User Roles**: Admin, Tutor, Siswa (dengan permissions masing-masing)
- **Functional Requirements (FR)**: Semua fitur (FR-AUTH-001 sampai FR-NOTIF-002)
  - Authentication & Authorization
  - User Management
  - Class Management & Payment
  - Materials, Assignments, Quizzes
  - Live Classes, Forum, Gradebook
  - Notifications & Dashboard
- **Non-Functional Requirements (NFR)**: Performance, Security, Reliability
- **User Stories**: 20+ user stories dari perspective siswa, tutor, admin
- **Out of Scope**: Fitur yang tidak termasuk V1 (mobile app, AI, gamification)
- **Success Metrics**: KPI untuk launch readiness

**Related Docs**: `SRS.md`, `NFR.md`, `ROADMAP.md`

---

### 3. **Software Requirements Specification (SRS)** 🔧
**File**: [`SRS.md`](./SRS.md)  
**Tujuan**: Spesifikasi teknis detail untuk developer dan tester  
**Untuk Siapa**: Software Engineer, QA Tester, System Architect  
**Highlights**:
- **System Features**: Breakdown detail setiap fitur dengan FR (Functional Requirements)
  - FR-3.1.1.1 sampai FR-3.12.2.3 (100+ requirements)
  - Input/Output specifications
  - Preconditions & Postconditions
- **External Interface Requirements**: UI, Hardware, Software, Communication
- **Non-Functional Requirements**: Performance, Security, Reliability, Usability, Scalability
- **Business Rules**: Constraints dan aturan bisnis (BR-001 sampai BR-007)
- **Glossary**: Definisi istilah teknis

**Related Docs**: `PRD.md`, `NFR.md`, `TECHNICAL_ARCHITECTURE.md`

---

### 4. **Non-Functional Requirements (NFR)** ⚡
**File**: [`NFR.md`](./NFR.md)  
**Tujuan**: Spesifikasi kualitas sistem (performance, security, reliability)  
**Untuk Siapa**: Developer, DevOps Engineer, Security Specialist  
**Highlights**:
- **Performance**:
  - Page load < 2s, API response < 500ms
  - Support 500 concurrent users
  - Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- **Security**:
  - Multi-layer auth (JWT, RBAC, RLS)
  - File upload validation, rate limiting
  - HTTPS, CSRF protection, audit logging
- **Reliability**:
  - 99.5% uptime SLA
  - Daily backups (30-day retention)
  - RTO < 2 hours, RPO < 24 hours
- **Scalability**: Serverless auto-scaling, CDN caching, database indexing
- **Usability**: WCAG 2.1 Level AA, mobile-responsive, max 3 clicks
- **Maintainability**: 70% code coverage, Prisma migrations, API docs

**Related Docs**: `SRS.md`, `HIGH_LEVEL_ARCHITECTURE.md`

---

### 5. **Technical Architecture** 🏗️
**File**: [`TECHNICAL_ARCHITECTURE.md`](./TECHNICAL_ARCHITECTURE.md)  
**Tujuan**: Arsitektur teknis lengkap (tech stack, data schema, API, security)  
**Untuk Siapa**: Tech Lead, Backend Developer, Database Admin  
**Highlights**:
- **Tech Stack**:
  - Frontend: Next.js 15, React 19, TailwindCSS 4, Shadcn UI
  - Backend: Next.js API Routes, Server Actions, Prisma ORM
  - Database: Supabase PostgreSQL, Supabase Storage, Supabase Auth
  - Deployment: Vercel (serverless), Supabase Cloud
- **Database Schema (Prisma)**:
  - Full schema dengan 20+ models (User, Class, Enrollment, Payment, Material, Assignment, Quiz, dll)
  - Relationships dan indexes
- **API Architecture**:
  - 50+ API endpoints (RESTful)
  - Server Actions untuk mutations
  - Middleware (auth, rate limiting)
- **Security Architecture**:
  - Authentication flow (JWT via Supabase Auth)
  - Authorization layers (Middleware + RLS)
  - File upload security, webhook verification
- **Performance Optimization**: Caching, code splitting, image optimization
- **Deployment Pipeline**: Git push → Vercel → Auto-deploy

**Related Docs**: `HIGH_LEVEL_ARCHITECTURE.md`, `UML_DIAGRAMS.md`

---

### 6. **High-Level Architecture** 🌐
**File**: [`HIGH_LEVEL_ARCHITECTURE.md`](./HIGH_LEVEL_ARCHITECTURE.md)  
**Tujuan**: Overview arsitektur sistem secara high-level (layers, data flow, infrastructure)  
**Untuk Siapa**: CTO, Tech Lead, Solution Architect, Business Owner  
**Highlights**:
- **Architecture Pattern**: Serverless Monolith (Next.js)
- **Architectural Layers**:
  - Presentation (Frontend: Next.js SSR/CSR)
  - Application (Backend: API Routes, Middleware)
  - Data (Supabase PostgreSQL, Storage)
  - Integration (Pakasir, Email, Realtime)
- **Data Flow Diagrams**: Enrollment + Payment, Assignment + Grading
- **Infrastructure**: Vercel + Supabase Cloud + CDN
- **Scaling Strategy**: Horizontal (serverless auto-scale), Vertical (upgrade plans)
- **Security Architecture**: Multi-layer (Transport, Auth, Authz, Input, Output)
- **Monitoring & Observability**: Vercel Analytics, Sentry, Logs
- **Disaster Recovery**: Backup strategy, RTO/RPO, incident response
- **Technology Decisions (ADR)**: Why Next.js, Supabase, Prisma, Pakasir, Vercel

**Related Docs**: `TECHNICAL_ARCHITECTURE.md`, `ROADMAP.md`

---

### 7. **Development Roadmap** 🗓️
**File**: [`ROADMAP.md`](./ROADMAP.md)  
**Tujuan**: Timeline development dari Week 1 sampai Launch (20 weeks)  
**Untuk Siapa**: Project Manager, Developer, QA Tester, Business Owner  
**Highlights**:
- **Phase 1 (Week 1-2)**: Foundation & Setup
  - Project init, Supabase setup, Auth, User management
- **Phase 2 (Week 3-5)**: Class Management & Payment
  - Class CRUD, Enrollment, Pakasir integration, Dashboards
- **Phase 3 (Week 6-7)**: Learning Materials
  - Material upload (tutor), Material viewing (student)
- **Phase 4 (Week 8-10)**: Assignments & Grading
  - Create assignment, Submit, Grade, Gradebook
- **Phase 5 (Week 11-12)**: Quizzes
  - Create quiz, Take quiz, Auto-grading, Results
- **Phase 6 (Week 13-16)**: Live Classes, Forum, Notifications
  - Live class scheduling, Forum discussion, Real-time notif, Polish & bug fixes
- **Phase 7 (Week 17-20)**: Beta Testing & Launch
  - Beta testing (3-5 tutors, 20-30 students), Documentation, Training, Production launch
- **Post-Launch**: Enhancements (Analytics, Parent portal, Mobile app, AI features)
- **Milestones**: Phase completion dates, checkpoints
- **Resource Allocation**: 800 development hours total

**Related Docs**: `PRD.md`, `SRS.md`

---

### 8. **UML Diagrams** 📊
**File**: [`UML_DIAGRAMS.md`](./UML_DIAGRAMS.md)  
**Tujuan**: Visualisasi sistem dengan UML diagrams (use case, class, sequence, dll)  
**Untuk Siapa**: Software Engineer, System Analyst, Database Designer  
**Highlights**:
- **Use Case Diagram**: Interaksi Student, Tutor, Admin dengan sistem
- **Class Diagram**: Database schema dengan relationships
- **Sequence Diagrams**:
  - Student Enrollment & Payment Flow
  - Assignment Submission & Grading Flow
  - Quiz Taking Flow
- **Activity Diagrams**:
  - Student Enrollment Process
  - Tutor Grading Workflow
- **State Diagrams**:
  - Enrollment State Transitions (PENDING → PAID → ACTIVE → COMPLETED)
  - Submission State Transitions (NOT_SUBMITTED → SUBMITTED → GRADED)
  - Quiz State Transitions (DRAFT → PUBLISHED → CLOSED)
- **Component Diagram**: Frontend architecture (App Router, Components, Libraries)
- **Deployment Diagram**: Infrastructure (Vercel, Supabase, Pakasir, CDN)
- **Entity Relationship Diagram (ERD)**: Database relationships

**Related Docs**: `TECHNICAL_ARCHITECTURE.md`, `USER_FLOW.md`

---

### 9. **User Flow Diagrams** 🔄
**File**: [`USER_FLOW.md`](./USER_FLOW.md)  
**Tujuan**: Detail flow setiap user interaction (student, tutor, admin)  
**Untuk Siapa**: UX Designer, Frontend Developer, QA Tester  
**Highlights**:

#### **Student Flows**:
1. Registration & First Enrollment (15 steps)
2. Accessing Materials (PDF preview, video embed, download)
3. Submitting Assignment (upload file, deadline check)
4. Taking Quiz (start, timer, auto-submit, results)
5. Joining Live Class (H-1 reminder, join button)
6. Viewing Grades (gradebook, progress chart)

#### **Tutor Flows**:
1. Uploading Materials (file/video, session, publish)
2. Creating Assignment (rich text, due date, max points)
3. Grading Assignments (view submission, score, feedback)
4. Creating Quiz (MCQ, T/F, Short Answer, explanations)
5. Scheduling Live Class (manual URL or Zoom API)
6. Viewing Class Gradebook (table view, export Excel)

#### **Admin Flows**:
1. Creating Class (assign tutor, set price, publish)
2. Managing Users (create, edit, delete, bulk import)
3. Monitoring Payments (filter, manual verification)
4. Viewing Analytics Dashboard (KPIs, charts)

#### **Common Flows**:
1. Login Flow (role-based redirect)
2. Notification Flow (real-time push, bell icon)

#### **Error & Edge Cases**:
1. Payment Failed Flow (retry, contact support)
2. File Upload Failed Flow (size/type error, retry)

**Related Docs**: `UML_DIAGRAMS.md`, `PRD.md`

---

## 🔗 Document Relationships

```
konsep-awal.md (Vision)
    ↓
PRD.md (What to build)
    ↓
├── SRS.md (How to build - Functional)
│   └── NFR.md (How to build - Non-Functional)
│
├── TECHNICAL_ARCHITECTURE.md (Tech details)
│   └── HIGH_LEVEL_ARCHITECTURE.md (System overview)
│
├── ROADMAP.md (When to build)
│
└── UML_DIAGRAMS.md + USER_FLOW.md (Visualizations)
```

---

## 📚 How to Use This Documentation

### For **Product Owners / Business Stakeholders**:
1. Start with `konsep-awal.md` to understand the vision
2. Read `PRD.md` for detailed features and success metrics
3. Review `ROADMAP.md` for timeline and phases
4. Check `USER_FLOW.md` to see how users will interact

### For **Developers (Full-stack)**:
1. Read `PRD.md` to understand requirements
2. Study `TECHNICAL_ARCHITECTURE.md` for tech stack and API design
3. Reference `SRS.md` for detailed functional requirements
4. Follow `ROADMAP.md` for development phases
5. Use `UML_DIAGRAMS.md` for database schema and flow diagrams

### For **Frontend Developers**:
1. `PRD.md` → User stories and UI requirements
2. `USER_FLOW.md` → Detailed interaction flows
3. `TECHNICAL_ARCHITECTURE.md` (Section 3.1) → Frontend stack
4. `NFR.md` (Section 5.4) → Usability requirements

### For **Backend Developers**:
1. `SRS.md` → All functional requirements (FR-xxx)
2. `TECHNICAL_ARCHITECTURE.md` (Section 4) → Database schema (Prisma)
3. `TECHNICAL_ARCHITECTURE.md` (Section 5) → API endpoints
4. `UML_DIAGRAMS.md` → Sequence diagrams for API flows

### For **QA Testers**:
1. `SRS.md` → Test cases based on functional requirements
2. `NFR.md` → Performance, security, usability test criteria
3. `USER_FLOW.md` → End-to-end test scenarios
4. `PRD.md` (Section 12) → Acceptance criteria for launch

### For **DevOps Engineers**:
1. `TECHNICAL_ARCHITECTURE.md` (Section 8) → Deployment architecture
2. `HIGH_LEVEL_ARCHITECTURE.md` (Section 5) → Infrastructure
3. `NFR.md` (Section 3) → Reliability and backup requirements
4. `HIGH_LEVEL_ARCHITECTURE.md` (Section 8) → Monitoring setup

### For **UI/UX Designers**:
1. `konsep-awal.md` (Section Rancangan UI/UX) → Design system, colors, layouts
2. `USER_FLOW.md` → All user interaction flows
3. `PRD.md` (Section 6) → User stories for empathy
4. `NFR.md` (Section 5.3) → Accessibility requirements (WCAG 2.1)

---

## ✅ Document Status

| Document | Status | Last Updated | Version |
|----------|--------|--------------|---------|
| `konsep-awal.md` | ✅ Complete | Nov 15, 2025 | 1.0 |
| `PRD.md` | ✅ Complete | Nov 15, 2025 | 1.0 |
| `SRS.md` | ✅ Complete | Nov 15, 2025 | 1.0 |
| `NFR.md` | ✅ Complete | Nov 15, 2025 | 1.0 |
| `TECHNICAL_ARCHITECTURE.md` | ✅ Complete | Nov 15, 2025 | 1.0 |
| `HIGH_LEVEL_ARCHITECTURE.md` | ✅ Complete | Nov 15, 2025 | 1.0 |
| `ROADMAP.md` | ✅ Complete | Nov 15, 2025 | 1.0 |
| `UML_DIAGRAMS.md` | ✅ Complete | Nov 15, 2025 | 1.0 |
| `USER_FLOW.md` | ✅ Complete | Nov 15, 2025 | 1.0 |

---

## 🚀 Next Steps

1. **Review & Approval**:
   - Product Owner approves `PRD.md`
   - Tech Lead approves `TECHNICAL_ARCHITECTURE.md`
   - Business Owner approves `ROADMAP.md`

2. **Development Kickoff**:
   - Start Phase 1 per `ROADMAP.md`
   - Setup project structure per `TECHNICAL_ARCHITECTURE.md`
   - Initialize Supabase project and Prisma schema

3. **Continuous Updates**:
   - Update docs as requirements change
   - Add ADRs (Architecture Decision Records) to `HIGH_LEVEL_ARCHITECTURE.md`
   - Track progress in `ROADMAP.md`

---

## 📞 Contact & Support

For questions about this documentation:
- **Product**: Contact Product Owner
- **Technical**: Contact Tech Lead
- **Business**: Contact Business Owner

---

**Documentation Version**: 1.0  
**Generated**: November 15, 2025  
**Platform**: E-Learning Tutor Nomor Satu  

---

> **Note**: Semua diagram dalam `UML_DIAGRAMS.md` dan `USER_FLOW.md` menggunakan **Mermaid syntax** yang dapat di-render di GitHub, GitLab, atau VS Code dengan extension Mermaid.

---

**END OF INDEX**
