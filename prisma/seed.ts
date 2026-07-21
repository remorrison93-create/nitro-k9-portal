import { hash } from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // --- Services (placeholder pricing — update in the admin panel or here) ---
  await prisma.service.upsert({
    where: { id: "svc-assessment" },
    update: {},
    create: {
      id: "svc-assessment",
      name: "Initial Assessment",
      description: "Required first session before starting a training program.",
      priceCents: 10000, // $100.00
      lessonCount: 1,
      lessonLengthMinutesSmall: 60,
      lessonLengthMinutesLarge: 60,
      isAssessment: true,
    },
  });

  const programs = [
    { id: "svc-program-3", lessons: 3, priceCents: 45000 },
    { id: "svc-program-7", lessons: 7, priceCents: 95000 },
    { id: "svc-program-14", lessons: 14, priceCents: 175000 },
    { id: "svc-program-28", lessons: 28, priceCents: 325000 },
  ];

  for (const p of programs) {
    await prisma.service.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        name: `${p.lessons}-Lesson Training Program`,
        description: "Placeholder description — edit price and details in the admin panel.",
        priceCents: p.priceCents,
        lessonCount: p.lessons,
        lessonLengthMinutesSmall: 30,
        lessonLengthMinutesLarge: 60,
      },
    });
  }

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
