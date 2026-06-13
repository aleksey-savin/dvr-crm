import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type WizardStep = {
  id: number
  label: string
}

type Props = {
  steps: WizardStep[]
  current: number
  /** Самый дальний посещённый шаг — только до него можно прыгать вперёд. */
  maxVisited: number
  onStepClick: (step: number) => void
}

export function WizardStepper({
  steps,
  current,
  maxVisited,
  onStepClick,
}: Props) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, idx) => {
        const isCurrent = s.id === current
        const isCompleted = s.id < current
        const clickable = s.id <= maxVisited && !isCurrent
        return (
          <li
            key={s.id}
            className="flex items-center gap-2 [&:not(:last-child)]:flex-1"
          >
            <button
              type="button"
              disabled={!clickable}
              onClick={() => onStepClick(s.id)}
              className="flex items-center gap-2 disabled:cursor-default"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                  isCurrent &&
                    'border-primary bg-primary text-primary-foreground',
                  isCompleted && 'border-primary text-primary',
                  !isCurrent &&
                    !isCompleted &&
                    'border-muted-foreground/30 text-muted-foreground',
                )}
              >
                {isCompleted ? <CheckIcon className="size-3.5" /> : s.id}
              </span>
              <span
                className={cn(
                  'text-sm',
                  isCurrent ? 'font-medium' : 'text-muted-foreground',
                )}
              >
                {s.label}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <div
                aria-hidden="true"
                className="h-px min-w-4 flex-1 bg-border"
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
