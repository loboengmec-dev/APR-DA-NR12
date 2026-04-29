'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { listarClientes, criarCliente, excluirCliente } from '@/lib/actions/clientes'
import type { Cliente } from '@/types'

// ── Toast mínimo inline (sem dependência externa) ─────────────────────────
function Toast({ msg, tipo, onClose }: { msg: string; tipo: 'ok' | 'erro'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      role="alert"
      className={[
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl',
        'text-sm font-medium min-w-[260px] max-w-[90vw] animate-fade-in',
        tipo === 'ok'
          ? 'bg-emerald-600 text-white'
          : 'bg-red-600 text-white',
      ].join(' ')}
    >
      {tipo === 'ok'
        ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
        : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
      }
      <span className="flex-1">{msg}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity ml-1" aria-label="Fechar">✕</button>
    </div>
  )
}

// ── Modal de confirmação de exclusão ─────────────────────────────────────
function ModalConfirmarExclusao({
  cliente,
  excluindo,
  onConfirmar,
  onCancelar,
}: {
  cliente: Cliente
  excluindo: boolean
  onConfirmar: () => void
  onCancelar: () => void
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancelar}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícone de alerta */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-600">
              <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Excluir cliente?</h3>
            <p className="text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
          </div>
        </div>

        {/* Dados do cliente */}
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="font-semibold text-red-900 text-sm">{cliente.razao_social}</p>
          {cliente.cnpj && <p className="text-xs text-red-700 mt-0.5">CNPJ: {cliente.cnpj}</p>}
          {(cliente.cidade || cliente.estado) && (
            <p className="text-xs text-red-600 mt-0.5">{[cliente.cidade, cliente.estado].filter(Boolean).join(' — ')}</p>
          )}
        </div>

        <p className="text-sm text-gray-600">
          Todos os registros vinculados a este cliente (vasos de pressão, inspeções, laudos) serão <strong>permanentemente removidos</strong>.
        </p>

        {/* Botões */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancelar}
            disabled={excluindo}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={excluindo}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {excluindo
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Excluindo...</>
              : <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z" clipRule="evenodd" />
                  </svg>
                  Excluir definitivamente
                </>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────
export default function NovoClienteNR13Page() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteId, setClienteId] = useState('')
  const [novoCliente, setNovoCliente] = useState(false)
  const [razaoSocial, setRazaoSocial] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Estados de exclusão
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'erro' } | null>(null)

  useEffect(() => {
    listarClientes().then(({ data }) => setClientes(data ?? []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSalvando(true)

    let idCliente = clienteId || null

    if (novoCliente && razaoSocial) {
      const { data: clienteCriado, error: erroCliente } = await criarCliente({
        razao_social: razaoSocial,
        cnpj,
        endereco,
        cidade,
        estado,
      })
      if (erroCliente || !clienteCriado) {
        setErro('Erro ao criar cliente: ' + erroCliente)
        setSalvando(false)
        return
      }
      idCliente = clienteCriado.id
    }

    if (!idCliente) {
      setErro('É necessário selecionar ou criar um cliente')
      setSalvando(false)
      return
    }

    router.push(`/laudos/nr13/vasos/novo?cliente_id=${idCliente}`)
  }

  async function confirmarExclusao() {
    if (!clienteParaExcluir) return
    setExcluindo(true)

    const { error } = await excluirCliente(clienteParaExcluir.id)
    setExcluindo(false)
    setClienteParaExcluir(null)

    if (error) {
      setToast({ msg: 'Erro ao excluir: ' + error, tipo: 'erro' })
      return
    }

    // Remove da lista local sem recarregar a página
    setClientes((prev) => prev.filter((c) => c.id !== clienteParaExcluir.id))
    if (clienteId === clienteParaExcluir.id) setClienteId('')
    setToast({ msg: `Cliente "${clienteParaExcluir.razao_social}" excluído com sucesso.`, tipo: 'ok' })
  }

  return (
    <div className="max-w-2xl">
      {/* Modal de confirmação */}
      {clienteParaExcluir && (
        <ModalConfirmarExclusao
          cliente={clienteParaExcluir}
          excluindo={excluindo}
          onConfirmar={confirmarExclusao}
          onCancelar={() => setClienteParaExcluir(null)}
        />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={() => setToast(null)} />}

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nova Inspeção NR-13</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-md bg-emerald-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Cliente / Empresa</h2>
          </div>

          {/* Lista de clientes com botão de exclusão */}
          {clientes.length > 0 && !novoCliente && (
            <div className="mb-4 space-y-2">
              <label className="label">Selecionar cliente existente</label>

              {/* Select compacto para mobile */}
              <select
                value={clienteId}
                onChange={e => setClienteId(e.target.value)}
                className="input"
              >
                <option value="">— Novo cliente —</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.razao_social}{c.cnpj ? ` — ${c.cnpj}` : ''}
                  </option>
                ))}
              </select>

              {/* Lista expandida com botão de excluir */}
              <div className="mt-3 space-y-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                {clientes.map((c) => (
                  <div
                    key={c.id}
                    className={[
                      'flex items-center justify-between px-4 py-2.5 transition-colors',
                      clienteId === c.id ? 'bg-emerald-50' : 'hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <button
                      type="button"
                      onClick={() => setClienteId(c.id)}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className={`text-sm font-medium truncate ${clienteId === c.id ? 'text-emerald-800' : 'text-gray-800'}`}>
                        {c.razao_social}
                      </p>
                      {(c.cnpj || c.cidade) && (
                        <p className="text-xs text-gray-400 truncate">
                          {[c.cnpj, c.cidade && c.estado ? `${c.cidade}/${c.estado}` : c.cidade].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </button>

                    {/* Ícone de lixeira — com tooltip */}
                    <button
                      type="button"
                      onClick={() => setClienteParaExcluir(c)}
                      title={`Excluir ${c.razao_social}`}
                      className="ml-3 flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      aria-label={`Excluir cliente ${c.razao_social}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!clienteId || novoCliente) && (
            <div className="space-y-4">
              <div>
                <label className="label">Razão Social *</label>
                <input
                  type="text"
                  value={razaoSocial}
                  onChange={e => setRazaoSocial(e.target.value)}
                  className="input"
                  placeholder="Empresa Ltda."
                  required={!clienteId}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">CNPJ</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={e => setCnpj(e.target.value)}
                    className="input"
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div>
                  <label className="label">Estado</label>
                  <input
                    type="text"
                    value={estado}
                    onChange={e => setEstado(e.target.value)}
                    className="input"
                    placeholder="MG"
                    maxLength={2}
                  />
                </div>
              </div>

              <div>
                <label className="label">Endereço</label>
                <input
                  type="text"
                  value={endereco}
                  onChange={e => setEndereco(e.target.value)}
                  className="input"
                  placeholder="Rua, Número, Bairro"
                />
              </div>

              <div>
                <label className="label">Cidade</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={e => setCidade(e.target.value)}
                  className="input"
                  placeholder="Belo Horizonte"
                />
              </div>
            </div>
          )}

          {clientes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setNovoCliente(!novoCliente)}
                className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
              >
                {novoCliente ? '← Voltar para seleção de cliente' : 'Ou cadastrar novo cliente'}
              </button>
            </div>
          )}
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {erro}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary py-3 px-6"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="btn-primary flex-1 py-3"
          >
            {salvando ? 'Continuando...' : 'Continuar para Inspeção →'}
          </button>
        </div>

        <div className="text-xs text-gray-400 text-center pt-4">
          <p>Após selecionar/criar o cliente, você será direcionado para o formulário completo de inspeção NR-13.</p>
        </div>
      </form>
    </div>
  )
}
