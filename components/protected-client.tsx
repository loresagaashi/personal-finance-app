"use client"

import React, { useEffect } from "react"
import { useAuth } from "./auth-provider"
import { useRouter } from "next/navigation"

export default function ProtectedClient({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!user) return null

  return <>{children}</>
}
