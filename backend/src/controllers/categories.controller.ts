import { Request, Response } from 'express';
import prisma from '../prisma';

export const listCategories = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  // system categories: where userId is null
  const system = await prisma.category.findMany({ where: { userId: null } });
  const custom = userId ? await prisma.category.findMany({ where: { userId } }) : [];
  res.json({ system, custom });
};

export const createCategory = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { name, color, icon } = req.body;
  if (!name) return res.status(400).json({ message: 'name required' });
  const cat = await prisma.category.create({ data: { name, color, icon, userId } });
  res.status(201).json(cat);
};

export const updateCategory = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const id = req.params.id;
  const c = await prisma.category.findUnique({ where: { id } });
  if (!c) return res.status(404).json({ message: 'Not found' });
  if (c.userId && c.userId !== userId) return res.status(403).json({ message: 'Forbidden' });
  const { name, color, icon } = req.body;
  const updated = await prisma.category.update({ where: { id }, data: { name, color, icon } });
  res.json(updated);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const id = req.params.id;
  const c = await prisma.category.findUnique({ where: { id } });
  if (!c) return res.status(404).json({ message: 'Not found' });
  if (c.userId && c.userId !== userId) return res.status(403).json({ message: 'Forbidden' });
  await prisma.category.delete({ where: { id } });
  res.status(204).send();
};
