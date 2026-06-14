// Транслитерация кириллицы в латиницу и формирование безопасного имени файла.
// Используется для человекочитаемых ключей объектов в S3
// (например, имя файла КП: client_businessUnit_version_timestamp).

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

export function transliterate(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join('')
}

// Транслитерирует строку и приводит её к безопасному токену имени файла:
// латиница нижним регистром, прочие символы → дефис, схлопывание и обрезка.
export function slugForFileName(input: string, fallback = 'file'): string {
  const slug = transliterate(input.trim())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
  return slug || fallback
}
