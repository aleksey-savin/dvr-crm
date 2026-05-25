import * as React from 'react'
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { EditIcon, GitMergeIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StarRating } from '@/components/ui/star-rating'
import { fetchSignal } from '@/components/signals/actions'
import { convertSignalToInitiative } from '@/components/initiatives/actions'
import { fetchPipelines } from '@/components/pipelines/actions'
import { ConvertToInitiativeDialog } from '@/components/initiatives/convert-to-initiative-dialog'
import type { SignalStatus } from '@/types'

export const Route = createFileRoute('/signals_/$id/view')({
  loader: ({ params }) =>
    Promise.all([fetchSignal({ data: params }), fetchPipelines()]),
  component: RouteComponent,
})

const STATUS_LABELS: Record<SignalStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  converted: 'Конвертирован',
  rejected: 'Отклонён',
}

const STATUS_VARIANTS: Record<
  SignalStatus,
  'secondary' | 'warning' | 'success' | 'destructive'
> = {
  new: 'secondary',
  in_progress: 'warning',
  converted: 'success',
  rejected: 'destructive',
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
  const [signal, pipelines] = Route.useLoaderData()
  const router = useRouter()
  const navigate = useNavigate()
  const status = signal.status as SignalStatus
  const [isConverting, setIsConverting] = React.useState(false)

  const handleConvert = ({
    pipelineId,
    stageId,
  }: {
    pipelineId: string
    stageId: string
  }) =>
    convertSignalToInitiative({
      data: {
        signalId: signal.id,
        title: signal.title,
        pipelineId,
        stageId,
        companyId: signal.companyId,
        departmentId: signal.departmentId,
        responsibleUserId: signal.responsibleUserId,
        description: signal.description,
      },
    })

  const handleConvertSuccess = () => {
    setIsConverting(false)
    void router.invalidate()
    void navigate({ to: '/initiatives' })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-end gap-2">
        {status !== 'converted' && status !== 'rejected' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConverting(true)}
          >
            <GitMergeIcon className="mr-1.5 size-4" />
            Конвертировать в инициативу
          </Button>
        )}
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
                {signal.industry?.name ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>

              <Field label="Тип сигнала">
                <Badge variant="outline">
                  {signal.signalType?.name ?? '—'}
                </Badge>
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
                <p className="whitespace-pre-wrap text-sm">
                  {signal.description}
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
                {signal.department?.name ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>

              <Field label="Ответственный">
                {signal.responsible?.name ?? (
                  <span className="text-muted-foreground">—</span>
                )}
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

      <ConvertToInitiativeDialog
        open={isConverting}
        onOpenChange={setIsConverting}
        pipelines={pipelines}
        title="Конвертация сигнала в инициативу"
        description={
          signal.title
            ? `Сигнал «${signal.title}»`
            : 'Создание инициативы на основе сигнала'
        }
        onConvert={handleConvert}
        onSuccess={handleConvertSuccess}
      />
    </div>
  )
}
