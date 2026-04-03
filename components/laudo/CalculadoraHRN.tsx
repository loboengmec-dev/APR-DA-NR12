'use client'

import { TABELA_LO, TABELA_FE, TABELA_DPH, TABELA_NP, calcularHRN, classificarNivel, labelNivelHRN, corNivelHRN } from '@/lib/hrn'

interface CalculadoraHRNProps {
  lo: number | null
  fe: number | null
  dph: number | null
  np: number | null
  onChange: (campo: 'lo' | 'fe' | 'dph' | 'np', valor: number) => void
}

export default function CalculadoraHRN({ lo, fe, dph, np, onChange }: CalculadoraHRNProps) {
  const hrn = lo && fe && dph && np ? calcularHRN(lo, fe, dph, np) : null
  const nivel = hrn !== null ? classificarNivel(hrn) : null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Cálculo HRN</h3>

      <div className="grid grid-cols-2 gap-3">
        {/* LO */}
        <div>
          <label className="label text-xs">LO — Probabilidade</label>
          <select
            value={lo ?? ''}
            onChange={e => onChange('lo', Number(e.target.value))}
            className="input text-sm"
          >
            <option value="">Selecionar</option>
            {TABELA_LO.map(item => (
              <option key={item.valor} value={item.valor}>
                {item.valor} — {item.descricao}
              </option>
            ))}
          </select>
        </div>

        {/* FE */}
        <div>
          <label className="label text-xs">FE — Frequência</label>
          <select
            value={fe ?? ''}
            onChange={e => onChange('fe', Number(e.target.value))}
            className="input text-sm"
          >
            <option value="">Selecionar</option>
            {TABELA_FE.map(item => (
              <option key={item.valor} value={item.valor}>
                {item.valor} — {item.descricao}
              </option>
            ))}
          </select>
        </div>

        {/* DPH */}
        <div>
          <label className="label text-xs">DPH — Severidade</label>
          <select
            value={dph ?? ''}
            onChange={e => onChange('dph', Number(e.target.value))}
            className="input text-sm"
          >
            <option value="">Selecionar</option>
            {TABELA_DPH.map(item => (
              <option key={item.valor} value={item.valor}>
                {item.valor} — {item.descricao}
              </option>
            ))}
          </select>
        </div>

        {/* NP */}
        <div>
          <label className="label text-xs">NP — Nº de pessoas</label>
          <select
            value={np ?? ''}
            onChange={e => onChange('np', Number(e.target.value))}
            className="input text-sm"
          >
            <option value="">Selecionar</option>
            {TABELA_NP.map(item => (
              <option key={item.valor} value={item.valor}>
                {item.valor} — {item.descricao}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resultado */}
      {hrn !== null && nivel !== null && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
          <div>
            <span className="text-xs text-gray-500 block">HRN = LO × FE × DPH × NP</span>
            <span className="text-2xl font-bold text-gray-900">{hrn}</span>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${corNivelHRN(nivel)}`}>
            {labelNivelHRN(nivel)}
          </span>
        </div>
      )}
    </div>
  )
}
