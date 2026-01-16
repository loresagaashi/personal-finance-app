import { Request, Response } from 'express';
import prisma from '../prisma';

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
  });
  res.status(201).json(tx);
};

// GET /transactions?year=2026&month=1&categoryId=&type=
export const getTransactions = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  const categoryId = req.query.categoryId as string | undefined;
  const type = req.query.type as string | undefined;

  const where: any = { userId };
  if (categoryId) where.categoryId = categoryId;
  if (type) where.type = type;
  if (year && month) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    where.date = { gte: start, lt: end };
  }

  const items = await prisma.transaction.findMany({ where, orderBy: { date: 'desc' } });
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
  res.json(updated);
};

export const deleteTransaction = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const id = req.params.id;
  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx || tx.userId !== userId) return res.status(404).json({ message: 'Not found' });
  await prisma.transaction.delete({ where: { id } });
  res.status(204).send();
};
