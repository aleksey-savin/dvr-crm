import { db } from '@/db'
import { createServerFn } from '@tanstack/react-start'

export const fetchMeetings = createServerFn().handler(async () => {
  return db.query.meeting.findMany()
})
