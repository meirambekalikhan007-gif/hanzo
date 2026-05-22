'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { BottomNav } from '@/components/BottomNav'
import { WORD_BANK } from '@/lib/wordBank'

const TOPICS = [
  { id: 'greetings', icon: '👋', name: 'Greetings', color: '#4ade80', words: WORD_BANK.filter(w => w.cat === 'Greetings') },
  { id: 'daily', icon: '🌅', name: 'Daily Life', color: '#60a5fa', words: WORD_BANK.filter(w => w.cat === 'Daily life') },
  { id: 'numbers', icon: '🔢', name: 'Numbers', color: '#f59e0b', words: WORD_BANK.filter(w => w.cat === 'Numbers') },
  { id: 'time', icon: '⏰', name: 'Time', color: '#c084fc', words: WORD_BANK.filter(w => w.cat === 'Time') },
  { id: 'food', icon: '🍜', name: 'Food', color: '#f87171', words: WORD_BANK.filter(w => w.cat === 'Food') },
  { id: 'verbs', icon: '⚡', name: 'Verbs', color: '#fb923c', words: WORD_BANK.filter(w => w.cat === 'Verbs') },
  { id: 'adjectives', icon: '🎨', name: 'Adjectives', color: '#e879f9', words: WORD_BANK.filter(w => w.cat === 'Adjectives') },
  { id: 'emotions', icon: '💭', name: 'Emotions', color: '#f43f5e', words: WORD_BANK.filter(w => w.cat === 'Emotions') },
  { id: 'travel', icon: '✈️', name: 'Travel', color: '#06b6d4', words: WORD_BANK.filter(w => w.cat === 'Travel') },
  { id: 'work', icon: '💼', name: 'Work', color: '#84cc16', words: WORD_BANK.filter(w => w.cat === 'Work') },
  { id: 'business', icon: '🏪', name: 'Business', color: '#eab308', words: WORD_BANK.filter(w => w.cat === 'Business') },
  { id: 'shopping', icon: '🛍️', name: 'Shopping', color: '#ec4899', words: WORD_BANK.filter(w => w.cat === 'Shopping') },
]

