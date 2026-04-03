'use client'

import { useState, useEffect, useCallback } from 'react'
import { listarLaudos, excluirLaudo } from '@/lib/actions/laudos'
import { atualizarCliente } from '@/lib/actions/clientes'
import Link from 'next/link'
import type { Laudo, FormCliente } from '@/types'
import FormEditarCliente from '@/components/laudo/FormEditarCliente'

const STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  em_revisao: 'Em revisão',
  finalizado: 'Finalizado',
}

const STATUS_COLOR: Record<string, string> = {
  rascunho: 'bg-yellow-100 text-yellow-800',
  em_revisao: 'bg-blue-100 text-blue-800',
  finalizado: 'bg-green-100 text-green-800',
}

function formatarData(data: string | null) {
  if (!data) return '—'
  return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
}

type LaudoComCliente = Laudo & {
  clientes?: {
    id: string
    razao_social: string
    cnpj: string | null
    endereco: string | null
    cidade: string | null
    estado: string | null
  }
}

export default function DashboardPage() {
  const [laudos, setLaudos] = useState<LaudoComCliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [editandoClienteId, setEditandoClienteId] = useState<string | null>(null) // laudo.id
  const [excluindo, setExcluindo] = useState<string | null>(null) // laudo.id sendo excluído

  const carregarLaudos = useCallback(async () => {
    const { data, error } = await listarLaudos()
    if (error) {
      setErro(error)
    } else {
      setLaudos((data ?? []) as LaudoComCliente[])
    }
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregarLaudos()
  }, [carregarLaudos])

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 text-sm">Carregando laudos...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laudos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {laudos.length} laudo{laudos.length !== 1 ? 's' : ''} encontrado{laudos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/laudos/novo" className="btn-primary">
          + Novo Laudo
        </Link>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          Erro ao carregar laudos: {erro}
        </div>
      )}

      {!laudos.length ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum laudo ainda</h3>
          <p className="text-gray-500 text-sm mb-6">
            Crie seu primeiro laudo de Apreciação de Risco NR-12.
          </p>
          <Link href="/laudos/novo" className="btn-primary inline-block">
            Criar primeiro laudo
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {laudos.map((laudo) => {
            const cliente = laudo.clientes
            const isEditando = editandoClienteId === laudo.id

            return (
              <div key={laudo.id}>
                <div className="card p-4 flex items-center justify-between hover:border-blue-300 transition-colors">
                  <Link
                    href={`/laudos/${laudo.id}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[laudo.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABEL[laudo.status] ?? laudo.status}
                      </span>
                      {laudo.numero_documento && (
                        <span className="text-xs text-gray-500">{laudo.numero_documento}</span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 truncate">
                      {cliente?.razao_social ?? 'Cliente não informado'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {cliente?.cidade && cliente?.estado
                        ? `${cliente.cidade} — ${cliente.estado}`
                        : 'Local não informado'
                      }
                      {laudo.data_inspecao && ` · ${formatarData(laudo.data_inspecao)}`}
                    </p>
                  </Link>

                  <div className="flex items-center gap-1 ml-4">
                    {/* Botão editar cliente */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setEditandoClienteId(isEditando ? null : laudo.id)
                      }}
                      className={`p-2 rounded-md transition-colors ${
                        isEditando
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title="Editar dados do cliente"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                      </svg>
                    </button>

                    {/* Botão excluir laudo */}
                    <button
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const clienteNome = cliente?.razao_social ?? 'este laudo'
                        if (!confirm(`Deseja realmente excluir o laudo de "${clienteNome}"? Esta ação não pode ser desfeita.`)) return
                        setExcluindo(laudo.id)
                        const { error: erroExcluir } = await excluirLaudo(laudo.id)
                        if (erroExcluir) {
                          setErro('Erro ao excluir: ' + erroExcluir)
                        } else {
                          setLaudos(prev => prev.filter(l => l.id !== laudo.id))
                        }
                        setExcluindo(null)
                      }}
                      disabled={excluindo === laudo.id}
                      className={`p-2 rounded-md transition-colors ${
                        excluindo === laudo.id
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title="Excluir laudo"
                    >
                      {excluindo === laudo.id ? (
                        <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    {/* Seta de navegação */}
                    <Link href={`/laudos/${laudo.id}`} className="text-gray-400 hover:text-gray-600 p-2">
                      →
                    </Link>
                  </div>
                </div>

                {/* Formulário de edição/criação do cliente (expande abaixo do card) */}
                {isEditando && (
                  <div className="mt-1">
                    <FormEditarCliente
                      cliente={cliente ?? undefined}
                      laudoId={laudo.id}
                      onSalvo={() => { setEditandoClienteId(null); carregarLaudos() }}
                      onCancelar={() => setEditandoClienteId(null)}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
