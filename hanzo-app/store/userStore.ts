'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type {
  Profile,
  UserWord,
  UserPhrase,
  Lang,
  XPSource,
  XP_RATES,
} from '@/types/database'
import { XP_RATES as XP_RATE_MAP } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

// ─── Level system ─────────────────────────────────────────────────────────

export function calcLevel(totalXP: number): number {
  return Math.max(1, Math.min(100, Math.floor(Math.sqrt(totalXP / 10))))
}

const LEVEL_TITLES: Record<number, string> = {
  1: 'Seedling', 2: 'Sprout', 3: 'Sapling', 4: 'Apprentice', 5: 'Student',
  10: 'Learner', 15: 'Scholar', 20: 'Disciple', 25: 'Adept', 30: 'Practitioner',
  40: 'Expert', 50: 'Master', 60: 'Grandmaster', 70: 'Sage', 80: 'Dragon Eye',
  90: 'Sensei', 99: 'Legend', 100: 'Hanzo',
}

export function getLevelTitle(level: number): string {
  const keys = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a)
  const match = keys.find((k) => level >= k)
  return match ? LEVEL_TITLES[match] : 'Seedling'
}

// ─── SM-2 algorithm ───────────────────────────────────────────────────────

export function sm2Update(
  word: Pick<UserWord, 'sm2_ef' | 'sm2_rep' | 'sm2_iv'>,
  quality: number // 0-5: 4=correct, 1=wrong
): Pick<UserWord, 'sm2_ef' | 'sm2_rep' | 'sm2_iv' | 'srs_next'> {
  let ef = word.sm2_ef
  let rep = word.sm2_rep
  let iv = word.sm2_iv

  ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (ef < 1.3) ef = 1.3

  if (quality < 3) {
    rep = 0
    iv = 1
  } else {
    rep += 1
    if (rep === 1) iv = 1
    else if (rep === 2) iv = 6
    else iv = Math.round(iv * ef)
  }

  const next = new Date()
  next.setDate(next.getDate() + iv)
  const srs_next = next.toISOString().split('T')[0]

  return { sm2_ef: ef, sm2_rep: rep, sm2_iv: iv, srs_next }
}

// ─── Store types ──────────────────────────────────────────────────────────

interface UserStore {
  // Auth state
  user: User | null
  profile: Profile | null
  isLoading: boolean

  // App state
  words: UserWord[]
  phrases: UserPhrase[]
  studyActivity: Record<string, number> // 'YYYY-MM-DD' → correct count
  xpTotal: number
  lang: Lang

  // XP popup callback (set by UI layer)
  onXPAwarded?: (amount: number, source: XPSource) => void

  // ─── Auth actions ──────────────────────────────────────────
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (v: boolean) => void

  // ─── Data loaders ─────────────────────────────────────────
  loadUserData: () => Promise<void>

