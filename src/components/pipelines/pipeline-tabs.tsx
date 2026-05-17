import {
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { PipelineWithStages } from '@/types'

type PipelineTabsProps = {
  pipelines: PipelineWithStages[]
  selectedId: string
  onSelect: (id: string) => void
  onCreate: () => void
  onEdit: (pipeline: PipelineWithStages) => void
  onDelete: (pipeline: PipelineWithStages) => void
}

export function PipelineTabs({
  pipelines,
  selectedId,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
}: PipelineTabsProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border bg-card p-0.5">
      {pipelines.map((p) => {
        const isActive = p.id === selectedId
        return (
          <div key={p.id} className="flex items-center">
            <button
              type="button"
              onClick={() => onSelect(p.id)}
              className={cn(
                'h-7 rounded-sm px-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-secondary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {p.name}
            </button>
            {isActive && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground"
                  >
                    <MoreVerticalIcon className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => onEdit(p)}>
                    <PencilIcon className="size-3.5" />
                    Редактировать
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(p)}
                  >
                    <Trash2Icon className="size-3.5" />
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )
      })}
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground"
        onClick={onCreate}
        title="Создать воронку"
      >
        <PlusIcon className="size-3.5" />
      </Button>
    </div>
  )
}
