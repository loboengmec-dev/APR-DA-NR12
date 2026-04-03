'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { excluirNC, atualizarNC } from '@/lib/actions/nao-conformidades'
import { excluirEquipamento, atualizarEquipamento } from '@/lib/actions/equipamentos'
import { excluirFotoNC } from '@/lib/actions/fotos'
import { atualizarCliente } from '@/lib/actions/clientes'
import FormEquipamento from '@/components/laudo/FormEquipamento'
import FormNC from '@/components/laudo/FormNC'
import FormEditarNC from '@/components/laudo/FormEditarNC'
import FormEditarCliente from '@/components/laudo/FormEditarCliente'
import UploadFoto from '@/components/laudo/UploadFoto'
import UploadFotoEquipamento from '@/components/laudo/UploadFotoEquipamento'
import { labelNivelHRN, corNivelHRN } from '@/lib/hrn'
import { gerarUrlAssinada } from '@/lib/storage'
import type { Laudo, Equipamento, NaoConformidade, FotoNC, FormCliente } from '@/types'
import Link from 'next/link'

type LaudoCompleto = Laudo & {
  clientes?: { id: string; razao_social: string; cnpj: string | null; endereco: string | null; cidade: string | null; estado: string | null }
  equipamentos?: (Equipamento & {
    nao_conformidades?: (NaoConformidade & { fotos_nc?: FotoNC[] })[]
  })[]
}

