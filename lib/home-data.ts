// Static demo data for homepage - real data on detail/enrollment pages

export const programs = [
  {
    id: "cmj0bxuat0000us4kueh6vtyj",
    name: "Semi Private Grammar",
    description:
      "Kelas Eksklusif (1 Tutor, 7 Siswa). Kelas Grammar untuk meningkatkan kemampuan dalam memahami tata bahasa dan kemampuan dalam membuat struktur kalimat Bahasa inggris dengan benar dan akurat.",
    subject: "Bahasa Inggris",
    gradeLevel: "Dewasa",
    classType: "SEMI_PRIVATE",
    pricePerMonth: 214999,
    maxStudentsPerSection: 12,
    meetingsPerPeriod: 16,
    thumbnail:
      "https://yhkvvanmnbgrjayctniw.supabase.co/storage/v1/object/public/thumbnails/programs/1765541435877-Semi-Private_Grammar.webp",
  },
  {
    id: "cmj1li7180000ust8wpqau7k1",
    name: "Semi-Private Matematika Anak",
    description:
      "Kelas Eksklusif (1 Tutor, 5 Siswa). Belajar lebih fokus bersama Tutor yang berpengalaman dan menyenangkan.",
    subject: "Matematika",
    gradeLevel: "Anak",
    classType: "SEMI_PRIVATE",
    pricePerMonth: 185000,
    maxStudentsPerSection: 10,
    meetingsPerPeriod: 8,
    thumbnail:
      "https://yhkvvanmnbgrjayctniw.supabase.co/storage/v1/object/public/thumbnails/programs/1765541411525-Semi-Private-Matematika-Anak.webp",
  },
  {
    id: "cmj1llkza0001ust8tdfxd03p",
    name: "Private Matematika Dewasa",
    description:
      "Kelas Super Eksklusif (1 Tutor, 1 Siswa). Belajar lebih fokus dengan Tutor yang berpengalaman dan menyenangkan.",
    subject: "Matematika",
    gradeLevel: "Dewasa",
    classType: "PRIVATE",
    pricePerMonth: 85000,
    maxStudentsPerSection: 1,
    meetingsPerPeriod: 5,
    thumbnail:
      "https://yhkvvanmnbgrjayctniw.supabase.co/storage/v1/object/public/thumbnails/programs/1765541387871-Private-Bahasa-Inggris-Dewasa.webp",
  },
  {
    id: "cmj4hblrz0000us2clkjokfye",
    name: "Semi-Private Speaking",
    description:
      "Kelas Eksklusif (1 Tutor, 7 Siswa). Kelas Intensive Percakapan untuk meningkatkan kelancaran dan kepercayaan diri.",
    subject: "Bahasa Inggris",
    gradeLevel: "Dewasa",
    classType: "SEMI_PRIVATE",
    pricePerMonth: 235000,
    maxStudentsPerSection: 12,
    meetingsPerPeriod: 16,
    thumbnail:
      "https://yhkvvanmnbgrjayctniw.supabase.co/storage/v1/object/public/thumbnails/programs/1765641432661-Semi-Private-Speaking.webp",
  },
  {
    id: "cmj4hdu230001us2c4g97u0w8",
    name: "Semi-Private TOEFL",
    description:
      "Kelas Intensive Persiapan test TOEFL selama 1 Bulan! untuk mengejar target Score 550++.",
    subject: "Bahasa Inggris",
    gradeLevel: "Dewasa",
    classType: "SEMI_PRIVATE",
    pricePerMonth: 260000,
    maxStudentsPerSection: 7,
    meetingsPerPeriod: 16,
    thumbnail:
      "https://yhkvvanmnbgrjayctniw.supabase.co/storage/v1/object/public/thumbnails/programs/1765641537098-Semi-Private-TOEFL.webp",
  },
  {
    id: "cmj4hfhkh0002us2cmzoywgwb",
    name: "Semi-Private IELTS",
    description:
      "Kelas Intensive Persiapan test IELTS selama 1 Bulan! untuk mengejar target Band 7.5++.",
    subject: "Bahasa Inggris",
    gradeLevel: "Dewasa",
    classType: "SEMI_PRIVATE",
    pricePerMonth: 315000,
    maxStudentsPerSection: 7,
    meetingsPerPeriod: 18,
    thumbnail:
      "https://yhkvvanmnbgrjayctniw.supabase.co/storage/v1/object/public/thumbnails/programs/1765641614250-Semi-Private-IELTS.webp",
  },
];

export const testimonials = [
  {
    id: 1,
    name: "Sarah Putri",
    role: "Siswa TOEFL",
    image: "/images/testimononi/11.webp",
    quote:
      "Nilai TOEFL saya naik dari 450 ke 580 dalam 2 bulan! Tutor-nya sangat sabar dan metode belajarnya mudah dipahami.",
    rating: 5,
  },
  {
    id: 2,
    name: "Ahmad Rizki",
    role: "Siswa Speaking",
    image: "/images/testimononi/12.webp",
    quote:
      "Dulu takut ngomong bahasa Inggris, sekarang sudah lancar dan percaya diri. Terima kasih Tutor Nomor 1!",
    rating: 5,
  },
  {
    id: 3,
    name: "Ibu Rina",
    role: "Orang Tua Siswa",
    image: "/images/testimononi/17.webp",
    quote:
      "Anak saya jadi suka belajar bahasa Inggris. Tutornya menyenangkan dan laporan perkembangan anak sangat membantu.",
    rating: 5,
  },
];

