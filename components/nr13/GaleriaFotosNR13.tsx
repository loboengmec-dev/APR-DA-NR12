'use client'

import { useState } from 'react'

interface GaleriaFotosNR13Props {
  fotos: {
    id?: string
    url: string
    legenda?: string
    removivel?: boolean
  }[]
  onRemove?: (index: number) => void
}

export default function GaleriaFotosNR13({ fotos, onRemove }: GaleriaFotosNR13Props) {
  const [preview, setPreview] = useState<string | null>(null)

  if (fotos.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
        {fotos.map((foto, index) => (
          <div key={foto.id ?? index} className="relative group">
            <button
              type="button"
              onClick={() => setPreview(foto.url)}
              className="w-full aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-blue-400 transition-colors"
            >
              <img src={foto.url} alt={foto.legenda ?? ''} className="w-full h-full object-cover" />
            </button>
            {foto.legenda && (
              <p className="text-xs text-slate-500 mt-1 truncate">{foto.legenda}</p>
            )}
            {foto.removivel && onRemove && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Remover foto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-3xl max-h-full">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPreview(null) }}
              className="absolute -top-8 right-0 text-white hover:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
            <img src={preview} alt="Preview" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
          </div>
        </div>
      )}
    </>
  )
}
