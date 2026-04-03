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
}

export default function UploadFoto({ ncId, laudoId, ordem, onUploadConcluido }: UploadFotoProps) {
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
    <div>
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
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors text-sm font-medium
          ${enviando
            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
            : 'border-blue-300 text-blue-600 hover:border-blue-500 hover:bg-blue-50'
          }`}
      >
        <span>{enviando ? '📤' : '📷'}</span>
        <span>{enviando ? progresso : 'Tirar / Selecionar foto'}</span>
      </label>

      {erro && (
        <p className="text-red-600 text-xs mt-1">{erro}</p>
      )}
    </div>
  )
}
