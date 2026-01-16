import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, TrendingUp, Lightbulb, Target, ArrowRight } from "lucide-react"

const insights = [
  {
    id: 1,
    priority: "high",
    title: "Subscription Optimization Opportunity",
    description: "You're spending $240/month on subscriptions. We found 3 services you haven't used in 60 days.",
    impact: "Save up to $85/month",
    action: "Review Subscriptions",
    icon: AlertCircle,
    suggestions: [
      "Cancel unused streaming service ($14.99/mo)",
      "Downgrade premium gym membership ($50/mo)",
      "Switch to annual billing for software ($20/mo savings)",
    ],
  },
  {
    id: 2,
    priority: "high",
    title: "High Entertainment Spending",
    description: "Your entertainment expenses are 40% higher than your 6-month average and 25% above similar users.",
    impact: "Potential to save $120/month",
    action: "View Details",
    icon: TrendingUp,
    suggestions: [
      "Set a monthly entertainment budget of $150",
      "Look for free or low-cost entertainment alternatives",
      "Track dining out expenses separately",
    ],
  },
  {
    id: 3,
    priority: "medium",
    title: "Smart Savings Recommendation",
    description:
      "Based on your income pattern, you can comfortably increase your monthly savings by $300 without lifestyle impact.",
    impact: "Extra $3,600/year in savings",
    action: "Set Up Auto-Save",
    icon: Target,
    suggestions: [
      "Enable automatic transfers on payday",
      "Consider high-yield savings account (4.5% APY)",
      "Allocate to emergency fund first",
    ],
  },
  {
    id: 4,
    priority: "medium",
    title: "Bill Reduction Opportunity",
    description:
      "Your utility costs are trending upward. We found potential savings through energy-efficient practices and better plans.",
    impact: "Save $45-60/month",
    action: "Get Recommendations",
    icon: Lightbulb,
    suggestions: [
      "Switch to budget billing plan",
      "Compare alternative energy providers",
      "Implement energy-saving tips",
    ],
  },
  {
    id: 5,
    priority: "low",
    title: "Great Savings Progress!",
    description: "You're on track to reach your $10,000 savings goal 2 months early. Keep up the excellent work!",
    impact: "Goal completion: March 2026",
    action: "View Progress",
    icon: TrendingUp,
    suggestions: [
      "Consider increasing your savings goal",
      "Start planning your next financial milestone",
      "Celebrate your achievement responsibly",
    ],
  },
]

export function InsightsContent() {
  return (
    <div className="p-8 space-y-8">
      <PageHeader
        title="AI Insights"
        description="Personalized recommendations powered by AI to optimize your finances"
      />

      <div className="grid grid-cols-1 gap-6">
        {insights.map((insight) => {
          const Icon = insight.icon
          const priorityColor =
            insight.priority === "high" ? "destructive" : insight.priority === "medium" ? "warning" : "success"

          return (
            <Card key={insight.id} className={`hover:shadow-lg transition-shadow border-l-4 border-l-${priorityColor}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`h-12 w-12 rounded-lg bg-${priorityColor}/10 flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`h-6 w-6 text-${priorityColor}`} />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <Badge
                          variant={
                            insight.priority === "high"
                              ? "destructive"
                              : insight.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {insight.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <CardDescription className="leading-relaxed">{insight.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm font-semibold text-foreground mb-2">💡 Why this matters</p>
                  <p className="text-sm text-success font-medium">{insight.impact}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Suggested actions:</p>
                  <ul className="space-y-2">
                    {insight.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button className="w-full md:w-auto">{insight.action}</Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
