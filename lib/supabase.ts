import { createClient } from '@supabase/supabase-js'

export type VideoStatus = 'uploading' | 'uploaded' | 'processing' | 'done' | 'error'

export interface Video {
  id: string
  title: string | null
  original_filename: string
  file_url: string | null
  transcription: string | null
  summary: string | null
  status: VideoStatus
  created_at: string
}

export interface Message {
  id: string
  video_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
