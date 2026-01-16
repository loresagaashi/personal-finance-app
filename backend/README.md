# Personal Finance Backend

This is an Express + TypeScript backend for the Personal Finance Advisor system.

Requirements
- Node 18+
- PostgreSQL database named `personal_finance`

Quick start
1. copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET`.
2. install dependencies: `pnpm install` or `npm install` in `backend/`.
3. run Prisma migrate and generate:

```bash
# from backend/
pnpm prisma:generate
pnpm prisma:migrate
```

4. start dev server:

```bash
pnpm dev
```

API Endpoints (examples)

Auth
- POST /api/auth/register { email, password, name } -> { user, token }
- POST /api/auth/login { email, password } -> { user, token }

Transactions (protected)
- POST /api/transactions { amount, type, categoryId, description?, date? }
- GET /api/transactions?year=2026&month=1&categoryId=&type=
- GET /api/transactions/totals?year=2026&month=1
- PUT /api/transactions/:id
- DELETE /api/transactions/:id

Budgets (protected)
- POST /api/budgets { categoryId, amount, month?, year? }
- GET /api/budgets
- GET /api/budgets/status?year=2026&month=1

Categories (protected)
- GET /api/categories -> { system: [], custom: [] }
- POST /api/categories { name, color?, icon? }

Analytics (protected)
- GET /api/analytics/monthly?year=2026&month=1
- GET /api/analytics/trends?months=6

AI Insights (protected)
- GET /api/ai-insights?year=2026&month=1

Notes
- This repo uses Prisma. After changing `prisma/schema.prisma` run `prisma generate`.
- JWT secret configured via `JWT_SECRET` env var.
