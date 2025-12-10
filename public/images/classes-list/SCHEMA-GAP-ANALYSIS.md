# Gap Analysis: Current Schema vs New System Design

## Keputusan Bisnis yang Sudah Dikonfirmasi

| Keputusan       | Nilai                                        |
| --------------- | -------------------------------------------- |
| Periode Billing | Rolling 30 hari dari tanggal enroll          |
| Carry Over      | ❌ Tidak bisa, absen = kuota tetap berkurang |
| Trial Period    | ❌ Tidak ada                                 |
| Payment Gateway | Migrasi dari Pakasir → Midtrans              |

---

## Schema Saat Ini vs Kebutuhan Baru

### ✅ Sudah Ada (Bisa Digunakan)

| Model                 | Status            | Catatan                      |
| --------------------- | ----------------- | ---------------------------- |
| `User`                | ✅ OK             | Tidak perlu perubahan        |
| `StudentProfile`      | ✅ OK             | Tidak perlu perubahan        |
| `TutorProfile`        | ✅ OK             | Tidak perlu perubahan        |
| `Material`            | ✅ OK             | Tetap per kelas              |
| `Assignment`          | ✅ OK             | Tetap per kelas              |
| `Quiz`                | ✅ OK             | Tetap per kelas              |
| `LiveClass`           | ⚠️ Perlu Adjust   | Perlu link ke Section        |
| `Payment`             | ⚠️ Perlu Adjust   | Ganti externalId ke Midtrans |
| `Enrollment`          | ⚠️ Perlu Redesign | Perlu major changes          |
| `LiveClassAttendance` | ⚠️ Perlu Adjust   | Track meeting quota          |

### ❌ Belum Ada (Perlu Ditambah)

| Model                | Kebutuhan                        |
| -------------------- | -------------------------------- |
| `ClassTemplate`      | Master data program (10 program) |
| `ClassSection`       | Section A, B, C per template     |
| `SubscriptionPeriod` | Tracking periode 30 hari         |
| `WaitingList`        | Antrian siswa menunggu approval  |
| `MeetingAttendance`  | Track per meeting untuk quota    |

---

## Perbandingan Model CLASS

### Current: Model `Class`

```prisma
model Class {
  id          String   @id
  name        String   // "Semi-Private Grammar"
  description String
  subject     String
  gradeLevel  String
  price       Int
  capacity    Int      // Max siswa
  schedule    String   // Text jadwal
  thumbnail   String?
  published   Boolean
  tutorId     String
  // ... relations
}
```

**Masalah:**

- 1 Class = 1 kelompok siswa
- Tidak bisa split jadi Section A, B, C
- Tidak ada konsep "template" program

### Proposed: Split Menjadi Template + Section

```prisma
// Master data program (10 program)
model ClassTemplate {
  id                   String   @id
  name                 String   // "Semi-Private Grammar"
  description          String
  subject              String
  gradeLevel           String
  classType            ClassType // SEMI_PRIVATE, PRIVATE
  pricePerMonth        Int
  maxStudentsPerSection Int     // 10 untuk semi-private
  meetingsPerMonth     Int      // 8
  thumbnail            String?
  published            Boolean

  sections ClassSection[]
}

// Instance kelas per kelompok (A, B, C...)
model ClassSection {
  id                String   @id
  templateId        String
  sectionLabel      String   // "A", "B", "C"
  tutorId           String
  status            SectionStatus // ACTIVE, FULL, ARCHIVED
  currentEnrollments Int

  template     ClassTemplate @relation(...)
  tutor        TutorProfile @relation(...)
  enrollments  Enrollment[]
  meetings     ScheduledMeeting[] // Live classes per section
}
```

---

## Perbandingan Model ENROLLMENT

### Current

```prisma
model Enrollment {
  id         String
  studentId  String
  classId    String           // Link ke Class
  status     EnrollmentStatus // PENDING, PAID, ACTIVE, COMPLETED
  enrolledAt DateTime

  // ❌ Missing: expiry tracking
  // ❌ Missing: meeting quota
}
```

### Proposed

```prisma
model Enrollment {
  id                String
  studentId         String
  sectionId         String           // Link ke Section (bukan Class)
  status            EnrollmentStatus

  // New fields for subscription
  startDate         DateTime         // Tanggal mulai
  expiryDate        DateTime         // startDate + 30 hari
  meetingsAllowed   Int              // 8
  meetingsAttended  Int              // Counter
  meetingsRemaining Int              // Computed or stored

  // Relations
  section    ClassSection @relation(...)
  attendance MeetingAttendance[]
}
```

---

