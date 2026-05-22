'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { BottomNav } from '@/components/BottomNav'
import { WORD_BANK, type BankWord } from '@/lib/wordBank'

type GameMode = 'flashcard' | 'mc' | 'match'
type WordPool = 'my' | 'bank'

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function pick(arr: BankWord[], n: number): BankWord[] {
  return shuffle(arr).slice(0, n)
}

// ─── Flashcard game ────────────────────────────────────────────────────────
function FlashcardGame({ pool }: { pool: BankWord[] }) {
  const { updateWordSRS, words, recordCorrectAnswer } = useUserStore()
  const deck = pool.length >= 4 ? shuffle(pool) : shuffle(WORD_BANK).slice(0, 10)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const card = deck[idx]

  async function rate(quality: 'wrong' | 'ok' | 'got') {
    const correct = quality !== 'wrong'
    const userWord = words.find(w => w.char === card.char)
    if (userWord) await updateWordSRS(userWord.id, correct)
    if (correct) await recordCorrectAnswer()
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
    if (idx + 1 >= deck.length) { setDone(true); return }
    setFlipped(false)
    setTimeout(() => setIdx(i => i + 1), 200)
  }

  if (done) return (
    <div className="text-center py-8">
      <div className="text-6xl mb-4">{score.correct / score.total >= 0.8 ? '🎉' : '💪'}</div>
      <div className="text-3xl font-black mb-1">{Math.round((score.correct / score.total) * 100)}%</div>
      <p className="text-sm mb-6" style={{ color: 'rgba(244,244,245,0.45)' }}>{score.correct}/{score.total} correct</p>
      <button onClick={() => { setIdx(0); setFlipped(false); setDone(false); setScore({ correct: 0, total: 0 }) }}
        className="px-6 py-3 rounded-[12px] font-bold text-white" style={{ background: '#e8607a' }}>
        Play Again
      </button>
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>{idx + 1} / {deck.length}</span>
        <span className="text-xs font-bold" style={{ color: '#4ade80', fontFamily: 'monospace' }}>✓ {score.correct}</span>
      </div>
      <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full" style={{ background: '#e8607a', width: `${((idx) / deck.length) * 100}%`, transition: 'width 0.3s' }} />
      </div>

      <motion.div key={idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        onClick={() => setFlipped(f => !f)}
        className="rounded-[20px] p-8 text-center cursor-pointer min-h-[200px] flex flex-col items-center justify-center mb-4 active:scale-[0.98] transition-transform"
        style={{ background: '#18181b', border: `1.5px solid ${flipped ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
        <div className="font-cn text-6xl font-black mb-2" style={{ color: '#e8607a' }}>{card.char}</div>
        {!flipped ? (
          <p className="text-xs" style={{ color: 'rgba(244,244,245,0.3)', fontFamily: 'monospace' }}>tap to reveal</p>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-lg font-semibold mb-1" style={{ color: '#f59e0b', fontFamily: 'monospace' }}>{card.pinyin}</p>
            <p className="text-xl font-bold mb-2">{card.meaning}</p>
            <p className="text-xs font-cn" style={{ color: 'rgba(244,244,245,0.4)' }}>{card.example}</p>
          </motion.div>
        )}
      </motion.div>

      {flipped && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-2">
          {[
            { label: '✗ Wrong', q: 'wrong' as const, bg: 'rgba(232,96,122,0.12)', border: 'rgba(232,96,122,0.3)', color: '#e8607a' },
            { label: '~ Okay', q: 'ok' as const, bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#f59e0b' },
            { label: '✓ Got it', q: 'got' as const, bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)', color: '#4ade80' },
          ].map(b => (
            <button key={b.q} onClick={() => rate(b.q)}
              className="py-3 rounded-[12px] font-bold text-sm active:scale-95 transition-transform"
              style={{ background: b.bg, border: `1.5px solid ${b.border}`, color: b.color }}>
              {b.label}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ─── Multiple choice game ──────────────────────────────────────────────────
function MCGame({ pool }: { pool: BankWord[] }) {
  const { recordCorrectAnswer } = useUserStore()
  const fullPool = pool.length >= 8 ? pool : WORD_BANK
  const deck = shuffle(fullPool).slice(0, 10)
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const card = deck[idx]
  const distractors = shuffle(fullPool.filter(w => w.char !== card.char)).slice(0, 3)
  const choices = shuffle([card, ...distractors])

  async function choose(c: BankWord) {
    if (chosen) return
    setChosen(c.char)
    const correct = c.char === card.char
    if (correct) { setScore(s => s + 1); await recordCorrectAnswer() }
    setTimeout(() => {
      if (idx + 1 >= deck.length) { setDone(true); return }
      setChosen(null)
      setIdx(i => i + 1)
    }, 900)
  }

  if (done) return (
    <div className="text-center py-8">
      <div className="text-6xl mb-4">{score >= 8 ? '🎉' : score >= 5 ? '👍' : '💪'}</div>
      <div className="text-3xl font-black mb-1">{score}/10</div>
      <p className="text-sm mb-6" style={{ color: 'rgba(244,244,245,0.45)' }}>{Math.round(score * 10)}% accuracy</p>
      <button onClick={() => { setIdx(0); setChosen(null); setScore(0); setDone(false) }}
        className="px-6 py-3 rounded-[12px] font-bold text-white" style={{ background: '#e8607a' }}>
        Play Again
      </button>
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>{idx + 1} / {deck.length}</span>
        <span className="text-xs font-bold" style={{ color: '#4ade80', fontFamily: 'monospace' }}>✓ {score}</span>
      </div>
      <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full" style={{ background: '#e8607a', width: `${(idx / deck.length) * 100}%`, transition: 'width 0.3s' }} />
      </div>

      <div className="text-center mb-6">
        <div className="font-cn text-7xl font-black mb-2" style={{ color: '#e8607a' }}>{card.char}</div>
        <p className="text-sm" style={{ color: 'rgba(244,244,245,0.4)' }}>What does this mean?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
              className="py-4 px-3 rounded-[14px] font-semibold text-sm active:scale-95 transition-all text-left"
              style={{ background: bg, border: `1.5px solid ${border}`, color }}>
              {c.meaning}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Match game ────────────────────────────────────────────────────────────
function MatchGame({ pool }: { pool: BankWord[] }) {
  const { recordCorrectAnswer } = useUserStore()
  const fullPool = pool.length >= 6 ? pool : WORD_BANK
  const pairs = shuffle(fullPool).slice(0, 6)
  const [selected, setSelected] = useState<{ type: 'char' | 'meaning'; idx: number } | null>(null)
  const [matched, setMatched] = useState<number[]>([])
  const [wrong, setWrong] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const chars = pairs
  const meanings = shuffle(pairs)

  async function selectItem(type: 'char' | 'meaning', idx: number) {
    if (matched.includes(idx)) return
    if (selected === null) { setSelected({ type, idx }); return }
    if (selected.type === type) { setSelected({ type, idx }); return }

    const charIdx = type === 'char' ? idx : selected.idx
    const meaningIdx = type === 'meaning' ? idx : selected.idx
    const isMatch = chars[charIdx].char === meanings[meaningIdx].char

    if (isMatch) {
      const newMatched = [...matched, charIdx]
      setMatched(newMatched)
      setSelected(null)
      await recordCorrectAnswer()
      if (newMatched.length === pairs.length) setDone(true)
    } else {
      setWrong([charIdx, meaningIdx])
      setTimeout(() => { setWrong([]); setSelected(null) }, 600)
    }
  }

  if (done) return (
    <div className="text-center py-8">
      <div className="text-6xl mb-4">🎉</div>
      <div className="text-2xl font-black mb-1">All Matched!</div>
      <p className="text-sm mb-6" style={{ color: 'rgba(244,244,245,0.45)' }}>Great memory!</p>
      <button onClick={() => { setSelected(null); setMatched([]); setWrong([]); setDone(false) }}
        className="px-6 py-3 rounded-[12px] font-bold text-white" style={{ background: '#e8607a' }}>
        Play Again
      </button>
    </div>
  )

  return (
    <div>
      <p className="text-xs mb-4 text-center" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>
        Match {matched.length}/{pairs.length} — tap a character then its meaning
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {chars.map((w, i) => {
            const isMatched = matched.includes(i)
            const isSelected = selected?.type === 'char' && selected.idx === i
            const isWrong = wrong.includes(i)
            return (
              <button key={w.char} onClick={() => selectItem('char', i)}
                className="w-full py-3 rounded-[12px] font-cn text-2xl font-black active:scale-95 transition-all"
                style={{
                  background: isMatched ? 'rgba(74,222,128,0.12)' : isWrong ? 'rgba(232,96,122,0.12)' : isSelected ? 'rgba(96,165,250,0.12)' : '#18181b',
                  border: `1.5px solid ${isMatched ? 'rgba(74,222,128,0.4)' : isWrong ? 'rgba(232,96,122,0.4)' : isSelected ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.07)'}`,
                  color: isMatched ? '#4ade80' : isWrong ? '#e8607a' : isSelected ? '#60a5fa' : '#e8607a',
                  opacity: isMatched ? 0.5 : 1,
                }}>
                {w.char}
              </button>
            )
          })}
        </div>
        <div className="space-y-2">
          {meanings.map((w, i) => {
            const matchedCharIdx = matched.find(mi => chars[mi].char === w.char)
            const isMatched = matchedCharIdx !== undefined
            const isSelected = selected?.type === 'meaning' && selected.idx === i
            const isWrong = wrong.includes(i)
            return (
              <button key={`${w.char}-m`} onClick={() => selectItem('meaning', i)}
                className="w-full py-3 px-2 rounded-[12px] text-xs font-semibold active:scale-95 transition-all text-center leading-tight"
                style={{
                  background: isMatched ? 'rgba(74,222,128,0.12)' : isWrong ? 'rgba(232,96,122,0.12)' : isSelected ? 'rgba(96,165,250,0.12)' : '#18181b',
                  border: `1.5px solid ${isMatched ? 'rgba(74,222,128,0.4)' : isWrong ? 'rgba(232,96,122,0.4)' : isSelected ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.07)'}`,
                  color: isMatched ? '#4ade80' : isWrong ? '#e8607a' : isSelected ? '#60a5fa' : '#f4f4f5',
                  opacity: isMatched ? 0.5 : 1,
                  minHeight: 48,
                }}>
                {w.meaning}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main Games page ───────────────────────────────────────────────────────
export function GamesClient() {
  const { words, loadUserData, setUser } = useUserStore()
  const [mode, setMode] = useState<GameMode>('flashcard')
  const [pool, setPool] = useState<WordPool>('bank')
  const [key, setKey] = useState(0)

  useEffect(() => {
    const db = require('@/lib/supabase/client').createClient()
    db.auth.getUser().then(({ data: { user } }: any) => {
      if (user) { setUser(user); loadUserData() }
    })
  }, [])

  const myWords: BankWord[] = words.map(w => ({ char: w.char, pinyin: w.pinyin, meaning: w.meaning, example: '', hsk: w.hsk, cat: w.cat }))
  const activePool = pool === 'my' && myWords.length >= 4 ? myWords : WORD_BANK

  const MODES: { id: GameMode; icon: string; label: string; desc: string }[] = [
    { id: 'flashcard', icon: '🃏', label: 'Flashcard', desc: 'SRS rating' },
    { id: 'mc', icon: '🎯', label: 'Quiz', desc: '4 choices' },
    { id: 'match', icon: '🔗', label: 'Match', desc: 'Pair up' },
  ]

  return (
    <div className="min-h-dvh pb-24 px-4" style={{ background: '#0d0d0f', color: '#f4f4f5' }}>
      <div className="pt-12 pb-4">
        <h1 className="text-2xl font-black">Games 🎮</h1>
        <p className="text-sm" style={{ color: 'rgba(244,244,245,0.45)' }}>Practice makes perfect</p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {MODES.map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setKey(k => k + 1) }}
            className="rounded-[14px] p-3 text-center transition-all active:scale-95"
            style={{
              background: mode === m.id ? 'rgba(232,96,122,0.12)' : '#18181b',
              border: `1.5px solid ${mode === m.id ? 'rgba(232,96,122,0.4)' : 'rgba(255,255,255,0.07)'}`,
            }}>
            <div className="text-xl mb-1">{m.icon}</div>
            <div className="text-xs font-bold" style={{ color: mode === m.id ? '#e8607a' : '#f4f4f5' }}>{m.label}</div>
            <div className="text-[9px]" style={{ color: 'rgba(244,244,245,0.35)', fontFamily: 'monospace' }}>{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Pool selector */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'bank' as const, label: '🏦 Word Bank', count: WORD_BANK.length },
          { id: 'my' as const, label: '📚 My Words', count: myWords.length },
        ].map(p => (
          <button key={p.id} onClick={() => { setPool(p.id); setKey(k => k + 1) }}
            className="flex-1 py-2 rounded-[10px] text-xs font-semibold transition-all"
            style={{
              background: pool === p.id ? 'rgba(232,96,122,0.12)' : '#18181b',
              border: `1.5px solid ${pool === p.id ? 'rgba(232,96,122,0.4)' : 'rgba(255,255,255,0.07)'}`,
              color: pool === p.id ? '#e8607a' : 'rgba(244,244,245,0.5)',
            }}>
            {p.label} ({p.count})
          </button>
        ))}
      </div>

      {/* Game area */}
      <div className="rounded-[18px] p-4" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)' }}>
        <AnimatePresence mode="wait">
          <motion.div key={`${mode}-${pool}-${key}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {mode === 'flashcard' && <FlashcardGame pool={activePool} />}
            {mode === 'mc' && <MCGame pool={activePool} />}
            {mode === 'match' && <MatchGame pool={activePool} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  )
}
