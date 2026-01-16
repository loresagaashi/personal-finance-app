import { Request, Response } from 'express';
import prisma from '../prisma';
import { hashPassword, comparePassword } from '../utils/hash';
import { signJwt } from '../utils/jwt';

// POST /auth/logout
export const logout = async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(400).json({ message: 'No token provided' });
  const token = auth.split(' ')[1];
  try {
    const payload = (await import('../utils/jwt')).verifyJwt(token) as any;
    const exp = payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 7 * 24 * 3600 * 1000);
    await prisma.revokedToken.create({ data: { token, userId: payload.id, expiresAt: exp } });
    return res.json({ message: 'Logged out' });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid token' });
  }
};

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'email and password required' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash, name } });

  const token = signJwt({ id: user.id });
  res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, token });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'email and password required' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signJwt({ id: user.id });
  res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
};
