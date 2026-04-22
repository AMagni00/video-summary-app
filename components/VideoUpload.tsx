'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { extractAudioFromVideo } from '@/lib/audio-utils'

export default function VideoUpload() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Carica un file video (MP4, MOV, AVI, ecc.)')
      return
    }

    setError(null)
    setStatus('uploading')

    try {
      setProgress('Caricamento video...')
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadFormData })
      if (!uploadRes.ok) throw new Error((await uploadRes.json()).error || 'Errore upload')
      const { video } = await uploadRes.json()

      setProgress('Estrazione audio dal video...')
      setStatus('extracting')
      const audioBlob = await extractAudioFromVideo(file)

      setProgress('Trascrizione in corso (potrebbe richiedere qualche minuto)...')
      setStatus('processing')

      const processFormData = new FormData()
      processFormData.append('audio', audioBlob, 'audio.wav')
      processFormData.append('videoId', video.id)

      const processRes = await fetch('/api/process', { method: 'POST', body: processFormData })
      if (!processRes.ok) throw new Error((await processRes.json()).error || 'Errore elaborazione')

      setStatus('done')
      setProgress('Completato!')
      setTimeout(() => router.push(`/video/${video.id}`), 800)
    } catch (err) {
      setError(String(err))
      setStatus(null)
      setProgress('')
    }
  }, [router])

  const processYouTube = useCallback(async () => {
    const url = youtubeUrl.trim()
    if (!url) return

    setError(null)
    setStatus('processing')
    setProgress('Recupero trascrizione da YouTube...')

    try {
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!res.ok) throw new Error((await res.json()).error || 'Errore YouTube')
      const { videoId } = await res.json()

      setStatus('done')
      setProgress('Completato!')
      setTimeout(() => router.push(`/video/${videoId}`), 800)
    } catch (err) {
      setError(String(err))
      setStatus(null)
      setProgress('')
    }
  }, [youtubeUrl, router])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const isLoading = !!status && status !== 'done'

  return (
    <div className="w-full space-y-4">
      {/* Drag & drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200
          ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          ${isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50'
          }
        `}
      >
        <input
          type="file"
          accept="video/*"
          onChange={onFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        {!status ? (
          <>
            <div className="text-5xl mb-4">🎬</div>
            <p className="text-xl font-semibold text-gray-700 mb-2">
              Trascina il tuo video qui
            </p>
            <p className="text-sm text-gray-500">oppure clicca per selezionare un file</p>
            <p className="text-xs text-gray-400 mt-2">MP4, MOV, AVI, MKV e altri formati video</p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {status === 'done' ? (
              <div className="text-4xl">✅</div>
            ) : (
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            )}
            <p className="text-base font-medium text-gray-700">{progress}</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-400">oppure</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* YouTube URL input */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-xl focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
          <span className="text-xl">▶️</span>
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && processYouTube()}
            placeholder="Incolla un link YouTube..."
            disabled={isLoading}
            className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400 disabled:opacity-50"
          />
        </div>
        <button
          onClick={processYouTube}
          disabled={isLoading || !youtubeUrl.trim()}
          className="px-5 py-3 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Analizza
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}
