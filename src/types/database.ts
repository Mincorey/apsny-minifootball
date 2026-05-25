// Авто-генерируется из схемы Supabase
// Для обновления: npx supabase gen types typescript --project-id pohtjijcnaezqqrsjdbs > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      seasons: {
        Row: {
          id: string
          name: string
          year: number
          status: 'active' | 'archived' | 'finished'
          started_at: string | null
          finished_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          year: number
          status?: 'active' | 'archived' | 'finished'
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          year?: number
          status?: 'active' | 'archived' | 'finished'
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
        }
      }
      leagues: {
        Row: {
          id: string
          season_id: string
          name: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          season_id: string
          name: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          season_id?: string
          name?: string
          sort_order?: number
          created_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          league_id: string
          name: string
          color: string
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          league_id: string
          name: string
          color?: string
          logo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          name?: string
          color?: string
          logo_url?: string | null
          created_at?: string
        }
      }
      players: {
        Row: {
          id: string
          team_id: string
          name: string
          number: number | null
          photo_url: string | null
          permanent_ban: boolean
          ban_matches: number
          role: string | null
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          name: string
          number?: number | null
          photo_url?: string | null
          permanent_ban?: boolean
          ban_matches?: number
          role?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          name?: string
          number?: number | null
          photo_url?: string | null
          permanent_ban?: boolean
          ban_matches?: number
          role?: string | null
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          league_id: string
          team_a_id: string
          team_b_id: string
          score_a: number | null
          score_b: number | null
          tour: number
          status: 'scheduled' | 'played' | 'cancelled'
          scheduled_at: string | null
          played_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          league_id: string
          team_a_id: string
          team_b_id: string
          score_a?: number | null
          score_b?: number | null
          tour: number
          status?: 'scheduled' | 'played' | 'cancelled'
          scheduled_at?: string | null
          played_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          team_a_id?: string
          team_b_id?: string
          score_a?: number | null
          score_b?: number | null
          tour?: number
          status?: 'scheduled' | 'played' | 'cancelled'
          scheduled_at?: string | null
          played_at?: string | null
          created_at?: string
        }
      }
      match_player_stats: {
        Row: {
          id: string
          match_id: string
          player_id: string
          goals: number
          own_goals: number
          yellow_cards: number
          red_cards: number
        }
        Insert: {
          id?: string
          match_id: string
          player_id: string
          goals?: number
          own_goals?: number
          yellow_cards?: number
          red_cards?: number
        }
        Update: {
          id?: string
          match_id?: string
          player_id?: string
          goals?: number
          own_goals?: number
          yellow_cards?: number
          red_cards?: number
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          role: 'viewer' | 'admin' | 'superadmin'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'viewer' | 'admin' | 'superadmin'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'viewer' | 'admin' | 'superadmin'
          created_at?: string
        }
      }
    }
    Views: {
      standings: {
        Row: {
          team_id: string
          team_name: string
          color: string
          logo_url: string | null
          league_id: string
          played: number
          wins: number
          draws: number
          losses: number
          goals_for: number
          goals_against: number
          points: number
          goal_diff: number
        }
      }
      top_scorers: {
        Row: {
          player_id: string
          player_name: string
          photo_url: string | null
          permanent_ban: boolean
          team_name: string
          league_id: string
          total_goals: number
          total_own_goals: number
          total_yellow: number
          total_red: number
        }
      }
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      season_status: 'active' | 'archived' | 'finished' | 'finished'
      match_status: 'scheduled' | 'played' | 'cancelled'
      user_role: 'viewer' | 'admin' | 'superadmin'
    }
  }
}

// Удобные типы для использования в компонентах
export type Season = Database['public']['Tables']['seasons']['Row']
export type League = Database['public']['Tables']['leagues']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type Player = Database['public']['Tables']['players']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type MatchPlayerStats = Database['public']['Tables']['match_player_stats']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

export type Standing = Database['public']['Views']['standings']['Row']
export type TopScorer = Database['public']['Views']['top_scorers']['Row']

// Расширенные типы с вложенными данными (для запросов с join)
export type TeamWithPlayers = Team & {
  players: Player[]
}
export type MatchWithTeams = Match & {
  team_a: Team
  team_b: Team
  stats: MatchPlayerStats[]
}
