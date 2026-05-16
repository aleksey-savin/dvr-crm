import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { EditIcon, Trash2Icon, ExternalLinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { fetchTender } from '@/components/tenders/actions'
import type { TenderStatus } from '@/types'

export const Route = createFileRoute('/tenders_/$id/view')({
  loader: ({ params }) => fetchTender({ data: params }),
  component: RouteComponent,
})

const STATUS_LABELS: Record<TenderStatus, string> = {
  new: 'Новый',
  evaluation: 'Оценка',
  approval: 'Согласование',
  preparation: 'Подготовка',
  submitted: 'Подан',
  won: 'Выигран',
  lost: 'Проигран',
  rejected: 'Отклонён',
  archived: 'Архив',
}

const STATUS_VARIANTS: Record<
  TenderStatus,
  'secondary' | 'warning' | 'default' | 'success' | 'destructive'
> = {
  new: 'secondary',
  evaluation: 'warning',
  approval: 'warning',
  preparation: 'default',
  submitted: 'default',
  won: 'success',
  lost: 'destructive',
  rejected: 'destructive',
  archived: 'secondary',
}

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

function RouteComponent() {
  const tender = Route.useLoaderData()
  const router = useRouter()
  const status = tender.status as TenderStatus

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/tenders/$id/update" params={{ id: tender.id }}>
            <EditIcon className="mr-1.5 size-4" />
            Редактировать
          </Link>
        </Button>
        <Button asChild variant="destructive" size="sm">
          <Link to="/tenders/$id/delete" params={{ id: tender.id }}>
            <Trash2Icon className="mr-1.5 size-4" />
            Удалить
          </Link>
        </Button>
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
                {tender.company ? (
                  <Link
                    to="/companies/$id/view"
                    params={{ id: tender.company.id }}
                    className="text-primary hover:underline"
                  >
                    {tender.company.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>

              <Field label="Отрасль">
                {tender.industry?.name ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>

              <Field label="Площадка">
                {tender.platform ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>

              <Field label="Сумма">
                {tender.amount ? (
                  new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    maximumFractionDigits: 0,
                  }).format(Number(tender.amount))
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>

              <Field label="Дедлайн">
                {tender.deadline ? (
                  new Date(tender.deadline).toLocaleDateString('ru-RU')
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>

              {tender.url && (
                <Field label="Ссылка">
                  <a
                    href={tender.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    Открыть тендер
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                </Field>
              )}
            </CardContent>
          </Card>

          {tender.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Описание</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">
                  {tender.description}
                </p>
              </CardContent>
            </Card>
          )}

          {tender.lostReason && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {tender.status === 'lost'
                    ? 'Причина проигрыша'
                    : 'Причина отказа'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">
                  {tender.lostReason}
                </p>
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
                <Badge variant={STATUS_VARIANTS[status]}>
                  {STATUS_LABELS[status]}
                </Badge>
              </Field>

              <Field label="Подразделение">
                {tender.department?.name ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>

              <Field label="Ответственный">
                {tender.responsible?.name ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>

              <Field label="Согласующий">
                {tender.approver?.name ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>

              <Separator />

              <Field label="Создан">
                {new Date(tender.createdAt).toLocaleDateString('ru-RU')}
              </Field>

              <Field label="Обновлён">
                {new Date(tender.updatedAt).toLocaleDateString('ru-RU')}
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
