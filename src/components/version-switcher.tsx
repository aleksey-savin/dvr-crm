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

export function VersionSwitcher({
  departments,
}: {
  departments: Department[]
}) {
  const { selectedDepartmentId, setSelectedDepartmentId } = useDepartmentStore()

  const selected = departments.find((d) => d.id === selectedDepartmentId)
  const label = selected?.name ?? 'Все подразделения'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">ДВР Групп</span>
                <span className="">{label}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width)"
            align="start"
          >
            <DropdownMenuItem onSelect={() => setSelectedDepartmentId(null)}>
              Все подразделения
              {selectedDepartmentId === null && <Check className="ml-auto" />}
            </DropdownMenuItem>
            {departments.map((dept) => (
              <DropdownMenuItem
                key={dept.id}
                onSelect={() => setSelectedDepartmentId(dept.id)}
              >
                {dept.name}
                {dept.id === selectedDepartmentId && (
                  <Check className="ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