export default function EditarLaudoPage() {
  const params = useParams()
  const router = useRouter()
  const laudoId = params.id as string

  const [laudo, setLaudo] = useState<LaudoCompleto | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [adicionandoEquipamento, setAdicionandoEquipamento] = useState(false)
  const [ncAberta, setNcAberta] = useState<string | null>(null)  // equipamentoId
  const [ncEditando, setNcEditando] = useState<string | null>(null)  // ncId
  const [fotosUrl, setFotosUrl] = useState<Record<string, string>>({})
  const [fotosEqUrl, setFotosEqUrl] = useState<Record<string, string>>({})
  const [editandoCliente, setEditandoCliente] = useState(false)
  const [erro, setErro] = useState('')

  const carregarLaudo = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('laudos')
      .select(`
        *,
        clientes(id, razao_social, cnpj, endereco, cidade, estado),
        equipamentos(
          *,
          nao_conformidades(
            *,
            fotos_nc(*)
          )
        )
      `)
      .eq('id', laudoId)
      .single()

    if (error || !data) {
      setErro('Laudo não encontrado.')
      setCarregando(false)
      return
    }

    // Ordenar equipamentos e NCs por ordem
    if (data.equipamentos) {
      data.equipamentos.sort((a: Equipamento, b: Equipamento) => a.ordem - b.ordem)
      data.equipamentos.forEach((eq: Equipamento & { nao_conformidades?: NaoConformidade[] }) => {
        if (eq.nao_conformidades) {
          eq.nao_conformidades.sort((a, b) => a.ordem - b.ordem)
        }
      })
    }

    setLaudo(data as LaudoCompleto)

    // Gerar URLs para todas as fotos
    const urlsNovas: Record<string, string> = {}
    const urlsEqNovas: Record<string, string> = {}
    for (const eq of (data.equipamentos ?? [])) {
      // Foto geral do equipamento
      if (eq.foto_geral_url) {
        const url = await gerarUrlAssinada(eq.foto_geral_url)
        if (url) urlsEqNovas[eq.id] = url
      }
      for (const nc of (eq.nao_conformidades ?? [])) {
        for (const foto of (nc.fotos_nc ?? [])) {
          const url = await gerarUrlAssinada(foto.storage_path)
          if (url) urlsNovas[foto.id] = url
        }
      }
    }
    setFotosUrl(urlsNovas)
    setFotosEqUrl(urlsEqNovas)
    setCarregando(false)
  }, [laudoId])

  useEffect(() => {
    carregarLaudo()
  }, [carregarLaudo])

  async function handleExcluirNC(ncId: string) {
    if (!confirm('Excluir esta não conformidade e todas as suas fotos?')) return
    await excluirNC(ncId, laudoId)
    carregarLaudo()
  }

  async function handleExcluirEquipamento(eqId: string) {
    if (!confirm('Excluir este equipamento e todas as suas NCs?')) return
    await excluirEquipamento(eqId, laudoId)
    carregarLaudo()
  }

  async function handleExcluirFoto(fotoId: string) {
    if (!confirm('Excluir esta foto?')) return
    await excluirFotoNC(fotoId, laudoId)
    carregarLaudo()
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 text-sm">Carregando laudo...</div>
      </div>
    )
  }

  if (erro || !laudo) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-600">{erro || 'Laudo não encontrado.'}</p>
        <Link href="/dashboard" className="btn-secondary mt-4 inline-block">← Voltar</Link>
      </div>
    )
  }

  const cliente = (laudo as any).clientes
  const equipamentos = (laudo as any).equipamentos ?? []

  return (
    <div>
      {/* Cabeçalho do laudo */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-xl font-bold text-gray-900">
              {cliente?.razao_social ?? 'Cliente não informado'}
            </h1>
            <button
              onClick={() => setEditandoCliente(!editandoCliente)}
              className="text-gray-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition-colors"
              title={cliente?.id ? 'Editar dados do cliente' : 'Cadastrar cliente'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500">
            {laudo.numero_documento && `${laudo.numero_documento} · `}
            {laudo.data_inspecao && new Date(laudo.data_inspecao + 'T00:00:00').toLocaleDateString('pt-BR')}
            {cliente?.cidade && ` · ${cliente.cidade}/${cliente.estado}`}
          </p>
        </div>
        <button
          onClick={() => window.open(`/laudos/${laudoId}/pdf?t=${Date.now()}`, '_blank')}
          className="btn-primary text-sm"
        >
          Exportar PDF
        </button>
      </div>

      {/* Formulário de edição/criação do cliente */}
      {editandoCliente && (
        <FormEditarCliente
          cliente={cliente ?? undefined}
          laudoId={laudoId}
          onSalvo={() => { setEditandoCliente(false); carregarLaudo() }}
          onCancelar={() => setEditandoCliente(false)}
        />
      )}

      {/* Lista de equipamentos */}
      {equipamentos.map((eq: any, eqIdx: number) => (
        <div key={eq.id} className="card mb-4">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                {eqIdx + 1}. {eq.nome}
                {eq.modelo && <span className="text-gray-400 font-normal ml-2 text-sm">({eq.modelo})</span>}
              </h2>
              {eq.categoria_resultado && (
                <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">
                  Categoria {eq.categoria_resultado}
                </span>
              )}
            </div>
            <button
              onClick={() => handleExcluirEquipamento(eq.id)}
              className="text-gray-400 hover:text-red-600 text-sm px-2 py-1"
            >
              Excluir
            </button>
          </div>

          {/* Foto geral do equipamento */}
          <div className="px-4 pt-3">
            {fotosEqUrl[eq.id] ? (
              <div className="flex flex-col items-center mb-3">
                <img
                  src={fotosEqUrl[eq.id]}
                  alt={`Vista geral — ${eq.nome}`}
                  className="max-w-xs max-h-48 object-contain rounded-lg border border-gray-200"
                />
                <p className="text-xs text-gray-500 mt-1">Vista geral — {eq.nome}</p>
                <button
                  onClick={async () => {
                    if (!confirm('Remover a foto geral deste equipamento?')) return
                    await atualizarEquipamento(eq.id, laudoId, { foto_geral_url: null } as any)
                    carregarLaudo()
                  }}
                  className="text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  Remover foto
                </button>
              </div>
            ) : (
              <UploadFotoEquipamento
                equipamentoId={eq.id}
                laudoId={laudoId}
                onUploadConcluido={() => carregarLaudo()}
              />
            )}
          </div>

          {/* NCs do equipamento */}
          <div className="p-4">
            {(eq.nao_conformidades ?? []).map((nc: any, ncIdx: number) => (
              <div key={nc.id} className="mb-4 pb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
                {ncEditando === nc.id ? (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Editar Não Conformidade</h3>
                    <FormEditarNC
                      nc={nc}
                      laudoId={laudoId}
                      onSalva={() => { setNcEditando(null); carregarLaudo() }}
                      onCancelar={() => setNcEditando(null)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                            {nc.item_nr12}
                          </span>
                          {nc.nivel_hrn && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${corNivelHRN(nc.nivel_hrn)}`}>
                              HRN {nc.hrn} — {labelNivelHRN(nc.nivel_hrn)}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 mt-1 text-sm">{nc.titulo_nc}</p>
                        {nc.risco && <p className="text-xs text-gray-500">Risco: {nc.risco}</p>}
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <button
                          onClick={() => setNcEditando(nc.id)}
                          className="text-gray-400 hover:text-blue-600 p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                          title="Editar NC"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleExcluirNC(nc.id)}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                          title="Excluir NC"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Fotos da NC */}
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(nc.fotos_nc ?? []).map((foto: FotoNC) => (
                          <div key={foto.id} className="relative">
                            {fotosUrl[foto.id] ? (
                              <img
                                src={fotosUrl[foto.id]}
                                alt={foto.legenda ?? 'Foto NC'}
                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400">
                                foto
                              </div>
                            )}
                            <button
                              onClick={() => handleExcluirFoto(foto.id)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <UploadFoto
                        ncId={nc.id}
                        laudoId={laudoId}
                        ordem={(nc.fotos_nc ?? []).length}
                        onUploadConcluido={() => carregarLaudo()}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Botão / form de nova NC */}
            {ncAberta === eq.id ? (
              <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Nova Não Conformidade</h3>
                <FormNC
                  equipamentoId={eq.id}
                  laudoId={laudoId}
                  onCriada={() => { setNcAberta(null); carregarLaudo() }}
                  onCriarOutra={() => { carregarLaudo() }}
                  onCancelar={() => setNcAberta(null)}
                />
              </div>
            ) : (
              <button
                onClick={() => setNcAberta(eq.id)}
                className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Adicionar Não Conformidade
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Adicionar equipamento */}
      {adicionandoEquipamento ? (
        <div className="card p-5">
          <h2 className="section-title">Novo Equipamento</h2>
          <FormEquipamento
            laudoId={laudoId}
            onCriado={() => { setAdicionandoEquipamento(false); carregarLaudo() }}
            onCancelar={() => setAdicionandoEquipamento(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => setAdicionandoEquipamento(true)}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors font-medium"
        >
          + Adicionar Equipamento
        </button>
      )}
    </div>
  )
}
