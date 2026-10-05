import { PrismaClient } from "@prisma/client";
import { seedDemoData } from "../src/lib/demo/seed";

const prisma = new PrismaClient();
const force = process.argv.includes("--force");

seedDemoData(prisma, { force })
  .then((r) => {
    console.log(r.seeded ? `Seeded ${r.users} users, ${r.kycCases} KYC cases, ${r.refunds} refunds, ${r.paymentExceptions} payment exceptions.` : "Database already seeded (use --force to reset).");
  })
  .finally(() => prisma.$disconnect());
