'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Video } from '@/lib/supabase'

const statusDot: Record<string, string> = {
  done: 'bg-green-500',
  processing: 'bg-orange-400 animate-pulse',
  uploading: 'bg-yellow-400 animate-pulse',
  uploaded: 'bg-blue-400',
  error: 'bg-red-500',
}

export default function Sidebar({ supabaseUrl, supabaseKey }: { supabaseUrl: string; supabaseKey: string }) {
  const pathname = usePathname()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = createClient(supabaseUrl, supabaseKey)

    async function load() {
      const { data } = await sb
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
      setVideos(data || [])
      setLoading(false)
    }

    load()

    const channel = sb
      .channel('videos-sidebar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, load)
      .subscribe()

    return () => { sb.removeChannel(channel) }
  }, [])

  return (
    <aside className="w-72 shrink-0 h-[calc(100vh-57px)] sticky top-[57px] border-r border-gray-200 bg-white flex flex-col overflow-hidden">
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Video trascritti</span>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
          {videos.filter(v => v.status === 'done').length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="space-y-2 p-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && videos.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-10 text-gray-400">
            <span className="text-3xl mb-2">🎬</span>
            <p className="text-sm">Nessun video ancora</p>
          </div>
        )}

        {!loading && videos.length > 0 && (
          <div className="p-2 space-y-1">
            {videos.map((video) => {
              const isActive = pathname === `/video/${video.id}`
              const isYoutube = video.original_filename?.startsWith('youtube:')
              return (
                <Link
                  key={video.id}
                  href={`/video/${video.id}`}
                  className={`
                    flex flex-col gap-1 px-3 py-3 rounded-xl transition-all
                    ${isActive
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'hover:bg-gray-50 border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5 shrink-0">{isYoutube ? '▶️' : '🎬'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate leading-snug ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>
                        {video.title || video.original_filename}
                      </p>
                      {video.summary && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {video.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[video.status] ?? 'bg-gray-400'}`} />
                        <span className="text-xs text-gray-400">
                          {new Date(video.created_at).toLocaleDateString('it-IT', {
                            day: '2-digit', month: 'short', year: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 p-3">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <span>+</span> Nuovo video
        </Link>
      </div>
    </aside>
  )
}
