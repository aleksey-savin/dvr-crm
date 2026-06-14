import * as React from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  BadgeCheckIcon,
  CheckIcon,
  PaperclipIcon,
  PencilIcon,
  SendIcon,
  Trash2Icon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { ProposalForm } from '@/components/proposals/proposal-form'
import {
  setProposalStatus,
  softDeleteProposal,
} from '@/components/proposals/actions'
import { resolveDocumentUrl } from '@/components/documents/actions'
import type { ProposalRow, ProposalStatus } from '@/types'

const STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: 'Черновик',
  prepared: 'Подготовлено',
  approved: 'Согласовано',
  sent: 'Отправлено',
}

const STATUS_VARIANTS: Record<
  ProposalStatus,
  'secondary' | 'warning' | 'default' | 'success'
> = {
  draft: 'secondary',
  prepared: 'warning',
  approved: 'default',
  sent: 'success',
}

// Единственное доступное действие — переход в следующий статус по цепочке
// draft → prepared → approved → sent. У «sent» следующего статуса нет.
const NEXT_STATUS: Partial<
  Record<
    ProposalStatus,
    { next: ProposalStatus; label: string; Icon: LucideIcon; hover: string }
  >
> = {
  draft: {
    next: 'prepared',
    label: 'Подготовить',
    Icon: CheckIcon,
    hover: 'hover:text-amber-600',
  },
  prepared: {
    next: 'approved',
    label: 'Согласовать',
    Icon: BadgeCheckIcon,
    hover: 'hover:text-blue-600',
  },
  approved: {
    next: 'sent',
    label: 'Отправить',
    Icon: SendIcon,
    hover: 'hover:text-emerald-600',
  },
}

type Props = {
  proposals: ProposalRow[]
}

export function InitiativeProposalsSection({ proposals }: Props) {
  const router = useRouter()
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [editing, setEditing] = React.useState<ProposalRow | null>(null)
  const [deleting, setDeleting] = React.useState<ProposalRow | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleAdvance = async (p: ProposalRow) => {
    const advance = NEXT_STATUS[p.status]
    if (!advance) return
    setBusyId(p.id)
    try {
      await setProposalStatus({ data: { id: p.id, status: advance.next } })
      toast.success(`КП: статус «${STATUS_LABELS[advance.next]}»`)
      await router.invalidate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setIsDeleting(true)
    try {
      await softDeleteProposal({ data: { id: deleting.id } })
      toast.success('КП удалено')
      setDeleting(null)
      await router.invalidate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpen = async (documentId: string) => {
    // Открываем вкладку синхронно (до await), чтобы не сработал блокировщик
    // всплывающих окон, затем подставляем presigned-URL.
    const popup = window.open('about:blank')
    try {
      const { url } = await resolveDocumentUrl({ data: { documentId } })
      if (popup) popup.location.replace(url)
      else window.open(url, '_blank')
    } catch (error) {
      popup?.close()
      toast.error(
        error instanceof Error ? error.message : 'Не удалось открыть документ',
      )
    }
  }

  return (
    <div className="space-y-3">
      <ul className="flex flex-col gap-2">
        {proposals.map((p) => {
          const isBusy = busyId === p.id
          const advance = NEXT_STATUS[p.status]
          return (
            <li
              key={p.id}
              className="flex flex-col gap-1.5 rounded-md border p-2"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-base font-medium">
                      Версия {p.version}
                    </span>
                    <Badge
                      variant={STATUS_VARIANTS[p.status]}
                      className="px-1.5 py-0 text-xs"
                    >
                      {STATUS_LABELS[p.status]}
                    </Badge>
                    {p.isCurrent && (
                      <Badge variant="success" className="px-1.5 py-0 text-xs">
                        актуальное
                      </Badge>
                    )}
                  </div>
                  {(p.sentAt || p.senderUserName) && (
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {p.sentAt && (
                        <span>
                          отправлено{' '}
                          {new Date(p.sentAt).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                      {p.senderUserName && <span>· {p.senderUserName}</span>}
                    </div>
                  )}
                  {p.description && (
                    <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                  {p.documents.length > 0 && (
                    <div className="mt-1.5 flex flex-col gap-1">
                      {p.documents.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                          title={doc.name}
                          onClick={() => void handleOpen(doc.id)}
                        >
                          <PaperclipIcon className="size-3.5 shrink-0" />
                          <span className="truncate">Открыть файл</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  {advance && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`size-7 text-muted-foreground ${advance.hover}`}
                      title={advance.label}
                      disabled={isBusy}
                      onClick={() => void handleAdvance(p)}
                    >
                      <advance.Icon className="size-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    title="Редактировать"
                    disabled={isBusy}
                    onClick={() => setEditing(p)}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    title="Удалить"
                    disabled={isBusy}
                    onClick={() => setDeleting(p)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <ResponsiveDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        title={editing ? `Версия ${editing.version} — редактирование` : 'КП'}
      >
        {editing && (
          <ProposalForm
            item={editing}
            presetInitiativeId={editing.initiativeId}
            onSuccess={async () => {
              setEditing(null)
              await router.invalidate()
            }}
          />
        )}
      </ResponsiveDialog>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить КП?</AlertDialogTitle>
            <AlertDialogDescription>
              Версия {deleting?.version} будет удалена. Это действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                void handleDelete()
              }}
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
