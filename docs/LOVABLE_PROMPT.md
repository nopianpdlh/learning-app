# Prompt untuk Lovable - Platform E-Learning Tutor Nomor Satu

## 🎯 Project Overview

Buatkan **Platform E-Learning (Learning Management System)** berbasis web untuk "Tutor Nomor Satu" dengan fitur lengkap untuk Admin, Tutor, dan Siswa.

---

## 🎨 Design System

### Brand Colors
- **Primary**: Blue #2563EB (Tailwind `blue-600`)
- **Secondary**: Sky Blue #38BDF8 (Tailwind `sky-400`)
- **Dark**: Navy #1E3A8A (Tailwind `blue-900`)
- **Neutral**: Gray #F3F4F6 (Tailwind `gray-100`), #6B7280 (Tailwind `gray-500`)
- **Accent**: Yellow #FACC15 (Tailwind `yellow-400`)
- **Background**: White #FFFFFF

### Typography
- **Font**: Inter / System UI
- **Headings**: Bold, Blue-900
- **Body**: Regular, Gray-700

### Layout Pattern
**Holy Grail Layout** untuk semua dashboard:
```
┌─────────────────────────────────────────┐
│         Header (Logo + User Menu)       │
├──────────┬────────────────┬─────────────┤
│          │                │             │
│ Sidebar  │  Main Content  │ Sidebar Kanan│
│  Kiri    │    (Center)    │  (Optional) │
│ (Nav)    │                │  (Widgets)  │
│          │                │             │
├──────────┴────────────────┴─────────────┤
│              Footer                      │
└─────────────────────────────────────────┘
```

---

## 📱 Pages & Features to Build

### 🔐 1. Authentication Pages (NO Holy Grail)

#### `/login` - Login Page
- **Layout**: Center-aligned card, no sidebar
- **Form Fields**:
  - Email/Phone input
  - Password input (with show/hide toggle)
  - "Remember Me" checkbox
  - "Lupa Password?" link
- **Button**: "Masuk" (Primary blue)
- **Footer**: "Belum punya akun? Daftar"

#### `/register` - Registration Page
- **Layout**: Center-aligned card
- **Form Fields**:
  - Nama Lengkap
  - Email
  - No. Telepon
  - Password (with strength indicator)
  - Konfirmasi Password
  - Role (Hidden - default: Student)
- **Button**: "Daftar"
- **Footer**: "Sudah punya akun? Masuk"

---

### 👨‍🎓 2. Student Dashboard (Holy Grail Layout)

#### `/student/dashboard` - Student Home

**Header:**
- Logo "Tutor Nomor Satu" (kiri)
- Search bar (tengah)
- Notification bell icon with badge
- User avatar + dropdown (kanan)

**Sidebar Kiri:**
- 🏠 Dashboard (active)
- 📚 Kelas Saya
- 📄 Materi
- 📝 Tugas
- ✅ Kuis
- 🎥 Jadwal Live Class
- 📊 Rapor/Nilai
- ⚙️ Pengaturan

**Main Content:**
1. **Hero Card**: "Live Class Hari Ini" (jika ada)
   - Class name, tutor name, time countdown
   - Button: "Gabung Kelas" (green, prominent)

2. **Grid Cards**:
   - **Kelas yang Diikuti** (max 4 cards, "Lihat Semua" link)
     - Card: Class thumbnail, title, tutor name, progress bar
   - **Tugas Belum Selesai** (list view, due date countdown)
   - **Kuis Terbaru** (list view, score badge)

**Sidebar Kanan (Widgets):**
- **Upcoming Events** (next 3 live classes)
- **Recent Notifications** (last 5)
- **Progress This Week** (circular chart: 75%)

---

#### `/student/classes` - My Classes
- **Layout**: Grid of class cards (3 columns desktop, 1 column mobile)
- **Each Card**:
  - Thumbnail image
  - Class name, subject, grade level
  - Tutor name + avatar
  - Progress bar (% completion)
  - Button: "Buka Kelas"