  // ─── Word actions ──────────────────────────────────────────
  addWord: (word: Omit<UserWord, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  removeWord: (wordId: string) => Promise<void>
  updateWordSRS: (wordId: string, correct: boolean) => Promise<void>
  setWordStatus: (wordId: string, status: UserWord['status']) => Promise<void>

  // ─── Phrase actions ────────────────────────────────────────
  addPhrase: (phrase: Omit<UserPhrase, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  removePhrase: (phraseId: string) => Promise<void>

  // ─── Study session ─────────────────────────────────────────
  recordCorrectAnswer: () => Promise<void>

  // ─── XP ───────────────────────────────────────────────────
  awardXP: (source: XPSource) => Promise<void>

  // ─── Profile updates ───────────────────────────────────────
  updateLang: (lang: Lang) => Promise<void>
  updateDailyGoal: (goal: number) => Promise<void>
  completeOnboarding: (data: Profile['onboarding']) => Promise<void>

  // ─── Computed helpers ──────────────────────────────────────
  getLevel: () => number
  getLevelTitle: () => string
  getTodayActivity: () => number
  getStreak: () => number
  getDueWords: () => UserWord[]
}

// ─── Store implementation ─────────────────────────────────────────────────

export const useUserStore = create<UserStore>()(
  devtools(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: true,
      words: [],
      phrases: [],
      studyActivity: {},
      xpTotal: 0,
      lang: 'en',

      setUser: (user) => set({ user }),
      setProfile: (profile) =>
        set({ profile, lang: profile?.lang ?? 'en' }),
      setLoading: (isLoading) => set({ isLoading }),

      loadUserData: async () => {
        const { user } = get()
        if (!user) return

        const db = createClient()
        set({ isLoading: true })

        const profileRes = await db.from('profiles').select('*').eq('id', user.id).single()
        const wordsRes = await db.from('user_words').select('*').eq('user_id', user.id)
        const phrasesRes = await db.from('user_phrases').select('*').eq('user_id', user.id)
        const sessionsRes = await db.from('study_sessions').select('*').eq('user_id', user.id)
        const xpRes = await db.from('xp_log').select('amount').eq('user_id', user.id)
        const profile = profileRes.data as Profile | null
        const words = wordsRes.data
        const phrases = phrasesRes.data
        const sessions = sessionsRes.data
        const xpRows = xpRes.data

        const studyActivity: Record<string, number> = {}
        for (const s of (sessions ?? []) as Array<{date: string; correct_count: number}>) {
          studyActivity[s.date] = s.correct_count
        }

        const xpTotal = (xpRows ?? [] as Array<{amount: number}>).reduce((sum: number, r: {amount: number}) => sum + r.amount, 0)

        set({
          profile: profile ?? null,
          words: words ?? [],
          phrases: phrases ?? [],
          studyActivity,
          xpTotal,
          lang: profile?.lang ?? 'en',
          isLoading: false,
        })
      },

      addWord: async (wordData) => {
        const { user } = get()
        if (!user) return

        const db = createClient()
        const { data, error } = await db
          .from('user_words')
          .insert({ ...wordData, user_id: user.id })
          .select()
          .single()

        if (!error && data) {
          set((s) => ({ words: [...s.words, data] }))
          get().awardXP('add_word')
        }
      },

      removeWord: async (wordId) => {
        const db = createClient()
        const { error } = await db.from('user_words').delete().eq('id', wordId)
        if (!error) {
          set((s) => ({ words: s.words.filter((w) => w.id !== wordId) }))
        }
      },

      updateWordSRS: async (wordId, correct) => {
        const { words } = get()
        const word = words.find((w) => w.id === wordId)
        if (!word) return

        const quality = correct ? 4 : 1
        const updates = sm2Update(word, quality)
        const newStatus: UserWord['status'] =
          updates.sm2_rep >= 3 ? 'mastered'
          : updates.sm2_rep >= 1 ? 'learning'
          : 'new'

        const db = createClient()
        const { error } = await db
          .from('user_words')
          .update({ ...updates, status: newStatus })
          .eq('id', wordId)

        if (!error) {
          set((s) => ({
            words: s.words.map((w) =>
              w.id === wordId ? { ...w, ...updates, status: newStatus } : w
            ),
          }))

          if (correct) {
            if (newStatus === 'mastered' && word.status !== 'mastered') {
              get().awardXP('master_word')
            } else if (newStatus === 'learning' && word.status === 'new') {
              get().awardXP('learn_word')
            }
            get().recordCorrectAnswer()
          }
        }
      },

      setWordStatus: async (wordId, status) => {
        const db = createClient()
        const { error } = await db
          .from('user_words')
          .update({ status })
          .eq('id', wordId)

        if (!error) {
          set((s) => ({
            words: s.words.map((w) => (w.id === wordId ? { ...w, status } : w)),
          }))
        }
      },

      addPhrase: async (phraseData) => {
        const { user } = get()
        if (!user) return

        const db = createClient()
        const { data, error } = await db
          .from('user_phrases')
          .insert({ ...phraseData, user_id: user.id })
          .select()
          .single()

        if (!error && data) {
          set((s) => ({ phrases: [...s.phrases, data] }))
          get().awardXP('learn_phrase')
        }
      },

      removePhrase: async (phraseId) => {
        const db = createClient()
        const { error } = await db.from('user_phrases').delete().eq('id', phraseId)
        if (!error) {
          set((s) => ({ phrases: s.phrases.filter((p) => p.id !== phraseId) }))
        }
      },

      recordCorrectAnswer: async () => {
        const { user, studyActivity, profile } = get()
        if (!user) return

        const today = new Date().toISOString().split('T')[0]
        const prev = studyActivity[today] ?? 0
        const newCount = prev + 1

        const db = createClient()
        await db.from('study_sessions').upsert(
          { user_id: user.id, date: today, correct_count: newCount },
          { onConflict: 'user_id,date' }
        )

        set((s) => ({
          studyActivity: { ...s.studyActivity, [today]: newCount },
        }))

        // Award daily_goal XP when goal is first reached today
        const goal = profile?.daily_goal ?? 10
        if (prev < goal && newCount >= goal) {
          get().awardXP('daily_goal')
        }
      },

      awardXP: async (source) => {
        const { user, onXPAwarded } = get()
        if (!user) return

        const amount = XP_RATE_MAP[source]
        const db = createClient()
        const { error } = await db.from('xp_log').insert({ user_id: user.id, amount, source })

        if (!error) {
          set((s) => ({ xpTotal: s.xpTotal + amount }))
          onXPAwarded?.(amount, source)
        }
      },

      updateLang: async (lang) => {
        const { user } = get()
        if (!user) return

        const db = createClient()
        await db.from('profiles').update({ lang }).eq('id', user.id)
        set((s) => ({
          lang,
          profile: s.profile ? { ...s.profile, lang } : null,
        }))
      },

      updateDailyGoal: async (daily_goal) => {
        const { user } = get()
        if (!user) return

        const db = createClient()
        await db.from('profiles').update({ daily_goal }).eq('id', user.id)
        set((s) => ({
          profile: s.profile ? { ...s.profile, daily_goal } : null,
        }))
      },

      completeOnboarding: async (onboarding) => {
        const { user } = get()
        if (!user) return

        const db = createClient()
        const daily_goal = onboarding?.daily ?? 10
        await db.from('profiles').update({ onboarding, daily_goal }).eq('id', user.id)
        set((s) => ({
          profile: s.profile ? { ...s.profile, onboarding, daily_goal } : null,
        }))
      },

      // ─── Computed ─────────────────────────────────────────────────
      getLevel: () => calcLevel(get().xpTotal),
      getLevelTitle: () => getLevelTitle(calcLevel(get().xpTotal)),

      getTodayActivity: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().studyActivity[today] ?? 0
      },

      getStreak: () => {
        const { studyActivity } = get()
        let streak = 0
        const d = new Date()
        while (true) {
          const key = d.toISOString().split('T')[0]
          if ((studyActivity[key] ?? 0) > 0) {
            streak++
            d.setDate(d.getDate() - 1)
          } else {
            break
          }
        }
        return streak
      },

      getDueWords: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().words.filter((w) => w.srs_next <= today)
      },
    }),
    { name: 'hanzo-user-store' }
  )
)
