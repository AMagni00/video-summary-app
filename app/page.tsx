import { getSupabase } from '@/lib/supabase'
import VideoUpload from '@/components/VideoUpload'
import VideoList from '@/components/VideoList'

export const revalidate = 0

export default async function Home() {
  let videos = null
  try {
    const { data } = await getSupabase()
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
    videos = data
  } catch {
    // se Supabase non è raggiungibile, mostra comunque la pagina
  }

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Video Summarizer
        </h1>
        <p className="text-gray-500">
          Carica un video per ottenere trascrizione, riassunto e chat con il suo contenuto
        </p>
      </div>

      <VideoUpload />

      {videos && videos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            I tuoi video
          </h2>
          <VideoList videos={videos} />
        </div>
      )}
    </div>
  )
}
