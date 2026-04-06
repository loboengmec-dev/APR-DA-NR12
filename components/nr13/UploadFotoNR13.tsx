'use client'

import { useState, useRef } from 'react'
import imageCompression from 'browser-image-compression'

interface UploadFotoNR13Props {
  label?: string
  onUpload: (file: File) => Promise<{ path: string | null; error: string | null }>
  onPhotoUploaded: (path: string) => void
  disabled?: boolean
  corBorda?: string
  compacto?: boolean
}

export default function UploadFotoNR13({
  label = 'Tirar / Selecionar foto',
  onUpload,
  onPhotoUploaded,
  disabled = false,
  corBorda = 'blue',
  compacto = false,
}: UploadFotoNR13Props) {
  const [enviando, setEnviando] = useState(false)
  const [progresso, setProgresso] = useState('')
  const [erro, setErro] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const corMap: Record<string, { border: string; bg: string; text: string; hover?: string }> = {
    blue:   { border: 'border-blue-300 hover:border-blue-500',  bg: 'hover:bg-blue-50',   text: 'text-blue-600' },
    green:  { border: 'border-green-300 hover:border-green-500', bg: 'hover:bg-green-50', text: 'text-green-600' },
    purple: { border: 'border-purple-300 hover:border-purple-500', bg: 'hover:bg-purple-50', text: 'text-purple-600' },
    slate:  { border: 'border-slate-300 hover:border-slate-500', bg: 'hover:bg-slate-50', text: 'text-slate-600' },
  }
  const cores = corMap[corBorda] ?? corMap.blue

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    setErro('')
    setEnviando(true)
    setProgresso('Comprimindo imagem...')

    try {
      const comprimido = await imageCompression(arquivo, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        onProgress: (p) => { if (p < 100) setProgresso(`Comprimindo: ${p}%`) },
      })

      setProgresso('Enviando foto...')

      const { path, error } = await onUpload(comprimido)
      if (error || !path) {
        setErro('Erro ao enviar foto: ' + error)
        setEnviando(false)
        return
      }

      onPhotoUploaded(path)
      setProgresso('✓')
    } catch {
      setErro('Erro inesperado ao processar foto.')
    } finally {
      setEnviando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const clsBtn = compacto
    ? 'p-1.5 border-2 border-dashed rounded cursor-pointer transition-colors text-xs'
    : 'flex items-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-sm font-medium'

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleArquivo}
        disabled={enviando || disabled}
        className="hidden"
        id={`nr13-upload-${label.replace(/\s/g, '-')}`}
      />

      <label
        htmlFor={`nr13-upload-${label.replace(/\s/g, '-')}`}
        className={`${clsBtn} ${
          enviando || disabled
            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
            : `${cores.border} ${cores.bg} ${cores.text}`
        }`}
      >
        {enviando ? progresso : compacto ? '📷' : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-2.064a2.5 2.5 0 011.699.657l.957.862c.441.397.688.964.688 1.555V12a1 1 0 01-1 1h-1a1 1 0 01-1-1V7.414a1 1 0 00-.293-.707l-1.414-1.414A1 1 0 0011.586 5H8.414a1 1 0 00-.707.293L6.293 6.707A1 1 0 006 7.414V12a1 1 0 01-1 1H4a1 1 0 01-1-1V5z" />
            </svg>
            <span>{label}</span>
          </>
        )}
      </label>

      {erro && <p className="text-red-600 text-xs mt-1">{erro}</p>}
    </div>
  )
}
