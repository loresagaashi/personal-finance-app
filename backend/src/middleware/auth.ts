import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/jwt';
import prisma from '../prisma';

export interface AuthRequest extends Request {
  user?: { id: string } | any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = auth.split(' ')[1];
  try {
    const payload = verifyJwt(token) as any;

    // check token revocation
    const revoked = await prisma.revokedToken.findUnique({ where: { token } });
    if (revoked) return res.status(401).json({ message: 'Token revoked' });

    req.user = { id: payload.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
