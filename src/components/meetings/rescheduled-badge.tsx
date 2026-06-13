import { Badge } from '@/components/ui/badge'

/** Пометка «встреча переносилась» (факт + число переносов). */
export function RescheduledBadge({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  if (count <= 0) return null
  return (
    <Badge variant="warning" className={className}>
      Переносилась{count > 1 ? ` ×${count}` : ''}
    </Badge>
  )
}
