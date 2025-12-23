<div align="center">
  <img src="public/images/logo-tutor.svg" alt="Tutor Nomor Satu Logo" width="120" />
  
  # Tutor Nomor Satu
  
  **Platform E-Learning Termurah Seindonesia**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
  [![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
  
  [Demo](#demo) • [Fitur](#-fitur-utama) • [Instalasi](#-instalasi) • [Dokumentasi](#-dokumentasi) • [Lisensi](#-lisensi)
</div>

---

## 📖 Tentang

**Tutor Nomor Satu** adalah platform e-learning modern yang dirancang untuk menghubungkan tutor berkualitas dengan siswa di seluruh Indonesia. Platform ini mendukung pembelajaran TOEFL, IELTS, Speaking, dan Math for Kids dengan sistem manajemen kelas yang lengkap.

> 🎓 **Proyek Skripsi** - Dikembangkan sebagai bagian dari skripsi untuk mendemonstrasikan implementasi full-stack web application menggunakan teknologi modern.

## ✨ Fitur Utama

### 👨‍🎓 Untuk Siswa

- 📚 Akses materi pembelajaran kapan saja
- 📝 Mengerjakan quiz dan assignment online
- 📊 Pantau progress belajar
- 💳 Pembayaran online via Midtrans
- 🔔 Notifikasi real-time

### 👨‍🏫 Untuk Tutor

- 📖 Kelola materi dan kelas
- ✏️ Buat quiz dan assignment
- 📈 Grading dan feedback siswa
- 📅 Jadwal kelas live
- 💬 Forum diskusi

### 👨‍💼 Untuk Admin

- 👥 Manajemen pengguna
- 🏫 Kelola program dan section
- 💰 Monitor pembayaran
- 📊 Dashboard analytics
- ⏰ Waiting list management

## 🛠️ Tech Stack

| Category       | Technology                             |
| -------------- | -------------------------------------- |
| **Framework**  | Next.js 15 (App Router)                |
| **Frontend**   | React 19, TailwindCSS 4, shadcn/ui     |
| **Backend**    | Supabase (PostgreSQL + Auth + Storage) |
| **ORM**        | Prisma                                 |
| **Payment**    | Midtrans                               |
| **Language**   | TypeScript                             |
| **Deployment** | Vercel                                 |

## 🚀 Instalasi

### Prerequisites

- Node.js 18+
- npm atau pnpm
- Akun Supabase

### Quick Start

```bash
# Clone repository
git clone https://github.com/nopianpdlh/learning-app.git
cd learning-app

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan kredensial Anda

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📁 Struktur Proyek

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Halaman autentikasi
│   ├── (dashboard)/       # Dashboard (admin, tutor, student)
│   ├── (marketing)/       # Halaman publik
│   └── api/               # API Routes
├── components/            # React components
│   ├── features/          # Feature-specific components
│   ├── layouts/           # Layout components
│   └── ui/                # UI primitives (shadcn)
├── lib/                   # Utilities dan helpers
├── prisma/                # Database schema
└── public/                # Static assets
```

## 📚 Dokumentasi

| Document                                                 | Deskripsi                       |
| -------------------------------------------------------- | ------------------------------- |
| [README.production.md](README.production.md)             | Production deployment guide     |
| [ENV_PRODUCTION_TEMPLATE.md](ENV_PRODUCTION_TEMPLATE.md) | Environment variables reference |
| [docs/skripsi/](docs/skripsi/)                           | Dokumentasi skripsi             |

## 🔐 Environment Variables

Lihat [ENV_PRODUCTION_TEMPLATE.md](ENV_PRODUCTION_TEMPLATE.md) untuk daftar lengkap environment variables yang diperlukan.

Key variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `DATABASE_URL` - PostgreSQL connection string
- `MIDTRANS_SERVER_KEY` - Midtrans server key

## 🧪 Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
```

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

<div align="center">
  <p>Dibuat dengan ❤️ untuk Skripsi</p>
  <p>
    <a href="https://github.com/nopianpdlh">GitHub</a> •
    <a href="mailto:novianfadhilah03@gmail.com">Email</a>
  </p>
</div>
