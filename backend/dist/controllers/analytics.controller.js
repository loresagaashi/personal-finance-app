"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spendingTrends = exports.monthlyOverview = void 0;
const prisma_1 = __importDefault(require("../prisma"));
// GET /analytics/monthly?year=&month=
const monthlyOverview = async (req, res) => {
    const userId = req.user?.id;
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    if (!year || !month)
        return res.status(400).json({ message: 'year and month required' });
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const incomeAgg = await prisma_1.default.transaction.aggregate({ where: { userId, type: 'INCOME', date: { gte: start, lt: end } }, _sum: { amount: true } });
    const expenseAgg = await prisma_1.default.transaction.aggregate({ where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } }, _sum: { amount: true } });
    // category breakdown
    const breakdown = await prisma_1.default.transaction.groupBy({ by: ['categoryId', 'type'], where: { userId, date: { gte: start, lt: end } }, _sum: { amount: true } });
    // format for charts
    const categoryTotals = {};
    for (const row of breakdown) {
        const cat = row.categoryId;
        const sum = Number(row._sum.amount ?? 0);
        categoryTotals[cat] = (categoryTotals[cat] || 0) + sum;
    }
    res.json({ income: Number(incomeAgg._sum.amount ?? 0), expense: Number(expenseAgg._sum.amount ?? 0), categoryTotals });
};
exports.monthlyOverview = monthlyOverview;
// GET /analytics/trends?months=6
const spendingTrends = async (req, res) => {
    const userId = req.user?.id;
    const months = Number(req.query.months) || 6;
    const now = new Date();
    const results = [];
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 1);
        const incomeAgg = await prisma_1.default.transaction.aggregate({ where: { userId, type: 'INCOME', date: { gte: start, lt: end } }, _sum: { amount: true } });
        const expenseAgg = await prisma_1.default.transaction.aggregate({ where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } }, _sum: { amount: true } });
        results.push({ label: `${y}-${m}`, income: Number(incomeAgg._sum.amount ?? 0), expense: Number(expenseAgg._sum.amount ?? 0) });
    }
    res.json(results);
};
exports.spendingTrends = spendingTrends;
