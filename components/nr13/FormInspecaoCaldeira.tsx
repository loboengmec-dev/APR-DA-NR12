'use client'

/**
 * Formulário de Inspeção de Caldeiras — NR-13 / ASME Sec. I
 * Corrigido: INSERT real, upload Storage, intervalos NR-13, PSV double-check,
 * Eficiência E dropdown, RTH, NCs, valores alinhados com banco.
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  calcularPMTACostadoCaldeira,
  calcularPMTAEspelhoPlano,
  calcularPMTACaldeiraGlobal,
  calcularTaxaCorrosaoAnual,
} from '@/lib/domain/nr13/pmta_caldeiras'
import { MATERIAIS_ASME, MATERIAIS_GBT150 } from '@/lib/domain/nr13/materiais'
import {
  uploadFotoChecklistCaldeira,
  uploadFotoExame,
  gerarUrlAssinadaNR13,
} from '@/lib/nr13/storage'
import ChecklistItemWithUpload from './ChecklistItemWithUpload'
import UploadFotoNR13 from './UploadFotoNR13'
import GaleriaFotosNR13 from './GaleriaFotosNR13'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface FotoLocal {
  url: string       // URL de preview (blob: ou signed URL já persistida)
  path?: string     // Storage path — definido após upload real
  arquivo?: File    // File object — só existe antes do upload
}

interface NC {
  descricao: string
  refNR13: string
  acaoCorretiva: string
  grauRisco: 'Crítico' | 'Moderado' | 'Baixo'
  prazo: number
  responsavel: string
  /** Marcador interno — NC gerada automaticamente a partir do checklist (não persiste no banco) */
  _auto?: boolean
}

interface FormInspecaoCaldeiraProps {
  initialData?: any
  inspecaoId?: string
}

// ---------------------------------------------------------------------------
// Constantes NR-13
// ---------------------------------------------------------------------------

/** Intervalos de inspeção periódica — NR-13 Quadro XIII */
const INTERVALOS_CALDEIRA: Record<string, { externo: number; interno: number }> = {
  A: { externo: 1, interno: 2 },
  B: { externo: 2, interno: 4 },
  C: { externo: 1, interno: 2 }, // Intermediária → mesmo critério da Categoria A (conservador)
}

function somarAnos(anos: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + anos)
  return d.toISOString().split('T')[0]
}

