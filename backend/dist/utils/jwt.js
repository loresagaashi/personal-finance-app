"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJwt = exports.signJwt = void 0;
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const signJwt = (payload, expiresIn = '7d') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};
exports.signJwt = signJwt;
const verifyJwt = (token) => {
    return jwt.verify(token, JWT_SECRET);
};
exports.verifyJwt = verifyJwt;
