export type Lang = 'en' | 'ru' | 'kz'
export type Theme = 'dark' | 'light'
export type WordStatus = 'new' | 'learning' | 'mastered'
export type HSKLevel = 'HSK1' | 'HSK2' | 'HSK3' | 'HSK4' | 'HSK5' | 'HSK6'
export type FriendshipStatus = 'pending' | 'accepted'

export type OnboardingGoal = 'business' | 'travel' | 'exam' | 'fluency' | 'culture'
export type OnboardingLevel = 'zero' | 'basic' | 'intermediate' | 'advanced'

export interface Onboarding {
  goals: OnboardingGoal[]
  level: OnboardingLevel
  daily: 5 | 10 | 20 | 30
}

// ─── Supabase table row types ──────────────────────────────────────────────

export interface Profile {
  id: string
  name: string
  username: string | null
  invite_code: string | null
  lang: Lang
  daily_goal: number
  onboarding: Onboarding | null
  theme: Theme
  mute: boolean
  xp_total: number
  weekly_xp: number
  weekly_xp_week: string
  streak: number
  words_count: number
  gems: number
  created_at: string
}

export interface UserWord {
  id: string
  user_id: string
  char: string
  pinyin: string
  meaning: string
  hsk: HSKLevel
  cat: string
  status: WordStatus
  sm2_ef: number
  sm2_rep: number
  sm2_iv: number
  srs_next: string
  created_at: string
}

export interface UserPhrase {
  id: string
  user_id: string
  phrase_cn: string
  phrase_py: string
  phrase_en: string
  status: WordStatus
  created_at: string
}

export interface StudySession {
  id: string
  user_id: string
  date: string
  correct_count: number
}

export interface XPLog {
  id: string
  user_id: string
  amount: number
  source: XPSource
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  username: string | null
  display_name: string
  avatar_color: string
  type: string
  content: Record<string, unknown>
  likes: string[]
  created_at: string
}

export interface Friendship {
  id: string
  user_id: string
  friend_user_id: string
  status: FriendshipStatus
  created_at: string
}

export interface Nudge {
  id: string
  from_id: string
  to_id: string
  message: string | null
  seen: boolean
  sent_at: string
}

// ─── XP system ────────────────────────────────────────────────────────────

export type XPSource =
  | 'add_word'
  | 'master_word'
  | 'learn_word'
  | 'master_phrase'
  | 'learn_phrase'
  | 'lesson_correct'
  | 'lesson_complete'
  | 'fill_correct'
  | 'tf_correct'
  | 'daily_goal'

export const XP_RATES: Record<XPSource, number> = {
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

// ─── Supabase DB type map (for createClient generic) ──────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      user_words: {
        Row: UserWord
        Insert: Omit<UserWord, 'id' | 'created_at'>
        Update: Partial<Omit<UserWord, 'id' | 'user_id' | 'created_at'>>
      }
      user_phrases: {
        Row: UserPhrase
        Insert: Omit<UserPhrase, 'id' | 'created_at'>
        Update: Partial<Omit<UserPhrase, 'id' | 'user_id' | 'created_at'>>
      }
      study_sessions: {
        Row: StudySession
        Insert: Omit<StudySession, 'id'>
        Update: Partial<Omit<StudySession, 'id' | 'user_id'>>
      }
      xp_log: {
        Row: XPLog
        Insert: Omit<XPLog, 'id' | 'created_at'>
        Update: never
      }
      posts: {
        Row: Post
        Insert: Omit<Post, 'id' | 'created_at'>
        Update: Partial<Pick<Post, 'content' | 'likes'>>
      }
      friendships: {
        Row: Friendship
        Insert: Omit<Friendship, 'id' | 'created_at'>
        Update: Partial<Pick<Friendship, 'status'>>
      }
      nudges: {
        Row: Nudge
        Insert: Omit<Nudge, 'id' | 'sent_at'>
        Update: Partial<Pick<Nudge, 'seen'>>
      }
    }
    Views: {
      leaderboard_weekly: {
        Row: {
          user_id: string
          name: string
          username: string | null
          total_xp: number
          rank: number
        }
      }
    }
    Functions: {
      get_user_total_xp: {
        Args: { uid: string }
        Returns: number
      }
    }
  }
}
