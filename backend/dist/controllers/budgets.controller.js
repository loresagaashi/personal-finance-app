"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBudget = exports.updateBudget = exports.getBudgetStatus = exports.listBudgets = exports.createBudget = void 0;
const prisma_1 = __importDefault(require("../prisma"));
// POST /budgets
const createBudget = async (req, res) => {
    const userId = req.user?.id;
    const { categoryId, amount, month, year } = req.body;
    if (!categoryId || !amount)
        return res.status(400).json({ message: 'categoryId and amount required' });
    // Validate category ownership (system categories allowed)
    const category = await prisma_1.default.category.findUnique({ where: { id: categoryId } });
    if (!category)
        return res.status(400).json({ message: 'Invalid categoryId' });
    if (category.userId && category.userId !== userId)
        return res.status(403).json({ message: 'Forbidden category' });
    const b = await prisma_1.default.budget.create({ data: { userId, categoryId, amount: Number(amount), month, year } });
    res.status(201).json(b);
};
exports.createBudget = createBudget;
const listBudgets = async (req, res) => {
    const userId = req.user?.id;
    const items = await prisma_1.default.budget.findMany({ where: { userId }, include: { category: true } });
    res.json(items);
};
exports.listBudgets = listBudgets;
const getBudgetStatus = async (req, res) => {
    const userId = req.user?.id;
    const { year, month } = req.query;
    const y = Number(year);
    const m = Number(month);
    if (!y || !m)
        return res.status(400).json({ message: 'year and month required' });
    const budgets = await prisma_1.default.budget.findMany({ where: { userId, OR: [{ year: y, month: m }, { year: null, month: null }] }, include: { category: true } });
    const statuses = await Promise.all(budgets.map(async (b) => {
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 1);
        const spentAgg = await prisma_1.default.transaction.aggregate({ where: { userId, categoryId: b.categoryId, type: 'EXPENSE', date: { gte: start, lt: end } }, _sum: { amount: true } });
        const spent = Number(spentAgg._sum.amount ?? 0);
        const limit = Number(b.amount);
        const status = spent > limit ? 'EXCEEDED' : (spent > limit * 0.8 ? 'WARNING' : 'OK');
        return { budget: b, spent, limit, status };
    }));
    res.json(statuses);
};
exports.getBudgetStatus = getBudgetStatus;
const updateBudget = async (req, res) => {
    const userId = req.user?.id;
    const id = req.params.id;
    const b = await prisma_1.default.budget.findUnique({ where: { id } });
    if (!b || b.userId !== userId)
        return res.status(404).json({ message: 'Not found' });
    const { amount, month, year } = req.body;
    const updated = await prisma_1.default.budget.update({ where: { id }, data: { amount: amount !== undefined ? Number(amount) : undefined, month, year } });
    res.json(updated);
};
exports.updateBudget = updateBudget;
const deleteBudget = async (req, res) => {
    const userId = req.user?.id;
    const id = req.params.id;
    const b = await prisma_1.default.budget.findUnique({ where: { id } });
    if (!b || b.userId !== userId)
        return res.status(404).json({ message: 'Not found' });
    await prisma_1.default.budget.delete({ where: { id } });
    res.status(204).send();
};
exports.deleteBudget = deleteBudget;
