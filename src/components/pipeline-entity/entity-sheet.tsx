import * as React from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { EntityActions } from './entity-actions'
import type { EntityConfig, EntityRowBase, RefusalReason } from './types'
import type { PipelineWithStages } from '@/types'

type EntitySheetProps<TRow extends EntityRowBase, TFull> = {
  config: EntityConfig<TRow, TFull>
  row: TRow | null
  pipelines: PipelineWithStages[]
  refusalReasons: RefusalReason[]
  onOpenChange: (open: boolean) => void
  onDone?: () => void
}

export function EntitySheet<TRow extends EntityRowBase, TFull>({
  config,
  row,
  pipelines,
  refusalReasons,
  onOpenChange,
  onDone,
}: EntitySheetProps<TRow, TFull>) {
  const router = useRouter()
  const [full, setFull] = React.useState<TFull | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!row) {
      setFull(null)
      return
    }
    let cancelled = false
    setLoading(true)
    config
      .fetchOne(row.id)
      .then((data) => {
        if (!cancelled) setFull(data)
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [row, config])

  return (
    <Sheet open={!!row} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {row && (
          <>
            <SheetHeader>
              <SheetTitle>{row.title}</SheetTitle>
              <SheetDescription>Карточка {config.words.gen}</SheetDescription>
            </SheetHeader>

            <div className="px-4">
              <EntityActions
                config={config}
                row={row}
                pipelines={pipelines}
                refusalReasons={refusalReasons}
                size="sm"
                onDone={() => onOpenChange(false)}
              />
            </div>

            <Separator />

            <div className="px-4 pb-6">
              {loading || !full ? (
                <div className="flex flex-col gap-4">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                config.renderForm({
                  item: full,
                  onSuccess: async () => {
                    await router.invalidate()
                    onDone?.()
                    onOpenChange(false)
                  },
                })
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
