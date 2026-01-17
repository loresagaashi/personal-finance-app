"use client"

import React, { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Plus } from "lucide-react"
import { useAuth } from "./auth-provider"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export function BudgetsContent() {
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  const [categories, setCategories] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [catId, setCatId] = useState<string | null>(null)
  const [amountInput, setAmountInput] = useState("")
  const [monthInput, setMonthInput] = useState<string>("")

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
        const [res, catRes] = await Promise.all([
          fetch(`${API}/api/budgets`, { headers: { Authorization: token ? `Bearer ${token}` : "" } }),
          fetch(`${API}/api/categories`, { headers: { Authorization: token ? `Bearer ${token}` : "" } }),
        ])
        if (!res.ok) {
          setBudgets([])
        } else {
          const data = await res.json()
          if (mounted) setBudgets(data)
        }
        if (catRes.ok) {
          const cjson = await catRes.json()
          // API returns either an array or a grouped object { system: [], custom: [] }
          let flat: any[] = []
          if (Array.isArray(cjson)) flat = cjson
          else if (cjson) flat = [...(cjson.custom ?? []), ...(cjson.system ?? [])]
          if (mounted) {
            setCategories(flat)
            if (!catId && flat.length > 0) setCatId(flat[0].id)
          }
        } else {
          if (mounted) setCategories([])
        }
      } catch (e) {
        if (mounted) setBudgets([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [token, refreshKey])

  return (
    <div className="p-8 space-y-8">
      <PageHeader
        title="Budgets & Categories"
        description="Monitor your spending across different categories"
        action={
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Budget
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="p-6">Loading budgets...</div>
        ) : budgets.length === 0 ? (
          <div className="p-6 col-span-full text-center">No budgets yet. Create a monthly budget to get started.</div>
        ) : (
          budgets.map((b) => {
            const spent = Number(b.spent ?? 0)
            const limit = Number(b.amount ?? 0)
            const percentage = limit > 0 ? (spent / limit) * 100 : 0
            const isExceeded = percentage > 100
            const categoryName = b.category?.name ?? "Uncategorized"

            return (
              <Card key={b.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base font-semibold">{categoryName}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Spent</span>
                      <span className="font-semibold text-foreground">${spent.toFixed(2)}</span>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className={isExceeded ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {isExceeded ? `Over by $${(spent - limit).toFixed(2)}` : `$${(limit - spent).toFixed(2)} remaining`}
                      </span>
                      <span className="text-muted-foreground">${limit.toFixed(2)}</span>
                    </div>
                  </div>
                  {isExceeded && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-xs text-destructive font-medium">Budget exceeded this month</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Create Budget</SheetTitle>
            <SheetDescription>Create a monthly budget for a category</SheetDescription>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Category</label>
              <Select defaultValue={catId ?? ""} onValueChange={(v) => setCatId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Amount</label>
              <Input value={amountInput} onChange={(e) => setAmountInput(e.target.value)} type="number" step="0.01" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Month (optional)</label>
              <Input value={monthInput} onChange={(e) => setMonthInput(e.target.value)} placeholder="1-12" />
            </div>
          </div>
          <SheetFooter>
            <div className="flex gap-2">
              <Button onClick={async () => {
                const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
                try {
                  const body: any = { categoryId: catId, amount: Number(amountInput) }
                  if (monthInput !== "") body.month = Number(monthInput)
                  const res = await fetch(`${API}/api/budgets`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
                    body: JSON.stringify(body),
                  })
                  if (res.ok) {
                    console.debug("Created budget, token before reload:", token, { local: typeof window !== 'undefined' ? localStorage.getItem('pf_token') : null })
                    setIsOpen(false)
                    setRefreshKey((k) => k + 1)
                  } else {
                    console.error("Failed to create budget")
                  }
                } catch (e) { console.error(e) }
              }}>Create</Button>
              <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Card>
        <CardHeader>
          <CardTitle>Budget Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold text-foreground">${budgets.reduce((s, b) => s + Number(b.amount ?? 0), 0).toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold text-foreground">${budgets.reduce((s, b) => s + Number(b.spent ?? 0), 0).toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold text-success">${(budgets.reduce((s, b) => s + Number(b.amount ?? 0), 0) - budgets.reduce((s, b) => s + Number(b.spent ?? 0), 0)).toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
