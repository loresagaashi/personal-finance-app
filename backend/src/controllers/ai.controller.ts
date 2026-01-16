import { Request, Response } from 'express';
import prisma from '../prisma';

// Simple rule-based insights generator
export const generateInsights = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { year, month } = req.query;
  const y = Number(year);
  const m = Number(month);
  // default to current month
  const now = new Date();
  const yy = y || now.getFullYear();
  const mm = m || now.getMonth() + 1;

  const start = new Date(yy, mm - 1, 1);
  const end = new Date(yy, mm, 1);

  // 1) budget overruns
  const budgets = await prisma.budget.findMany({ where: { userId } });
  const insights: any[] = [];
  for (const b of budgets) {
    const spentAgg = await prisma.transaction.aggregate({ where: { userId, categoryId: b.categoryId, type: 'EXPENSE', date: { gte: start, lt: end } }, _sum: { amount: true } });
    const spent = Number(spentAgg._sum.amount ?? 0);
    const limit = Number(b.amount);
    if (spent > limit) {
      insights.push({ title: 'Budget exceeded', message: `You spent ${spent} in ${b.categoryId} which exceeds your budget of ${limit}`, priority: 'HIGH', meta: { categoryId: b.categoryId, spent, limit } });
    } else if (spent > limit * 0.85) {
      insights.push({ title: 'Budget nearly exceeded', message: `You're close to your budget for ${b.categoryId} (${spent}/${limit})`, priority: 'MEDIUM', meta: { categoryId: b.categoryId, spent, limit } });
    }
  }

  // 2) unusual spending: compare to previous month
  const prevStart = new Date(yy, mm - 2, 1);
  const prevEnd = start;
  const currAgg = await prisma.transaction.aggregate({ where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } }, _sum: { amount: true } });
  const prevAgg = await prisma.transaction.aggregate({ where: { userId, type: 'EXPENSE', date: { gte: prevStart, lt: prevEnd } }, _sum: { amount: true } });
  const curr = Number(currAgg._sum.amount ?? 0);
  const prev = Number(prevAgg._sum.amount ?? 0);
  if (prev > 0 && curr > prev * 1.3) {
    insights.push({ title: 'Spending spike', message: `Your expenses increased by ${(((curr - prev) / prev) * 100).toFixed(0)}% vs last month.`, priority: 'MEDIUM', meta: { prev, curr } });
  }

  // rank insights
  const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 } as any;
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  res.json({ insights });
};
