# HANZO — Full Project Handoff
## Claude Code (VS Code) Continuation Guide

> **Last session:** Claude.ai — 40+ iterations, ~v24 of hanzo.html  
> **Status:** Single-file prototype → Ready for full-stack migration  
> **Next step:** Next.js + Supabase + real backend  

---

## 1. WHO IS ALIKHAN (ALI)

- 18-year-old Kazakhstani entrepreneur at Wuhan University, China
- Building Hanzo as part of a financial freedom plan (target: $500K/year before 25)
- Native languages: **Kazakh, Russian** — also fluent in English
- The app targets **Kazakh and Russian-speaking** users learning Chinese
- He goes by **Ali** in casual context

**Design mandate:** Think like Duolingo + TikTok retention + Apple design + Stripe engineering. Every decision must feel like a billion-dollar startup product.

---

## 2. WHAT IS HANZO

A **Chinese language learning app** for Kazakh/Russian speakers. Full Chinese character + pinyin + meaning system. Built around spaced repetition, real-world dialogues, and gamification.

**Tagline:** "Learn Chinese. Build Fluency."

**Target users:** Kazakh & Russian entrepreneurs, students, traders doing business with China (ages 18–35)

**Revenue plan:**
- Sourcing course (China sourcing knowledge)
- Agency clients
- Brand deals
- Premium app features (future)

---

## 3. CURRENT STATE OF THE APP

### File
- `hanzo.html` — **11,731 lines**, **656 KB**, single file
- Built across 24 versions in one Claude.ai session
- No build system, no dependencies, pure HTML/CSS/JS

### What's inside
| Category | Detail |
|---|---|
| Word bank | 491 words across HSK 1–4 |
| Phrase bank | 76 phrases in 9 categories |
| Real Talk scenes | 39 dialog scenarios across 8 topics |
| Games | 10 (Flashcard, MC, Match, Pinyin, Char Hunt, Recall, Sentence Order, Phrase Flash, Phrase Fill, True/False, Real Talk) |
| Languages | EN / RU / KZ (full i18n) |
| Pages | Home, Lessons, Games, Words, Bank, Friends |
| Lessons | HSK-structured units with quiz system |
| SRS | SM-2 algorithm (ease factor, repetitions, intervals) |
| Auth | SHA-256 hashed passwords in localStorage |
| XP system | 10 XP rate types, level 1–100 with titles |

---

## 4. DATA ARCHITECTURE (Current localStorage)

### Storage Keys
```
hanzo_users          → Array of all user accounts
hanzo_data_[email]   → Per-user state object (S)
hanzo_nudge_[userId] → Cross-user nudge messages
```

### User State Object (S)
```javascript
S = {
  // Identity
  name: string,
  lang: 'en' | 'ru' | 'kz',
  user_id: string,           // stable UUID
  theme: 'dark' | 'light',

  // Progress
  xp_earned: number,
  study_activity: { 'YYYY-MM-DD': correctCount },
  daily_goal: number,        // words practiced per day

  // Word Bank
  chars_list: [{
    id: number,              // Date.now() + random
    char: string,            // Chinese character(s)
    pinyin: string,
    meaning: string,         // English meaning
    hsk: 'HSK1'|'HSK2'|'HSK3'|'HSK4'|'HSK5'|'HSK6',
    cat: string,             // category
    status: 'new'|'learning'|'mastered',
    date: 'YYYY-MM-DD',      // date added
    srs_streak: number,
    srs_next: 'YYYY-MM-DD',  // SM-2 next review date
    sm2_ef: number,          // ease factor (1.3–2.5)
    sm2_rep: number,         // repetition count
    sm2_iv: number,          // current interval (days)
  }],

  // Phrase Bank
  phrases_list: [{
    id: number,
    cn: string,
    py: string,
    en: string, ru: string, kz: string,
    status: 'new'|'learning'|'mastered',
    fromBank: boolean,
  }],

  // Onboarding
  onboarding: {
    goals: ['business'|'travel'|'exam'|'fluency'|'culture'],
    level: 'zero'|'basic'|'intermediate'|'advanced',
    daily: 5|10|20|30,
  },

  // Social
  friends: [],
  followed: [],

  // Lesson progress
  'ls_[topicId]_[unitIndex]': number,  // score 0-100

  // Wins journal
  wins: [{ date, text }],

  // Settings
  mute: boolean,
}
```

