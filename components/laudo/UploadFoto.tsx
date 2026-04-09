'use client'

import { useState, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import { uploadFotoNC } from '@/lib/storage'
import { registrarFotoNC } from '@/lib/actions/fotos'
import type { FotoNC } from '@/types'

interface UploadFotoProps {
  ncId: string
  laudoId: string
  ordem: number
  onUploadConcluido: (foto: FotoNC) => void
  /** Número de fotos já anexadas — exibe badge de confirmação */
  fotoCount?: number
}

export default function UploadFoto({ ncId, laudoId, ordem, onUploadConcluido, fotoCount = 0 }: UploadFotoProps) {
  const [enviando, setEnviando] = useState(false)
  const [progresso, setProgresso] = useState('')
  const [erro, setErro] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    setErro('')
    setEnviando(true)
    setProgresso('Comprimindo imagem...')

    try {
      // Comprimir a imagem antes de enviar
      const comprimido = await imageCompression(arquivo, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        onProgress: (p) => {
          if (p < 100) setProgresso(`Comprimindo: ${p}%`)
        },
      })

      setProgresso('Enviando foto...')

      const { path, error: erroUpload } = await uploadFotoNC(comprimido, ncId, ordem)
      if (erroUpload) {
        setErro('Erro ao enviar foto: ' + erroUpload)
        setEnviando(false)
        return
      }

      setProgresso('Registrando...')

      const { data: foto, error: erroRegistro } = await registrarFotoNC(
        ncId,
        laudoId,
        path,
        '',
        comprimido.size,
        ordem
      )

      if (erroRegistro || !foto) {
        setErro('Erro ao registrar foto: ' + erroRegistro)
        setEnviando(false)
        return
      }

      onUploadConcluido(foto)
      setProgresso('')
    } catch (err) {
      setErro('Erro inesperado ao processar foto.')
      console.error(err)
    } finally {
      setEnviando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Badge de confirmação quando já há fotos */}
      {fotoCount > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 border border-green-200 text-green-700 text-xs font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          {fotoCount} foto{fotoCount > 1 ? 's' : ''} anexada{fotoCount > 1 ? 's' : ''}
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleArquivo}
        className="hidden"
        id={`foto-upload-${ncId}-${ordem}`}
      />

      <label
        htmlFor={`foto-upload-${ncId}-${ordem}`}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-dashed cursor-pointer transition-colors text-sm font-medium
          ${enviando
            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
            : fotoCount > 0
              ? 'border-blue-200 text-blue-500 hover:border-blue-400 hover:bg-blue-50'
              : 'border-blue-300 text-blue-600 hover:border-blue-500 hover:bg-blue-50'
          }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
        <span>{enviando ? progresso : fotoCount > 0 ? 'Adicionar outra foto' : 'Tirar / Selecionar foto'}</span>
      </label>

      {erro && (
        <p className="text-red-600 text-xs mt-1 w-full">{erro}</p>
      )}
    </div>
  )
}
