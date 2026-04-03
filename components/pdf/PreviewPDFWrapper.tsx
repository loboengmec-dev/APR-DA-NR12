'use client'

import React from 'react'
import dynamic from 'next/dynamic'

// Precisamos importar o PDFViewer dinamicamente sem SSR (Server-Side Rendering)
// pois ele acessa objetos globais como `window` e `navigator`.
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFViewer),
  { ssr: false, loading: () => <div className="p-10 text-center text-gray-500">Iniciando renderizador de PDF...</div> }
)

import LaudoPDF from '@/components/pdf/LaudoPDF'

interface PreviewProps {
  laudo: any
  perfil: any
  fotosUrl: Record<string, string>
}

export default function PreviewPDFWrapper({ laudo, perfil, fotosUrl }: PreviewProps) {
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="bg-gray-800 text-white p-2 text-sm text-center flex justify-between px-4">
        <span>Preview em Tempo Real Ativado</span>
        <span>As alterações nos componentes React-PDF serão atualizadas instantaneamente.</span>
      </div>
      <div style={{ flex: 1, width: '100%' }}>
        <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
          <LaudoPDF laudo={laudo} perfil={perfil} fotosUrl={fotosUrl} />
        </PDFViewer>
      </div>
    </div>
  )
}
