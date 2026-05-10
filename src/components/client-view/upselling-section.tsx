import { toast } from 'sonner'
import { SparklesIcon, PlusIcon, Settings2Icon } from 'lucide-react'

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

import { Section, TextEntryDialog, DeleteRowButton } from './shared'
import { addUpselling, deleteUpselling } from '@/components/accounts/actions'
import type { Upselling } from '@/types'

type Props = {
  upsellingOpportunities: Upselling[]
  clientId: string
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

function ManageDialog({ upsellingOpportunities, clientId, onRefresh }: Props) {
  return (
    <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Управление апсейлом</DialogTitle>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto pr-1">
        <Section
          icon={SparklesIcon}
          title="Возможности апсейла"
          action={
            <TextEntryDialog
              title="Добавить возможность апсейла"
              label="Описание"
              onAdd={async (description) => {
                await addUpselling({ data: { clientId, description } })
                toast.success('Запись добавлена')
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
          {upsellingOpportunities.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              Возможностей не добавлено
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
                {upsellingOpportunities.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="whitespace-pre-wrap">
                      {u.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {fmtDate(u.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DeleteRowButton
                        onDelete={async () => {
                          await deleteUpselling({ data: { id: u.id } })
                          toast.success('Запись удалена')
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

export function UpsellingSection({
  upsellingOpportunities,
  clientId,
  onRefresh,
}: Props) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SparklesIcon className="size-4 text-muted-foreground" />
          Апсейл
          {upsellingOpportunities.length > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {upsellingOpportunities.length}
            </Badge>
          )}
        </div>

        {upsellingOpportunities.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Возможностей не добавлено
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {upsellingOpportunities.map((u) => (
              <li
                key={u.id}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                <span className="whitespace-pre-wrap leading-snug">
                  {u.description}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Manage button */}
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
          upsellingOpportunities={upsellingOpportunities}
          clientId={clientId}
          onRefresh={onRefresh}
        />
      </Dialog>
    </div>
  )
}
