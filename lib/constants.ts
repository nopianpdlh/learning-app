export const APP_NAME = "Tutor Nomor Satu";
export const APP_DESCRIPTION = "Platform E-Learning Terpadu";

export const ROLES = {
  ADMIN: "ADMIN",
  TUTOR: "TUTOR",
  STUDENT: "STUDENT",
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  STUDENT_DASHBOARD: "/student/dashboard",
  TUTOR_DASHBOARD: "/tutor/dashboard",
  ADMIN_DASHBOARD: "/admin/dashboard",
} as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];
