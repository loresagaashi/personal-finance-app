"use client"

import React, { useEffect, useState } from "react"
import { StatCard } from "@/components/stat-card"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, Sparkles, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "./auth-provider"
import { useRouter } from "next/navigation"

export function DashboardContent() {
  const { token, user } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<any[]>([])
  const [income, setIncome] = useState(0)
  const [profileIncome, setProfileIncome] = useState<number | null>(null)
  const [expense, setExpense] = useState(0)
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If the user is an admin, redirect them to the admin users page and
    // avoid fetching the global transactions overview.
    if (user && user.isAdmin) {
      router.replace('/users')
      return
    }

    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
        // fetch recent transactions
        const txRes = await fetch(`${API}/api/transactions`, { headers: { Authorization: token ? `Bearer ${token}` : "" } })
        const txs = txRes.ok ? await txRes.json() : []
        if (!mounted) return
        setTransactions(txs.slice(0, 6))

        // fetch monthly overview for current month
        const now = new Date()
        const y = now.getFullYear()
        const m = now.getMonth() + 1
        const aRes = await fetch(`${API}/api/analytics/monthly?year=${y}&month=${m}`, { headers: { Authorization: token ? `Bearer ${token}` : "" } })
        if (aRes.ok) {
          const a = await aRes.json()
          if (mounted) {
            setIncome(a.income ?? 0)
            setExpense(a.expense ?? 0)
          }
        }
        // fetch current balance
        try {
          const bRes = await fetch(`${API}/api/analytics/balance`, { headers: { Authorization: token ? `Bearer ${token}` : "" } })
          if (bRes.ok) {
            const b = await bRes.json()
            if (mounted) setBalance(Number(b.balance ?? 0))
          }
        } catch (e) {}
        // also fetch profile to see if user provided a declared monthly income
        try {
          const pRes = await fetch(`${API}/api/users/me`, { headers: { Authorization: token ? `Bearer ${token}` : "" } })
          if (pRes.ok) {
            const p = await pRes.json()
            if (mounted && p.monthlyIncome != null) {
              setProfileIncome(Number(p.monthlyIncome))
            }
          }
        } catch (e) {}
      } catch (e) {
        if (mounted) {
          setTransactions([])
          setIncome(0)
          setExpense(0)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [token, user, router])

  const totalBalance = balance ?? transactions.reduce((s, t) => s + Number(t.amount), 0)

  const displayIncome = profileIncome !== null ? profileIncome : income
  const isAuthed = Boolean(token)
  const savings = displayIncome - expense
  const savingsPct = displayIncome > 0 ? Math.round((savings / displayIncome) * 100) : 0

  return (
    <div className="p-8 space-y-8">
      <PageHeader title="Dashboard" description="Welcome back! Here's your financial overview" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Balance"
          value={isAuthed ? `$${totalBalance.toFixed(2)}` : "—"}
          change=""
          trend="up"
          icon={TrendingUp}
          href="/"
        />
        <StatCard
          title="Monthly Income"
          value={isAuthed ? `$${displayIncome.toFixed(2)}` : "—"}
          change=""
          trend="up"
          icon={ArrowUpRight}
          href="/transactions"
        />
        <StatCard
          title="Monthly Expenses"
          value={isAuthed ? `$${expense.toFixed(2)}` : "—"}
          change=""
          trend="down"
          icon={ArrowDownRight}
          href="/transactions"
        />
        <StatCard
          title="Savings Progress"
          value={
            isAuthed
              ? savings < 0
                ? `Overspent $${Math.abs(savings).toFixed(2)} (${Math.abs(savingsPct)}%)`
                : `$${savings.toFixed(2)} (${savingsPct}%)`
              : "—"
          }
          change=""
          trend="up"
          icon={TrendingUp}
          href="/budgets"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="p-6 text-center">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="p-6 text-center">No transactions yet. Add your first income or expense.</div>
            ) : (
              transactions.map((transaction: any, i: number) => (
                <div key={transaction.id || i} className="flex items-center justify-between py-3 border-b border-muted/20 last:border-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.category?.name ?? 'Uncategorized'} • {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={cn("text-sm font-semibold", transaction.type === 'INCOME' ? "text-success" : "text-destructive") }>
                    {transaction.type === 'INCOME' ? '+' : '-'}${Math.abs(Number(transaction.amount)).toFixed(2)}
                  </span>
                </div>
              ))
            )}
            <Link href="/transactions">
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                View All Transactions
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">AI Insights</CardTitle>
            </div>
            <CardDescription>Smart recommendations for you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-card shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-warning mt-2" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">High Spending Alert</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Your entertainment spending is 40% above average this month</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-card shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">Savings Opportunity</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">You could save $240/month by optimizing subscriptions</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-card shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-success mt-2" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">Great Progress!</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">You're on track to reach your savings goal 2 months early</p>
                  </div>
                </div>
              </div>
            </div>
            <Link href="/insights">
              <Button className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                View All Insights
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
