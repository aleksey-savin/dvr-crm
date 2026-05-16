import type { ColumnDef } from '@tanstack/react-table'
import { useNavigate } from '@tanstack/react-router'
import { MoreHorizontalIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { roleLabels } from '@/utils/roleLabels'
import type { UserRow } from '@/types'

function UserActions({ user }: { user: UserRow }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontalIcon />
            <span className="sr-only">Открыть меню</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              navigate({ to: '/users/$id/update', params: { id: user.id } })
            }
          >
            Изменить
          </DropdownMenuItem>
          {user.banned ? (
            <DropdownMenuItem
              onClick={() =>
                navigate({ to: '/users/$id/unban', params: { id: user.id } })
              }
            >
              Разблокировать
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() =>
                navigate({ to: '/users/$id/ban', params: { id: user.id } })
              }
            >
              Заблокировать
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() =>
              navigate({ to: '/users/$id/delete', params: { id: user.id } })
            }
          >
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: 'name',
    header: 'Имя',
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Роль',
    cell: ({ row }) =>
      roleLabels[row.original.role ?? 'user'] ?? row.original.role,
  },
  {
    accessorKey: 'banned',
    header: 'Заблокирован',
    cell: ({ row }) =>
      row.original.banned ? (
        <Badge variant="destructive">Да</Badge>
      ) : (
        <span className="text-muted-foreground">Нет</span>
      ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Дата создания',
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString('ru-RU'),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <UserActions user={row.original} />,
  },
]
