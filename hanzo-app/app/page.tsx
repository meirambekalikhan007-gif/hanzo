import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  redirect(user ? '/home' : '/login')
}
