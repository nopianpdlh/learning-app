# Tutor Nomor Satu - Production Guide

Platform E-Learning berbasis Next.js 15 dengan Supabase backend.

## 🏗️ Tech Stack

- **Frontend**: Next.js 15. (App Router), React 19, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Payment**: Midtrans
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- Midtrans account (for payments)

### Installation

```bash
# Clone repository
git clone https://github.com/your-repo/learning-app.git
cd learning-app

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

## ⚙️ Environment Variables

See `.env.example` for required variables:

| Variable                        | Description                  |
| ------------------------------- | ---------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key       |
| `DATABASE_URL`                  | PostgreSQL connection string |
| `MIDTRANS_SERVER_KEY`           | Midtrans server key          |
| `MIDTRANS_CLIENT_KEY`           | Midtrans client key          |

## 📦 Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy

```bash
# Build production
npm run build

# Start production server
npm start
```

### Database Migration

```bash
# Push schema to production database
npx prisma db push

# Generate client
npx prisma generate
```

## 🔐 Security Notes

- All secrets stored in environment variables
- RLS enabled on Supabase tables
- HTTPS enforced via Vercel
- Secure HTTP-only cookies for sessions

## 📊 Monitoring

- **Error Tracking**: Sentry (recommended)
- **Analytics**: Vercel Analytics

## 📞 Support

For issues, contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: December 2024
