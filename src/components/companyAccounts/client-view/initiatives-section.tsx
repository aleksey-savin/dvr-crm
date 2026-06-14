import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { CalendarIcon, GitMergeIcon, PlusIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { InitiativeForm } from '@/components/initiatives/initiative-form'
import {
  fetchAccountInitiatives,
  fetchInitiativeFormOptions,
  addInitiative,
} from '@/components/initiatives/actions'
import type { InitiativeFormPayload } from '@/components/initiatives/initiative-form'
import type { InitiativeRow } from '@/types'
import { Section } from './shared'

type Props = {
  clientId: string
  companyId?: string | null
  onRefresh?: () => void
}

export function InitiativesSection({ clientId, companyId, onRefresh }: Props) {
  const [initiatives, setInitiatives] = React.useState<InitiativeRow[]>([])
  const [isCreating, setIsCreating] = React.useState(false)
  const [formOptions, setFormOptions] = React.useState<Awaited<
    ReturnType<typeof fetchInitiativeFormOptions>
  > | null>(null)

  React.useEffect(() => {
    fetchAccountInitiatives({ data: { companyAccountId: clientId } })
      .then(setInitiatives)
      .catch(() => {})
  }, [clientId])

  const handleOpenCreate = async () => {
    if (!formOptions) {
      const opts = await fetchInitiativeFormOptions()
      setFormOptions(opts)
    }
    setIsCreating(true)
  }

  const handleCreateSuccess = async (initiativeId?: string) => {
    setIsCreating(false)
    const rows = await fetchAccountInitiatives({
      data: { companyAccountId: clientId },
    })
    setInitiatives(rows)
    onRefresh?.()
    if (initiativeId) {
      // Navigate happens from within the form if desired; here we just refresh
    }
  }

  const handleCreate = async (payload: InitiativeFormPayload) => {
    return addInitiative({
      data: {
        ...payload,
        companyAccountId: clientId,
        companyId: payload.companyId ?? companyId ?? null,
      },
    })
  }

  const today = new Date()

  return (
    <Section
      icon={GitMergeIcon}
      title="Инициативы"
      action={
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={handleOpenCreate}
        >
          <PlusIcon className="size-3.5" />
          Добавить
        </Button>
      }
    >
      {initiatives.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Инициативы не созданы
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {initiatives.map((item) => {
            const isOverdue =
              item.dueDate && new Date(item.dueDate) < today && !item.closedAt

            return (
              <li
                key={item.id}
                className="flex items-start justify-between gap-2 rounded-md border px-3 py-2"
              >
                <div className="min-w-0 flex flex-col gap-1">
                  <Link
                    to="/initiatives/$id/view"
                    params={{ id: item.id }}
                    className="text-sm font-medium hover:underline truncate"
                  >
                    {item.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.stageName && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span
                          className="size-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: item.stageColor ?? '#6b7280',
                          }}
                        />
                        {item.stageName}
                      </span>
                    )}
                    {item.budget && (
                      <span className="text-xs text-muted-foreground">
                        {new Intl.NumberFormat('ru-RU', {
                          style: 'currency',
                          currency: 'RUB',
                          maximumFractionDigits: 0,
                          notation: 'compact',
                        }).format(Number(item.budget))}
                      </span>
                    )}
                    {item.dueDate && (
                      <span
                        className={`flex items-center gap-0.5 text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}
                      >
                        <CalendarIcon className="size-3" />
                        {new Date(item.dueDate).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                  </div>
                </div>

                {item.stageIsWon && (
                  <Badge variant="success" className="shrink-0 text-[10px]">
                    Won
                  </Badge>
                )}
                {item.stageIsLost && (
                  <Badge variant="destructive" className="shrink-0 text-[10px]">
                    Lost
                  </Badge>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {formOptions && (
        <ResponsiveDialog
          open={isCreating}
          onOpenChange={(open) => {
            if (!open) setIsCreating(false)
          }}
          title="Новая инициатива"
          description="Создание инициативы"
          contentClassName="sm:max-w-2xl"
        >
          <InitiativeForm
            prefill={{
              companyAccountId: clientId,
              companyId: companyId ?? null,
              sourceType: 'account',
            }}
            options={formOptions}
            customSubmitFn={handleCreate}
            onSuccess={handleCreateSuccess}
          />
        </ResponsiveDialog>
      )}
    </Section>
  )
}
