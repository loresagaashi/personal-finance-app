"use client"

import React from 'react'
import ProtectedClient from '@/components/protected-client'
import { PageHeader } from '@/components/page-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

export default function UsersPage() {
  return (
    <ProtectedClient>
      <div className="p-6">
        <PageHeader title="Users" description="Registered users (admin only)" />
        <AdminDashboard />
      </div>
    </ProtectedClient>
  )
}

function AdminDashboard() {
  // lift selected user state here to show transactions on the right
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null)

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left column: stats + users list */}
      <div className="md:col-span-2 space-y-6">
        <StatsCards />
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <UsersList onSelectUser={(u: any) => setSelectedUser(u)} selectedUserId={selectedUser?.id ?? null} />
          </CardContent>
        </Card>
      </div>

      {/* Right column: transactions panel */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionsPanel user={selectedUser} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

type UsersListProps = {
  onSelectUser: (user: any) => void
  selectedUserId?: string | null
}

function UsersList({ onSelectUser, selectedUserId }: UsersListProps) {
  const [users, setUsers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    async function fetchUsers() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('pf_token') : null
        const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
        const res = await fetch(`${API}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error('Failed to fetch users')
        const data = await res.json()
        if (!mounted) return
        setUsers(data)
      } catch (err: any) {
        setError(err?.message || 'Error')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchUsers()
    return () => { mounted = false }
  }, [])

  if (loading) return <div>Loading users...</div>
  if (error) return <div className="text-destructive">{error}</div>

  return (
    <div>
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id} className={`${u.id === selectedUserId ? 'bg-muted/50' : ''}`}>
              <TableCell className="font-medium">{u.name || '-'}</TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>{u.isAdmin ? 'Admin' : 'User'}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onSelectUser(u)}>
                    View transactions
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function StatsCards() {
  const [stats, setStats] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true
    async function fetchStats() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('pf_token') : null
        const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
        const res = await fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error('Failed to fetch stats')
        const data = await res.json()
        if (!mounted) return
        setStats(data)
      } catch (err) {
        // ignore for now
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchStats()
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="mt-4">Loading stats...</div>
  if (!stats) return <div className="mt-4 text-muted-foreground">No stats available</div>

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 bg-card rounded shadow-sm">
        <div className="text-sm text-muted-foreground">Total Users</div>
        <div className="text-2xl font-semibold">{stats.totalUsers}</div>
      </div>
      <div className="p-4 bg-card rounded shadow-sm">
        <div className="text-sm text-muted-foreground">Transactions</div>
        <div className="text-2xl font-semibold">{stats.totalTransactions}</div>
      </div>
      <div className="p-4 bg-card rounded shadow-sm">
        <div className="text-sm text-muted-foreground">Revenue</div>
        <div className="text-2xl font-semibold">${stats.totalRevenue ?? 0}</div>
      </div>
    </div>
  )
}

function TransactionsPanel({ user }: { user: any | null }) {
  const [transactions, setTransactions] = React.useState<any[] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!user) {
      setTransactions(null)
      setError(null)
      return
    }
    let mounted = true
    setLoading(true)
    async function fetchTx() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('pf_token') : null
        const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
        const res = await fetch(`${API}/api/admin/users/${user.id}/transactions`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error('Failed to fetch transactions')
        const data = await res.json()
        if (!mounted) return
        setTransactions(data)
      } catch (err: any) {
        setError(err?.message || 'Error')
        setTransactions([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchTx()
    return () => { mounted = false }
  }, [user])

  if (!user) return <div className="text-muted-foreground">Select a user to view transactions.</div>
  if (loading) return <div>Loading transactions...</div>
  if (error) return <div className="text-destructive">{error}</div>

  return (
    <div className="space-y-3">
      <div className="mb-2">
        <div className="text-sm text-muted-foreground">Showing transactions for</div>
        <div className="font-medium">{user.name || user.email}</div>
      </div>

      {!transactions || transactions.length === 0 ? (
        <div className="text-muted-foreground">No transactions for this user.</div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {transactions.map((t) => (
            <div key={t.id} className="p-3 bg-card rounded">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{t.description || t.category?.name || 'Transaction'}</div>
                  <div className="text-sm text-muted-foreground">{new Date(t.date).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${t.type === 'expense' ? 'text-destructive' : 'text-green-600'}`}>${t.amount}</div>
                  <div className="text-sm text-muted-foreground">{t.category?.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