- **Filter**: Subject, Status (Active/Completed)

---

#### `/student/classes/[id]` - Class Detail
**Tabs Navigation:**
1. **Materi** (default)
   - Accordion by session (Pertemuan 1, 2, 3...)
   - Each item: PDF icon, video icon, download button
   
2. **Tugas**
   - List of assignments with status badges (Not Submitted, Submitted, Graded)
   - Click to open assignment detail modal
   
3. **Kuis**
   - List of quizzes with status (Not Started, In Progress, Completed)
   - Score display if completed
   
4. **Live Class**
   - Upcoming live classes (card with date/time, join button)
   - Past recordings (if any)
   
5. **Forum**
   - Thread list with reply count
   - Button: "Buat Thread Baru"

---

#### `/student/assignments/[id]` - Assignment Detail
- **Assignment Info Card**:
  - Title, instructions (rich text)
  - Due date countdown (red if < 24h)
  - Max points, current score (if graded)
- **Submission Section**:
  - File upload dropzone (drag & drop)
  - Supported formats: PDF, DOCX, JPG, PNG (max 20MB)
  - Upload button: "Submit Tugas"
- **If Graded**:
  - Score badge (large, prominent)
  - Tutor feedback (text area)
  - Download graded file (if annotated)

---

#### `/student/quizzes/[id]` - Quiz Taking
- **Quiz Header**:
  - Title, total questions, time limit
  - Timer countdown (sticky top, red when < 5 min)
- **Question List**:
  - Question number sidebar (left, show answered/unanswered status)
  - Question text (large, clear)
  - Answer options:
    - Multiple Choice: Radio buttons
    - True/False: Large buttons
    - Short Answer: Text input
- **Navigation**:
  - "Previous" / "Next" buttons
  - "Submit Quiz" button (confirm dialog)
- **Auto-submit** when timer expires

---

#### `/student/grades` - Gradebook / Rapor
- **Summary Card**:
  - Overall GPA (large number)
  - Total assignments, quizzes completed
  - Badge icons (achievements - future)
- **Per-Class Table**:
  - Columns: Class Name, Assignments Avg, Quizzes Avg, Total Score
  - Expandable rows to show breakdown
- **Chart**: Line graph showing score trend over time

---

### 👨‍🏫 3. Tutor Dashboard (Holy Grail Layout)

#### `/tutor/dashboard` - Tutor Home

**Sidebar Kiri:**
- 🏠 Dashboard
- 📚 Kelas Saya
- 📄 Materi
- 📝 Tugas
- ✅ Kuis
- 🎥 Live Class
- 📊 Nilai Siswa
- 💬 Forum

**Main Content:**
1. **Stats Cards** (Row):
   - Total Classes Taught
   - Pending Assignments to Grade (number badge)
   - Total Students
   - Upcoming Live Classes

2. **Tables**:
   - **Tugas Belum Dinilai** (sortable, clickable rows)
   - **Kuis Terbaru** (with average score)
   - **Upcoming Live Classes** (today + this week)

**Sidebar Kanan:**
- Recent student activities
- Quick actions (+ Upload Material, + Create Assignment)

---

#### `/tutor/classes/[id]` - Class Management
**Tabs:**
1. **Siswa** (student list table)
   - Name, email, enrollment date, status
   - Actions: View profile, Send message
   
2. **Materi** (materials list)
   - Button: "+ Upload Materi"
   - List: Title, session, upload date, actions (edit, delete)
   
3. **Tugas** (assignments list)
   - Button: "+ Buat Tugas Baru"
   - List: Title, due date, submissions count / total students, actions
   
4. **Kuis** (quizzes list)
   - Button: "+ Buat Kuis Baru"
   - List: Title, status, attempts count, average score
   
