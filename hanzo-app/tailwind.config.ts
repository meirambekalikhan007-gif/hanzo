import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Hanzo design system
        bg: '#0d0d0f',
        s1: '#18181b',
        s2: '#1f1f23',
        s3: '#26262c',
        red: {
          DEFAULT: '#e8607a',
          bg: 'rgba(232,96,122,0.1)',
        },
        gold: '#f59e0b',
        green: {
          DEFAULT: '#4ade80',
          600: '#16a34a',
        },
        blue: {
          DEFAULT: '#60a5fa',
          600: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        cn: ['Noto Sans SC', 'serif'],
      },
      borderRadius: {
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '20': '20px',
        '24': '24px',
      },
      animation: {
        'spring-in': 'springIn 0.4s cubic-bezier(.34,1.56,.64,1)',
        'wrong-shake': 'wrongShake 0.4s ease',
        'xp-float': 'xpFloat 1.2s ease forwards',
        'combo-burst': 'comboBurst 0.5s ease forwards',
      },
      keyframes: {
        springIn: {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '70%': { transform: 'scale(1.08)' },
          '85%': { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        wrongShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-5px)' },
          '80%': { transform: 'translateX(5px)' },
        },
        xpFloat: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-48px)', opacity: '0' },
        },
        comboBurst: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(.34,1.56,.64,1)',
        apple: 'cubic-bezier(.2,.8,.2,1)',
      },
    },
  },
  plugins: [],
}

export default config
