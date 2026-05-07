import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/ping/$')({
  server: {
    handlers: {
      GET: async () => {
        return new Response(
          JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        )
      },
    },
  },
})
