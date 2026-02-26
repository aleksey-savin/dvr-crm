import '@/components/tiptap/tiptap.css'
import * as React from 'react'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useRouter } from '@tanstack/react-router'
import { and, eq } from 'drizzle-orm'
import * as z from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeftIcon,
  EditIcon,
  Trash2Icon,
  PlusIcon,
  ShieldAlertIcon,
  TrendingUpIcon,
  TargetIcon,
  SparklesIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react'

import { db } from '@/db'
import {
  client,
  clientRisk,
  clientGrossProfit,
  clientTargetForecast,
  clientUpsellingOpportunity,
} from '@/db/schema'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TodoComments } from '@/components/todo-comments'

// ---------------------------------------------------------------------------
// Server fns — fetch
// ---------------------------------------------------------------------------

const fetchClient = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const row = await db.query.client.findFirst({
      where: eq(client.id, data.id),
      with: {
        company: true,
        department: true,
        managers: {
          with: { user: { columns: { id: true, name: true, image: true } } },
        },
        risks: true,
        grossProfits: true,
        targetForecasts: true,
        upsellingOpportunities: true,
      },
    })
    if (!row) throw notFound()
    return row
  })

// ---------------------------------------------------------------------------
// Server fns — mutations
// ---------------------------------------------------------------------------

const addRisk = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ clientId: z.string(), description: z.string().min(1) }),
  )
  .handler(async ({ data }) => {
    await db.insert(clientRisk).values({
      clientId: data.clientId,
      description: data.description,
    })
  })

const deleteRisk = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(clientRisk).where(eq(clientRisk.id, data.id))
  })

const addGrossProfit = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      clientId: z.string(),
      year: z.number().int().min(2000).max(2100),
      value: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const existing = await db
      .select({ id: clientGrossProfit.id })
      .from(clientGrossProfit)
      .where(
        and(
          eq(clientGrossProfit.clientId, data.clientId),
          eq(clientGrossProfit.year, data.year),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      throw new Error(
        `Запись валовой прибыли за ${data.year} год уже существует для этого клиента`,
      )
    }

    await db.insert(clientGrossProfit).values({
      clientId: data.clientId,
      year: data.year,
      value: data.value,
    })
  })

const deleteGrossProfit = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(clientGrossProfit).where(eq(clientGrossProfit.id, data.id))
  })

const addTargetForecast = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      clientId: z.string(),
      year: z.number().int().min(2000).max(2100),
      value: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const existing = await db
      .select({ id: clientTargetForecast.id })
      .from(clientTargetForecast)
      .where(
        and(
          eq(clientTargetForecast.clientId, data.clientId),
          eq(clientTargetForecast.year, data.year),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      throw new Error(
        `Прогноз за ${data.year} год уже существует для этого клиента`,
      )
    }

    await db.insert(clientTargetForecast).values({
      clientId: data.clientId,
      year: data.year,
      value: data.value,
    })
  })

const deleteTargetForecast = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db
      .delete(clientTargetForecast)
      .where(eq(clientTargetForecast.id, data.id))
  })

const addUpselling = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ clientId: z.string(), description: z.string().min(1) }),
  )
  .handler(async ({ data }) => {
    await db.insert(clientUpsellingOpportunity).values({
      clientId: data.clientId,
      description: data.description,
    })
  })

const deleteUpselling = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db
      .delete(clientUpsellingOpportunity)
      .where(eq(clientUpsellingOpportunity.id, data.id))
  })

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/clients_/$id/view')({
  component: RouteComponent,
  loader: async ({ params }) => fetchClient({ data: params }),
})

// ---------------------------------------------------------------------------
// Small reusable dialog for text-only entries (risks / upselling)
// ---------------------------------------------------------------------------

