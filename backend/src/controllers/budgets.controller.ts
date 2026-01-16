import { Request, Response } from 'express';
import prisma from '../prisma';

// POST /budgets
export const createBudget = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { categoryId, amount, month, year } = req.body;
  if (!categoryId || !amount) return res.status(400).json({ message: 'categoryId and amount required' });
  // Validate category ownership (system categories allowed)
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return res.status(400).json({ message: 'Invalid categoryId' });
  if (category.userId && category.userId !== userId) return res.status(403).json({ message: 'Forbidden category' });

  const b = await prisma.budget.create({ data: { userId, categoryId, amount: Number(amount), month, year } });
  res.status(201).json(b);
};

export const listBudgets = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const items = await prisma.budget.findMany({ where: { userId }, include: { category: true } });
  res.json(items);
};

export const getBudgetStatus = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { year, month } = req.query;
  const y = Number(year);
  const m = Number(month);
  if (!y || !m) return res.status(400).json({ message: 'year and month required' });

  const budgets = await prisma.budget.findMany({ where: { userId, OR: [{ year: y, month: m }, { year: null, month: null }] }, include: { category: true } });

  const statuses = await Promise.all(budgets.map(async (b: any) => {
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    const spentAgg = await prisma.transaction.aggregate({ where: { userId, categoryId: b.categoryId, type: 'EXPENSE', date: { gte: start, lt: end } }, _sum: { amount: true } });
    const spent = Number(spentAgg._sum.amount ?? 0);
    const limit = Number(b.amount);
    const status = spent > limit ? 'EXCEEDED' : (spent > limit * 0.8 ? 'WARNING' : 'OK');
    return { budget: b, spent, limit, status };
  }));

  res.json(statuses);
};

export const updateBudget = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const id = req.params.id;
  const b = await prisma.budget.findUnique({ where: { id } });
  if (!b || b.userId !== userId) return res.status(404).json({ message: 'Not found' });
  const { amount, month, year } = req.body;
  const updated = await prisma.budget.update({ where: { id }, data: { amount: amount !== undefined ? Number(amount) : undefined, month, year } });
  res.json(updated);
};

export const deleteBudget = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const id = req.params.id;
  const b = await prisma.budget.findUnique({ where: { id } });
  if (!b || b.userId !== userId) return res.status(404).json({ message: 'Not found' });
  await prisma.budget.delete({ where: { id } });
  res.status(204).send();
};
