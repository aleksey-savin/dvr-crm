import * as React from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { EditIcon, ExternalLinkIcon, Trash2Icon, XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchInitiative } from '@/components/initiatives/actions'
import { fetchActionsByInitiative } from '@/components/target-actions/actions'
import { fetchProposalsByInitiative } from '@/components/proposals/actions'
import { fetchMeetingsByInitiative } from '@/components/meetings/actions'
import { InitiativeActionsSection } from '@/components/initiatives/initiative-actions-section'
import { InitiativeQuickActions } from '@/components/initiatives/initiative-quick-actions'
import { InitiativeProposalsSection } from '@/components/proposals/proposal-section'
import { InitiativeMeetingsSection } from '@/components/meetings/initiative-meetings-section'

export const Route = createFileRoute('/initiatives/$id/view')({
  loader: async ({ params }) => {
    const [item, actions, proposals, meetings] = await Promise.all([
      fetchInitiative({ data: { id: params.id } }),
      fetchActionsByInitiative({ data: { initiativeId: params.id } }),
      fetchProposalsByInitiative({ data: { initiativeId: params.id } }),
      fetchMeetingsByInitiative({ data: { initiativeId: params.id } }),
    ])
    return { item, actions, proposals, meetings }
  },
  component: RouteComponent,
})

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

const SOURCE_LABELS: Record<string, string> = {
  lead: 'Лид',
  signal: 'Сигнал',
  tender: 'Тендер',
  account: 'Аккаунт',
  manual: 'Вручную',
}

function RouteComponent() {
  const { item, actions, proposals, meetings } = Route.useLoaderData()
  const navigate = useNavigate()

  const close = () => navigate({ to: '/initiatives' })

  // Close on Escape — the sheet has no modal overlay so we wire this manually.
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l bg-background shadow-xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b p-4">
        <h2
          className="min-w-0 text-base font-semibold truncate"
          title={item.title}
        >
          {item.title}
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link to="/initiatives/$id/update" params={{ id: item.id }}>
              <EditIcon className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-8 text-destructive"
          >
            <Link to="/initiatives/$id/delete" params={{ id: item.id }}>
              <Trash2Icon className="size-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={close}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Статус</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Воронка">
              {item.pipeline ? (
                item.pipeline.name
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </Field>

            <Field label="Этап">
              {item.stage ? (
                <span className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.stage.color }}
                  />
                  {item.stage.name}
                  {item.stage.isWon && (
                    <Badge variant="success" className="px-1 py-0 text-[10px]">
                      Won
                    </Badge>
                  )}
                  {item.stage.isLost && (
                    <Badge
                      variant="destructive"
                      className="px-1 py-0 text-[10px]"
                    >
                      Lost
                    </Badge>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </Field>

            {item.closedAt && (
              <Field label="Закрыта">
                {new Date(item.closedAt).toLocaleDateString('ru-RU')}
              </Field>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Field label="Компания">
              {item.company ? (
                <Link
                  to="/companies/$id/view"
                  params={{ id: item.company.id }}
                  className="text-primary hover:underline"
                >
                  {item.company.name}
                </Link>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </Field>

            <Field label="Бюджет">
              {item.budget ? (
                new Intl.NumberFormat('ru-RU', {
                  style: 'currency',
                  currency: 'RUB',
                  maximumFractionDigits: 0,
                }).format(Number(item.budget))
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </Field>

            <Field label="Срок сделки">
              {item.dueDate ? (
                new Date(item.dueDate).toLocaleDateString('ru-RU')
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </Field>

            <Field label="Подразделение">
              {item.department?.name ?? (
                <span className="text-muted-foreground">—</span>
              )}
            </Field>

            <Field label="Ответственный">
              {item.responsible?.name ?? (
                <span className="text-muted-foreground">—</span>
              )}
            </Field>

            <Field label="Источник">
              <span>{SOURCE_LABELS[item.sourceType] ?? item.sourceType}</span>
              {item.sourceLead && (
                <Link
                  to="/leads/$id/view"
                  params={{ id: item.sourceLead.id }}
                  className="ml-1.5 text-primary hover:underline"
                >
                  {item.sourceLead.title}
                  <ExternalLinkIcon className="ml-1 inline size-3" />
                </Link>
              )}
              {item.sourceSignal && (
                <Link
                  to="/signals/$id/view"
                  params={{ id: item.sourceSignal.id }}
                  className="ml-1.5 text-primary hover:underline"
                >
                  {item.sourceSignal.title}
                  <ExternalLinkIcon className="ml-1 inline size-3" />
                </Link>
              )}
              {item.sourceTender && (
                <Link
                  to="/tenders/$id/view"
                  params={{ id: item.sourceTender.id }}
                  className="ml-1.5 text-primary hover:underline"
                >
                  {item.sourceTender.title}
                  <ExternalLinkIcon className="ml-1 inline size-3" />
                </Link>
              )}
            </Field>
          </CardContent>
        </Card>

        {item.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Описание</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{item.description}</p>
            </CardContent>
          </Card>
        )}

        {item.refusalReason && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Причина отказа</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{item.refusalReason.name}</p>
            </CardContent>
          </Card>
        )}

        <InitiativeQuickActions
          initiativeId={item.id}
          companyId={item.company?.id ?? null}
          departmentId={item.department?.id ?? null}
        />

        {meetings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Встречи</CardTitle>
            </CardHeader>
            <CardContent>
              <InitiativeMeetingsSection meetings={meetings} />
            </CardContent>
          </Card>
        )}

        {proposals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Коммерческие предложения
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InitiativeProposalsSection proposals={proposals} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Целевые действия</CardTitle>
          </CardHeader>
          <CardContent>
            <InitiativeActionsSection actions={actions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Метаданные</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Создана">
              {new Date(item.createdAt).toLocaleDateString('ru-RU')}
            </Field>
            <Field label="Обновлена">
              {new Date(item.updatedAt).toLocaleDateString('ru-RU')}
            </Field>
          </CardContent>
        </Card>
      </div>
    </aside>
  )
}
