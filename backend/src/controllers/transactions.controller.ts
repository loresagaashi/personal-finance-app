import { Request, Response } from 'express';
import prisma from '../prisma';

async function upsertMonthlySummaryFor(userId: string, d: Date, deltaIncome: number, deltaExpense: number) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const existing = await prisma.monthlySummary.findUnique({ where: { userId_year_month: { userId, year: y, month: m } } }).catch(() => null);
  if (existing) {
    await prisma.monthlySummary.update({ where: { id: existing.id }, data: { totalIncome: { increment: deltaIncome }, totalExpense: { increment: deltaExpense } } as any }).catch(() => null);
  } else {
    await prisma.monthlySummary.create({ data: { userId, year: y, month: m, totalIncome: deltaIncome, totalExpense: deltaExpense } }).catch(() => null);
  }
}

// Example request/response shapes are provided inline in comments.

// POST /transactions
// body: { amount: number, type: 'INCOME'|'EXPENSE', categoryId: string, description?: string, date?: string }
export const createTransaction = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { amount, type, categoryId, description, date } = req.body;
  if (!amount || !type || !categoryId) return res.status(400).json({ message: 'amount, type and categoryId required' });

  // Validate category belongs to user or is a system category
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return res.status(400).json({ message: 'Invalid categoryId' });
  if (category.userId && category.userId !== userId) return res.status(403).json({ message: 'Forbidden category' });

  const tx = await prisma.transaction.create({
    data: {
      amount: Number(amount),
      type,
      categoryId,
      description,
      date: date ? new Date(date) : new Date(),
      userId,
    },
    include: { category: true },
  });
  // Invalidate AI insights cache for this user
  try {
    await prisma.aIInsight.deleteMany({ where: { userId } });
  } catch (e) {}

  // Update monthly summary totals
  try {
    const dt = tx.date instanceof Date ? tx.date : new Date(tx.date as any)
    if (tx.type === 'INCOME') {
      await upsertMonthlySummaryFor(userId, dt, Number(tx.amount), 0)
    } else {
      await upsertMonthlySummaryFor(userId, dt, 0, Number(tx.amount))
    }
  } catch (e) {}

  res.status(201).json(tx);
};

// GET /transactions?year=2026&month=1&categoryId=&type=
export const getTransactions = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  const categoryId = req.query.categoryId as string | undefined;
  const type = req.query.type as string | undefined;
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
  const period = req.query.period as string | undefined; // week|month|quarter|year
  const limit = Number(req.query.limit) || 100;
  const offset = Number(req.query.offset) || 0;

  const where: any = { userId };
  if (categoryId) where.categoryId = categoryId;
  if (type) where.type = type;

  // period handling (week/month/quarter/year) or explicit year+month
  if (period) {
    const now = new Date();
    let start: Date | null = null;
    if (period === 'week') {
      const d = new Date(now);
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1);
    } else if (period === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
    }
    if (start) where.date = { gte: start };
  } else if (year && month) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    where.date = { gte: start, lt: end };
  }

  // search q: match description or category.name or exact amount
  if (q && q.length > 0) {
    const amountSearch = Number(q);
    const or: any[] = [{ description: { contains: q, mode: 'insensitive' } }];
    if (!Number.isNaN(amountSearch)) or.push({ amount: amountSearch });
    // category name match
    or.push({ category: { is: { name: { contains: q, mode: 'insensitive' } } } });
    where.OR = or;
  }

  const items = await prisma.transaction.findMany({ where, include: { category: true }, orderBy: { date: 'desc' }, skip: offset, take: limit });
  res.json(items);
};

// GET /transactions/totals?year=2026&month=1
export const getMonthlyTotals = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!year || !month) return res.status(400).json({ message: 'year and month required' });

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const income = await prisma.transaction.aggregate({
    where: { userId, type: 'INCOME', date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  const expense = await prisma.transaction.aggregate({
    where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } },
    _sum: { amount: true },
  });

  res.json({ income: Number(income._sum.amount ?? 0), expense: Number(expense._sum.amount ?? 0) });
};

export const updateTransaction = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const id = req.params.id;
  const { amount, type, categoryId, description, date } = req.body;
  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx || tx.userId !== userId) return res.status(404).json({ message: 'Not found' });

  // If categoryId is being changed, validate ownership
  if (categoryId && categoryId !== tx.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return res.status(400).json({ message: 'Invalid categoryId' });
    if (category.userId && category.userId !== userId) return res.status(403).json({ message: 'Forbidden category' });
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: { amount: amount !== undefined ? Number(amount) : undefined, type, categoryId, description, date: date ? new Date(date) : undefined },
  });
  // Invalidate AI insights cache
  try {
    await prisma.aIInsight.deleteMany({ where: { userId } });
  } catch (e) {}

  // Adjust monthly summaries: remove old tx impact and add new impact (handle month/year change)
  try {
    const oldDate = tx.date instanceof Date ? tx.date : new Date(tx.date as any)
    const newDate = updated.date instanceof Date ? updated.date : new Date(updated.date as any)
    // subtract old
    if (tx.type === 'INCOME') {
      await upsertMonthlySummaryFor(userId, oldDate, -Number(tx.amount), 0)
    } else {
      await upsertMonthlySummaryFor(userId, oldDate, 0, -Number(tx.amount))
    }
    // add new
    if (updated.type === 'INCOME') {
      await upsertMonthlySummaryFor(userId, newDate, Number(updated.amount), 0)
    } else {
      await upsertMonthlySummaryFor(userId, newDate, 0, Number(updated.amount))
    }
  } catch (e) {}

  res.json(updated);
};

export const deleteTransaction = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const id = req.params.id;
  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx || tx.userId !== userId) return res.status(404).json({ message: 'Not found' });
  await prisma.transaction.delete({ where: { id } });
  try {
    await prisma.aIInsight.deleteMany({ where: { userId } });
  } catch (e) {}
  // subtract from monthly summary
  try {
    const dt = tx.date instanceof Date ? tx.date : new Date(tx.date as any)
    if (tx.type === 'INCOME') {
      await upsertMonthlySummaryFor(userId, dt, -Number(tx.amount), 0)
    } else {
      await upsertMonthlySummaryFor(userId, dt, 0, -Number(tx.amount))
    }
  } catch (e) {}

  res.status(204).send();
};
