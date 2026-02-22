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
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { authClient } from 'utils/auth-client'
import { roleLabels, roles } from '@/utils/roleLabels'

const baseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.email('Invalid email address'),
  image: z.string(),
  role: z.string(),
})

const createUserSchema = baseSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

const editUserSchema = baseSchema.extend({
  password: z.string(),
})

const UserForm = ({
  user,
  onSuccess,
}: {
  user?: any
  onSuccess?: () => void
}) => {
  const form = useForm({
    defaultValues: {
      name: user ? user.name : '',
      email: user ? user.email : '',
      image: user ? user.image : '',
      role: user ? user.role : 'user',
      password: '',
    },
    validators: {
      onSubmit: user ? editUserSchema : createUserSchema,
    },
    onSubmit: async ({ value }) => {
      if (!user) {
        await authClient.admin.createUser(
          {
            email: value.email,
            password: value.password!,
            name: value.name,
            role: value.role,
          },
          {
            onSuccess: () => {
              toast.success('Пользователь успешно создан')
              onSuccess?.()
            },
            onError: (ctx) => {
              toast.error(ctx.error.message)
            },
          },
        )
      } else {
        await authClient.admin.updateUser(
          {
            userId: user.id,
            data: {
              name: value.name,
              role: value.role,
              image: value.image,
              email: value.email,
            },
          },
          {
            onSuccess: () => {
              toast.success('Пользователь успешно изменён')
              onSuccess?.()
            },
            onError: (ctx) => {
              toast.error(ctx.error.message)
            },
          },
        )
      }
    },
  })

  return (
    <form
      id="user-form"
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
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
                        {roleLabels[role ?? 'user']}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )
          }}
        />
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
                    value={field.state.value ?? ''}
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
