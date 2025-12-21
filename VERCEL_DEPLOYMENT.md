# 🚀 Panduan Deployment ke Vercel

Dokumen ini berisi langkah-langkah lengkap untuk deploy aplikasi **Tutor Nomor Satu** ke Vercel.

---

## 📋 Daftar Isi

1. [Persiapan Sebelum Deploy](#-persiapan-sebelum-deploy)
2. [Setup Supabase Production](#-setup-supabase-production)
3. [Setup Midtrans Production](#-setup-midtrans-production)
4. [Deploy ke Vercel](#-deploy-ke-vercel)
5. [Konfigurasi Environment Variables](#-konfigurasi-environment-variables)
6. [Setup Cron Jobs](#-setup-cron-jobs)
7. [Domain & SSL](#-domain--ssl)
8. [Post-Deployment Checklist](#-post-deployment-checklist)

---

## 🔧 Persiapan Sebelum Deploy

### 1. Pastikan Semua Dependencies Terinstall

```bash
# Pastikan tidak ada error
npm run build
```

### 2. Pastikan Database Schema Sudah Final

```bash
# Generate Prisma client
npx prisma generate

# Pastikan schema sudah sesuai
npx prisma validate
```

### 3. Push Code ke GitHub

```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 4. Buat Akun yang Diperlukan

- [ ] **Vercel Account**: [vercel.com](https://vercel.com)
- [ ] **Supabase Account**: [supabase.com](https://supabase.com)
- [ ] **Midtrans Account**: [midtrans.com](https://dashboard.midtrans.com)
- [ ] **Domain** (opsional): Beli domain jika belum punya

---

## 🗄️ Setup Supabase Production

### 1. Buat Project Baru di Supabase

1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Klik **New Project**
3. Isi detail:
   - **Name**: `tutor-nomor-satu-prod`
   - **Database Password**: Buat password yang kuat (simpan!)
   - **Region**: Pilih **Singapore** (terdekat dengan Indonesia)
4. Tunggu project selesai dibuat (~2 menit)

### 2. Dapatkan Kredensial

Setelah project ready, pergi ke **Settings > API**:

| Variable                        | Lokasi                      |
| ------------------------------- | --------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project URL                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key             |
| `SUPABASE_SERVICE_ROLE_KEY`     | service_role key (RAHASIA!) |

Untuk Database URL, pergi ke **Settings > Database**:

| Variable       | Lokasi                                     |
| -------------- | ------------------------------------------ |
| `DATABASE_URL` | Connection string > URI (dengan pgbouncer) |
| `DIRECT_URL`   | Connection string > URI (direct)           |

> ⚠️ **Penting**: Ganti `[YOUR-PASSWORD]` di connection string dengan password database Anda

### 3. Push Database Schema

```bash
# Set DATABASE_URL ke production
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Push schema
npx prisma db push
```

### 4. Setup Storage Buckets

Di Supabase Dashboard > Storage, buat buckets:

1. **materials** (untuk materi pembelajaran)
2. **thumbnails** (untuk thumbnail program)
3. **avatars** (untuk foto profil)

Set policies untuk masing-masing bucket sesuai kebutuhan.

### 5. Setup Authentication

Di **Authentication > Providers**:

1. Enable **Email** provider
2. (Opsional) Enable **Google** OAuth:
   - Buat OAuth credentials di Google Cloud Console
   - Masukkan Client ID dan Secret

---

## 💳 Setup Midtrans Production

### 1. Aktifkan Akun Production

1. Login ke [Midtrans Dashboard](https://dashboard.midtrans.com)
2. Lengkapi data bisnis untuk aktivasi production
3. Tunggu approval (~1-3 hari kerja)

### 2. Dapatkan Production Keys

Di **Settings > Access Keys** (mode: Production):

| Variable                          | Nilai                       |
| --------------------------------- | --------------------------- |
| `MIDTRANS_SERVER_KEY`             | Server Key (Mid-server-...) |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Client Key (Mid-client-...) |
| `MIDTRANS_IS_PRODUCTION`          | `true`                      |

### 3. Konfigurasi Payment Notification URL

Di **Settings > Configuration**:

- **Payment Notification URL**: `https://yourdomain.com/api/payment/webhook`
- **Finish Redirect URL**: `https://yourdomain.com/student/payments`
- **Error Redirect URL**: `https://yourdomain.com/student/payments?status=error`

---

## 🌐 Deploy ke Vercel

### 1. Import Project

1. Buka [vercel.com/new](https://vercel.com/new)
2. Pilih **Import Git Repository**
3. Pilih repository `learning-app`
4. Klik **Import**

### 2. Konfigurasi Project

| Setting              | Value                           |
| -------------------- | ------------------------------- |
| **Framework Preset** | Next.js                         |
| **Root Directory**   | ./ (default)                    |
| **Build Command**    | `prisma generate && next build` |
| **Output Directory** | .next (default)                 |
| **Install Command**  | npm install                     |

### 3. Tambahkan Environment Variables

Klik **Environment Variables** dan tambahkan semua variabel (lihat section berikutnya).

### 4. Deploy!

Klik **Deploy** dan tunggu proses selesai (~3-5 menit).

---

## 🔐 Konfigurasi Environment Variables

Di Vercel Dashboard > Project > Settings > Environment Variables, tambahkan:

### Core Application

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Supabase

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### Midtrans

```env
MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxxxxxxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=true
```

### Cron Secret (Opsional)

```env
CRON_SECRET=ggaKG3p4hR7ao1QvpUdHrWztm35ONiiwJ9QVAsRUVzg=
```

> 💡 **Tips**: Generate secret baru dengan: `openssl rand -base64 32`

---

## ⏰ Setup Cron Jobs

### Ya, CRON_SECRET Bisa Digunakan di Vercel!

Vercel mendukung Cron Jobs. Berikut cara setupnya:

### 1. Buat/Update vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/check-enrollments",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/cleanup-expired",
      "schedule": "0 2 * * 0"
    }
  ]
}
```

### 2. Proteksi Cron Endpoint

Dalam API route cron Anda, verifikasi `CRON_SECRET`:

```typescript
// app/api/cron/check-enrollments/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Verifikasi dari Vercel Cron
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Logic cron job...

  return NextResponse.json({ success: true });
}
```

### 3. Cron Schedule Reference

| Schedule       | Arti                        |
| -------------- | --------------------------- |
| `0 0 * * *`    | Setiap hari jam 00:00 UTC   |
| `0 8 * * *`    | Setiap hari jam 08:00 UTC   |
| `0 2 * * 0`    | Setiap Minggu jam 02:00 UTC |
| `*/15 * * * *` | Setiap 15 menit             |

> ⚠️ **Catatan**: Vercel Cron menggunakan timezone UTC. Untuk WIB (UTC+7), kurangi 7 jam.

---

## 🌍 Domain & SSL

### 1. Tambah Custom Domain

1. Pergi ke **Project Settings > Domains**
2. Klik **Add**
3. Masukkan domain Anda (contoh: `tutornomorsatu.com`)
4. Ikuti instruksi DNS

### 2. Konfigurasi DNS

Tambahkan records di DNS provider Anda:

| Type  | Name | Value                |
| ----- | ---- | -------------------- |
| A     | @    | 76.76.21.21          |
| CNAME | www  | cname.vercel-dns.com |

### 3. SSL

Vercel otomatis menyediakan SSL gratis via Let's Encrypt! ✅

---

## ✅ Post-Deployment Checklist

### Segera Setelah Deploy

- [ ] Buka aplikasi dan pastikan homepage load
- [ ] Test login/register
- [ ] Cek koneksi database (buat test user)
- [ ] Verifikasi Supabase Auth berfungsi
- [ ] Test upload file ke Storage

### Testing Pembayaran

- [ ] Buat test enrollment
- [ ] Cek Midtrans Snap muncul
- [ ] Test pembayaran dengan kartu test
- [ ] Verifikasi webhook diterima

### Monitoring

- [ ] Setup Vercel Analytics (sudah include)
- [ ] (Opsional) Setup Sentry untuk error tracking
- [ ] Cek Vercel Logs untuk error

### Security

- [ ] Pastikan semua API routes ter-protect
- [ ] Cek RLS policies di Supabase
- [ ] Verifikasi tidak ada secrets yang terexpose

---

## 🐛 Troubleshooting

### Error: "Prisma Client not generated"

```bash
# Di vercel.json atau build command
"prisma generate && next build"
```

### Error: Database Connection

Pastikan format `DATABASE_URL` benar:

```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true
```

### Error: Build Failed

1. Cek logs di Vercel Dashboard
2. Pastikan semua dependencies terinstall
3. Cek TypeScript errors: `npx tsc --noEmit`

### Cron Jobs Tidak Berjalan

1. Pastikan `vercel.json` ada di root
2. Cek Vercel Dashboard > Cron Jobs tab
3. Verifikasi `CRON_SECRET` sudah diset

---

## 📞 Support

Jika ada masalah:

1. Cek [Vercel Documentation](https://vercel.com/docs)
2. Cek [Supabase Documentation](https://supabase.com/docs)
3. Buka issue di repository

---

**Good luck dengan deployment Anda! 🎉**
