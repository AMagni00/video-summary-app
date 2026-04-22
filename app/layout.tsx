import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Video Summarizer",
  description: "Carica un video, ottieni trascrizione, riassunto e chatta con il suo contenuto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 h-[57px] flex items-center">
          <a href="/" className="flex items-center gap-2 w-fit">
            <span className="text-2xl">🎬</span>
            <span className="text-lg font-bold text-gray-900">Video Summarizer</span>
          </a>
        </header>
        <div className="flex">
          <Sidebar
            supabaseUrl={process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}
            supabaseKey={process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''}
          />
          <main className="flex-1 min-w-0 px-6 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
