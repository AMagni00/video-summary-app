-- Esegui questo SQL nell'editor SQL di Supabase (https://supabase.com/dashboard)

-- Tabella video
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  original_filename TEXT NOT NULL,
  file_url TEXT,
  transcription TEXT,
  summary TEXT,
  status TEXT DEFAULT 'uploading',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella messaggi chat
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS messages_video_id_idx ON messages(video_id);
CREATE INDEX IF NOT EXISTS videos_created_at_idx ON videos(created_at DESC);

-- Policy RLS (Row Level Security) - accesso pubblico per ora
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on videos" ON videos;
DROP POLICY IF EXISTS "Allow all on messages" ON messages;

CREATE POLICY "Allow all on videos" ON videos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on messages" ON messages FOR ALL USING (true) WITH CHECK (true);

-- Bucket storage per i video (va creato manualmente dalla dashboard Supabase)
-- Storage > New bucket > nome: "videos" > Public: true
