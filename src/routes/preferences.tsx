import { createFileRoute } from '@tanstack/react-router'
import { authClient } from 'utils/auth-client'
import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Trash2Icon,
  PlusIcon,
  EyeIcon,
  EyeOffIcon,
  CopyIcon,
  CheckIcon,
} from 'lucide-react'
import {
  addApiKey,
  deleteApiKey,
  getApiKeys,
} from '@/components/preferences/actions'
import type { SelectApiKey } from '@/db/types'

export const Route = createFileRoute('/preferences')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: session } = authClient.useSession()
  const [apiKeys, setApiKeys] = useState<SelectApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [copiedKeys, setCopiedKeys] = useState<Set<string>>(new Set())
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const userId = session?.user.id

  const loadApiKeys = async () => {
    if (!userId) return
    try {
      const keys = await getApiKeys({ data: { userId } })
      setApiKeys(keys)
    } catch (error) {
      toast.error('Не удалось загрузить API ключи')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApiKeys()
  }, [userId])

  const form = useForm({
    defaultValues: {
      name: '',
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
      }),
    },
    onSubmit: async ({ value }) => {
      if (!userId) {
        toast.error('Необходима авторизация')
        return
      }
      try {
        const newKey = await addApiKey({
          data: {
            name: value.name,
            userId,
          },
        })
        toast.success('API ключ успешно создан')
        form.reset()
        await loadApiKeys()
        // Auto-show the newly created key
        setNewlyCreatedKey(newKey.id)
        setVisibleKeys((prev) => new Set(prev).add(newKey.id))
        // Remove highlight after 5 seconds
        setTimeout(() => {
          setNewlyCreatedKey(null)
        }, 5000)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
      }
    },
  })

  const handleDelete = async () => {
    if (!keyToDelete || !userId) return
    try {
      await deleteApiKey({
        data: {
          id: keyToDelete,
          userId,
        },
      })
      toast.success('API ключ успешно удален')
      loadApiKeys()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
    } finally {
      setDeleteDialogOpen(false)
      setKeyToDelete(null)
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••'
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4)
  }

  const copyToClipboard = async (keyId: string, keyValue: string) => {
    try {
      await navigator.clipboard.writeText(keyValue)
      setCopiedKeys((prev) => new Set(prev).add(keyId))
      toast.success('API ключ скопирован в буфер обмена')
      setTimeout(() => {
        setCopiedKeys((prev) => {
          const newSet = new Set(prev)
          newSet.delete(keyId)
          return newSet
        })
      }, 2000)
    } catch (error) {
      toast.error('Не удалось скопировать ключ')
    }
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Необходима авторизация</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Настройки</h1>
        <p className="text-muted-foreground mt-2">
          Управление вашими API ключами для внешних запросов
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Добавить новый API ключ</CardTitle>
          <CardDescription>
            API ключ будет сгенерирован автоматически при создании
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Название</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Например: OpenAI API Key"
                      autoComplete="off"
                      type="text"
                      required
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
            <Button type="submit" className="w-full">
              <PlusIcon className="mr-2 h-4 w-4" />
              Добавить API ключ
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ваши API ключи</CardTitle>
          <CardDescription>Управление сохраненными API ключами</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">
              Загрузка...
            </p>
          ) : apiKeys.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              У вас пока нет сохраненных API ключей
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>API Ключ</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow
                    key={key.id}
                    className={
                      newlyCreatedKey === key.id
                        ? 'bg-green-50 dark:bg-green-950/20'
                        : ''
                    }
                  >
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <span>
                          {visibleKeys.has(key.id) ? key.key : maskKey(key.key)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="h-6 w-6 p-0"
                          title={
                            visibleKeys.has(key.id) ? 'Скрыть' : 'Показать'
                          }
                        >
                          {visibleKeys.has(key.id) ? (
                            <EyeOffIcon className="h-3 w-3" />
                          ) : (
                            <EyeIcon className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(key.id, key.key)}
                          className="h-6 w-6 p-0"
                          title="Копировать"
                        >
                          {copiedKeys.has(key.id) ? (
                            <CheckIcon className="h-3 w-3 text-green-500" />
                          ) : (
                            <CopyIcon className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(key.createdAt).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setKeyToDelete(key.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2Icon className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. API ключ будет удален навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
