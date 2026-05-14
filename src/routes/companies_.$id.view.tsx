import '@/components/tiptap/tiptap.css'

import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import {
  EditIcon,
  Trash2Icon,
  BookmarkPlusIcon,
  MapPinIcon,
  UserPlusIcon,
  UsersIcon,
  BookmarkIcon,
  ShieldAlertIcon,
  InfoIcon,
  HeartIcon,
  UsersRoundIcon,
  Building2Icon,
  GlobeIcon,
  ExternalLinkIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TodoComments } from '@/components/todos/todo-comments'
import { Section } from '@/components/companyAccounts/client-view/shared'
import { ContactsSection } from '@/components/companies/contacts-section'
import { RevenueSection } from '@/components/companies/revenue-section'
import { CounterpartiesSection } from '@/components/companies/counterparties-section'
import { ProfitForecastSection } from '@/components/companyAccounts/client-view/profit-forecast-section'
import { RisksSection } from '@/components/companyAccounts/client-view/risks-section'
import { UpsellingSection } from '@/components/companyAccounts/client-view/upselling-section'
import { ClientTodosSection } from '@/components/companyAccounts/client-view/client-todos-section'
import { HooksSection } from '@/components/companyAccounts/wishlist-view/hooks-section'
import { WishlistTodosSection } from '@/components/companyAccounts/wishlist-view/wishlist-todos-section'
import { fetchCompany } from '@/components/companies/actions'

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/companies_/$id/view')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: string; from?: string } => {
    const result: { tab?: string; from?: string } = {}
    if (typeof search.tab === 'string') result.tab = search.tab
    if (typeof search.from === 'string') result.from = search.from
    return result
  },
  component: RouteComponent,
  loader: async ({ params }) => fetchCompany({ data: params }),
})

type CompanyDetail = Awaited<ReturnType<typeof fetchCompany>>
type CompanyAccount = CompanyDetail['accounts'][number]

const ABOUT_TAB = 'about'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clientStatusLabel(isTarget: boolean, isLost: boolean) {
  if (isLost) return 'Потерянный'
  if (isTarget) return 'Целевой'
  return 'Клиент'
}

function accountTabLabel(account: CompanyAccount) {
  if (account.accountType === 'wishlist') {
    return `Вишлист: ${account.businessUnit.name}`
  }

  return `${clientStatusLabel(account.isTarget, account.isLost)}: ${
    account.businessUnit.name
  }`
}

function accountManagers(account: CompanyAccount) {
  if (account.managers.length > 0) {
    return account.managers.map(({ user }) => user)
  }

  return account.owner ? [account.owner] : []
}

