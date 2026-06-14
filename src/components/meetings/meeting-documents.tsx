import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

import { DocumentUploader } from '@/components/ui/document-uploader'
import type { DocumentItem } from '@/components/ui/document-uploader'
import {
  DOCUMENT_FILE_ACCEPT,
  resolveDocumentUrl,
  uploadDocument,
} from '@/components/documents/actions'
import {
  addMeetingDocument,
  removeMeetingDocument,
} from '@/components/meetings/actions'

type Props = {
  meetingId: string
  documents: DocumentItem[]
}

export function MeetingDocuments({ meetingId, documents: initial }: Props) {
  const router = useRouter()
  const [documents, setDocuments] = useState<DocumentItem[]>(initial)

  const handleUpload = async (file: File, base64: string) => {
    const doc = await uploadDocument({
      data: {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        fileBase64: base64,
        pathPrefix: 'meetings',
        fileNamePrefix: 'meeting',
      },
    })
    await addMeetingDocument({ data: { meetingId, documentId: doc.id } })
    setDocuments((prev) => [...prev, doc])
    await router.invalidate()
    return doc
  }

  const handleRemove = async (doc: DocumentItem) => {
    await removeMeetingDocument({ data: { meetingId, documentId: doc.id } })
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
    await router.invalidate()
  }

  const handleOpen = async (doc: DocumentItem) => {
    // Открываем вкладку синхронно (до await), чтобы не сработал блокировщик
    // всплывающих окон, затем подставляем presigned-URL.
    const popup = window.open('about:blank')
    try {
      const { url } = await resolveDocumentUrl({ data: { documentId: doc.id } })
      if (popup) popup.location.replace(url)
      else window.open(url, '_blank')
    } catch (error) {
      popup?.close()
      toast.error(
        error instanceof Error ? error.message : 'Не удалось открыть документ',
      )
    }
  }

  return (
    <DocumentUploader
      documents={documents}
      onUpload={handleUpload}
      onRemove={handleRemove}
      onOpen={handleOpen}
      accept={DOCUMENT_FILE_ACCEPT}
    />
  )
}
