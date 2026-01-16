const prisma = require('../dist/prisma').default;
const bcrypt = require('bcryptjs');

async function run() {
  const email = 'loresa@gmail.com';
  const pwd = 'loresa';
  console.log('Looking up user', email);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error('User not found');
    process.exit(1);
  }
  console.log('User found:', user.id, user.email);
  const ok = await bcrypt.compare(pwd, user.passwordHash);
  console.log('Password valid:', ok);

  // create or find a user category
  let category = await prisma.category.findFirst({ where: { name: 'Smoke Test', userId: user.id } });
  if (!category) {
    category = await prisma.category.create({ data: { name: 'Smoke Test', userId: user.id, color: '#f97316' } });
    console.log('Created category', category.id);
  } else console.log('Category exists', category.id);

  // create a transaction this month
  const now = new Date();
  const tx = await prisma.transaction.create({ data: {
    amount: 42.50,
    type: 'EXPENSE',
    description: 'Smoke test expense',
    date: now,
    userId: user.id,
    categoryId: category.id,
  }});
  console.log('Created transaction', tx.id);

  // create a budget
  const budget = await prisma.budget.create({ data: {
    userId: user.id,
    categoryId: category.id,
    amount: 200.00,
    month: now.getMonth() + 1,
    year: now.getFullYear()
  }});
  console.log('Created budget', budget.id);

  // compute totals for month
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const totals = await prisma.transaction.aggregate({
    where: { userId: user.id, date: { gte: start, lt: end } },
    _sum: { amount: true },
    _count: { id: true }
  });
  console.log('Month totals:', totals);

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
