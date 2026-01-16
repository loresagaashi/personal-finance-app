"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const budgets_controller_1 = require("../controllers/budgets.controller");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.post('/', budgets_controller_1.createBudget);
router.get('/', budgets_controller_1.listBudgets);
router.get('/status', budgets_controller_1.getBudgetStatus); // ?year=&month=
router.put('/:id', budgets_controller_1.updateBudget);
router.delete('/:id', budgets_controller_1.deleteBudget);
exports.default = router;