---

## 5. DESIGN SYSTEM

### CSS Variables (Dark Mode default)
```css
--bg: #0d0d0f          /* Page background */
--s1: #18181b          /* Card surface 1 */
--s2: #1f1f23          /* Card surface 2 */
--s3: #26262c          /* Card surface 3 */
--border: rgba(255,255,255,.07)
--border2: rgba(255,255,255,.12)
--red: #e8607a         /* Primary brand color */
--redbg: rgba(232,96,122,.1)
--gold: #f59e0b        /* XP / streak color */
--green: #4ade80       /* Success / mastered */
--blue: #60a5fa        /* New words */
--text: #f4f4f5
--muted: rgba(244,244,245,.45)
--muted2: rgba(244,244,245,.3)
--font: 'Inter', system-ui  /* UI font */
--mono: 'JetBrains Mono', monospace
--cn: 'Noto Sans SC', serif  /* Chinese characters */
/* Border radius scale */
--r8: 8px  --r12: 12px  --r16: 16px  --r20: 20px  --r24: 24px
```

### Animation Philosophy
- Page transitions: `cubic-bezier(.2,.8,.2,1)` — Apple-level spring
- Button tap: `scale(.96)` active, `scale(1.02)` hover
- Card flip: `perspective(600px) rotateY` — 3D
- Success: `springIn` — scale 0.4 → 1.08 → 0.97 → 1
- Wrong: `wrongShake` — horizontal shake
- Streak fire: `streakFire` — organic oscillation
- Combo: `comboBurst` — scale + fade

---

## 6. XP SYSTEM

```javascript
XP_RATES = {
  add_word: 2,
  master_word: 10,
  learn_word: 3,
  master_phrase: 15,
  learn_phrase: 5,
  lesson_correct: 20,
  lesson_complete: 50,
  fill_correct: 10,
  tf_correct: 5,
  daily_goal: 25,
}
```

**Level formula:** `Math.floor(Math.sqrt(totalXP / 10))`  
**Levels:** 1–100, each with a unique title (e.g., "Seedling", "Dragon Eye", "Hanzo")  
**XP popup:** Floats up from action point, fades out in 1.2s  

---

## 7. SM-2 SPACED REPETITION

Full SuperMemo 2 implementation:
```javascript
function sm2Update(word, quality) {
  // quality: 0-5 (4=correct, 1=wrong)
  ef = ef + (0.1 - (5-quality) * (0.08 + (5-quality)*0.02))
  if(ef < 1.3) ef = 1.3
  // Interval: 1 → 6 → ef*previous
  word.sm2_ef = ef
  word.sm2_rep = rep
  word.sm2_iv = iv
  word.srs_next = today + iv days
}
```

---

## 8. I18N SYSTEM

```javascript
var LANG = 'en' // 'ru' | 'kz'

// All strings in I18N object:
I18N = {
  en: { key: 'English string' },
  ru: { key: 'Russian string' },
  kz: { key: 'Kazakh string' },
}

function t(key) {
  return (I18N[LANG] && I18N[LANG][key]) || I18N.en[key] || key
}
```

**Coverage:** All UI strings, game feedback, empty states, onboarding, streak system, nav labels, day abbreviations (MON/ПНД/ДСН etc.)

---

## 9. GAMES (10 total)

| ID | Name | Mode | Description |
|---|---|---|---|
| `flashcard` | Flashcard | Words | Flip card, self-grade Got it/Forgot |
| `mc` | Multiple Choice | Words | Pick correct meaning from 4 options |
| `match` | Match | Words | Pair Chinese↔English |
| `pinyin` | Pinyin Hunt | Words | Type pinyin for shown character |
| `charhunt` | Char Hunt | Words | Pick correct character for meaning |
| `sentence` | Recall | Words | Type Chinese from memory |
| `pflash` | Phrase Flash | Phrases | Flip phrase card |
| `pfill` | Fill Blank | Phrases | Pick missing word in phrase |
| `ptf` | True/False | Phrases | Judge if translation is correct |
| `realtalk` | Real Talk | Phrases | Dialog scenarios, pick correct response |

