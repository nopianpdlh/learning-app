import { z } from "zod";

export const createClassSchema = z.object({
  name: z
    .string()
    .min(3, "Nama kelas minimal 3 karakter")
    .max(100, "Nama kelas maksimal 100 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  subject: z.string().min(2, "Mata pelajaran harus diisi"),
  gradeLevel: z.string().min(1, "Tingkat kelas harus diisi"),
  price: z.number().min(0, "Harga tidak boleh negatif"),
  capacity: z
    .number()
    .min(1, "Kapasitas minimal 1 siswa")
    .max(100, "Kapasitas maksimal 100 siswa"),
  schedule: z.string().min(5, "Jadwal harus diisi"),
  tutorId: z.string().min(1, "Tutor harus dipilih"),
  thumbnail: z.string().url().optional().or(z.literal("")),
  published: z.boolean().default(false),
});

export const updateClassSchema = createClassSchema.partial();

export const classFilterSchema = z.object({
  subject: z.string().optional(),
  gradeLevel: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  search: z.string().optional(),
  published: z.boolean().optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type ClassFilterInput = z.infer<typeof classFilterSchema>;
