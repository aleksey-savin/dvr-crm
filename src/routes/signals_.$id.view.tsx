import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { EditIcon, Trash2Icon, RadioIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StarRating } from '@/components/ui/star-rating'
import { fetchSignal } from '@/components/signals/actions'
import type { SignalStatus, SignalType } from '@/types'

export const Route = createFileRoute('/signals_/$id/view')({
  loader: ({ params }) => fetchSignal({ data: params }),
  component: RouteComponent,
})

const STATUS_LABELS: Record<SignalStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  converted: 'Конвертирован',
  archived: 'Архив',
}

const STATUS_VARIANTS: Record<SignalStatus, 'secondary' | 'warning' | 'success'> = {
  new: 'secondary',
  in_progress: 'warning',
  converted: 'success',
  archived: 'secondary',
}

const TYPE_LABELS: Record<SignalType, string> = {
  recommendation: 'Рекомендация',
  news: 'Новость',
  direct_contact: 'Прямой контакт',
  other: 'Другое',
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
  const signal = Route.useLoaderData()
  const router = useRouter()
  const status = signal.status as SignalStatus
  const signalType = signal.signalType as SignalType

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <RadioIcon className="size-6 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold">{signal.title}</h1>
            <p className="text-sm text-muted-foreground">Сигнал</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/signals/$id/update" params={{ id: signal.id }}>
              <EditIcon className="mr-1.5 size-4" />
              Редактировать
            </Link>
          </Button>
          <Button asChild variant="destructive" size="sm">
            <Link to="/signals/$id/delete" params={{ id: signal.id }}>
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
                {signal.company ? (
                  <Link
                    to="/companies/$id/view"
                    params={{ id: signal.company.id }}
                    className="text-primary hover:underline"
                  >
                    {signal.company.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>

              <Field label="Отрасль">
                {signal.industry?.name ?? <span className="text-muted-foreground">—</span>}
              </Field>

              <Field label="Тип сигнала">
                <Badge variant="outline">{TYPE_LABELS[signalType]}</Badge>
              </Field>

              <Field label="Рейтинг">
                <StarRating value={signal.rating} readonly />
              </Field>
            </CardContent>
          </Card>

          {signal.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Описание</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{signal.description}</p>
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
                {signal.department?.name ?? <span className="text-muted-foreground">—</span>}
              </Field>

              <Field label="Ответственный">
                {signal.responsible?.name ?? <span className="text-muted-foreground">—</span>}
              </Field>

              <Separator />

              <Field label="Создан">
                {new Date(signal.createdAt).toLocaleDateString('ru-RU')}
              </Field>

              <Field label="Обновлён">
                {new Date(signal.updatedAt).toLocaleDateString('ru-RU')}
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
