import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LessonsClient } from './LessonsClient'

export default async function LessonsPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  return <LessonsClient />
}
