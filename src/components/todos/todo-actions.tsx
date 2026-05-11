import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { updateTodoStatus } from '@/components/todos/actions'
import type { TodoActionItem, TodoStatus } from '@/types'
import { authClient } from 'utils/auth-client'

import { Button } from '@/components/ui/button'

type StatusAction = 'accept' | 'complete' | 'reopen' | 'archive'

export const TodoActions = ({ item }: { item: TodoActionItem }) => {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const isResponsible = item.responsibleUsers.some(
    ({ user }) => user.id === session?.user.id,
  )

  if (!isResponsible) return null

  const handleUpdateStatus = async (action: StatusAction) => {
    setIsLoading(true)
    try {
      let newStatus: TodoStatus = item.status
      let completedAt: Date | null = item.completedAt ?? null
      let archivedAt: Date | null = item.archivedAt ?? null

      switch (action) {
        case 'accept':
          newStatus = 'in progress'
          break
        case 'complete':
          newStatus = 'completed'
          completedAt = new Date()
          break
        case 'reopen':
          newStatus = 'in progress'
          completedAt = null
          archivedAt = null
          break
        case 'archive':
          archivedAt = new Date()
          break
      }

      await updateTodoStatus({
        data: { id: item.id, status: newStatus, completedAt, archivedAt },
      })
      toast.success('Статус обновлён')
      router.invalidate()
    } catch {
      toast.error('Ошибка при обновлении статуса')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-4">
      {item.status === 'not started' && (
        <Button
          size="lg"
          disabled={isLoading}
          onClick={() => handleUpdateStatus('accept')}
        >
          Принять в работу
        </Button>
      )}
      {item.status === 'in progress' && (
        <Button
          size="lg"
          disabled={isLoading}
          onClick={() => handleUpdateStatus('complete')}
        >
          Завершить
        </Button>
      )}
      {(item.status === 'completed' || item.archivedAt) && (
        <Button
          size="lg"
          disabled={isLoading}
          onClick={() => handleUpdateStatus('reopen')}
        >
          Вернуть в работу
        </Button>
      )}
      {item.status === 'completed' && !item.archivedAt && (
        <Button
          size="lg"
          disabled={isLoading}
          onClick={() => handleUpdateStatus('archive')}
        >
          Отправить в архив
        </Button>
      )}
    </div>
  )
}