function TextEntryDialog({
  title,
  label,
  onAdd,
  children,
}: {
  title: string
  label: string
  onAdd: (value: string) => Promise<void>
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    setLoading(true)
    try {
      await onAdd(value.trim())
      setValue('')
      setOpen(false)
    } catch {
      toast.error('Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{label}</Label>
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Введите описание…"
              className="min-h-24 resize-none"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !value.trim()}>
              Добавить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Dialog for year+value entries (gross profit / target forecast)
// ---------------------------------------------------------------------------

function YearValueDialog({
  title,
  onAdd,
  children,
}: {
  title: string
  onAdd: (year: number, value: string) => Promise<void>
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [year, setYear] = React.useState(new Date().getFullYear())
  const [value, setValue] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    setLoading(true)
    try {
      await onAdd(year, value.trim())
      setValue('')
      setOpen(false)
    } catch {
      toast.error('Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Год</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={2000}
                max={2100}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Значение</Label>
              <Input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !value.trim()}>
              Добавить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: React.ElementType
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Delete row button (inline)
// ---------------------------------------------------------------------------

function DeleteRowButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [loading, setLoading] = React.useState(false)

  const handle = async () => {
    setLoading(true)
    try {
      await onDelete()
    } catch {
      toast.error('Не удалось удалить')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={loading}
      onClick={handle}
      className="text-muted-foreground hover:text-destructive"
    >
      <XIcon className="size-3.5" />
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function RouteComponent() {
  const item = Route.useLoaderData()
  const router = useRouter()

  const refresh = () => router.invalidate()

  const fmtDate = (d: Date | string) =>
    new Date(d).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const fmtNum = (v: string) =>
    Number(v).toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-start">
      {/* ------------------------------------------------------------------ */}
      {/* Left column                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-0" style={{ height: '79svh' }}>
          {/* Header */}
          <CardHeader className="border-b shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="gap-2 shrink-0 -ml-2"
                >
                  <Link to="/clients">
                    <ArrowLeftIcon className="size-4" />
                    Клиенты
                  </Link>
                </Button>
                <Separator orientation="vertical" className="h-5 shrink-0" />
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  {item.target && (
                    <Badge variant="success" className="gap-1 shrink-0">
                      <TargetIcon className="size-3" />
                      Целевой
                    </Badge>
                  )}
                  {item.lost && (
                    <Badge variant="destructive" className="gap-1 shrink-0">
                      Потерянный
                    </Badge>
                  )}
                  <h1 className="text-lg font-semibold leading-tight truncate">
                    {item.company.name}
                  </h1>
                  <span className="text-sm text-muted-foreground truncate">
                    — {item.department.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <Link to="/clients/$id/update" params={{ id: item.id }}>
                    <EditIcon className="size-4" />
                    Изменить
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="destructiveGhost"
                  size="sm"
                  className="gap-2"
                >
                  <Link to="/clients/$id/delete" params={{ id: item.id }}>
                    <Trash2Icon className="size-4" />
                    Удалить
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Scrollable body */}
          <CardContent className="flex-1 min-h-0 overflow-y-auto pt-4 flex flex-col gap-6">
            {/* Managers */}
            <Section icon={UsersIcon} title="Клиент-менеджеры">
              {item.managers.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Менеджеры не назначены
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {item.managers.map(({ user }) => (
                    <Badge key={user.id} variant="secondary">
                      {user.name}
                    </Badge>
                  ))}
                </div>
              )}
            </Section>

            {item.lost && item.lostReasons && (
              <Section icon={ShieldAlertIcon} title="Причина потери">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {item.lostReasons}
                </p>
              </Section>
            )}

            <Separator />

            <Tabs defaultValue="risks">
              <TabsList>
                <TabsTrigger value="risks">
                  <ShieldAlertIcon className="size-3.5" />
                  Риски
                  {item.risks.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 px-1 text-[10px]"
                    >
                      {item.risks.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="grossprofit">
                  <TrendingUpIcon className="size-3.5" />
                  Валовая прибыль
                  {item.grossProfits.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 px-1 text-[10px]"
                    >
                      {item.grossProfits.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="forecast">
                  <TargetIcon className="size-3.5" />
                  Прогноз
                  {item.targetForecasts.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 px-1 text-[10px]"
                    >
                      {item.targetForecasts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="upselling">
                  <SparklesIcon className="size-3.5" />
                  Апсейл
                  {item.upsellingOpportunities.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 px-1 text-[10px]"
                    >
                      {item.upsellingOpportunities.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* ---- Risks ---- */}
              <TabsContent value="risks" className="mt-4">
                <Section
                  icon={ShieldAlertIcon}
                  title="Риски"
                  action={
                    <TextEntryDialog
                      title="Добавить риск"
                      label="Описание риска"
                      onAdd={async (description) => {
                        await addRisk({
                          data: { clientId: item.id, description },
                        })
                        toast.success('Риск добавлен')
                        refresh()
                      }}
                    >
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <PlusIcon className="size-3.5" />
                        Добавить
                      </Button>
                    </TextEntryDialog>
                  }
                >
                  {item.risks.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">
                      Рисков не добавлено
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Описание</TableHead>
                          <TableHead>Добавлен</TableHead>
                          <TableHead className="w-0" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {item.risks.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="whitespace-pre-wrap">
                              {r.description}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                              {fmtDate(r.createdAt)}
                            </TableCell>
                            <TableCell>
                              <DeleteRowButton
                                onDelete={async () => {
                                  await deleteRisk({ data: { id: r.id } })
                                  toast.success('Риск удалён')
                                  refresh()
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Section>
              </TabsContent>

              {/* ---- Gross Profit ---- */}
              <TabsContent value="grossprofit" className="mt-4">
                <Section
                  icon={TrendingUpIcon}
                  title="Валовая прибыль"
                  action={
                    <YearValueDialog
                      title="Добавить валовую прибыль"
                      onAdd={async (year, value) => {
                        await addGrossProfit({
                          data: { clientId: item.id, year, value },
                        })
                        toast.success('Запись добавлена')
                        refresh()
                      }}
                    >
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <PlusIcon className="size-3.5" />
                        Добавить
                      </Button>
                    </YearValueDialog>
                  }
                >
                  {item.grossProfits.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">
                      Данных нет
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Год</TableHead>
                          <TableHead>Значение</TableHead>
                          <TableHead>Добавлен</TableHead>
                          <TableHead className="w-0" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {item.grossProfits
                          .slice()
                          .sort((a, b) => b.year - a.year)
                          .map((gp) => (
                            <TableRow key={gp.id}>
                              <TableCell className="font-medium">
                                {gp.year}
                              </TableCell>
                              <TableCell>{fmtNum(gp.value)}</TableCell>
                              <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                {fmtDate(gp.createdAt)}
                              </TableCell>
                              <TableCell>
                                <DeleteRowButton
                                  onDelete={async () => {
                                    await deleteGrossProfit({
                                      data: { id: gp.id },
                                    })
                                    toast.success('Запись удалена')
                                    refresh()
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </Section>
              </TabsContent>

              {/* ---- Target Forecast ---- */}
              <TabsContent value="forecast" className="mt-4">
                <Section
                  icon={TargetIcon}
                  title="Целевой прогноз"
                  action={
                    <YearValueDialog
                      title="Добавить прогноз"
                      onAdd={async (year, value) => {
                        await addTargetForecast({
                          data: { clientId: item.id, year, value },
                        })
                        toast.success('Прогноз добавлен')
                        refresh()
                      }}
                    >
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <PlusIcon className="size-3.5" />
                        Добавить
                      </Button>
                    </YearValueDialog>
                  }
                >
                  {item.targetForecasts.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">
                      Прогнозов нет
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Год</TableHead>
                          <TableHead>Значение</TableHead>
                          <TableHead>Добавлен</TableHead>
                          <TableHead className="w-0" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {item.targetForecasts
                          .slice()
                          .sort((a, b) => b.year - a.year)
                          .map((tf) => (
                            <TableRow key={tf.id}>
                              <TableCell className="font-medium">
                                {tf.year}
                              </TableCell>
                              <TableCell>{fmtNum(tf.value)}</TableCell>
                              <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                {fmtDate(tf.createdAt)}
                              </TableCell>
                              <TableCell>
                                <DeleteRowButton
                                  onDelete={async () => {
                                    await deleteTargetForecast({
                                      data: { id: tf.id },
                                    })
                                    toast.success('Прогноз удалён')
                                    refresh()
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </Section>
              </TabsContent>

              {/* ---- Upselling ---- */}
              <TabsContent value="upselling" className="mt-4">
                <Section
                  icon={SparklesIcon}
                  title="Возможности апсейла"
                  action={
                    <TextEntryDialog
                      title="Добавить возможность апсейла"
                      label="Описание"
                      onAdd={async (description) => {
                        await addUpselling({
                          data: { clientId: item.id, description },
                        })
                        toast.success('Запись добавлена')
                        refresh()
                      }}
                    >
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <PlusIcon className="size-3.5" />
                        Добавить
                      </Button>
                    </TextEntryDialog>
                  }
                >
                  {item.upsellingOpportunities.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">
                      Возможностей не добавлено
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Описание</TableHead>
                          <TableHead>Добавлен</TableHead>
                          <TableHead className="w-0" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {item.upsellingOpportunities.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="whitespace-pre-wrap">
                              {u.description}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                              {fmtDate(u.createdAt)}
                            </TableCell>
                            <TableCell>
                              <DeleteRowButton
                                onDelete={async () => {
                                  await deleteUpselling({
                                    data: { id: u.id },
                                  })
                                  toast.success('Запись удалена')
                                  refresh()
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Section>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right column — comments                                              */}
      {/* ------------------------------------------------------------------ */}
      <TodoComments entityType="client" entityId={item.id} />
    </div>
  )
}
