"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = exports.getProfile = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const hash_1 = require("../utils/hash");
const getProfile = async (req, res) => {
    const userId = req.user?.id;
    const user = await prisma_1.default.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, createdAt: true } });
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    res.json(user);
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    const userId = req.user?.id;
    const { name, email } = req.body;
    const updated = await prisma_1.default.user.update({ where: { id: userId }, data: { name, email } });
    res.json({ id: updated.id, email: updated.email, name: updated.name });
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
        return res.status(400).json({ message: 'currentPassword and newPassword required' });
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    const ok = await (0, hash_1.comparePassword)(currentPassword, user.passwordHash);
    if (!ok)
        return res.status(401).json({ message: 'Invalid current password' });
    const passwordHash = await (0, hash_1.hashPassword)(newPassword);
    await prisma_1.default.user.update({ where: { id: userId }, data: { passwordHash } });
    res.json({ message: 'Password changed' });
};
exports.changePassword = changePassword;