const EFICIENCIAS_JUNTA = [
  { label: '1,00 — Radiografada integral (Cat. A)', value: 1.0 },
  { label: '0,85 — Radiografada parcial (Cat. B)', value: 0.85 },
  { label: '0,70 — Sem radiografia (Cat. C)', value: 0.7 },
]

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function FormInspecaoCaldeira({
  initialData,
  inspecaoId: propInspecaoId,
}: FormInspecaoCaldeiraProps) {
  const router = useRouter()
  const modoEdicao = !!propInspecaoId

  // UI state
  const [salvando, setSalvando] = useState(false)
  const [exportandoPDF, setExportandoPDF] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvoComSucesso, setSalvoComSucesso] = useState(false)

  /**
   * Flag para ignorar o primeiro disparo do useEffect de cronograma.
   * No modo edição, evita sobrescrever as datas salvas no banco ao montar o componente.
   */
  const isFirstRenderCategoria = useRef(true)

  // Perfil do usuário (para PDF)
  const [perfilUsuario, setPerfilUsuario] = useState<Record<string, any>>({})

  // Seleciona todo o conteúdo ao focar em inputs numéricos — evita o problema
  // de digitar "7" e obter "07" no mobile quando o valor padrão é 0.
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const el = e.target as HTMLInputElement
      if (el.type === 'number') el.select()
    }
    document.addEventListener('focus', handleFocus, true)
    return () => document.removeEventListener('focus', handleFocus, true)
  }, [])

  // Seleção de cliente (apenas criação)
  const [clientes, setClientes] = useState<{ id: string; razao_social: string }[]>([])
  const [clienteId, setClienteId] = useState<string>(initialData?.caldeiras?.cliente_id ?? '')

  // --- Identificação da Caldeira ---
  const [tag, setTag] = useState(initialData?.tag ?? '')
  const [fabricante, setFabricante] = useState(initialData?.fabricante ?? '')
  const [numeroSerie, setNumeroSerie] = useState(initialData?.numero_serie ?? '')
  const [anoFabricacao, setAnoFabricacao] = useState<number>(initialData?.ano_fabricacao ?? new Date().getFullYear())
  const [categoria, setCategoria] = useState<string>(initialData?.categoria_caldeira ?? 'B')
  const [codigoProjeto, setCodigoProjeto] = useState(initialData?.codigo_projeto ?? 'ASME Sec. I')
  // Pressões armazenadas em kgf/cm² (unidade de exibição); convertidas para MPa/kPa apenas no save
  const [pmtaFabricante, setPmtaFabricante] = useState<number>(
    initialData?.pmta_fabricante_kpa ? +(initialData.pmta_fabricante_kpa * 0.010197).toFixed(4) : 0
  )

  // --- Dados da inspeção ---
  const [dataInspecao, setDataInspecao] = useState(initialData?.data_inspecao ?? '')
  const [dataEmissaoLaudo, setDataEmissaoLaudo] = useState(initialData?.data_emissao_laudo ?? '')
  const [tipoInspecao, setTipoInspecao] = useState(initialData?.tipo_inspecao ?? 'Periódica')
  const [ambiente, setAmbiente] = useState(initialData?.ambiente ?? 'Aberto')
  const [pressaoOperacao, setPressaoOperacao] = useState<number>(
    initialData?.pressao_operacao_mpa ? +(initialData.pressao_operacao_mpa * 10.197).toFixed(4) : 0
  )
  const [capacidadeProducao, setCapacidadeProducao] = useState<number>(initialData?.capacidade_producao_vapor ?? 0)

  // --- Checklist NR-13 ---
  const [valvulaSeguranca, setValvulaSeguranca] = useState(initialData?.teste_hidrostatico ?? 'Conforme')
  const [controleNivel, setControleNivel] = useState(initialData?.controle_nivel_intertravamento ?? 'Conforme')
  const [distanciaInstalacao, setDistanciaInstalacao] = useState(initialData?.distancia_instalacao ?? 'Conforme')
  const [iluminacaoEmergencia, setIluminacaoEmergencia] = useState(initialData?.iluminacao_emergencia ?? 'Conforme')
  const [qualidadeAgua, setQualidadeAgua] = useState(initialData?.qualidade_agua ?? 'Conforme')
  const [certificacaoOperador, setCertificacaoOperador] = useState(initialData?.certificacao_operador ?? 'Conforme')
  const [manualOperacao, setManualOperacao] = useState(initialData?.manual_operacao_ptbr ?? 'Disponível')

  // --- Parâmetros ASME ---
  const [normaCalc, setNormaCalc] = useState<'ASME' | 'GBT150'>(initialData?.norma_calculo ?? 'ASME')
  const [S, setS] = useState<number>(initialData?.material_s ?? 114.5)
  const [E, setE] = useState<number>(initialData?.eficiencia_e ?? 0.85)
  const [D, setD] = useState<number>(initialData?.diametro_d ?? 1000)
  const [espessuraCostado, setEspessuraCostado] = useState<number>(initialData?.espessura_costado ?? 10)
  const [espessuraCostadoAnterior, setEspessuraCostadoAnterior] = useState<number>(initialData?.espessura_costado_anterior ?? 10)
  const [mesesEntreInspecoes, setMesesEntreInspecoes] = useState<number>(initialData?.meses_entre_inspecoes ?? 12)
  const [espessuraEspelho, setEspessuraEspelho] = useState<number>(initialData?.espessura_espelho ?? 12)
  /**
   * d — Maior distância não suportada entre centros de tubos de fogo ou estroncas (mm).
   * ASME Section I PG-31. NÃO é o diâmetro interno da caldeira.
   * Default conservador: 200 mm (passo típico entre tubos de fogo).
   */
  const [dEspelho, setDEspelho] = useState<number>(initialData?.d_espelho_mm ?? 200)
  // String state para o campo PSV — evita loop de normalização do browser em
  // inputs type="number" com valores decimais (step vs valor armazenado).
  const [psvCalibracaoStr, setPsvCalibracaoStr] = useState<string>(
    initialData?.psv_calibracao_kpa
      ? String(+(initialData.psv_calibracao_kpa * 0.010197).toFixed(2))
      : '0'
  )
  const psvCalibracao = parseFloat(psvCalibracaoStr) || 0

  // --- Exame e parecer ---
  const [exameExterno, setExameExterno] = useState(initialData?.exame_externo ?? 'Conforme')
  const [exameInterno, setExameInterno] = useState(initialData?.exame_interno ?? 'Conforme')
  const [parecerTecnico, setParecerTecnico] = useState(initialData?.parecer_tecnico ?? '')
  const [pmtaPlh, setPmtaPlh] = useState<number>(
    initialData?.pmta_plh_kpa ? +(initialData.pmta_plh_kpa * 0.010197).toFixed(4) : 0
  )

  // --- RTH ---
  const [rthNome, setRthNome] = useState(initialData?.rth_nome ?? '')
  const [rthCrea, setRthCrea] = useState(initialData?.rth_crea ?? '')
  const [rthProfissao, setRthProfissao] = useState(initialData?.rth_profissao ?? 'Engenheiro Mecânico')

  // --- Cronograma ---
  const [dataProximaInspExterna, setDataProximaInspExterna] = useState(initialData?.proxima_inspecao_externa ?? '')
  const [dataProximaInspInterna, setDataProximaInspInterna] = useState(initialData?.proxima_inspecao_interna ?? '')
  const [dataProximoTesteDisp, setDataProximoTesteDisp] = useState(initialData?.data_proximo_teste_dispositivos ?? '')

  // --- Fotos (armazenadas como { url, path?, arquivo? }) ---
  const parseFotosIniciais = (chave: string): FotoLocal[] => {
    const raw = initialData?.fotos_exame
    if (!raw || typeof raw !== 'object') return []
    const arr = raw[chave]
    if (!Array.isArray(arr)) return []
    // Fotos existentes já têm storage path — url será gerada assincronamente
    return arr.map((p: string) => ({ url: '', path: p }))
  }

  const [fotosExameInterno, setFotosExameInterno] = useState<FotoLocal[]>(parseFotosIniciais('interno'))
  const [fotosValvulas, setFotosValvulas] = useState<FotoLocal[]>(parseFotosIniciais('valvulas'))
  const [fotosNivel, setFotosNivel] = useState<FotoLocal[]>(parseFotosIniciais('nivel'))
  const [fotosDistancia, setFotosDistancia] = useState<FotoLocal[]>(parseFotosIniciais('distanciaInstalacao'))
  const [fotosIluminacao, setFotosIluminacao] = useState<FotoLocal[]>(parseFotosIniciais('iluminacao'))
  const [fotosQualidade, setFotosQualidade] = useState<FotoLocal[]>(parseFotosIniciais('qualidadeAgua'))
  const [fotosCertificacao, setFotosCertificacao] = useState<FotoLocal[]>(parseFotosIniciais('certificacaoOperador'))

  // --- Não Conformidades ---
  const [ncs, setNcs] = useState<NC[]>([])
  const [ncAberta, setNcAberta] = useState(false)
  const [ncForm, setNcForm] = useState<NC>({
    descricao: '', refNR13: '', acaoCorretiva: '',
    grauRisco: 'Moderado', prazo: 30, responsavel: '',
  })

  // ---------------------------------------------------------------------------
  // Cálculos automáticos
  // ---------------------------------------------------------------------------

  const pmtaCalc = useMemo(() => {
    const pmtaCostado = calcularPMTACostadoCaldeira({ S, E, t: espessuraCostado, D })
    // espelho usa `d` (vão entre suportes), não D (diâmetro da carcaça) — ASME PG-31
    const pmtaEspelho = calcularPMTAEspelhoPlano({ S, E, t: espessuraEspelho, d: dEspelho })
    // pressaoOperacao está em kgf/cm² — calcularPMTACaldeiraGlobal espera MPa
    return calcularPMTACaldeiraGlobal(pmtaCostado, pmtaEspelho, pressaoOperacao / 10.197)
  }, [S, E, espessuraCostado, espessuraEspelho, D, dEspelho, pressaoOperacao])

  const pmtaCostadoMPa = useMemo(
    () => calcularPMTACostadoCaldeira({ S, E, t: espessuraCostado, D }),
    [S, E, espessuraCostado, D]
  )

  // `dEspelho` = maior vão livre entre tubos de fogo/estroncas (ASME PG-31)
  // NÃO usa D (diâmetro da carcaça) — erro clássico que subtima a PMTA real
  const pmtaEspelhoMPa = useMemo(
    () => calcularPMTAEspelhoPlano({ S, E, t: espessuraEspelho, d: dEspelho }),
    [S, E, espessuraEspelho, dEspelho]
  )

  const taxaCorrosao = useMemo(
    () => calcularTaxaCorrosaoAnual(espessuraCostadoAnterior, espessuraCostado, mesesEntreInspecoes),
    [espessuraCostadoAnterior, espessuraCostado, mesesEntreInspecoes]
  )

  // PSV double-check: psvCalibracao em kgf/cm², pmtaLimitante em MPa → converter para comparar
  const pmtaLimitanteKgf = pmtaCalc.pmtaLimitante * 10.197
  const psvViolaPMTA = psvCalibracao > 0 && psvCalibracao > pmtaLimitanteKgf

  // Status dinâmico automático
  const statusFinal = useMemo(() => {
    if (pmtaCalc.condena) return 'Reprovado — Downgrade Necessário'
    if (controleNivel === 'Inexistente' || valvulaSeguranca === 'Não Conforme') return 'Interditado'
    if (
      distanciaInstalacao !== 'Conforme' ||
      iluminacaoEmergencia !== 'Conforme' ||
      qualidadeAgua !== 'Conforme' ||
      certificacaoOperador !== 'Conforme' ||
      manualOperacao !== 'Disponível'
    ) return 'Aprovado com Restrições'
    return 'Aprovado'
  }, [pmtaCalc.condena, controleNivel, valvulaSeguranca, distanciaInstalacao, iluminacaoEmergencia, qualidadeAgua, certificacaoOperador, manualOperacao])

  const rgiAtivo = controleNivel === 'Inexistente' || valvulaSeguranca === 'Não Conforme'

  // Cronograma automático por categoria
  // No modo edição, o primeiro disparo (montagem) é ignorado para preservar
  // as datas já salvas no banco. Disparos subsequentes (mudança de categoria
  // pelo usuário) atualizam normalmente.
  useEffect(() => {
    if (isFirstRenderCategoria.current) {
      isFirstRenderCategoria.current = false
      if (modoEdicao) return  // preservar datas do banco na carga inicial
    }
    const intervalos = INTERVALOS_CALDEIRA[categoria]
    if (!intervalos) return
    setDataProximaInspExterna(somarAnos(intervalos.externo))
    setDataProximaInspInterna(somarAnos(intervalos.interno))
    setDataProximoTesteDisp(somarAnos(1))
  }, [categoria, modoEdicao])

  // ---------------------------------------------------------------------------
  // Auto-geração de NCs a partir dos resultados do checklist (Seções 3 e 5)
  // Quando um item passa a "Não Conforme"/"Inexistente", uma NC pré-preenchida
  // é inserida automaticamente. Quando volta a "Conforme", é removida.
  // NCs manuais (sem _auto) nunca são tocadas por este efeito.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const autoNcs: NC[] = []

    if (valvulaSeguranca === 'Não Conforme') {
      autoNcs.push({
        descricao: 'Válvulas de Segurança e Alívio (PSV/VSA) não conformes',
        refNR13: '§13.4.1.1',
        acaoCorretiva: 'Recalibrar ou substituir as válvulas de segurança e alívio conforme ASME Sec. I e NR-13',
        grauRisco: 'Crítico', prazo: 7, responsavel: '', _auto: true,
      })
    }

    if (controleNivel === 'Não Conforme') {
      autoNcs.push({
        descricao: 'Controle de Nível Automático e Intertravamento não conforme',
        refNR13: '§13.4.1.2',
        acaoCorretiva: 'Reparar/calibrar o sistema de intertravamento de baixo nível de água',
        grauRisco: 'Crítico', prazo: 3, responsavel: '', _auto: true,
      })
    }

    if (controleNivel === 'Inexistente') {
      autoNcs.push({
        descricao: 'Controle de Nível Automático e Intertravamento INEXISTENTE — Risco Grave e Iminente',
        refNR13: '§13.4.1.2',
        acaoCorretiva: 'Interdição imediata. Instalar sistema de intertravamento antes de retornar à operação',
        grauRisco: 'Crítico', prazo: 0, responsavel: '', _auto: true,
      })
    }

    if (distanciaInstalacao === 'Não Conforme') {
      autoNcs.push({
        descricao: 'Distanciamento frontal da Casa de Caldeiras inferior ao mínimo de 3 m',
        refNR13: '§13.4.2.1',
        acaoCorretiva: 'Adequar o espaço frontal para mínimo 3 metros livres e saídas desobstruídas',
        grauRisco: 'Moderado', prazo: 30, responsavel: '', _auto: true,
      })
    }

    if (iluminacaoEmergencia === 'Não Conforme') {
      autoNcs.push({
        descricao: 'Iluminação de Emergência ausente ou inadequada na Casa de Caldeiras',
        refNR13: '§13.4.2.2',
        acaoCorretiva: 'Instalar/revisar sistema de iluminação de emergência que garanta fuga segura e leitura de instrumentos',
        grauRisco: 'Moderado', prazo: 15, responsavel: '', _auto: true,
      })
    }

    if (qualidadeAgua === 'Não Conforme') {
      autoNcs.push({
        descricao: 'Gestão de Qualidade da Água de Alimentação não conforme',
        refNR13: '§13.4.3',
        acaoCorretiva: 'Implantar controle químico contínuo: pH, condutividade, dureza, O₂ dissolvido e sílica',
        grauRisco: 'Moderado', prazo: 30, responsavel: '', _auto: true,
      })
    }

    if (certificacaoOperador === 'Não Conforme') {
      autoNcs.push({
        descricao: 'Operador de Caldeira sem certificação/habilitação exigida',
        refNR13: '§13.4.4',
        acaoCorretiva: 'Providenciar treinamento e habilitação do operador conforme norma pertinente antes da próxima operação',
        grauRisco: 'Moderado', prazo: 60, responsavel: '', _auto: true,
      })
    }

    if (exameExterno === 'Não Conforme') {
      autoNcs.push({
        descricao: 'Exame Externo revelou não conformidades na integridade da caldeira',
        refNR13: '§13.5.4.11',
        acaoCorretiva: 'Sanar não conformidades externas identificadas: pintura, isolamento, suportes e acessórios',
        grauRisco: 'Moderado', prazo: 30, responsavel: '', _auto: true,
      })
    }

    if (exameInterno === 'Não Conforme') {
      autoNcs.push({
        descricao: 'Exame Interno revelou não conformidades estruturais na caldeira',
        refNR13: '§13.5.4.11',
        acaoCorretiva: 'Executar reparos nos pontos identificados no exame interno conforme ASME Sec. I e reinspeção obrigatória',
        grauRisco: 'Crítico', prazo: 30, responsavel: '', _auto: true,
      })
    }

    setNcs(prev => {
      const manuais = prev.filter(nc => !nc._auto)
      return [...manuais, ...autoNcs]
    })
  }, [valvulaSeguranca, controleNivel, distanciaInstalacao, iluminacaoEmergencia, qualidadeAgua, certificacaoOperador, exameExterno, exameInterno])

  // ---------------------------------------------------------------------------
  // Carregamentos iniciais
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // Perfil do usuário para o PDF
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('usuarios').select('nome,crea,logo_url').eq('id', user.id).single()
        .then(({ data }) => { if (data) setPerfilUsuario(data) })
    })
  }, [])

  // Carrega lista de clientes (apenas para criação)
  useEffect(() => {
    if (modoEdicao) return
    const supabase = createClient()
    supabase.from('clientes').select('id, razao_social').order('razao_social')
      .then(({ data }) => { if (data) setClientes(data) })
  }, [modoEdicao])

  // Gera URLs assinadas para fotos existentes (modo edição)
  useEffect(() => {
    if (!modoEdicao) return

    async function gerarUrls(fotos: FotoLocal[], setter: (f: FotoLocal[]) => void) {
      const atualizadas = await Promise.all(
        fotos.map(async (f) => {
          if (f.path && !f.url) {
            const url = await gerarUrlAssinadaNR13(f.path)
            return { ...f, url: url ?? '' }
          }
          return f
        })
      )
      setter(atualizadas)
    }

    gerarUrls(fotosExameInterno, setFotosExameInterno)
    gerarUrls(fotosValvulas, setFotosValvulas)
    gerarUrls(fotosNivel, setFotosNivel)
    gerarUrls(fotosDistancia, setFotosDistancia)
    gerarUrls(fotosIluminacao, setFotosIluminacao)
    gerarUrls(fotosQualidade, setFotosQualidade)
    gerarUrls(fotosCertificacao, setFotosCertificacao)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoEdicao])

  // ---------------------------------------------------------------------------
  // Helpers de upload de fotos
  // ---------------------------------------------------------------------------

  function handleFotoChecklist(setter: React.Dispatch<React.SetStateAction<FotoLocal[]>>) {
    return async (file: File) => {
      const url = URL.createObjectURL(file)
      setter(prev => [...prev, { url, arquivo: file }])
      return { path: 'pending', error: null }
    }
  }

  function handleChangeFotos(setter: React.Dispatch<React.SetStateAction<FotoLocal[]>>) {
    return (fotos: any[]) => setter(fotos as FotoLocal[])
  }

  // Faz upload real de todas as fotos com arquivo pendente
  async function uploadFotosPendentes(
    fotos: FotoLocal[],
    tipo: string,
    inspecaoId: string
  ): Promise<string[]> {
    const paths: string[] = []
    for (let i = 0; i < fotos.length; i++) {
      const foto = fotos[i]
      if (foto.path && foto.path !== 'pending' && !foto.arquivo) {
        // Foto já persistida no storage
        paths.push(foto.path)
      } else if (foto.arquivo) {
        const { path, error } = await uploadFotoChecklistCaldeira(foto.arquivo, inspecaoId, tipo, i)
        if (!error && path) paths.push(path)
      }
    }
    return paths
  }

  // ---------------------------------------------------------------------------
  // Salvar
  // ---------------------------------------------------------------------------

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    // Validações críticas
    if (!tag.trim()) { setErro('TAG da caldeira é obrigatória.'); return }
    if (!modoEdicao && !clienteId) { setErro('Selecione o cliente vinculado à caldeira.'); return }
    if (psvViolaPMTA) {
      setErro(`⚠️ BLOQUEIO DE SEGURANÇA: PSV de calibração (${psvCalibracao.toFixed(2)} kgf/cm²) é SUPERIOR à PMTA calculada (${pmtaLimitanteKgf.toFixed(2)} kgf/cm²). Corrija antes de salvar.`)
      return
    }

    setSalvando(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      let inspecaoId = propInspecaoId ?? ''

      if (!modoEdicao) {
        // 1. Criar caldeira (se nova inspeção)
        const { data: novaCaldeira, error: errCaldeira } = await supabase
          .from('caldeiras')
          .insert({
            cliente_id: clienteId,
            tag,
            fabricante,
            numero_serie: numeroSerie,
            ano_fabricacao: anoFabricacao,
            categoria_caldeira: categoria,
            codigo_projeto: codigoProjeto,
            pmta_fabricante_kpa: +(pmtaFabricante * 98.0665).toFixed(2),  // kgf/cm² → kPa
          })
          .select('id')
          .single()

        if (errCaldeira || !novaCaldeira) throw new Error('Erro ao criar caldeira: ' + errCaldeira?.message)

        // 2. Criar inspeção (payload sem fotos — fotos vêm depois)
        const { data: novaInspecao, error: errInsp } = await supabase
          .from('inspecoes_caldeiras')
          .insert({
            caldeira_id: novaCaldeira.id,
            tag,
            fabricante,
            numero_serie: numeroSerie,
            ano_fabricacao: anoFabricacao,
            categoria_caldeira: categoria,
            codigo_projeto: codigoProjeto,
            pmta_fabricante_kpa: +(pmtaFabricante * 98.0665).toFixed(2),  // kgf/cm² → kPa
            data_inspecao: dataInspecao || null,
            data_emissao_laudo: dataEmissaoLaudo || null,
            tipo_inspecao: tipoInspecao,
            ambiente,
            pressao_operacao_mpa: +(pressaoOperacao / 10.197).toFixed(6), // kgf/cm² → MPa
            capacidade_producao_vapor: capacidadeProducao,
            controle_nivel_intertravamento: controleNivel,
            distancia_instalacao: distanciaInstalacao,
            iluminacao_emergencia: iluminacaoEmergencia,
            manual_operacao_ptbr: manualOperacao,
            qualidade_agua: qualidadeAgua,
            certificacao_operador: certificacaoOperador,
            teste_hidrostatico: valvulaSeguranca,
            exame_externo: exameExterno,
            exame_interno: exameInterno,
            norma_calculo: normaCalc,
            material_s: S,
            eficiencia_e: E,
            diametro_d: D,
            espessura_costado: espessuraCostado,
            espessura_costado_anterior: espessuraCostadoAnterior,
            meses_entre_inspecoes: mesesEntreInspecoes,
            espessura_espelho: espessuraEspelho,
            d_espelho_mm: dEspelho,
            psv_calibracao_kpa: +(psvCalibracao * 98.0665).toFixed(2),    // kgf/cm² → kPa
            pmta_asme_kpa: +(pmtaCalc.pmtaLimitante * 1000).toFixed(2),
            pmta_plh_kpa: pmtaPlh
              ? +(pmtaPlh * 98.0665).toFixed(2)                           // kgf/cm² → kPa
              : +(pmtaCalc.pmtaLimitante * 1000).toFixed(2),
            status_final: statusFinal,
            status_seguranca: rgiAtivo ? 'Risco_Grave_Iminente' : 'Conforme',
            proxima_inspecao_externa: dataProximaInspExterna || null,
            proxima_inspecao_interna: dataProximaInspInterna || null,
            data_proximo_teste_dispositivos: dataProximoTesteDisp || null,
            parecer_tecnico: parecerTecnico,
            rth_nome: rthNome,
            rth_crea: rthCrea,
            rth_profissao: rthProfissao,
          })
          .select('id')
          .single()

        if (errInsp || !novaInspecao) throw new Error('Erro ao criar inspeção: ' + errInsp?.message)
        inspecaoId = novaInspecao.id
      }

      // 3. Upload real de todas as fotos
      const [
        pathsInterno,
        pathsValvulas,
        pathsNivel,
        pathsDistancia,
        pathsIluminacao,
        pathsQualidade,
        pathsCertificacao,
      ] = await Promise.all([
        uploadFotosPendentes(fotosExameInterno, 'interno', inspecaoId),
        uploadFotosPendentes(fotosValvulas, 'valvulas', inspecaoId),
        uploadFotosPendentes(fotosNivel, 'nivel', inspecaoId),
        uploadFotosPendentes(fotosDistancia, 'distanciaInstalacao', inspecaoId),
        uploadFotosPendentes(fotosIluminacao, 'iluminacao', inspecaoId),
        uploadFotosPendentes(fotosQualidade, 'qualidadeAgua', inspecaoId),
        uploadFotosPendentes(fotosCertificacao, 'certificacaoOperador', inspecaoId),
      ])

      const fotosExameJson = {
        interno: pathsInterno,
        valvulas: pathsValvulas,
        nivel: pathsNivel,
        distanciaInstalacao: pathsDistancia,
        iluminacao: pathsIluminacao,
        qualidadeAgua: pathsQualidade,
        certificacaoOperador: pathsCertificacao,
      }

      // 4. Atualizar inspeção com fotos e demais dados (criação + edição)
      // Converte pressões de kgf/cm² (estado UI) para as unidades das colunas do banco
      const payloadUpdate = {
        tag,
        fabricante,
        numero_serie: numeroSerie,
        ano_fabricacao: anoFabricacao,
        categoria_caldeira: categoria,
        codigo_projeto: codigoProjeto,
        pmta_fabricante_kpa: +(pmtaFabricante * 98.0665).toFixed(2),
        data_inspecao: dataInspecao || null,
        data_emissao_laudo: dataEmissaoLaudo || null,
        tipo_inspecao: tipoInspecao,
        ambiente,
        pressao_operacao_mpa: +(pressaoOperacao / 10.197).toFixed(6),
        capacidade_producao_vapor: capacidadeProducao,
        controle_nivel_intertravamento: controleNivel,
        distancia_instalacao: distanciaInstalacao,
        iluminacao_emergencia: iluminacaoEmergencia,
        manual_operacao_ptbr: manualOperacao,
        qualidade_agua: qualidadeAgua,
        certificacao_operador: certificacaoOperador,
        teste_hidrostatico: valvulaSeguranca,
        exame_externo: exameExterno,
        exame_interno: exameInterno,
        fotos_exame: fotosExameJson,
        norma_calculo: normaCalc,
        material_s: S,
        eficiencia_e: E,
        diametro_d: D,
        espessura_costado: espessuraCostado,
        espessura_costado_anterior: espessuraCostadoAnterior,
        meses_entre_inspecoes: mesesEntreInspecoes,
        espessura_espelho: espessuraEspelho,
        d_espelho_mm: dEspelho,
        psv_calibracao_kpa: +(psvCalibracao * 98.0665).toFixed(2),
        pmta_asme_kpa: +(pmtaCalc.pmtaLimitante * 1000).toFixed(2),
        pmta_plh_kpa: pmtaPlh
          ? +(pmtaPlh * 98.0665).toFixed(2)
          : +(pmtaCalc.pmtaLimitante * 1000).toFixed(2),
        status_final: statusFinal,
        status_seguranca: rgiAtivo ? 'Risco_Grave_Iminente' : 'Conforme',
        proxima_inspecao_externa: dataProximaInspExterna || null,
        proxima_inspecao_interna: dataProximaInspInterna || null,
        data_proximo_teste_dispositivos: dataProximoTesteDisp || null,
        parecer_tecnico: parecerTecnico,
        rth_nome: rthNome,
        rth_crea: rthCrea,
        rth_profissao: rthProfissao,
      }

      const { error: errUpdate } = await supabase
        .from('inspecoes_caldeiras')
        .update(payloadUpdate)
        .eq('id', inspecaoId)

      if (errUpdate) throw new Error('Erro ao atualizar inspeção: ' + errUpdate.message)

      // 5. Inserir NCs (apenas se houver novas em modo criação)
      if (ncs.length > 0) {
        const { error: errNcs } = await supabase
          .from('ncs_caldeiras')
          .insert(
            ncs.map((nc, i) => ({
              inspecao_id: inspecaoId,
              descricao: nc.descricao,
              ref_nr13: nc.refNR13,
              acao_corretiva: nc.acaoCorretiva,
              grau_risco: nc.grauRisco,
              prazo_dias: nc.prazo,
              responsavel: nc.responsavel,
              ordem: i,
            }))
          )
        if (errNcs) console.warn('Aviso: erro ao inserir NCs:', errNcs.message)
      }

      if (modoEdicao) {
        // Edição: permanecer na página e exibir confirmação
        setSalvoComSucesso(true)
        setTimeout(() => setSalvoComSucesso(false), 5000)
      } else {
        // Criação: navegar para a página de edição do registro recém-criado
        router.push(`/laudos/nr13/caldeiras/${inspecaoId}`)
      }
    } catch (err: any) {
      setErro(err.message ?? 'Erro ao salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Exportar PDF
  // ---------------------------------------------------------------------------

  async function handleExportarPDF() {
    if (!propInspecaoId) {
      alert('Salve a inspeção antes de exportar o PDF para garantir que os dados sejam persistidos.')
      return
    }
    setExportandoPDF(true)
    try {
      const fotosUrlMap: Record<string, string> = {}

      // Gera URLs assinadas para todas as fotos com path real
      const gerarUrlsGrupo = async (fotos: FotoLocal[], chave: string) => {
        for (let i = 0; i < fotos.length; i++) {
          const foto = fotos[i]
          if (foto.path && foto.path !== 'pending') {
            const url = await gerarUrlAssinadaNR13(foto.path)
            if (url) fotosUrlMap[`${chave}_${i}`] = url
          } else if (foto.url && !foto.url.startsWith('blob:')) {
            fotosUrlMap[`${chave}_${i}`] = foto.url
          }
        }
      }

      await Promise.all([
        gerarUrlsGrupo(fotosExameInterno, 'interno'),
        gerarUrlsGrupo(fotosValvulas, 'valvulas'),
        gerarUrlsGrupo(fotosNivel, 'nivel'),
        gerarUrlsGrupo(fotosDistancia, 'distanciaInstalacao'),
        gerarUrlsGrupo(fotosIluminacao, 'iluminacao'),
        gerarUrlsGrupo(fotosQualidade, 'qualidadeAgua'),
        gerarUrlsGrupo(fotosCertificacao, 'certificacaoOperador'),
      ])

      const resposta = await fetch('/api/caldeira-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dados: {
            tag, fabricante, numeroSerie, anoFabricacao, categoria, codigoProjeto,
            pmtaFabricante, dataInspecao, dataEmissaoLaudo, tipoInspecao, ambiente,
            pressaoOperacao, capacidadeProducao,
            valvulaSeguranca, controleNivel, distanciaInstalacao, iluminacaoEmergencia,
            qualidadeAgua, certificacaoOperador, manualOperacao,
            normaCalc, S, E, D, dEspelho, espessuraCostado, espessuraCostadoAnterior,
            mesesEntreInspecoes, espessuraEspelho,
            // pressaoOperacao, pmtaFabricante, psvCalibracao já estão acima em kgf/cm²
            // PMTA calculados: converter MPa → kgf/cm² para o PDF exibir diretamente
            pmtaCostado: +(pmtaCostadoMPa * 10.197).toFixed(2),
            pmtaEspelho: +(pmtaEspelhoMPa * 10.197).toFixed(2),
            pmtaLimitante: +pmtaLimitanteKgf.toFixed(2),
            componenteFragil: pmtaCalc.componenteFragil,
            taxaCorrosao,
            exameExterno, exameInterno,
            parecerTecnico, pmtaPlh, statusFinal, rgiAtivo,
            rthNome, rthCrea, rthProfissao,
            dataProximaInspExterna, dataProximaInspInterna, dataProximoTesteDisp,
            naoConformidades: ncs,
          },
          perfil: perfilUsuario,
          fotosUrl: fotosUrlMap,
        }),
      })

      if (!resposta.ok) throw new Error('Erro ao gerar PDF')

      const blob = await resposta.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Caldeira_NR13_${tag || 'caldeira'}_${dataInspecao || new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erro ao exportar PDF:', err)
      alert('Erro ao gerar o PDF. Verifique o console.')
    } finally {
      setExportandoPDF(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const materiaisLista = normaCalc === 'ASME' ? MATERIAIS_ASME : MATERIAIS_GBT150

  return (
    <form onSubmit={handleSalvar} className="space-y-8 pb-32">

      {/* Sucesso ao salvar */}
      {salvoComSucesso && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 shadow-sm flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span><strong>Salvo com sucesso!</strong> Todos os dados foram atualizados.</span>
        </div>
      )}

      {/* Erros */}
      {erro && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 shadow-sm">
          <strong>Atenção:</strong> {erro}
        </div>
      )}

      {/* PSV warning */}
      {psvViolaPMTA && (
        <div className="bg-red-100 border-2 border-red-500 text-red-800 p-4 rounded-xl font-bold">
          ⚠️ ALERTA NR-13: PSV ({psvCalibracao.toFixed(2)} kgf/cm²) &gt; PMTA calculada ({pmtaLimitanteKgf.toFixed(2)} kgf/cm²). Salvar bloqueado!
        </div>
      )}

      {/* ================================================================
          SEÇÃO 1: IDENTIFICAÇÃO
      ================================================================ */}
      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">
          1. Identificação da Caldeira
        </h2>

        {/* Seleção de cliente (apenas criação) */}
        {!modoEdicao && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:outline-none"
              value={clienteId}
              onChange={e => setClienteId(e.target.value)}
              required
            >
              <option value="">— Selecione o cliente —</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.razao_social}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">TAG <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={tag} onChange={e => setTag(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Fabricante</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={fabricante} onChange={e => setFabricante(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Número de Série</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={numeroSerie} onChange={e => setNumeroSerie(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Ano de Fabricação</label>
            <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={anoFabricacao} onChange={e => setAnoFabricacao(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria NR-13</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={categoria} onChange={e => setCategoria(e.target.value)}>
              <option value="A">A — Pressão ≥ 1960 kPa</option>
              <option value="B">B — Pressão ≤ 588 kPa</option>
              <option value="C">C — Intermediária</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Código de Projeto</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={codigoProjeto} onChange={e => setCodigoProjeto(e.target.value)}>
              <option value="ASME Sec. I">ASME Section I</option>
              <option value="ASME Sec. IV">ASME Section IV</option>
              <option value="GB/T">GB/T</option>
              <option value="DIN">DIN</option>
              <option value="Desconhecido">Desconhecido</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">PMTA Fabricante (kgf/cm²)</label>
            <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={pmtaFabricante} onChange={e => setPmtaFabricante(Number(e.target.value))} />
          </div>
        </div>
      </section>

      {/* ================================================================
          SEÇÃO 2: DADOS DA INSPEÇÃO
      ================================================================ */}
      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">
          2. Dados da Inspeção
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Data da Inspeção</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={dataInspecao} onChange={e => setDataInspecao(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Data de Emissão do Laudo</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={dataEmissaoLaudo} onChange={e => setDataEmissaoLaudo(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Inspeção</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={tipoInspecao} onChange={e => setTipoInspecao(e.target.value)}>
              <option>Inicial</option>
              <option>Periódica</option>
              <option>Extraordinária</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Ambiente</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={ambiente} onChange={e => setAmbiente(e.target.value)}>
              <option>Aberto</option>
              <option>Fechado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Pressão de Operação (kgf/cm²)</label>
            <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={pressaoOperacao} onChange={e => setPressaoOperacao(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Capacidade de Produção (kg/h)</label>
            <input type="number" step="0.1" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={capacidadeProducao} onChange={e => setCapacidadeProducao(Number(e.target.value))} />
          </div>
        </div>
      </section>

      {/* ================================================================
          SEÇÃO 3: CHECKLIST NR-13
      ================================================================ */}
      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">
          3. Auditoria Normativa (NR-13 §13.4)
        </h2>
        <div className="space-y-4">

          <ChecklistItemWithUpload
            uid="valvulas"
            titulo="Válvulas de Segurança e Alívio (PSV/VSA)"
            descricao="Pressão de abertura ajustada ≤ PMTA; integridade física das molas e selo. §13.4.1.1"
            valor={valvulaSeguranca}
            onChangeValor={setValvulaSeguranca}
            opcoes={[
              { value: 'Conforme', label: 'Conforme' },
              { value: 'Não Conforme', label: 'Não Conforme (Risco Grave)' },
            ]}
            fotos={fotosValvulas}
            onChangeFotos={handleChangeFotos(setFotosValvulas)}
            alertGrave={valvulaSeguranca === 'Não Conforme'}
            alertMensagem="⚠️ Risco Grave e Iminente — Interdição mandatória"
          />

          <ChecklistItemWithUpload
            uid="nivel"
            titulo="Controle de Nível Automático e Intertravamento"
            descricao="Sistema de intertravamento para baixo nível de água. Exigência mandatória §13.4.1.2."
            valor={controleNivel}
            onChangeValor={setControleNivel}
            opcoes={[
              { value: 'Conforme', label: 'Conforme' },
              { value: 'Não Conforme', label: 'Não Conforme' },
              { value: 'Inexistente', label: 'Inexistente (RGI)' },
            ]}
            fotos={fotosNivel}
            onChangeFotos={handleChangeFotos(setFotosNivel)}
            alertGrave={controleNivel === 'Inexistente'}
            alertMensagem="⚠️ RGI Acionado — Interdição imediata obrigatória"
          />

          <ChecklistItemWithUpload
            uid="distancia"
            titulo="Distanciamento da Casa de Caldeiras (≥ 3 m)"
            descricao="Área frontal com no mínimo 3 metros livres e saídas desobstruídas. §13.4.2.1"
            valor={distanciaInstalacao}
            onChangeValor={setDistanciaInstalacao}
            opcoes={[
              { value: 'Conforme', label: 'Conforme' },
              { value: 'Não Conforme', label: 'Não Conforme' },
              { value: 'Dispensa Legal', label: 'Dispensa Legal' },
            ]}
            fotos={fotosDistancia}
            onChangeFotos={handleChangeFotos(setFotosDistancia)}
          />

          <ChecklistItemWithUpload
            uid="iluminacao"
            titulo="Iluminação de Emergência"
            descricao="Garante fuga segura e leitura de instrumentos em blackout. §13.4.2.2"
            valor={iluminacaoEmergencia}
            onChangeValor={setIluminacaoEmergencia}
            opcoes={[
              { value: 'Conforme', label: 'Conforme' },
              { value: 'Não Conforme', label: 'Não Conforme' },
            ]}
            fotos={fotosIluminacao}
            onChangeFotos={handleChangeFotos(setFotosIluminacao)}
          />

          <ChecklistItemWithUpload
            uid="qualidade-agua"
            titulo="Gestão de Qualidade da Água de Alimentação"
            descricao="Controle químico para prevenir incrustações e corrosão focal. §13.4.3"
            valor={qualidadeAgua}
            onChangeValor={setQualidadeAgua}
            opcoes={[
              { value: 'Conforme', label: 'Conforme' },
              { value: 'Não Conforme', label: 'Não Conforme' },
            ]}
            fotos={fotosQualidade}
            onChangeFotos={handleChangeFotos(setFotosQualidade)}
          />

          <ChecklistItemWithUpload
            uid="certificacao"
            titulo="Certificação do Operador de Caldeira"
            descricao="Operadores habilitados e documentados conforme norma pertinente. §13.4.4"
            valor={certificacaoOperador}
            onChangeValor={setCertificacaoOperador}
            opcoes={[
              { value: 'Conforme', label: 'Conforme' },
              { value: 'Não Conforme', label: 'Não Conforme' },
            ]}
            fotos={fotosCertificacao}
            onChangeFotos={handleChangeFotos(setFotosCertificacao)}
          />

          <div className="flex flex-col p-4 bg-gray-50 border border-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">Manual de Operação em Português</p>
                <p className="text-xs text-gray-500 mt-0.5">Manual disponível no local de operação. §13.4.5</p>
              </div>
              <select
                className="border border-gray-300 rounded px-3 py-2 text-sm w-48"
                value={manualOperacao}
                onChange={e => setManualOperacao(e.target.value)}
              >
                <option value="Disponível">Disponível</option>
                <option value="Ausente">Ausente</option>
              </select>
            </div>
          </div>

        </div>
      </section>

      {/* ================================================================
          SEÇÃO 4: CÁLCULO ASME + CORROSÃO
      ================================================================ */}
      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">
          4. Engenharia — PMTA e Corrosão (ASME Section I)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Parâmetros */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Norma de Material</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={normaCalc} onChange={e => setNormaCalc(e.target.value as any)}>
                <option value="ASME">ASME Sec. II</option>
                <option value="GBT150">GB/T 150 (Aço Chinês)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Material — Tensão Admissível [S]</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={S} onChange={e => setS(Number(e.target.value))}>
                {materiaisLista.map(m => (
                  <option key={m.nome} value={m.tensaoMPa}>{m.nome} — S = {m.tensaoMPa} MPa</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Eficiência de Junta [E]</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={E} onChange={e => setE(Number(e.target.value))}>
                {EFICIENCIAS_JUNTA.map(ef => (
                  <option key={ef.value} value={ef.value}>{ef.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Diâmetro Interno [D] (mm)</label>
              <input type="number" step="1" min="100" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={D} onChange={e => setD(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                PSV — Pressão de Calibração (kgf/cm²)
                {psvViolaPMTA && <span className="text-red-600 ml-2 font-bold">⚠️ &gt; PMTA!</span>}
              </label>
              <input
                type="text"
                inputMode="decimal"
                className={`w-full border rounded-lg px-3 py-2 ${psvViolaPMTA ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                value={psvCalibracaoStr}
                onChange={e => setPsvCalibracaoStr(e.target.value.replace(',', '.'))}
              />
              <p className="text-xs text-gray-400 mt-1">
                PMTA calculada: {pmtaLimitanteKgf.toFixed(2)} kgf/cm² — PSV deve ser ≤ PMTA
              </p>
            </div>
          </div>

          {/* Mapeamento de espessura e PMTA */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Mapeamento de Ultrassom
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Costado — Espessura Atual (mm)</label>
                <input type="number" step="0.1" min="0.1"
                  className="w-full border border-orange-200 rounded px-2 py-1 focus:ring-orange-400 focus:outline-none"
                  value={espessuraCostado} onChange={e => setEspessuraCostado(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Costado — Espessura Anterior (mm)</label>
                <input type="number" step="0.1" min="0.1"
                  className="w-full border border-slate-300 rounded px-2 py-1"
                  value={espessuraCostadoAnterior} onChange={e => setEspessuraCostadoAnterior(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Espelho Plano — Espessura Atual (mm)</label>
                <input type="number" step="0.1" min="0.1"
                  className="w-full border border-orange-200 rounded px-2 py-1 focus:ring-orange-400 focus:outline-none"
                  value={espessuraEspelho} onChange={e => setEspessuraEspelho(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Meses entre inspeções</label>
                <input type="number" step="1" min="1"
                  className="w-full border border-slate-300 rounded px-2 py-1"
                  value={mesesEntreInspecoes} onChange={e => setMesesEntreInspecoes(Number(e.target.value))} />
              </div>

              {/* Campo crítico: d do PG-31 — ocupa linha inteira para destaque */}
              <div className="col-span-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <label className="text-xs font-semibold text-orange-700">
                    Maior Distância entre Suportes — <em>d</em> (mm) <span className="text-red-500">*</span>
                  </label>
                  {/* Tooltip inline */}
                  <div className="group relative">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-100 text-orange-600 text-xs font-bold cursor-help select-none">?</span>
                    <div className="pointer-events-none absolute left-6 top-0 z-10 w-72 rounded-lg bg-slate-800 text-white text-xs p-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
                      <p className="font-bold mb-1">ASME Section I — PG-31</p>
                      <p>Insira o <strong>maior vão livre entre centros de tubos de fogo, estroncas ou suportes</strong> adjacentes no espelho.</p>
                      <p className="mt-1.5 text-orange-300 font-semibold">⚠️ Não use o diâmetro total da caldeira — isso resultaria em PMTA artificialmente baixa e incorreta.</p>
                      <p className="mt-1.5 text-slate-300">Valor típico em caldeiras fire-tube: 100–350 mm (passo dos tubos).</p>
                    </div>
                  </div>
                </div>
                <input
                  type="number" step="1" min="10"
                  className="w-full border-2 border-orange-300 rounded px-2 py-1.5 bg-orange-50 focus:ring-orange-400 focus:outline-none font-semibold text-orange-900"
                  value={dEspelho}
                  onChange={e => setDEspelho(Number(e.target.value))}
                />
                <p className="text-xs text-orange-600 mt-0.5">
                  C = 0,33 fixo (espelhos soldados — ASME PG-31)
                </p>
              </div>
            </div>

            {/* Resultados PMTA (unidade: kgf/cm²) */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">PMTA Costado (PG-27.2.2):</span>
                <span className="font-mono font-semibold">{(pmtaCostadoMPa * 10.197).toFixed(2)} kgf/cm²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PMTA Espelho Plano (PG-31):</span>
                <span className="font-mono font-semibold">{(pmtaEspelhoMPa * 10.197).toFixed(2)} kgf/cm²</span>
              </div>
              <div className={`mt-2 p-3 rounded-lg border flex items-center justify-between ${pmtaCalc.condena ? 'bg-red-100 border-red-300 text-red-800' : 'bg-emerald-100 border-emerald-300 text-emerald-800'}`}>
                <div>
                  <p className="font-bold text-sm">PMTA Efetiva (limitada pelo {pmtaCalc.componenteFragil})</p>
                  {pmtaCalc.condena && <p className="text-xs font-bold mt-1">PMTA &lt; Pressão de Operação — Downgrade obrigatório!</p>}
                </div>
                <span className="font-mono font-black text-xl">{(pmtaCalc.pmtaLimitante * 10.197).toFixed(2)} kgf/cm²</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SEÇÃO 5: EXAME INTERNO (FOTO OBRIGATÓRIA)
      ================================================================ */}
      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">5. Evidência — Exame Interno (Obrigatório)</h2>
        <p className="text-sm text-gray-500 mb-4">
          Registros fotográficos do interior da caldeira. O laudo só pode ser <strong className="text-emerald-700">Aprovado</strong> com materialidade visual do exame.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Resultado Exame Externo</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={exameExterno} onChange={e => setExameExterno(e.target.value)}>
              <option>Conforme</option>
              <option>Não Conforme</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Resultado Exame Interno</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={exameInterno} onChange={e => setExameInterno(e.target.value)}>
              <option>Conforme</option>
              <option>Não Conforme</option>
              <option>Não Aplicável</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-dashed border-slate-200">
          <UploadFotoNR13
            label="Anexar Fotos do Exame Interno"
            onUpload={handleFotoChecklist(setFotosExameInterno)}
            onPhotoUploaded={() => {}}
            corBorda="amber"
          />
          <div className="mt-4">
            <GaleriaFotosNR13
              fotos={fotosExameInterno.map(f => ({ url: f.url, removivel: true }))}
              onRemove={(i) => setFotosExameInterno(prev => prev.filter((_, idx) => idx !== i))}
            />
            {fotosExameInterno.length === 0 && (
              <p className="text-xs text-orange-600 font-semibold mt-2 text-center">
                ⚠️ Nenhuma foto. O laudo não poderá ser Aprovado sem evidência fotográfica.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ================================================================
          SEÇÃO 6: NÃO CONFORMIDADES
      ================================================================ */}
      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">6. Não Conformidades (NR-13 §13.5.4.11j)</h2>
          <button
            type="button"
            onClick={() => setNcAberta(true)}
            className="text-sm px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            + Adicionar NC
          </button>
        </div>

        {ncs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma não conformidade registrada.</p>
        ) : (
          <div className="space-y-3">
            {ncs.map((nc, i) => (
              <div key={i} className={`flex items-start justify-between p-3 rounded-lg border ${nc._auto ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${nc.grauRisco === 'Crítico' ? 'bg-red-600' : nc.grauRisco === 'Moderado' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                      {nc.grauRisco}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">{nc.refNR13}</span>
                    {nc._auto && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-200 text-amber-800">Auto</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">{nc.descricao}</p>
                  <p className="text-xs text-gray-500">Prazo: {nc.prazo} dias — Resp.: {nc.responsavel || '—'}</p>
                </div>
                {!nc._auto && (
                  <button
                    type="button"
                    onClick={() => setNcs(prev => prev.filter((_, idx) => idx !== i))}
                    className="ml-3 text-gray-400 hover:text-red-600 p-1"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal inline de nova NC */}
        {ncAberta && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
            <h3 className="font-semibold text-gray-900">Nova Não Conformidade</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Descrição</label>
                <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={ncForm.descricao} onChange={e => setNcForm(p => ({ ...p, descricao: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Referência NR-13</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="ex: §13.4.1.1"
                  value={ncForm.refNR13} onChange={e => setNcForm(p => ({ ...p, refNR13: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Grau de Risco</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={ncForm.grauRisco} onChange={e => setNcForm(p => ({ ...p, grauRisco: e.target.value as any }))}>
                  <option>Crítico</option>
                  <option>Moderado</option>
                  <option>Baixo</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ação Corretiva</label>
                <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={ncForm.acaoCorretiva} onChange={e => setNcForm(p => ({ ...p, acaoCorretiva: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Prazo (dias)</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={ncForm.prazo} onChange={e => setNcForm(p => ({ ...p, prazo: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Responsável</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={ncForm.responsavel} onChange={e => setNcForm(p => ({ ...p, responsavel: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button"
                onClick={() => {
                  if (!ncForm.descricao || !ncForm.refNR13 || !ncForm.acaoCorretiva) return
                  setNcs(prev => [...prev, { ...ncForm }])
                  setNcForm({ descricao: '', refNR13: '', acaoCorretiva: '', grauRisco: 'Moderado', prazo: 30, responsavel: '' })
                  setNcAberta(false)
                }}
                className="px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700"
              >
                Confirmar NC
              </button>
              <button type="button" onClick={() => setNcAberta(false)}
                className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================
          SEÇÃO 7: PARECER E CRONOGRAMA
      ================================================================ */}
      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">
          7. Parecer Técnico e Cronograma
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Parecer Técnico</label>
            <textarea rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Descreva o estado geral da caldeira, resultado das análises e recomendações..."
              value={parecerTecnico} onChange={e => setParecerTecnico(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">PMTA Fixada pelo PLH (kgf/cm²)</label>
            <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder={`Sugestão: ${pmtaLimitanteKgf.toFixed(2)} kgf/cm²`}
              value={pmtaPlh || ''} onChange={e => setPmtaPlh(Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Próxima Inspeção Externa</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={dataProximaInspExterna} onChange={e => setDataProximaInspExterna(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Cat. {categoria}: a cada {INTERVALOS_CALDEIRA[categoria]?.externo ?? '?'} ano(s)</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Próxima Inspeção Interna</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={dataProximaInspInterna} onChange={e => setDataProximaInspInterna(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Cat. {categoria}: a cada {INTERVALOS_CALDEIRA[categoria]?.interno ?? '?'} ano(s)</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Próximo Teste Dispositivos</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={dataProximoTesteDisp} onChange={e => setDataProximoTesteDisp(e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SEÇÃO 8: RTH
      ================================================================ */}
      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">
          8. Responsável Técnico pelo Laudo (RTH)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={rthNome} onChange={e => setRthNome(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">CREA / CRAM</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={rthCrea} onChange={e => setRthCrea(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Profissão</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={rthProfissao} onChange={e => setRthProfissao(e.target.value)}>
              <option>Engenheiro Mecânico</option>
              <option>Engenheiro de Segurança do Trabalho</option>
              <option>Engenheiro Naval</option>
            </select>
          </div>
        </div>
      </section>

      {/* ================================================================
          BARRA FLUTUANTE DE AÇÕES
      ================================================================ */}
      <div className="fixed bottom-16 md:bottom-0 left-0 md:left-[256px] right-0 bg-white border-t border-gray-200 shadow-lg z-20 px-4 md:px-10 py-3 flex flex-col gap-2">
        {/* Erro inline — visível sem precisar scrollar */}
        {(erro || psvViolaPMTA) && (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-3 py-2 text-xs font-medium">
            {erro ?? `PSV (${psvCalibracao.toFixed(2)} kgf/cm²) > PMTA calculada. Corrija antes de salvar.`}
          </div>
        )}
        {salvoComSucesso && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-lg px-3 py-2 text-xs font-medium">
            ✓ Salvo com sucesso!
          </div>
        )}
        <div className="flex md:flex-row md:justify-between md:items-center gap-2">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-gray-700">Status:</p>
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${
              statusFinal === 'Aprovado' ? 'bg-emerald-500' :
              statusFinal === 'Interditado' ? 'bg-red-700' :
              statusFinal.includes('Reprovado') ? 'bg-amber-600' : 'bg-orange-500'
            }`}>
              {statusFinal.toUpperCase()}
            </span>
            {rgiAtivo && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                ⚠️ RGI ATIVO
              </span>
            )}
          </div>
          <div className="flex gap-2 md:gap-3">
          <button
            type="button"
            disabled={exportandoPDF}
            onClick={handleExportarPDF}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-600 disabled:opacity-50 transition text-sm"
          >
            {exportandoPDF ? (
              <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Gerando PDF...</>
            ) : (
              <><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.23a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.905 3.134V2.75z"/><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z"/></svg>Exportar PDF</>
            )}
          </button>
          <button
            type="submit"
            disabled={salvando || psvViolaPMTA}
            className="flex-1 md:flex-none px-4 md:px-8 py-2.5 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 disabled:opacity-50 transition shadow text-sm"
          >
            {salvando ? 'Salvando...' : modoEdicao ? 'Salvar Alterações' : 'Criar Inspeção'}
          </button>
          </div>
        </div>
      </div>

    </form>
  )
}
