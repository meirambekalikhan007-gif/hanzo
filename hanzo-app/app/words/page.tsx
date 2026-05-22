import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WordsClient } from './WordsClient'

export default async function WordsPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  return <WordsClient />
}
