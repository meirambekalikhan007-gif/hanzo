import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HomeClient } from './HomeClient'

export default async function HomePage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <HomeClient initialProfile={profile} />
}
