'use client'

import { useState } from 'react'
import { criarNC } from '@/lib/actions/nao-conformidades'
import { buscarTextosPorItem } from '@/lib/banco-textos'
import { CAPITULOS_NR12, ITENS_NR12, itensPorCapitulo } from '@/lib/nr12-itens'
import CalculadoraHRN from './CalculadoraHRN'
import type { NaoConformidade, BancoTextoNR12 } from '@/types'

interface FormNCProps {
  equipamentoId: string
  laudoId: string
  onCriada: (nc: NaoConformidade) => void
  onCriarOutra?: (nc: NaoConformidade) => void
  onCancelar: () => void
}

export default function FormNC({ equipamentoId, laudoId, onCriada, onCriarOutra, onCancelar }: FormNCProps) {
  const [capitulo, setCapitulo] = useState('')
  const [itemNR12, setItemNR12] = useState('')
  const [tituloNC, setTituloNC] = useState('')
  const [risco, setRisco] = useState('')
  const [lo, setLo] = useState<number | null>(null)
  const [fe, setFe] = useState<number | null>(null)
  const [dph, setDph] = useState<number | null>(null)
  const [np, setNp] = useState<number | null>(null)
  const [textoIdentificacao, setTextoIdentificacao] = useState('')
  const [textoRecomendacao, setTextoRecomendacao] = useState('')
  const [medidaControle, setMedidaControle] = useState('')
  const [temTextoBanco, setTemTextoBanco] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [salvarEContinuar, setSalvarEContinuar] = useState(false)
  const [erro, setErro] = useState('')

  const [capituloApoio, setCapituloApoio] = useState('')
  const [alineaSelecionada, setAlineaSelecionada] = useState('')

  const itensDoCapitulo = capitulo ? itensPorCapitulo(capitulo) : []
  const itensDoCapituloApoio = capituloApoio ? itensPorCapitulo(capituloApoio) : []

  function resetCampos() {
    setItemNR12(''); setTituloNC(''); setRisco('')
    setLo(null); setFe(null); setDph(null); setNp(null)
    setTextoIdentificacao(''); setTextoRecomendacao(''); setMedidaControle('')
    setTemTextoBanco(false)
    setAlineaSelecionada('')
    setCapituloApoio('')
  }

  // Ao selecionar um item da lista estática: busca texto no banco e auto-popula
  async function handleSelecionarItem(codigo: string) {
    const itemEscolhido = ITENS_NR12.find(i => i.codigo === codigo)
    if (!itemEscolhido) { resetCampos(); return }

    setItemNR12(codigo)
    setTituloNC(itemEscolhido.titulo)

    // Busca texto pré-cadastrado no banco para este item
    const textos = await buscarTextosPorItem(codigo)
    const texto: BancoTextoNR12 | undefined = textos[0]

    if (texto) {
      setTemTextoBanco(true)
      setRisco(texto.risco ?? '')
      setTextoIdentificacao(texto.texto_identificacao ?? '')
      setTextoRecomendacao(texto.texto_recomendacao ?? '')
      setMedidaControle(texto.medida_controle ?? '')
      if (texto.hrn_tipico_json) {
        const hrn = texto.hrn_tipico_json as Record<string, number>
        if (hrn.LO) setLo(hrn.LO)
        if (hrn.FE) setFe(hrn.FE)
        if (hrn.DPH) setDph(hrn.DPH)
        if (hrn.NP) setNp(hrn.NP)
      }
    } else {
      // Sem texto no banco — campos em branco para preenchimento manual
      setTemTextoBanco(false)
      setRisco(''); setTextoIdentificacao(''); setTextoRecomendacao(''); setMedidaControle('')
      setLo(null); setFe(null); setDph(null); setNp(null)
    }
  }

  // Permite adicionar mais alíneas à NC que está sendo criada
  async function handleAdicionarAlinea(codigo: string) {
    const itemEscolhido = ITENS_NR12.find(i => i.codigo === codigo)
    if (!itemEscolhido) return

    setItemNR12(prev => {
      if (!prev) return codigo
      const lista = prev.split(',').map((s: string) => s.trim())
      if (!lista.includes(codigo)) lista.push(codigo)
      return lista.join(', ')
    })

    setTituloNC(prev => {
      if (!prev) return itemEscolhido.titulo
      return prev + ' / ' + itemEscolhido.titulo
    })

    // Busca se essa alínea extra tem textos adicionais para somar
    const textos = await buscarTextosPorItem(codigo)
    const texto = textos[0]
    if (texto) {
      if (texto.texto_identificacao) setTextoIdentificacao(prev => prev ? prev + '\n\n' + texto.texto_identificacao : (texto.texto_identificacao || ''))
      if (texto.texto_recomendacao) setTextoRecomendacao(prev => prev ? prev + '\n\n' + texto.texto_recomendacao : (texto.texto_recomendacao || ''))
      if (texto.medida_controle) setMedidaControle(prev => prev ? prev + '\n\n' + texto.medida_controle : (texto.medida_controle || ''))
      if (texto.risco && !risco) setRisco(texto.risco)
      if (texto.hrn_tipico_json && lo === null) {
        const hrn = texto.hrn_tipico_json as Record<string, number>
        if (hrn.LO) setLo(hrn.LO)
        if (hrn.FE) setFe(hrn.FE)
        if (hrn.DPH) setDph(hrn.DPH)
        if (hrn.NP) setNp(hrn.NP)
      }
    }
    setAlineaSelecionada('')
  }

  function handleHRNChange(campo: 'lo' | 'fe' | 'dph' | 'np', valor: number) {
    if (campo === 'lo') setLo(valor)
    if (campo === 'fe') setFe(valor)
    if (campo === 'dph') setDph(valor)
    if (campo === 'np') setNp(valor)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!itemNR12 || !tituloNC) {
      setErro('Selecione um item da norma.')
      return
    }
    setErro('')
    setSalvando(true)

    const { data, error } = await criarNC(equipamentoId, laudoId, {
      item_nr12: itemNR12,
      titulo_nc: tituloNC,
      descricao: '',
      risco,
      lo, fe, dph, np,
      texto_identificacao: textoIdentificacao,
      texto_recomendacao: textoRecomendacao,
      medida_controle: medidaControle,
    })

    if (error || !data) {
      setErro('Erro ao salvar NC: ' + error)
      setSalvando(false)
      setSalvarEContinuar(false)
      return
    }

    if (salvarEContinuar && onCriarOutra) {
      onCriarOutra(data)
      resetCampos()
      setCapitulo('')
      setSalvando(false)
      setSalvarEContinuar(false)
    } else {
      onCriada(data)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* PASSO 1 — Capítulo */}
      <div>
        <label className="label">Capítulo da NR-12</label>
        <select
          value={capitulo}
          onChange={e => { setCapitulo(e.target.value); resetCampos() }}
          className="input"
        >
          <option value="">Selecione o capítulo...</option>
          {CAPITULOS_NR12.map(c => (
            <option key={c.codigo} value={c.codigo}>{c.nome}</option>
          ))}
        </select>
      </div>

      {/* PASSO 2 — Item específico da lista estática */}
      {capitulo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Item Principal da NR-12</label>
            <select
              value={itemNR12.split(',')[0] || ''}
              onChange={e => handleSelecionarItem(e.target.value)}
              className="input"
            >
              <option value="">Selecione o item principal...</option>
              {itensDoCapitulo.map(item => (
                <option key={item.codigo} value={item.codigo}>
                  {item.codigo} — {item.titulo}
                </option>
              ))}
            </select>
            {temTextoBanco && <p className="text-xs text-green-600 mt-1">✓ Texto automático carregado</p>}
          </div>

          {/* Adicionador de múltiplas alíneas */}
          {itemNR12 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <label className="label text-xs font-semibold text-blue-900 mb-2">Adicionar mais itens a este risco</label>
              <div className="space-y-2">
                <select
                  value={capituloApoio}
                  onChange={e => setCapituloApoio(e.target.value)}
                  className="input text-sm"
                >
                  <option value="">Mudar capítulo (opcional)...</option>
                  {CAPITULOS_NR12.map(c => (
                    <option key={c.codigo} value={c.codigo}>{c.nome}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <select
                    value={alineaSelecionada}
                    onChange={e => setAlineaSelecionada(e.target.value)}
                    className="input text-sm flex-1 truncate"
                  >
                    <option value="">Selecione a alínea extra...</option>
                    {(capituloApoio ? itensDoCapituloApoio : itensDoCapitulo).map(item => (
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
                    Somar (+1)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmação e Edição Manuais de Item e Título (Agregando múltiplas) */}
      {itemNR12 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="label">Itens da NR-12 Mapeados</label>
            <input
              type="text"
              value={itemNR12}
              onChange={e => setItemNR12(e.target.value)}
              className="input font-mono text-blue-800"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Título(s) da Não Conformidade</label>
            <input
              type="text"
              value={tituloNC}
              onChange={e => setTituloNC(e.target.value)}
              className="input text-blue-900"
              required
            />
          </div>
        </div>
      )}

      {/* Risco — sempre digitado pelo usuário */}
      {itemNR12 && (
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
      )}

      {/* Calculadora HRN */}
      {itemNR12 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <CalculadoraHRN lo={lo} fe={fe} dph={dph} np={np} onChange={handleHRNChange} />
        </div>
      )}

      {/* Textos técnicos */}
      {itemNR12 && (
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
      )}

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
          {erro}
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2">
        <div className="flex gap-2">
          <button
            type="submit"
            onClick={() => setSalvarEContinuar(false)}
            disabled={salvando || !itemNR12}
            className="btn-primary flex-1"
          >
            {salvando && !salvarEContinuar ? 'Salvando...' : 'Adicionar NC e Fechar'}
          </button>
          
          {onCriarOutra && (
            <button
              type="submit"
              onClick={() => setSalvarEContinuar(true)}
              disabled={salvando || !itemNR12}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg flex-1 transition-colors"
            >
              {salvando && salvarEContinuar ? 'Salvando...' : 'Salvar e Adicionar Outra'}
            </button>
          )}
        </div>
        <button type="button" onClick={onCancelar} className="btn-secondary w-full">
          Cancelar Adição
        </button>
      </div>
    </form>
  )
}