5. **Live Class**
   - Button: "+ Jadwalkan Live Class"
   - Two modes:
     - **Manual**: Input Zoom/Meet URL + date/time
     - **Auto** (future): Generate via API
   
6. **Forum** (same as student view, but with moderation actions)

---

#### `/tutor/assignments/create` - Create Assignment
- **Form**:
  - Class selection (dropdown)
  - Title (text input)
  - Instructions (rich text editor: Tiptap or Lexical)
  - Session (dropdown: Pertemuan 1, 2, 3...)
  - Due date (date picker + time)
  - Max points (number input)
  - Attachment (file upload, optional)
  - Status (Draft / Published toggle)
- **Buttons**: "Simpan Draft" / "Publish"

---

#### `/tutor/assignments/[id]/submissions` - Grade Submissions
- **Left Panel**: Student submission list
  - Student name, submission date, status badge
  - Click to view submission
- **Right Panel**: Grading interface
  - Preview submitted file (PDF viewer)
  - Score input (slider 0-100)
  - Feedback text area
  - Button: "Simpan Nilai"
  - Button: "Download File"

---

#### `/tutor/quizzes/create` - Create Quiz
- **Form**:
  - Title, class selection, session
  - Time limit (minutes)
  - Available period (start & end date/time)
  - Passing grade (optional)
- **Question Builder**:
  - Button: "+ Tambah Soal"
  - **Question Card** (repeatable):
    - Question type (dropdown: MCQ, True/False, Short Answer)
    - Question text (rich text)
    - **If MCQ**:
      - 4 option inputs (A, B, C, D)
      - Correct answer selection (radio)
    - **If True/False**:
      - Correct answer toggle
    - Points per question
    - Explanation (optional, shown after submission)
  - Drag to reorder questions
- **Preview Button**: Show student view
- **Publish Button**

---

#### `/tutor/grades/[classId]` - Class Gradebook
- **Table View**:
  - **Columns**: Student Name | Assignment 1 | Assignment 2 | Quiz 1 | Quiz 2 | Total
  - **Rows**: Each student
  - Color coding: Green (>80), Yellow (60-80), Red (<60)
- **Export Button**: "Download Excel"
- **Filters**: By assignment/quiz, by student

---

### 👨‍💼 4. Admin Dashboard (Holy Grail Layout)

#### `/admin/dashboard` - Admin Home

**Sidebar Kiri:**
- 🏠 Dashboard
- 👥 Kelola User
- 📚 Kelola Kelas
- 💳 Pembayaran
- 📊 Laporan
- ⚙️ Pengaturan

**Main Content:**
- **KPI Cards** (Row of 4):
  - Total Students (number + icon)
  - Total Tutors
  - Active Classes
  - Revenue This Month (Rp format)
- **Charts**:
  - Line chart: Enrollment trend (last 6 months)
  - Bar chart: Revenue per class
- **Tables**:
  - Recent Enrollments (last 10)
  - Pending Payments (needs verification)

---

#### `/admin/users` - User Management
- **Tabs**: Students | Tutors | Admins
- **Table** (per tab):
  - Columns: Name, Email, Phone, Role, Status, Join Date, Actions
  - Actions: Edit (pencil icon), Delete (trash icon)
- **Buttons**:
  - "+ Tambah User" (open modal)
  - "Import CSV" (bulk upload)
- **Search & Filter**: By name, email, status (Active/Inactive)

**Create/Edit User Modal:**
- Form: Name, Email, Phone, Role (dropdown), Password (if new)
- Button: "Simpan"

---

#### `/admin/classes` - Class Management
- **Button**: "+ Buat Kelas Baru"
- **Table**:
  - Columns: Class Name, Subject, Grade, Tutor, Students Enrolled / Capacity, Price, Status, Actions
  - Actions: Edit, Delete, View Students
- **Filters**: Subject, Grade, Status (Published/Draft)

