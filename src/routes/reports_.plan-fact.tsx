import { createFileRoute } from '@tanstack/react-router'
import { PlanFactReport } from '@/components/reports/plan-fact-report'

export const Route = createFileRoute('/reports_/plan-fact')({
  component: RouteComponent,
})

function RouteComponent() {
  return <PlanFactReport />
}
