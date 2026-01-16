import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: LucideIcon
  href: string
}

export function StatCard({ title, value, change, trend, icon: Icon, href }: StatCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-lg transition-all hover:border-primary/20 cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
            <div className="flex items-center gap-1.5">
              {trend === "up" ? (
                <ArrowUpRight className="h-4 w-4 text-success" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-success" />
              )}
              <span className={cn("text-sm font-medium", trend === "up" ? "text-success" : "text-success")}>
                {change}
              </span>
              <span className="text-sm text-muted-foreground">vs last month</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