**Real Talk topics:** Everyday, Travel, Business, Restaurant, Shopping, Healthcare, Social, Education

---

## 10. WHAT'S FAKE (needs real backend)

| Feature | Current (Fake) | Needs |
|---|---|---|
| User auth | SHA-256 in localStorage | Supabase Auth |
| Data sync | None (localStorage only) | Supabase DB |
| Friends | Hardcoded mock users | Real user table |
| Leaderboard | Mock XP values | Real scores |
| Nudge system | localStorage key (useless cross-device) | Push notifications |
| Streak protection | No server verification | Server-side date tracking |
| Analytics | None | PostHog / custom |

---

## 11. BACKEND ROADMAP

### Phase 1 — Foundation (Week 1-2)
```
Supabase setup:
├── auth.users (Supabase Auth)
├── profiles (id, name, lang, daily_goal, created_at)
├── user_words (user_id, word_id, status, sm2_ef, sm2_rep, sm2_iv, srs_next)
├── user_phrases (user_id, phrase_cn, status)
├── study_sessions (user_id, date, correct_count)
└── xp_log (user_id, amount, source, created_at)
```

### Phase 2 — Social (Week 3)
```
├── friendships (user_id, friend_id, status)
├── nudges (from_id, to_id, sent_at, seen)
└── leaderboard (view: weekly XP by user)
```

### Phase 3 — Notifications (Week 4)
```
├── Push notifications (streak danger at 20:00 local time)
├── Weekly progress email
└── Milestone celebrations
```

### Phase 4 — Analytics (Week 5)
```
├── word_events (user_id, word, action, quality, created_at)
├── session_events (user_id, game, duration, score)
└── funnel tracking (onboarding → first word → first game → streak)
```

---

## 12. RECOMMENDED TECH STACK

```
Frontend:     Next.js 14 (App Router)
Styling:      Tailwind CSS + CSS Modules (keep existing design tokens)
Animations:   Framer Motion (replace CSS keyframes)
Backend:      Supabase (Postgres + Auth + Realtime + Storage)
Auth:         Supabase Auth (email/password → add Google/Apple later)
Hosting:      Vercel (frontend) + Supabase (backend)
Analytics:    PostHog (self-hosted or cloud)
Notifications: Supabase Edge Functions + FCM
State:        Zustand (lightweight, replaces global S object)
Types:        TypeScript throughout
```

---

## 13. MIGRATION PLAN (HTML → Next.js)

### Step 1: Scaffold
```bash
npx create-next-app@latest hanzo-app --typescript --tailwind --app
cd hanzo-app
npx supabase init
```

### Step 2: Extract data files
```
/lib/data/
├── word-bank.ts       ← WORD_BANK array (491 words)
├── sentence-bank.ts   ← SENTENCE_BANK (76 phrases)
├── rt-scenarios.ts    ← RT_SCENARIOS (39 scenes)
├── lessons.ts         ← LESSONS structure
├── meaning-ru.ts      ← MEANING_RU translation map
├── meaning-kz.ts      ← MEANING_KZ translation map
└── i18n.ts            ← I18N strings (EN/RU/KZ)
```

### Step 3: Component architecture
```
/components/
├── layout/
│   ├── BottomNav.tsx
│   ├── TopBar.tsx
│   └── PageWrapper.tsx
├── home/
│   ├── QuickSession.tsx
│   ├── StreakCard.tsx
│   ├── ProgressBars.tsx
│   ├── WeekRings.tsx
│   └── NewUserGuide.tsx
├── games/
│   ├── Flashcard.tsx
│   ├── MultipleChoice.tsx
│   ├── RealTalk.tsx
│   └── [all other games]
├── bank/
│   ├── WordCard.tsx
│   ├── PhraseBrowse.tsx
│   └── MyPhrases.tsx
├── lessons/
│   ├── SkillTree.tsx
│   └── LessonQuiz.tsx
├── auth/
│   ├── LoginForm.tsx
│   └── SignupForm.tsx
└── ui/
    ├── XPPopup.tsx
    ├── ComboFloat.tsx
    ├── Confetti.tsx
    └── Toast.tsx
```

