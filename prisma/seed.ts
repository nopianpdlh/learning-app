/**
 * Prisma Seeding Script
 * Run: npx tsx prisma/seed.ts
 *
 * Creates dummy data:
 * - 1 Admin user
 * - 3 Tutor users with profiles
 * - 10 Student users with profiles
 * - 6 Classes (2 per tutor)
 * - 30 Enrollments (students enrolled in classes)
 * - 30 Materials (5 per class)
 * - 18 Assignments (3 per class)
 * - 12 Quizzes (2 per class)
 * - 18 Live Classes (3 per class)
 * - 10 Forum threads with posts
 */

import {
  PrismaClient,
  Role,
  EnrollmentStatus,
  PaymentStatus,
  AssignmentStatus,
  QuizStatus,
  SubmissionStatus,
} from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

// Supabase client for creating auth users
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Dummy data constants
const SUBJECTS = [
  "Matematika",
  "Fisika",
  "Kimia",
  "Biologi",
  "Bahasa Inggris",
  "Bahasa Indonesia",
];
const GRADE_LEVELS = [
  "Kelas 10 SMA",
  "Kelas 11 SMA",
  "Kelas 12 SMA",
  "Kelas 7 SMP",
  "Kelas 8 SMP",
  "Kelas 9 SMP",
];
const SCHEDULES = [
  "Senin & Rabu, 19:00-21:00",
  "Selasa & Kamis, 19:00-21:00",
  "Rabu & Jumat, 20:00-22:00",
  "Sabtu, 14:00-16:00",
  "Minggu, 10:00-12:00",
];

async function createAuthUser(
  email: string,
  password: string,
  name: string,
  role: Role
) {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users.find((u) => u.email === email);

    if (userExists) {
      console.log(`  ⏭️  Auth user already exists: ${email}`);
      return userExists.id;
    }

    // Create auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      },
    });

    if (error) throw error;
    console.log(`  ✅ Created auth user: ${email}`);
    return data.user.id;
  } catch (error) {
    console.error(`  ❌ Failed to create auth user ${email}:`, error);
    throw error;
  }
}

async function seedUsers() {
  console.log("\n📦 Seeding Users...");

  // Create Admin
  console.log("\n👑 Creating Admin...");
  const adminAuthId = await createAuthUser(
    "admin@tutornomorsatu.com",
    "Admin123!",
    "Super Admin",
    Role.ADMIN
  );
  const admin = await prisma.user.upsert({
    where: { id: adminAuthId },
    update: {},
    create: {
      id: adminAuthId,
      email: "admin@tutornomorsatu.com",
      name: "Super Admin",
      role: Role.ADMIN,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    },
  });
  console.log(`✅ Admin created: ${admin.name}`);

  // Create Tutors
  console.log("\n👨‍🏫 Creating Tutors...");
  const tutors = [];
  const tutorData = [
    {
      name: "Dr. Ahmad Santoso",
      email: "ahmad.santoso@tutornomorsatu.com",
      subjects: ["Matematika", "Fisika"],
      experience: 15,
      education: "S3 Matematika - ITB",
    },
    {
      name: "Siti Nurhaliza, M.Pd",
      email: "siti.nurhaliza@tutornomorsatu.com",
      subjects: ["Bahasa Inggris", "Bahasa Indonesia"],
      experience: 10,
      education: "S2 Pendidikan Bahasa - UGM",
    },
    {
      name: "Budi Hartono, S.Si",
      email: "budi.hartono@tutornomorsatu.com",
      subjects: ["Kimia", "Biologi"],
      experience: 8,
      education: "S1 Kimia - UI",
    },
  ];

  for (const [index, data] of tutorData.entries()) {
    const tutorAuthId = await createAuthUser(
      data.email,
      "Tutor123!",
      data.name,
      Role.TUTOR
    );
    const tutor = await prisma.user.upsert({
      where: { id: tutorAuthId },
      update: {},
      create: {
        id: tutorAuthId,
        email: data.email,
        name: data.name,
        role: Role.TUTOR,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=tutor${index}`,
        tutorProfile: {
          create: {
            bio: `Berpengalaman mengajar ${data.subjects.join(
              " dan "
            )} selama ${data.experience} tahun. Lulusan ${
              data.education
            }. Metode pengajaran interaktif dan fokus pada pemahaman konsep.`,
            subjects: data.subjects,
            experience: data.experience,
            education: data.education,
          },
        },
      },
      include: {
        tutorProfile: true,
      },
    });
    tutors.push(tutor);
    console.log(`  ✅ Tutor created: ${tutor.name}`);
  }

  // Create Students
  console.log("\n👨‍🎓 Creating Students...");
  const students = [];
  const studentNames = [
    "Andi Wijaya",
    "Budi Santoso",
    "Citra Dewi",
    "Dian Pratama",
    "Eko Prasetyo",
    "Fitri Handayani",
    "Gita Melati",
    "Hendra Gunawan",
    "Indah Permata",
    "Joko Susilo",
  ];

  for (const [index, name] of studentNames.entries()) {
    const email = `${name.toLowerCase().replace(/\s/g, ".")}@student.com`;
    const studentAuthId = await createAuthUser(
      email,
      "Student123!",
      name,
      Role.STUDENT
    );
    const student = await prisma.user.upsert({
      where: { id: studentAuthId },
      update: {},
      create: {
        id: studentAuthId,
        email,
        name,
        phone: `08${Math.floor(Math.random() * 1000000000)
          .toString()
          .padStart(10, "0")}`,
        role: Role.STUDENT,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=student${index}`,
        studentProfile: {
          create: {
            gradeLevel:
              GRADE_LEVELS[Math.floor(Math.random() * GRADE_LEVELS.length)],
            school:
              index % 2 === 0 ? "SMA Negeri 1 Jakarta" : "SMP Negeri 2 Bandung",
            parentName: `Orang Tua ${name}`,
            parentPhone: `08${Math.floor(Math.random() * 1000000000)
              .toString()
              .padStart(10, "0")}`,
          },
        },
      },
      include: {
        studentProfile: true,
      },
    });
    students.push(student);
    console.log(`  ✅ Student created: ${student.name}`);
  }

  return { admin, tutors, students };
}