function QuizView({ topic, onBack }: { topic: typeof TOPICS[0]; onBack: () => void }) {
  const { addWord, words: myWords, awardXP, recordCorrectAnswer } = useUserStore()
  const deck = topic.words
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  if (deck.length === 0) return (
    <div className="text-center py-12">
      <p className="text-5xl mb-3">📭</p>
      <p className="font-bold">No words in this topic yet</p>
      <button onClick={onBack} className="mt-4 px-6 py-2 rounded-[10px] text-sm" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', color: '#f4f4f5' }}>← Back</button>
    </div>
  )

  const card = deck[idx]
  const others = deck.filter((_, i) => i !== idx)
  const choices = [card, ...others.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5)

  async function choose(c: typeof deck[0]) {
    if (chosen) return
    setChosen(c.char)
    const correct = c.char === card.char
    if (correct) {
      setScore(s => s + 1)
      await recordCorrectAnswer()
      // Auto-add word if not in list
      if (!myWords.find(w => w.char === card.char)) {
        await addWord({ char: card.char, pinyin: card.pinyin, meaning: card.meaning, hsk: card.hsk as any, cat: card.cat, status: 'new', sm2_ef: 2.5, sm2_rep: 0, sm2_iv: 1, srs_next: new Date().toISOString().split('T')[0] })
      }
    }
    setTimeout(() => {
      if (idx + 1 >= deck.length) { setDone(true); return }
      setChosen(null)
      setIdx(i => i + 1)
    }, 800)
  }

  if (done) return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm" style={{ color: 'rgba(244,244,245,0.4)' }}>← Back</button>
      <div className="text-center py-8 rounded-[18px]" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-5xl mb-3">{score >= deck.length * 0.8 ? '🎉' : '💪'}</div>
        <div className="text-3xl font-black mb-1">{score}/{deck.length}</div>
        <p className="text-sm mb-4" style={{ color: 'rgba(244,244,245,0.45)' }}>{Math.round((score / deck.length) * 100)}% correct</p>
        <p className="text-xs mb-6" style={{ color: 'rgba(244,244,245,0.35)' }}>Correct words added to your list automatically</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onBack} className="px-4 py-2 rounded-[10px] text-sm font-semibold" style={{ background: '#26262c', color: '#f4f4f5' }}>← Topics</button>
          <button onClick={() => { setIdx(0); setChosen(null); setScore(0); setDone(false) }}
            className="px-4 py-2 rounded-[10px] text-sm font-bold text-white" style={{ background: '#e8607a' }}>
            Try Again
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="w-9 h-9 rounded-[10px] flex items-center justify-center text-lg" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)' }}>←</button>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div className="h-full rounded-full" style={{ background: topic.color, width: `${(idx / deck.length) * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <span className="text-xs font-bold" style={{ color: '#4ade80', fontFamily: 'monospace' }}>✓ {score}</span>
      </div>

      <div className="text-center rounded-[18px] p-6 mb-4" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="font-cn text-6xl font-black mb-2" style={{ color: topic.color }}>{card.char}</div>
        <p className="text-sm" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>{card.pinyin}</p>
        <p className="text-xs mt-2" style={{ color: 'rgba(244,244,245,0.3)' }}>What does this mean?</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {choices.map(c => {
          const isChosen = chosen === c.char
          const isCorrect = c.char === card.char
          let bg = '#18181b', border = 'rgba(255,255,255,0.07)', color = '#f4f4f5'
          if (chosen) {
            if (isCorrect) { bg = 'rgba(74,222,128,0.12)'; border = 'rgba(74,222,128,0.4)'; color = '#4ade80' }
            else if (isChosen) { bg = 'rgba(232,96,122,0.12)'; border = 'rgba(232,96,122,0.4)'; color = '#e8607a' }
          }
          return (
            <button key={c.char} onClick={() => choose(c)}
              className="py-4 px-3 rounded-[14px] text-sm font-semibold active:scale-95 transition-all"
              style={{ background: bg, border: `1.5px solid ${border}`, color }}>
              {c.meaning}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function LessonsClient() {
  const { words, xpTotal, loadUserData, setUser } = useUserStore()
  const [active, setActive] = useState<typeof TOPICS[0] | null>(null)

  useEffect(() => {
    const db = require('@/lib/supabase/client').createClient()
    db.auth.getUser().then(({ data: { user } }: any) => {
      if (user) { setUser(user); loadUserData() }
    })
  }, [])

  return (
    <div className="min-h-dvh pb-24 px-4" style={{ background: '#0d0d0f', color: '#f4f4f5' }}>
      <div className="pt-12 pb-4">
        <h1 className="text-2xl font-black">Lessons 🗺️</h1>
        <p className="text-sm" style={{ color: 'rgba(244,244,245,0.45)' }}>Learn by topic — words auto-added to your list</p>
      </div>

      <AnimatePresence mode="wait">
        {active ? (
          <motion.div key="quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <QuizView topic={active} onBack={() => setActive(null)} />
          </motion.div>
        ) : (
          <motion.div key="topics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-2 gap-3">
              {TOPICS.map((t, i) => {
                const learned = words.filter(w => t.words.some(tw => tw.char === w.char)).length
                const pct = t.words.length > 0 ? Math.round((learned / t.words.length) * 100) : 0
                return (
                  <motion.button key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    onClick={() => setActive(t)}
                    className="rounded-[18px] p-4 text-left active:scale-95 transition-transform"
                    style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-xl mb-3" style={{ background: `${t.color}18` }}>
                      {t.icon}
                    </div>
                    <p className="text-sm font-bold mb-0.5">{t.name}</p>
                    <p className="text-[10px] mb-2" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>{t.words.length} words</p>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="h-full rounded-full" style={{ background: t.color, width: `${pct}%`, transition: 'width 0.5s' }} />
                    </div>
                    <p className="text-[9px] mt-1" style={{ color: 'rgba(244,244,245,0.3)', fontFamily: 'monospace' }}>{pct}% learned</p>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
