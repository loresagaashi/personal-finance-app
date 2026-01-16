import { Sidebar } from "@/components/sidebar"
import { BudgetsContent } from "@/components/budgets-content"

export default function BudgetsPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <BudgetsContent />
      </main>
    </div>
  )
}
