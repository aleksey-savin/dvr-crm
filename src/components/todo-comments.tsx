import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { authClient } from 'utils/auth-client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  MessageSquareIcon,
  PaperclipIcon,
  SendHorizontalIcon,
  RefreshCwIcon,
} from 'lucide-react'
import {
  addComment,
  fetchComments,
  markCommentsRead,
} from '@/components/comments/actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CommentItem = Awaited<ReturnType<typeof fetchComments>>[number]

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

const commentsKey = (entityType: string, entityId: string) =>
  ['comments', entityType, entityId] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatCommentTime(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1) return 'только что'
  if (diffMins < 60) return `${diffMins} мин. назад`
  if (diffHours < 24) return `${diffHours} ч. назад`
  if (diffDays < 7)
    return d.toLocaleDateString('ru-RU', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: diffDays > 365 ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatBytes(bytes: string) {
  const n = parseInt(bytes, 10)
  if (isNaN(n)) return bytes
  if (n < 1024) return `${n} Б`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`
  return `${(n / 1024 / 1024).toFixed(1)} МБ`
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="size-8 rounded-full shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

function CommentBubble({
  item,
  currentUserId,
}: {
  item: CommentItem
  currentUserId?: string
}) {
  const isOwn = item.author.id === currentUserId
  const isUnread =
    currentUserId && !item.reads.some((r) => r.userId === currentUserId)

  return (
    <div className={cn('flex gap-3 group', isOwn && 'flex-row-reverse')}>
      {/* Avatar */}
      <Avatar size="sm" className="shrink-0 mt-0.5">
        {item.author.image && (
          <AvatarImage src={item.author.image} alt={item.author.name} />
        )}
        <AvatarFallback>{getInitials(item.author.name)}</AvatarFallback>
      </Avatar>

      {/* Bubble */}
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[80%] min-w-0',
          isOwn && 'items-end',
        )}
      >
        {/* Author + time + unread badge */}
        <div
          className={cn(
            'flex items-center gap-1.5 flex-wrap',
            isOwn && 'flex-row-reverse',
          )}
        >
          <span className="text-xs font-medium leading-none">
            {isOwn ? 'Вы' : item.author.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatCommentTime(item.createdAt)}
          </span>
          {item.editedAt && (
            <span className="text-xs text-muted-foreground italic">(изм.)</span>
          )}
          {isUnread && !isOwn && (
            <Badge
              variant="default"
              className="h-4 px-1 text-[10px] leading-none"
            >
              Новое
            </Badge>
          )}
        </div>

        {/* Content */}
        <div
          className={cn(
            'rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-all overflow-wrap-anywhere min-w-0 w-full',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted text-foreground rounded-tl-sm',
          )}
        >
          {item.content}
        </div>

        {/* Attachments */}
        {item.attachments.length > 0 && (
          <div
            className={cn('flex flex-col gap-1 w-full', isOwn && 'items-end')}
          >
            {item.attachments.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs rounded-lg px-2 py-1 border transition-colors',
                  'hover:bg-accent text-muted-foreground hover:text-foreground',
                )}
              >
                <PaperclipIcon className="size-3 shrink-0" />
                <span className="truncate max-w-50">{att.name}</span>
                {att.size && (
                  <span className="text-muted-foreground/60 shrink-0">
                    ({formatBytes(att.size)})
                  </span>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface TodoCommentsProps {
  entityType: string
  entityId: string
}

export function TodoComments({ entityType, entityId }: TodoCommentsProps) {
  const { data: session } = authClient.useSession()
  const queryClient = useQueryClient()
  const userId = session?.user.id

  const [content, setContent] = React.useState('')
  const bottomRef = React.useRef<HTMLDivElement>(null)

  // ------------------------------------------------------------------
  // Fetch comments with background polling
  // ------------------------------------------------------------------
  const {
    data: comments = [],
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: commentsKey(entityType, entityId),
    queryFn: () => fetchComments({ data: { entityType, entityId } }),
    refetchInterval: 10_000,
    staleTime: 5_000,
  })

  // ------------------------------------------------------------------
  // Mark unread as read whenever new comments arrive
  // ------------------------------------------------------------------
  React.useEffect(() => {
    if (!userId || comments.length === 0) return

    const unreadIds = comments
      .filter((c) => !c.reads.some((r) => r.userId === userId))
      .map((c) => c.id)

    if (unreadIds.length === 0) return

    // Optimistically update the cache so "Новое" badges disappear immediately
    queryClient.setQueryData(
      commentsKey(entityType, entityId),
      (old: CommentItem[] | undefined) =>
        (old ?? []).map((c) =>
          unreadIds.includes(c.id)
            ? {
                ...c,
                reads: [
                  ...c.reads,
                  { commentId: c.id, userId, readAt: new Date() },
                ],
              }
            : c,
        ),
    )

    markCommentsRead({ data: { commentIds: unreadIds, userId } }).catch(
      console.error,
    )
  }, [comments, userId, entityType, entityId, queryClient])

  // ------------------------------------------------------------------
  // Scroll to bottom when the list grows
  // ------------------------------------------------------------------
  React.useEffect(() => {
    if (!isLoading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments.length, isLoading])

  // ------------------------------------------------------------------
  // Add comment mutation — invalidates the query on success
  // ------------------------------------------------------------------
  const mutation = useMutation({
    mutationFn: (vars: {
      entityType: string
      entityId: string
      content: string
      authorId: string
    }) => addComment({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentsKey(entityType, entityId),
      })
    },
    onError: () => {
      toast.error('Не удалось отправить комментарий')
    },
  })

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || !userId || mutation.isPending) return

    mutation.mutate(
      { entityType, entityId, content: trimmed, authorId: userId },
      { onSuccess: () => setContent('') },
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const unreadCount = comments.filter(
    (c) => c.author.id !== userId && !c.reads.some((r) => r.userId === userId),
  ).length

  return (
    <Card
      className="flex flex-col gap-0 overflow-hidden"
      style={{ height: '85svh' }}
    >
      {/* Header */}
      <CardHeader className="border-b shrink-0 py-3">
        <div className="flex items-center gap-2">
          <MessageSquareIcon className="size-4 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">Комментарии</CardTitle>
          {!isLoading && comments.length > 0 && (
            <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
              {comments.length}
            </Badge>
          )}
          {unreadCount > 0 && (
            <Badge variant="default" className="h-5 px-1.5 text-xs">
              {unreadCount} новых
            </Badge>
          )}
          {/* Background refetch spinner */}
          {isFetching && !isLoading && (
            <RefreshCwIcon className="size-3.5 text-muted-foreground animate-spin ml-auto" />
          )}
        </div>
      </CardHeader>

      {/* Comments list */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-5 p-4">
          {isLoading ? (
            <>
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <MessageSquareIcon className="size-8 text-destructive/40" />
              <p className="text-sm text-muted-foreground">
                Не удалось загрузить комментарии.
              </p>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <MessageSquareIcon className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Пока нет комментариев.
              </p>
            </div>
          ) : (
            comments.map((c) => (
              <CommentBubble key={c.id} item={c} currentUserId={userId} />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t shrink-0 p-3 flex flex-col gap-2 bg-card">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Написать комментарий…"
          className="resize-none min-h-18 text-sm"
          disabled={mutation.isPending || !session?.user}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Ctrl+Enter для отправки
          </p>
          <Button
            size="sm"
            onClick={() => handleSubmit()}
            disabled={!content.trim() || mutation.isPending || !session?.user}
            className="gap-1.5"
          >
            <SendHorizontalIcon className="size-3.5" />
            {mutation.isPending ? 'Отправка…' : 'Отправить'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
