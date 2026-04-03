'use client'

import { useState } from 'react'
import { atualizarCliente, criarCliente } from '@/lib/actions/clientes'
import { atualizarLaudo } from '@/lib/actions/laudos'

interface ClienteData {
  id: string
  razao_social: string
  cnpj: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
}

interface FormEditarClienteProps {
  cliente?: ClienteData | null
  laudoId?: string  // necessário quando não há cliente (para vincular após criar)
  onSalvo: () => void
  onCancelar: () => void
}

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

export default function FormEditarCliente({ cliente, laudoId, onSalvo, onCancelar }: FormEditarClienteProps) {
  const modoEdicao = !!cliente?.id
  const [razaoSocial, setRazaoSocial] = useState(cliente?.razao_social ?? '')
  const [cnpj, setCnpj] = useState(cliente?.cnpj ?? '')
  const [endereco, setEndereco] = useState(cliente?.endereco ?? '')
  const [cidade, setCidade] = useState(cliente?.cidade ?? '')
  const [estado, setEstado] = useState(cliente?.estado ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function formatarCNPJ(valor: string) {
    const numeros = valor.replace(/\D/g, '').slice(0, 14)
    return numeros
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!razaoSocial.trim()) {
      setErro('Razão social é obrigatória.')
      return
    }

    setErro('')
    setSalvando(true)

    const dadosCliente = {
      razao_social: razaoSocial.trim(),
      cnpj: cnpj.trim(),
      endereco: endereco.trim(),
      cidade: cidade.trim(),
      estado,
    }

    if (modoEdicao) {
      // Atualizar cliente existente
      const { error } = await atualizarCliente(cliente!.id, dadosCliente)
      if (error) {
        setErro('Erro ao salvar: ' + error)
        setSalvando(false)
        return
      }
    } else {
      // Criar novo cliente e vincular ao laudo
      const { data: novoCliente, error: erroCriar } = await criarCliente(dadosCliente)
      if (erroCriar || !novoCliente) {
        setErro('Erro ao criar cliente: ' + erroCriar)
        setSalvando(false)
        return
      }

      // Vincular ao laudo
      if (laudoId) {
        const { error: erroVincular } = await atualizarLaudo(laudoId, { cliente_id: novoCliente.id })
        if (erroVincular) {
          setErro('Cliente criado, mas erro ao vincular ao laudo: ' + erroVincular)
          setSalvando(false)
          return
        }
      }
    }

    onSalvo()
  }

  return (
    <div className="card mb-6 border-blue-200 bg-blue-50/30">
      <div className="p-5">
        <h3 className="text-sm font-semibold text-blue-800 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
          </svg>
          {modoEdicao ? 'Editar Dados do Cliente' : 'Cadastrar Cliente'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Razão Social */}
          <div>
            <label className="label text-xs">Razão Social / Nome *</label>
            <input
              type="text"
              value={razaoSocial}
              onChange={e => setRazaoSocial(e.target.value)}
              className="input"
              placeholder="Nome da empresa"
              required
            />
          </div>

          {/* CNPJ */}
          <div>
            <label className="label text-xs">CNPJ</label>
            <input
              type="text"
              value={cnpj}
              onChange={e => setCnpj(formatarCNPJ(e.target.value))}
              className="input"
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
          </div>

          {/* Endereço */}
          <div>
            <label className="label text-xs">Endereço</label>
            <input
              type="text"
              value={endereco}
              onChange={e => setEndereco(e.target.value)}
              className="input"
              placeholder="Rua, número, bairro..."
            />
          </div>

          {/* Cidade + Estado */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label text-xs">Cidade</label>
              <input
                type="text"
                value={cidade}
                onChange={e => setCidade(e.target.value)}
                className="input"
                placeholder="Cidade"
              />
            </div>
            <div>
              <label className="label text-xs">Estado</label>
              <select
                value={estado}
                onChange={e => setEstado(e.target.value)}
                className="input"
              >
                <option value="">UF</option>
                {ESTADOS_BR.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              {erro}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={salvando}
              className="btn-primary flex-1 text-sm"
            >
              {salvando ? 'Salvando...' : modoEdicao ? 'Salvar Alterações' : 'Cadastrar e Vincular'}
            </button>
            <button
              type="button"
              onClick={onCancelar}
              className="btn-secondary text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
