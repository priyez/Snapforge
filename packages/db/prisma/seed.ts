import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: "dev@screenshot-api.local" },
    update: {},
    create: {
      email: "dev@screenshot-api.local",
      name: "Development User",
      plan: "FREE",
    },
  });

  console.log(`✅ User created: ${user.email} (${user.id})`);

  // Create a test API key
  const rawKey = `sk_live_${randomBytes(32).toString("hex")}`;
  const hashedKey = createHash("sha256").update(rawKey).digest("hex");
  const prefix = `sk_live_${rawKey.slice(8, 16)}`;

  const apiKey = await prisma.apiKey.upsert({
    where: { hashedKey },
    update: {},
    create: {
      name: "Development Key",
      prefix,
      hashedKey,
      userId: user.id,
    },
  });

  console.log(`✅ API Key created: ${apiKey.prefix}...`);
  console.log(`\n🔑 Your development API key (save this!):\n`);
  console.log(`   ${rawKey}\n`);
  console.log(`   Add to your .env or SDK config.\n`);

  // Create a PRO user too
  const proUser = await prisma.user.upsert({
    where: { email: "pro@screenshot-api.local" },
    update: {},
    create: {
      email: "pro@screenshot-api.local",
      name: "Pro User",
      plan: "PRO",
    },
  });

  const proRawKey = `sk_live_${randomBytes(32).toString("hex")}`;
  const proHashedKey = createHash("sha256").update(proRawKey).digest("hex");

  await prisma.apiKey.upsert({
    where: { hashedKey: proHashedKey },
    update: {},
    create: {
      name: "Pro Key",
      prefix: `sk_live_${proRawKey.slice(8, 16)}`,
      hashedKey: proHashedKey,
      userId: proUser.id,
    },
  });

  console.log(`✅ Pro user created: ${proUser.email}`);
  console.log(`🔑 Pro API key: ${proRawKey}\n`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