### Step 4: Supabase schema
```sql
-- Run in Supabase SQL editor

create table profiles (
  id uuid references auth.users primary key,
  name text not null,
  lang text default 'en' check (lang in ('en','ru','kz')),
  daily_goal int default 10,
  onboarding jsonb,
  theme text default 'dark',
  created_at timestamptz default now()
);

create table user_words (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles not null,
  char text not null,
  pinyin text,
  meaning text,
  hsk text,
  cat text,
  status text default 'new' check (status in ('new','learning','mastered')),
  sm2_ef float default 2.5,
  sm2_rep int default 0,
  sm2_iv int default 1,
  srs_next date default current_date,
  created_at timestamptz default now(),
  unique(user_id, char)
);

create table study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles not null,
  date date not null default current_date,
  correct_count int default 0,
  unique(user_id, date)
);

create table user_phrases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles not null,
  phrase_cn text not null,
  phrase_py text,
  phrase_en text,
  status text default 'new',
  created_at timestamptz default now(),
  unique(user_id, phrase_cn)
);

create table friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles not null,
  friend_id uuid references profiles not null,
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

-- Row Level Security
alter table profiles enable row level security;
alter table user_words enable row level security;
alter table study_sessions enable row level security;
alter table user_phrases enable row level security;

create policy "Users own their data" on profiles for all using (auth.uid() = id);
create policy "Users own their words" on user_words for all using (auth.uid() = user_id);
create policy "Users own their sessions" on study_sessions for all using (auth.uid() = user_id);
create policy "Users own their phrases" on user_phrases for all using (auth.uid() = user_id);
```

### Step 5: State management
```typescript
// /store/userStore.ts (Zustand)
interface UserStore {
  user: User | null
  profile: Profile | null
  words: UserWord[]
  phrases: UserPhrase[]
  studyActivity: Record<string, number>
  xpTotal: number
  lang: 'en' | 'ru' | 'kz'
  
  // Actions
  addWord: (word: WordBankEntry) => Promise<void>
  updateWordSRS: (wordId: string, correct: boolean) => Promise<void>
  incrementStudy: () => Promise<void>
  setLang: (lang: string) => void
}
```

---

## 14. CONTINUATION INSTRUCTIONS FOR CLAUDE CODE

When you open this in VS Code with Claude Code, paste this prompt to resume:

```
I'm Alikhan (Ali), 18, Kazakhstani student at Wuhan University.
I'm migrating the Hanzo Chinese learning app from a single HTML file 
to Next.js + Supabase. 

The full session history and architecture is in HANZO_HANDOFF.md.

Key facts:
- App is a Chinese learning app for Kazakh/Russian speakers
- Design: Apple-level polish, Duolingo retention mechanics
- Current: 11,731-line HTML file with 491 words, 10 games, SM-2 SRS
- Goal: Full-stack Next.js app with Supabase backend
- Languages: EN/RU/KZ (Kazakh and Russian are primary users)
- Think billion-dollar startup at every decision

Start by [SPECIFIC TASK]
```

---

## 15. PRIORITY QUEUE (what to build first)

### 🔴 Critical (Week 1)
1. [ ] Next.js project scaffold
2. [ ] Supabase project + schema (SQL in section 13)
3. [ ] Auth system (login/signup with Supabase Auth)
4. [ ] Migrate word bank data to TypeScript
5. [ ] Home page component with real data from Supabase
6. [ ] Word add/remove synced to DB

### 🟡 High (Week 2)
7. [ ] All 10 games migrated as React components
8. [ ] SM-2 SRS logic in TypeScript
9. [ ] Real streak tracking server-side
10. [ ] Study session recording

### 🟢 Medium (Week 3-4)
11. [ ] Real friends system
12. [ ] Real leaderboard
13. [ ] Streak push notifications
14. [ ] PWA (offline support)
15. [ ] Analytics (PostHog)

### 🔵 Future
16. [ ] Premium tier (more HSK levels, advanced games)
17. [ ] AI conversation partner (OpenAI API)
18. [ ] Voice pronunciation scoring
19. [ ] iOS/Android app (Expo/React Native)
20. [ ] Kazakhstan/Russia App Store launch