function HeaderActions({
  companyId,
  activeAccount,
}: {
  companyId: string
  activeAccount?: CompanyAccount
}) {
  if (activeAccount?.accountType === 'client') {
    return (
      <div className="flex items-center gap-1 shrink-0">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/clients/$id/update" params={{ id: activeAccount.id }}>
            <EditIcon className="size-4" />
            Изменить
          </Link>
        </Button>
        <Button asChild variant="destructiveGhost" size="sm" className="gap-2">
          <Link to="/clients/$id/delete" params={{ id: activeAccount.id }}>
            <Trash2Icon className="size-4" />
            Удалить
          </Link>
        </Button>
      </div>
    )
  }

  if (activeAccount?.accountType === 'wishlist') {
    return (
      <div className="flex items-center gap-1 shrink-0">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/wishlist/$id/update" params={{ id: activeAccount.id }}>
            <EditIcon className="size-4" />
            Изменить
          </Link>
        </Button>
        <Button asChild variant="destructiveGhost" size="sm" className="gap-2">
          <Link to="/wishlist/$id/delete" params={{ id: activeAccount.id }}>
            <Trash2Icon className="size-4" />
            Удалить
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Button asChild variant="outline" size="sm" className="gap-2">
        <Link to="/wishlist/new" search={{ companyId }}>
          <BookmarkPlusIcon className="size-4" />В вишлист
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm" className="gap-2">
        <Link to="/clients/new" search={{ companyId }}>
          <UserPlusIcon className="size-4" />В клиенты
        </Link>
      </Button>
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link to="/companies/$id/update" params={{ id: companyId }}>
          <EditIcon className="size-4" />
          Изменить
        </Link>
      </Button>
      <Button asChild variant="destructiveGhost" size="sm" className="gap-2">
        <Link to="/companies/$id/delete" params={{ id: companyId }}>
          <Trash2Icon className="size-4" />
          Удалить
        </Link>
      </Button>
    </div>
  )
}

function AboutCompanyTab({
  item,
  onRefresh,
}: {
  item: CompanyDetail
  onRefresh: () => void
}) {
  const description = item.description?.trim()
  const regionalMarketPosition = item.regionalMarketPosition?.trim()
  const counterparties = item.counterparties.map((link) => link.counterparty)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <Section icon={Building2Icon} title="Профиль">
          {item.industry || regionalMarketPosition || item.scope || item.website ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {item.scope && (
                  <Badge variant="secondary" className="gap-1">
                    <GlobeIcon className="size-3" />
                    {item.scope === 'federal' ? 'Федеральная' : 'Региональная'}
                  </Badge>
                )}
                {item.industry && (
                  <Badge variant="secondary">{item.industry}</Badge>
                )}
                {regionalMarketPosition && (
                  <Badge variant="secondary" className="gap-1">
                    <MapPinIcon className="size-3" />
                    {regionalMarketPosition}
                  </Badge>
                )}
              </div>
              {item.website && (
                <a
                  href={item.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                >
                  <ExternalLinkIcon className="size-3.5 shrink-0" />
                  {item.website}
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Профиль не заполнен
            </p>
          )}
        </Section>

        <div className="justify-self-start xl:justify-self-end">
          <RevenueSection
            revenues={item.revenues}
            companyId={item.id}
            onRefresh={onRefresh}
            variant="chart"
          />
        </div>
      </div>

      {description && description !== '<p></p>' && (
        <Section icon={InfoIcon} title="Описание">
          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </Section>
      )}

      <ContactsSection
        contacts={item.contacts}
        companyId={item.id}
        onRefresh={onRefresh}
      />

      <CounterpartiesSection
        counterparties={counterparties}
        companyId={item.id}
        onRefresh={onRefresh}
      />
    </div>
  )
}

function ClientAccountTab({
  account,
  onRefresh,
}: {
  account: CompanyAccount
  onRefresh: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <Section icon={UsersIcon} title="Менеджеры">
        {accountManagers(account).length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {accountManagers(account).map((manager) => (
              <Badge key={manager.id} variant="secondary">
                {manager.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Менеджеры не назначены
          </p>
        )}
      </Section>

      {account.isLost && account.lostReasons && (
        <Section icon={ShieldAlertIcon} title="Причина потери">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {account.lostReasons}
          </p>
        </Section>
      )}

      <Separator />

      <ProfitForecastSection
        grossProfits={account.grossProfits}
        targetForecasts={account.targetForecasts}
        clientId={account.id}
        onRefresh={onRefresh}
      />

      <Separator />

      <RisksSection
        risks={account.risks}
        clientId={account.id}
        onRefresh={onRefresh}
      />

      <Separator />

      <UpsellingSection
        upsellingOpportunities={account.upsellingOpportunities}
        clientId={account.id}
        onRefresh={onRefresh}
      />

      <Separator />

      <ClientTodosSection
        todos={account.todos}
        clientId={account.id}
        defaultDepartmentId={account.businessUnitId}
        onRefresh={onRefresh}
      />
    </div>
  )
}

function ReadonlyCompanyContacts({
  contacts,
}: {
  contacts: CompanyDetail['contacts']
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <UsersRoundIcon className="size-4 text-muted-foreground" />
        Контакты компании
        {contacts.length > 0 && (
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            {contacts.length}
          </Badge>
        )}
      </div>

      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Контактов не добавлено
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {contacts.map((contact) => (
            <li key={contact.id} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium leading-tight">
                  {contact.name}
                </span>
                {contact.position && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    {contact.position}
                  </Badge>
                )}
              </div>
              {contact.contacts && (
                <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                  {contact.contacts}
                </p>
              )}
              {contact.description && (
                <p className="text-xs text-muted-foreground/70 italic">
                  {contact.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function WishlistAccountTab({
  company,
  account,
  onRefresh,
}: {
  company: CompanyDetail
  account: CompanyAccount
  onRefresh: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <Section icon={UsersIcon} title="Ответственный">
        {!account.owner ? (
          <p className="text-sm text-muted-foreground italic">
            Ответственный не назначен
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{account.owner.name}</Badge>
          </div>
        )}
      </Section>

      {company.industry && (
        <Section icon={InfoIcon} title="Отрасль">
          <p className="text-sm text-muted-foreground">{company.industry}</p>
        </Section>
      )}

      {account.why && (
        <Section icon={HeartIcon} title="Почему хотим">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {account.why}
          </p>
        </Section>
      )}

      <Separator />

      <RevenueSection
        revenues={company.revenues}
        companyId={company.id}
        onRefresh={onRefresh}
      />

      <Separator />

      <HooksSection
        hooks={account.hooks}
        wishlistClientId={account.id}
        onRefresh={onRefresh}
      />

      <Separator />

      <WishlistTodosSection
        todos={account.todos}
        wishlistClientId={account.id}
        companyName={company.name}
        defaultDepartmentId={account.businessUnitId}
        onRefresh={onRefresh}
      />

      <Separator />

      <ReadonlyCompanyContacts contacts={company.contacts} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function RouteComponent() {
  const item = Route.useLoaderData()
  const { tab, from } = Route.useSearch()
  const router = useRouter()

  const refresh = () => router.invalidate()

  const clientAccounts = item.accounts.filter(
    (account) => account.accountType === 'client',
  )
  const wishlistAccounts = item.accounts.filter(
    (account) => account.accountType === 'wishlist',
  )
  const accountTabs = [...clientAccounts, ...wishlistAccounts]

  const requestedTab = tab ?? ABOUT_TAB
  const activeTab = accountTabs.some((account) => account.id === requestedTab)
    ? requestedTab
    : ABOUT_TAB
  const activeAccount = accountTabs.find((account) => account.id === activeTab)

  const commentsTarget = activeAccount
    ? ({ entityType: 'companyAccount', entityId: activeAccount.id } as const)
    : ({ entityType: 'company', entityId: item.id } as const)

  const handleTabChange = (value: string) => {
    if (value === ABOUT_TAB) {
      const origin =
        activeAccount?.accountType === 'client'
          ? 'clients'
          : activeAccount?.accountType === 'wishlist'
            ? 'wishlist'
            : from
      router.navigate({
        to: '/companies/$id/view',
        params: { id: item.id },
        search: origin ? { from: origin } : {},
        replace: true,
      })
    } else {
      router.navigate({
        to: '/companies/$id/view',
        params: { id: item.id },
        search: { tab: value },
        replace: true,
      })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-start">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="min-w-0"
      >
        <Card className="flex h-[79svh] flex-col gap-0 overflow-hidden">
          <CardHeader className="gap-3 border-b px-4">
            <div className="flex justify-between items-center">
              <TabsList className="w-max justify-start">
                <TabsTrigger value={ABOUT_TAB}>
                  <InfoIcon className="size-3.5" />О компании
                </TabsTrigger>
                {accountTabs.map((account) => {
                  const Icon =
                    account.accountType === 'wishlist'
                      ? BookmarkIcon
                      : UsersIcon

                  return (
                    <TabsTrigger
                      key={account.id}
                      value={account.id}
                      className="max-w-64"
                    >
                      <Icon className="size-3.5" />
                      <span className="truncate">
                        {accountTabLabel(account)}
                      </span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
              <HeaderActions
                companyId={item.id}
                activeAccount={activeAccount}
              />
            </div>
          </CardHeader>

          <CardContent className="flex-1 min-h-0 overflow-y-auto p-4">
            <TabsContent
              value={ABOUT_TAB}
              className="mt-0 flex flex-col gap-6 data-[state=inactive]:hidden"
            >
              <AboutCompanyTab item={item} onRefresh={refresh} />
            </TabsContent>

            {clientAccounts.map((account) => (
              <TabsContent
                key={account.id}
                value={account.id}
                className="mt-0 flex flex-col gap-6 data-[state=inactive]:hidden"
              >
                <ClientAccountTab account={account} onRefresh={refresh} />
              </TabsContent>
            ))}

            {wishlistAccounts.map((account) => (
              <TabsContent
                key={account.id}
                value={account.id}
                className="mt-0 flex flex-col gap-6 data-[state=inactive]:hidden"
              >
                <WishlistAccountTab
                  company={item}
                  account={account}
                  onRefresh={refresh}
                />
              </TabsContent>
            ))}
          </CardContent>
        </Card>
      </Tabs>

      <TodoComments
        key={`${commentsTarget.entityType}:${commentsTarget.entityId}`}
        entityType={commentsTarget.entityType}
        entityId={commentsTarget.entityId}
      />
    </div>
  )
}
