import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

export const db = prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Handle connection cleanup on shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
