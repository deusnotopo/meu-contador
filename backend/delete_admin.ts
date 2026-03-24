import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  await prisma.user.deleteMany({ where: { email: 'admin@meucontador.com' } });
  console.log('user deleted');
}
run().catch(console.error).finally(() => prisma.$disconnect());
