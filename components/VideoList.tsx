'use client'

import Link from 'next/link'
import { Video } from '@/lib/supabase'

const statusLabel: Record<string, { label: string; color: string }> = {
  uploading: { label: 'Caricamento', color: 'bg-yellow-100 text-yellow-700' },
  uploaded: { label: 'Caricato', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Elaborazione', color: 'bg-orange-100 text-orange-700' },
  done: { label: 'Completato', color: 'bg-green-100 text-green-700' },
  error: { label: 'Errore', color: 'bg-red-100 text-red-700' },
}

export default function VideoList({ videos }: { videos: Video[] }) {
  if (videos.length === 0) {
    return (
      <p className="text-center text-gray-400 py-8">
        Nessun video ancora. Caricane uno!
      </p>
    )
  }

  return (
    <div className="grid gap-3">
      {videos.map((video) => {
        const st = statusLabel[video.status] ?? statusLabel.uploaded
        return (
          <Link
            key={video.id}
            href={`/video/${video.id}`}
            className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <div className="text-3xl">🎬</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">
                {video.title || video.original_filename}
              </p>
              {video.summary && (
                <p className="text-sm text-gray-500 truncate mt-0.5">{video.summary}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(video.created_at).toLocaleString('it-IT')}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${st.color}`}>
              {st.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
