import { z } from "zod";

// Step 1: Account credentials
export const accountStepSchema = z
  .object({
    email: z.string().email("Email is not valid"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Step 2: Personal information
export const personalStepSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  phone: z
    .string()
    .min(10, "Phone number is not valid")
    .optional()
    .or(z.literal("")),
});

// Step 3: Student profile
export const profileStepSchema = z.object({
  gradeLevel: z.enum(["SD", "SMP", "SMA", "DEWASA"], {
    message: "Please select a grade level",
  }),
});

// Step 4: Terms acceptance
export const termsStepSchema = z.object({
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the Terms of Service",
  }),
  acceptPrivacy: z.boolean().refine((val) => val === true, {
    message: "You must accept the Privacy Policy",
  }),
  acceptMarketing: z.boolean().optional(),
});

// Combined schema for full registration
export const registerSchema = z
  .object({
    email: z.string().email("Email is not valid"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
    name: z.string().min(3, "Name must be at least 3 characters"),
    phone: z
      .string()
      .min(10, "Phone number is not valid")
      .optional()
      .or(z.literal("")),
    gradeLevel: z.enum(["SD", "SMP", "SMA", "DEWASA"]).optional(),
    acceptTerms: z.boolean(),
    acceptPrivacy: z.boolean(),
    acceptMarketing: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Email is not valid"),
  password: z.string().min(1, "Password is required"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Email is not valid"),
});

// Types
export type AccountStepInput = z.infer<typeof accountStepSchema>;
export type PersonalStepInput = z.infer<typeof personalStepSchema>;
export type ProfileStepInput = z.infer<typeof profileStepSchema>;
export type TermsStepInput = z.infer<typeof termsStepSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
