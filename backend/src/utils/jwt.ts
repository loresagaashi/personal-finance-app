const jwt: any = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export const signJwt = (payload: object, expiresIn: string | number = '7d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyJwt = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