async function seedClasses(tutors: any[]) {
  console.log("\n📚 Seeding Classes...");

  const classes = [];
  const classData = [
    {
      name: "Matematika Dasar Kelas 10",
      subject: "Matematika",
      gradeLevel: "Kelas 10 SMA",
      price: 500000,
      description:
        "Pelajari konsep dasar matematika untuk kelas 10 SMA meliputi aljabar, trigonometri, dan geometri.",
    },
    {
      name: "Fisika untuk SMA",
      subject: "Fisika",
      gradeLevel: "Kelas 11 SMA",
      price: 550000,
      description:
        "Memahami konsep fisika dasar: mekanika, termodinamika, gelombang, dan listrik magnet.",
    },
    {
      name: "English Conversation",
      subject: "Bahasa Inggris",
      gradeLevel: "Kelas 10 SMA",
      price: 450000,
      description:
        "Tingkatkan kemampuan speaking dan listening dalam bahasa Inggris.",
    },
    {
      name: "Grammar & Writing",
      subject: "Bahasa Inggris",
      gradeLevel: "Kelas 11 SMA",
      price: 480000,
      description:
        "Kuasai tata bahasa dan teknik menulis esai dalam bahasa Inggris.",
    },
    {
      name: "Kimia Organik",
      subject: "Kimia",
      gradeLevel: "Kelas 12 SMA",
      price: 600000,
      description:
        "Pelajari senyawa organik, reaksi kimia, dan aplikasinya dalam kehidupan sehari-hari.",
    },
    {
      name: "Biologi Sel & Molekuler",
      subject: "Biologi",
      gradeLevel: "Kelas 11 SMA",
      price: 520000,
      description:
        "Memahami struktur dan fungsi sel, genetika, dan bioteknologi.",
    },
  ];

  for (const [index, data] of classData.entries()) {
    const tutorIndex = index % tutors.length;
    const classItem = await prisma.class.create({
      data: {
        name: data.name,
        description: data.description,
        subject: data.subject,
        gradeLevel: data.gradeLevel,
        price: data.price,
        capacity: 20,
        schedule: SCHEDULES[index % SCHEDULES.length],
        thumbnail: `https://picsum.photos/seed/${data.name}/800/400`,
        published: true,
        tutorId: tutors[tutorIndex].tutorProfile!.id,
      },
    });
    classes.push(classItem);
    console.log(`  ✅ Class created: ${classItem.name}`);
  }

  return classes;
}

