import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. List all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      createdAt: true,
    }
  });

  console.log('\n=== USERS IN DATABASE ===');
  users.forEach(u => {
    const hasPassword = u.passwordHash && u.passwordHash.length > 0;
    console.log(`  [${hasPassword ? '✅ HAS PASSWORD' : '❌ GOOGLE ONLY'}] ${u.email} (${u.name || 'no name'}) - created: ${u.createdAt}`);
  });

  // 2. Reset password for all users that have empty passwordHash
  const emailToReset = process.argv[2];
  const newPassword = process.argv[3] || 'senha123';

  if (emailToReset) {
    const user = users.find(u => u.email === emailToReset);
    if (!user) {
      console.log(`\n❌ User "${emailToReset}" not found.`);
      return;
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { email: emailToReset }, data: { passwordHash: hashed } });
    console.log(`\n✅ Password reset for ${emailToReset} → new password: "${newPassword}"`);
  } else {
    console.log('\nTip: Run with email and password to reset:');
    console.log('  npx tsx check-db.ts your@email.com newpassword');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());