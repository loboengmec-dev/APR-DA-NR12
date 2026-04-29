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
  'Aprovado': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'Aprovado com Restrições': 'bg-amber-100 text-amber-700 border border-amber-200',
  'Reprovado — Downgrade Necessário': 'bg-red-100 text-red-700 border border-red-200',
  'Interditado': 'bg-red-200 text-red-800 border border-red-300',
}

const STATUS_DOT: Record<string, string> = {
  'Aprovado': 'bg-emerald-500',
  'Aprovado com Restrições': 'bg-amber-400',
  'Reprovado — Downgrade Necessário': 'bg-red-500',
  'Interditado': 'bg-red-700',
}

export default function ListaInspecoesNR13Page() {
  const [inspecoes, setInspecoes] = useState<InspecaoResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const router = useRouter()

  const carregarInspecoes = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
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
      const inspecoesComCliente = data.map((inspecao: any) => ({
        id: inspecao.id,
        tag: inspecao.tag,
        tipo_vaso: inspecao.tipo_vaso,
        tipo_inspecao: inspecao.tipo_inspecao,
        status_final: inspecao.status_final,
        data_inspecao: inspecao.data_inspecao,
        created_at: inspecao.created_at,
        cliente_razao_social: inspecao.vasos_pressao?.clientes?.razao_social,
        cliente_cnpj: inspecao.vasos_pressao?.clientes?.cnpj,
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
    setExcluindo(id)
    const supabase = createClient()
    const { error } = await supabase.from('inspecoes_nr13').delete().eq('id', id)
    if (error) {
      alert('Erro ao excluir: ' + error.message)
    } else {
      setInspecoes(prev => prev.filter(i => i.id !== id))
    }
    setExcluindo(null)
  }

  if (carregando) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-20 skeleton rounded" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl skeleton" />
            <div className="space-y-1.5">
              <div className="h-5 w-56 skeleton rounded" />
              <div className="h-3.5 w-40 skeleton rounded" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
          <div className="h-4 w-32 skeleton rounded" />
          <div className="h-9 w-40 skeleton rounded-lg" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4 flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-24 skeleton rounded-full" />
                  <div className="h-5 w-16 skeleton rounded" />
                </div>
                <div className="h-4 w-52 skeleton rounded" />
                <div className="h-3.5 w-36 skeleton rounded" />
              </div>
              <div className="w-8 h-8 skeleton rounded-md" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── HEADER ── */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-emerald-600 transition-colors mb-3"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Painel
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">NR-13 — Vasos de Pressão e Caldeiras</h1>
            <p className="text-sm text-gray-500">Inspeção ASME Sec. VIII e Avaliação de PMTA</p>
          </div>
        </div>
      </div>

      {/* ── BARRA DE AÇÕES ── */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-800 tabular-nums">{inspecoes.length}</span>
          {' '}inspeção{inspecoes.length !== 1 ? 'ões' : ''} encontrada{inspecoes.length !== 1 ? 's' : ''}
        </p>
        <Link href="/laudos/nr13/vasos/novo-cliente" className="btn-primary text-sm" style={{ backgroundColor: '#059669' }}>
          + Nova Inspeção NR-13
        </Link>
      </div>

      {/* ── LISTA / EMPTY STATE ── */}
      {inspecoes.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Nenhuma inspeção NR-13 ainda</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">
            Registre sua primeira inspeção de vaso de pressão com cálculo de PMTA via ASME.
          </p>
          <Link href="/laudos/nr13/vasos/novo-cliente" className="btn-primary text-sm" style={{ backgroundColor: '#059669' }}>
            Criar primeira inspeção
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {inspecoes.map((insp) => (
            <div
              key={insp.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-150 flex items-center gap-4 p-4 group cursor-pointer"
              onClick={() => router.push(`/laudos/nr13/${insp.id}`)}
            >
              {/* INFO */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {insp.status_final && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[insp.status_final] ?? 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[insp.status_final] ?? 'bg-gray-400'}`} />
                      {insp.status_final}
                    </span>
                  )}
                  <span className="font-mono text-xs text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                    {insp.tag}
                  </span>
                  {insp.tipo_inspecao && (
                    <span className="text-xs text-gray-400">
                      Inspeção {insp.tipo_inspecao.toLowerCase()}
                    </span>
                  )}
                </div>

                <p className="font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                  {insp.tipo_vaso ?? 'Vaso de Pressão'}
                  {insp.cliente_razao_social && (
                    <span className="font-normal text-gray-500"> — {insp.cliente_razao_social}</span>
                  )}
                </p>

                <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-400">
                  {insp.cliente_cnpj && (
                    <span className="text-xs">CNPJ {insp.cliente_cnpj}</span>
                  )}
                  {insp.data_inspecao && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      {new Date(insp.data_inspecao + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>

              {/* AÇÕES */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); excluirInspecao(insp.id) }}
                  disabled={excluindo === insp.id}
                  className={`p-2 rounded-lg transition-colors ${
                    excluindo === insp.id
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title="Excluir inspeção"
                >
                  {excluindo === insp.id ? (
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <span className="p-2 text-gray-300 group-hover:text-emerald-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