export const stats = [
  { value: "500+", label: "Siswa Aktif" },
  { value: "30+", label: "Tutor Berpengalaman" },
  { value: "2000+", label: "Sesi Kelas" },
  { value: "96%", label: "Siswa Puas" },
];

export const features = [
  {
    title: "Kelas Live Interaktif",
    description:
      "Belajar langsung dengan tutor melalui Zoom Premium, bukan video rekaman.",
    icon: "video",
  },
  {
    title: "Materi Premium",
    description:
      "Akses ke modul, buku, dan rekaman pembelajaran berkualitas tinggi.",
    icon: "book",
  },
  {
    title: "Quiz & Latihan",
    description:
      "Uji kemampuan dengan quiz interaktif dan dapatkan feedback langsung.",
    icon: "clipboard",
  },
  {
    title: "Progress Tracking",
    description: "Pantau perkembangan belajar dengan laporan yang detail.",
    icon: "chart",
  },
  {
    title: "Sertifikat Resmi",
    description:
      "Raih sertifikat setelah menyelesaikan program untuk kuliah/kerja.",
    icon: "award",
  },
  {
    title: "Tutor Bersertifikat",
    description: "Dibimbing tutor TOEFL & IELTS tersertifikasi, lulusan S2.",
    icon: "user",
  },
];

export const faqs = [
  {
    question: "Apa itu Tutor Nomor Satu?",
    answer:
      "Tutor Nomor Satu adalah platform e-learning yang menyediakan kelas bahasa Inggris dan Matematika secara online. Kami memiliki program Semi-Private (1 Tutor, 5-7 Siswa) dan Private (1 Tutor, 1 Siswa) dengan tutor bersertifikat.",
  },
  {
    question: "Bagaimana cara mendaftar?",
    answer:
      "Cukup klik tombol 'Daftar Sekarang', pilih program yang diinginkan, dan lakukan pembayaran. Setelah itu, Anda akan mendapatkan akses ke kelas dan materi pembelajaran.",
  },
  {
    question: "Berapa biaya kelasnya?",
    answer:
      "Biaya bervariasi mulai dari Rp 85.000/sesi untuk kelas Private hingga Rp 315.000/bulan untuk kelas Semi-Private IELTS. Harga kami TERMURAH dengan kualitas TERBAIK!",
  },
  {
    question: "Kapan jadwal kelasnya?",
    answer:
      "Untuk Semi-Private, kelas dibuka jam 18.45 atau 19.45. Untuk Private, jadwal fleksibel sesuai keinginan siswa. Hubungi admin untuk informasi detail.",
  },
  {
    question: "Apakah ada sertifikat?",
    answer:
      "Ya! Setelah menyelesaikan program, Anda akan mendapatkan sertifikat resmi yang bisa digunakan untuk keperluan kuliah atau kerja.",
  },
  {
    question: "Platform apa yang digunakan untuk kelas?",
    answer:
      "Kami menggunakan Zoom Premium untuk kelas live. Anda juga bisa mengakses rekaman kelas, materi, dan quiz melalui platform kami.",
  },
];

export const whyChooseUs = [
  {
    title: "Suasana Bersahabat",
    description:
      "Belajar dalam suasana yang menyenangkan dan tidak menegangkan.",
    icon: "smile",
  },
  {
    title: "Tutor Berkualitas",
    description:
      "Tutor tersertifikasi TOEFL & IELTS, berpengalaman dan lulusan S2.",
    icon: "graduation",
  },
  {
    title: "Metode Flipped Learning",
    description:
      "Metode belajar modern yang terbukti efektif meningkatkan pemahaman.",
    icon: "lightbulb",
  },
  {
    title: "Individual Approach",
    description:
      "Pendekatan personal sesuai kebutuhan dan kemampuan masing-masing siswa.",
    icon: "target",
  },
  {
    title: "Sangat Hemat Biaya",
    description: "Harga TERMURAH di Indonesia dengan kualitas belajar TERBAIK!",
    icon: "wallet",
  },
  {
    title: "Fleksibel & Praktis",
    description: "Tidak perlu keluar rumah, hemat waktu dan biaya transport.",
    icon: "clock",
  },
];

export const howItWorks = [
  {
    step: 1,
    title: "Daftar Akun",
    description:
      "Buat akun gratis dan pilih program belajar yang sesuai kebutuhan Anda.",
  },
  {
    step: 2,
    title: "Pilih Program",
    description:
      "Pilih antara Semi-Private (kelompok kecil) atau Private (1-on-1) sesuai preferensi.",
  },
  {
    step: 3,
    title: "Mulai Belajar",
    description:
      "Ikuti kelas live, akses materi premium, dan pantau progress belajar Anda.",
  },
];
