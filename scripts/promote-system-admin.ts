
import "dotenv/config";

import { prisma } from "../src/lib/db/prisma";

const ADMIN_EMAIL = "admin@gmail.com";

async function promoteSystemAdmin() {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: ADMIN_EMAIL,
      },
      select: {
        id: true,
        name: true,
        email: true,
        systemRole: true,
      },
    });

    if (!user) {
      console.error(`Account not found: ${ADMIN_EMAIL}`);
      process.exitCode = 1;
      return;
    }

    if (user.systemRole === "SYSTEM_ADMIN") {
      console.log("This account is already a System Admin.");
      return;
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        systemRole: "SYSTEM_ADMIN",
      },
    });

    console.log("System Admin promotion successful!");
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log("Role: SYSTEM_ADMIN");
  } catch (error) {
    console.error("Failed to promote System Admin:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

promoteSystemAdmin();
