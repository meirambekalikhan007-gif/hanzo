import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GamesClient } from './GamesClient'

export default async function GamesPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  return <GamesClient />
}
