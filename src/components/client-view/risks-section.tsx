import { toast } from 'sonner'
import { ShieldAlertIcon, PlusIcon, Settings2Icon } from 'lucide-react'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import * as z from 'zod'

import { db } from '@/db'
import { clientRisk } from '@/db/schema'

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

// ---------------------------------------------------------------------------
// Server fns
// ---------------------------------------------------------------------------

export const addRisk = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ clientId: z.string(), description: z.string().min(1) }),
  )
  .handler(async ({ data }) => {
    await db.insert(clientRisk).values({
      clientId: data.clientId,
      description: data.description,
    })
  })

export const deleteRisk = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(clientRisk).where(eq(clientRisk.id, data.id))
  })

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Risk = {
  id: string
  description: string
  createdAt: Date
}

type Props = {
  risks: Risk[]
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

function ManageDialog({ risks, clientId, onRefresh }: Props) {
  return (
    <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Управление рисками</DialogTitle>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto pr-1">
        <Section
          icon={ShieldAlertIcon}
          title="Риски"
          action={
            <TextEntryDialog
              title="Добавить риск"
              label="Описание риска"
              onAdd={async (description) => {
                await addRisk({ data: { clientId, description } })
                toast.success('Риск добавлен')
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
          {risks.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              Рисков не добавлено
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
                {risks.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-pre-wrap">
                      {r.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {fmtDate(r.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DeleteRowButton
                        onDelete={async () => {
                          await deleteRisk({ data: { id: r.id } })
                          toast.success('Риск удалён')
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

export function RisksSection({ risks, clientId, onRefresh }: Props) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldAlertIcon className="size-4 text-muted-foreground" />
          Риски
          {risks.length > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {risks.length}
            </Badge>
          )}
        </div>

        {risks.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Рисков не добавлено
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {risks.map((r) => (
              <li
                key={r.id}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <span className="mt-1.5 size-1.5 rounded-full bg-destructive shrink-0" />
                <span className="whitespace-pre-wrap leading-snug">
                  {r.description}
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
        <ManageDialog risks={risks} clientId={clientId} onRefresh={onRefresh} />
      </Dialog>
    </div>
  )
}
