'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcularPMTACostadoCaldeira, calcularPMTAEspelhoPlano, calcularPMTACaldeiraGlobal, calcularTaxaCorrosaoAnual } from '@/lib/domain/nr13/pmta_caldeiras'
import { MATERIAIS_ASME, MATERIAIS_GBT150 } from '@/lib/domain/nr13/materiais'
import UploadFotoNR13 from './UploadFotoNR13'
import GaleriaFotosNR13 from './GaleriaFotosNR13'
import { uploadFotoExame } from '@/lib/nr13/storage'

interface FormInspecaoCaldeiraProps {
  initialData?: any
  inspecaoId?: string
  clienteId?: string | null
  clienteDados?: any
}

export default function FormInspecaoCaldeira({
  initialData,
  inspecaoId: propInspecaoId,
  clienteId,
  clienteDados
}: FormInspecaoCaldeiraProps) {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [inspecaoId, setInspecaoId] = useState(propInspecaoId ?? 'novo_id_temporario') // Para upload de fotos antes de salvar, idealmente criar registro antes

  // Boiler Metadata
  const [tag, setTag] = useState(initialData?.tag ?? '')
  const [categoria, setCategoria] = useState(initialData?.categoria_caldeira ?? 'B')
  const [codigoProjeto, setCodigoProjeto] = useState(initialData?.codigo_projeto ?? 'ASME Sec. I')
  const [pressaoOperacao, setPressaoOperacao] = useState<number>(initialData?.pressao_operacao_mpa ?? 0)
  
  // Checklist
  const [valvulaAjustada, setValvulaAjustada] = useState(initialData?.teste_hidrostatico ?? 'Conforme')
  const [controleNivel, setControleNivel] = useState(initialData?.controle_nivel_intertravamento ?? 'Conforme')
  const [distanciaInstalacao, setDistanciaInstalacao] = useState(initialData?.distancia_instalacao ?? 'Conforme')
  const [iluminacaoEmergencia, setIluminacaoEmergencia] = useState(initialData?.iluminacao_emergencia ?? 'Conforme')
  const [qualidadeAgua, setQualidadeAgua] = useState(initialData?.qualidade_agua ?? 'Conforme')
  const [certificacaoOperador, setCertificacaoOperador] = useState(initialData?.certificacao_operador ?? 'Conforme')
  
  // Measurements
  const [fotosExameInterno, setFotosExameInterno] = useState<any[]>(initialData?.fotos_exame ?? [])
  
  // ASME Calculations
  const [normaCalc, setNormaCalc] = useState(initialData?.norma_calculo ?? 'ASME')
  const [S, setS] = useState<number>(initialData?.material_s ?? 114.5) 
  const [E, setE] = useState<number>(initialData?.eficiencia_e ?? 0.85)
  const [D, setD] = useState<number>(initialData?.diametro_d ?? 1000)
  
  const [espessuraCostado, setEspessuraCostado] = useState<number>(initialData?.espessura_costado ?? 10)
  const [espessuraCostadoAnterior, setEspessuraCostadoAnterior] = useState<number>(10)
  const [espessuraEspelho, setEspessuraEspelho] = useState<number>(initialData?.espessura_espelho ?? 12)

  // Cronograma
  const [dataProximaInspExterna, setDataProximaInspExterna] = useState(initialData?.proxima_inspecao_externa ?? '')
  const [dataProximaInspInterna, setDataProximaInspInterna] = useState(initialData?.proxima_inspecao_interna ?? '')

  // Calcs Auto
  const limitanteResult = useMemo(() => {
    const pmtaCostado = calcularPMTACostadoCaldeira({ S, E, t: espessuraCostado, D })
    const pmtaEspelho = calcularPMTAEspelhoPlano({ S, E, t: espessuraEspelho, D })
    return calcularPMTACaldeiraGlobal(pmtaCostado, pmtaEspelho, pressaoOperacao)
  }, [S, E, espessuraCostado, espessuraEspelho, D, pressaoOperacao])

  const taxaCorrosao = useMemo(() => {
     return calcularTaxaCorrosaoAnual(espessuraCostadoAnterior, espessuraCostado, 12).toFixed(3)
  }, [espessuraCostadoAnterior, espessuraCostado])

  const [statusFinal, setStatusFinal] = useState(initialData?.status_final ?? 'Aprovado')

  // Normative AI Updates
  useEffect(() => {
    if (limitanteResult.condena) {
      setStatusFinal('Reprovado — Downgrade Necessário')
    } else if (
      controleNivel === 'Inexistente' || 
      valvulaAjustada === 'Não Conforme'
    ) {
      setStatusFinal('Interditado')
    } else if (
      distanciaInstalacao !== 'Conforme' ||
      iluminacaoEmergencia !== 'Conforme' ||
      qualidadeAgua !== 'Conforme' ||
      certificacaoOperador !== 'Conforme' ||
      controleNivel !== 'Conforme'
    ) {
      setStatusFinal('Aprovado com Restrições')
    } else {
      setStatusFinal('Aprovado')
    }

    // Cronograma Automático (exemplo preenchido pela Regra NR-13 para Caldeiras)
    if (categoria === 'A') {
      const proxima = new Date(); proxima.setFullYear(proxima.getFullYear() + 1);
      setDataProximaInspInterna(proxima.toISOString().split('T')[0])
      setDataProximaInspExterna(proxima.toISOString().split('T')[0])
    } else {
      const proximaInt = new Date(); proximaInt.setFullYear(proximaInt.getFullYear() + 1);
      const proximaExt = new Date(); proximaExt.setFullYear(proximaExt.getFullYear() + 1);
      setDataProximaInspInterna(proximaInt.toISOString().split('T')[0])
      setDataProximaInspExterna(proximaExt.toISOString().split('T')[0])
    }
  }, [limitanteResult.condena, controleNivel, valvulaAjustada, distanciaInstalacao, iluminacaoEmergencia, qualidadeAgua, certificacaoOperador, categoria])

  const rgiAtivo = controleNivel === 'Inexistente' || valvulaAjustada === 'Não Conforme'

  const handleUploadFotoExameInterno = async (file: File) => {
    // In a real app we'd need inspecaoId right away, or we store temporarily
    // For this mock we generate a temp object URL for the preview.
    const url = URL.createObjectURL(file)
    setFotosExameInterno(prev => [...prev, { url, arquivo: file }])
    return { path: 'mock-path', error: null }
  }

  const handleFotoUploaded = (path: string) => {
    // We already pushed the blob to fotosExameInterno in handleUploadFotoExameInterno to show instantly
  }

  const handleRemoveFoto = (index: number) => {
    setFotosExameInterno(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()

    // Bloqueio de Segurança: Exame Interno requer foto
    if (fotosExameInterno.length === 0 && (statusFinal === 'Aprovado' || statusFinal === 'Aprovado com Restrições')) {
      setErro('Obrigatório anexar ao menos um registro fotográfico do Exame Interno para finalização aprovada do laudo de integridade.')
      // Scroll to top to see error
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSalvando(true)
    setErro(null)

    const payload = {
      tag,
      categoria_caldeira: categoria,
      codigo_projeto: codigoProjeto,
      pressao_operacao_mpa: pressaoOperacao,
      
      // Checklists
      teste_hidrostatico: valvulaAjustada,
      controle_nivel_intertravamento: controleNivel,
      distancia_instalacao: distanciaInstalacao,
      iluminacao_emergencia: iluminacaoEmergencia,
      qualidade_agua: qualidadeAgua,
      certificacao_operador: certificacaoOperador,
      
      // Fotos
      fotos_exame: fotosExameInterno.map(f => f.url), // store urls or paths
      norma_calculo: normaCalc,
      material_s: S,
      eficiencia_e: E,
      diametro_d: D,
      espessura_costado: espessuraCostado,
      espessura_espelho: espessuraEspelho,
      pmta_asme_kpa: limitanteResult.pmtaLimitante * 1000, 
      
      proxima_inspecao_externa: dataProximaInspExterna,
      proxima_inspecao_interna: dataProximaInspInterna,

      status_final: statusFinal,
      status_seguranca: rgiAtivo ? 'Risco_Grave_Iminente' : 'Conforme'
    }

    try {
      const supabase = createClient()
      if (propInspecaoId) {
        await supabase.from('inspecoes_caldeiras').update(payload).eq('id', propInspecaoId)
      } else {
         // Create mock
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
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 shadow-sm animate-pulse">
          <strong>Atenção:</strong> {erro}
        </div>
      )}

      {/* DADOS BÁSICOS */}
      <section className="bg-white p-6 justify-center flex-col items-center rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">Identificação da Caldeira</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">TAG</label>
            <input type="text" className="w-full input-field border border-gray-300 rounded px-3 py-2" value={tag} onChange={e => setTag(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria NR-13</label>
            <select className="w-full input-field border border-gray-300 rounded px-3 py-2" value={categoria} onChange={e => setCategoria(e.target.value)}>
              <option value="A">Categoria A (Pressão de Op. &gt;= 1960 kPa)</option>
              <option value="B">Categoria B (Pressão de Op. &lt;= 588 kPa)</option>
              <option value="C">Categoria C (Intermediária)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Código de Projeto</label>
            <select className="w-full input-field border border-gray-300 rounded px-3 py-2" value={codigoProjeto} onChange={e => setCodigoProjeto(e.target.value)}>
              <option value="ASME Sec. I">ASME Section I</option>
              <option value="ASME Sec. IV">ASME Section IV</option>
              <option value="GB/T">GB/T</option>
              <option value="DIN">DIN</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Pressão de Op. (MPa)</label>
            <input type="number" step="0.01" className="w-full input-field border border-gray-300 rounded px-3 py-2" value={pressaoOperacao} onChange={e => setPressaoOperacao(Number(e.target.value))} />
          </div>
        </div>
      </section>

      {/* CHECKLIST NR-13 */}
      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">Auditoria Normativa e Instalação</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Válvulas de Segurança (PSV)</p>
              <p className="text-xs text-gray-500">Pressão de abertura ajustada ≤ PMTA e integridade física das molas.</p>
            </div>
            <select className="input-field border border-gray-300 rounded px-3 py-2 text-sm w-48" value={valvulaAjustada} onChange={e => setValvulaAjustada(e.target.value)}>
              <option value="Conforme">Conforme</option>
              <option value="Não Conforme">Não Conforme (Risco Grave)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Controle de Nível Automático / Intertravamento</p>
              <p className="text-xs text-gray-500">Exigência mandatória para evitar superaquecimento (§13.4.1.2).</p>
            </div>
            <select className="input-field border border-gray-300 rounded px-3 py-2 text-sm w-48" value={controleNivel} onChange={e => setControleNivel(e.target.value)}>
              <option value="Conforme">Conforme</option>
              <option value="Não Conforme">Não Conforme</option>
              <option value="Inexistente">Inexistente (Risco Grave)</option>
            </select>
          </div>
          {rgiAtivo && (
            <div className="text-xs font-bold text-white bg-red-600 px-4 py-2 rounded">
              ⚠️ Gatilho de Risco Grave e Iminente acionado! Interdição operacional mandatória requerida.
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Casa de Caldeiras: Distanciamento (3m)</p>
              <p className="text-xs text-gray-500">Instalação dispõe de 3 metros de área frontal e saídas desobstruídas.</p>
            </div>
            <select className="input-field border border-gray-300 rounded px-3 py-2 text-sm w-48" value={distanciaInstalacao} onChange={e => setDistanciaInstalacao(e.target.value)}>
              <option value="Conforme">Conforme</option>
              <option value="Não Conforme">Não Conforme</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Iluminação de Emergência</p>
              <p className="text-xs text-gray-500">Garante fuga segura e leitura de instrumentos em blackouts.</p>
            </div>
            <select className="input-field border border-gray-300 rounded px-3 py-2 text-sm w-48" value={iluminacaoEmergencia} onChange={e => setIluminacaoEmergencia(e.target.value)}>
              <option value="Conforme">Conforme</option>
              <option value="Não Conforme">Não Conforme</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Gestão de Qualidade da Água</p>
              <p className="text-xs text-gray-500">Há controle quimico para prevenir depósitos e corrosões focais.</p>
            </div>
            <select className="input-field border border-gray-300 rounded px-3 py-2 text-sm w-48" value={qualidadeAgua} onChange={e => setQualidadeAgua(e.target.value)}>
              <option value="Conforme">Conforme</option>
              <option value="Não Conforme">Não Conforme</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Certificação do Operador</p>
              <p className="text-xs text-gray-500">Operadores de caldeira documentados e treinados na norma pertinente.</p>
            </div>
            <select className="input-field border border-gray-300 rounded px-3 py-2 text-sm w-48" value={certificacaoOperador} onChange={e => setCertificacaoOperador(e.target.value)}>
              <option value="Conforme">Conforme</option>
              <option value="Não Conforme">Não Conforme</option>
            </select>
          </div>

        </div>
      </section>

      {/* MEMORIA DE CALCULO ASME e GRID DE CORROSAO */}
      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">Engenharia, Corrosão e Cálculo PMTA (ASME Section I)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Norma de Material</label>
              <select className="w-full input-field border border-gray-300 rounded px-3 py-2" value={normaCalc} onChange={e => setNormaCalc(e.target.value)}>
                <option value="ASME">Estruturas ASME Sec. II</option>
                <option value="GBT150">Aço Chinês (GB/T 150)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Material do Corpo / Tensão Admissível [S]</label>
              <select className="w-full input-field border border-gray-300 rounded px-3 py-2" value={S} onChange={e => setS(Number(e.target.value))}>
                {materiaisLista.map(m => (
                  <option key={m.nome} value={m.tensaoMPa}>{m.nome} (S = {m.tensaoMPa} MPa)</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Eficiência de Junta (E)</label>
                <input type="number" step="0.01" className="w-full input-field border border-gray-300 rounded px-3 py-2" value={E} onChange={e => setE(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Diâmetro Interno [D] (mm)</label>
                <input type="number" step="0.1" className="w-full input-field border border-gray-300 rounded px-3 py-2" value={D} onChange={e => setD(Number(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col gap-4">
            
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 text-sm mb-3 uppercase tracking-wider">Mapeamento de Ultrassom</h3>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Costado Atual (mm)</label>
                  <input type="number" step="0.1" className="w-full input-field border-orange-200 focus:ring-orange-500 rounded px-2 py-1" value={espessuraCostado} onChange={e => setEspessuraCostado(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Costado Inspeção Ant. (mm)</label>
                  <input type="number" step="0.1" className="w-full input-field border-slate-300 rounded px-2 py-1 bg-white" value={espessuraCostadoAnterior} onChange={e => setEspessuraCostadoAnterior(Number(e.target.value))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Espelho Plano Atual (mm)</label>
                  <input type="number" step="0.1" className="w-full input-field border-orange-200 focus:ring-orange-500 rounded px-2 py-1" value={espessuraEspelho} onChange={e => setEspessuraEspelho(Number(e.target.value))} />
                </div>
                {/* Taxa de corrosão */}
                <div className="bg-orange-50 p-2 rounded justify-center items-center flex flex-col border border-orange-100">
                  <span className="text-[10px] text-orange-600 font-bold uppercase text-center block">Taxa de Corrosão Média</span>
                  <span className="text-xl text-orange-700 font-black">{taxaCorrosao} <span className="text-xs">mm/ano</span></span>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500">PMTA Costado:</span>
                <span className="font-mono">{limitanteResult.pmtaLimitante.toFixed(3)} MPa</span>
              </div>
              <div className={`mt-2 p-3 rounded-lg border flex flex-col gap-1 ${limitanteResult.condena ? 'bg-red-100/50 text-red-800 border-red-300' : 'bg-emerald-100/50 text-emerald-800 border-emerald-300'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">PMTA Efetiva ASME (Limitante: {limitanteResult.componenteFragil})</span>
                  <span className="font-mono font-black text-lg">{limitanteResult.pmtaLimitante.toFixed(3)} MPa</span>
                </div>
                {limitanteResult.condena && (
                  <span className="text-xs text-red-600 font-bold mt-1">PMTA inferior à Pressão de Operação: Downgrade Mandatório.</span>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* EVIDÊNCIAS FOTOGRÁFICAS EXAME INTERNO (BLOQUEIO DE SEGURANÇA) */}
      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Evidência: Exame Interno (Mandatório)</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-2xl">
              Anexe aqui os registros fotográficos do interior da caldeira. A norma NR-13 exige que o laudo apenas seja considerado <strong className="text-emerald-700">Aprovado</strong> caso haja materialidade visual do exame das superfícies e espelhos.
            </p>
          </div>
        </div>
        
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 border-dashed">
          <UploadFotoNR13
            label="Anexar Fotos Exame Interno"
            onUpload={handleUploadFotoExameInterno}
            onPhotoUploaded={handleFotoUploaded}
            corBorda="amber"
          />
          <div className="mt-4">
             <GaleriaFotosNR13 
                fotos={fotosExameInterno.map(f => ({ url: f.url, removivel: true }))}
                onRemove={handleRemoveFoto}
             />
             {fotosExameInterno.length === 0 && (
               <p className="text-xs text-orange-600 font-semibold mt-2 text-center">
                 Nenhuma foto anexada. Laudo não poderá ser finalizado como Aprovado.
               </p>
             )}
          </div>
        </div>
      </section>

      {/* FLOAT SAVE BAR */}
      <div className="fixed bottom-0 left-[256px] right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-20 flex justify-between items-center px-10">
        <div className="flex gap-4">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
            Status Dinâmico: 
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm
              ${statusFinal === 'Aprovado' ? 'bg-emerald-500' : 
                statusFinal === 'Interditado' ? 'bg-red-700' :
                statusFinal.includes('Reprovado') ? 'bg-amber-600' : 'bg-orange-500'}
            `}>
              {statusFinal.toUpperCase()}
            </span>
          </p>
        </div>
        <button
          type="submit"
          disabled={salvando}
          className="btn-primary px-8 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow transition-colors"
        >
          {salvando ? 'Salvando Parecer...' : 'Salvar Certificado e Atualizar (NR-13)'}
        </button>
      </div>

    </form>
  )
}
