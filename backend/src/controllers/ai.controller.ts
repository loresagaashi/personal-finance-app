import { Request, Response } from 'express';
import prisma from '../prisma';
import { randomUUID } from 'crypto';

// AI powered insights generator using local Ollama (optional) with a rule-based fallback
export const generateInsights = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { year, month } = req.query;
  const y = Number(year);
  const m = Number(month);
  const now = new Date();
  const yy = y || now.getFullYear();
  const mm = m || now.getMonth() + 1;

  const start = new Date(yy, mm - 1, 1);
  const end = new Date(yy, mm, 1);

  // Gather recent transactions (last 6 months) and budgets to provide context to the model
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const recentTx = await prisma.transaction.findMany({ where: { userId, date: { gte: sixMonthsAgo, lt: end } }, include: { category: true } });
  const budgets = await prisma.budget.findMany({ where: { userId }, include: { category: true } });

  // If insights already exist for this user, return them (cached)
  const cached = await prisma.aIInsight.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  if (cached && cached.length > 0) {
    const mapped = cached.map((c: any) => ({ id: c.id, title: c.title, description: c.message, priority: c.priority, impact: c.meta?.impact || null, suggestions: c.meta?.suggestions || [], action: c.meta?.action || null, meta: c.meta || {}, createdAt: c.createdAt }));
    return res.json({ insights: mapped });
  }

  // compute simple aggregates
  const totalExpenseThisMonthAgg = await prisma.transaction.aggregate({ where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } }, _sum: { amount: true } });
  const totalIncomeThisMonthAgg = await prisma.transaction.aggregate({ where: { userId, type: 'INCOME', date: { gte: start, lt: end } }, _sum: { amount: true } });
  const totalExpenseThisMonth = Number(totalExpenseThisMonthAgg._sum.amount ?? 0);
  const totalIncomeThisMonth = Number(totalIncomeThisMonthAgg._sum.amount ?? 0);

  // group spend by category
  const byCategory: Record<string, number> = {};
  for (const t of recentTx) {
    if (t.type === 'EXPENSE') {
      const key = t.category?.name ?? 'Uncategorized';
      byCategory[key] = (byCategory[key] || 0) + Number(t.amount);
    }
  }

  // compute per-category monthly average over the recent window (6 months)
  const monthsWindow = 6
  const byCategoryAvg: Record<string, number> = {}
  for (const [k, total] of Object.entries(byCategory)) {
    byCategoryAvg[k] = total / monthsWindow
  }
  


  // detect likely subscriptions: group by description + monthly frequency heuristic
  const descrMap: Record<string, { count: number; total: number }> = {};
  for (const t of recentTx) {
    const desc = (t.description || t.category?.name || 'unknown').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    descrMap[desc] = descrMap[desc] || { count: 0, total: 0 };
    descrMap[desc].count += 1;
    descrMap[desc].total += Number(t.amount);
  }
  const likelySubscriptions = Object.entries(descrMap)
    .filter(([k, v]) => v.count >= 2 && v.total / v.count < 200 && v.total / v.count > 1)
    .map(([k, v]) => ({ name: k, avg: +(v.total / v.count).toFixed(2), occurrences: v.count }));

  // Build a prompt for the LLM
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => `${k}: $${v.toFixed(2)}`)
    .join('\n');

  const subscriptionText = likelySubscriptions.slice(0, 5).map(s => `${s.name} (~$${s.avg}/mo, ${s.occurrences} times)`).join('\n') || 'None detected';

  const prompt = `You are a helpful, safety-conscious personal finance assistant.
Given the user's recent transaction summary and budgets, generate up to 6 concise actionable insights prioritized HIGH, MEDIUM, or LOW. For each insight return a JSON object with keys: title, priority (HIGH|MEDIUM|LOW), description, impact, suggestions (array of short strings), action (short CTA label). Return a JSON array only.

Context:
Total income this month: $${totalIncomeThisMonth.toFixed(2)}
Total expenses this month: $${totalExpenseThisMonth.toFixed(2)}
Top spending categories (last 6 months):\n${topCategories}
Likely subscriptions detected:\n${subscriptionText}
Budgets (if any):\n${budgets.map((b: any) => `- ${b.category?.name ?? b.categoryId}: $${Number(b.amount).toFixed(2)}`).join('\n') || 'None'}

Produce insights similar to these examples:
1) Subscription Optimization Opportunity (HIGH) — detect recurring charges, estimate monthly cost, suggest cancellations/downgrades/annual billing and include potential savings.
2) High Entertainment Spending (HIGH) — call out % above 6-month average and similar-user baseline, suggest budgeting and cheaper alternatives.
3) Smart Savings Recommendation (MEDIUM) — estimate a safe increase in monthly savings given income pattern and current expenses, show annualized impact.
4) Bill Reduction Opportunity (MEDIUM) — note rising utilities or bills and suggest energy plans or budget billing and estimate savings.
5) Great Savings Progress! (LOW) — congratulate on hitting milestones or being ahead of schedule.

Be concrete, provide 1-4 suggestions per insight, and set short CTA labels like 'Review Subscriptions', 'View Details', 'Set Up Auto-Save'.
Respond only with a valid JSON array of objects.
`;

  // Try AI path (Ollama or other local LLM) if configured
  const OLLAMA_URL = process.env.OLLAMA_URL || process.env.AI_API_URL || 'http://localhost:11434';
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2';

  try {
    // call local LLM endpoint
    const resp = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, max_tokens: 512 }),
    });

    if (resp.ok) {
      const text = await resp.text();
      // Try to parse JSON from model output
      let jsonOut: any = null;
      try {
        // Some models return raw JSON, others return text that contains JSON — attempt to extract first JSON array
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        const maybe = firstBracket !== -1 && lastBracket !== -1 ? text.slice(firstBracket, lastBracket + 1) : text;
        jsonOut = JSON.parse(maybe);
      } catch (e) {
        // parsing failed; fall back to rule-based
        console.warn('AI output parse failed, falling back to rule-based insights', e);
      }

      if (jsonOut && Array.isArray(jsonOut)) {
        // Save parsed insights to DB and return them
        const toSave = jsonOut.slice(0, 6)
        const created: any[] = []
        for (const ins of toSave) {
          const saved = await prisma.aIInsight.create({ data: { userId, title: ins.title || ins.action || 'Insight', message: ins.description || ins.message || '', priority: (ins.priority || 'LOW') as any, meta: { ...(ins.meta || {}), suggestions: ins.suggestions || [], action: ins.action || null, impact: ins.impact || null } } })
            created.push({ id: saved.id, title: saved.title, description: saved.message, priority: saved.priority, impact: saved.meta?.impact || null, suggestions: saved.meta?.suggestions || [], action: saved.meta?.action || null, meta: saved.meta, createdAt: saved.createdAt })
        }
        return res.json({ insights: created })
      }
    }
  } catch (e) {
    console.warn('AI call failed, falling back to rule-based insights', e);
  }

  // Fallback: rule-based insights (previous behavior)
  // Additional analysis: compute income fallback, recurring totals and high categories
  const userProfile = await prisma.user.findUnique({ where: { id: userId }, select: { monthlyIncome: true, name: true } })
  const declaredMonthlyIncome = userProfile?.monthlyIncome ? Number(userProfile.monthlyIncome) : null
  const incomeValue = declaredMonthlyIncome && declaredMonthlyIncome > 0 ? declaredMonthlyIncome : (totalIncomeThisMonth > 0 ? totalIncomeThisMonth : 0)
  const recurringMonthlyTotal = likelySubscriptions.reduce((s: number, it: any) => s + Number(it.avg || 0), 0)
  const monthsWindow2 = 6
  const consistentHighCategories: Array<{ name: string; avg: number; pctOfIncome: number }> = []
  for (const [name, total] of Object.entries(byCategory)) {
    const avg = (Number(total) / monthsWindow2)
    const pct = incomeValue > 0 ? (avg / incomeValue) * 100 : 0
    if (pct >= 12 || avg >= 300) {
      consistentHighCategories.push({ name, avg: Number(avg.toFixed(2)), pctOfIncome: Number(pct.toFixed(1)) })
    }
  }

  const insights: any[] = [];
  
  // high-priority insights: consistent high categories
  for (const c of consistentHighCategories) {
    const suggestedCut = Math.max(Math.round(c.avg * 0.15), 10)
    insights.push({
      title: `High spending in ${c.name}`,
      description: `You're spending an average of $${c.avg.toFixed(2)}/month on ${c.name}, which is ${c.pctOfIncome}% of your income.`,
      priority: 'HIGH',
      impact: `Potential savings: ~$${(suggestedCut).toFixed(2)} / month if you cut discretionary spend in this category by 15%`,
      suggestions: [`Reduce ${c.name} spending by ~15% (~$${suggestedCut}/mo)`, `Set a monthly budget of $${Math.max(c.avg - suggestedCut, 0).toFixed(2)}`],
      action: 'Adjust Budget',
      meta: { category: c.name, avg: c.avg, pctOfIncome: c.pctOfIncome }
    })
  }

  // subscription optimization
  if (likelySubscriptions.length > 0 && recurringMonthlyTotal > 20) {
    const topSubs = likelySubscriptions.slice(0, 5)
    const estSavings = topSubs.reduce((s:any, it:any) => s + Number(it.avg || 0), 0)
    insights.push({
      title: 'Subscription Optimization Opportunity',
      description: `We detected recurring charges like ${topSubs.map((s:any)=>s.name).join(', ')}.`,
      priority: 'HIGH',
      impact: `Estimated recurring cost: ~$${recurringMonthlyTotal.toFixed(2)}/month. Potential savings: ~$${estSavings.toFixed(2)}/month by cancelling or downgrading unused services.`,
      suggestions: ['Cancel unused subscriptions', 'Downgrade premium plans', 'Switch to annual billing if cheaper'],
      action: 'Review Subscriptions',
      meta: { recurringMonthlyTotal, subscriptions: topSubs }
    })
  }

  for (const b of budgets) {
    const spentAgg = await prisma.transaction.aggregate({ where: { userId, categoryId: b.categoryId, type: 'EXPENSE', date: { gte: start, lt: end } }, _sum: { amount: true } });
    const spent = Number(spentAgg._sum.amount ?? 0);
    const limit = Number(b.amount);
    if (spent > limit) {
      insights.push({ title: 'Budget exceeded', description: `You spent $${spent.toFixed(2)} in ${b.category?.name ?? b.categoryId} which exceeds your budget of $${limit.toFixed(2)}`, priority: 'HIGH', impact: `Over by $${(spent - limit).toFixed(2)}`, suggestions: [`Review transactions in ${b.category?.name ?? b.categoryId}`], action: 'View Budget', meta: { categoryId: b.categoryId, spent, limit } });
    } else if (spent > limit * 0.85) {
      insights.push({ title: 'Budget nearly exceeded', description: `You're close to your budget for ${b.category?.name ?? b.categoryId} ($${spent.toFixed(2)}/$${limit.toFixed(2)})`, priority: 'MEDIUM', impact: '', suggestions: ['Check upcoming expected expenses'], action: 'View Budget', meta: { categoryId: b.categoryId, spent, limit } });
    }
  }

  const prevStart = new Date(yy, mm - 2, 1);
  const prevEnd = start;
  const currAgg = await prisma.transaction.aggregate({ where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } }, _sum: { amount: true } });
  const prevAgg = await prisma.transaction.aggregate({ where: { userId, type: 'EXPENSE', date: { gte: prevStart, lt: prevEnd } }, _sum: { amount: true } });
  const curr = Number(currAgg._sum.amount ?? 0);
  const prev = Number(prevAgg._sum.amount ?? 0);
  if (prev > 0 && curr > prev * 1.3) {
    insights.push({ title: 'Spending spike', description: `Your expenses increased by ${(((curr - prev) / prev) * 100).toFixed(0)}% vs last month.`, priority: 'MEDIUM', impact: '', suggestions: ['Review recent transactions to identify one-off charges'], action: 'View Transactions', meta: { prev, curr } });
  }

  // low-priority celebratory insight if ahead on savings
  const savings = incomeValue - totalExpenseThisMonth
  if (incomeValue > 0 && savings > incomeValue * 0.1) {
    insights.push({ title: 'Great Savings Progress!', description: `You're on track to reach your savings target.`, priority: 'LOW', impact: `Projected savings: $${(savings * 12).toFixed(2)} / year`, suggestions: ['Consider increasing your savings goal', 'Automate transfers to savings'], action: 'View Progress' });
  }

  // sort by priority
  const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 } as any;
  insights.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3))

  // Attach stable ids and limit to top N insights to keep UI concise
  const MAX_INSIGHTS = 4
  const limited = insights.slice(0, MAX_INSIGHTS).map((ins, idx) => ({ id: ins.id ?? randomUUID(), ...ins }))

  // Persist generated insights for this user (replace any existing cache)
  try {
    await prisma.aIInsight.deleteMany({ where: { userId } })
  } catch (e) {
    // ignore
  }
  const saved: any[] = []
  for (const ins of limited) {
    const r = await prisma.aIInsight.create({ data: { userId, title: ins.title, message: ins.description || ins.message || '', priority: (ins.priority || 'LOW') as any, meta: { ...(ins.meta || {}), suggestions: ins.suggestions || [], action: ins.action || null, impact: ins.impact || null } } })
  saved.push({ id: r.id, title: r.title, description: r.message, priority: r.priority, impact: r.meta?.impact || null, suggestions: r.meta?.suggestions || [], action: r.meta?.action || null, meta: r.meta, createdAt: r.createdAt })
  }

  return res.json({ insights: saved });
  if (insights.length === 0) {
    const safeIncrease = Math.floor((totalIncomeThisMonth - totalExpenseThisMonth) * 0.2)
    const generic: any[] = []
    // encourage budgeting if transactions exist
    if (recentTx.length > 0) {
      generic.push({
        title: 'Add budgets to track spending',
        priority: 'MEDIUM',
        description: 'Set monthly budgets for categories you spend the most on to avoid surprises.',
        impact: 'Improved visibility into spending',
        suggestions: ['Create monthly budgets for top categories', 'Enable notifications for budget thresholds'],
        action: 'Create Budget',
      })
    }

    // subscription suggestion if any likely subscriptions detected
    if (likelySubscriptions.length > 0) {
      generic.push({
        title: 'Review recurring subscriptions',
        priority: 'HIGH',
        description: `We detected recurring charges like ${likelySubscriptions.slice(0,3).map(s=>s.name).join(', ')}. Consider cancelling or downgrading unused services.`,
        impact: `Potential monthly savings: ~$${likelySubscriptions.slice(0,3).reduce((s:any,c:any)=>s + c.avg, 0).toFixed(2)}`,
        suggestions: ['Cancel unused subscriptions', 'Switch to annual billing when cheaper', 'Consolidate overlapping services'],
        action: 'Review Subscriptions',
      })
    }

    // savings suggestion if there's room
    if (totalIncomeThisMonth > 0 && totalIncomeThisMonth - totalExpenseThisMonth > 0) {
      generic.push({
        title: 'Smart Savings Recommendation',
        priority: 'LOW',
        description: `Based on your current income and expenses you could safely increase savings by ~$${safeIncrease} per month.`,
        impact: `Extra ~$${(safeIncrease * 12).toFixed(0)}/year`,
        suggestions: ['Enable automatic transfers to savings', 'Open a high-yield savings account'],
        action: 'Set Up Auto-Save',
      })
    }

    // if still empty, add a generic low-priority tip
    if (generic.length === 0) {
      generic.push({
        title: 'Get started with insights',
        priority: 'LOW',
        description: 'Add more transactions, set a monthly income in Settings, or create budgets to receive personalized insights.',
        impact: '',
        suggestions: ['Log transactions regularly', 'Set monthly income in Settings', 'Create budgets for frequent categories'],
        action: 'View Settings',
      })
    }

    // merge generic suggestions but keep prioritization
    insights.push(...generic)
    insights.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3))
  }

  // In case the flow fell through, persist any final insights (defensive)
  try {
    await prisma.aIInsight.deleteMany({ where: { userId } })
  } catch (e) {}
  const finalSlice = insights.slice(0, MAX_INSIGHTS)
  const finalSaved: any[] = []
  for (const ins of finalSlice) {
    const r = await prisma.aIInsight.create({ data: { userId, title: ins.title, message: ins.description || ins.message || '', priority: (ins.priority || 'LOW') as any, meta: { ...(ins.meta || {}), suggestions: ins.suggestions || [], action: ins.action || null, impact: ins.impact || null } } })
  finalSaved.push({ id: r.id, title: r.title, description: r.message, priority: r.priority, impact: r.meta?.impact || null, suggestions: r.meta?.suggestions || [], action: r.meta?.action || null, meta: r.meta, createdAt: r.createdAt })
  }
  return res.json({ insights: finalSaved });
};
