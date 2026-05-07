import '@/components/tiptap/tiptap.css'

import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useRouter } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import {
  ArrowLeftIcon,
  EditIcon,
  Trash2Icon,
  BookmarkPlusIcon,
  MapPinIcon,
  UserPlusIcon,
  UsersIcon,
  BookmarkIcon,
} from 'lucide-react'

import { db } from '@/db'
import { company } from '@/db/schema'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TodoComments } from '@/components/todo-comments'
import { Section } from '@/components/client-view/shared'
import { ContactsSection } from '@/components/company-view/contacts-section'
import { RevenueSection } from '@/components/company-view/revenue-section'

// ---------------------------------------------------------------------------
// Server fn — fetch
// ---------------------------------------------------------------------------

const fetchCompany = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const row = await db.query.company.findFirst({
      where: eq(company.id, data.id),
      with: {
        contacts: true,
        revenues: true,
        accounts: {
          columns: {
            id: true,
            accountType: true,
            isTarget: true,
            isLost: true,
            why: true,
          },
          with: {
            businessUnit: { columns: { id: true, name: true } },
          },
        },
      },
    })

    if (!row) throw notFound()
    return row
  })

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/companies_/$id/view')({
  component: RouteComponent,
  loader: async ({ params }) => fetchCompany({ data: params }),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clientStatusLabel(isTarget: boolean, isLost: boolean) {
  if (isLost) return 'Потерянный'
  if (isTarget) return 'Целевой'
  return 'Клиент'
}

function clientStatusVariant(
  isTarget: boolean,
  isLost: boolean,
): 'destructive' | 'success' | 'default' {
  if (isLost) return 'destructive'
  if (isTarget) return 'success'
  return 'default'
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function RouteComponent() {
  const item = Route.useLoaderData()
  const router = useRouter()

  const refresh = () => router.invalidate()

  const clientAccounts = item.accounts.filter((a) => a.accountType === 'client')
  const wishlistAccounts = item.accounts.filter(
    (a) => a.accountType === 'wishlist',
  )

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
              <div className="flex items-center gap-2 min-w-0">
                <Button asChild variant="ghost" size="icon-sm">
                  <Link to="/companies">
                    <ArrowLeftIcon className="size-4" />
                  </Link>
                </Button>
                <h1 className="text-lg font-semibold leading-tight truncate">
                  {item.name}
                </h1>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link to="/wishlist/new" search={{ companyId: item.id }}>
                    <BookmarkPlusIcon className="size-4" />В вишлист
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link to="/clients/new" search={{ companyId: item.id }}>
                    <UserPlusIcon className="size-4" />В клиенты
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <Link to="/companies/$id/update" params={{ id: item.id }}>
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
                  <Link to="/companies/$id/delete" params={{ id: item.id }}>
                    <Trash2Icon className="size-4" />
                    Удалить
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Scrollable body */}
          <CardContent className="flex-1 min-h-0 overflow-y-auto pt-4 flex flex-col gap-6">
            {/* Description */}
            {item.description && (
              <Section icon={EditIcon} title="Описание">
                <div
                  className="prose prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              </Section>
            )}

            {/* Regional market position */}
            {item.regionalMarketPosition && (
              <Section icon={MapPinIcon} title="Позиция на региональном рынке">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {item.regionalMarketPosition}
                </p>
              </Section>
            )}

            {(item.description || item.regionalMarketPosition) && <Separator />}

            {/* Client accounts */}
            {clientAccounts.length > 0 && (
              <>
                <Section icon={UsersIcon} title="Клиенты">
                  <div className="flex flex-wrap gap-1.5">
                    {clientAccounts.map((a) => (
                      <Link
                        key={a.id}
                        to="/clients/$id/view"
                        params={{ id: a.id }}
                      >
                        <Badge
                          variant={clientStatusVariant(a.isTarget, a.isLost)}
                          className="cursor-pointer gap-1"
                        >
                          {a.businessUnit.name} —{' '}
                          {clientStatusLabel(a.isTarget, a.isLost)}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </Section>
                <Separator />
              </>
            )}

            {/* Wishlist accounts */}
            {wishlistAccounts.length > 0 && (
              <>
                <Section icon={BookmarkIcon} title="Вишлист">
                  <div className="flex flex-col gap-2">
                    {wishlistAccounts.map((a) => (
                      <div key={a.id} className="flex flex-col gap-1">
                        <Badge variant="secondary">{a.businessUnit.name}</Badge>
                        {a.why && (
                          <p className="text-xs text-muted-foreground italic">
                            {a.why}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
                <Separator />
              </>
            )}

            {/* Contacts */}
            <ContactsSection
              contacts={item.contacts}
              companyId={item.id}
              onRefresh={refresh}
            />

            <Separator />

            {/* Revenue */}
            <RevenueSection
              revenues={item.revenues}
              companyId={item.id}
              onRefresh={refresh}
            />
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right column — comments                                              */}
      {/* ------------------------------------------------------------------ */}
      <TodoComments entityType="company" entityId={item.id} />
    </div>
  )
}
