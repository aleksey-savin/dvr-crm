import { Button } from '@/components/ui/button'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'

import { TooltipProvider } from '@/components/ui/tooltip'

import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'

import { RichTextEditor } from '@/components/tiptap/rich-text-editor'

import { createServerFn } from '@tanstack/react-start'
import { todo, todoResponsibleUsers, user } from '@/db/schema'
import { db } from '@/db'
import { eq } from 'drizzle-orm'

import { authClient } from 'utils/auth-client'
import { Input } from '@/components/ui/input'
import * as React from 'react'
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

const formSchema = z.object({
  name: z.string().min(2, 'Задача должна содержать минимум 2 символа'),
  description: z.union([
    z.string().min(2, 'Описание должно содержать минимум 2 символа'),
    z.undefined(),
  ]),
  deadline: z.union([z.string(), z.undefined()]),
})

const addSchema = z.object({
  name: z.string().min(2, 'Задача должна содержать минимум 2 символа'),
  description: z
    .string()
    .min(2, 'Описание должно содержать минимум 2 символа')
    .optional(),
  responsibles: z.array(z.string()).optional(),
  createdBy: z.string(),
  deadline: z.string().optional(),
})

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Задача должна содержать минимум 2 символа'),
  description: z
    .string()
    .min(2, 'Описание должно содержать минимум 2 символа')
    .optional(),
  responsibles: z.array(z.string()).optional(),
  createdBy: z.string(),
  deadline: z.string().optional(),
})

type UserOption = {
  id: string
  name: string
}

const getUsers = createServerFn({ method: 'GET' }).handler(async () => {
  const users = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .orderBy(user.name)
  return users
})

const addTodo = createServerFn({ method: 'POST' })
  .inputValidator(addSchema)
  .handler(async ({ data }) => {
    const [inserted] = await db
      .insert(todo)
      .values({
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        ...(data.deadline ? { deadline: new Date(data.deadline) } : {}),
      })
      .returning({ id: todo.id })
    return inserted.id
  })

const updateTodo = createServerFn({ method: 'POST' })
  .inputValidator(updateSchema)
  .handler(async ({ data }) => {
    await db
      .update(todo)
      .set({
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        ...(data.deadline ? { deadline: new Date(data.deadline) } : {}),
      })
      .where(eq(todo.id, data.id))
  })

const setResponsibleUsers = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      todoId: z.string(),
      userIds: z.array(z.string()),
    }),
  )
  .handler(async ({ data }) => {
    await db
      .delete(todoResponsibleUsers)
      .where(eq(todoResponsibleUsers.todoId, data.todoId))

    if (data.userIds.length > 0) {
      await db.insert(todoResponsibleUsers).values(
        data.userIds.map((userId) => ({
          todoId: data.todoId,
          userId,
        })),
      )
    }
  })

const getTodoResponsibles = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ todoId: z.string() }))
  .handler(async ({ data }) => {
    const rows = await db
      .select({ id: user.id, name: user.name })
      .from(todoResponsibleUsers)
      .innerJoin(user, eq(todoResponsibleUsers.userId, user.id))
      .where(eq(todoResponsibleUsers.todoId, data.todoId))
    return rows
  })

const TodoForm = ({
  item,
  onSuccess,
}: {
  item?: any
  onSuccess?: () => void
}) => {
  const { data: session } = authClient.useSession()
  const [users, setUsers] = React.useState<UserOption[]>([])
  const [selectedUsers, setSelectedUsers] = React.useState<UserOption[]>([])
  const portalRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    getUsers().then(setUsers).catch(console.error)
  }, [])

  React.useEffect(() => {
    if (item?.id) {
      getTodoResponsibles({ data: { todoId: item.id } })
        .then(setSelectedUsers)
        .catch(console.error)
    }
  }, [item?.id])

  const defaultDeadline: string | undefined = item?.deadline
    ? new Date(item.deadline).toISOString().split('T')[0]
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const form = useForm({
    defaultValues: {
      name: (item?.name ?? '') as string,
      description: item?.description as string | undefined,
      deadline: defaultDeadline as string | undefined,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const userId = session?.user?.id ?? ''

      if (!item) {
        try {
          const todoId = await addTodo({
            data: {
              name: value.name,
              description: value.description,
              createdBy: userId,
              deadline: value.deadline,
            },
          })
          if (selectedUsers.length > 0) {
            await setResponsibleUsers({
              data: { todoId, userIds: selectedUsers.map((u) => u.id) },
            })
          }
          toast.success('Задача успешно создана')
          onSuccess?.()
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Произошла ошибка',
          )
        }
      } else {
        try {
          await updateTodo({
            data: {
              id: item.id,
              name: value.name,
              description: value.description,
              createdBy: userId,
              deadline: value.deadline,
            },
          })
          await setResponsibleUsers({
            data: { todoId: item.id, userIds: selectedUsers.map((u) => u.id) },
          })
          toast.success('Задача успешно изменена')
          onSuccess?.()
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Произошла ошибка',
          )
        }
      }
    },
  })

  return (
    <TooltipProvider>
      <div ref={portalRef} />
      <form
        id="todo-form"
        className="flex-1 flex flex-col gap-6 min-h-0"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        {/* Name — fixed height */}
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid} className="shrink-0">
                <FieldLabel htmlFor={field.name}>Краткое описание</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Кратко опишите задачу"
                  autoComplete="off"
                  type="text"
                  required
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        {/* Description — grows to fill remaining space, editor scrolls internally */}
        <form.Field
          name="description"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field
                data-invalid={isInvalid}
                className="flex-1 min-h-0 flex flex-col"
              >
                <FieldLabel htmlFor={field.name}>Описание</FieldLabel>
                <RichTextEditor
                  value={field.state.value}
                  onChange={(html) => field.handleChange(html)}
                  className="flex-1 min-h-0 w-full rounded-xl"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        {/* Bottom fields — fixed, always visible */}
        <div className="shrink-0 flex flex-col gap-6">
          <form.Field
            name="deadline"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Срок выполнения</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    type="date"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <Field>
            <FieldLabel>Ответственные</FieldLabel>
            <Combobox
              items={users}
              itemToStringValue={(u) => u.name}
              isItemEqualToValue={(a, b) => a.id === b.id}
              multiple
              value={selectedUsers}
              onValueChange={setSelectedUsers}
            >
              <ComboboxChips>
                <ComboboxValue>
                  {(value: UserOption[]) =>
                    value.map((u) => (
                      <ComboboxChip key={u.id}>{u.name}</ComboboxChip>
                    ))
                  }
                </ComboboxValue>
                <ComboboxChipsInput placeholder="Добавить ответственного" />
              </ComboboxChips>
              <ComboboxContent container={portalRef.current}>
                <ComboboxEmpty>Пользователи не найдены</ComboboxEmpty>
                <ComboboxList>
                  {(u) => (
                    <ComboboxItem key={u.id} value={u}>
                      {u.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>
          <div className="flex justify-end">
            <Button type="submit">{item ? 'Изменить' : 'Создать'}</Button>
          </div>
        </div>
      </form>
    </TooltipProvider>
  )
}

export default TodoForm
