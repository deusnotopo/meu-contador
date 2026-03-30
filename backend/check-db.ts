import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  // Test connection
  await db.$queryRaw`SELECT 1`;
  console.log('✅ Conexão com banco: OK\n');

  // Count users
  const userCount = await db.user.count();
  console.log(`👥 Total de usuários: ${userCount}`);

  // List users
  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      onboardingCompleted: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log('\n📋 Usuários cadastrados:');
  users.forEach((u, i) => {
    console.log(`  ${i+1}. ${u.email} | ${u.name || 'sem nome'} | Onboarding: ${u.onboardingCompleted ? '✅' : '❌'} | Criado: ${u.createdAt.toISOString().split('T')[0]}`);
  });

  // Count other entities
  const txCount = await db.transaction.count();
  const invCount = await db.investment.count();
  const budgetCount = await db.budget.count();
  const goalCount = await db.savingsGoal.count();

  console.log(`\n💰 Total de transações: ${txCount}`);
  console.log(`📈 Total de investimentos: ${invCount}`);
  console.log(`📊 Total de orçamentos: ${budgetCount}`);
  console.log(`🎯 Total de metas: ${goalCount}`);

  await db.$disconnect();
}

main().catch(e => { console.error('❌ Erro:', e.message); process.exit(1); });