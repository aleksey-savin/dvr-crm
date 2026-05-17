import '@/components/tiptap/tiptap.css'

import * as React from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TodoComments } from '@/components/todos/todo-comments'
import { Section } from '@/components/companyAccounts/client-view/shared'
import { ContactsSection } from '@/components/companies/contacts-section'
import { RevenueSection } from '@/components/companies/revenue-section'
import { CounterpartiesSection } from '@/components/companies/counterparties-section'
import { ProfitForecastSection } from '@/components/companyAccounts/client-view/profit-forecast-section'
import GrossProfitFactsSection from '@/components/companyAccounts/gross-profit-facts-section'
import { RisksSection } from '@/components/companyAccounts/client-view/risks-section'
import { UpsellingSection } from '@/components/companyAccounts/client-view/upselling-section'
import { ClientTodosSection } from '@/components/companyAccounts/client-view/client-todos-section'
import { InitiativesSection } from '@/components/companyAccounts/client-view/initiatives-section'
import { HooksSection } from '@/components/companyAccounts/wishlist-view/hooks-section'
import { WishlistTodosSection } from '@/components/companyAccounts/wishlist-view/wishlist-todos-section'
import { fetchCompany } from '@/components/companies/actions'
import {
  deleteGrossProfitFact,
  getFilteredUsersByDepartments,
  joinWishlistDepartments,
} from '@/components/companyAccounts/actions'
import { useDepartmentStore } from '@/stores/department-store'

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
type WishlistDepartment = { id: string; name: string }
type ManagerOption = { id: string; name: string }

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
    return 'Вишлист'
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

function wishlistDepartments(account: CompanyAccount) {
  if (account.departments.length > 0) {
    return account.departments.map(({ department }) => department)
  }

  return [account.businessUnit]
}

function collectDescendantIds(
  departments: Array<{ id: string; parentId?: string | null }>,
  rootId: string,
): string[] {
  const result = new Set([rootId])
  const queue = [rootId]
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const department of departments) {
      if (department.parentId === current && !result.has(department.id)) {
        result.add(department.id)
        queue.push(department.id)
      }
    }
  }
  return Array.from(result)
}

