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
import { LeadForm } from './lead-form'
import { LeadActions } from './lead-actions'
import { fetchLead } from './actions'
import type { SelectLead } from '@/db/types'
import type { LeadRow, PipelineWithStages } from '@/types'

type LeadSheetProps = {
  lead: LeadRow | null
  pipelines: PipelineWithStages[]
  refusalReasons: Array<{ id: string; name: string }>
  onOpenChange: (open: boolean) => void
  onDone?: () => void
}

export function LeadSheet({
  lead,
  pipelines,
  refusalReasons,
  onOpenChange,
  onDone,
}: LeadSheetProps) {
  const router = useRouter()
  const [full, setFull] = React.useState<SelectLead | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!lead) {
      setFull(null)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchLead({ data: { id: lead.id } })
      .then((row) => {
        if (!cancelled) setFull(row as unknown as SelectLead)
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [lead])

  return (
    <Sheet open={!!lead} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {lead && (
          <>
            <SheetHeader>
              <SheetTitle>{lead.title}</SheetTitle>
              <SheetDescription>Карточка лида</SheetDescription>
            </SheetHeader>

            <div className="px-4">
              <LeadActions
                lead={lead}
                pipelines={pipelines}
                refusalReasons={refusalReasons}
                context="sheet"
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
                <LeadForm
                  item={full}
                  onSuccess={async () => {
                    await router.invalidate()
                    onDone?.()
                    onOpenChange(false)
                  }}
                />
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
