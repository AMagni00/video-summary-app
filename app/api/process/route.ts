import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  )

  let videoId = ''

  try {
    const formData = await req.formData()
    const audioBlob = formData.get('audio') as File
    videoId = formData.get('videoId') as string

    if (!audioBlob || !videoId) {
      return NextResponse.json({ error: 'Missing audio or videoId' }, { status: 400 })
    }

    await supabase.from('videos').update({ status: 'processing' }).eq('id', videoId)

    const audioBuffer = await audioBlob.arrayBuffer()

    // Upload audio file to Anthropic Files API
    const audioFile = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' })
    const uploadedFile = await (anthropic as unknown as {
      beta: { files: { upload: (o: object) => Promise<{ id: string }> } }
    }).beta.files.upload({ file: audioFile })

    // Transcribe with Claude using the uploaded file reference
    const transcriptionMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Trascrivi fedelmente tutto il contenuto audio. Restituisci SOLO la trascrizione del parlato, senza commenti aggiuntivi.',
            },
            {
              type: 'document',
              source: {
                type: 'file',
                file_id: uploadedFile.id,
              },
            } as unknown as Anthropic.TextBlockParam,
          ],
        },
      ],
    })

    const transcriptionMsg2 = transcriptionMsg as unknown as { content: Anthropic.ContentBlock[] }
    const transcription = (transcriptionMsg2.content[0] as Anthropic.TextBlock).text

    // Cleanup Anthropic file
    await (anthropic as unknown as {
      beta: { files: { delete: (id: string) => Promise<void> } }
    }).beta.files.delete(uploadedFile.id).catch(() => {})

    // Generate title + summary
    const summaryMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Basandoti sulla seguente trascrizione, genera un titolo conciso e un riassunto breve (2-4 frasi).

Rispondi SOLO con JSON valido in questo formato:
{"title": "...", "summary": "..."}

Trascrizione:
${transcription}`,
        },
      ],
    })

    const summaryText = (summaryMsg.content[0] as Anthropic.TextBlock).text
    let title = 'Video senza titolo'
    let summary = ''

    try {
      const parsed = JSON.parse(summaryText.replace(/```json\n?|\n?```/g, '').trim())
      title = parsed.title || title
      summary = parsed.summary || ''
    } catch {
      summary = summaryText
    }

    await supabase
      .from('videos')
      .update({ transcription, title, summary, status: 'done' })
      .eq('id', videoId)

    return NextResponse.json({ transcription, title, summary })
  } catch (error) {
    console.error('Process error:', error)
    if (videoId) {
      await supabase.from('videos').update({ status: 'error' }).eq('id', videoId)
    }
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
