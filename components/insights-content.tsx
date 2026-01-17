"use client"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, TrendingUp, Lightbulb, Target, ArrowRight } from "lucide-react"
import React, { useEffect, useState } from "react"
import { useAuth } from "./auth-provider"
import { useRouter } from "next/navigation"

export function InsightsContent() {
  const { token } = useAuth()
  const [insights, setInsights] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const VISIBLE_LIMIT = 4
  const visibleInsights = insights ? insights.slice(0, VISIBLE_LIMIT) : []
  const router = useRouter()

  // helpers that use router/token context
  function canViewTransactions(insight: any) {
    return Boolean(insight?.meta?.categoryId || insight?.meta?.month || insight?.meta?.year)
  }

  function canViewBudgets(insight: any) {
    return Boolean(insight?.meta?.categoryId || insight?.meta?.budgetId)
  }

  function getActionRoute(insight: any) {
    if (insight?.meta?.actionRoute) return insight.meta.actionRoute
    const a = (insight.action || '').toLowerCase()
    if (a.includes('budget')) {
      return insight.meta?.budgetId ? `/budgets/${insight.meta.budgetId}` : `/budgets`
    }
    if (a.includes('transaction') || a.includes('spend') || a.includes('view transactions')) {
      const params = new URLSearchParams()
      if (insight.meta?.categoryId) params.set('categoryId', String(insight.meta.categoryId))
      if (insight.meta?.month && insight.meta?.year) params.set('period', `${insight.meta.year}-${String(insight.meta.month).padStart(2, '0')}`)
      const q = params.toString()
      return q ? `/transactions?${q}` : '/transactions'
    }
    if (a.includes('category')) {
      return insight.meta?.categoryId ? `/transactions?categoryId=${insight.meta.categoryId}` : '/transactions'
    }
    return null
  }

  function navigate(href: string) {
    if (!href) return
    // client-side navigation
    router.push(href)
  }

  function handlePrimaryAction(insight: any) {
    const route = getActionRoute(insight)
    if (route) {
      navigate(route)
      return
    }
    if (insight?.meta?.budgetId) {
      navigate(`/budgets/${insight.meta.budgetId}`)
      return
    }
    if (insight?.meta?.categoryId) {
      navigate(`/transactions?categoryId=${insight.meta.categoryId}`)
      return
    }
    navigate('/transactions')
  }

  function handleViewTransactions(insight: any) {
    if (!canViewTransactions(insight)) return
    const params = new URLSearchParams()
    if (insight.meta?.categoryId) params.set('categoryId', String(insight.meta.categoryId))
    if (insight.meta?.month && insight.meta?.year) params.set('period', `${insight.meta.year}-${String(insight.meta.month).padStart(2, '0')}`)
    const q = params.toString()
    navigate(q ? `/transactions?${q}` : '/transactions')
  }

  function handleViewBudgets(insight: any) {
    if (insight.meta?.budgetId) {
      navigate(`/budgets?budgetId=${insight.meta.budgetId}`)
      return
    }
    const params = new URLSearchParams()
    if (insight.meta?.categoryId) params.set('categoryId', String(insight.meta.categoryId))
    if (insight.meta?.suggestedAmount) params.set('amount', String(insight.meta.suggestedAmount))
    navigate(`/budgets${params.toString() ? `?${params.toString()}` : ''}`)
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
        const res = await fetch(`${API}/api/ai`, { headers: { Authorization: token ? `Bearer ${token}` : "" } })
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json()
            setInsights(data.insights ?? [])
          } else {
            setInsights([])
          }
        }
      } catch (e) {
        if (!cancelled) setInsights([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="p-8 space-y-8">
      <PageHeader
        title="AI Insights"
        description="Personalized recommendations powered by AI to optimize your finances"
      />

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="p-6">AI is generating insights...</div>
        ) : !insights || insights.length === 0 ? (
          <div className="p-6">No insights yet. Add transactions or log in to see personalized recommendations.</div>
          ) : (
          visibleInsights.map((insight: any, idx: number) => {
            const priority = (insight.priority || 'LOW').toUpperCase()
            const priorityColor = priority === 'HIGH' ? 'destructive' : priority === 'MEDIUM' ? 'warning' : 'success'
            const Icon = (() => {
              // pick an icon by keywords
              const t = (insight.title || '').toLowerCase()
              if (t.includes('subscription')) return AlertCircle
              if (t.includes('entertain')) return TrendingUp
              if (t.includes('savings')) return Target
              if (t.includes('bill') || t.includes('utility')) return Lightbulb
              return TrendingUp
            })()

            return (
              <Card key={insight.id ?? idx} className={`hover:shadow-lg transition-shadow`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* colored icon square based on priority */}
                      {(() => {
                        const map: any = {
                          HIGH: { bg: 'bg-red-50', text: 'text-red-700', accent: 'bg-red-300' },
                          MEDIUM: { bg: 'bg-amber-50', text: 'text-amber-700', accent: 'bg-amber-300' },
                          LOW: { bg: 'bg-green-50', text: 'text-green-700', accent: 'bg-green-300' },
                        }
                        const s = map[priority] || map.LOW
                        return (
                          <div className={`${s.bg} h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`h-6 w-6 ${s.text}`} />
                          </div>
                        )
                      })()}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <Badge
                            variant={priority === 'HIGH' ? 'destructive' : priority === 'MEDIUM' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {priority}
                          </Badge>
                        </div>
                        <CardDescription className="leading-relaxed">{insight.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 shadow-sm">
                    <p className="text-sm font-semibold text-foreground mb-2">💡 Why this matters</p>
                    <p className="text-sm text-success font-medium">{insight.impact}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Suggested actions:</p>
                    <ul className="space-y-2">
                      {(insight.suggestions || []).map((suggestion: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
                    <Button
                      className="w-full md:w-auto"
                      onClick={() => handlePrimaryAction(insight)}
                      disabled={!token}
                    >
                      {insight.action || 'View Details'}
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleViewTransactions(insight)}
                        disabled={!token || !canViewTransactions(insight)}
                      >
                        View Transactions
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => handleViewBudgets(insight)}
                        disabled={!token || !canViewBudgets(insight)}
                      >
                        {insight.meta?.budgetId ? 'View Budget' : 'Adjust Budget'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
