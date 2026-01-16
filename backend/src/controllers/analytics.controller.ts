import { Request, Response } from 'express';
import prisma from '../prisma';

// GET /analytics/monthly?year=&month=
export const monthlyOverview = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!year || !month) return res.status(400).json({ message: 'year and month required' });
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const incomeAgg = await prisma.transaction.aggregate({ where: { userId, type: 'INCOME', date: { gte: start, lt: end } }, _sum: { amount: true } });
  const expenseAgg = await prisma.transaction.aggregate({ where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } }, _sum: { amount: true } });

  // category breakdown
  const breakdown = await prisma.transaction.groupBy({ by: ['categoryId', 'type'], where: { userId, date: { gte: start, lt: end } }, _sum: { amount: true } });

  // format for charts
  const categoryTotals: Record<string, number> = {};
  for (const row of breakdown) {
    const cat = row.categoryId;
    const sum = Number(row._sum.amount ?? 0);
    categoryTotals[cat] = (categoryTotals[cat] || 0) + sum;
  }

  res.json({ income: Number(incomeAgg._sum.amount ?? 0), expense: Number(expenseAgg._sum.amount ?? 0), categoryTotals });
};

// GET /analytics/trends?months=6
export const spendingTrends = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const months = Number(req.query.months) || 6;
  const now = new Date();
  const results: Array<{ label: string; income: number; expense: number }> = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    const incomeAgg = await prisma.transaction.aggregate({ where: { userId, type: 'INCOME', date: { gte: start, lt: end } }, _sum: { amount: true } });
    const expenseAgg = await prisma.transaction.aggregate({ where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } }, _sum: { amount: true } });
    results.push({ label: `${y}-${m}`, income: Number(incomeAgg._sum.amount ?? 0), expense: Number(expenseAgg._sum.amount ?? 0) });
  }
  res.json(results);
};
