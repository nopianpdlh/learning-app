/**
 * Email Service
 * Handles sending transactional emails via Resend API
 */

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@tutornomorsatu.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Resend API
 */
async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    // Option 1: Use Resend (recommended for production)
    if (resend && process.env.RESEND_API_KEY) {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      if (error) {
        console.error("Resend API error:", error);
        return false;
      }

      console.log("✅ Email sent successfully:", data?.id);
      return true;
    }

    // Option 2: Log to console (development fallback)
    console.log("📧 Email would be sent (no Resend API key):");
    console.log("To:", params.to);
    console.log("Subject:", params.subject);
    console.log("---");
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

/**
 * Payment confirmation email template
 */
function getPaymentConfirmationTemplate(data: {
  userName: string;
  className: string;
  amount: number;
  transactionId: string;
  paidAt: string;
}): EmailTemplate {
  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(data.amount);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Konfirmasi Pembayaran</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-top: none;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .success-icon {
      font-size: 48px;
      text-align: center;
      margin: 20px 0;
    }
    .details {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .details table {
      width: 100%;
      border-collapse: collapse;
    }
    .details td {
      padding: 8px 0;
    }
    .details td:first-child {
      font-weight: 600;
      color: #6b7280;
      width: 40%;
    }
    .amount {
      font-size: 28px;
      font-weight: bold;
      color: #2563EB;
      text-align: center;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: #2563EB;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Pembayaran Berhasil</h1>
  </div>
  <div class="content">
    <p>Halo <strong>${data.userName}</strong>,</p>
    
    <p>Terima kasih! Pembayaran Anda telah berhasil dikonfirmasi.</p>
    
    <div class="success-icon">🎉</div>
    
    <div class="details">
      <table>
        <tr>
          <td>Kelas</td>
          <td><strong>${data.className}</strong></td>
        </tr>
        <tr>
          <td>ID Transaksi</td>
          <td><code>${data.transactionId}</code></td>
        </tr>
        <tr>
          <td>Tanggal Pembayaran</td>
          <td>${data.paidAt}</td>
        </tr>
      </table>
    </div>
    
    <div class="amount">${formattedAmount}</div>
    
    <p>Selamat! Anda sekarang terdaftar di kelas ini. Anda dapat mulai mengakses materi pembelajaran, tugas, dan kuis.</p>
    
    <div style="text-align: center;">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/student/dashboard" class="button">
        Buka Dashboard Saya
      </a>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
      Jika Anda memiliki pertanyaan, silakan hubungi kami melalui WhatsApp atau email.
    </p>
  </div>
  
  <div class="footer">
    <p><strong>Tutor Nomor Satu</strong></p>
    <p>Platform E-Learning Terpercaya</p>
    <p>© ${new Date().getFullYear()} All rights reserved</p>
  </div>
</body>
</html>
  `;

  const text = `
Pembayaran Berhasil

Halo ${data.userName},

Terima kasih! Pembayaran Anda telah berhasil dikonfirmasi.

Kelas: ${data.className}
Jumlah: ${formattedAmount}
ID Transaksi: ${data.transactionId}
Tanggal: ${data.paidAt}

Anda sekarang dapat mengakses kelas ini di dashboard Anda:
${process.env.NEXT_PUBLIC_APP_URL}/student/dashboard

Selamat belajar!

---
Tutor Nomor Satu
Platform E-Learning Terpercaya
  `;

  return {
    subject: `✅ Pembayaran Berhasil - ${data.className}`,
    html,
    text,
  };
}

/**
 * Enrollment confirmation email (after enrollment created)
 */
function getEnrollmentConfirmationTemplate(data: {
  userName: string;
  className: string;
  paymentUrl: string;
  amount: number;
  expiresAt: string;
}): EmailTemplate {
  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(data.amount);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pendaftaran Kelas</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0;">📚 Pendaftaran Berhasil</h1>
  </div>
  
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p>Halo <strong>${data.userName}</strong>,</p>
    
    <p>Anda telah berhasil mendaftar di kelas:</p>
    <h2 style="color: #2563EB;">${data.className}</h2>
    
    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>⚠️ Menunggu Pembayaran</strong></p>
      <p style="margin: 5px 0 0 0; font-size: 14px;">Silakan selesaikan pembayaran untuk mengaktifkan akses kelas.</p>
    </div>
    
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Jumlah</td>
          <td style="padding: 8px 0; font-size: 20px; font-weight: bold; color: #2563EB;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Batas Waktu</td>
          <td style="padding: 8px 0;">${data.expiresAt}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${
        data.paymentUrl
      }" style="display: inline-block; background: #2563EB; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        💳 Bayar Sekarang
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Link pembayaran berlaku hingga ${
        data.expiresAt
      }. Setelah pembayaran berhasil, Anda akan menerima email konfirmasi.
    </p>
  </div>
  
  <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p><strong>Tutor Nomor Satu</strong></p>
    <p>© ${new Date().getFullYear()} All rights reserved</p>
  </div>
</body>
</html>
  `;

  const text = `
Pendaftaran Berhasil

Halo ${data.userName},

Anda telah berhasil mendaftar di kelas: ${data.className}

Jumlah Pembayaran: ${formattedAmount}
Batas Waktu: ${data.expiresAt}

Silakan lanjutkan pembayaran:
${data.paymentUrl}

---
Tutor Nomor Satu
  `;

  return {
    subject: `📚 Pendaftaran Kelas - ${data.className}`,
    html,
    text,
  };
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(params: {
  to: string;
  userName: string;
  className: string;
  amount: number;
  transactionId: string;
  paidAt: Date;
}): Promise<boolean> {
  const template = getPaymentConfirmationTemplate({
    userName: params.userName,
    className: params.className,
    amount: params.amount,
    transactionId: params.transactionId,
    paidAt: new Intl.DateTimeFormat("id-ID", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(params.paidAt),
  });

  return sendEmail({
    to: params.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send enrollment confirmation email (with payment link)
 */
export async function sendEnrollmentConfirmationEmail(params: {
  to: string;
  userName: string;
  className: string;
  paymentUrl: string;
  amount: number;
  expiresAt: Date;
}): Promise<boolean> {
  const template = getEnrollmentConfirmationTemplate({
    userName: params.userName,
    className: params.className,
    paymentUrl: params.paymentUrl,
    amount: params.amount,
    expiresAt: new Intl.DateTimeFormat("id-ID", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(params.expiresAt),
  });

  return sendEmail({
    to: params.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// ============================================
// LIVE CLASS REMINDER TEMPLATES
// ============================================

/**
 * Live Class Reminder H-1 Template (24 hours before)
 */
function getLiveClassReminderH1Template(data: {
  studentName: string;
  className: string;
  liveClassTitle: string;
  scheduledAt: Date;
  meetingUrl: string;
  duration: number;
}): EmailTemplate {
  const formattedDate = data.scheduledAt.toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563EB; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .info-box { background: white; padding: 15px; border-left: 4px solid #2563EB; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tutor Nomor Satu</h1>
    </div>
    <div class="content">
      <h2>🔔 Pengingat Kelas Live</h2>
      <p>Halo ${data.studentName},</p>
      <p>Ini adalah pengingat bahwa kelas live Anda <strong>dijadwalkan untuk besok</strong>!</p>
      
      <div class="info-box">
        <h3>📚 ${data.liveClassTitle}</h3>
        <p><strong>Kelas:</strong> ${data.className}</p>
        <p><strong>Tanggal & Waktu:</strong> ${formattedDate}</p>
        <p><strong>Durasi:</strong> ${data.duration} menit</p>
      </div>

      <p>Pastikan Anda sudah siap dan bergabung tepat waktu!</p>
      
      <a href="${data.meetingUrl}" class="button">Gabung Meeting</a>
      
      <p style="font-size: 14px; color: #6b7280;">
        Anda akan menerima pengingat lagi 1 jam sebelum kelas dimulai.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Tutor Nomor Satu. All rights reserved.</p>
      <p><a href="${APP_URL}">Buka Dashboard</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Tutor Nomor Satu - Pengingat Kelas Live

Halo ${data.studentName},

Ini adalah pengingat bahwa kelas live Anda dijadwalkan untuk besok!

${data.liveClassTitle}
Kelas: ${data.className}
Tanggal & Waktu: ${formattedDate}
Durasi: ${data.duration} menit

Link Meeting: ${data.meetingUrl}

Pastikan Anda sudah siap dan bergabung tepat waktu!
Anda akan menerima pengingat lagi 1 jam sebelum kelas dimulai.

Buka dashboard Anda: ${APP_URL}
  `;

  return {
    subject: `Pengingat: Kelas Live Besok - ${data.liveClassTitle}`,
    html,
    text,
  };
}

/**
 * Live Class Reminder H-0 Template (1 hour before)
 */
function getLiveClassReminderH0Template(data: {
  studentName: string;
  className: string;
  liveClassTitle: string;
  scheduledAt: Date;
  meetingUrl: string;
  duration: number;
}): EmailTemplate {
  const formattedTime = data.scheduledAt.toLocaleString("id-ID", {
    timeStyle: "short",
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fef2f2; padding: 30px; border: 1px solid #fecaca; }
    .button { display: inline-block; background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .urgent { background: #fee2e2; padding: 15px; border-left: 4px solid #DC2626; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ KELAS LIVE SEGERA DIMULAI!</h1>
    </div>
    <div class="content">
      <h2>Halo ${data.studentName},</h2>
      <p style="font-size: 18px;"><strong>Kelas live Anda akan dimulai dalam 1 JAM!</strong></p>
      
      <div class="urgent">
        <h3>📚 ${data.liveClassTitle}</h3>
        <p><strong>Kelas:</strong> ${data.className}</p>
        <p><strong>Waktu:</strong> ${formattedTime} WIB</p>
        <p><strong>Durasi:</strong> ${data.duration} menit</p>
      </div>

      <p>Bersiaplah untuk bergabung! Pastikan Anda memiliki:</p>
      <ul>
        <li>Koneksi internet yang stabil</li>
        <li>Materi belajar yang sudah siap</li>
        <li>Tempat yang tenang untuk fokus</li>
      </ul>
      
      <a href="${data.meetingUrl}" class="button">🎥 GABUNG SEKARANG</a>
      
      <p style="font-size: 14px; color: #991b1b;">
        Jangan terlambat! Bergabunglah beberapa menit lebih awal untuk memastikan semuanya berjalan dengan baik.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Tutor Nomor Satu. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Tutor Nomor Satu - KELAS LIVE SEGERA DIMULAI!

Halo ${data.studentName},

Kelas live Anda akan dimulai dalam 1 JAM!

${data.liveClassTitle}
Kelas: ${data.className}
Waktu: ${formattedTime} WIB
Durasi: ${data.duration} menit

Link Meeting: ${data.meetingUrl}

Bersiaplah untuk bergabung! Pastikan Anda memiliki:
- Koneksi internet yang stabil
- Materi belajar yang sudah siap
- Tempat yang tenang untuk fokus

Jangan terlambat! Bergabunglah beberapa menit lebih awal untuk memastikan semuanya berjalan dengan baik.
  `;

  return {
    subject: `⏰ Dimulai dalam 1 Jam: ${data.liveClassTitle}`,
    html,
    text,
  };
}

/**
 * Send live class reminder H-1
 */
export async function sendLiveClassReminderH1(params: {
  to: string;
  studentName: string;
  className: string;
  liveClassTitle: string;
  scheduledAt: Date;
  meetingUrl: string;
  duration: number;
}): Promise<boolean> {
  const template = getLiveClassReminderH1Template(params);
  return sendEmail({
    to: params.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send live class reminder H-0
 */
export async function sendLiveClassReminderH0(params: {
  to: string;
  studentName: string;
  className: string;
  liveClassTitle: string;
  scheduledAt: Date;
  meetingUrl: string;
  duration: number;
}): Promise<boolean> {
  const template = getLiveClassReminderH0Template(params);
  return sendEmail({
    to: params.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// ============================================
// FORUM ACTIVITY TEMPLATES
// ============================================

/**
 * Forum Activity Notification Template
 */
function getForumActivityTemplate(data: {
  recipientName: string;
  activityType: "new_thread" | "new_reply";
  threadTitle: string;
  authorName: string;
  className: string;
  contentPreview: string;
  threadUrl: string;
}): EmailTemplate {
  const activityText =
    data.activityType === "new_thread"
      ? "Diskusi baru dibuat"
      : "Balasan baru pada diskusi";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563EB; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .preview-box { background: white; padding: 15px; border-left: 4px solid #2563EB; margin: 20px 0; font-style: italic; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💬 Tutor Nomor Satu</h1>
    </div>
    <div class="content">
      <h2>${activityText}</h2>
      <p>Halo ${data.recipientName},</p>
      <p><strong>${data.authorName}</strong> ${
    data.activityType === "new_thread"
      ? "memulai diskusi baru"
      : "membalas diskusi"
  } di <strong>${data.className}</strong>:</p>
      
      <h3>${data.threadTitle}</h3>
      
      <div class="preview-box">
        ${data.contentPreview}
      </div>

      <a href="${data.threadUrl}" class="button">Lihat Diskusi</a>
      
      <p style="font-size: 14px; color: #6b7280;">
        Bergabunglah dalam percakapan dan bagikan pendapat Anda!
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Tutor Nomor Satu. All rights reserved.</p>
      <p><a href="${APP_URL}/notifications">Kelola Notifikasi</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Tutor Nomor Satu - ${activityText}

Halo ${data.recipientName},

${data.authorName} ${
    data.activityType === "new_thread"
      ? "memulai diskusi baru"
      : "membalas diskusi"
  } di ${data.className}:

${data.threadTitle}

"${data.contentPreview}"

Lihat diskusi lengkap: ${data.threadUrl}

Bergabunglah dalam percakapan dan bagikan pendapat Anda!
  `;

  return {
    subject: `${activityText}: ${data.threadTitle}`,
    html,
    text,
  };
}

/**
 * Send forum activity notification
 */
export async function sendForumActivityNotification(params: {
  to: string;
  recipientName: string;
  activityType: "new_thread" | "new_reply";
  threadTitle: string;
  authorName: string;
  className: string;
  contentPreview: string;
  threadUrl: string;
}): Promise<boolean> {
  const template = getForumActivityTemplate(params);
  return sendEmail({
    to: params.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// ============================================
// ASSIGNMENT & QUIZ REMINDER TEMPLATES
// ============================================

/**
 * Assignment Due Reminder Template
 */
function getAssignmentDueReminderTemplate(data: {
  studentName: string;
  assignmentTitle: string;
  className: string;
  dueDate: Date;
  assignmentUrl: string;
  hoursUntilDue: number;
}): EmailTemplate {
  const formattedDate = data.dueDate.toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fffbeb; padding: 30px; border: 1px solid #fde68a; }
    .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning-box { background: #fef3c7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Pengingat Deadline Tugas</h1>
    </div>
    <div class="content">
      <h2>Halo ${data.studentName},</h2>
      <p>Jangan lupa untuk mengumpulkan tugas Anda!</p>
      
      <div class="warning-box">
        <h3>📝 ${data.assignmentTitle}</h3>
        <p><strong>Kelas:</strong> ${data.className}</p>
        <p><strong>Deadline:</strong> ${formattedDate}</p>
        <p style="color: #92400e; font-weight: bold;">⏰ ${
          data.hoursUntilDue
        } jam lagi!</p>
      </div>

      <p>Kumpulkan pekerjaan Anda sebelum deadline untuk menghindari pemotongan nilai.</p>
      
      <a href="${data.assignmentUrl}" class="button">Kumpulkan Tugas</a>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Tutor Nomor Satu. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Tutor Nomor Satu - Pengingat Deadline Tugas

Halo ${data.studentName},

Jangan lupa untuk mengumpulkan tugas Anda!

${data.assignmentTitle}
Kelas: ${data.className}
Deadline: ${formattedDate}

⏰ ${data.hoursUntilDue} jam lagi!

Kumpulkan tugas Anda: ${data.assignmentUrl}

Kumpulkan sebelum deadline untuk menghindari pemotongan nilai.
  `;

  return {
    subject: `⏰ Deadline Tugas ${
      data.hoursUntilDue === 24 ? "Besok" : "Segera"
    }: ${data.assignmentTitle}`,
    html,
    text,
  };
}

/**
 * Quiz Published Notification Template
 */
function getQuizPublishedTemplate(data: {
  studentName: string;
  quizTitle: string;
  className: string;
  startDate?: Date;
  endDate?: Date;
  quizUrl: string;
}): EmailTemplate {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f0fdf4; padding: 30px; border: 1px solid #bbf7d0; }
    .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .info-box { background: white; padding: 15px; border-left: 4px solid #10B981; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Kuis Baru Tersedia!</h1>
    </div>
    <div class="content">
      <h2>Halo ${data.studentName},</h2>
      <p>Kuis baru telah dipublikasikan di kelas Anda!</p>
      
      <div class="info-box">
        <h3>📊 ${data.quizTitle}</h3>
        <p><strong>Kelas:</strong> ${data.className}</p>
        ${
          data.startDate
            ? `<p><strong>Tersedia dari:</strong> ${data.startDate.toLocaleString(
                "id-ID"
              )}</p>`
            : ""
        }
        ${
          data.endDate
            ? `<p><strong>Ditutup:</strong> ${data.endDate.toLocaleString(
                "id-ID"
              )}</p>`
            : ""
        }
      </div>

      <p>Kerjakan kuis ketika Anda sudah siap!</p>
      
      <a href="${data.quizUrl}" class="button">Mulai Kuis</a>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Tutor Nomor Satu. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Tutor Nomor Satu - Kuis Baru Tersedia

Halo ${data.studentName},

Kuis baru telah dipublikasikan di kelas Anda!

${data.quizTitle}
Kelas: ${data.className}
${
  data.startDate
    ? `Tersedia dari: ${data.startDate.toLocaleString("id-ID")}`
    : ""
}
${data.endDate ? `Ditutup: ${data.endDate.toLocaleString("id-ID")}` : ""}

Kerjakan kuis: ${data.quizUrl}
  `;

  return {
    subject: `📊 Kuis Baru Tersedia: ${data.quizTitle}`,
    html,
    text,
  };
}

/**
 * Send assignment due reminder
 */
export async function sendAssignmentDueReminder(params: {
  to: string;
  studentName: string;
  assignmentTitle: string;
  className: string;
  dueDate: Date;
  assignmentUrl: string;
  hoursUntilDue: number;
}): Promise<boolean> {
  const template = getAssignmentDueReminderTemplate(params);
  return sendEmail({
    to: params.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send quiz published notification
 */
export async function sendQuizPublishedNotification(params: {
  to: string;
  studentName: string;
  quizTitle: string;
  className: string;
  startDate?: Date;
  endDate?: Date;
  quizUrl: string;
}): Promise<boolean> {
  const template = getQuizPublishedTemplate(params);
  return sendEmail({
    to: params.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
