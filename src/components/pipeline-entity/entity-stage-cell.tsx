import * as React from 'react'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { EntityStageOption } from '@/types'

type EntityStageCellProps = {
  stageId: string | null
  stages: EntityStageOption[]
  onMove: (stageId: string) => Promise<unknown>
}

export function EntityStageCell({
  stageId,
  stages,
  onMove,
}: EntityStageCellProps) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)

  const handleChange = async (next: string) => {
    if (next === stageId) return
    setPending(true)
    try {
      await onMove(next)
      await router.invalidate()
    } catch {
      toast.error('Не удалось изменить этап')
    } finally {
      setPending(false)
    }
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        value={stageId ?? undefined}
        onValueChange={(v) => void handleChange(v)}
        disabled={pending}
      >
        <SelectTrigger size="sm" className="w-[170px]">
          <SelectValue placeholder="Не задан" />
        </SelectTrigger>
        <SelectContent>
          {stages.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
