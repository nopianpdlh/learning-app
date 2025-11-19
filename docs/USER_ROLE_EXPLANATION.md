# User Role & Profile Structure

## Platform E-Learning - Tutor Nomor Satu

---

## Penjelasan Struktur User

### 1. Tabel User (Base Table)

Tabel `User` adalah tabel utama yang menyimpan **semua user** dalam sistem, baik Student, Tutor, maupun Admin.

```
┌─────────────────────────────────────────────────────────────┐
│                         User                                │
├─────────────────────────────────────────────────────────────┤
│ - id: string (PK)                                           │
│ - email: string (UNIQUE)                                    │
│ - phone: string                                             │
│ - name: string                                              │
│ - avatar: string? (nullable)                                │
│ - role: UserRole (STUDENT | TUTOR | ADMIN)                  │
│ - authId: string (UNIQUE) -> Link ke Supabase Auth         │
│ - createdAt: Date                                           │
│ - updatedAt: Date                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Struktur Role & Profile

### **A. STUDENT** (`role = STUDENT`)

Student **MEMILIKI** profile tambahan di tabel `StudentProfile`:

```
User (role: STUDENT)
  │
  └──> StudentProfile (1:1 relationship)
        ├─ grade: string (kelas, misal: "10", "11", "12")
        ├─ school: string (nama sekolah)
        ├─ parentName: string (nama orang tua)
        └─ parentPhone: string (nomor HP orang tua)
```

**Contoh Data:**
```json
// Tabel User
{
  "id": "usr_001",
  "email": "student@example.com",
  "name": "Ahmad Zaki",
  "role": "STUDENT",
  "authId": "auth_123"
}

// Tabel StudentProfile
{
  "id": "sp_001",
  "userId": "usr_001",
  "grade": "11",
  "school": "SMA Negeri 1 Jakarta",
  "parentName": "Budi Santoso",
  "parentPhone": "081234567890"
}
```

---

### **B. TUTOR** (`role = TUTOR`)

Tutor **MEMILIKI** profile tambahan di tabel `TutorProfile`:

```
User (role: TUTOR)
  │
  └──> TutorProfile (1:1 relationship)
        ├─ bio: text (deskripsi tutor)
        └─ subjects: string[] (mata pelajaran yang dikuasai)
```

**Contoh Data:**
```json
// Tabel User
{
  "id": "usr_002",
  "email": "tutor@example.com",
  "name": "Dr. Siti Nurhaliza",
  "role": "TUTOR",
  "authId": "auth_456"
}

// Tabel TutorProfile
{
  "id": "tp_001",
  "userId": "usr_002",
  "bio": "Guru Matematika berpengalaman 10 tahun",
  "subjects": ["Matematika", "Fisika"]
}
```

---

### **C. ADMIN** (`role = ADMIN`)

Admin **TIDAK MEMILIKI** profile tambahan. Admin menggunakan tabel `User` saja.

```
User (role: ADMIN)
  │
  └──> ❌ TIDAK ADA PROFILE TAMBAHAN
```

**Contoh Data:**
```json
// Tabel User (HANYA ini saja)
{
  "id": "usr_003",
  "email": "admin@tutornomorsatu.com",
  "name": "Super Admin",
  "role": "ADMIN",
  "authId": "auth_789"
}

// TIDAK ADA record di StudentProfile atau TutorProfile
```

---

## 3. Kenapa Admin Tidak Punya Profile?

### Alasan Desain:

1. **Simplicity**: Admin tidak membutuhkan informasi tambahan seperti grade, school, atau bio
2. **Security**: Admin fokus pada operasional sistem, bukan sebagai pengguna layanan
3. **Separation of Concerns**: Admin berbeda dari user yang menggunakan platform untuk belajar/mengajar

### Fungsi Admin:

Admin memiliki akses ke fitur-fitur manajemen melalui **middleware/authorization**, bukan melalui profile:

```typescript
// Contoh: Middleware check admin
if (user.role === 'ADMIN') {
  // Allow access to:
  // - Manage Users
  // - Approve/Reject Classes
  // - View Analytics
  // - Monitor Payments
  // - System Settings
}
```

---

## 4. Relationship Diagram

```
┌──────────────────┐
│      User        │
│  (Base Table)    │
│                  │
│  role: enum      │
│  - STUDENT       │
│  - TUTOR         │
│  - ADMIN         │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────┐
│ Student │ │  Tutor   │
│ Profile │ │ Profile  │
│ (1:0..1)│ │ (1:0..1) │
└─────────┘ └──────────┘

Note: Admin tidak memiliki profile
```

---

## 5. Query Examples

### Get Student dengan Profile:

```typescript
const student = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    studentProfile: true
  }
});

// Result:
// {
//   id: "usr_001",
//   email: "student@example.com",
//   role: "STUDENT",
//   studentProfile: {
//     grade: "11",
//     school: "SMA Negeri 1"
//   }
// }
```

### Get Tutor dengan Profile:

```typescript
const tutor = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    tutorProfile: true
  }
});

// Result:
// {
//   id: "usr_002",
//   email: "tutor@example.com",
//   role: "TUTOR",
//   tutorProfile: {
//     bio: "Expert in Math",
//     subjects: ["Math", "Physics"]
//   }
// }
```

### Get Admin (tanpa profile):

```typescript
const admin = await prisma.user.findUnique({
  where: { id: userId }
});

// Result:
// {
//   id: "usr_003",
//   email: "admin@example.com",
//   role: "ADMIN"
//   // NO studentProfile or tutorProfile
// }
```

---

## 6. Database Schema (Prisma)

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  phone     String?
  name      String
  avatar    String?
  role      UserRole  @default(STUDENT)
  authId    String    @unique
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  // Relationships (nullable - hanya untuk Student/Tutor)
  studentProfile StudentProfile?
  tutorProfile   TutorProfile?
  
  // Admin tidak memiliki profile tambahan
}

enum UserRole {
  STUDENT
  TUTOR
  ADMIN
}

model StudentProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  grade       String?
  school      String?
  parentName  String?
  parentPhone String?
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model TutorProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  bio       String?  @db.Text
  subjects  String[]
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 7. Summary Table

| Role    | Profile Table     | Extra Info                          |
|---------|-------------------|-------------------------------------|
| STUDENT | StudentProfile    | ✅ grade, school, parent info       |
| TUTOR   | TutorProfile      | ✅ bio, subjects[]                  |
| ADMIN   | ❌ NONE           | ❌ No profile - uses User table only|

---

**Document Version**: 1.0  
**Last Updated**: November 15, 2025  
**Owner**: PT. Tutor Nomor Satu - Development Team
