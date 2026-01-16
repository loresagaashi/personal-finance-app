import { Sidebar } from "@/components/sidebar"
import { DashboardContent } from "@/components/dashboard-content"
import ProtectedClient from "@/components/protected-client"

export default function Page() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <ProtectedClient>
          <DashboardContent />
        </ProtectedClient>
      </main>
    </div>
  )
}
