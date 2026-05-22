'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { BottomNav } from '@/components/BottomNav'
import { WORD_BANK, WORD_BANK_CATS } from '@/lib/wordBank'

const HSK_LEVELS = ['All', 'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5']
const HSK_COLORS: Record<string, string> = { HSK1: '#4ade80', HSK2: '#60a5fa', HSK3: '#f59e0b', HSK4: '#c084fc', HSK5: '#f87171' }

export function BankClient() {
  const { words, addWord, loadUserData, setUser } = useUserStore()
  const [hskFilter, setHskFilter] = useState('All')
  const [catFilter, setCatFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [added, setAdded] = useState<Set<string>>(new Set())

  useEffect(() => {
    const db = require('@/lib/supabase/client').createClient()
    db.auth.getUser().then(({ data: { user } }: any) => {
      if (user) { setUser(user); loadUserData() }
    })
  }, [])

  useEffect(() => {
    const myChars = new Set(words.map(w => w.char))
    setAdded(myChars)
  }, [words])

  const filtered = WORD_BANK.filter(w => {
    if (hskFilter !== 'All' && w.hsk !== hskFilter) return false
    if (catFilter !== 'All' && w.cat !== catFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return w.char.includes(search) || w.pinyin.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q)
    }
    return true
  })

  async function handleAdd(w: typeof WORD_BANK[0]) {
    if (added.has(w.char)) return
    await addWord({
      char: w.char, pinyin: w.pinyin, meaning: w.meaning,
      hsk: w.hsk as any, cat: w.cat, status: 'new',
      sm2_ef: 2.5, sm2_rep: 0, sm2_iv: 1,
      srs_next: new Date().toISOString().split('T')[0],
    })
    setAdded(prev => new Set([...prev, w.char]))
  }

  return (
    <div className="min-h-dvh pb-24 px-4" style={{ background: '#0d0d0f', color: '#f4f4f5' }}>
      <div className="pt-12 pb-4">
        <h1 className="text-2xl font-black">Word Bank 🏦</h1>
        <p className="text-sm" style={{ color: 'rgba(244,244,245,0.45)' }}>{WORD_BANK.length} words · HSK1–5 + Business Chinese</p>
      </div>

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search characters, pinyin, meaning..."
        className="w-full px-4 py-3 rounded-[12px] text-sm outline-none mb-3"
        style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)', color: '#f4f4f5' }} />

      {/* HSK filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-2 scrollbar-none">
        {HSK_LEVELS.map(h => (
          <button key={h} onClick={() => setHskFilter(h)}
            className="px-3 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0 transition-all"
            style={{
              background: hskFilter === h ? (h === 'All' ? 'rgba(232,96,122,0.12)' : `${HSK_COLORS[h]}18`) : '#18181b',
              border: `1px solid ${hskFilter === h ? (h === 'All' ? 'rgba(232,96,122,0.4)' : `${HSK_COLORS[h]}60`) : 'rgba(255,255,255,0.07)'}`,
              color: hskFilter === h ? (h === 'All' ? '#e8607a' : HSK_COLORS[h]) : 'rgba(244,244,245,0.4)',
              fontFamily: 'monospace',
            }}>
            {h}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {['All', ...WORD_BANK_CATS].map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className="px-3 py-1 rounded-full text-[9px] font-semibold whitespace-nowrap flex-shrink-0 transition-all"
            style={{
              background: catFilter === c ? 'rgba(232,96,122,0.1)' : 'transparent',
              border: `1px solid ${catFilter === c ? 'rgba(232,96,122,0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: catFilter === c ? '#e8607a' : 'rgba(244,244,245,0.35)',
              fontFamily: 'monospace',
            }}>
            {c}
          </button>
        ))}
      </div>

      <p className="text-[10px] mb-3" style={{ color: 'rgba(244,244,245,0.3)', fontFamily: 'monospace' }}>{filtered.length} words</p>

      {/* Word list */}
      <div className="space-y-2">
        {filtered.map((w, i) => {
          const isAdded = added.has(w.char)
          return (
            <motion.div key={w.char} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className="rounded-[14px] p-3 flex items-center gap-3"
              style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)', opacity: isAdded ? 0.6 : 1 }}>
              <div className="font-cn text-3xl font-black flex-shrink-0" style={{ color: '#e8607a', minWidth: 48, textAlign: 'center' }}>{w.char}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] mb-0.5" style={{ color: '#f59e0b', fontFamily: 'monospace' }}>{w.pinyin}</p>
                <p className="text-sm font-semibold truncate">{w.meaning}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: `${HSK_COLORS[w.hsk] ?? '#888'}18`, color: HSK_COLORS[w.hsk] ?? '#888', fontFamily: 'monospace' }}>{w.hsk}</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(244,244,245,0.35)', fontFamily: 'monospace' }}>{w.cat}</span>
                </div>
                {w.example && <p className="text-[10px] font-cn mt-1 truncate" style={{ color: 'rgba(244,244,245,0.35)' }}>{w.example}</p>}
              </div>
              <button onClick={() => handleAdd(w)} disabled={isAdded}
                className="flex-shrink-0 px-3 py-1.5 rounded-[8px] text-[10px] font-bold transition-all disabled:cursor-default"
                style={{
                  background: isAdded ? 'rgba(74,222,128,0.1)' : 'rgba(232,96,122,0.12)',
                  border: `1px solid ${isAdded ? 'rgba(74,222,128,0.3)' : 'rgba(232,96,122,0.3)'}`,
                  color: isAdded ? '#4ade80' : '#e8607a',
                  fontFamily: 'monospace',
                }}>
                {isAdded ? '✓ Added' : '+ Add'}
              </button>
            </motion.div>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}
