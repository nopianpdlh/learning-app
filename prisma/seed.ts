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
  // CREATE TUTOR AVAILABILITY
  // ========================================
  console.log("\n📅 Creating Tutor Availability...");

  // Budi: Senin-Jumat 14:00-21:00
  for (let day = 1; day <= 5; day++) {
    await prisma.tutorAvailability.create({
      data: {
        tutorId: tutor1.tutorProfile!.id,
        dayOfWeek: day,
        startTime: "14:00",
        endTime: "21:00",
      },
    });
  }

  // Siti: Senin-Sabtu 10:00-18:00
  for (let day = 1; day <= 6; day++) {
    await prisma.tutorAvailability.create({
      data: {
        tutorId: tutor2.tutorProfile!.id,
        dayOfWeek: day,
        startTime: "10:00",
        endTime: "18:00",
      },
    });
  }
  console.log("✅ Created tutor availability");

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

  const student3Id = await createSupabaseUser(
    "rino@student.com",
    "Rino Prasetyo",
    "STUDENT"
  );
  const student3 = await prisma.user.create({
    data: {
      id: student3Id,
      email: "rino@student.com",
      name: "Rino Prasetyo",
      role: "STUDENT",
      studentProfile: {
        create: {
          gradeLevel: "Mahasiswa",
          parentPhone: "081234567892",
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
      description:
        "Belajar grammar bahasa Inggris dalam kelompok kecil. Materi lengkap dari dasar hingga mahir.",
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
      description:
        "Persiapan tes TOEFL dengan materi komprehensif. Target skor 500+.",
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

  const program4 = await prisma.classTemplate.create({
    data: {
      name: "Semi-Private Matematika Anak",
      description:
        "Belajar matematika dasar untuk anak SD dengan metode menyenangkan",
      subject: "Matematika",
      gradeLevel: "SD",
      classType: "SEMI_PRIVATE",
      pricePerMonth: 400000,
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

  const section5 = await prisma.classSection.create({
    data: {
      templateId: program4.id,
      sectionLabel: "A",
      tutorId: tutor1.tutorProfile!.id,
      status: "ACTIVE",
    },
  });
  console.log("✅ Created sections");

  // ========================================
  // CREATE ENROLLMENTS
  // ========================================
  console.log("\n📝 Creating Enrollments...");

  const enrollment1 = await prisma.enrollment.create({
    data: {
      studentId: student1.studentProfile!.id,
      sectionId: section1.id,
      status: "ACTIVE",
      meetingsRemaining: 6,
      totalMeetings: 8,
    },
  });

  const enrollment2 = await prisma.enrollment.create({
    data: {
      studentId: student1.studentProfile!.id,
      sectionId: section2.id,
      status: "ACTIVE",
      meetingsRemaining: 4,
      totalMeetings: 8,
    },
  });

  const enrollment3 = await prisma.enrollment.create({
    data: {
      studentId: student2.studentProfile!.id,
      sectionId: section2.id,
      status: "ACTIVE",
      meetingsRemaining: 7,
      totalMeetings: 8,
    },
  });

  const enrollment4 = await prisma.enrollment.create({
    data: {
      studentId: student2.studentProfile!.id,
      sectionId: section4.id,
      status: "ACTIVE",
      meetingsRemaining: 8,
      totalMeetings: 8,
    },
  });

  const enrollment5 = await prisma.enrollment.create({
    data: {
      studentId: student3.studentProfile!.id,
      sectionId: section4.id,
      status: "ACTIVE",
      meetingsRemaining: 6,
      totalMeetings: 8,
    },
  });

  const enrollment6 = await prisma.enrollment.create({
    data: {
      studentId: student3.studentProfile!.id,
      sectionId: section5.id,
      status: "ACTIVE",
      meetingsRemaining: 8,
      totalMeetings: 8,
    },
  });
  console.log("✅ Created enrollments");

  // ========================================
  // CREATE MATERIALS (Based on YouTube Videos)
  // ========================================
  console.log("\n📖 Creating Materials...");

  // Grammar Materials for Section 2 (Semi-Private Grammar - Section A)
  // Real video URLs from YouTube channel @tutornomor1
  const grammarMaterials = [
    {
      title: "Belajar Grammar dari Dasar: Writing Practice (Day 15)",
      description:
        "Materi lengkap tentang berbagai jenis tenses dalam bahasa Inggris. Mencakup Simple, Continuous, dan Perfect tenses.",
      session: 1,
      fileType: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=cZQporvjwTw",
      sectionId: section2.id,
    },
    {
      title: "Belajar Grammar dari Dasar: Gerund vs To Infinitive (Day 16)",
      description:
        "Kapan menggunakan gerund (Verb-ing) dan kapan menggunakan to infinitive.",
      session: 2,
      fileType: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=m3pYNBV5Iv0",
      sectionId: section2.id,
    },
    {
      title: "Belajar Grammar dari Dasar: Noun Clause (Day 17)",
      description:
        "Memahami penggunaan noun clause dalam kalimat bahasa Inggris.",
      session: 3,
      fileType: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=M6vq-2JTUx0",
      sectionId: section2.id,
    },
    {
      title: "Belajar Grammar dari Dasar: Affixes (Day 18)",
      description:
        "Cara membentuk kata dengan menggunakan prefix dan suffix (affixes).",
      session: 4,
      fileType: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=DFjrbZ0adHU",
      sectionId: section2.id,
    },
    {
      title: "Latihan Soal Grammar Causative: Materi Causative",
      description:
        "Memahami penggunaan causative verbs: make, have, get, let dalam kalimat.",
      session: 5,
      fileType: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=VuffKuAEXUs",
      sectionId: section2.id,
    },
    {
      title: "Belajar Grammar dari Dasar: Grammar Test (Day 19)",
      description: "Tes komprehensif untuk mengukur pemahaman grammar.",
      session: 6,
      fileType: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=DtTMVKq7Rz0",
      sectionId: section2.id,
    },
  ];

  for (const material of grammarMaterials) {
    await prisma.material.create({ data: material });
  }

  // TOEFL Materials for Section 4 (TOEFL Preparation)
  // Real video URLs from YouTube channel @tutornomor1
  const toeflMaterials = [
    {
      title: "Belajar TOEFL dari NOL: The Structure of TOEFL (Day 15)",
      description:
        "Pengenalan section Structure dalam tes TOEFL. Membahas tipe-tipe soal dan strategi menjawab.",
      session: 1,
      fileType: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=jlwtv4w8S7k",
      sectionId: section4.id,
    },
    {
      title: "Belajar TOEFL dari NOL: The Structure of TOEFL (Day 16)",
      description: "Latihan intensif soal structure dengan pembahasan detail.",
      session: 2,
      fileType: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=l0123RBlQkc",
      sectionId: section4.id,
    },
    {
      title: "Belajar TOEFL dari NOL: The Structure of TOEFL (Day 17)",
      description:
        "Melanjutkan pembahasan structure TOEFL dengan latihan soal.",
      session: 3,
      fileType: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=5prcI7H9UVo",
      sectionId: section4.id,
    },
    {
      title: "Belajar TOEFL dari NOL: Review Skill 2 Reading (Day 18)",
      description: "Review skill reading comprehension untuk persiapan TOEFL.",
      session: 4,
      fileType: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=dVFwP9mfCuU",
      sectionId: section4.id,
    },
    {
      title: "Belajar TOEFL dari NOL: Review Skill 2 Reading (Day 19)",
      description: "Lanjutan review reading skill dengan pembahasan soal.",
      session: 5,
      fileType: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=yo6ydPij6o4",
      sectionId: section4.id,
    },
    {
      title: "Belajar TOEFL dari NOL: Final Test (Day 19)",
      description:
        "Tes akhir TOEFL untuk mengukur kemampuan secara keseluruhan.",
      session: 6,
      fileType: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=SJcDLUEDnh4",
      sectionId: section4.id,
    },
  ];

  for (const material of toeflMaterials) {
    await prisma.material.create({ data: material });
  }

  // Speaking Materials for Section 1
  await prisma.material.create({
    data: {
      title: "Speaking Practice: Daily Conversations",
      description:
        "Video panduan untuk percakapan sehari-hari dalam bahasa Inggris.",
      session: 1,
      fileType: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=speaking-daily",
      sectionId: section1.id,
    },
  });

  await prisma.material.create({
    data: {
      title: "Pronunciation Guide: Common Mistakes",
      description:
        "Perbaiki pengucapan dengan menghindari kesalahan umum orang Indonesia.",
      session: 2,
      fileType: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=pronunciation-guide",
      sectionId: section1.id,
    },
  });

  console.log("✅ Created materials");

  // ========================================
  // CREATE ASSIGNMENTS
  // ========================================
  console.log("\n📝 Creating Assignments...");

  // Grammar Assignments
  const assignment1 = await prisma.assignment.create({
    data: {
      title: "Writing Practice: Tenses",
      instructions:
        "Tulis 5 paragraf (minimal 100 kata per paragraf) menggunakan minimal 3 jenis tenses berbeda. Jelaskan kegiatan Anda kemarin, hari ini, dan rencana besok.",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxPoints: 100,
      sectionId: section2.id,
      status: "PUBLISHED",
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      title: "Passive Voice Worksheet",
      instructions:
        "Ubah 20 kalimat aktif menjadi kalimat pasif. Download worksheet dari materi dan submit jawabanmu.",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      maxPoints: 100,
      sectionId: section2.id,
      status: "PUBLISHED",
    },
  });

  const assignment3 = await prisma.assignment.create({
    data: {
      title: "Direct-Indirect Speech Exercise",
      instructions:
        "Ubah 15 kalimat langsung ke kalimat tidak langsung (reported speech). Perhatikan perubahan tenses dan kata ganti.",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      maxPoints: 100,
      sectionId: section2.id,
      status: "PUBLISHED",
    },
  });

  // TOEFL Assignments
  const assignment4 = await prisma.assignment.create({
    data: {
      title: "TOEFL Structure Drill",
      instructions:
        "Kerjakan 40 soal structure dari handout yang sudah diberikan. Tulis jawaban beserta alasannya.",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxPoints: 100,
      sectionId: section4.id,
      status: "PUBLISHED",
    },
  });

  const assignment5 = await prisma.assignment.create({
    data: {
      title: "Listening Comprehension Log",
      instructions:
        "Dengarkan 3 audio TOEFL (short conversation, long conversation, dan lecture). Buat ringkasan untuk masing-masing audio minimal 50 kata.",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      maxPoints: 100,
      sectionId: section4.id,
      status: "PUBLISHED",
    },
  });

  const assignment6 = await prisma.assignment.create({
    data: {
      title: "Vocabulary Mastery Test",
      instructions:
        "Buat 30 kalimat menggunakan kata-kata dari TOEFL Vocabulary List. Setiap kalimat harus menunjukkan pemahaman makna kata.",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      maxPoints: 100,
      sectionId: section4.id,
      status: "PUBLISHED",
    },
  });

  console.log("✅ Created assignments");

  // ========================================
  // CREATE QUIZZES WITH QUESTIONS
  // ========================================
  console.log("\n❓ Creating Quizzes...");

  // Quiz 1: Grammar - Types of Tenses
  const quiz1 = await prisma.quiz.create({
    data: {
      title: "Quiz Grammar: Types of Tenses",
      description:
        "Tes pemahaman materi Tenses - Simple, Continuous, Perfect. 10 soal multiple choice.",
      sectionId: section2.id,
      timeLimit: 20,
      passingGrade: 70,
      status: "PUBLISHED",
      questions: {
        create: [
          {
            questionText: "She ___ to school every day.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["go", "goes", "going", "went"],
            correctAnswer: "goes",
            orderIndex: 1,
          },
          {
            questionText: "They ___ studying when I arrived.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["was", "were", "are", "is"],
            correctAnswer: "were",
            orderIndex: 2,
          },
          {
            questionText: "I have ___ my homework.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["finish", "finished", "finishing", "finishes"],
            correctAnswer: "finished",
            orderIndex: 3,
          },
          {
            questionText: "He will ___ the exam tomorrow.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["take", "took", "taken", "taking"],
            correctAnswer: "take",
            orderIndex: 4,
          },
          {
            questionText: "We had ___ dinner before they came.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["eat", "ate", "eaten", "eating"],
            correctAnswer: "eaten",
            orderIndex: 5,
          },
          {
            questionText: "She ___ a book right now.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["reads", "read", "is reading", "has read"],
            correctAnswer: "is reading",
            orderIndex: 6,
          },
          {
            questionText: "By next year, I ___ graduated from university.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["will", "will have", "am", "have"],
            correctAnswer: "will have",
            orderIndex: 7,
          },
          {
            questionText: "The children ___ in the park yesterday.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["play", "plays", "played", "playing"],
            correctAnswer: "played",
            orderIndex: 8,
          },
          {
            questionText: "I ___ never ___ to Japan before.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["have / been", "has / been", "had / go", "was / went"],
            correctAnswer: "have / been",
            orderIndex: 9,
          },
          {
            questionText: "She ___ when the phone rang.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["was sleeping", "slept", "is sleeping", "sleeps"],
            correctAnswer: "was sleeping",
            orderIndex: 10,
          },
        ],
      },
    },
    include: { questions: true },
  });

  // Quiz 2: Grammar - Passive Voice
  const quiz2 = await prisma.quiz.create({
    data: {
      title: "Quiz Grammar: Passive Voice",
      description:
        "Tes pemahaman kalimat pasif dalam bahasa Inggris. 8 soal multiple choice.",
      sectionId: section2.id,
      timeLimit: 15,
      passingGrade: 70,
      status: "PUBLISHED",
      questions: {
        create: [
          {
            questionText: "The letter was ___ by John.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["write", "wrote", "written", "writing"],
            correctAnswer: "written",
            orderIndex: 1,
          },
          {
            questionText: "Ubah ke passive: 'She bakes a cake'",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: [
              "A cake is baked by her",
              "She is baked by a cake",
              "A cake baked by her",
              "A cake was baked by her",
            ],
            correctAnswer: "A cake is baked by her",
            orderIndex: 2,
          },
          {
            questionText: "The window ___ broken by the boy yesterday.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["is", "was", "has been", "will be"],
            correctAnswer: "was",
            orderIndex: 3,
          },
          {
            questionText: "The homework must be ___ before tomorrow.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["submit", "submitted", "submitting", "submits"],
            correctAnswer: "submitted",
            orderIndex: 4,
          },
          {
            questionText:
              "This book ___ by millions of people around the world.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["is read", "reads", "reading", "read"],
            correctAnswer: "is read",
            orderIndex: 5,
          },
          {
            questionText: "The thief ___ by the police last night.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["caught", "was caught", "is caught", "has caught"],
            correctAnswer: "was caught",
            orderIndex: 6,
          },
          {
            questionText: "A new hospital ___ in our town next year.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["will build", "will be built", "is building", "builds"],
            correctAnswer: "will be built",
            orderIndex: 7,
          },
          {
            questionText: "The room ___ already ___ by the time we arrived.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: [
              "had / been cleaned",
              "has / cleaned",
              "was / cleaning",
              "is / clean",
            ],
            correctAnswer: "had / been cleaned",
            orderIndex: 8,
          },
        ],
      },
    },
    include: { questions: true },
  });

  // Quiz 3: TOEFL Structure Practice
  const quiz3 = await prisma.quiz.create({
    data: {
      title: "TOEFL Structure Practice",
      description:
        "Latihan soal TOEFL Section 2: Structure and Written Expression. 10 soal.",
      sectionId: section4.id,
      timeLimit: 25,
      passingGrade: 75,
      status: "PUBLISHED",
      questions: {
        create: [
          {
            questionText: "___ the weather is bad, we will still go hiking.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["Despite", "Although", "Because", "However"],
            correctAnswer: "Although",
            orderIndex: 1,
          },
          {
            questionText:
              "The professor, along with his students, ___ attending the conference.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["is", "are", "were", "have been"],
            correctAnswer: "is",
            orderIndex: 2,
          },
          {
            questionText: "___ in the library, please keep your voice down.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["While", "When", "As", "All of the above"],
            correctAnswer: "All of the above",
            orderIndex: 3,
          },
          {
            questionText:
              "Not only ___ the exam, but she also got the highest score.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: [
              "she passed",
              "did she pass",
              "passed she",
              "she did pass",
            ],
            correctAnswer: "did she pass",
            orderIndex: 4,
          },
          {
            questionText: "The more you practice, ___ you become.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["the better", "better", "the best", "good"],
            correctAnswer: "the better",
            orderIndex: 5,
          },
          {
            questionText: "Had I known about the traffic, I ___ earlier.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["would leave", "would have left", "will leave", "left"],
            correctAnswer: "would have left",
            orderIndex: 6,
          },
          {
            questionText:
              "Neither the teacher nor the students ___ aware of the change.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["is", "are", "was", "were"],
            correctAnswer: "were",
            orderIndex: 7,
          },
          {
            questionText:
              "The scientist ___ research has been groundbreaking won the Nobel Prize.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["who", "whose", "whom", "which"],
            correctAnswer: "whose",
            orderIndex: 8,
          },
          {
            questionText: "It is essential that he ___ on time.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["arrives", "arrive", "arrived", "arriving"],
            correctAnswer: "arrive",
            orderIndex: 9,
          },
          {
            questionText: "Rarely ___ such a talented musician.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["I have seen", "have I seen", "I saw", "did I saw"],
            correctAnswer: "have I seen",
            orderIndex: 10,
          },
        ],
      },
    },
    include: { questions: true },
  });

  // Quiz 4: Quiz Day 14 - Comprehensive Grammar
  const quiz4 = await prisma.quiz.create({
    data: {
      title: "Quiz Grammar Day 14 - Comprehensive Test",
      description:
        "Quiz komprehensif mencakup semua materi grammar yang sudah dipelajari. 10 soal.",
      sectionId: section2.id,
      timeLimit: 30,
      passingGrade: 70,
      status: "PUBLISHED",
      questions: {
        create: [
          {
            questionText: "I wish I ___ harder for the exam.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["study", "studied", "had studied", "have studied"],
            correctAnswer: "had studied",
            orderIndex: 1,
          },
          {
            questionText: "She suggested that we ___ early.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["leave", "left", "leaves", "leaving"],
            correctAnswer: "leave",
            orderIndex: 2,
          },
          {
            questionText: "I enjoy ___ to music while working.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["listen", "to listen", "listening", "listened"],
            correctAnswer: "listening",
            orderIndex: 3,
          },
          {
            questionText: "She made him ___ the dishes.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["wash", "to wash", "washing", "washed"],
            correctAnswer: "wash",
            orderIndex: 4,
          },
          {
            questionText: "He said that he ___ to the party the next day.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["will go", "would go", "goes", "went"],
            correctAnswer: "would go",
            orderIndex: 5,
          },
          {
            questionText: "___ you mind opening the window?",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["Do", "Would", "Could", "Both B and C"],
            correctAnswer: "Both B and C",
            orderIndex: 6,
          },
          {
            questionText: "By the time you arrive, I ___ cooking dinner.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: [
              "will finish",
              "will have finished",
              "finish",
              "finished",
            ],
            correctAnswer: "will have finished",
            orderIndex: 7,
          },
          {
            questionText: "The book ___ is on the table belongs to Mary.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["who", "which", "whose", "whom"],
            correctAnswer: "which",
            orderIndex: 8,
          },
          {
            questionText: "I got my car ___ yesterday.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["repair", "repaired", "repairing", "to repair"],
            correctAnswer: "repaired",
            orderIndex: 9,
          },
          {
            questionText: "He denied ___ the money.",
            questionType: "MULTIPLE_CHOICE",
            points: 10,
            options: ["steal", "to steal", "stealing", "stole"],
            correctAnswer: "stealing",
            orderIndex: 10,
          },
        ],
      },
    },
    include: { questions: true },
  });

  console.log("✅ Created quizzes with questions");

  // ========================================
  // CREATE ASSIGNMENT SUBMISSIONS
  // ========================================
  console.log("\n📤 Creating Assignment Submissions...");

  // Student 1 submitted assignments
  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: student1.studentProfile!.id,
      fileUrl: "https://example.com/submissions/andi-tenses-writing.pdf",
      status: "GRADED",
      score: 85,
      feedback:
        "Bagus! Penggunaan tenses sudah tepat. Perhatikan penggunaan artikel 'a' dan 'the'. Beberapa kalimat perlu diperbaiki struktur subject-verb agreement-nya.",
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // Student 2 submitted assignment (not yet graded)
  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: student2.studentProfile!.id,
      fileUrl: "https://example.com/submissions/dewi-tenses-writing.pdf",
      status: "SUBMITTED",
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // Student 2 submitted TOEFL assignment
  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment4.id,
      studentId: student2.studentProfile!.id,
      fileUrl: "https://example.com/submissions/dewi-toefl-structure.pdf",
      status: "GRADED",
      score: 90,
      feedback:
        "Excellent work! Pemahaman structure sudah sangat baik. Hanya 4 soal yang salah dari 40 soal.",
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      gradedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  // Student 3 submitted TOEFL assignment
  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment4.id,
      studentId: student3.studentProfile!.id,
      fileUrl: "https://example.com/submissions/rino-toefl-structure.pdf",
      status: "GRADED",
      score: 75,
      feedback:
        "Good effort! Perlu lebih banyak latihan pada bagian conditional dan inversion. Review kembali materi Day 10-12.",
      submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      gradedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Created assignment submissions");

  // ========================================
  // CREATE QUIZ ATTEMPTS
  // ========================================
  console.log("\n✏️ Creating Quiz Attempts...");

  // Student 1 attempt on Quiz 1 (Tenses)
  const attempt1 = await prisma.quizAttempt.create({
    data: {
      quizId: quiz1.id,
      studentId: student1.studentProfile!.id,
      score: 80,
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // Create answers for attempt1 (answer 8/10 correctly)
  const quiz1Questions = quiz1.questions;
  for (let i = 0; i < quiz1Questions.length; i++) {
    const q = quiz1Questions[i];
    const isCorrect = i < 8; // First 8 correct, last 2 wrong
    await prisma.quizAnswer.create({
      data: {
        attemptId: attempt1.id,
        questionId: q.id,
        answer: isCorrect ? q.correctAnswer : q.options[0],
        isCorrect,
      },
    });
  }

  // Student 2 attempt on Quiz 1
  const attempt2 = await prisma.quizAttempt.create({
    data: {
      quizId: quiz1.id,
      studentId: student2.studentProfile!.id,
      score: 90,
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  for (let i = 0; i < quiz1Questions.length; i++) {
    const q = quiz1Questions[i];
    const isCorrect = i < 9;
    await prisma.quizAnswer.create({
      data: {
        attemptId: attempt2.id,
        questionId: q.id,
        answer: isCorrect ? q.correctAnswer : q.options[0],
        isCorrect,
      },
    });
  }

  // Student 2 attempt on Quiz 3 (TOEFL)
  const attempt3 = await prisma.quizAttempt.create({
    data: {
      quizId: quiz3.id,
      studentId: student2.studentProfile!.id,
      score: 80,
      submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  const quiz3Questions = quiz3.questions;
  for (let i = 0; i < quiz3Questions.length; i++) {
    const q = quiz3Questions[i];
    const isCorrect = i < 8;
    await prisma.quizAnswer.create({
      data: {
        attemptId: attempt3.id,
        questionId: q.id,
        answer: isCorrect ? q.correctAnswer : q.options[0],
        isCorrect,
      },
    });
  }

  // Student 3 attempt on Quiz 3 (TOEFL)
  const attempt4 = await prisma.quizAttempt.create({
    data: {
      quizId: quiz3.id,
      studentId: student3.studentProfile!.id,
      score: 70,
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  for (let i = 0; i < quiz3Questions.length; i++) {
    const q = quiz3Questions[i];
    const isCorrect = i < 7;
    await prisma.quizAnswer.create({
      data: {
        attemptId: attempt4.id,
        questionId: q.id,
        answer: isCorrect ? q.correctAnswer : q.options[0],
        isCorrect,
      },
    });
  }

  console.log("✅ Created quiz attempts and answers");

  // ========================================
  // CREATE FORUM THREADS AND POSTS
  // ========================================
  console.log("\n💬 Creating Forum Threads...");

  // Thread 1: Grammar discussion
  const thread1 = await prisma.forumThread.create({
    data: {
      sectionId: section2.id,
      authorId: student1.id,
      title: "Kapan pakai Present Perfect vs Simple Past?",
    },
  });

  await prisma.forumPost.createMany({
    data: [
      {
        threadId: thread1.id,
        authorId: student1.id,
        content:
          "Saya masih bingung kapan harus pakai present perfect dan kapan pakai simple past. Apakah ada aturan yang jelas?",
      },
      {
        threadId: thread1.id,
        authorId: tutor1.id,
        content:
          "Pertanyaan bagus Andi! Present Perfect digunakan ketika aksi di masa lalu masih ada hubungannya dengan sekarang, atau waktu spesifiknya tidak penting. Contoh: 'I have visited Bali' (pernah, kapannya tidak penting). Simple Past digunakan untuk aksi yang sudah selesai di waktu tertentu. Contoh: 'I visited Bali last year' (tahun lalu - waktu spesifik).",
      },
      {
        threadId: thread1.id,
        authorId: student2.id,
        content:
          "Oh I see! Jadi kalau kita bilang 'I have eaten' itu artinya sudah makan (dan mungkin masih kenyang), kalau 'I ate at 7am' itu bilang kapannya ya?",
      },
      {
        threadId: thread1.id,
        authorId: tutor1.id,
        content: "Betul sekali Dewi! Kamu sudah paham konsepnya. 👍",
      },
    ],
  });

  // Thread 2: TOEFL question
  const thread2 = await prisma.forumThread.create({
    data: {
      sectionId: section4.id,
      authorId: student2.id,
      title: "Tips untuk Section Listening TOEFL?",
    },
  });

  await prisma.forumPost.createMany({
    data: [
      {
        threadId: thread2.id,
        authorId: student2.id,
        content:
          "Saya merasa kesulitan di section listening, terutama untuk long talks. Ada tips dari tutor atau teman-teman?",
      },
      {
        threadId: thread2.id,
        authorId: tutor2.id,
        content:
          "Hi Dewi! Untuk long talks, fokus pada main idea di awal, lalu cari detail yang ditanya. Jangan coba memahami setiap kata, tapi pahami konteksnya. Biasakan note-taking singkat. Practice setiap hari dengan podcast atau TED talks!",
      },
      {
        threadId: thread2.id,
        authorId: student3.id,
        content:
          "Saya biasanya dengarkan BBC Learning English setiap pagi. Lumayan membantu untuk improve listening skills.",
      },
    ],
  });

  // Thread 3: Study tips
  const thread3 = await prisma.forumThread.create({
    data: {
      sectionId: section2.id,
      authorId: student2.id,
      title: "Share cara belajar grammar yang efektif!",
      isPinned: true,
    },
  });

  await prisma.forumPost.createMany({
    data: [
      {
        threadId: thread3.id,
        authorId: student2.id,
        content:
          "Yuk sharing bagaimana cara kalian belajar grammar! Mungkin bisa saling membantu 😊",
      },
      {
        threadId: thread3.id,
        authorId: student1.id,
        content:
          "Saya biasanya bikin flashcards untuk setiap grammar rule. Terus saya review sebelum tidur. Lumayan efektif buat saya!",
      },
      {
        threadId: thread3.id,
        authorId: tutor1.id,
        content:
          "Good ideas everyone! Saya tambahkan: coba tulis diary dalam bahasa Inggris setiap hari. Apply grammar rules yang baru dipelajari. Learning by doing is the best way! 📚",
      },
    ],
  });

  console.log("✅ Created forum threads and posts");

  // ========================================
  // CREATE SCHEDULED MEETINGS
  // ========================================
  console.log("\n📆 Creating Scheduled Meetings...");

  // Upcoming meetings for section2 (Semi-Private Grammar)
  await prisma.scheduledMeeting.create({
    data: {
      sectionId: section2.id,
      title: "Pertemuan 3: Causative Verbs",
      description:
        "Mempelajari penggunaan causative verbs: make, have, get, let dalam berbagai situasi.",
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      duration: 90,
      meetingUrl: "https://meet.google.com/abc-defg-hij",
      createdBy: adminId,
    },
  });

  await prisma.scheduledMeeting.create({
    data: {
      sectionId: section2.id,
      title: "Pertemuan 4: Direct-Indirect Speech",
      description:
        "Cara mengubah kalimat langsung ke tidak langsung dengan tepat.",
      scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      duration: 90,
      meetingUrl: "https://meet.google.com/abc-defg-hij",
      createdBy: adminId,
    },
  });

  // Past meeting (completed)
  await prisma.scheduledMeeting.create({
    data: {
      sectionId: section2.id,
      title: "Pertemuan 1: Types of Tenses",
      description: "Pengenalan berbagai jenis tenses dalam bahasa Inggris.",
      scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      duration: 90,
      status: "COMPLETED",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
      createdBy: adminId,
      recordingUrl: "https://example.com/recordings/session1.mp4",
    },
  });

  // TOEFL meetings for section4
  await prisma.scheduledMeeting.create({
    data: {
      sectionId: section4.id,
      title: "TOEFL Prep: Structure Drill Session",
      description: "Latihan intensif soal structure TOEFL dengan pembahasan.",
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      duration: 120,
      meetingUrl: "https://zoom.us/j/123456789",
      createdBy: adminId,
    },
  });

  await prisma.scheduledMeeting.create({
    data: {
      sectionId: section4.id,
      title: "TOEFL Prep: Listening Practice",
      description: "Practice listening section dengan audio asli TOEFL.",
      scheduledAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      duration: 120,
      meetingUrl: "https://zoom.us/j/123456789",
      createdBy: adminId,
    },
  });

  // Speaking session for section1
  await prisma.scheduledMeeting.create({
    data: {
      sectionId: section1.id,
      title: "Speaking Practice: Daily Conversations",
      description: "Praktik percakapan sehari-hari secara 1-on-1.",
      scheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      duration: 60,
      meetingUrl: "https://meet.google.com/xyz-uvwx-abc",
      createdBy: adminId,
    },
  });

  console.log("✅ Created scheduled meetings");

  // ========================================
  // CREATE NOTIFICATIONS
  // ========================================
  console.log("\n🔔 Creating Notifications...");

  await prisma.notification.createMany({
    data: [
      {
        userId: student1.id,
        title: "Assignment Graded",
        message:
          "Tugas 'Writing Practice: Tenses' sudah dinilai. Nilai: 85/100",
        type: "assignment_graded",
        read: false,
      },
      {
        userId: student1.id,
        title: "New Material Available",
        message:
          "Materi baru 'Gerund vs To Infinitive' sudah tersedia di kelas Grammar.",
        type: "material_added",
        read: false,
      },
      {
        userId: student2.id,
        title: "Quiz Available",
        message: "Quiz 'TOEFL Structure Practice' sudah bisa dikerjakan.",
        type: "quiz_available",
        read: true,
      },
      {
        userId: student2.id,
        title: "Upcoming Class Reminder",
        message: "Kelas TOEFL Prep akan dimulai besok pukul 10:00 WIB.",
        type: "class_reminder",
        read: false,
      },
      {
        userId: student3.id,
        title: "Assignment Graded",
        message: "Tugas 'TOEFL Structure Drill' sudah dinilai. Nilai: 75/100",
        type: "assignment_graded",
        read: false,
      },
    ],
  });

  console.log("✅ Created notifications");

  // ========================================
  // SUMMARY
  // ========================================
  console.log("\n" + "=".repeat(50));
  console.log("🎉 Seed completed successfully!");
  console.log("=".repeat(50));
  console.log("\n📧 Login credentials (password: 12345678):");
  console.log("   Admin: admin@nopian.id");
  console.log("   Tutor: budi@nopian.id, siti@nopian.id");
  console.log(
    "   Student: andi@student.com, dewi@student.com, rino@student.com"
  );
  console.log("");
  console.log("📊 Seed Data Summary:");
  console.log("   - Users: 6 (1 admin, 2 tutors, 3 students)");
  console.log("   - Programs: 4");
  console.log("   - Sections: 5");
  console.log("   - Enrollments: 6");
  console.log("   - Materials: 14");
  console.log("   - Assignments: 6");
  console.log("   - Quizzes: 4 (with 38 questions total)");
  console.log("   - Quiz Attempts: 4");
  console.log("   - Assignment Submissions: 4");
  console.log("   - Forum Threads: 3 (with 10 posts)");
  console.log("   - Scheduled Meetings: 6");
  console.log("   - Notifications: 5");
  console.log("   - Tutor Availability: 11 slots");
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
