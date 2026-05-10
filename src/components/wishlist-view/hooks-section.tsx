import { toast } from 'sonner'
import { LinkIcon, PlusIcon, Settings2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  Section,
  TextEntryDialog,
  DeleteRowButton,
} from '@/components/client-view/shared'
import { addHook, deleteHook } from '@/components/accounts/actions'
import type { Hook } from '@/types'

type Props = {
  hooks: Hook[]
  wishlistClientId: string
  onRefresh: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

// ---------------------------------------------------------------------------
// Manage dialog content
// ---------------------------------------------------------------------------

function ManageDialog({ hooks, wishlistClientId, onRefresh }: Props) {
  return (
    <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Управление хуками</DialogTitle>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto pr-1">
        <Section
          icon={LinkIcon}
          title="Хуки"
          action={
            <TextEntryDialog
              title="Добавить хук"
              label="Описание хука"
              onAdd={async (description) => {
                await addHook({ data: { wishlistClientId, description } })
                toast.success('Хук добавлен')
                onRefresh()
              }}
            >
              <Button size="sm" variant="outline" className="gap-1.5">
                <PlusIcon className="size-3.5" />
                Добавить
              </Button>
            </TextEntryDialog>
          }
        >
          {hooks.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              Хуков не добавлено
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Описание</TableHead>
                  <TableHead>Добавлен</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {hooks.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="whitespace-pre-wrap">
                      {h.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {fmtDate(h.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DeleteRowButton
                        onDelete={async () => {
                          await deleteHook({ data: { id: h.id } })
                          toast.success('Хук удалён')
                          onRefresh()
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Section>
      </div>
    </DialogContent>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function HooksSection({ hooks, wishlistClientId, onRefresh }: Props) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <LinkIcon className="size-4 text-muted-foreground" />
          Хуки
          {hooks.length > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {hooks.length}
            </Badge>
          )}
        </div>

        {hooks.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Хуков не добавлено
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {hooks.map((h) => (
              <li
                key={h.id}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                <span className="whitespace-pre-wrap leading-snug">
                  {h.description}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 self-start shrink-0"
          >
            <Settings2Icon className="size-3.5" />
            Управлять
          </Button>
        </DialogTrigger>
        <ManageDialog
          hooks={hooks}
          wishlistClientId={wishlistClientId}
          onRefresh={onRefresh}
        />
      </Dialog>
    </div>
  )
}
