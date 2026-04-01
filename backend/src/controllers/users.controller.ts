import { Request, Response } from 'express';
import prisma from '../prisma';
import { hashPassword, comparePassword } from '../utils/hash';

export const getProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true, monthlyIncome: true, isAdmin: true },
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

export const updateProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { name, email, monthlyIncome } = req.body;

  const data: any = {}
  if (name !== undefined) data.name = name
  if (email !== undefined) data.email = email
  if (monthlyIncome !== undefined && monthlyIncome !== null && monthlyIncome !== "") {
    // ensure we store as Decimal-compatible string/number
    data.monthlyIncome = monthlyIncome
  } else if (monthlyIncome === null) {
    data.monthlyIncome = null
  }

  const updated = await prisma.user.update({ where: { id: userId }, data });
  // If monthlyIncome was provided in the request, invalidate AI insights so they regenerate
  if (monthlyIncome !== undefined) {
    try {
      await prisma.aIInsight.deleteMany({ where: { userId } });
    } catch (e) {
      // ignore
    }
  }

  res.json({ id: updated.id, email: updated.email, name: updated.name, monthlyIncome: updated.monthlyIncome });
};

export const changePassword = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'currentPassword and newPassword required' });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid current password' });
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  res.json({ message: 'Password changed' });
};