async function seedEnrollments(students: any[], classes: any[]) {
  console.log("\n📝 Seeding Enrollments...");

  const enrollments = [];

  // Each student enrolls in 3 random classes
  for (const student of students) {
    const shuffled = [...classes].sort(() => Math.random() - 0.5);
    const selectedClasses = shuffled.slice(0, 3);

    for (const classItem of selectedClasses) {
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: student.studentProfile!.id,
          classId: classItem.id,
          status: EnrollmentStatus.ACTIVE,
          enrolledAt: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ), // Random date within last 30 days
          payment: {
            create: {
              amount: classItem.price,
              paymentMethod: ["QRIS", "VA_BCA", "GOPAY"][
                Math.floor(Math.random() * 3)
              ],
              status: PaymentStatus.PAID,
              paidAt: new Date(
                Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
              ),
            },
          },
        },
      });
      enrollments.push(enrollment);
    }
  }

  console.log(`  ✅ Created ${enrollments.length} enrollments`);
  return enrollments;
}

async function seedMaterials(classes: any[]) {
  console.log("\n📄 Seeding Materials...");

  let totalMaterials = 0;

  for (const classItem of classes) {
    // Create 5 materials per class
    for (let i = 1; i <= 5; i++) {
      await prisma.material.create({
        data: {
          classId: classItem.id,
          title: `Materi Pertemuan ${i}: ${classItem.subject}`,
          description: `Materi pembelajaran untuk pertemuan ke-${i}. Mencakup teori, contoh soal, dan latihan.`,
          session: i,
          fileType: i % 3 === 0 ? "VIDEO" : "PDF",
          fileUrl:
            i % 3 === 0
              ? null
              : `https://example.com/materials/${classItem.id}/session-${i}.pdf`,
          videoUrl:
            i % 3 === 0 ? `https://www.youtube.com/embed/dQw4w9WgXcQ` : null,
        },
      });
      totalMaterials++;
    }
  }

  console.log(`  ✅ Created ${totalMaterials} materials`);
}

async function seedAssignments(classes: any[], students: any[]) {
  console.log("\n📋 Seeding Assignments & Submissions...");

  let totalAssignments = 0;
  let totalSubmissions = 0;

  for (const classItem of classes) {
    // Get enrolled students for this class
    const enrolledStudents = await prisma.enrollment.findMany({
      where: { classId: classItem.id },
      include: { student: true },
    });

    // Create 3 assignments per class
    for (let i = 1; i <= 3; i++) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + i * 7); // 7, 14, 21 days from now

      const assignment = await prisma.assignment.create({
        data: {
          classId: classItem.id,
          title: `Tugas ${i}: ${classItem.subject}`,
          instructions: `Kerjakan soal-soal latihan pada bab ${i}. Upload jawaban dalam format PDF.\n\nInstruksi:\n1. Tulis nama dan kelas\n2. Kerjakan dengan rapi\n3. Sertakan cara penyelesaian\n4. Upload sebelum deadline`,
          dueDate,
          maxPoints: 100,
          status: AssignmentStatus.PUBLISHED,
        },
      });
      totalAssignments++;

      // 70% of enrolled students submit the assignment
      const submittingStudents = enrolledStudents
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(enrolledStudents.length * 0.7));

      for (const enrollment of submittingStudents) {
        const submittedAt = new Date(
          dueDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000
        );
        const isLate = submittedAt > dueDate;
        const score = isLate
          ? Math.floor(Math.random() * 30) + 50
          : Math.floor(Math.random() * 30) + 70;

        await prisma.assignmentSubmission.create({
          data: {
            assignmentId: assignment.id,
            studentId: enrollment.studentId,
            fileUrl: `https://example.com/submissions/${assignment.id}/${enrollment.studentId}.pdf`,
            status: SubmissionStatus.GRADED,
            score,
            feedback:
              score >= 80
                ? "Bagus! Pertahankan."
                : score >= 60
                ? "Cukup baik, tingkatkan lagi."
                : "Perlu belajar lebih giat.",
            submittedAt,
            gradedAt: new Date(
              submittedAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000
            ),
          },
        });
        totalSubmissions++;
      }
    }
  }

  console.log(
    `  ✅ Created ${totalAssignments} assignments with ${totalSubmissions} submissions`
  );
}

