'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { criarLaudo } from '@/lib/actions/laudos'
import { listarClientes, criarCliente } from '@/lib/actions/clientes'
import type { Cliente } from '@/types'
import { useEffect } from 'react'

export default function NovoLaudoPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteId, setClienteId] = useState('')
  const [novoCliente, setNovoCliente] = useState(false)
  const [razaoSocial, setRazaoSocial] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [numeroDocumento, setNumeroDocumento] = useState('')
  const [dataInspecao, setDataInspecao] = useState(new Date().toISOString().split('T')[0])
  const [art, setArt] = useState('')
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
        endereco: '',
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

    const { data: laudo, error } = await criarLaudo({
      cliente_id: idCliente,
      numero_documento: numeroDocumento,
      revisao: '0',
      data_inspecao: dataInspecao,
      art,
      norma: 'NR-12',
    })

    if (error || !laudo) {
      setErro('Erro ao criar laudo: ' + error)
      setSalvando(false)
      return
    }

    router.push(`/laudos/${laudo.id}`)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Novo Laudo</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identificação do cliente */}
        <div className="card p-6">
          <h2 className="section-title">Cliente / Empresa</h2>

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
                  <option key={c.id} value={c.id}>{c.razao_social}</option>
                ))}
              </select>
            </div>
          )}

          {(!clienteId || novoCliente) && (
            <div className="space-y-3">
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
              <div className="grid grid-cols-2 gap-3">
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
        </div>

        {/* Dados do laudo */}
        <div className="card p-6">
          <h2 className="section-title">Identificação do Laudo</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Número do Documento</label>
                <input
                  type="text"
                  value={numeroDocumento}
                  onChange={e => setNumeroDocumento(e.target.value)}
                  className="input"
                  placeholder="APR-2024-001"
                />
              </div>
              <div>
                <label className="label">Data da Inspeção *</label>
                <input
                  type="date"
                  value={dataInspecao}
                  onChange={e => setDataInspecao(e.target.value)}
                  className="input"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Número da ART</label>
              <input
                type="text"
                value={art}
                onChange={e => setArt(e.target.value)}
                className="input"
                placeholder="12345678901234"
              />
            </div>
          </div>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {erro}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={salvando} className="btn-primary flex-1 py-3">
            {salvando ? 'Criando laudo...' : 'Criar Laudo e Continuar →'}
          </button>
        </div>
      </form>
    </div>
  )
}
