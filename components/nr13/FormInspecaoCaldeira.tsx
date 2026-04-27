'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcularPMTACostadoCaldeira, calcularPMTAEspelhoPlano, calcularPMTACaldeiraGlobal, calcularTaxaCorrosaoAnual } from '@/lib/domain/nr13/pmta_caldeiras'
import { MATERIAIS_ASME, MATERIAIS_GBT150 } from '@/lib/domain/nr13/materiais'

interface FormInspecaoCaldeiraProps {
  initialData?: any
  inspecaoId?: string
  clienteId?: string | null
  clienteDados?: any
}

export default function FormInspecaoCaldeira({
  initialData,
  inspecaoId,
  clienteId,
  clienteDados
}: FormInspecaoCaldeiraProps) {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Boiler Metadata
  const [tag, setTag] = useState(initialData?.tag ?? '')
  const [categoria, setCategoria] = useState(initialData?.categoria_caldeira ?? 'B')
  const [codigoProjeto, setCodigoProjeto] = useState(initialData?.codigo_projeto ?? 'ASME Sec. I')
  const [pressaoOperacao, setPressaoOperacao] = useState<number>(initialData?.pressao_operacao_mpa ?? 0)
  
  // Checklist
  const [controleNivel, setControleNivel] = useState(initialData?.controle_nivel_intertravamento ?? 'Conforme')
  const [valvulasAlerta, setValvulasAlerta] = useState(false) // Alerta de Grave e Iminente Risco
  
  // Measurements
  const [fotosExameInterno, setFotosExameInterno] = useState<any[]>(initialData?.fotos_exame ?? [])
  
  // ASME Calculations
  const [normaCalc, setNormaCalc] = useState(initialData?.norma_calculo ?? 'ASME')
  const [S, setS] = useState<number>(initialData?.material_s ?? 114.5) // Tensao em MPa (pega convertida internamente)
  const [E, setE] = useState<number>(initialData?.eficiencia_e ?? 0.85)
  const [D, setD] = useState<number>(initialData?.diametro_d ?? 1000)
  
  const [espessuraCostado, setEspessuraCostado] = useState<number>(initialData?.espessura_costado ?? 10)
  const [espessuraEspelho, setEspessuraEspelho] = useState<number>(initialData?.espessura_espelho ?? 12)

  // Calcs Auto
  const limitanteResult = useMemo(() => {
    const pmtaCostado = calcularPMTACostadoCaldeira({ S, E, t: espessuraCostado, D })
    const pmtaEspelho = calcularPMTAEspelhoPlano({ S, E, t: espessuraEspelho, D })
    return calcularPMTACaldeiraGlobal(pmtaCostado, pmtaEspelho, pressaoOperacao)
  }, [S, E, espessuraCostado, espessuraEspelho, D, pressaoOperacao])

  const [statusFinal, setStatusFinal] = useState(initialData?.status_final ?? 'Aprovado')

  // Normative AI Updates
  useEffect(() => {
    if (limitanteResult.condena) {
      setStatusFinal('Reprovado — Downgrade Necessário')
    } else if (controleNivel !== 'Conforme') {
      setStatusFinal('Aprovado com Restrições')
    } else {
      setStatusFinal('Aprovado')
    }
  }, [limitanteResult.condena, controleNivel])

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()

    // Bloqueio de Segurança: Exame Interno requer foto
    if (!fotosExameInterno.length && statusFinal === 'Aprovado') {
      setErro('Obrigatório anexar ao menos um registro fotográfico do Exame Interno para finalização do laudo de integridade.')
      return
    }

    setSalvando(true)
    setErro(null)

    const payload = {
      tag,
      categoria_caldeira: categoria,
      codigo_projeto: codigoProjeto,
      pressao_operacao_mpa: pressaoOperacao,
      controle_nivel_intertravamento: controleNivel,
      fotos_exame: fotosExameInterno,
      norma_calculo: normaCalc,
      material_s: S,
      eficiencia_e: E,
      diametro_d: D,
      espessura_costado: espessuraCostado,
      espessura_espelho: espessuraEspelho,
      pmta_asme_kpa: limitanteResult.pmtaLimitante * 1000, 
      status_final: statusFinal,
      status_seguranca: controleNivel === 'Inexistente' ? 'Risco_Grave_Iminente' : 'Conforme'
    }

    try {
      const supabase = createClient()
      if (inspecaoId) {
        await supabase.from('inspecoes_caldeiras').update(payload).eq('id', inspecaoId)
      } else {
        // Mock new creation mapping
        console.log("Create new inspection", payload)
      }
      router.push('/laudos/nr13/caldeiras')
    } catch (err: any) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const materiaisLista = normaCalc === 'ASME' ? MATERIAIS_ASME : MATERIAIS_GBT150

  return (
    <form onSubmit={handleSalvar} className="space-y-8 pb-32">
      {erro && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
          <strong>Atenção:</strong> {erro}
        </div>
      )}

      {/* DADOS BÁSICOS */}
      <section className="bg-white p-6 justify-center flex-col items-center rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Identificação da Caldeira</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TAG</label>
            <input type="text" className="w-full input-field" value={tag} onChange={e => setTag(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria NR-13</label>
            <select className="w-full input-field" value={categoria} onChange={e => setCategoria(e.target.value)}>
              <option value="A">Categoria A (Alta Pressão)</option>
              <option value="B">Categoria B (Baixa Pressão)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código de Projeto</label>
            <select className="w-full input-field" value={codigoProjeto} onChange={e => setCodigoProjeto(e.target.value)}>
              <option value="ASME Sec. I">ASME Section I</option>
              <option value="ASME Sec. IV">ASME Section IV</option>
              <option value="GB/T">GB/T</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pressão de Op. (MPa)</label>
            <input type="number" step="0.01" className="w-full input-field" value={pressaoOperacao} onChange={e => setPressaoOperacao(Number(e.target.value))} />
          </div>
        </div>
      </section>

      {/* CHECKLIST NR-13 */}
      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Auditoria Normativa e Checklist</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Controle de Nível Automático / Intertravamento</p>
              <p className="text-xs text-gray-500">Exigência para evitar superaquecimento (§13.4.1.2).</p>
            </div>
            <select
              className="input-field text-sm w-48"
              value={controleNivel}
              onChange={e => setControleNivel(e.target.value)}
            >
              <option value="Conforme">Conforme</option>
              <option value="Não Conforme">Não Conforme</option>
              <option value="Inexistente">Inexistente (Risco Grave)</option>
            </select>
          </div>
          {controleNivel === 'Inexistente' && (
            <div className="text-xs text-red-600 px-4">
              Gatilho de Risco Grave e Iminente acionado: Interdição operacional mandatória requerida.
            </div>
          )}
        </div>
      </section>

      {/* MEMORIA DE CALCULO ASME */}
      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Memória de Cálculo PMTA (ASME Section I)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Norma de Material</label>
              <select className="w-full input-field" value={normaCalc} onChange={e => setNormaCalc(e.target.value)}>
                <option value="ASME">ASME Section II</option>
                <option value="GBT150">Aço Chinês (GB/T)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material de Construção [S]</label>
              <select className="w-full input-field" value={S} onChange={e => setS(Number(e.target.value))}>
                {materiaisLista.map(m => (
                  <option key={m.nome} value={m.tensaoMPa}>{m.nome} ({m.tensaoMPa} MPa)</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Eficiência de Junta (E)</label>
                <input type="number" step="0.01" className="w-full input-field" value={E} onChange={e => setE(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diâmetro Int. D (mm)</label>
                <input type="number" step="0.1" className="w-full input-field" value={D} onChange={e => setD(Number(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-semibold text-slate-800 border-b border-slate-200 pb-2">Espessuras Ultrassom</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costado (mm)</label>
                <input type="number" step="0.1" className="w-full input-field border-orange-200 focus:ring-orange-500" value={espessuraCostado} onChange={e => setEspessuraCostado(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Espelho (mm)</label>
                <input type="number" step="0.1" className="w-full input-field border-orange-200 focus:ring-orange-500" value={espessuraEspelho} onChange={e => setEspessuraEspelho(Number(e.target.value))} />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500">PMTA Costado:</span>
                <span className="font-mono">{limitanteResult.pmtaLimitante.toFixed(2)} MPa</span>
              </div>
              <div className={`mt-2 p-3 rounded-lg flex items-center justify-between ${limitanteResult.condena ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                <span className="font-bold text-sm">PMTA Efetiva (Limitante: {limitanteResult.componenteFragil})</span>
                <span className="font-mono font-bold">{limitanteResult.pmtaLimitante.toFixed(3)} MPa</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FLOAT SAVE BAR */}
      <div className="fixed bottom-0 left-[256px] right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-20 flex justify-between items-center px-10">
        <div>
          <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
            Status Calculado: 
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusFinal.includes('Reprovado') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {statusFinal}
            </span>
          </p>
        </div>
        <button
          type="submit"
          disabled={salvando}
          className="btn-primary px-8 py-2.5 bg-orange-600 hover:bg-orange-700"
        >
          {salvando ? 'Salvando...' : 'Salvar Relatório e Atualizar'}
        </button>
      </div>

    </form>
  )
}
