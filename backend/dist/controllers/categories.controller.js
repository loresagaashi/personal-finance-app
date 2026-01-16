"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.listCategories = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const listCategories = async (req, res) => {
    const userId = req.user?.id;
    // system categories: where userId is null
    const system = await prisma_1.default.category.findMany({ where: { userId: null } });
    const custom = userId ? await prisma_1.default.category.findMany({ where: { userId } }) : [];
    res.json({ system, custom });
};
exports.listCategories = listCategories;
const createCategory = async (req, res) => {
    const userId = req.user?.id;
    const { name, color, icon } = req.body;
    if (!name)
        return res.status(400).json({ message: 'name required' });
    const cat = await prisma_1.default.category.create({ data: { name, color, icon, userId } });
    res.status(201).json(cat);
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    const userId = req.user?.id;
    const id = req.params.id;
    const c = await prisma_1.default.category.findUnique({ where: { id } });
    if (!c)
        return res.status(404).json({ message: 'Not found' });
    if (c.userId && c.userId !== userId)
        return res.status(403).json({ message: 'Forbidden' });
    const { name, color, icon } = req.body;
    const updated = await prisma_1.default.category.update({ where: { id }, data: { name, color, icon } });
    res.json(updated);
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    const userId = req.user?.id;
    const id = req.params.id;
    const c = await prisma_1.default.category.findUnique({ where: { id } });
    if (!c)
        return res.status(404).json({ message: 'Not found' });
    if (c.userId && c.userId !== userId)
        return res.status(403).json({ message: 'Forbidden' });
    await prisma_1.default.category.delete({ where: { id } });
    res.status(204).send();
};
exports.deleteCategory = deleteCategory;
