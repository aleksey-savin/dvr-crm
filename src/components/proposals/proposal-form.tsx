import * as React from 'react'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
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
import type { ProposalRow } from '@/types'

const NULLABLE_PLACEHOLDER = '__none__'

const formSchema = z.object({
  initiativeId: z.string().min(1, 'Выберите инициативу'),
  title: z.string().min(1, 'Название обязательно'),
  amount: z.string().nullable(),
  validUntil: z.string().nullable(),
  description: z.string().nullable(),
  proposalType: z.enum(['initial', 'revised', 'final']).nullable(),
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

  React.useEffect(() => {
    fetchInitiativesForProposal().then(setInitiatives).catch(console.error)
  }, [])

  const isQuickMode = !item && presetInitiativeId !== null

  const form = useForm({
    defaultValues: {
      initiativeId: item?.initiativeId ?? presetInitiativeId ?? '',
      title: item?.title ?? '',
      amount: item?.amount ?? null,
      validUntil: item?.validUntil ?? null,
      description: item?.description ?? null,
      proposalType: (item?.proposalType ?? null) as
        | 'initial'
        | 'revised'
        | 'final'
        | null,
    },
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      try {
        if (item) {
          await updateProposal({
            data: {
              id: item.id,
              initiativeId: value.initiativeId,
              title: value.title,
              amount: value.amount,
              validUntil: value.validUntil,
              description: value.description,
              proposalType: value.proposalType,
            },
          })
          toast.success('КП обновлено')
        } else {
          await addProposal({ data: value })
          toast.success('КП создано')
        }
        onSuccess?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
      }
    },
  })

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      {!isQuickMode && (
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

      <form.Field name="title">
        {(field) => (
          <Field
            data-invalid={
              field.state.meta.isTouched && !field.state.meta.isValid
            }
          >
            <FieldLabel htmlFor={field.name}>Название *</FieldLabel>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Например: PR-поддержка запуска проекта"
            />
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="amount">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Сумма, ₽</FieldLabel>
              <Input
                id={field.name}
                inputMode="decimal"
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value || null)}
                placeholder="0"
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="validUntil">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Срок действия</FieldLabel>
              <Input
                id={field.name}
                type="date"
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value || null)}
              />
            </Field>
          )}
        </form.Field>
      </div>

      <form.Field name="proposalType">
        {(field) => (
          <Field>
            <FieldLabel>Тип</FieldLabel>
            <Select
              value={field.state.value ?? NULLABLE_PLACEHOLDER}
              onValueChange={(v) =>
                field.handleChange(
                  v === NULLABLE_PLACEHOLDER
                    ? null
                    : (v as 'initial' | 'revised' | 'final'),
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Не выбран" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NULLABLE_PLACEHOLDER}>Не выбран</SelectItem>
                <SelectItem value="initial">Первичное</SelectItem>
                <SelectItem value="revised">Уточнённое</SelectItem>
                <SelectItem value="final">Финальное</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Описание</FieldLabel>
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
