import { completionBarColor } from '@/components/target-actions/report-utils'
import { cn } from '@/lib/utils'

/**
 * Slim progress bar for plan/fact completion. Fill width is capped at 100%
 * (over-delivery still reads as a full bar); the color mirrors the completion
 * Badge variants via completionBarColor. A null percent (no plan) renders an
 * empty, muted track.
 */
export function CompletionBar({
  percent,
  size = 'sm',
  className,
}: {
  percent: number | null
  size?: 'sm' | 'lg'
  className?: string
}) {
  const width = percent === null ? 0 : Math.min(percent, 100)
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full bg-muted',
        size === 'lg' ? 'h-2.5' : 'h-1.5',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all',
          completionBarColor(percent),
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
