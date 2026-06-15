// Date-time helpers for the local↔UTC boundary.
//
// Timestamps are stored as `timestamptz` (absolute instants). The browser is
// the only place that knows the user's time zone, so conversion happens here:
//  - on submit: a `<input type="datetime-local">` value (wall-clock in the
//    user's zone, no offset) is turned into a UTC ISO string for the server;
//  - on display: an instant (Date/ISO from the server) is rendered back into a
//    `datetime-local` value using the browser's local getters.

/**
 * Преобразует значение `<input type="datetime-local">` (локальное время браузера,
 * без указания зоны) в UTC ISO-строку для отправки на сервер.
 * Пустое или невалидное значение → `null`.
 */
export function datetimeLocalToISO(
  value: string | null | undefined,
): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/**
 * Преобразует момент (Date или ISO-строку с сервера) в значение для
 * `<input type="datetime-local">`, выраженное в локальной зоне браузера.
 * Пустое или невалидное значение → `''`.
 */
export function toDatetimeLocalInput(
  value: Date | string | null | undefined,
): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
