'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/Spinner'
import type { Lang } from '@/types/database'

const LANG_OPTIONS: { value: Lang; label: string; native: string }[] = [
  { value: 'ru', label: 'Russian', native: 'Русский' },
  { value: 'kz', label: 'Kazakh', native: 'Қазақша' },
  { value: 'en', label: 'English', native: 'English' },
]

export function SignupForm() {
  const router = useRouter()
  const [step, setStep] = useState<'lang' | 'details'>('lang')
  const [lang, setLang] = useState<Lang>('ru')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const db = createClient()
    const { error } = await db.auth.signUp({
      email,
      password,
      options: {
        data: { name, lang },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Trigger fires in Supabase to create profile row
      router.push('/home')
      router.refresh()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className="w-full max-w-[390px] mx-auto px-5"
    >
      {/* Logo */}
      <div className="text-center mb-8 mt-14">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] mb-4"
          style={{ background: 'rgba(232,96,122,0.15)', border: '1px solid rgba(232,96,122,0.3)' }}
        >
          <span className="font-cn text-2xl" style={{ color: '#e8607a' }}>汉</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Start learning</h1>
        <p className="mt-1.5 text-sm" style={{ color: 'rgba(244,244,245,0.45)' }}>
          Chinese for Kazakh & Russian speakers
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'lang' ? (
          <motion.div
            key="lang"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-sm font-medium mb-3" style={{ color: 'rgba(244,244,245,0.6)' }}>
              Choose your language
            </p>
            <div className="space-y-3">
              {LANG_OPTIONS.map((opt) => (
                <motion.button
                  key={opt.value}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setLang(opt.value)}
                  className="w-full h-14 rounded-[14px] flex items-center px-4 gap-3 transition-all"
                  style={{
                    background: lang === opt.value ? 'rgba(232,96,122,0.12)' : '#1f1f23',
                    border: lang === opt.value
                      ? '1.5px solid rgba(232,96,122,0.5)'
                      : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <span className="text-lg">{opt.value === 'ru' ? '🇷🇺' : opt.value === 'kz' ? '🇰🇿' : '🌐'}</span>
                  <span className="text-sm font-medium text-white">{opt.native}</span>
                  <span className="ml-auto text-xs" style={{ color: 'rgba(244,244,245,0.35)' }}>
                    {opt.label}
                  </span>
                  {lang === opt.value && (
                    <span style={{ color: '#e8607a' }}>✓</span>
                  )}
                </motion.button>
              ))}
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => setStep('details')}
              className="w-full h-12 rounded-[12px] font-semibold text-white text-sm mt-6"
              style={{ background: '#e8607a' }}
            >
              Continue →
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Back */}
              <button
                type="button"
                onClick={() => setStep('lang')}
                className="text-sm mb-1"
                style={{ color: 'rgba(244,244,245,0.4)' }}
              >
                ← Back
              </button>

              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-medium mb-2"
                  style={{ color: 'rgba(244,244,245,0.6)' }}
                >
                  Your name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ali"
                  className="w-full h-12 px-4 rounded-[12px] text-sm text-white outline-none transition-all"
                  style={{
                    background: '#1f1f23',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.border = '1px solid rgba(232,96,122,0.5)' }}
                  onBlur={(e) => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)' }}
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium mb-2"
                  style={{ color: 'rgba(244,244,245,0.6)' }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-12 px-4 rounded-[12px] text-sm text-white outline-none transition-all"
                  style={{
                    background: '#1f1f23',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.border = '1px solid rgba(232,96,122,0.5)' }}
                  onBlur={(e) => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)' }}
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium mb-2"
                  style={{ color: 'rgba(244,244,245,0.6)' }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full h-12 px-4 rounded-[12px] text-sm text-white outline-none transition-all"
                  style={{
                    background: '#1f1f23',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.border = '1px solid rgba(232,96,122,0.5)' }}
                  onBlur={(e) => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)' }}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 rounded-[10px] text-sm"
                  style={{ background: 'rgba(232,96,122,0.12)', color: '#e8607a' }}
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                className="w-full h-12 rounded-[12px] font-semibold text-white text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: '#e8607a' }}
              >
                {loading ? <Spinner size={18} /> : 'Create account'}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center mt-6 text-sm" style={{ color: 'rgba(244,244,245,0.4)' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-medium" style={{ color: '#e8607a' }}>
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
