import { Check, ChevronsUpDown, GalleryVerticalEnd } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useDepartmentStore, type Department } from '@/stores/department-store'

function ColorDot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block rounded-full shrink-0 ring-1 ring-white/20"
      style={{ width: size, height: size, backgroundColor: color }}
    />
  )
}

export function VersionSwitcher({
  departments,
}: {
  departments: Department[]
}) {
  const { selectedDepartmentId, setSelectedDepartmentId } = useDepartmentStore()

  const selected = departments.find((d) => d.id === selectedDepartmentId)
  const label = selected?.name ?? 'Все подразделения'
  const accentColor = selected?.accentColor

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {/* Icon area — filled with accent colour when a dept is active */}
              <div
                className="flex aspect-square size-8 items-center justify-center rounded-lg transition-colors duration-300"
                style={
                  accentColor ? { backgroundColor: accentColor } : undefined
                }
                // fallback class applied only when no accent colour
                data-default={!accentColor || undefined}
              >
                <span
                  className={
                    !accentColor
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground flex size-full items-center justify-center rounded-lg'
                      : ''
                  }
                >
                  <GalleryVerticalEnd
                    className="size-4"
                    style={accentColor ? { color: '#fff' } : undefined}
                  />
                </span>
              </div>

              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">ДВР Групп</span>
                <span className="flex items-center gap-1.5">
                  {accentColor && <ColorDot color={accentColor} />}
                  {label}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width)"
            align="start"
          >
            {/* "All departments" option */}
            <DropdownMenuItem onSelect={() => setSelectedDepartmentId(null)}>
              <span className="flex items-center gap-2 flex-1">
                {/* Empty placeholder so names stay aligned */}
                <span
                  className="inline-block shrink-0"
                  style={{ width: 8, height: 8 }}
                />
                Все подразделения
              </span>
              {selectedDepartmentId === null && (
                <Check className="ml-auto size-4" />
              )}
            </DropdownMenuItem>

            {departments.map((dept) => (
              <DropdownMenuItem
                key={dept.id}
                onSelect={() => setSelectedDepartmentId(dept.id)}
              >
                <span className="flex items-center gap-2 flex-1">
                  {dept.accentColor ? (
                    <ColorDot color={dept.accentColor} />
                  ) : (
                    <span
                      className="inline-block shrink-0"
                      style={{ width: 8, height: 8 }}
                    />
                  )}
                  {dept.name}
                </span>
                {dept.id === selectedDepartmentId && (
                  <Check className="ml-auto size-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