async function seedQuizzes(classes: any[], students: any[]) {
  console.log("\n📝 Seeding Quizzes & Attempts...");

  let totalQuizzes = 0;
  let totalAttempts = 0;

  for (const classItem of classes) {
    // Get enrolled students for this class
    const enrolledStudents = await prisma.enrollment.findMany({
      where: { classId: classItem.id },
      include: { student: true },
    });

    // Create 2 quizzes per class
    for (let i = 1; i <= 2; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 5); // Started 5 days ago
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10); // Ends 10 days from now

      const quiz = await prisma.quiz.create({
        data: {
          classId: classItem.id,
          title: `Kuis ${i}: ${classItem.subject}`,
          description: `Kuis untuk mengukur pemahaman materi pertemuan 1-${
            i * 2
          }.`,
          timeLimit: 30,
          startDate,
          endDate,
          passingGrade: 70,
          status: QuizStatus.PUBLISHED,
        },
      });
      totalQuizzes++;

      // Create 5 questions per quiz
      const questions = [];
      for (let q = 1; q <= 5; q++) {
        const question = await prisma.quizQuestion.create({
          data: {
            quizId: quiz.id,
            questionType: "MULTIPLE_CHOICE",
            questionText: `Soal ${q}: Pertanyaan tentang ${classItem.subject}?`,
            options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
            correctAnswer: "Pilihan A",
            explanation: "Jawaban A adalah benar karena...",
            points: 20,
            orderIndex: q,
          },
        });
        questions.push(question);
      }

      // 80% of enrolled students attempt the quiz
      const attemptingStudents = enrolledStudents
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(enrolledStudents.length * 0.8));

      for (const enrollment of attemptingStudents) {
        const correctAnswers = Math.floor(Math.random() * 3) + 2; // 2-4 correct answers
        const score = correctAnswers * 20;

        const attempt = await prisma.quizAttempt.create({
          data: {
            quizId: quiz.id,
            studentId: enrollment.studentId,
            startedAt: new Date(
              startDate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000
            ),
            submittedAt: new Date(
              startDate.getTime() +
                Math.random() * 5 * 24 * 60 * 60 * 1000 +
                30 * 60 * 1000
            ),
            score,
          },
        });
        totalAttempts++;

        // Create answers for each question
        for (const [index, question] of questions.entries()) {
          const isCorrect = index < correctAnswers;
          await prisma.quizAnswer.create({
            data: {
              attemptId: attempt.id,
              questionId: question.id,
              answer: isCorrect ? question.correctAnswer : question.options[1],
              isCorrect,
            },
          });
        }
      }
    }
  }

  console.log(
    `  ✅ Created ${totalQuizzes} quizzes with ${totalAttempts} attempts`
  );
}

async function seedLiveClasses(classes: any[]) {
  console.log("\n🎥 Seeding Live Classes...");

  let totalLiveClasses = 0;

  for (const classItem of classes) {
    // Create 3 live classes per class (past, today, future)
    const dates = [
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    ];

    for (const [index, scheduledAt] of dates.entries()) {
      await prisma.liveClass.create({
        data: {
          classId: classItem.id,
          title: `Live Session ${index + 1}: ${classItem.subject}`,
          meetingUrl: `https://meet.google.com/${Math.random()
            .toString(36)
            .substring(7)}`,
          scheduledAt,
          duration: 90,
        },
      });
      totalLiveClasses++;
    }
  }

  console.log(`  ✅ Created ${totalLiveClasses} live classes`);
}

