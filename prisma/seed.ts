import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

// Supabase Admin Client (requires SERVICE_ROLE_KEY)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Default password for all seeded users
const DEFAULT_PASSWORD = "12345678";

/**
 * Create user in Supabase Auth and return the UUID
 * Also stores role in user_metadata for middleware authentication
 */
async function createSupabaseUser(
  email: string,
  name: string,
  role: "ADMIN" | "TUTOR" | "STUDENT"
): Promise<string> {
  // Check if user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email === email);

  if (existingUser) {
    // Update existing user's metadata to ensure role is set
    await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
      user_metadata: { name, role },
    });
    console.log(
      `  ↪ User ${email} already exists, updated metadata with role: ${role}`
    );
    return existingUser.id;
  }

  // Create new user with role in metadata
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true, // Auto-confirm email
    user_metadata: { name, role },
  });

  if (error) {
    throw new Error(
      `Failed to create Supabase user ${email}: ${error.message}`
    );
  }

  console.log(`  ✓ Created Supabase Auth user: ${email} (role: ${role})`);
  return data.user.id;
}

async function main() {
  console.log("🌱 Starting seed...");
  console.log(`📧 Default password for all users: ${DEFAULT_PASSWORD}`);
  console.log("");

  // Verify Supabase connection
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      "❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment variables"
    );
    console.log("   Please add SUPABASE_SERVICE_ROLE_KEY to your .env file");
    process.exit(1);
  }

  // Clean existing Prisma data
  console.log("🧹 Cleaning existing data...");
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;

  // ========================================
  // CREATE ADMIN
  // ========================================
  console.log("\n👤 Creating Admin...");
  const adminId = await createSupabaseUser(
    "admin@nopian.id",
    "Admin Nopian",
    "ADMIN"
  );
  const admin = await prisma.user.create({
    data: {
      id: adminId,
      email: "admin@nopian.id",
      name: "Admin Nopian",
      role: "ADMIN",
    },
  });
  console.log("✅ Created admin:", admin.email);

  // ========================================
  // CREATE TUTORS
  // ========================================
  console.log("\n👨‍🏫 Creating Tutors...");

  const tutor1Id = await createSupabaseUser(
    "budi@nopian.id",
    "Budi Santoso",
    "TUTOR"
  );
  const tutor1 = await prisma.user.create({
    data: {
      id: tutor1Id,
      email: "budi@nopian.id",
      name: "Budi Santoso",
      role: "TUTOR",
      tutorProfile: {
        create: {
          bio: "Pengajar bahasa Inggris berpengalaman 5 tahun",
          subjects: ["English", "Grammar", "Speaking"],
          experience: 5,
          education: "S1 Pendidikan Bahasa Inggris",
        },
      },
    },
    include: { tutorProfile: true },
  });

  const tutor2Id = await createSupabaseUser(
    "siti@nopian.id",
    "Siti Rahayu",
    "TUTOR"
  );
  const tutor2 = await prisma.user.create({
    data: {
      id: tutor2Id,
      email: "siti@nopian.id",
      name: "Siti Rahayu",
      role: "TUTOR",
      tutorProfile: {
        create: {
          bio: "Native-like English speaker, TOEFL certified",
          subjects: ["English", "TOEFL", "IELTS"],
          experience: 8,
          education: "S2 Linguistik",
        },
      },
    },
    include: { tutorProfile: true },
  });
  console.log("✅ Created tutors");

  // ========================================
  // CREATE STUDENTS
  // ========================================
  console.log("\n👨‍🎓 Creating Students...");

  const student1Id = await createSupabaseUser(
    "andi@student.com",
    "Andi Wijaya",
    "STUDENT"
  );
  const student1 = await prisma.user.create({
    data: {
      id: student1Id,
      email: "andi@student.com",
      name: "Andi Wijaya",
      role: "STUDENT",
      studentProfile: {
        create: {
          gradeLevel: "SMA",
          parentPhone: "081234567890",
        },
      },
    },
    include: { studentProfile: true },
  });

  const student2Id = await createSupabaseUser(
    "dewi@student.com",
    "Dewi Lestari",
    "STUDENT"
  );
  const student2 = await prisma.user.create({
    data: {
      id: student2Id,
      email: "dewi@student.com",
      name: "Dewi Lestari",
      role: "STUDENT",
      studentProfile: {
        create: {
          gradeLevel: "Umum",
          parentPhone: "081234567891",
        },
      },
    },
    include: { studentProfile: true },
  });
  console.log("✅ Created students");

  // ========================================
  // CREATE PROGRAMS (ClassTemplates)
  // ========================================
  console.log("\n📚 Creating Programs...");

  const program1 = await prisma.classTemplate.create({
    data: {
      name: "Private Speaking",
      description: "Kelas speaking 1-on-1 dengan tutor native-like",
      subject: "English",
      gradeLevel: "Dewasa",
      classType: "PRIVATE",
      pricePerMonth: 800000,
      maxStudentsPerSection: 1,
      meetingsPerPeriod: 8,
      periodDays: 30,
      published: true,
    },
  });

  const program2 = await prisma.classTemplate.create({
    data: {
      name: "Semi-Private Grammar",
      description: "Belajar grammar bahasa Inggris dalam kelompok kecil",
      subject: "English",
      gradeLevel: "Umum",
      classType: "SEMI_PRIVATE",
      pricePerMonth: 500000,
      maxStudentsPerSection: 5,
      meetingsPerPeriod: 8,
      periodDays: 30,
      published: true,
    },
  });

  const program3 = await prisma.classTemplate.create({
    data: {
      name: "TOEFL Preparation",
      description: "Persiapan tes TOEFL dengan materi komprehensif",
      subject: "TOEFL",
      gradeLevel: "Dewasa",
      classType: "SEMI_PRIVATE",
      pricePerMonth: 600000,
      maxStudentsPerSection: 4,
      meetingsPerPeriod: 8,
      periodDays: 30,
      published: true,
    },
  });
  console.log("✅ Created programs");

  // ========================================
  // CREATE SECTIONS
  // ========================================
  console.log("\n📋 Creating Sections...");

  const section1 = await prisma.classSection.create({
    data: {
      templateId: program1.id,
      sectionLabel: "A",
      tutorId: tutor1.tutorProfile!.id,
      status: "ACTIVE",
    },
  });

  const section2 = await prisma.classSection.create({
    data: {
      templateId: program2.id,
      sectionLabel: "A",
      tutorId: tutor1.tutorProfile!.id,
      status: "ACTIVE",
    },
  });

  const section3 = await prisma.classSection.create({
    data: {
      templateId: program2.id,
      sectionLabel: "B",
      tutorId: tutor2.tutorProfile!.id,
      status: "ACTIVE",
    },
  });

  const section4 = await prisma.classSection.create({
    data: {
      templateId: program3.id,
      sectionLabel: "A",
      tutorId: tutor2.tutorProfile!.id,
      status: "ACTIVE",
    },
  });
  console.log("✅ Created sections");

  // ========================================
  // CREATE ENROLLMENTS
  // ========================================
  console.log("\n📝 Creating Enrollments...");

  await prisma.enrollment.create({
    data: {
      studentId: student1.studentProfile!.id,
      sectionId: section1.id,
      status: "ACTIVE",
      meetingsRemaining: 6,
      totalMeetings: 8,
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: student1.studentProfile!.id,
      sectionId: section2.id,
      status: "ACTIVE",
      meetingsRemaining: 4,
      totalMeetings: 8,
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: student2.studentProfile!.id,
      sectionId: section2.id,
      status: "ACTIVE",
      meetingsRemaining: 7,
      totalMeetings: 8,
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: student2.studentProfile!.id,
      sectionId: section4.id,
      status: "ACTIVE",
      meetingsRemaining: 8,
      totalMeetings: 8,
    },
  });
  console.log("✅ Created enrollments");

  // ========================================
  // CREATE SAMPLE CONTENT
  // ========================================
  console.log("\n📖 Creating Sample Content...");

  // Materials
  await prisma.material.create({
    data: {
      title: "Introduction to Grammar",
      description: "Basic English grammar fundamentals",
      session: 1, // Pertemuan ke-1
      fileType: "PDF",
      fileUrl: "https://example.com/materials/grammar-intro.pdf",
      sectionId: section2.id,
    },
  });

  await prisma.material.create({
    data: {
      title: "Speaking Practice Video",
      description: "Native speaker pronunciation guide",
      session: 2, // Pertemuan ke-2
      fileType: "VIDEO",
      videoUrl: "https://youtube.com/watch?v=example",
      sectionId: section1.id,
    },
  });

  // Assignments
  const assignment1 = await prisma.assignment.create({
    data: {
      title: "Grammar Exercise Week 1",
      instructions:
        "Complete the grammar exercises on tenses. Download the worksheet and submit your answers.",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      maxPoints: 100,
      sectionId: section2.id,
      status: "PUBLISHED",
    },
  });

  // Quizzes
  const quiz1 = await prisma.quiz.create({
    data: {
      title: "Grammar Quiz 1",
      description: "Test your understanding of basic tenses",
      sectionId: section2.id,
      timeLimit: 30, // Minutes
      passingGrade: 70,
      status: "PUBLISHED",
      questions: {
        create: [
          {
            questionText: 'What is the past tense of "go"?',
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["goed", "went", "gone", "going"],
            correctAnswer: "went",
            orderIndex: 1,
          },
          {
            questionText: "Which sentence is correct?",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: [
              "She don't like coffee",
              "She doesn't likes coffee",
              "She doesn't like coffee",
              "She not like coffee",
            ],
            correctAnswer: "She doesn't like coffee",
            orderIndex: 2,
          },
        ],
      },
    },
  });

  // Live Classes
  await prisma.liveClass.create({
    data: {
      title: "Weekly Speaking Session",
      sectionId: section1.id,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      duration: 60,
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    },
  });

  // Scheduled Meetings
  await prisma.scheduledMeeting.create({
    data: {
      sectionId: section2.id,
      title: "Grammar Session 1",
      description: "Weekly grammar practice session",
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      duration: 90, // 90 minutes
      createdBy: adminId,
    },
  });

  console.log("✅ Created sample content");

  // ========================================
  // SUMMARY
  // ========================================
  console.log("\n" + "=".repeat(50));
  console.log("🎉 Seed completed successfully!");
  console.log("=".repeat(50));
  console.log("\n📧 Login credentials (password: 12345678):");
  console.log("   Admin: admin@nopian.id");
  console.log("   Tutor: budi@nopian.id, siti@nopian.id");
  console.log("   Student: andi@student.com, dewi@student.com");
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
