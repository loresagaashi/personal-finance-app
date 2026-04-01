import prisma from '../src/prisma';
import { hashPassword } from '../src/utils/hash';

async function main() {
  console.log('Seeding database...');

  // system categories
  const systemCategories = [
    { name: 'Groceries', color: '#FF9900', icon: 'shopping-cart' },
    { name: 'Rent', color: '#00A3FF', icon: 'home' },
    { name: 'Utilities', color: '#00C484', icon: 'zap' },
    { name: 'Salary', color: '#6F42C1', icon: 'dollar-sign' },
    { name: 'Entertainment', color: '#FF6B6B', icon: 'film' },
  ];

  for (const c of systemCategories) {
    await prisma.category.upsert({ where: { name: c.name }, update: {}, create: { name: c.name, color: c.color, icon: c.icon } });
  }

  // demo user
  const demoEmail = 'demo@local';
  const existing = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!existing) {
    const passwordHash = await hashPassword('demo1234');
    const user = await prisma.user.create({ data: { email: demoEmail, passwordHash, name: 'Demo User' } });
    console.log('Created demo user:', user.id);
  }

  // admin user (set isAdmin=true)
  const adminEmail = 'loresa@gmail.com';
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminExists) {
    const passwordHash = await hashPassword('loresa');
    const admin = await prisma.user.create({ data: { email: adminEmail, passwordHash, name: 'Admin', isAdmin: true } });
    console.log('Created admin user:', admin.id);
  } else if (!adminExists.isAdmin) {
    await prisma.user.update({ where: { email: adminEmail }, data: { isAdmin: true } });
    console.log('Updated existing user to admin:', adminEmail);
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