async function seedForums(classes: any[], students: any[], tutors: any[]) {
  console.log("\n💬 Seeding Forum Threads & Posts...");

  let totalThreads = 0;
  let totalPosts = 0;

  // Create 1-2 threads per class
  for (const classItem of classes) {
    const enrolledStudents = await prisma.enrollment.findMany({
      where: { classId: classItem.id },
      include: { student: { include: { user: true } } },
    });

    if (enrolledStudents.length === 0) continue;

    const threadCount = Math.random() > 0.5 ? 2 : 1;

    for (let i = 0; i < threadCount; i++) {
      const authorEnrollment =
        enrolledStudents[Math.floor(Math.random() * enrolledStudents.length)];

      const thread = await prisma.forumThread.create({
        data: {
          classId: classItem.id,
          authorId: authorEnrollment.student.userId,
          title:
            i === 0
              ? `Diskusi: Cara menyelesaikan soal ${classItem.subject}`
              : `Pertanyaan tentang materi pertemuan ${i + 1}`,
        },
      });
      totalThreads++;

      // Create initial post
      const initialPost = await prisma.forumPost.create({
        data: {
          threadId: thread.id,
          authorId: authorEnrollment.student.userId,
          content:
            i === 0
              ? `Halo teman-teman, saya kesulitan memahami cara menyelesaikan soal nomor 5. Apakah ada yang bisa membantu?`
              : `Ada yang bisa jelaskan tentang materi di pertemuan ${
                  i + 1
                }? Saya kurang paham bagian yang dijelaskan tentang konsep dasar.`,
        },
      });
      totalPosts++;

      // Create 2-4 replies
      const replyCount = Math.floor(Math.random() * 3) + 2;
      for (let r = 0; r < replyCount; r++) {
        const randomUser =
          r === 0
            ? tutors[Math.floor(Math.random() * tutors.length)] // First reply from tutor
            : enrolledStudents[
                Math.floor(Math.random() * enrolledStudents.length)
              ].student.user;

        await prisma.forumPost.create({
          data: {
            threadId: thread.id,
            authorId: randomUser.id,
            content:
              r === 0
                ? `Saya bisa bantu jelaskan. Untuk soal ini, kita perlu menggunakan rumus... Coba perhatikan langkah-langkah berikut.`
                : `Saya juga sempat bingung, tapi setelah baca ulang materinya jadi lebih paham. Coba dicek lagi di halaman ${
                    Math.floor(Math.random() * 50) + 1
                  }.`,
            parentId: initialPost.id,
          },
        });
        totalPosts++;
      }
    }
  }

  console.log(`  ✅ Created ${totalThreads} threads with ${totalPosts} posts`);
}

async function seedNotifications(students: any[]) {
  console.log("\n🔔 Seeding Notifications...");

  let totalNotifications = 0;

  for (const student of students) {
    const notificationTypes = [
      {
        type: "ASSIGNMENT",
        title: "Tugas Baru",
        message: "Tugas baru telah dipublikasikan di kelas Matematika Dasar.",
      },
      {
        type: "QUIZ",
        title: "Kuis Tersedia",
        message: "Kuis baru tersedia untuk kelas Fisika untuk SMA.",
      },
      {
        type: "LIVE_CLASS",
        title: "Live Class Besok",
        message: "Live class akan dimulai besok pukul 19:00.",
      },
      {
        type: "PAYMENT",
        title: "Pembayaran Berhasil",
        message: "Pembayaran kelas English Conversation telah dikonfirmasi.",
      },
      {
        type: "FORUM",
        title: "Balasan Forum",
        message: "Ada balasan baru di thread diskusi Anda.",
      },
    ];

    // Create 3-5 notifications per student
    const count = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < count; i++) {
      const notif = notificationTypes[i % notificationTypes.length];
      await prisma.notification.create({
        data: {
          userId: student.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          read: Math.random() > 0.5,
          createdAt: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ),
        },
      });
      totalNotifications++;
    }
  }

  console.log(`  ✅ Created ${totalNotifications} notifications`);
}

async function main() {
  console.log("🌱 Starting database seeding...\n");
  console.log("⚠️  Make sure you have set SUPABASE_SERVICE_ROLE_KEY in .env");

  try {
    // Step 1: Seed Users
    const { admin, tutors, students } = await seedUsers();

    // Step 2: Seed Classes
    const classes = await seedClasses(tutors);

    // Step 3: Seed Enrollments
    await seedEnrollments(students, classes);

    // Step 4: Seed Materials
    await seedMaterials(classes);

    // Step 5: Seed Assignments
    await seedAssignments(classes, students);

    // Step 6: Seed Quizzes
    await seedQuizzes(classes, students);

    // Step 7: Seed Live Classes
    await seedLiveClasses(classes);

    // Step 8: Seed Forums
    await seedForums(classes, students, tutors);

    // Step 9: Seed Notifications
    await seedNotifications(students);

    console.log("\n✅ Seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - 1 Admin user`);
    console.log(`   - ${tutors.length} Tutors`);
    console.log(`   - ${students.length} Students`);
    console.log(`   - ${classes.length} Classes`);
    console.log(`   - 30 Enrollments`);
    console.log(`   - 30 Materials`);
    console.log(`   - 18 Assignments`);
    console.log(`   - 12 Quizzes`);
    console.log(`   - 18 Live Classes`);
    console.log(`   - ~10 Forum threads with posts`);
    console.log(`   - ~40 Notifications`);
    console.log("\n🔑 Login credentials:");
    console.log("   Admin: admin@tutornomorsatu.com / Admin123!");
    console.log("   Tutor: ahmad.santoso@tutornomorsatu.com / Tutor123!");
    console.log("   Student: andi.wijaya@student.com / Student123!");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
