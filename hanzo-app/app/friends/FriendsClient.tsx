'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { BottomNav } from '@/components/BottomNav'

export function FriendsClient() {
  const { profile, xpTotal, getStreak, loadUserData, setUser } = useUserStore()

  useEffect(() => {
    const db = require('@/lib/supabase/client').createClient()
    db.auth.getUser().then(({ data: { user } }: any) => {
      if (user) { setUser(user); loadUserData() }
    })
  }, [])

  const streak = getStreak()

  return (
    <div className="min-h-dvh pb-24 px-4" style={{ background: '#0d0d0f', color: '#f4f4f5' }}>
      <div className="pt-12 pb-4">
        <h1 className="text-2xl font-black">Friends 👥</h1>
        <p className="text-sm" style={{ color: 'rgba(244,244,245,0.45)' }}>Compete with friends</p>
      </div>

      {/* Your card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[18px] p-4 mb-4" style={{ background: 'rgba(232,96,122,0.08)', border: '1.5px solid rgba(232,96,122,0.25)' }}>
        <p className="text-[9px] uppercase tracking-wider mb-2" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>Your Stats</p>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black" style={{ background: '#e8607a', color: '#fff' }}>
            {profile?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-bold">{profile?.name ?? 'You'}</p>
            <p className="text-xs" style={{ color: 'rgba(244,244,245,0.4)' }}>{xpTotal.toLocaleString()} XP total</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'XP', value: xpTotal.toLocaleString(), color: '#f59e0b' },
            { label: '🔥 Streak', value: `${streak}d`, color: '#f59e0b' },
            { label: 'Rank', value: '#1', color: '#4ade80' },
          ].map(s => (
            <div key={s.label} className="rounded-[10px] p-2 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="text-base font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[8px]" style={{ color: 'rgba(244,244,245,0.35)', fontFamily: 'monospace' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Coming soon */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-[18px] p-8 text-center" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-4xl mb-3">🚀</div>
        <p className="font-bold mb-2">Leaderboard Coming Soon</p>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(244,244,245,0.45)' }}>
          Challenge friends, share invite codes, and compete on weekly XP leaderboards. This feature is in development.
        </p>
      </motion.div>

      <BottomNav />
    </div>
  )
}
