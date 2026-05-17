import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '@/components/ui/combobox'
import { cn } from '@/lib/utils'

export type TableFilterOption<T extends string = string> = {
  value: T
  label: string
}

type MultiFilterComboboxProps<T extends string> = {
  options: Array<TableFilterOption<T>>
  value: T[]
  onValueChange: (value: T[]) => void
  placeholder: string
  emptyText: string
  className?: string
}

export function MultiFilterCombobox<T extends string>({
  options,
  value,
  onValueChange,
  placeholder,
  emptyText,
  className,
}: MultiFilterComboboxProps<T>) {
  const selectedOptions = options.filter((option) =>
    value.includes(option.value),
  )

  return (
    <Combobox
      items={options}
      itemToStringValue={(option) => option.label}
      isItemEqualToValue={(a, b) => a.value === b.value}
      multiple
      value={selectedOptions}
      onValueChange={(nextOptions) =>
        onValueChange(nextOptions.map((option) => option.value))
      }
    >
      <ComboboxChips
        className={cn(
          'w-full min-w-44 md:w-56 max-h-9 overflow-hidden has-data-[slot=combobox-chip]:max-h-none',
          className,
        )}
      >
        <ComboboxValue>
          {(selected: Array<TableFilterOption<T>>) =>
            selected.map((option) => (
              <ComboboxChip key={option.value}>{option.label}</ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput
          placeholder={selectedOptions.length === 0 ? placeholder : ''}
        />
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(option) => (
            <ComboboxItem key={option.value} value={option}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
