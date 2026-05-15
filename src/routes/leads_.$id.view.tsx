import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { EditIcon, Trash2Icon, ZapIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { fetchLead } from '@/components/leads/actions'
import type { LeadStatus } from '@/types'

export const Route = createFileRoute('/leads_/$id/view')({
  loader: ({ params }) => fetchLead({ data: params }),
  component: RouteComponent,
})

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  converted: 'Конвертирован',
  rejected: 'Отклонён',
}

const STATUS_VARIANTS: Record<LeadStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  new: 'secondary',
  in_progress: 'warning',
  converted: 'success',
  rejected: 'destructive',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

function RouteComponent() {
  const lead = Route.useLoaderData()
  const router = useRouter()
  const status = lead.status as LeadStatus

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ZapIcon className="size-6 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold">{lead.title}</h1>
            <p className="text-sm text-muted-foreground">Лид</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/leads/$id/update" params={{ id: lead.id }}>
              <EditIcon className="mr-1.5 size-4" />
              Редактировать
            </Link>
          </Button>
          <Button asChild variant="destructive" size="sm">
            <Link to="/leads/$id/delete" params={{ id: lead.id }}>
              <Trash2Icon className="mr-1.5 size-4" />
              Удалить
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Field label="Компания">
                {lead.company ? (
                  <Link
                    to="/companies/$id/view"
                    params={{ id: lead.company.id }}
                    className="text-primary hover:underline"
                  >
                    {lead.company.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>

              <Field label="Отрасль">
                {lead.industry?.name ?? <span className="text-muted-foreground">—</span>}
              </Field>

              <Field label="Источник">
                {lead.source ?? <span className="text-muted-foreground">—</span>}
              </Field>

              <Field label="Бюджет">
                {lead.budget
                  ? new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                      maximumFractionDigits: 0,
                    }).format(Number(lead.budget))
                  : <span className="text-muted-foreground">—</span>}
              </Field>

              <Field label="Срок">
                {lead.dueDate
                  ? new Date(lead.dueDate).toLocaleDateString('ru-RU')
                  : <span className="text-muted-foreground">—</span>}
              </Field>
            </CardContent>
          </Card>

          {lead.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Описание</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{lead.description}</p>
              </CardContent>
            </Card>
          )}

          {lead.lostReason && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Причина отказа</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{lead.lostReason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Метаданные</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Статус">
                <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
              </Field>

              <Field label="Подразделение">
                {lead.department?.name ?? <span className="text-muted-foreground">—</span>}
              </Field>

              <Field label="Ответственный">
                {lead.responsible?.name ?? <span className="text-muted-foreground">—</span>}
              </Field>

              <Separator />

              <Field label="Создан">
                {new Date(lead.createdAt).toLocaleDateString('ru-RU')}
              </Field>

              <Field label="Обновлён">
                {new Date(lead.updatedAt).toLocaleDateString('ru-RU')}
              </Field>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex">
        <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
          ← Назад
        </Button>
      </div>
    </div>
  )
}
