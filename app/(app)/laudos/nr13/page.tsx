'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type InspecaoResumo = {
  id: string
  tag: string
  tipo_vaso: string | null
  tipo_inspecao: string | null
  status_final: string | null
  data_inspecao: string | null
  created_at: string
  cliente_razao_social?: string
  cliente_cnpj?: string
}

const STATUS_COLORS: Record<string, string> = {
  'Aprovado': 'bg-emerald-100 text-emerald-800',
  'Aprovado com Restrições': 'bg-amber-100 text-amber-800',
  'Reprovado — Downgrade Necessário': 'bg-red-100 text-red-800',
  'Interditado': 'bg-red-200 text-red-900',
}

export default function ListaInspecoesNR13Page() {
  const [inspecoes, setInspecoes] = useState<InspecaoResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const router = useRouter()

  const carregarInspecoes = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inspecoes_nr13')
      .select(`
        id,
        tag,
        tipo_vaso,
        tipo_inspecao,
        status_final,
        data_inspecao,
        created_at,
        vasos_pressao (
          cliente_id,
          clientes (
            razao_social,
            cnpj
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (data) {
      // Transformar dados para incluir informações do cliente
      const inspecoesComCliente = data.map((inspecao: any) => ({
        id: inspecao.id,
        tag: inspecao.tag,
        tipo_vaso: inspecao.tipo_vaso,
        tipo_inspecao: inspecao.tipo_inspecao,
        status_final: inspecao.status_final,
        data_inspecao: inspecao.data_inspecao,
        created_at: inspecao.created_at,
        cliente_razao_social: inspecao.vasos_pressao?.clientes?.razao_social,
        cliente_cnpj: inspecao.vasos_pressao?.clientes?.cnpj
      }))
      setInspecoes(inspecoesComCliente)
    }
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregarInspecoes()
  }, [carregarInspecoes])

  async function excluirInspecao(id: string) {
    if (!confirm('Deseja realmente excluir esta inspeção e todos os seus dados?')) return
    const supabase = createClient()
    // Cascade delete pelas FK ON DELETE CASCADE
    const { error } = await supabase.from('inspecoes_nr13').delete().eq('id', id)
    if (error) {
      alert('Erro ao excluir: ' + error.message)
    } else {
      setInspecoes(prev => prev.filter(i => i.id !== id))
    }
  }

  if (carregando) {
    return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Carregando inspeções...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shadow">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
            </svg>
          </div>
          Inspeções NR-13
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Lista de inspeções de vasos de pressão.
        </p>
      </div>

      <div className="flex items-center justify-between mb-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-700">
          {inspecoes.length} inspeção(ões)
        </p>
        <Link href="/laudos/nr13/novo-cliente" className="btn-primary">
          + Nova Inspeção NR-13
        </Link>
      </div>

      {inspecoes.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma inspeção NR-13 ainda</h3>
          <p className="text-gray-500 text-sm">
            Use o botão acima para criar sua primeira inspeção de vaso de pressão.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inspecoes.map((insp) => (
            <div key={insp.id} className="card p-4 flex items-center justify-between hover:border-emerald-300 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {insp.status_final && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[insp.status_final] ?? 'bg-gray-100 text-gray-700'}`}>
                      {insp.status_final}
                    </span>
                  )}
                  <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{insp.tag}</span>
                </div>
                <p className="font-medium text-gray-900">
                  {insp.tipo_vaso ?? 'Vaso'} {insp.tipo_inspecao ? `— Inspeção ${insp.tipo_inspecao.toLowerCase()}` : ''}
                </p>
                {insp.cliente_razao_social && (
                  <p className="text-sm text-gray-600">
                    {insp.cliente_razao_social} {insp.cliente_cnpj ? `(${insp.cliente_cnpj})` : ''}
                  </p>
                )}
                {insp.data_inspecao && (
                  <p className="text-sm text-gray-500">
                    {new Date(insp.data_inspecao + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => router.push(`/laudos/nr13/${insp.id}`)}
                  className="text-gray-500 hover:text-gray-700 p-2"
                  title="Ver inspeção"
                >
                  →
                </button>
                <button
                  onClick={() => excluirInspecao(insp.id)}
                  className="text-gray-400 hover:text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
                  title="Excluir inspeção"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}