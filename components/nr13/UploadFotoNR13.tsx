'use client'

import { useState, useRef, useCallback } from 'react'
import imageCompression from 'browser-image-compression'

interface UploadFotoNR13Props {
  label?: string
  onUpload: (file: File) => Promise<{ path: string | null; error: string | null }>
  onPhotoUploaded: (path: string, dims?: { width: number; height: number }) => void
  onPhotoDelete?: () => void
  fotoPreviewUrl?: string | null
  /** true quando fotoPath existe no banco mas a URL assinada ainda não carregou */
  temFotoSalva?: boolean
  disabled?: boolean
  corBorda?: 'blue' | 'green' | 'purple' | 'slate' | 'amber'
  /** Modo compacto: ícone 40×40px usado em tabelas (ex: dispositivos) */
  compacto?: boolean
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.src = URL.createObjectURL(file)
  })
}

const COR: Record<string, { ring: string; bg: string; text: string; badge: string }> = {
  blue:   { ring: 'border-blue-300 hover:border-blue-500',   bg: 'hover:bg-blue-50',   text: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700' },
  green:  { ring: 'border-green-300 hover:border-green-500', bg: 'hover:bg-green-50',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700' },
  purple: { ring: 'border-purple-300 hover:border-purple-500', bg: 'hover:bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  slate:  { ring: 'border-slate-300 hover:border-slate-500', bg: 'hover:bg-slate-50',  text: 'text-slate-600',  badge: 'bg-slate-100 text-slate-700' },
  amber:  { ring: 'border-amber-300 hover:border-amber-500', bg: 'hover:bg-amber-50',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700' },
}

export default function UploadFotoNR13({
  label = 'Tirar / Selecionar foto',
  onUpload,
  onPhotoUploaded,
  onPhotoDelete,
  fotoPreviewUrl = null,
  temFotoSalva = false,
  disabled = false,
  corBorda = 'blue',
  compacto = false,
}: UploadFotoNR13Props) {
  const [enviando, setEnviando] = useState(false)
  const [progresso, setProgresso] = useState('')
  const [erro, setErro] = useState('')
  const [arrastando, setArrastando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const cor = COR[corBorda] ?? COR.blue
  const uid = label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()

  const processar = useCallback(async (arquivo: File) => {
    setErro('')
    setEnviando(true)
    setProgresso('Comprimindo...')

    try {
      const comprimido = await imageCompression(arquivo, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        onProgress: (p) => { if (p < 100) setProgresso(`${p}%`) },
      })

      setProgresso('Enviando...')
      const { path, error } = await onUpload(comprimido)

      if (error || !path) {
        setErro('Erro ao enviar: ' + (error ?? 'resposta vazia'))
        return
      }

      const dims = await getImageDimensions(comprimido)
      onPhotoUploaded(path, dims)
      setProgresso('✓')
    } catch {
      setErro('Erro inesperado. Tente novamente.')
    } finally {
      setEnviando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [onUpload, onPhotoUploaded])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) processar(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setArrastando(false)
    if (disabled || enviando) return
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith('image/')) processar(f)
  }

  // ── MODO COMPACTO (ícone em tabela) ──────────────────────────────────────
  if (compacto) {
    // Foto carregada com preview
    if (fotoPreviewUrl && !enviando) {
      return (
        <div className="relative w-10 h-10 rounded overflow-hidden border-2 border-green-400 flex-shrink-0 group">
          <img src={fotoPreviewUrl} alt={label} className="w-full h-full object-cover" />
          {onPhotoDelete && (
            <button
              type="button"
              onClick={onPhotoDelete}
              className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Remover foto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          )}
        </div>
      )
    }

    // Foto salva no banco mas URL ainda carregando — exibe badge verde de confirmação
    if (temFotoSalva && !enviando) {
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="relative w-10 h-10 flex-shrink-0 group">
            <div className="w-10 h-10 rounded border-2 border-green-400 bg-green-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-600">
                <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            </div>
            {onPhotoDelete && (
              <button
                type="button"
                onClick={onPhotoDelete}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow"
                title="Remover foto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center gap-1">
        <input ref={inputRef} type="file" accept="image/*" capture="environment"
          onChange={handleChange} disabled={enviando || disabled} className="hidden" id={`up-${uid}`} />
        <label htmlFor={`up-${uid}`}
          className={`w-10 h-10 flex items-center justify-center border-2 border-dashed rounded cursor-pointer transition-colors text-lg
            ${enviando || disabled ? 'border-gray-300 text-gray-400 cursor-not-allowed' : `${cor.ring} ${cor.bg} ${cor.text}`}`}>
          {enviando
            ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : <span>📷</span>
          }
        </label>
        {erro && <p className="text-red-500 text-xs text-center" title={erro}>!</p>}
      </div>
    )
  }

  // ── MODO COMPLETO: foto salva no banco mas URL ainda carregando ──────────
  if (temFotoSalva && !fotoPreviewUrl && !enviando) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
        <div className="w-16 h-12 rounded-lg border border-green-300 bg-green-100 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-green-500">
            <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-800 truncate">✓ Foto registrada</p>
          <p className="text-xs text-green-600 truncate">{label}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <label htmlFor={`up-${uid}`} className="p-1.5 rounded-lg hover:bg-green-200 text-green-600 hover:text-green-800 transition-colors cursor-pointer" title="Substituir foto">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
          </label>
          <input ref={inputRef} type="file" accept="image/*" capture="environment"
            onChange={handleChange} disabled={enviando || disabled} className="hidden" id={`up-${uid}`} />
          {onPhotoDelete && (
            <button type="button" onClick={onPhotoDelete}
              className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
              title="Remover foto">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── MODO COMPLETO: preview ────────────────────────────────────────────────
  if (fotoPreviewUrl && !enviando) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
        <div className="w-16 h-12 rounded-lg overflow-hidden border border-green-300 flex-shrink-0 shadow-sm">
          <img src={fotoPreviewUrl} alt={label} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-800 truncate">✓ Foto registrada</p>
          <p className="text-xs text-green-600 truncate">{label}</p>
        </div>
        {onPhotoDelete && (
          <button type="button" onClick={onPhotoDelete}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
            title="Remover foto">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  // ── MODO COMPLETO: área de upload (drag-and-drop + clique + câmera) ──────
  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment"
        onChange={handleChange} disabled={enviando || disabled} className="hidden" id={`up-${uid}`} />

      <label
        htmlFor={`up-${uid}`}
        onDragOver={(e) => { e.preventDefault(); if (!disabled && !enviando) setArrastando(true) }}
        onDragLeave={() => setArrastando(false)}
        onDrop={handleDrop}
        className={[
          'flex flex-col items-center justify-center gap-2 w-full',
          'min-h-[88px] px-4 py-5',
          'border-2 border-dashed rounded-xl',
          'transition-all duration-150 select-none',
          enviando || disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : arrastando
              ? `border-current ${cor.text} bg-opacity-10 scale-[1.01] cursor-copy`
              : `${cor.ring} ${cor.bg} ${cor.text} cursor-pointer active:scale-[0.99]`,
        ].join(' ')}
      >
        {enviando ? (
          <>
            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">{progresso}</span>
          </>
        ) : arrastando ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 opacity-80">
              <path d="M12 1.5a.75.75 0 01.75.75V7.5h-1.5V2.25A.75.75 0 0112 1.5zM11.25 7.5v5.69l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06l-1.72 1.72V7.5h-1.5z" />
              <path d="M3 15.75a.75.75 0 01.75-.75H6a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zm16.5 0a.75.75 0 01-.75.75H17.25a.75.75 0 010-1.5H18.75a.75.75 0 01.75.75z" />
            </svg>
            <span className="text-xs font-semibold">Solte para enviar</span>
          </>
        ) : (
          <>
            {/* Ícone câmera — grande e tocável em mobile */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cor.badge}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
                <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3h-15a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0zm12-1.5a.75.75 0 100 1.5.75.75 0 000-1.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold leading-tight">{label}</p>
              <p className="text-xs opacity-60 mt-0.5 hidden sm:block">Clique ou arraste • câmera disponível</p>
            </div>
          </>
        )}
      </label>

      {erro && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {erro}
        </p>
      )}
    </div>
  )
}
