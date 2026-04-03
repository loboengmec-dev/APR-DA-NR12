'use client'

import { useState } from 'react'
import { criarEquipamento } from '@/lib/actions/equipamentos'
import { OPCOES_S, OPCOES_F, OPCOES_P, descricaoCategoria } from '@/lib/categoria-seguranca'
import { calcularCategoria } from '@/lib/categoria-seguranca'
import type { Equipamento } from '@/types'

interface FormEquipamentoProps {
  laudoId: string
  onCriado: (equipamento: Equipamento) => void
  onCancelar: () => void
}

export default function FormEquipamento({ laudoId, onCriado, onCancelar }: FormEquipamentoProps) {
  const [nome, setNome] = useState('')
  const [modelo, setModelo] = useState('')
  const [categoriaS, setCategoriaS] = useState('')
  const [categoriaF, setCategoriaF] = useState('')
  const [categoriaP, setCategoriaP] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const categoriaResultado = categoriaS && categoriaF && categoriaP
    ? calcularCategoria(categoriaS, categoriaF, categoriaP)
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setErro('')
    setSalvando(true)

    const { data, error } = await criarEquipamento(laudoId, {
      nome,
      modelo,
      categoria_s: categoriaS,
      categoria_f: categoriaF,
      categoria_p: categoriaP,
    })

    if (error || !data) {
      setErro('Erro ao criar equipamento: ' + error)
      setSalvando(false)
      return
    }

    onCriado(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="label">Nome do Equipamento *</label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="input"
            placeholder="Prensa hidráulica"
            required
            autoFocus
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="label">Modelo / Tag</label>
          <input
            type="text"
            value={modelo}
            onChange={e => setModelo(e.target.value)}
            className="input"
            placeholder="PH-100 / EQ-001"
          />
        </div>
      </div>

      {/* Categorização NBR 14153 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Categoria de Segurança (NBR 14153)</h3>
        <div className="space-y-2">
          <div>
            <label className="label text-xs">S — Severidade do dano</label>
            <select value={categoriaS} onChange={e => setCategoriaS(e.target.value)} className="input text-sm">
              <option value="">Não avaliado</option>
              {OPCOES_S.map(o => <option key={o.valor} value={o.valor}>{o.descricao}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">F — Frequência de exposição</label>
            <select value={categoriaF} onChange={e => setCategoriaF(e.target.value)} className="input text-sm">
              <option value="">Não avaliado</option>
              {OPCOES_F.map(o => <option key={o.valor} value={o.valor}>{o.descricao}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">P — Possibilidade de evitar</label>
            <select value={categoriaP} onChange={e => setCategoriaP(e.target.value)} className="input text-sm">
              <option value="">Não avaliado</option>
              {OPCOES_P.map(o => <option key={o.valor} value={o.valor}>{o.descricao}</option>)}
            </select>
          </div>
        </div>

        {categoriaResultado && (
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800">
            <strong>Resultado:</strong> {descricaoCategoria(categoriaResultado)}
          </div>
        )}
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
          {erro}
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={salvando} className="btn-primary flex-1">
          {salvando ? 'Salvando...' : 'Adicionar Equipamento'}
        </button>
        <button type="button" onClick={onCancelar} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  )
}
