import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  ArchiveIcon,
  ArrowDownToLineIcon,
  MoreHorizontalIcon,
  RotateCcwIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { setWishlistState } from './actions'
import type { WishlistState } from '@/types'

const STATE_ACTIONS: Array<{
  state: WishlistState
  label: string
  icon: typeof ArchiveIcon
}> = [
  { state: 'active', label: 'Вернуть в активные', icon: RotateCcwIcon },
  { state: 'basement', label: 'В подвал', icon: ArrowDownToLineIcon },
  { state: 'archived', label: 'В архив', icon: ArchiveIcon },
]

export function WishlistRowActions({
  id,
  currentState,
}: {
  id: string
  currentState: WishlistState | null
}) {
  const router = useRouter()

  const change = async (wishlistState: WishlistState) => {
    try {
      await setWishlistState({ data: { id, wishlistState } })
      toast.success('Статус обновлён')
      await router.invalidate()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось обновить статус',
      )
    }
  }

  const actions = STATE_ACTIONS.filter(
    (action) => action.state !== (currentState ?? 'active'),
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Сменить статус">
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map(({ state, label, icon: Icon }) => (
          <DropdownMenuItem key={state} onSelect={() => change(state)}>
            <Icon className="size-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
