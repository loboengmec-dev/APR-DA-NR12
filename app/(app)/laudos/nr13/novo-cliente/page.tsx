'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { listarClientes, criarCliente } from '@/lib/actions/clientes'
import type { Cliente } from '@/types'

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

  useEffect(() => {
    listarClientes().then(({ data }) => setClientes(data ?? []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSalvando(true)

    let idCliente = clienteId || null

    // Criar novo cliente se necessário
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

    // Redirecionar para formulário NR-13 com cliente_id
    router.push(`/laudos/nr13/novo?cliente_id=${idCliente}`)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nova Inspeção NR-13</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identificação do cliente */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-md bg-emerald-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Cliente / Empresa</h2>
          </div>

          {clientes.length > 0 && !novoCliente && (
            <div className="mb-4">
              <label className="label">Selecionar cliente existente</label>
              <select
                value={clienteId}
                onChange={e => setClienteId(e.target.value)}
                className="input"
              >
                <option value="">— Novo cliente —</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.razao_social} {c.cnpj ? `- ${c.cnpj}` : ''}</option>
                ))}
              </select>
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