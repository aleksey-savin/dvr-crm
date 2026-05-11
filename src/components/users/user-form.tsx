import { Button } from '@/components/ui/button'

import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Input } from '@/components/ui/input'

import * as z from 'zod'
import * as React from 'react'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { authClient } from 'utils/auth-client'
import { roleLabels, roles } from '@/utils/roleLabels'
import { useDepartmentStore } from '@/stores/department-store'
import { fetchDepartmentOptions } from '@/components/departments/actions'
import {
  setUserDepartment,
  setUserProfileFields,
} from '@/components/users/actions'
import type { UserFormUser } from '@/types'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const baseSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.email('Неверный адрес электронной почты'),
  image: z.string(),
  position: z.string(),
  phone: z.string(),
  role: z.string(),
  departmentId: z.string().uuid('Выберите подразделение'),
})

const createUserSchema = baseSchema.extend({
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
})

const editUserSchema = baseSchema.extend({
  password: z.string(),
})

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const UserForm = ({
  user,
  departmentId: initialDepartmentId,
  onSuccess,
}: {
  user?: UserFormUser
  departmentId?: string
  onSuccess?: () => void
}) => {
  const storeDepartments = useDepartmentStore((s) => s.departments)
  const globalDepartmentId = useDepartmentStore((s) => s.selectedDepartmentId)

  const [departments, setDepartments] = React.useState(storeDepartments)

  // Prefer Zustand store; fall back to own fetch
  React.useEffect(() => {
    if (storeDepartments.length > 0) {
      setDepartments(storeDepartments)
    } else {
      fetchDepartmentOptions().then(setDepartments).catch(console.error)
    }
  }, [storeDepartments])

  const defaultDepartmentId =
    initialDepartmentId ?? globalDepartmentId ?? user?.departmentId ?? ''

  const form = useForm({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      image: user?.image ?? '',
      position: user?.position ?? '',
      phone: user?.phone ?? '',
      role: user?.role ?? 'user',
      password: '',
      departmentId: defaultDepartmentId,
    },
    validators: {
      onSubmit: user ? editUserSchema : createUserSchema,
    },
    onSubmit: async ({ value }) => {
      if (!user) {
        // --- CREATE ---
        const { data, error } = await authClient.admin.createUser({
          email: value.email,
          password: value.password,
          name: value.name,
          role: value.role as 'user' | 'admin' | 'manager',
        })
        if (error) {
          toast.error(error.message)
          return
        }
        await setUserDepartment({
          data: { userId: data.user.id, departmentId: value.departmentId },
        })
        await setUserProfileFields({
          data: {
            userId: data.user.id,
            position: value.position,
            phone: value.phone,
          },
        })
        toast.success('Пользователь успешно создан')
        onSuccess?.()
      } else {
        // --- UPDATE ---
        const { error } = await authClient.admin.updateUser({
          userId: user.id,
          data: {
            name: value.name,
            role: value.role as 'user' | 'admin' | 'manager',
            image: value.image,
            email: value.email,
          },
        })
        if (error) {
          toast.error(error.message)
          return
        }
        await setUserDepartment({
          data: { userId: user.id, departmentId: value.departmentId },
        })
        await setUserProfileFields({
          data: {
            userId: user.id,
            position: value.position,
            phone: value.phone,
          },
        })
        toast.success('Пользователь успешно изменён')
        onSuccess?.()
      }
    },
  })

  // When global filter is active, restrict the visible list
  const visibleDepartments = globalDepartmentId
    ? departments.filter((d) => d.id === globalDepartmentId)
    : departments

  return (
    <form
      id="user-form"
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        {/* Name */}
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Имя</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Имя пользователя"
                  autoComplete="off"
                  type="text"
                  required
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        {/* Email */}
        <form.Field
          name="email"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="m@example.com"
                  autoComplete="off"
                  type="email"
                  required
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        {/* Role */}
        <form.Field
          name="position"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Должность</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Должность"
                  autoComplete="organization-title"
                  type="text"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="phone"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Телефон</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="+7..."
                  autoComplete="tel"
                  type="tel"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        {/* Role */}
        <form.Field
          name="role"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldContent>
                  <FieldLabel htmlFor="role">Роль</FieldLabel>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </FieldContent>
                <Select
                  name={field.name}
                  value={field.state.value}
                  onValueChange={field.handleChange}
                >
                  <SelectTrigger
                    id="role"
                    aria-invalid={isInvalid}
                    className="min-w-30"
                  >
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )
          }}
        />

        {/* Department */}
        <form.Field
          name="departmentId"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Подразделение</FieldLabel>
                <Select
                  name={field.name}
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  disabled={!!globalDepartmentId}
                >
                  <SelectTrigger
                    id={field.name}
                    aria-invalid={isInvalid}
                    className="w-full"
                    onBlur={field.handleBlur}
                  >
                    <SelectValue placeholder="Выберите подразделение" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        {/* Password (create only) */}
        {!user && (
          <form.Field
            name="password"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Пароль</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Минимум 8 символов"
                    autoComplete="new-password"
                    type="password"
                    required
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        )}

        {/* Image */}
        <form.Field
          name="image"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Изображение</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Ссылка на изображение"
                  autoComplete="off"
                  type="text"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <Field>
          <Button type="submit">{user ? 'Изменить' : 'Создать'}</Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

export default UserForm
