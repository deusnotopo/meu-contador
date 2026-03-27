import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Existing users:', users.map(u => u.email));

  const email = 'test@example.com';
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: 'Test User',
      },
    });
    console.log('Created test user:', newUser.email);
  } else {
    // Force reset password to be sure
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword }
    });
    console.log('Reset password for existing test user:', existingUser.email);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
