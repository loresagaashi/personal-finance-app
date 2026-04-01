"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

type User = { id: string; email: string; name?: string; monthlyIncome?: number | string; isAdmin?: boolean }

type AuthContextValue = {
  user: User | null
  token: string | null
  loading: boolean
  login: (token: string, user?: User) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
  // hydrate from localStorage
  const t = typeof window !== "undefined" ? localStorage.getItem("pf_token") : null
    if (!t) {
      setLoading(false)
      // If on a protected route, redirect to login. Allow public routes like /login and /signup.
      const publicPaths = ['/login', '/signup']
      if (pathname && !publicPaths.includes(pathname)) router.replace('/login')
      return
    }

    // validate token by fetching profile from API base
    async function validate() {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
      try {
        const res = await fetch(`${API}/api/users/me`, { headers: { Authorization: `Bearer ${t}` } })
        if (!res.ok) throw new Error("Unauthorized")
        const u = await res.json()
        setUser(u)
        setToken(t)
        // persist minimal user to localStorage
        try { localStorage.setItem('pf_user', JSON.stringify(u)) } catch(e) {}
      } catch (err) {
        localStorage.removeItem("pf_token")
        localStorage.removeItem("pf_user")
        setUser(null)
        setToken(null)
        if (pathname && pathname !== "/login") router.replace("/login")
      } finally {
        setLoading(false)
      }
    }

    validate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = (t: string, u?: User) => {
    try {
      localStorage.setItem("pf_token", t)
      if (u) localStorage.setItem("pf_user", JSON.stringify(u))
    } catch (e) {}
    setToken(t)
    if (u) setUser(u)
  }

  const logout = async () => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
      if (token) await fetch(`${API}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } })
    } catch (e) {}
    try {
      localStorage.removeItem("pf_token")
      localStorage.removeItem("pf_user")
    } catch (e) {}
    setToken(null)
    setUser(null)
    router.replace("/login")
  }

  return <AuthContext.Provider value={{ user, token, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
