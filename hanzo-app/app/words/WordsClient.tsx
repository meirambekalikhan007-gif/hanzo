'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { BottomNav } from '@/components/BottomNav'
import type { UserWord } from '@/types/database'

const STATUS_COLORS = { new: '#60a5fa', learning: '#f59e0b', mastered: '#4ade80' }
const HSK_COLORS: Record<string, string> = { HSK1: '#4ade80', HSK2: '#60a5fa', HSK3: '#f59e0b', HSK4: '#c084fc', HSK5: '#f87171', HSK6: '#fb923c' }

export function WordsClient() {
  const { words, phrases, addWord, removeWord, setWordStatus, loadUserData, setUser } = useUserStore()
  const [tab, setTab] = useState<'list' | 'add' | 'phrases'>('list')
  const [filter, setFilter] = useState<'all' | 'new' | 'learning' | 'mastered'>('all')
  const [char, setChar] = useState('')
  const [pinyin, setPinyin] = useState('')
  const [meaning, setMeaning] = useState('')
  const [example, setExample] = useState('')
  const [hsk, setHsk] = useState('HSK1')
  const [cat, setCat] = useState('Daily life')
  const [adding, setAdding] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const db = require('@/lib/supabase/client').createClient()
    db.auth.getUser().then(({ data: { user } }: any) => {
      if (user) { setUser(user); loadUserData() }
    })
  }, [])

  const filtered = words.filter(w => filter === 'all' || w.status === filter)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!char || !meaning) return
    setAdding(true)
    await addWord({
      char, pinyin, meaning, hsk: hsk as any, cat, status: 'new',
      sm2_ef: 2.5, sm2_rep: 0, sm2_iv: 1,
      srs_next: new Date().toISOString().split('T')[0],
    })
    setChar(''); setPinyin(''); setMeaning(''); setExample(''); setAdding(false)
    setMsg('Word added! +2 XP')
    setTimeout(() => setMsg(''), 2000)
    setTab('list')
  }

  return (
    <div className="min-h-dvh pb-24 px-4" style={{ background: '#0d0d0f', color: '#f4f4f5' }}>
      <div className="pt-12 pb-4">
        <h1 className="text-2xl font-black">Words 📚</h1>
        <p className="text-sm" style={{ color: 'rgba(244,244,245,0.45)' }}>{words.length} words in your list</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-[12px] mb-4" style={{ background: '#18181b' }}>
        {[
          { id: 'list' as const, label: 'My Words' },
          { id: 'add' as const, label: '+ Add' },
          { id: 'phrases' as const, label: 'Phrases' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-[9px] text-xs font-semibold transition-all"
            style={{
              background: tab === t.id ? '#26262c' : 'transparent',
              color: tab === t.id ? '#f4f4f5' : 'rgba(244,244,245,0.4)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Status filter */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {(['all', 'new', 'learning', 'mastered'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wide transition-all"
                  style={{
                    background: filter === f ? 'rgba(232,96,122,0.12)' : '#18181b',
                    border: `1px solid ${filter === f ? 'rgba(232,96,122,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    color: filter === f ? '#e8607a' : 'rgba(244,244,245,0.4)',
                    fontFamily: 'monospace',
                  }}>
                  {f} {f !== 'all' && `(${words.filter(w => w.status === f).length})`}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📭</div>
                <p className="font-bold mb-1">No words yet</p>
                <p className="text-sm" style={{ color: 'rgba(244,244,245,0.4)' }}>Add words or browse the Word Bank</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filtered.map(w => (
                  <motion.div key={w.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="rounded-[14px] p-3" style={{ background: '#18181b', border: `1px solid rgba(255,255,255,0.07)`, borderLeft: `3px solid ${STATUS_COLORS[w.status]}` }}>
                    <div className="font-cn text-3xl font-black mb-1" style={{ color: '#e8607a' }}>{w.char}</div>
                    <div className="text-[10px] mb-0.5" style={{ color: '#f59e0b', fontFamily: 'monospace' }}>{w.pinyin}</div>
                    <div className="text-xs font-semibold mb-2">{w.meaning}</div>
                    <div className="flex items-center justify-between">
                      <select value={w.status} onChange={e => setWordStatus(w.id, e.target.value as any)}
                        className="text-[9px] rounded-md px-1.5 py-0.5 cursor-pointer"
                        style={{ background: '#26262c', border: '1px solid rgba(255,255,255,0.1)', color: STATUS_COLORS[w.status], fontFamily: 'monospace' }}>
                        <option value="new">New</option>
                        <option value="learning">Learning</option>
                        <option value="mastered">Mastered</option>
                      </select>
                      <button onClick={() => removeWord(w.id)} className="text-xs transition-colors" style={{ color: 'rgba(244,244,245,0.25)' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#e8607a'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(244,244,245,0.25)'}>
                        ×
                      </button>
                    </div>
                    <div className="mt-1.5">
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: `${HSK_COLORS[w.hsk]}18`, color: HSK_COLORS[w.hsk], fontFamily: 'monospace' }}>
                        {w.hsk}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'add' && (
          <motion.div key="add" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="rounded-[18px] p-4" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-sm font-bold mb-4">Add a new word</p>
              {msg && (
                <div className="mb-3 px-3 py-2 rounded-[10px] text-xs font-semibold" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>
                  {msg}
                </div>
              )}
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider mb-1.5" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>Chinese *</label>
                    <input value={char} onChange={e => setChar(e.target.value)} required placeholder="你好"
                      className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none font-cn"
                      style={{ background: '#26262c', border: '1px solid rgba(255,255,255,0.1)', color: '#f4f4f5' }} />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider mb-1.5" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>Pinyin</label>
                    <input value={pinyin} onChange={e => setPinyin(e.target.value)} placeholder="nǐ hǎo"
                      className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none"
                      style={{ background: '#26262c', border: '1px solid rgba(255,255,255,0.1)', color: '#f4f4f5' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-wider mb-1.5" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>Meaning *</label>
                  <input value={meaning} onChange={e => setMeaning(e.target.value)} required placeholder="Hello"
                    className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none"
                    style={{ background: '#26262c', border: '1px solid rgba(255,255,255,0.1)', color: '#f4f4f5' }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider mb-1.5" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>HSK Level</label>
                    <select value={hsk} onChange={e => setHsk(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none"
                      style={{ background: '#26262c', border: '1px solid rgba(255,255,255,0.1)', color: '#f4f4f5' }}>
                      {['HSK1','HSK2','HSK3','HSK4','HSK5','HSK6'].map(h => <option key={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider mb-1.5" style={{ color: 'rgba(244,244,245,0.4)', fontFamily: 'monospace' }}>Category</label>
                    <input value={cat} onChange={e => setCat(e.target.value)} placeholder="Daily life"
                      className="w-full px-3 py-2.5 rounded-[10px] text-sm outline-none"
                      style={{ background: '#26262c', border: '1px solid rgba(255,255,255,0.1)', color: '#f4f4f5' }} />
                  </div>
                </div>
                <button type="submit" disabled={adding || !char || !meaning}
                  className="w-full py-3 rounded-[12px] font-bold text-white text-sm disabled:opacity-50 transition-opacity"
                  style={{ background: '#e8607a' }}>
                  {adding ? 'Adding...' : 'Add Word +2 XP'}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {tab === 'phrases' && (
          <motion.div key="phrases" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {phrases.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">💬</div>
                <p className="font-bold mb-1">No phrases yet</p>
                <p className="text-sm" style={{ color: 'rgba(244,244,245,0.4)' }}>Add phrases from the Word Bank</p>
              </div>
            ) : (
              <div className="space-y-2">
                {phrases.map(p => (
                  <div key={p.id} className="rounded-[14px] p-4" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="font-cn text-lg font-bold mb-1">{p.phrase_cn}</p>
                    {p.phrase_py && <p className="text-xs mb-1" style={{ color: '#f59e0b', fontFamily: 'monospace' }}>{p.phrase_py}</p>}
                    {p.phrase_en && <p className="text-sm" style={{ color: 'rgba(244,244,245,0.6)' }}>{p.phrase_en}</p>}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