**Create/Edit Class Modal:**
- Form:
  - Class name, description (textarea)
  - Subject (dropdown: Matematika, Fisika, Kimia, dll)
  - Grade level (dropdown: SMP 7, SMP 8, SMA 10, dll)
  - Tutor assignment (searchable dropdown)
  - Price (Rp input)
  - Capacity (number)
  - Schedule (text: "Senin & Rabu, 19:00-21:00")
  - Enrollment open/close dates
  - Thumbnail image upload
  - Status (Draft / Published toggle)

---

#### `/admin/payments` - Payment Monitoring
- **Table**:
  - Columns: Student Name, Class, Amount, Payment Method, Status, Date, Actions
  - Status badges: Pending (yellow), Paid (green), Failed (red), Refunded (gray)
  - Actions: View Detail, Manual Verify (if pending)
- **Filters**: Status, Date range, Payment method
- **Export Button**: "Download Report"

---

#### `/admin/reports` - Analytics & Reports
- **Date Range Picker** (top)
- **Cards**:
  - Total Revenue (Rp)
  - Total Enrollments
  - Average Class Rating (future)
  - Active Users
- **Charts**:
  - Revenue breakdown (pie chart: by class)
  - Enrollment trend (line chart)
  - Top 5 classes by enrollment (bar chart)
- **Export Button**: "Download PDF Report"

---

### 🌐 5. Public Pages (NO Holy Grail)

#### `/catalog` - Class Catalog (Public)
- **Header**: Logo, "Masuk", "Daftar" buttons
- **Hero Section**:
  - Headline: "Belajar Lebih Mudah dengan Tutor Nomor Satu"
  - Search bar (search by class name)
- **Filter Sidebar** (left):
  - Subject (checkboxes)
  - Grade Level (checkboxes)
  - Price Range (slider)
- **Class Grid** (3 columns):
  - Each card:
    - Thumbnail image
    - Class name, subject badge
    - Tutor name + avatar
    - Price (Rp format)
    - Students enrolled count
    - Button: "Lihat Detail"
- **Pagination** at bottom

---

#### `/catalog/[id]` - Class Detail (Public)
- **Breadcrumb**: Home > Katalog > Class Name
- **Hero Section**:
  - Large thumbnail
  - Class name (H1)
  - Subject & grade badges
  - Price (large, prominent)
  - Button: "Daftar Sekarang" (CTA, blue)
- **Tabs**:
  - **Tentang** (description, what will be learned, schedule)
  - **Tutor** (tutor bio, photo, experience)
  - **Materi** (preview of topics covered - collapsed)
- **Sticky CTA** (bottom right on scroll): "Daftar Sekarang"

---

## 🧩 Reusable Components to Create

### 1. **Button Component**
- Variants: primary, secondary, outline, ghost, destructive
- Sizes: sm, md, lg
- With loading state (spinner)

### 2. **Card Component**
- Header, body, footer slots
- Hover effects

### 3. **Table Component**
- Sortable columns
- Pagination
- Row selection (checkbox)
- Search filter

### 4. **Modal/Dialog Component**
- Overlay with backdrop
- Close button (X)
- Title, content, footer (actions)

### 5. **Input Components**
- Text input (with label, error message)
- Select/Dropdown (searchable)
- Date picker (with time option)
- File upload (drag & drop zone)
- Rich text editor wrapper

### 6. **Badge Component**
- Status badges: success (green), warning (yellow), danger (red), info (blue)

### 7. **Notification/Toast Component**
- Auto-dismiss after 5s
- Types: success, error, warning, info

### 8. **Progress Bar Component**
- Percentage-based
- Color variants

### 9. **Avatar Component**
- With fallback (initials)
- Sizes: sm, md, lg

### 10. **Sidebar Navigation Component**
- Collapsible (hamburger menu on mobile)
- Active state highlighting
- Icon + label

### 11. **Header Component**
- Logo (left)
- Search bar (center)
- Notification bell + User menu (right)

