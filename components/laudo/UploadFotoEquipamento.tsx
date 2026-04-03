'use client'

import { useState, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import { uploadFotoEquipamento } from '@/lib/storage'
import { atualizarEquipamento } from '@/lib/actions/equipamentos'

interface UploadFotoEquipamentoProps {
  equipamentoId: string
  laudoId: string
  onUploadConcluido: () => void
}

export default function UploadFotoEquipamento({ equipamentoId, laudoId, onUploadConcluido }: UploadFotoEquipamentoProps) {
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
      const comprimido = await imageCompression(arquivo, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        onProgress: (p) => {
          if (p < 100) setProgresso(`Comprimindo: ${p}%`)
        },
      })

      setProgresso('Enviando foto...')

      const { path, error: erroUpload } = await uploadFotoEquipamento(comprimido, equipamentoId)
      if (erroUpload) {
        setErro('Erro ao enviar foto: ' + erroUpload)
        setEnviando(false)
        return
      }

      setProgresso('Salvando...')

      const { error: erroAtualizar } = await atualizarEquipamento(equipamentoId, laudoId, {
        foto_geral_url: path,
      } as any)

      if (erroAtualizar) {
        setErro('Erro ao salvar: ' + erroAtualizar)
        setEnviando(false)
        return
      }

      onUploadConcluido()
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
    <div className="flex flex-col items-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleArquivo}
        className="hidden"
        id={`foto-eq-${equipamentoId}`}
      />

      <label
        htmlFor={`foto-eq-${equipamentoId}`}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors text-sm font-medium
          ${enviando
            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
            : 'border-green-300 text-green-600 hover:border-green-500 hover:bg-green-50'
          }`}
      >
        <span>{enviando ? progresso : 'Adicionar foto geral do equipamento'}</span>
      </label>

      {erro && (
        <p className="text-red-600 text-xs mt-1">{erro}</p>
      )}
    </div>
  )
}
