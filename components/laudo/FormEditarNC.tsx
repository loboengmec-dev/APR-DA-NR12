'use client'

import { useState } from 'react'
import { atualizarNC } from '@/lib/actions/nao-conformidades'
import { CAPITULOS_NR12, ITENS_NR12, itensPorCapitulo } from '@/lib/nr12-itens'
import CalculadoraHRN from './CalculadoraHRN'
import type { NaoConformidade } from '@/types'

interface FormEditarNCProps {
  nc: NaoConformidade
  laudoId: string
  onSalva: () => void
  onCancelar: () => void
}

export default function FormEditarNC({ nc, laudoId, onSalva, onCancelar }: FormEditarNCProps) {
  const [itemNr12, setItemNr12] = useState(nc.item_nr12 ?? '')
  const [tituloNc, setTituloNc] = useState(nc.titulo_nc ?? '')
  const [risco, setRisco] = useState(nc.risco ?? '')
  const [lo, setLo] = useState<number | null>(nc.lo ?? null)
  const [fe, setFe] = useState<number | null>(nc.fe ?? null)
  const [dph, setDph] = useState<number | null>(nc.dph ?? null)
  const [np, setNp] = useState<number | null>(nc.np ?? null)
  const [textoIdentificacao, setTextoIdentificacao] = useState(nc.texto_identificacao ?? '')
  const [textoRecomendacao, setTextoRecomendacao] = useState(nc.texto_recomendacao ?? '')
  const [medidaControle, setMedidaControle] = useState(nc.medida_controle ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const [capituloApoio, setCapituloApoio] = useState('')
  const [alineaSelecionada, setAlineaSelecionada] = useState('')
  const itensDoCapitulo = capituloApoio ? itensPorCapitulo(capituloApoio) : []

  function handleAdicionarAlinea(codigo: string) {
    if (!codigo) return
    const itemEscolhido = ITENS_NR12.find(i => i.codigo === codigo)
    if (!itemEscolhido) return

    // Concatena no campo de item
    const novoItem = itemNr12 ? `${itemNr12}, ${itemEscolhido.codigo}` : itemEscolhido.codigo
    setItemNr12(novoItem)

    // Opcional: Concatena no título para não perder a referência
    const novoTitulo = tituloNc ? `${tituloNc} / ${itemEscolhido.titulo}` : itemEscolhido.titulo
    setTituloNc(novoTitulo)
    
    // Reseta os seletores para não bugar no mobile
    setAlineaSelecionada('')
    setCapituloApoio('')
  }

  function handleHRNChange(campo: 'lo' | 'fe' | 'dph' | 'np', valor: number) {
    if (campo === 'lo') setLo(valor)
    if (campo === 'fe') setFe(valor)
    if (campo === 'dph') setDph(valor)
    if (campo === 'np') setNp(valor)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSalvando(true)

    const { error } = await atualizarNC(nc.id, laudoId, {
      item_nr12: itemNr12,
      titulo_nc: tituloNc,
      risco,
      lo, fe, dph, np,
      texto_identificacao: textoIdentificacao,
      texto_recomendacao: textoRecomendacao,
      medida_controle: medidaControle,
    })

    if (error) {
      setErro('Erro ao salvar: ' + error)
      setSalvando(false)
      return
    }

    onSalva()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Selecionador de Múltiplas Alíneas (Lista Suspensa) */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
        <label className="label text-xs font-semibold text-gray-700">Buscar e adicionar mais alíneas (Lista Suspensa)</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          <select
            value={capituloApoio}
            onChange={e => setCapituloApoio(e.target.value)}
            className="input text-sm"
          >
            <option value="">Selecione o capítulo da NR-12...</option>
            {CAPITULOS_NR12.map(c => (
              <option key={c.codigo} value={c.codigo}>{c.nome}</option>
            ))}
          </select>

          {capituloApoio && (
            <div className="flex gap-2">
              <select
                value={alineaSelecionada}
                onChange={e => setAlineaSelecionada(e.target.value)}
                className="input text-sm flex-1 truncate max-w-[70%]"
              >
                <option value="">Selecione a não conformidade para incluir...</option>
                {itensDoCapitulo.map(item => (
                  <option key={item.codigo} value={item.codigo}>
                    {item.codigo} — {item.titulo}
                  </option>
                ))}
              </select>
              
              <button
                type="button"
                className="btn-primary text-xs px-3 whitespace-nowrap"
                onClick={() => handleAdicionarAlinea(alineaSelecionada)}
                disabled={!alineaSelecionada}
              >
                Adicionar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Item e titulo (Editáveis para múltiplas alíneas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1">
          <label className="label">Item(ns) da NR-12</label>
          <input
            type="text"
            value={itemNr12}
            onChange={e => setItemNr12(e.target.value)}
            className="input font-mono text-blue-800"
            placeholder="Ex: 12.5.8, 12.5.9"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Título da Não Conformidade</label>
          <input
            type="text"
            value={tituloNc}
            onChange={e => setTituloNc(e.target.value)}
            className="input text-blue-900"
            required
          />
        </div>
      </div>

      {/* Risco */}
      <div>
        <label className="label">Risco identificado</label>
        <input
          type="text"
          value={risco}
          onChange={e => setRisco(e.target.value)}
          className="input"
          placeholder="Ex: Choque elétrico, aprisionamento, queda..."
        />
      </div>

      {/* Calculadora HRN */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <CalculadoraHRN lo={lo} fe={fe} dph={dph} np={np} onChange={handleHRNChange} />
      </div>

      {/* Textos técnicos */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-700">Textos Técnicos</p>
        <div>
          <label className="label text-xs">Identificação do Risco</label>
          <textarea
            value={textoIdentificacao}
            onChange={e => setTextoIdentificacao(e.target.value)}
            className="input min-h-[80px] resize-y text-sm"
            placeholder="Descreva a não conformidade identificada..."
            rows={3}
          />
        </div>
        <div>
          <label className="label text-xs">Recomendação</label>
          <textarea
            value={textoRecomendacao}
            onChange={e => setTextoRecomendacao(e.target.value)}
            className="input min-h-[70px] resize-y text-sm"
            placeholder="Ação corretiva recomendada..."
            rows={3}
          />
        </div>
        <div>
          <label className="label text-xs">Medida de Controle</label>
          <input
            type="text"
            value={medidaControle}
            onChange={e => setMedidaControle(e.target.value)}
            className="input text-sm"
            placeholder="Ex: Instalação de botão de emergência tipo cogumelo"
          />
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
          {erro}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="btn-primary flex-1"
        >
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
        <button type="button" onClick={onCancelar} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  )
}
