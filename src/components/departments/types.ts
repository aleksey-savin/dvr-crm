export type DepartmentUser = {
  id: string
  name: string
  role: string
  image: string | null
}

export type DepartmentRow = {
  id: string
  name: string
  description: string | null
  accentColor: string | null
  headUserId: string | null
  head: DepartmentUser | null
  parentId: string | null
  users: DepartmentUser[]
}

export type DepartmentNode = DepartmentRow & {
  children: DepartmentNode[]
}
