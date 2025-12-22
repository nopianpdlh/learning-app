# Release Notes

## v1.1.0 (2025-12-23)

### 🎉 New Features

- **Student Forum** - Students can now create discussions, reply to threads, and interact with tutors in the forum
  - New page: `/student/forum`
  - New client component: `StudentForumClient.tsx`
  - New API endpoint: `/api/student/forum/discussions`
  - Added Forum menu to student sidebar navigation

### 🔧 Bug Fixes & Migrations

- **Class to Section Migration (Phase 2)** - Completed migration from deprecated `Class` model to `ClassSection`:

  - Fixed `/api/assignments/[id]/route.ts` - GET, PUT, DELETE handlers
  - Fixed `/api/assignments/[id]/submissions/[submissionId]/route.ts` - Grading submissions
  - Fixed `/api/submissions/[id]/signed-url/route.ts` - File download for tutors
  - Fixed `/api/forum/posts/route.ts` - Creating forum replies
  - Fixed `/api/payments/activate/route.ts` - Enrollment activation

- **Page Component Fixes**:

  - Fixed `/tutor/assignments/[id]/page.tsx` - Created missing page
  - Fixed `/tutor/quizzes/[id]/page.tsx` - Await params
  - Fixed `/student/quizzes/[id]/page.tsx` - class → section
  - Fixed `/student/quizzes/[id]/result/page.tsx` - class → section, added TypeScript types

- **Tutor Grading**:
  - Fixed `TutorGradingClient.tsx` - "Lihat File Submission" now fetches signed URL via API

### ✨ Improvements

- **Better Validation Error Messages** - Forum thread/post creation now shows specific Indonesian error messages:
  - "Judul minimal 5 karakter" instead of generic "Validation error"
  - "Isi diskusi minimal X karakter"

### 📦 Technical Changes

- All API endpoints now consistently use `section`/`sectionId` instead of deprecated `class`/`classId`
- ForumThread author info is fetched separately (no direct author relation in schema)
- Added proper TypeScript interfaces for Quiz result page

---

## v1.0.0 (Previous Release)

Initial release with:

- Multi-role authentication (Admin, Tutor, Student)
- Class management and enrollment system
- Materials, Assignments, and Quizzes
- Payment integration with Midtrans
- Live class scheduling
- Forum discussions
- Notification system
