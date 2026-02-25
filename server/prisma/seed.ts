import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (existing) {
    console.log("Admin user already exists, skipping seed.");
    return;
  }

  const hashedPassword = await hash("admin123", 12);

  const user = await prisma.user.create({
    data: {
      username: "admin",
      password: hashedPassword,
      name: "Administrator",
      role: "admin",
    },
  });

  console.log(`Created admin user: ${user.username} (password: admin123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
