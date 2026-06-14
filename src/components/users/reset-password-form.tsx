import { Button } from '@/components/ui/button'

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'

import { Input } from '@/components/ui/input'

import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { authClient } from 'utils/auth-client'

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

const ResetPasswordForm = ({
  userId,
  onSuccess,
}: {
  userId: string
  onSuccess?: () => void
}) => {
  const form = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      const { error } = await authClient.admin.setUserPassword({
        userId,
        newPassword: value.password,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Пароль успешно изменён')
      onSuccess?.()
    },
  })

  return (
    <form
      id="reset-password-form"
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field
          name="password"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Новый пароль</FieldLabel>
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

        <form.Field
          name="confirmPassword"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Подтверждение пароля
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Повторите пароль"
                  autoComplete="new-password"
                  type="password"
                  required
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <Field>
          <form.Subscribe
            selector={(state) => state.isSubmitting}
            children={(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Сохранение...' : 'Сбросить пароль'}
              </Button>
            )}
          />
        </Field>
      </FieldGroup>
    </form>
  )
}

export default ResetPasswordForm
