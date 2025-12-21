# ==============================================

# Tutor Nomor Satu - Production Environment

# ==============================================

# Copy this file to .env.local or .env.production.local

# and fill in your production values

# Application

NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tutornomorsatu.com

# ==============================================

# SUPABASE CONFIGURATION

# ==============================================

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Connection

DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# ==============================================

# MIDTRANS PAYMENT GATEWAY

# ==============================================

# Production keys (get from Midtrans Dashboard)

MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxxxxxxxxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxxxxxxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=true

# ==============================================

# EMAIL CONFIGURATION

# ==============================================

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@tutornomorsatu.com
SMTP_PASSWORD=your-app-password

# ==============================================

# CRON & SECURITY

# ==============================================

CRON_SECRET=generate-random-32-char-string-here

# ==============================================

# OPTIONAL: ERROR MONITORING

# ==============================================

# SENTRY_DSN=https://xxx@sentry.io/xxx
