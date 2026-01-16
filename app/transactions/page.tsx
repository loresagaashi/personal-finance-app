import { Sidebar } from "@/components/sidebar"
import { TransactionsContent } from "@/components/transactions-content"

export default function TransactionsPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <TransactionsContent />
      </main>
    </div>
  )
}
