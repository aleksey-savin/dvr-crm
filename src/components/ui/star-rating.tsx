import * as React from 'react'
import { StarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number | null
  onChange?: (value: number | null) => void
  readonly?: boolean
  className?: string
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = React.useState<number | null>(null)

  const displayed = hovered ?? value

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => {
            if (!onChange) return
            onChange(value === star ? null : star)
          }}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(null)}
          className={cn(
            'text-muted-foreground transition-colors',
            !readonly && 'cursor-pointer hover:text-amber-400',
            readonly && 'cursor-default',
          )}
        >
          <StarIcon
            className={cn(
              'size-4',
              displayed !== null && star <= displayed
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none',
            )}
          />
        </button>
      ))}
    </div>
  )
}
