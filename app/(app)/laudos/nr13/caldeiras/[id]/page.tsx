'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import FormInspecaoCaldeira from '@/components/nr13/FormInspecaoCaldeira'
import { gerarUrlAssinadaNR13 } from '@/lib/nr13/storage'

export default function EditarInspecaoCaldeiraPage() {
  const params = useParams()
  const id = params.id as string

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [initialData, setInitialData] = useState<any>(null)
  
  const carregarInspecao = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setErro('Não autenticado'); setCarregando(false); return }

    const { data: inspecao, error: inspErr } = await supabase
      .from('inspecoes_caldeiras')
      .select('*, caldeiras(cliente_id, clientes(id, razao_social, cidade, estado))')
      .eq('id', id)
      .single()

    if (inspErr || !inspecao) {
      setErro('Inspeção de caldeira não encontrada.')
      setCarregando(false)
      return
    }

    setInitialData(inspecao)
    setCarregando(false)
  }, [id])

  useEffect(() => {
    carregarInspecao()
  }, [carregarInspecao])

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          Carregando caldeira...
        </div>
      </div>
    )
  }

  if (erro || !initialData) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <p className="text-red-600 mb-4">{erro ?? 'Erro desconhecido'}</p>
        <Link href="/laudos/nr13/caldeiras" className="text-sm text-gray-500 hover:text-gray-700">
          ← Voltar para lista
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/laudos/nr13/caldeiras" className="text-sm text-gray-500 hover:text-gray-700">
          ← Inspeções de Caldeiras
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center shadow">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
            </svg>
          </div>
          Editar Inspeção — {initialData.tag}
        </h1>
      </div>

      <FormInspecaoCaldeira
        initialData={initialData}
        inspecaoId={id}
      />
    </div>
  )
}
