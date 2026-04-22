import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ChatPanel from '@/components/ChatPanel'
import ExportButtons from '@/components/ExportButtons'

export const revalidate = 0

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: video } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single()

  if (!video) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← Torna alla home
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {video.title || video.original_filename}
            </h1>
            <p className="text-sm text-gray-400">
              {new Date(video.created_at).toLocaleString('it-IT')}
            </p>
          </div>
          <span className={`
            text-xs px-3 py-1 rounded-full font-medium shrink-0
            ${video.status === 'done' ? 'bg-green-100 text-green-700' :
              video.status === 'processing' ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-600'}
          `}>
            {video.status === 'done' ? 'Completato' :
             video.status === 'processing' ? 'In elaborazione...' :
             video.status}
          </span>
        </div>

        {video.file_url && (
          video.original_filename?.startsWith('youtube:') ? (
            <div className="mt-4 aspect-video w-full rounded-xl overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${video.original_filename.replace('youtube:', '')}`}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          ) : (
            <video
              src={video.file_url}
              controls
              className="mt-4 w-full max-h-64 rounded-xl bg-black"
            />
          )
        )}
      </div>

      {video.status === 'processing' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center text-orange-700 text-sm">
          Il video è in elaborazione. Aggiorna la pagina tra qualche momento.
        </div>
      )}

      {video.status === 'done' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: summary + transcription */}
          <div className="space-y-4">
            {/* Summary */}
            {video.summary && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Riassunto
                  </h2>
                  <ExportButtons
                    title={video.title || video.original_filename}
                    summary={video.summary}
                    transcription={video.transcription || ''}
                  />
                </div>
                <p className="text-gray-700 leading-relaxed">{video.summary}</p>
              </div>
            )}

            {/* Transcription */}
            {video.transcription && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Trascrizione completa
                </h2>
                <div className="max-h-96 overflow-y-auto">
                  <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                    {video.transcription}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right column: chat */}
          <div className="bg-white rounded-2xl border border-gray-200 flex flex-col" style={{ height: '600px' }}>
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Chat con il video
              </h2>
            </div>
            <div className="flex-1 min-h-0">
              <ChatPanel videoId={video.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
