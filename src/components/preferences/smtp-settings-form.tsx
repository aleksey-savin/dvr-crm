import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { SaveIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getEmailSettings,
  updateEmailSettings,
} from '@/components/preferences/actions'

type SecureType = 'none' | 'ssl_tls' | 'starttls'

const SECURE_OPTIONS: Array<{ value: SecureType; label: string }> = [
  { value: 'none', label: 'Без шифрования' },
  { value: 'ssl_tls', label: 'SSL/TLS' },
  { value: 'starttls', label: 'STARTTLS' },
]

export function SmtpSettingsForm({ userId }: { userId?: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [host, setHost] = useState('')
  const [port, setPort] = useState('')
  const [secure, setSecure] = useState<SecureType>('none')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [hasStoredPassword, setHasStoredPassword] = useState(false)

  useEffect(() => {
    getEmailSettings()
      .then((settings) => {
        setEnabled(settings.enabled)
        setHost(settings.host ?? '')
        setPort(settings.port ? String(settings.port) : '')
        setSecure(settings.secure as SecureType)
        setUsername(settings.username ?? '')
        setFromEmail(settings.fromEmail ?? '')
        setHasStoredPassword(!!settings.password)
      })
      .catch(() => toast.error('Не удалось загрузить настройки уведомлений'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const portValue = port.trim() ? Number(port) : null
    if (portValue !== null && (!Number.isInteger(portValue) || portValue < 1)) {
      toast.error('Укажите корректный порт')
      return
    }

    setSaving(true)
    try {
      const settings = await updateEmailSettings({
        data: {
          enabled,
          host: host.trim(),
          port: portValue,
          secure,
          username: username.trim(),
          password,
          fromEmail: fromEmail.trim(),
          userId,
        },
      })
      setPassword('')
      setHasStoredPassword(!!settings.password)
      toast.success('Настройки уведомлений сохранены')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email-уведомления (SMTP)</CardTitle>
        <CardDescription>
          Параметры подключения к почтовому серверу. Отправка писем подключается
          отдельно — сейчас сохраняется только конфигурация.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Загрузка...</p>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <div className="text-base font-medium">
                  Уведомления включены
                </div>
                <p className="text-sm text-muted-foreground">
                  Главный переключатель отправки email-уведомлений.
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="smtp-host">Сервер (host)</FieldLabel>
                <Input
                  id="smtp-host"
                  value={host}
                  onChange={(event) => setHost(event.target.value)}
                  placeholder="smtp.example.com"
                  autoComplete="off"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="smtp-port">Порт</FieldLabel>
                <Input
                  id="smtp-port"
                  value={port}
                  onChange={(event) => setPort(event.target.value)}
                  placeholder="587"
                  inputMode="numeric"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="smtp-secure">Шифрование</FieldLabel>
                <Select
                  value={secure}
                  onValueChange={(value) => setSecure(value as SecureType)}
                >
                  <SelectTrigger id="smtp-secure">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECURE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="smtp-from">
                  Адрес отправителя (необязательно)
                </FieldLabel>
                <Input
                  id="smtp-from"
                  value={fromEmail}
                  onChange={(event) => setFromEmail(event.target.value)}
                  placeholder="crm@example.com"
                  autoComplete="off"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="smtp-username">Логин</FieldLabel>
                <Input
                  id="smtp-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="off"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="smtp-password">Пароль</FieldLabel>
                <Input
                  id="smtp-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={
                    hasStoredPassword
                      ? 'Оставьте пустым, чтобы не менять'
                      : undefined
                  }
                  autoComplete="new-password"
                />
              </Field>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                <SaveIcon className="mr-2 size-4" />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
