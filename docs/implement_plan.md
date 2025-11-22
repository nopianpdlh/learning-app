📋 Rencana Implementasi Platform E-Learning - 20 Minggu
Phase 0: Pre-Development (Week 0)
Setup environment (Node.js, Git, VS Code)
Buat akun: GitHub, Vercel, Supabase, Upstash, Pakasir
Install tools dan extensions
Phase 1: Foundation & Authentication (Week 1-2) ✅ PRIORITAS
Week 1:

Init Next.js project + dependencies
Setup Supabase (Auth + Database + Storage)
Setup Prisma schema + migrations
Install Shadcn UI components
Week 2:

Implement Login/Register pages
Middleware untuk auth protection
Holy Grail Layout (Header, Sidebar, Footer)
Role-based navigation
Deliverables: Authentication system berfungsi, layout dashboard siap

Phase 2: Class Management & Payment (Week 3-5) ✅ PRIORITAS
Week 3:

Admin: CRUD classes (create, edit, delete)
Public: Class catalog dengan filter
Student: Enrollment flow (pilih kelas)
Week 4-5:

Integrasi Pakasir API
Create payment transaction saat enroll
Webhook handler untuk konfirmasi pembayaran
Auto-update enrollment status → ACTIVE
Deliverables: Admin bisa buat kelas, siswa bisa enroll & bayar

Phase 3: Learning Materials (Week 6-7)
Setup Supabase Storage buckets
Tutor: Upload materi (PDF, video embed)
Organize by session (Pertemuan 1, 2, 3...)
Student: View & download materials

Phase 4: Assignments (Week 8-10)
Tutor: Create assignments dengan deadline
Student: Submit files (PDF, DOCX, JPG)
Tutor: Grading interface + feedback
Auto-calculate gradebook

Phase 5: Quizzes (Week 11-13) ✅ COMPLETED
Quiz builder: MCQ, True/False, Short Answer ✅
Timer functionality ✅
Auto-grading untuk MCQ ✅
Results display dengan score ✅
Gradebook integration (40% weight) ✅

Phase 6: Live Classes, Forum & Notifications (Week 14-16)
Live class scheduling (manual link input)
Forum threads per class
In-app notifications (Supabase Realtime)
Email notifications

Phase 7: Testing & Launch (Week 17-20)
Week 17-18: Testing

Unit tests (Jest/Vitest)
Integration tests
E2E tests (Playwright)
Performance optimization
Week 19: Beta Testing

3-5 tutors + 20-30 students
Collect feedback
Fix critical bugs
Week 20: Production Launch

Deploy to production Vercel
Configure domain & SSL
Monitoring setup (Sentry, Analytics)
