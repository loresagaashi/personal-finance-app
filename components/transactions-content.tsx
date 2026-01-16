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
          // Normalize categories response: backend may return grouped { system, custom }
          let flat: any[] = []
          if (Array.isArray(cjson)) flat = cjson
          else if (cjson) flat = [...(cjson.custom ?? []), ...(cjson.system ?? [])]
          if (mounted) setCategories(flat)
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
  }, [token, refreshKey])

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
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="food">Food & Dining</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="transportation">Transportation</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="month">
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

          <div className="rounded-lg border border-border overflow-hidden">
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
                  <tbody className="divide-y divide-border bg-card">
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
                          <Badge variant="secondary" className="font-normal">
                            {transaction.category?.name ?? "Uncategorized"}
                          </Badge>
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
                {/* Use a sentinel value for 'none' because Select.Item value cannot be empty string */}
                <Select defaultValue={categoryId ?? "none"} onValueChange={(v) => setCategoryId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
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
                      const body = {
                        description: desc,
                        amount: Number(amountInput),
                        date: dateInput,
                        categoryId: categoryId && categoryId !== "none" ? categoryId : undefined,
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
