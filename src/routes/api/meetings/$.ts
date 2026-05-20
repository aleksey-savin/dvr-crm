import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../db'
import { meeting, apiKey } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import * as z from 'zod'

export const Route = createFileRoute('/api/meetings/$')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          // Get API key from Authorization header
          const authHeader = request.headers.get('Authorization')
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(
              JSON.stringify({
                error: 'Missing or invalid Authorization header',
              }),
              {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          const apiKeyValue = authHeader.substring(7) // Remove "Bearer " prefix

          // Verify API key exists in database
          const apiKeyRecord = await db
            .select()
            .from(apiKey)
            .where(eq(apiKey.key, apiKeyValue))
            .limit(1)
            .then((rows) => rows.at(0))

          if (!apiKeyRecord) {
            return new Response(JSON.stringify({ error: 'Invalid API key' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          // Parse request body
          const body = await request.json()

          // Validate request body
          const schema = z.object({
            id: z.string().optional(),
            title: z.string().min(1, 'Title is required'),
            summary: z.string().optional().nullable(),
            transcription: z.string().optional().nullable(),
            companyId: z.string().optional().nullable(),
          })

          const validationResult = schema.safeParse(body)

          if (!validationResult.success) {
            return new Response(
              JSON.stringify({
                error: 'Validation failed',
                details: validationResult.error.issues,
              }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          const data = validationResult.data

          // Generate ID if not provided
          const meetingId = data.id || crypto.randomUUID()

          // Insert meeting into database
          const [createdMeeting] = await db
            .insert(meeting)
            .values({
              id: meetingId,
              title: data.title,
              summary: data.summary || null,
              transcription: data.transcription || null,
              companyId: data.companyId || null,
              scheduledAt: new Date(),
            })
            .returning()

          return new Response(
            JSON.stringify({
              success: true,
              meeting: createdMeeting,
            }),
            {
              status: 201,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        } catch (error) {
          console.error('Error creating meeting:', error)
          return new Response(
            JSON.stringify({
              error: 'Internal server error',
              message: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      },
    },
  },
})