---

## 16. IMPORTANT DESIGN RULES

Always follow these — they apply to every component:

1. **Mobile-first** — 390px base, phone is the primary device
2. **Dark mode default** — light mode is secondary
3. **Spring animations** — `cubic-bezier(.34,1.56,.64,1)` for interactive elements
4. **Loss aversion** — streak danger banner when not studied today
5. **Dopamine hits** — XP popup on every positive action
6. **3-language** — every string must exist in EN, RU, and KZ
7. **SM-2 for SRS** — never use simple fixed intervals
8. **Empty states** — always have an action button, never just text
9. **No confirm()** — use two-tap delete pattern instead
10. **Chinese font** — Noto Sans SC for all Chinese characters

---

## 17. FILES TO CREATE IN VS CODE

```
hanzo-app/
├── hanzo_legacy/
│   └── hanzo.html          ← Keep original as reference
├── HANZO_HANDOFF.md        ← This file
├── .env.local              ← Supabase keys (never commit)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── supabase/
│   └── schema.sql          ← SQL from section 13
├── lib/
│   ├── supabase.ts
│   ├── data/
│   │   ├── word-bank.ts
│   │   ├── sentence-bank.ts
│   │   ├── rt-scenarios.ts
│   │   ├── lessons.ts
│   │   └── i18n.ts
│   └── hooks/
│       ├── useUser.ts
│       ├── useWords.ts
│       └── useStreak.ts
├── store/
│   ├── userStore.ts
│   └── gameStore.ts
├── components/
│   ├── layout/
│   ├── home/
│   ├── games/
│   ├── bank/
│   ├── lessons/
│   ├── auth/
│   └── ui/
└── app/
    ├── layout.tsx
    ├── page.tsx             ← Home (redirect to /home or /auth)
    ├── (auth)/
    │   ├── login/page.tsx
    │   └── signup/page.tsx
    └── (app)/
        ├── home/page.tsx
        ├── lessons/page.tsx
        ├── games/page.tsx
        ├── words/page.tsx
        ├── bank/page.tsx
        └── friends/page.tsx
```

---

## 18. ENV VARIABLES NEEDED

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]  # server only
NEXT_PUBLIC_POSTHOG_KEY=[analytics-key]       # optional
```

---

## 19. QUICK START COMMANDS

```bash
# 1. Clone / create project
npx create-next-app@latest hanzo-app --typescript --tailwind --app --src-dir
cd hanzo-app

# 2. Install dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install zustand framer-motion
npm install @radix-ui/react-dialog @radix-ui/react-progress
npm install posthog-js
npm install -D @types/node

# 3. Set up Supabase locally (optional but recommended)
npx supabase init
npx supabase start

# 4. Copy hanzo.html to hanzo_legacy/ for reference
# 5. Create .env.local with Supabase keys
# 6. Run schema.sql in Supabase SQL editor
# 7. Start dev server
npm run dev
```

---

## 20. SESSION CONTEXT FOR CLAUDE CODE

**What Claude in this session knows that's critical:**

- The WORD_BANK (491 words) has this exact structure: `{char, pinyin, meaning, example, hsk, cat}`
- The SM-2 implementation uses `sm2_ef`, `sm2_rep`, `sm2_iv` fields
- The i18n system uses `t('key')` function with `I18N[LANG][key]` lookup
- Phrase matching uses `cn` field as unique key (NOT `id` — id was broken)
- `study_activity` tracks correct answers per day (not words added)
- The `goPage(pageName, btnEl)` function handles all navigation
- `awardXP(amount, source)` triggers the XP popup animation
- `onCorrectAnswer()` / `onWrongAnswer()` handle combo streak tracking
- Auth uses `hanzo_users` localStorage key → migrate to Supabase Auth
- Per-user data is in `hanzo_data_[email]` → migrate to Supabase DB

**The #1 rule:** Every feature must work in EN, RU, and KZ. Kazakh and Russian speakers are the primary audience.

---

*Generated: May 8, 2026 | Hanzo v24 | 11,731 lines → Full-stack migration*
