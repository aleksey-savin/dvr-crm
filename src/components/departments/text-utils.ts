export function getDescriptionPreview(description?: string | null) {
  if (!description) return null

  const text = description
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  return text.length > 0 ? text : null
}

export function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join('')

  return initials || 'Б'
}

export function formatRuCount(
  count: number,
  one: string,
  few: string,
  many: string,
) {
  const absolute = Math.abs(count)
  const mod10 = absolute % 10
  const mod100 = absolute % 100
  const word =
    mod10 === 1 && mod100 !== 11
      ? one
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? few
        : many

  return `${count} ${word}`
}
