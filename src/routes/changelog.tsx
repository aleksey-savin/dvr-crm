import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import {
  CalendarDaysIcon,
  EditIcon,
  FileTextIcon,
  Trash2Icon,
} from 'lucide-react'

import { fetchChangelogPage } from '@/components/changelog/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import type { ChangelogReleaseRow } from '@/types'

export const Route = createFileRoute('/changelog')({
  component: RouteComponent,
  loader: () => fetchChangelogPage(),
})

function RouteComponent() {
  const { releases, canManage } = Route.useLoaderData()

  return (
    <>
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6">
        {releases.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileTextIcon />
              </EmptyMedia>
              <EmptyTitle>Релизов пока нет</EmptyTitle>
              <EmptyDescription>
                Опубликованные изменения появятся на этой странице.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            {releases.map((release) => (
              <ReleaseCard
                key={release.id}
                release={release}
                canManage={canManage}
              />
            ))}
          </div>
        )}
      </div>

      <Outlet />
    </>
  )
}

function ReleaseCard({
  release,
  canManage,
}: {
  release: ChangelogReleaseRow
  canManage: boolean
}) {
  const date = release.publishedAt ?? release.createdAt

  return (
    <Card className="rounded-lg">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDaysIcon className="size-4" />
            {formatReleaseDate(date)}
          </span>
          <Badge variant="secondary">v{release.version}</Badge>
          {canManage && (
            <Badge
              variant={release.status === 'published' ? 'success' : 'warning'}
            >
              {release.status === 'published' ? 'Опубликовано' : 'Черновик'}
            </Badge>
          )}
        </div>

        <div>
          <CardTitle className="text-xl leading-7">{release.title}</CardTitle>
          {release.summary && (
            <CardDescription className="mt-2 text-base leading-6">
              {release.summary}
            </CardDescription>
          )}
        </div>

        {canManage && (
          <CardAction className="flex gap-1">
            <Button asChild variant="ghost" size="icon-sm">
              <Link to="/changelog/$id/update" params={{ id: release.id }}>
                <EditIcon />
                <span className="sr-only">Изменить</span>
              </Link>
            </Button>
            <Button asChild variant="destructiveGhost" size="icon-sm">
              <Link to="/changelog/$id/delete" params={{ id: release.id }}>
                <Trash2Icon />
                <span className="sr-only">Удалить</span>
              </Link>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <div
          className="changelog-content"
          dangerouslySetInnerHTML={{ __html: release.content }}
        />
      </CardContent>
    </Card>
  )
}

function formatReleaseDate(value: Date | string) {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
