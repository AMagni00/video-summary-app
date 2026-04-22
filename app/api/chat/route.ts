import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { videoId, message, history } = await req.json()

    if (!videoId || !message) {
      return NextResponse.json({ error: 'Missing videoId or message' }, { status: 400 })
    }

    const { data: video } = await supabase
      .from('videos')
      .select('transcription, title')
      .eq('id', videoId)
      .single()

    if (!video?.transcription) {
      return NextResponse.json({ error: 'Video not yet transcribed' }, { status: 400 })
    }

    const systemPrompt = `Sei un assistente esperto che risponde a domande sul contenuto di un video.
Il video si intitola: "${video.title || 'Video'}"

Trascrizione del video:
---
${video.transcription}
---

Rispondi in modo preciso e pertinente basandoti SOLO sul contenuto della trascrizione fornita.
Se la risposta non è nella trascrizione, dillo chiaramente.`

    const messages: Anthropic.MessageParam[] = [
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()

        const finalMessage = await stream.finalMessage()
        const assistantContent = finalMessage.content
          .filter((b) => b.type === 'text')
          .map((b) => (b as Anthropic.TextBlock).text)
          .join('')

        await supabase.from('messages').insert([
          { video_id: videoId, role: 'user', content: message },
          { video_id: videoId, role: 'assistant', content: assistantContent },
        ])
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
