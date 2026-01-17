"use client"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter } from "lucide-react"
import React, { useState, useEffect } from "react"
import { useAuth } from "./auth-provider"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"

export function TransactionsContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // form state
  const [desc, setDesc] = useState("")
  const [amountInput, setAmountInput] = useState("")
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 10))
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("EXPENSE")
  const { token } = useAuth()
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all")
  const [typeFilter, setTypeFilter] = useState<"all" | "INCOME" | "EXPENSE">("all")
  const [periodFilter, setPeriodFilter] = useState<"week" | "month" | "quarter" | "year">("month")

  useEffect(() => {
    let mounted = true

    async function loadTransactions() {
      setLoading(true)
      try {
        const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
        const [txRes, catRes] = await Promise.all([
          fetch(`${API}/api/transactions`, { headers: { Authorization: token ? `Bearer ${token}` : "" } }),
          fetch(`${API}/api/categories`, { headers: { Authorization: token ? `Bearer ${token}` : "" } }),
        ])

        if (txRes.ok) {
          const data = await txRes.json()
          if (mounted) setTransactions(data)
        } else {
          if (mounted) setTransactions([])
        }

        if (catRes.ok) {
          const cjson = await catRes.json()
          let flat: any[] = []
          if (Array.isArray(cjson)) flat = cjson
          else if (cjson) flat = [...(cjson.custom ?? []), ...(cjson.system ?? [])]
          if (mounted) {
            setCategories(flat)
            // default selected category for new transaction if none chosen
            if (!categoryId && flat.length > 0) setCategoryId(flat[0].id)
          }
        } else {
          if (mounted) setCategories([])
        }
      } catch (e) {
        if (mounted) {
          setTransactions([])
          setCategories([])
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadTransactions()
    return () => {
      mounted = false
    }
  }, [token])

  // server-driven fetch for search & filters (debounced)
  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
        const params = new URLSearchParams()
        if (searchTerm && searchTerm.trim() !== "") params.set('q', searchTerm.trim())
        if (categoryFilter && categoryFilter !== 'all') params.set('categoryId', categoryFilter)
        if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter)
        if (periodFilter) params.set('period', periodFilter)
        // include a reasonable limit
        params.set('limit', '200')
        const url = `${API}/api/transactions?${params.toString()}`
        const res = await fetch(url, { headers: { Authorization: token ? `Bearer ${token}` : '' } })
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json()
            setTransactions(data)
          } else {
            setTransactions([])
          }
        }
      } catch (e) {
        if (!cancelled) setTransactions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [searchTerm, categoryFilter, typeFilter, periodFilter, token, refreshKey])

  return (
    <div className="p-8 space-y-8">
      <PageHeader
        title="Transactions"
        description="Track and manage all your financial transactions"
        action={
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        }
      />

      <Card>
          <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category filter: uses fetched categories */}
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type filter */}
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
              </SelectContent>
            </Select>

            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as any)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg overflow-hidden shadow-sm bg-card">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center">No transactions yet. Add your first income or expense.</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/30 bg-card">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {/* category pill with light color accents */}
                          <span
                            className={(() => {
                              const n = (transaction.category?.name || '').toLowerCase()
                              if (!n) return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground'
                              if (n.includes('food') || n.includes('groc') || n.includes('grocery')) return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-800'
                              if (n.includes('entertain') || n.includes('movie') || n.includes('netflix')) return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-50 text-pink-800'
                              if (n.includes('subscript') || n.includes('subscription')) return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-800'
                              if (n.includes('utility') || n.includes('bill')) return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800'
                              if (n.includes('income') || n.includes('salary')) return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800'
                              return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted/20 text-muted-foreground'
                            })()}
                          >
                            {transaction.category?.name ?? 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                          <span className={transaction.type === "INCOME" ? "text-success" : "text-foreground"}>
                            {transaction.type === "INCOME" ? "+" : ""}${Math.abs(Number(transaction.amount)).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          </CardContent>
      </Card>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Add Transaction</SheetTitle>
              <SheetDescription>Enter transaction details</SheetDescription>
            </SheetHeader>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Description</label>
                <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Amount</label>
                <Input value={amountInput} onChange={(e) => setAmountInput(e.target.value)} type="number" step="0.01" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Date</label>
                <Input value={dateInput} onChange={(e) => setDateInput(e.target.value)} type="date" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Category</label>
                <Select value={categoryId ?? ""} onValueChange={(v) => setCategoryId(v)}>
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
                <label className="text-sm text-muted-foreground">Type</label>
                <Select defaultValue={txType} onValueChange={(v) => setTxType(v as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                    <SelectItem value="INCOME">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    // submit
                    const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
                    try {
                        if (!categoryId) {
                          console.error('Please select a category')
                          return
                        }
                        const body = {
                          description: desc,
                          amount: Number(amountInput),
                          date: dateInput,
                          categoryId,
                          type: txType,
                        }
                      const res = await fetch(`${API}/api/transactions`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
                        body: JSON.stringify(body),
                      })
                      if (res.ok) {
                        // refresh data without full reload
                        console.debug("Created transaction, token before reload:", token, { local: typeof window !== 'undefined' ? localStorage.getItem('pf_token') : null })
                        setIsOpen(false)
                        setRefreshKey((k) => k + 1)
                      } else {
                        console.error("Failed to create transaction")
                      }
                    } catch (e) {
                      console.error(e)
                    }
                  }}
                >
                  Create
                </Button>
                <Button variant="ghost" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
    </div>
  )
}
