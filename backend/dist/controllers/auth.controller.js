"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = exports.logout = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const hash_1 = require("../utils/hash");
const jwt_1 = require("../utils/jwt");
// POST /auth/logout
const logout = async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
        return res.status(400).json({ message: 'No token provided' });
    const token = auth.split(' ')[1];
    try {
        const payload = (await Promise.resolve().then(() => __importStar(require('../utils/jwt')))).verifyJwt(token);
        const exp = payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 7 * 24 * 3600 * 1000);
        await prisma_1.default.revokedToken.create({ data: { token, userId: payload.id, expiresAt: exp } });
        return res.json({ message: 'Logged out' });
    }
    catch (err) {
        return res.status(400).json({ message: 'Invalid token' });
    }
};
exports.logout = logout;
const register = async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: 'email and password required' });
    const existing = await prisma_1.default.user.findUnique({ where: { email } });
    if (existing)
        return res.status(409).json({ message: 'Email already registered' });
    const passwordHash = await (0, hash_1.hashPassword)(password);
    const user = await prisma_1.default.user.create({ data: { email, passwordHash, name } });
    const token = (0, jwt_1.signJwt)({ id: user.id });
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, token });
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: 'email and password required' });
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user)
        return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await (0, hash_1.comparePassword)(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ message: 'Invalid credentials' });
    const token = (0, jwt_1.signJwt)({ id: user.id });
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
};
exports.login = login;
