import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRightIcon, CalendarDaysIcon, FileTextIcon } from 'lucide-react'

import { fetchLatestPublishedRelease } from '@/components/changelog/actions'
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

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
  loader: () => fetchLatestPublishedRelease(),
})

function RouteComponent() {
  const latestRelease = Route.useLoaderData()

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-6">
      <Card className="rounded-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileTextIcon className="size-4" />
            Последний релиз
          </div>
          <CardTitle className="text-xl leading-7">
            {latestRelease ? latestRelease.title : 'Обновлений пока нет'}
          </CardTitle>
          <CardDescription className="text-base leading-6">
            {latestRelease
              ? getReleaseDescription(
                  latestRelease.summary,
                  latestRelease.content,
                )
              : 'После публикации релиза он появится в этом виджете.'}
          </CardDescription>
          <CardAction>
            <Button asChild variant="outline">
              <Link to="/changelog">
                Подробнее
                <ArrowRightIcon />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        {latestRelease && (
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">v{latestRelease.version}</Badge>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDaysIcon className="size-4" />
                {formatReleaseDate(
                  latestRelease.publishedAt ?? latestRelease.createdAt,
                )}
              </span>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

function getReleaseDescription(summary: string | null, content: string) {
  if (summary) return summary

  const text = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text || 'Подробности релиза доступны на странице changelog.'
}

function formatReleaseDate(value: Date | string) {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
