import { z } from "zod";

export const createEnrollmentSchema = z.object({
  classId: z.string().min(1, "Class ID harus diisi"),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
