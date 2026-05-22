'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/userStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading, loadUserData } = useUserStore()
  const router = useRouter()

  useEffect(() => {
    const db = createClient()

    // Initial session check
    db.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        loadUserData()
      } else {
        setLoading(false)
      }
    })

    // Listen for auth state changes (login / logout / token refresh)
    const { data: { subscription } } = db.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)

        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData()
          router.refresh()
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null)
          setLoading(false)
          router.push('/login')
          router.refresh()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>
}
