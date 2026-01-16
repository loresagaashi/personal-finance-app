"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const jwt_1 = require("../utils/jwt");
const prisma_1 = __importDefault(require("../prisma"));
const requireAuth = async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = auth.split(' ')[1];
    try {
        const payload = (0, jwt_1.verifyJwt)(token);
        // check token revocation
        const revoked = await prisma_1.default.revokedToken.findUnique({ where: { token } });
        if (revoked)
            return res.status(401).json({ message: 'Token revoked' });
        req.user = { id: payload.id };
        next();
    }
    catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
exports.requireAuth = requireAuth;
