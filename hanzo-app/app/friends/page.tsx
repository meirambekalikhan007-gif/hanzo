import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FriendsClient } from './FriendsClient'

export default async function FriendsPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  return <FriendsClient />
}
