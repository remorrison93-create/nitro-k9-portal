import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Placeholder-safe: DATABASE_URL is a dummy connection string until a real
// Postgres instance is provisioned (see .env.example). Prisma will only
// actually try to connect when a query runs, so the app boots fine without one.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder",
});

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
