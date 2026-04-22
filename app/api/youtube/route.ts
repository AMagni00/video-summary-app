import { NextRequest, NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  let videoId = ''

  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL mancante' }, { status: 400 })

    const youtubeId = extractVideoId(url)
    if (!youtubeId) {
      return NextResponse.json({ error: 'URL YouTube non valido' }, { status: 400 })
    }

    const { data: video, error: dbError } = await supabase
      .from('videos')
      .insert({
        original_filename: `youtube:${youtubeId}`,
        file_url: `https://www.youtube.com/watch?v=${youtubeId}`,
        status: 'processing',
      })
      .select()
      .single()

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    videoId = video.id

    const segments = await YoutubeTranscript.fetchTranscript(youtubeId)
    const rawTranscript = segments.map((s) => s.text).join(' ')

    if (!rawTranscript) {
      await supabase.from('videos').update({ status: 'error' }).eq('id', videoId)
      return NextResponse.json(
        { error: 'Nessun sottotitolo disponibile per questo video' },
        { status: 400 }
      )
    }

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: `Hai la seguente trascrizione grezza di un video YouTube (con possibili ripetizioni e artefatti dei sottotitoli automatici).

Fai queste due cose:
1. Pulisci e formatta la trascrizione in testo leggibile, correggendo ripetizioni e artefatti
2. Genera un titolo conciso e un riassunto breve (2-4 frasi)

Rispondi SOLO con JSON valido in questo formato:
{
  "transcription": "...",
  "title": "...",
  "summary": "..."
}

Trascrizione grezza:
${rawTranscript}`,
        },
      ],
    })

    const responseText = (msg.content[0] as Anthropic.TextBlock).text
    let transcription = rawTranscript
    let title = 'Video YouTube'
    let summary = ''

    try {
      const parsed = JSON.parse(responseText.replace(/```json\n?|\n?```/g, '').trim())
      transcription = parsed.transcription || rawTranscript
      title = parsed.title || title
      summary = parsed.summary || ''
    } catch {
      summary = responseText
    }

    await supabase
      .from('videos')
      .update({ transcription, title, summary, status: 'done' })
      .eq('id', videoId)

    return NextResponse.json({ videoId: video.id, title, summary })
  } catch (error) {
    console.error('YouTube error:', error)
    if (videoId) {
      await supabase.from('videos').update({ status: 'error' }).eq('id', videoId)
    }
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
