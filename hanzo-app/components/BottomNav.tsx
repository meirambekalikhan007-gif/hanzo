'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/home',    icon: '🏠', label: 'Home' },
  { href: '/lessons', icon: '🗺️', label: 'Lessons' },
  { href: '/games',   icon: '🎮', label: 'Games' },
  { href: '/words',   icon: '📚', label: 'Words' },
  { href: '/bank',    icon: '🏦', label: 'Bank' },
  { href: '/friends', icon: '👥', label: 'Friends' },
]

export function BottomNav() {
  const path = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex"
      style={{
        background: 'rgba(10,10,12,0.96)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
      }}
    >
      {TABS.map((tab) => {
        const active = path.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1 no-underline"
          >
            <span className="text-lg leading-none" style={{ fontSize: 20 }}>{tab.icon}</span>
            <span
              className="text-[8px] uppercase tracking-wide font-medium"
              style={{
                color: active ? '#e8607a' : 'rgba(244,244,245,0.35)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {tab.label}
            </span>
            {active && (
              <div
                className="absolute bottom-0 rounded-full"
                style={{ width: 4, height: 4, background: '#e8607a' }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