## Model Baru yang Diperlukan

### 1. WaitingList

```prisma
model WaitingList {
  id          String   @id
  studentId   String
  templateId  String   // Program yang diinginkan
  requestedAt DateTime
  status      WaitingStatus // PENDING, APPROVED, REJECTED, EXPIRED
  approvedAt  DateTime?
  approvedBy  String?      // Admin yang approve
  notes       String?

  student  StudentProfile @relation(...)
  template ClassTemplate  @relation(...)
}

enum WaitingStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}
```

### 2. ScheduledMeeting (Replace LiveClass)

```prisma
model ScheduledMeeting {
  id           String   @id
  sectionId    String           // Per section, bukan per class
  title        String
  scheduledAt  DateTime
  duration     Int
  meetingUrl   String
  status       MeetingStatus
  createdBy    String           // Admin yang buat

  section    ClassSection @relation(...)
  attendance MeetingAttendance[]
}

enum MeetingStatus {
  SCHEDULED
  LIVE
  COMPLETED
  CANCELLED
}
```

### 3. MeetingAttendance (Track Quota)

```prisma
model MeetingAttendance {
  id           String   @id
  meetingId    String
  enrollmentId String
  status       AttendanceStatus
  joinedAt     DateTime?
  leftAt       DateTime?

  // Tracking for quota
  countedTowardsQuota Boolean @default(true)

  meeting    ScheduledMeeting @relation(...)
  enrollment Enrollment       @relation(...)

  @@unique([meetingId, enrollmentId])
}

enum AttendanceStatus {
  PRESENT    // Hadir
  ABSENT     // Tidak hadir (tetap kurangi quota)
  EXCUSED    // Izin (optional: tidak kurangi quota)
  PENDING    // Meeting belum selesai
}
```

### 4. Payment Update untuk Midtrans

```prisma
model Payment {
  id            String
  enrollmentId  String
  amount        Int

  // Midtrans specific
  paymentMethod String        // bank_transfer, gopay, qris, etc
  status        PaymentStatus

  // Midtrans IDs
  orderId       String?       // Unique order ID
  transactionId String?       // Midtrans transaction ID
  paymentType   String?       // Midtrans payment type
  vaNumber      String?       // Virtual account number

  paymentUrl    String?       // Snap redirect URL
  expiredAt     DateTime?     // Payment expiry
  paidAt        DateTime?

  // Remove old Pakasir field
  // externalId    String?    // ❌ Remove this
}
```

---

## Enum Baru yang Diperlukan

```prisma
enum ClassType {
  SEMI_PRIVATE  // 2-10 siswa per section
  PRIVATE       // 1 siswa per section
  GROUP         // Optional: grup besar
}

enum SectionStatus {
  ACTIVE        // Masih bisa terima siswa
  FULL          // Sudah mencapai max capacity
  ARCHIVED      // Section lama, tidak aktif
}

enum EnrollmentStatus {
  WAITING       // Di waiting list (new)
  PENDING       // Menunggu pembayaran
  ACTIVE        // Aktif, bisa ikut kelas
  EXPIRED       // Periode habis (was: COMPLETED)
  CANCELLED     // Dibatalkan
}
```

---

## Migration Strategy

### Option A: Big Bang Migration (Tidak Direkomendasikan)

- Ubah semua sekaligus
- ⚠️ Risk: Downtime, data loss

### Option B: Gradual Migration (Direkomendasikan ✅)

**Phase 1: Tambah model baru**

- Add ClassTemplate, ClassSection
- Migrate existing Class → ClassTemplate + 1 Section
- Keep old relations working

**Phase 2: Update Enrollment**

- Add new fields (startDate, expiryDate, etc)
- Backfill existing data
- Update aplikasi untuk logic baru

**Phase 3: Add WaitingList**

- Implement waiting list flow
- Admin approval UI

**Phase 4: Migrate Payment to Midtrans**

- Add new Midtrans fields
- Implement Midtrans SDK
- Remove Pakasir integration

---

## Pertanyaan Follow-up

1. **Data Existing**: Apakah sudah ada data siswa/enrollment yang perlu di-migrate?

2. **Section Tutor**: Apakah 1 tutor bisa handle multiple sections dari program yang sama?

3. **Cross-Section Meeting**: Apakah siswa dari Section A bisa ikut meeting Section B jika jadwal bentrok?

4. **Prorated Billing**: Jika siswa daftar di tengah bulan (misal tanggal 15), apakah tetap 8 meeting atau prorated?

5. **Renewal Flow**: Bagaimana flow perpanjangan? Otomatis charge atau manual bayar ulang?
