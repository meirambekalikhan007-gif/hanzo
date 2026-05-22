'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useUserStore, calcLevel, getLevelTitle } from '@/store/userStore'
import { BottomNav } from '@/components/BottomNav'
import { WORD_BANK } from '@/lib/wordBank'
import type { Profile } from '@/types/database'

const WOD_LIST = WORD_BANK.filter(w => w.hsk === 'HSK1')

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}

interface Props { initialProfile: Profile | null }

export function HomeClient({ initialProfile }: Props) {
  const router = useRouter()
  const { profile, setProfile, words, xpTotal, getStreak, getTodayActivity, loadUserData, setUser, studyActivity } = useUserStore()
  const [wod, setWod] = useState(WOD_LIST[Math.floor(Math.random() * WOD_LIST.length)])

  useEffect(() => {
    const db = createClient()
    db.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUser(user)
      if (initialProfile) setProfile(initialProfile)
      loadUserData()
    })
  }, [])

  async function handleSignOut() {
    const db = createClient()
    await db.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayProfile = profile ?? initialProfile
  const streak = getStreak()
  const todayCount = getTodayActivity()
  const level = calcLevel(xpTotal)
  const title = getLevelTitle(level)
  const dailyGoal = displayProfile?.daily_goal ?? 10
  const goalPct = Math.min(100, Math.round((todayCount / dailyGoal) * 100))
  const mastered = words.filter(w => w.status === 'mastered').length
  const today = new Date().toISOString().split('T')[0]
  const dueToday = words.filter(w => w.srs_next <= today).length
  const newWords = words.filter(w => w.status === 'new').length
  const learning = words.filter(w => w.status === 'learning').length
  const xpToNextLevel = ((level + 1) * (level + 1)) * 10
  const xpForLevel = (level * level) * 10
  const levelPct = xpToNextLevel > xpForLevel
    ? Math.min(100, Math.round(((xpTotal - xpForLevel) / (xpToNextLevel - xpForLevel)) * 100))
    : 100

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().split('T')[0]
    const count = studyActivity[key] ?? 0
    return {
      key,
      label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1),
      done: count >= dailyGoal,
      partial: count > 0 && count < dailyGoal,
      isToday: key === today,
    }
  })

  return (
    <div className="min-h-dvh pb-24" style={{ background: '#0d0d0f', color: '#f4f4f5' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div>
          <p className="text-xs" style={{ color: 'rgba(244,244,245,0.45)' }}>{getGreeting()},</p>
          <h1 className="text-xl font-bold">{displayProfile?.name || 'Learner'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold px-3 py-1.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>🔥 {streak}</span>
          <button onClick={handleSignOut} className="text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(244,244,245,0.4)' }}>
            Sign out
          </button>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* XP Level bar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-[18px] p-4" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>Level {level}</p>
              <p className="text-base font-bold" style={{ color: '#e8607a' }}>{title}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px]" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>{xpTotal.toLocaleString()} XP</p>
              <p className="text-xs font-semibold" style={{ color: '#f59e0b' }}>→ {xpToNextLevel.toLocaleString()}</p>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#e8607a,#f59e0b)' }}
              initial={{ width: 0 }} animate={{ width: `${levelPct}%` }} transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }} />
          </div>
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Words', value: words.length, color: '#60a5fa' },
            { label: 'Mastered', value: mastered, color: '#4ade80' },
            { label: 'Due Today', value: dueToday, color: '#f59e0b' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
              className="rounded-[14px] p-3 text-center" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Daily goal */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-[18px] p-4" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold">Daily Goal</p>
            <p className="text-sm font-bold" style={{ color: goalPct >= 100 ? '#4ade80' : '#f4f4f5' }}>
              {todayCount}<span className="text-xs font-normal" style={{ color: 'rgba(244,244,245,0.4)' }}>/{dailyGoal}</span>
            </p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div className="h-full rounded-full" style={{ background: goalPct >= 100 ? '#4ade80' : '#e8607a' }}
              initial={{ width: 0 }} animate={{ width: `${goalPct}%` }} transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }} />
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: 'rgba(244,244,245,0.35)', fontFamily: 'monospace' }}>
            {goalPct >= 100 ? '🎉 Goal complete!' : `${dailyGoal - todayCount} more answers to reach goal`}
          </p>
        </motion.div>

        {/* Streak */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-[18px] p-4" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-4xl">🔥</div>
              <div className="text-3xl font-black" style={{ color: '#f59e0b' }}>{streak}</div>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>day streak</div>
            </div>
            <div className="flex-1">
              <p className="text-[9px] uppercase tracking-wider mb-2" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>This week</p>
              <div className="flex justify-between gap-1">
                {weekDays.map(d => (
                  <div key={d.key} className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
                      style={{
                        background: d.done ? 'rgba(74,222,128,0.15)' : d.partial ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                        borderColor: d.done ? '#4ade80' : d.partial ? '#f59e0b' : d.isToday ? '#e8607a' : 'rgba(255,255,255,0.1)',
                        color: d.done ? '#4ade80' : d.partial ? '#f59e0b' : d.isToday ? '#e8607a' : 'rgba(244,244,245,0.3)',
                      }}>
                      {d.done ? '✓' : d.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '🏆 Best', value: `${streak}d`, color: '#f59e0b' },
              { label: '📅 Total days', value: `${Object.values(studyActivity).filter(v => v > 0).length}`, color: '#4ade80' },
              { label: '📚 Today', value: `${todayCount}`, color: '#60a5fa' },
            ].map(s => (
              <div key={s.label} className="rounded-[10px] p-2 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[8px]" style={{ color: 'rgba(244,244,245,0.35)', fontFamily: 'monospace' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Word of the day */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          onClick={() => setWod(WOD_LIST[Math.floor(Math.random() * WOD_LIST.length)])}
          className="rounded-[18px] p-4 cursor-pointer active:scale-[0.98] transition-transform"
          style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>✨ Word of the Day</p>
            <p className="text-[9px]" style={{ color: 'rgba(244,244,245,0.3)', fontFamily: 'monospace' }}>tap for new →</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="font-cn text-5xl font-black" style={{ color: '#e8607a' }}>{wod.char}</div>
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: '#f59e0b', fontFamily: 'monospace' }}>{wod.pinyin}</p>
              <p className="text-base font-bold mb-1">{wod.meaning}</p>
              <p className="text-[11px] font-cn" style={{ color: 'rgba(244,244,245,0.4)' }}>{wod.example}</p>
            </div>
          </div>
        </motion.div>

        {/* SRS queue */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-[18px] p-4" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[9px] uppercase tracking-wider mb-3" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>Study Queue</p>
          {[
            { label: 'New', value: newWords, color: '#60a5fa' },
            { label: 'Learning', value: learning, color: '#f59e0b' },
            { label: 'Mastered', value: mastered, color: '#4ade80' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 mb-2 last:mb-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span className="text-xs w-16" style={{ color: 'rgba(244,244,245,0.6)' }}>{s.label}</span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ background: s.color, width: `${(s.value / Math.max(words.length, 1)) * 100}%` }} />
              </div>
              <span className="text-xs font-bold w-6 text-right" style={{ color: s.color, fontFamily: 'monospace' }}>{s.value}</span>
            </div>
          ))}
        </motion.div>

      </div>
      <BottomNav />
    </div>
  )
}
