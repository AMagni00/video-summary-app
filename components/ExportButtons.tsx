'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'

interface Props {
  title: string
  summary: string
  transcription: string
}

export default function ExportButtons({ title, summary, transcription }: Props) {
  const [copied, setCopied] = useState(false)

  const fullText = `${title}\n\n── RIASSUNTO ──\n${summary}\n\n── TRASCRIZIONE COMPLETA ──\n${transcription}`
  const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase()

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadTxt = () => {
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 20
    const maxW = pageW - margin * 2
    let y = 20

    const addText = (text: string, fontSize: number, isBold: boolean, color: [number, number, number]) => {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', isBold ? 'bold' : 'normal')
      doc.setTextColor(...color)
      const lines = doc.splitTextToSize(text, maxW) as string[]
      lines.forEach((line: string) => {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.text(line, margin, y)
        y += fontSize * 0.45
      })
    }

    const addSpacer = (mm: number) => { y += mm }
    const addDivider = () => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.setDrawColor(220, 220, 220)
      doc.line(margin, y, pageW - margin, y)
      y += 6
    }

    // Title
    addText(title, 20, true, [17, 24, 39])
    addSpacer(3)

    // Date
    addText(
      `Esportato il ${new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      9, false, [156, 163, 175]
    )
    addSpacer(8)
    addDivider()

    // Summary section
    addText('RIASSUNTO', 9, true, [107, 114, 128])
    addSpacer(4)
    addText(summary, 11, false, [31, 41, 55])
    addSpacer(10)
    addDivider()

    // Transcription section
    addText('TRASCRIZIONE COMPLETA', 9, true, [107, 114, 128])
    addSpacer(4)
    addText(transcription, 10, false, [55, 65, 81])

    doc.save(`${filename}.pdf`)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={copyToClipboard}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
      >
        {copied ? '✓ Copiato' : '📋 Copia'}
      </button>

      <button
        onClick={downloadTxt}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
      >
        📄 TXT
      </button>

      <button
        onClick={downloadPdf}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
      >
        📑 PDF
      </button>
    </div>
  )
}
