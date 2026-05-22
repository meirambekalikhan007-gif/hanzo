import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BankClient } from './BankClient'

export default async function BankPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  return <BankClient />
}
