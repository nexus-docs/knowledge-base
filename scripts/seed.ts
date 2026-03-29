import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Tiers ─────────────────────────────────────────
  const tiers = [
    { name: "public",           label: "Public",           rank: 0,   visibility: "public" as const,    description: "Publicly visible to everyone" },
    { name: "client",           label: "Client",           rank: 10,  visibility: "protected" as const, description: "Licensed extension customers" },
    { name: "partner",          label: "Partner",          rank: 20,  visibility: "protected" as const, description: "qoliber agency partners" },
    { name: "gold_partner",     label: "Gold Partner",     rank: 30,  visibility: "protected" as const, description: "Gold tier partners with roadmap access", color: "#f59e0b" },
    { name: "platinum_partner", label: "Platinum Partner", rank: 40,  visibility: "private" as const,   description: "Platinum partners with full internal access", color: "#a855f7" },
    { name: "admin",            label: "Admin",            rank: 100, visibility: "private" as const,   description: "Full system access" },
  ];

  for (const tier of tiers) {
    await prisma.tier.upsert({
      where: { name: tier.name },
      update: { label: tier.label, rank: tier.rank, visibility: tier.visibility, description: tier.description, color: tier.color },
      create: tier,
    });
  }
  console.log(`  Tiers: ${tiers.map((t) => `${t.label} (rank ${t.rank}, ${t.visibility})`).join(", ")}`);

  // ─── Users ─────────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      tier: "admin",
      passwordHash,
      emailVerified: new Date(),
    },
  });
  console.log(`  Admin: ${admin.email} (${admin.id})`);

  const client = await prisma.user.upsert({
    where: { email: "client@example.com" },
    update: {},
    create: {
      email: "client@example.com",
      name: "Client User",
      tier: "client",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  await prisma.userPermission.upsert({
    where: {
      userId_extension: {
        userId: client.id,
        extension: "example/product-a",
      },
    },
    update: {},
    create: {
      userId: client.id,
      extension: "example/product-a",
      grantedBy: admin.id,
    },
  });
  console.log(`  Client: ${client.email} (${client.id}) — example/product-a`);

  const partner = await prisma.user.upsert({
    where: { email: "partner@example.com" },
    update: {},
    create: {
      email: "partner@example.com",
      name: "Partner User",
      tier: "partner",
      passwordHash,
      emailVerified: new Date(),
    },
  });
  console.log(`  Partner: ${partner.email} (${partner.id})`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
