const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database (JS)...');

  const systemCategories = [
    { name: 'Groceries', color: '#FF9900', icon: 'shopping-cart' },
    { name: 'Rent', color: '#00A3FF', icon: 'home' },
    { name: 'Utilities', color: '#00C484', icon: 'zap' },
    { name: 'Salary', color: '#6F42C1', icon: 'dollar-sign' },
    { name: 'Entertainment', color: '#FF6B6B', icon: 'film' },
  ];

  for (const c of systemCategories) {
    const exists = await prisma.category.findFirst({ where: { name: c.name } });
    if (!exists) {
      await prisma.category.create({ data: { name: c.name, color: c.color, icon: c.icon } });
    }
  }

  const demoEmail = 'demo@local';
  const existing = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash('demo1234', 10);
    const user = await prisma.user.create({ data: { email: demoEmail, passwordHash, name: 'Demo User' } });
    console.log('Created demo user:', user.id);
  } else {
    console.log('Demo user already exists:', existing.id);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
