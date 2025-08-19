import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          google_id: string | null
          last_login: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          google_id?: string | null
          last_login?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          google_id?: string | null
          last_login?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          youtube_url: string
          context: string
          client_info: string | null
          status: string
          current_step: number | null
          created_by: string
          processing_started_at: string | null
          processing_completed_at: string | null
          total_processing_time: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          youtube_url: string
          context: string
          client_info?: string | null
          status?: string
          current_step?: number | null
          created_by: string
          processing_started_at?: string | null
          processing_completed_at?: string | null
          total_processing_time?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          youtube_url?: string
          context?: string
          client_info?: string | null
          status?: string
          current_step?: number | null
          created_by?: string
          processing_started_at?: string | null
          processing_completed_at?: string | null
          total_processing_time?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      prompts: {
        Row: {
          id: string
          name: string
          system_prompt_text: string
          user_prompt_text: string
          model_provider: string | null
          model_name: string | null
          parameters: any | null
          created_at: string | null
          updated_at: string | null
          step_number: number
          version: number
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          system_prompt_text: string
          user_prompt_text: string
          model_provider?: string | null
          model_name?: string | null
          parameters?: any | null
          created_at?: string | null
          updated_at?: string | null
          step_number: number
          version?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          system_prompt_text?: string
          user_prompt_text?: string
          model_provider?: string | null
          model_name?: string | null
          parameters?: any | null
          created_at?: string | null
          updated_at?: string | null
          step_number?: number
          version?: number
          is_active?: boolean
        }
      }
      project_steps: {
        Row: {
          id: string
          project_id: string | null
          step_number: number
          step_name: string
          status: string
          step_data: any
          raw_response: string | null
          error_message: string | null
          processing_time: number | null
          started_at: string | null
          completed_at: string | null
          updated_by: string | null
          created_at: string | null
          updated_at: string | null
          processing_cost: number | null
          model_used: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          step_number: number
          step_name: string
          status?: string
          step_data?: any
          raw_response?: string | null
          error_message?: string | null
          processing_time?: number | null
          started_at?: string | null
          completed_at?: string | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          processing_cost?: number | null
          model_used?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          step_number?: number
          step_name?: string
          status?: string
          step_data?: any
          raw_response?: string | null
          error_message?: string | null
          processing_time?: number | null
          started_at?: string | null
          completed_at?: string | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          processing_cost?: number | null
          model_used?: string | null
        }
      }
    }
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
