import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AuthRequest } from './auth';

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.isAdmin) return res.status(403).json({ message: 'Forbidden' });
  next();
};
