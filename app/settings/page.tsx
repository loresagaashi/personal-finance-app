"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function SettingsPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [monthlyIncome, setMonthlyIncome] = useState<string>("")
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
        const res = await fetch(`${API}/api/users/me`, { headers: { Authorization: token ? `Bearer ${token}` : "" } })
        if (!res.ok) throw new Error("Failed to fetch profile")
        const p = await res.json()
        if (!mounted) return
        setName(p.name ?? "")
        setEmail(p.email ?? "")
        setMonthlyIncome(p.monthlyIncome != null ? String(p.monthlyIncome) : "")
      } catch (e) {
        // noop
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [token])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    // client-side validation for monthly income
    if (monthlyIncome !== "") {
      const parsed = Number(monthlyIncome)
      if (Number.isNaN(parsed) || parsed < 0) {
        setMessage("Monthly income must be a non-negative number")
        return
      }
    }

    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
      const payload: any = { name, email }
      if (monthlyIncome !== "") payload.monthlyIncome = String(Number(monthlyIncome))
      else payload.monthlyIncome = null
      const res = await fetch(`${API}/api/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to update profile")
      setMessage("Profile updated")
    } catch (err: any) {
      setMessage(err?.message ?? "Error")
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    const current = (document.getElementById("currentPassword") as HTMLInputElement).value
    const next = (document.getElementById("newPassword") as HTMLInputElement).value
    setMessage(null)
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
      const res = await fetch(`${API}/api/users/me/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.message || "Failed to change password")
      }
      setMessage("Password changed")
      try {
        const cur = document.getElementById("currentPassword") as HTMLInputElement | null
        const nw = document.getElementById("newPassword") as HTMLInputElement | null
        if (cur) cur.value = ""
        if (nw) nw.value = ""
      } catch (e) {}
    } catch (err: any) {
      setMessage(err?.message ?? "Error")
    }
  }

  return (
    <div className="p-8 space-y-8">
      <PageHeader title="Settings" description="Manage your profile and preferences" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Monthly income (optional)</label>
                <Input
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="e.g. 3500.00"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit">Save profile</Button>
                {message && <div className="text-sm text-muted-foreground">{message}</div>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Current password</label>
                <Input id="currentPassword" type="password" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">New password</label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit">Change password</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