function HeaderActions({
  companyId,
  activeAccount,
  wishlistAccount,
  existingWishlistDepartments,
}: {
  companyId: string
  activeAccount?: CompanyAccount
  wishlistAccount?: CompanyAccount
  existingWishlistDepartments: WishlistDepartment[]
}) {
  const router = useRouter()
  const selectedDepartmentId = useDepartmentStore((s) => s.selectedDepartmentId)
  const departments = useDepartmentStore((s) => s.departments)
  const [selectionOpen, setSelectionOpen] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [infoOpen, setInfoOpen] = React.useState(false)
  const [selectedJoinIds, setSelectedJoinIds] = React.useState<string[]>([])
  const [availableManagers, setAvailableManagers] = React.useState<
    ManagerOption[]
  >([])
  const [selectedManagerIds, setSelectedManagerIds] = React.useState<string[]>(
    [],
  )
  const [isLoadingManagers, setIsLoadingManagers] = React.useState(false)
  const [isJoining, setIsJoining] = React.useState(false)
  const [joinError, setJoinError] = React.useState<string | null>(null)
  const selectedDepartment = departments.find(
    (department) => department.id === selectedDepartmentId,
  )
  const existingDepartmentIds = new Set(
    existingWishlistDepartments.map((department) => department.id),
  )
  const existingDepartmentNames = existingWishlistDepartments
    .map((department) => department.name)
    .join(', ')
  const scopedDepartments = (() => {
    if (
      !selectedDepartmentId ||
      selectedDepartment?.departmentType === 'sales'
    ) {
      return departments
    }

    const ids = collectDescendantIds(departments, selectedDepartmentId)
    return departments.filter((department) => ids.includes(department.id))
  })()
  const availableDepartments = scopedDepartments.filter(
    (department) =>
      department.departmentType === 'sales' &&
      !existingDepartmentIds.has(department.id),
  )
  const confirmDepartment =
    selectedJoinIds.length === 1
      ? departments.find((department) => department.id === selectedJoinIds[0])
      : undefined
  const existingManagerIds = new Set(
    wishlistAccount?.managers.map(({ user }) => user.id) ?? [],
  )
  const selectedJoinKey = selectedJoinIds.join('|')

  React.useEffect(() => {
    if ((!selectionOpen && !confirmOpen) || selectedJoinIds.length === 0) {
      setAvailableManagers([])
      setSelectedManagerIds([])
      return
    }

    let ignore = false
    setIsLoadingManagers(true)

    getFilteredUsersByDepartments({
      data: { businessUnitIds: selectedJoinIds },
    })
      .then((users) => {
        if (ignore) return
        const options = users.filter((user) => !existingManagerIds.has(user.id))
        setAvailableManagers(options)
        setSelectedManagerIds((current) =>
          current.filter((id) => options.some((user) => user.id === id)),
        )
      })
      .catch((error) => {
        if (ignore) return
        setJoinError(
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить ответственных',
        )
        setAvailableManagers([])
        setSelectedManagerIds([])
      })
      .finally(() => {
        if (!ignore) setIsLoadingManagers(false)
      })

    return () => {
      ignore = true
    }
  }, [selectedJoinKey, selectionOpen, confirmOpen])

  const handleWishlistClick = () => {
    if (!wishlistAccount) return

    const isSelectedSalesDepartment =
      selectedDepartment?.departmentType === 'sales'
    const alreadyJoined = selectedDepartmentId
      ? existingWishlistDepartments.some(
          (department) => department.id === selectedDepartmentId,
        )
      : false

    if (!isSelectedSalesDepartment) {
      setSelectedJoinIds([])
      setJoinError(null)
      setSelectionOpen(true)
      return
    }

    if (alreadyJoined) {
      setJoinError(null)
      setInfoOpen(true)
      return
    }

    setSelectedJoinIds([selectedDepartment.id])
    setJoinError(null)
    setConfirmOpen(true)
  }

  const renderManagerPicker = () => {
    if (selectedJoinIds.length === 0) return null

    return (
      <div className="flex flex-col gap-2 rounded-md border border-dashed px-3 py-2">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Ответственные менеджеры</p>
          <p className="text-xs text-muted-foreground">
            Можно выбрать сейчас или назначить позже.
          </p>
        </div>

        {isLoadingManagers ? (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        ) : availableManagers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Нет доступных менеджеров для выбранных подразделений.
          </p>
        ) : (
          <div className="flex max-h-40 flex-col gap-2 overflow-y-auto pr-1">
            {availableManagers.map((manager) => (
              <label
                key={manager.id}
                className="flex cursor-pointer items-center gap-3 text-sm"
              >
                <Checkbox
                  checked={selectedManagerIds.includes(manager.id)}
                  onCheckedChange={(checked) => {
                    setSelectedManagerIds((current) =>
                      checked
                        ? [...current, manager.id]
                        : current.filter((id) => id !== manager.id),
                    )
                  }}
                />
                <span>{manager.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    )
  }

  const handleJoin = async (departmentIds: string[]) => {
    if (!wishlistAccount || departmentIds.length === 0) return

    setIsJoining(true)
    setJoinError(null)
    try {
      await joinWishlistDepartments({
        data: {
          wishlistAccountId: wishlistAccount.id,
          departmentIds,
          managerUserIds: selectedManagerIds,
        },
      })
      setConfirmOpen(false)
      setSelectionOpen(false)
      setSelectedJoinIds([])
      setSelectedManagerIds([])
      await router.invalidate()
    } catch (error) {
      setJoinError(
        error instanceof Error ? error.message : 'Не удалось присоединиться',
      )
    } finally {
      setIsJoining(false)
    }
  }

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
    <>
      <div className="flex items-center gap-1 shrink-0">
        {wishlistAccount ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleWishlistClick}
          >
            <BookmarkPlusIcon className="size-4" />В вишлист
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/wishlist/new" search={{ companyId }}>
              <BookmarkPlusIcon className="size-4" />В вишлист
            </Link>
          </Button>
        )}
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

      <Dialog open={selectionOpen} onOpenChange={setSelectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Присоединить подразделения</DialogTitle>
            <DialogDescription>
              По этой компании уже ведется работа
              {existingDepartmentNames ? `: ${existingDepartmentNames}.` : '.'}
            </DialogDescription>
          </DialogHeader>

          {availableDepartments.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
              Нет доступных продающих подразделений, которые еще не участвуют в
              вишлисте по этой компании.
            </p>
          ) : (
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
              {availableDepartments.map((department) => (
                <label
                  key={department.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={selectedJoinIds.includes(department.id)}
                    onCheckedChange={(checked) => {
                      setSelectedJoinIds((current) =>
                        checked
                          ? [...current, department.id]
                          : current.filter((id) => id !== department.id),
                      )
                    }}
                  />
                  <span>{department.name}</span>
                </label>
              ))}
            </div>
          )}

          {renderManagerPicker()}

          {joinError && <p className="text-sm text-destructive">{joinError}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isJoining}
              onClick={() => setSelectionOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="button"
              disabled={
                isJoining ||
                availableDepartments.length === 0 ||
                selectedJoinIds.length === 0
              }
              onClick={() => handleJoin(selectedJoinIds)}
            >
              Присоединиться
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Присоединиться к вишлисту?</AlertDialogTitle>
            <AlertDialogDescription>
              По этой компании уже ведется работа
              {existingDepartmentNames
                ? `: ${existingDepartmentNames}.`
                : '.'}{' '}
              Добавить {confirmDepartment?.name ?? 'выбранное подразделение'}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {joinError && <p className="text-sm text-destructive">{joinError}</p>}
          {renderManagerPicker()}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isJoining}>Отмена</AlertDialogCancel>
            <Button
              type="button"
              disabled={isJoining || selectedJoinIds.length === 0}
              onClick={() => handleJoin(selectedJoinIds)}
            >
              Присоединиться
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={infoOpen} onOpenChange={setInfoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подразделение уже участвует</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedDepartment?.name ?? 'Выбранное подразделение'} уже
              участвует в вишлисте по этой компании.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button type="button" onClick={() => setInfoOpen(false)}>
              Понятно
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
          {item.industry ||
          regionalMarketPosition ||
          item.scope ||
          item.website ? (
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
        contacts={item.contacts.map((c) => ({
          ...c,
          contactRoleName: c.role?.name ?? null,
        }))}
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
  companyId,
  onRefresh,
}: {
  account: CompanyAccount
  companyId: string
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

      <GrossProfitFactsSection
        facts={account.grossProfitFacts}
        clientId={account.id}
        managers={accountManagers(account).map((manager) => ({
          id: manager.id,
          name: manager.name,
        }))}
        onDelete={async (id) => {
          await deleteGrossProfitFact({ data: { id } })
          onRefresh()
        }}
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

      <Separator />

      <InitiativesSection
        clientId={account.id}
        companyId={companyId}
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
  departments,
  onRefresh,
}: {
  company: CompanyDetail
  account: CompanyAccount
  departments: WishlistDepartment[]
  onRefresh: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <Section icon={UsersIcon} title="Ответственный">
        {accountManagers(account).length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Ответственный не назначен
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {accountManagers(account).map((user) => (
              <Badge key={user.id} variant="secondary">
                {user.name}
              </Badge>
            ))}
          </div>
        )}
      </Section>

      {company.industry && (
        <Section icon={InfoIcon} title="Отрасль">
          <p className="text-sm text-muted-foreground">{company.industry}</p>
        </Section>
      )}

      <Section icon={Building2Icon} title="Интересна подразделениям">
        <div className="flex flex-wrap gap-1.5">
          {departments.map((department) => (
            <Badge key={department.id} variant="secondary">
              {department.name}
            </Badge>
          ))}
        </div>
      </Section>

      {account.why && (
        <Section icon={HeartIcon} title="Почему хотим">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {account.why}
          </p>
        </Section>
      )}

      {account.wishlistOffer && (
        <Section icon={BookmarkIcon} title="Что предлагаем">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {account.wishlistOffer}
          </p>
        </Section>
      )}

      {account.contactNotes && (
        <Section icon={UsersRoundIcon} title="Контакты из вишлиста">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {account.contactNotes}
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
  const wishlistAccount = wishlistAccounts[0] as CompanyAccount | undefined
  const wishlistDepartmentMap = new Map<string, WishlistDepartment>()

  for (const account of wishlistAccounts) {
    for (const department of wishlistDepartments(account)) {
      wishlistDepartmentMap.set(department.id, {
        id: department.id,
        name: department.name,
      })
    }
  }

  const mergedWishlistDepartments = Array.from(wishlistDepartmentMap.values())
  const accountTabs = [
    ...clientAccounts,
    ...(wishlistAccount ? [wishlistAccount] : []),
  ]

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
                wishlistAccount={wishlistAccount}
                existingWishlistDepartments={mergedWishlistDepartments}
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
                <ClientAccountTab account={account} companyId={item.id} onRefresh={refresh} />
              </TabsContent>
            ))}

            {wishlistAccount && (
              <TabsContent
                key={wishlistAccount.id}
                value={wishlistAccount.id}
                className="mt-0 flex flex-col gap-6 data-[state=inactive]:hidden"
              >
                <WishlistAccountTab
                  company={item}
                  account={wishlistAccount}
                  departments={mergedWishlistDepartments}
                  onRefresh={refresh}
                />
              </TabsContent>
            )}
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
