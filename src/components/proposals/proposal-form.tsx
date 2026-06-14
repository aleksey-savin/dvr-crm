import * as React from 'react'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { PaperclipIcon, XIcon } from 'lucide-react'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '@/components/ui/combobox'
import {
  addProposal,
  updateProposal,
  fetchInitiativesForProposal,
} from '@/components/proposals/actions'
import {
  DOCUMENT_FILE_ACCEPT,
  resolveDocumentUrl,
} from '@/components/documents/actions'
import { readFileAsBase64 } from '@/lib/file-upload'
import type { ProposalRow, ProposalStatus } from '@/types'

const STATUS_OPTIONS: { value: ProposalStatus; label: string }[] = [
  { value: 'draft', label: 'Черновик' },
  { value: 'prepared', label: 'Подготовлено' },
  { value: 'approved', label: 'Согласовано' },
  { value: 'sent', label: 'Отправлено' },
]

const formSchema = z.object({
  initiativeId: z.string().min(1, 'Выберите инициативу'),
  status: z.enum(['draft', 'prepared', 'approved', 'sent']),
  description: z.string().nullable(),
})

type InitiativeOption = { id: string; title: string }

type Props = {
  item?: ProposalRow
  /** When set, the initiative picker is hidden and the value is fixed. */
  presetInitiativeId?: string | null
  onSuccess?: () => void
}

export function ProposalForm({
  item,
  presetInitiativeId = null,
  onSuccess,
}: Props) {
  const [initiatives, setInitiatives] = React.useState<InitiativeOption[]>([])
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [fileInputKey, setFileInputKey] = React.useState(0)
  const existingDoc = item?.documents[0] ?? null

  React.useEffect(() => {
    fetchInitiativesForProposal().then(setInitiatives).catch(console.error)
  }, [])

  // Инициатива фиксирована при редактировании или при создании из карточки
  // инициативы — в этих случаях выбор инициативы скрыт.
  const hideInitiativePicker = item != null || presetInitiativeId !== null

  const form = useForm({
    defaultValues: {
      initiativeId: item?.initiativeId ?? presetInitiativeId ?? '',
      status: item?.status ?? 'draft',
      description: item?.description ?? null,
    },
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      try {
        const file = selectedFile
          ? {
              fileName: selectedFile.name,
              mimeType: selectedFile.type || 'application/octet-stream',
              fileSize: selectedFile.size,
              fileBase64: await readFileAsBase64(selectedFile),
            }
          : null
        if (item) {
          await updateProposal({
            data: {
              id: item.id,
              initiativeId: value.initiativeId,
              status: value.status,
              description: value.description,
              file,
            },
          })
          toast.success('КП обновлено')
        } else {
          await addProposal({
            data: {
              initiativeId: value.initiativeId,
              status: value.status,
              description: value.description,
              file,
            },
          })
          toast.success('КП создано')
        }
        onSuccess?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
      }
    },
  })

  const handleOpenExisting = async () => {
    if (!existingDoc) return
    const popup = window.open('about:blank')
    try {
      const { url } = await resolveDocumentUrl({
        data: { documentId: existingDoc.id },
      })
      if (popup) popup.location.replace(url)
      else window.open(url, '_blank')
    } catch (error) {
      popup?.close()
      toast.error(
        error instanceof Error ? error.message : 'Не удалось открыть документ',
      )
    }
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    setFileInputKey((k) => k + 1)
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      {!hideInitiativePicker && (
        <form.Field name="initiativeId">
          {(field) => (
            <Field
              data-invalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
            >
              <FieldLabel>Инициатива *</FieldLabel>
              <Combobox
                items={initiatives}
                itemToStringValue={(i) => i.title}
                isItemEqualToValue={(a, b) => a.id === b.id}
                value={
                  initiatives.find((i) => i.id === field.state.value) ?? null
                }
                onValueChange={(i) => field.handleChange(i?.id ?? '')}
              >
                <ComboboxValue placeholder="Выберите инициативу" />
                <ComboboxContent>
                  <ComboboxEmpty>Инициативы не найдены</ComboboxEmpty>
                  <ComboboxList>
                    {(i) => (
                      <ComboboxItem key={i.id} value={i}>
                        {i.title}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>
      )}

      <form.Field name="status">
        {(field) => (
          <Field>
            <FieldLabel>Статус</FieldLabel>
            <Select
              value={field.state.value}
              onValueChange={(v) => field.handleChange(v as ProposalStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </form.Field>

      <Field>
        <FieldLabel htmlFor="proposal-file">Файл КП</FieldLabel>
        {existingDoc && !selectedFile && (
          <div className="flex items-center gap-2 border px-3 py-2 text-sm">
            <PaperclipIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <button
              type="button"
              className="min-w-0 flex-1 truncate text-left hover:underline"
              title={existingDoc.name}
              onClick={() => void handleOpenExisting()}
            >
              {existingDoc.name}
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            id="proposal-file"
            key={fileInputKey}
            type="file"
            accept={DOCUMENT_FILE_ACCEPT}
            className="h-auto cursor-pointer py-2"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
          {selectedFile && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              title="Убрать файл"
              onClick={clearSelectedFile}
            >
              <XIcon className="size-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {existingDoc ? 'Загрузите новый файл, чтобы заменить текущий. ' : ''}
          PDF, DOC, DOCX, XLS, XLSX, JPG, PNG. До 50 МБ.
        </p>
      </Field>

      <form.Field name="description">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Заметки</FieldLabel>
            <Textarea
              id={field.name}
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value || null)}
              placeholder="Краткий комментарий или отличия от предыдущей версии"
              rows={3}
            />
          </Field>
        )}
      </form.Field>

      <div className="flex justify-end border-t pt-4">
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение...' : item ? 'Сохранить' : 'Создать'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
