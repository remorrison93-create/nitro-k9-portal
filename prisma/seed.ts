import { hash } from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // --- Services ---
  // Only the assessment is seeded — it's required for the signup flow to work at all. Real
  // training programs (each a specific lesson count + 30-or-60-min length + price) get added
  // through the admin panel, since pricing varies by lesson length and shouldn't ship as
  // guessed placeholder numbers.
  await prisma.service.upsert({
    where: { id: "svc-assessment" },
    update: {},
    create: {
      id: "svc-assessment",
      name: "Initial Assessment",
      description: "Required first session before starting a training program.",
      priceCents: 10000, // $100.00
      lessonCount: 1,
      lessonLengthMinutes: 60,
      isAssessment: true,
    },
  });

  // --- Helpful links ---
  await prisma.helpfulLink.upsert({
    where: { id: "link-1" },
    update: {},
    create: {
      id: "link-1",
      title: "What to expect at your assessment",
      url: "https://example.com/placeholder",
      description: "Placeholder link — replace with real content.",
      sortOrder: 1,
    },
  });

  // --- Admin user (placeholder password: change immediately) ---
  const passwordHash = await hash("change-me-now", 10);
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
