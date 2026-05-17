import * as React from 'react'
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { EditIcon, GitMergeIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { fetchLead } from '@/components/leads/actions'
import { convertLeadToInitiative } from '@/components/initiatives/actions'
import { fetchPipelines } from '@/components/pipelines/actions'
import { ConvertToInitiativeDialog } from '@/components/initiatives/convert-to-initiative-dialog'
import type { LeadStatus } from '@/types'

export const Route = createFileRoute('/leads_/$id/view')({
  loader: ({ params }) =>
    Promise.all([fetchLead({ data: params }), fetchPipelines()]),
  component: RouteComponent,
})

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  converted: 'Конвертирован',
  rejected: 'Отклонён',
}

const STATUS_VARIANTS: Record<
  LeadStatus,
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
  const [lead, pipelines] = Route.useLoaderData()
  const router = useRouter()
  const navigate = useNavigate()
  const status = lead.status as LeadStatus
  const [isConverting, setIsConverting] = React.useState(false)

  const handleConvert = ({
    pipelineId,
    stageId,
  }: {
    pipelineId: string
    stageId: string
  }) =>
    convertLeadToInitiative({
      data: {
        leadId: lead.id,
        title: lead.title,
        pipelineId,
        stageId,
        companyId: lead.companyId,
        departmentId: lead.departmentId,
        responsibleUserId: lead.responsibleUserId,
        budget: lead.budget,
        dueDate: lead.dueDate,
        description: lead.description,
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
        {status !== 'converted' && (
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
                {lead.industry?.name ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>

              <Field label="Источник">
                {lead.source?.name ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>

              <Field label="Бюджет">
                {lead.budget ? (
                  new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    maximumFractionDigits: 0,
                  }).format(Number(lead.budget))
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>

              <Field label="Срок">
                {lead.dueDate ? (
                  new Date(lead.dueDate).toLocaleDateString('ru-RU')
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>
            </CardContent>
          </Card>

          {lead.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Описание</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">
                  {lead.description}
                </p>
              </CardContent>
            </Card>
          )}

          {lead.lostReason && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Причина отказа</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{lead.lostReason.name}</p>
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
                {lead.department?.name ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>

              <Field label="Ответственный">
                {lead.responsible?.name ?? (
                  <span className="text-muted-foreground">—</span>
                )}
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

      <ConvertToInitiativeDialog
        open={isConverting}
        onOpenChange={setIsConverting}
        pipelines={pipelines}
        title="Конвертация лида в инициативу"
        description={
          lead.title ? `Лид «${lead.title}»` : 'Создание инициативы на основе лида'
        }
        onConvert={handleConvert}
        onSuccess={handleConvertSuccess}
      />
    </div>
  )
}
