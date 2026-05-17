import * as React from 'react'
import { useRouter } from '@tanstack/react-router'
import { CheckIcon, SendIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  prepareProposal,
  sendProposal,
  softDeleteProposal,
} from '@/components/proposals/actions'
import type { ProposalRow, ProposalStatus } from '@/types'

const STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: 'Черновик',
  prepared: 'Подготовлено',
  sent: 'Отправлено',
}

const STATUS_VARIANTS: Record<
  ProposalStatus,
  'secondary' | 'default' | 'warning'
> = {
  draft: 'secondary',
  prepared: 'warning',
  sent: 'default',
}

const moneyFmt = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

type Props = {
  proposals: ProposalRow[]
}

export function InitiativeProposalsSection({ proposals }: Props) {
  const router = useRouter()
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const handlePrepare = async (id: string) => {
    setBusyId(id)
    try {
      await prepareProposal({ data: { id } })
      toast.success('КП помечено как подготовленное')
      await router.invalidate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось')
    } finally {
      setBusyId(null)
    }
  }

  const handleSend = async (id: string) => {
    setBusyId(id)
    try {
      await sendProposal({ data: { id } })
      toast.success('КП отправлено')
      await router.invalidate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setBusyId(id)
    try {
      await softDeleteProposal({ data: { id } })
      toast.success('КП удалено')
      await router.invalidate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось')
    } finally {
      setBusyId(null)
    }
  }

  if (proposals.length === 0) return null

  return (
    <div className="space-y-3">
      <ul className="flex flex-col gap-2">
          {proposals.map((p) => {
            const isBusy = busyId === p.id
            return (
              <li
                key={p.id}
                className="flex flex-col gap-1.5 rounded-md border p-2"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium">{p.title}</span>
                      <Badge
                        variant="secondary"
                        className="px-1.5 py-0 text-[10px]"
                      >
                        v{p.version}
                      </Badge>
                      <Badge
                        variant={STATUS_VARIANTS[p.status]}
                        className="px-1.5 py-0 text-[10px]"
                      >
                        {STATUS_LABELS[p.status]}
                      </Badge>
                      {p.isCurrent && (
                        <Badge
                          variant="success"
                          className="px-1.5 py-0 text-[10px]"
                        >
                          актуальное
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {p.amount && <span>{moneyFmt.format(Number(p.amount))}</span>}
                      {p.sentAt && (
                        <span>
                          · отправлено{' '}
                          {new Date(p.sentAt).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                      {p.senderUserName && <span>· {p.senderUserName}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {p.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-amber-600"
                        title="Подготовлено"
                        disabled={isBusy}
                        onClick={() => void handlePrepare(p.id)}
                      >
                        <CheckIcon className="size-3.5" />
                      </Button>
                    )}
                    {(p.status === 'draft' || p.status === 'prepared') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-emerald-600"
                        title="Отправить"
                        disabled={isBusy}
                        onClick={() => void handleSend(p.id)}
                      >
                        <SendIcon className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      title="Удалить"
                      disabled={isBusy}
                      onClick={() => void handleDelete(p.id)}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
    </div>
  )
}
