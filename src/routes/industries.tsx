import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { EditIcon, FactoryIcon, PlusIcon, Trash2Icon } from 'lucide-react'

import { fetchIndustries } from '@/components/industries/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/industries')({
  loader: () => fetchIndustries(),
  component: RouteComponent,
})

function RouteComponent() {
  const industries = Route.useLoaderData()

  return (
    <>
      {industries.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FactoryIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Отрасли не добавлены</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/industries/new" className="flex items-center gap-2">
                <PlusIcon className="size-4" />
                Создать
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Наименование</TableHead>
              <TableHead>Создана</TableHead>
              <TableHead className="w-0 text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {industries.map((industry) => (
              <TableRow key={industry.id}>
                <TableCell>
                  <Badge variant="secondary">{industry.name}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(industry.createdAt).toLocaleDateString('ru-RU')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="icon-sm">
                      <Link
                        to="/industries/$id/update"
                        params={{ id: industry.id }}
                      >
                        <EditIcon className="size-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="destructiveGhost" size="icon-sm">
                      <Link
                        to="/industries/$id/delete"
                        params={{ id: industry.id }}
                      >
                        <Trash2Icon className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Outlet />
    </>
  )
}
