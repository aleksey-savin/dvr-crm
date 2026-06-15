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
import { useDepartmentStore } from '@/stores/department-store'
import type { DepartmentOption } from '@/types'

function buildFlatTree(
  departments: DepartmentOption[],
): Array<DepartmentOption & { depth: number }> {
  const ids = new Set(departments.map((d) => d.id))
  const byParent = new Map<string | null, DepartmentOption[]>()
  for (const d of departments) {
    // A parent outside the accessible set is treated as a root, so a department
    // head (whose top department's parent is not accessible) still sees their
    // whole subtree in the switcher.
    const key = d.parentId && ids.has(d.parentId) ? d.parentId : null
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(d)
  }
  const result: Array<DepartmentOption & { depth: number }> = []
  function traverse(parentId: string | null, depth: number) {
    for (const d of byParent.get(parentId) ?? []) {
      result.push({ ...d, depth })
      traverse(d.id, depth + 1)
    }
  }
  traverse(null, 0)
  return result
}

function ColorDot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block rounded-full shrink-0 ring-1 ring-white/20"
      style={{ width: size, height: size, backgroundColor: color }}
    />
  )
}

function DeptIcon({ accentColor }: { accentColor?: string | null }) {
  return (
    <div
      className="flex aspect-square size-8 items-center justify-center rounded-lg transition-colors duration-300"
      style={accentColor ? { backgroundColor: accentColor } : undefined}
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
  )
}

export function VersionSwitcher({
  departments,
}: {
  departments: DepartmentOption[]
}) {
  const { selectedDepartmentId, setSelectedDepartmentId } = useDepartmentStore()

  const selected = departments.find((d) => d.id === selectedDepartmentId)
  const label = selected?.name ?? ''
  const accentColor = selected?.accentColor
  const flatTree = buildFlatTree(departments)

  // Single department — show static label, no switcher
  if (departments.length === 1) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="cursor-default select-none">
            <DeptIcon accentColor={accentColor} />
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-medium">ДВР Групп</span>
              <span className="flex items-center gap-1.5">
                {accentColor && <ColorDot color={accentColor} />}
                {label}
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <DeptIcon accentColor={accentColor} />
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
            {flatTree.map((dept) => (
              <DropdownMenuItem
                key={dept.id}
                onSelect={() => setSelectedDepartmentId(dept.id)}
                style={
                  dept.depth > 0
                    ? { paddingLeft: dept.depth * 16 + 8 }
                    : undefined
                }
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