### 12. **Empty State Component**
- Icon, message, CTA button
- For empty tables/lists

---

## 📊 Data Structure (Mock Data)

### User Object
```json
{
  "id": "usr_123",
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "phone": "081234567890",
  "role": "STUDENT", // or "TUTOR", "ADMIN"
  "avatar": "https://avatar.url",
  "status": "ACTIVE"
}
```

### Class Object
```json
{
  "id": "cls_123",
  "name": "Matematika SMA Kelas 12",
  "subject": "Matematika",
  "gradeLevel": "SMA 12",
  "description": "Persiapan UTBK Matematika...",
  "tutor": {
    "id": "usr_456",
    "name": "Ibu Sarah"
  },
  "price": 500000,
  "capacity": 30,
  "enrolled": 24,
  "schedule": "Senin & Rabu, 19:00-21:00",
  "thumbnail": "https://image.url",
  "status": "PUBLISHED"
}
```

### Assignment Object
```json
{
  "id": "asg_123",
  "classId": "cls_123",
  "title": "Latihan Soal Integral",
  "instructions": "<p>Kerjakan soal berikut...</p>",
  "dueDate": "2025-11-25T23:59:00Z",
  "maxPoints": 100,
  "status": "PUBLISHED"
}
```

### Quiz Object
```json
{
  "id": "qz_123",
  "classId": "cls_123",
  "title": "Kuis Bab 2: Limit",
  "timeLimit": 60,
  "questions": [
    {
      "id": "q1",
      "type": "MULTIPLE_CHOICE",
      "text": "Berapakah hasil dari lim x->0 (sin x / x)?",
      "options": ["0", "1", "∞", "Tidak terdefinisi"],
      "correctAnswer": 1,
      "points": 10
    }
  ]
}
```

---

## 🎯 Key UX Requirements

1. **Mobile-First**: All pages responsive (min 375px)
2. **Fast Load**: Skeleton loaders for async data
3. **Accessibility**: WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader support
   - Focus indicators
4. **Feedback**: Toast notifications for all actions (success/error)
5. **Error Handling**: Friendly error messages, retry buttons
6. **Loading States**: Spinners, skeleton screens, disabled buttons during submit
7. **Form Validation**: Real-time validation with clear error messages
8. **Confirmation Dialogs**: For destructive actions (delete, submit quiz)

---

## 🔧 Technical Stack (Expected)

- **Framework**: React 19 + Next.js 15 App Router (if supported) OR Vite + React Router
- **Styling**: TailwindCSS + Shadcn UI components
- **Forms**: React Hook Form + Zod validation
- **State**: Zustand or React Context
- **Icons**: Lucide React
- **Charts**: Recharts or Chart.js
- **Rich Text**: Tiptap or Lexical
- **Date Picker**: react-datepicker or Shadcn Calendar

---

## 📝 Implementation Priority

### Phase 1 (Core MVP):
1. Auth pages (Login, Register)
2. Student Dashboard + Class List + Class Detail
3. Tutor Dashboard + Class Management
4. Admin Dashboard + User Management + Class Management

### Phase 2 (Learning Features):
5. Materials view/upload
6. Assignments create/submit/grade
7. Quizzes create/take/results

### Phase 3 (Engagement):
8. Live Class scheduling
9. Forum discussion
10. Gradebook/Rapor
11. Notifications

---

## 🚀 Final Notes

- **Gunakan Shadcn UI** untuk semua base components (button, card, table, form, dll)
- **Pastikan Holy Grail layout** diterapkan di semua dashboard (student/tutor/admin)
- **Warna branding** harus konsisten: Blue primary (#2563EB)
- **Mock data** boleh hardcoded dulu, nantinya akan connect ke Supabase backend
- **Responsive design** wajib (mobile hamburger menu, collapsible sidebar)
- **Loading & error states** harus ada di setiap page

---

**Selamat membuat! 🎨**
