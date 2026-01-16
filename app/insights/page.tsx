import { Sidebar } from "@/components/sidebar"
import { InsightsContent } from "@/components/insights-content"

export default function InsightsPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <InsightsContent />
      </main>
    </div>
  )
}
