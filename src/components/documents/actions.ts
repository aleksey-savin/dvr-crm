import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '@/db'
import { document } from '@/db/schema'
import { auth } from 'utils/auth'
import { normalizeBase64Payload } from '@/lib/file-upload'
import { getS3SignedObjectUrl, uploadBase64FileToS3 } from '@/lib/s3'

export const DOCUMENT_FILE_MAX_SIZE_BYTES = 50 * 1024 * 1024
export const DOCUMENT_FILE_MAX_SIZE_MB = 50

const DOCUMENT_FILE_ALLOWED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'jpg',
  'jpeg',
  'png',
] as const

export const DOCUMENT_FILE_ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
])

export const DOCUMENT_FILE_ACCEPT = DOCUMENT_FILE_ALLOWED_EXTENSIONS.map(
  (ext) => `.${ext}`,
).join(',')

// Чистая проверка размера/MIME. Бросает на нарушении, возвращает нормализованный
// MIME-тип. Не ссылается на серверные модули — безопасна для импорта где угодно.
export function assertDocumentFileAllowed(params: {
  mimeType: string
  fileSize: number
}): string {
  if (params.fileSize > DOCUMENT_FILE_MAX_SIZE_BYTES) {
    throw new Error(`Размер файла превышает ${DOCUMENT_FILE_MAX_SIZE_MB} МБ`)
  }
  const normalizedMimeType = params.mimeType.trim().toLowerCase()
  if (!DOCUMENT_FILE_ALLOWED_MIME_TYPES.has(normalizedMimeType)) {
    throw new Error('Недопустимый формат файла')
  }
  return normalizedMimeType
}

async function getCurrentUserId(): Promise<string> {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  const userId = session?.user.id
  if (!userId) throw new Error('Не авторизовано')
  return userId
}

const uploadDocumentSchema = z.object({
  fileName: z.string().trim().min(1, 'Выберите файл'),
  mimeType: z.string().trim().min(1, 'Не удалось определить тип файла'),
  fileSize: z.number().int().positive('Файл пустой'),
  fileBase64: z.string().trim().min(1, 'Файл пустой'),
  pathPrefix: z.string().trim().min(1).optional(),
  fileNamePrefix: z.string().trim().min(1).optional(),
})

// Загружает файл в S3 и создаёт запись `document`. Привязку к сущности
// выполняет вызывающая фича через свою join-таблицу ({entity}_document).
export const uploadDocument = createServerFn({ method: 'POST' })
  .inputValidator(uploadDocumentSchema)
  .handler(async ({ data }) => {
    const userId = await getCurrentUserId()

    const normalizedMimeType = assertDocumentFileAllowed({
      mimeType: data.mimeType,
      fileSize: data.fileSize,
    })

    const normalizedBase64 = normalizeBase64Payload(data.fileBase64)
    if (!normalizedBase64) {
      throw new Error('Файл пустой')
    }

    const { objectKey } = await uploadBase64FileToS3({
      fileName: data.fileName,
      mimeType: normalizedMimeType,
      fileSize: data.fileSize,
      fileBase64: normalizedBase64,
      maxSizeBytes: DOCUMENT_FILE_MAX_SIZE_BYTES,
      pathPrefix: data.pathPrefix ?? 'documents',
      fileNamePrefix: data.fileNamePrefix ?? 'document',
    })

    const [inserted] = await db
      .insert(document)
      .values({
        name: data.fileName,
        url: objectKey,
        uploadedBy: userId,
      })
      .returning({ id: document.id, name: document.name, url: document.url })

    return inserted
  })

const resolveDocumentUrlSchema = z.object({
  documentId: z.string().min(1),
})

// Возвращает прямую ссылку для открытия документа: внешний http(s) URL как есть,
// либо presigned-URL объекта в S3 (срок жизни 10 минут).
export const resolveDocumentUrl = createServerFn({ method: 'POST' })
  .inputValidator(resolveDocumentUrlSchema)
  .handler(async ({ data }) => {
    await getCurrentUserId()

    const doc = await db.query.document.findFirst({
      where: eq(document.id, data.documentId),
      columns: { url: true },
    })

    if (!doc) {
      throw new Error('Документ не найден')
    }

    const fileRef = doc.url.trim()

    if (/^https?:\/\//i.test(fileRef)) {
      return { url: fileRef }
    }

    const url = await getS3SignedObjectUrl({
      objectKey: fileRef,
      expiresInSeconds: 60 * 10,
    })

    return { url }
  })
