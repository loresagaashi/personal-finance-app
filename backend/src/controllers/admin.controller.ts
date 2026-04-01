import { Request, Response } from 'express';
import prisma from '../prisma';

export const listUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, createdAt: true, isAdmin: true } });
  res.json(users);
};

export const getStats = async (req: Request, res: Response) => {
  const totalUsers = await prisma.user.count();
  const totalTransactions = await prisma.transaction.count();
  const revenueAgg = await prisma.transaction.aggregate({ where: { type: 'INCOME' }, _sum: { amount: true } });
  const totalRevenue = Number(revenueAgg._sum.amount ?? 0);
  res.json({ totalUsers, totalTransactions, totalRevenue });
};

export const getUserTransactions = async (req: Request, res: Response) => {
  const userId = req.params.id;
  const txs = await prisma.transaction.findMany({ where: { userId }, orderBy: { date: 'desc' }, include: { category: true } });
  res.json(txs);
};
