'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/Spinner'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const db = createClient()
    const { error } = await db.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
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
      <div className="text-center mb-10 mt-16">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] mb-4"
          style={{ background: 'rgba(232,96,122,0.15)', border: '1px solid rgba(232,96,122,0.3)' }}
        >
          <span className="font-cn text-2xl" style={{ color: '#e8607a' }}>汉</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm" style={{ color: 'rgba(244,244,245,0.45)' }}>
          Continue your Chinese journey
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            onFocus={(e) => {
              e.currentTarget.style.border = '1px solid rgba(232,96,122,0.5)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'
            }}
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full h-12 px-4 rounded-[12px] text-sm text-white outline-none transition-all"
            style={{
              background: '#1f1f23',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = '1px solid rgba(232,96,122,0.5)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'
            }}
          />
        </div>

        {/* Error */}
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

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          className="w-full h-12 rounded-[12px] font-semibold text-white text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
          style={{ background: '#e8607a' }}
        >
          {loading ? <Spinner size={18} /> : 'Sign in'}
        </motion.button>
      </form>

      <p className="text-center mt-6 text-sm" style={{ color: 'rgba(244,244,245,0.4)' }}>
        No account?{' '}
        <Link
          href="/signup"
          className="font-medium"
          style={{ color: '#e8607a' }}
        >
          Create one
        </Link>
      </p>
    </motion.div>
  )
}
