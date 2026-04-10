'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import FormInspecaoNR13 from '@/components/nr13/FormInspecaoNR13'
import { gerarUrlAssinadaNR13 } from '@/lib/nr13/storage'
import type { InspecoesNR13, NcNR13 } from '@/types'

/** Converte registro do Supabase (snake_case) para o formato do form (camelCase). */
function dbToForm(row: InspecoesNR13, ncs: NcNR13[]) {
  return {
    tag: row.tag ?? '',
    fabricante: row.fabricante ?? '',
    numeroSerie: row.numero_serie ?? '',
    anoFabricacao: row.ano_fabricacao ?? new Date().getFullYear(),
    tipoVaso: row.tipo_vaso ?? 'Vaso Horizontal',
    codigoProjeto: row.codigo_projeto ?? 'ASME Sec. VIII Div 1',
    pmtaFabricante: row.pmta_fabricante_kpa ?? 0,
    dataInspecao: row.data_inspecao ?? '',
    dataEmissaoLaudo: row.data_emissao_laudo ?? '',
    tipoInspecao: row.tipo_inspecao ?? 'Periódica',
    ambiente: row.ambiente ?? 'Aberto',
    fluidoServico: row.fluido_servico ?? '',
    fluidoClasse: row.fluido_classe ?? 'D (Água/Outros)',
    pressaoOperacao: row.pressao_operacao_mpa ?? 0,
    volume: row.volume_m3 ?? 0,
    grupoPV: row.grupo_pv ?? 1,
    categoriaVaso: row.categoria_vaso ?? 'V',
    prontuario: row.prontuario ?? 'Existe Integral',
    registroSeguranca: row.registro_seguranca ?? 'Atualizado',
    projetoInstalacao: row.projeto_instalacao ?? 'Existe',
    relatoriosAnteriores: row.relatorios_anteriores ?? 'Disponíveis',
    placaIdentificacao: row.placa_identificacao ?? 'Fixada e Legível',
    certificadosDispositivos: row.certificados_dispositivos ?? 'Disponíveis',
    manualOperacao: row.manual_operacao ?? 'N/A',
    exameExterno: row.exame_externo ?? 'Conforme',
    exameInterno: row.exame_interno ?? 'Conforme',
    medicoesEspessura: parseJsonArray(row.medicoes_espessura, [{ ponto: 'PE-01', espOriginal: null, espMedida: 0, espMinAdm: null, situacao: 'OK', fotoPath: '' }]),
    dispositivosSeguranca: parseJsonArray(row.dispositivos_seguranca, [{ tag: '', tipo: 'VS', pressaoAjusteKpa: 0, ultimoTeste: '', situacao: 'OK', fotoPath: '' }]),
    normaCalculo: row.norma_calculo ?? 'ASME',
    materialS: row.material_s ?? 1406.1,
    eficienciaE: row.eficiencia_e ?? 0.85,
    diametroD: row.diametro_d ?? 1000,
    espessuraCostado: row.espessura_costado ?? 0,
    espessuraTampo: row.espessura_tampo ?? 0,
    psvCalibracao: row.psv_calibracao_kpa ?? 0,
    statusFinalVaso: row.status_final ?? 'Aprovado',
    proximaInspecaoExterna: row.proxima_inspecao_externa ?? '',
    proximaInspecaoInterna: row.proxima_inspecao_interna ?? '',
    dataProximoTesteDispositivos: row.data_proximo_teste_dispositivos ?? '',
    parecerTecnico: row.parecer_tecnico ?? '',
    pmtaFixadaPLH: row.pmta_plh_kpa ?? 0,
    naoConformidades: ncs.map((nc) => ({
      descricao: nc.descricao,
      refNR13: nc.ref_nr13,
      acaoCorretiva: nc.acao_corretiva,
      grauRisco: nc.grau_risco as any,
      prazo: nc.prazo_dias ?? 30,
      responsavel: nc.responsavel ?? '',
      fotoPath: nc.foto_path ?? '',
    })),
    rthNome: row.rth_nome ?? '',
    rthCrea: row.rth_crea ?? '',
    rthProfissao: row.rth_profissao ?? 'Engenheiro Mecânico',
    // Fotos persistidas
    fotoPlacaPath: row.foto_placa_path ?? '',
    fotoManometroPath: row.foto_manometro_path ?? '',
    fotosExame: parseJsonArray(row.fotos_exame, []),
  }
}

function parseJsonArray(val: any, fallback: any[]): any[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return fallback }
  }
  return fallback
}

export default function EditarInspecaoNR13Page() {
  const params = useParams()
  const id = params.id as string

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [initialData, setInitialData] = useState<Record<string, any> | null>(null)
  const [fotosUrl, setFotosUrl] = useState<Record<string, string>>({})

  const carregarInspecao = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setErro('Não autenticado'); setCarregando(false); return }

    // Busca inspeção
    const { data: inspecao, error: inspErr } = await supabase
      .from('inspecoes_nr13')
      .select('*')
      .eq('id', id)
      .single()

    if (inspErr || !inspecao) {
      setErro('Inspeção não encontrada.')
      setCarregando(false)
      return
    }

    // Busca NCs
    const { data: ncs } = await supabase
      .from('ncs_nr13')
      .select('*')
      .eq('inspecao_id', id)
      .order('ordem', { ascending: true })

    // Converte para formato do form
    const formData = dbToForm(inspecao as InspecoesNR13, (ncs ?? []) as NcNR13[])
    setInitialData(formData)

    // Carrega URLs de fotos (placa, manometro, exame, medições, dispositivos, NCs)
    const urlMap: Record<string, string> = {}
    const medicoesArr = parseJsonArray(inspecao.medicoes_espessura, [])
    const dispArr = parseJsonArray(inspecao.dispositivos_seguranca, [])
    const fotosExameArr = parseJsonArray(inspecao.fotos_exame, [])

    // Foto da placa de identificação
    if (inspecao.foto_placa_path) {
      const url = await gerarUrlAssinadaNR13(inspecao.foto_placa_path)
      if (url) urlMap['placa'] = url
    }

    // Foto do manômetro
    if (inspecao.foto_manometro_path) {
      const url = await gerarUrlAssinadaNR13(inspecao.foto_manometro_path)
      if (url) urlMap['manometro'] = url
    }

    // Fotos de registro da inspeção (até 6, chave: exame_0..exame_5)
    for (let i = 0; i < fotosExameArr.length; i++) {
      if (fotosExameArr[i]?.storagePath) {
        const url = await gerarUrlAssinadaNR13(fotosExameArr[i].storagePath)
        if (url) urlMap[`exame_${i}`] = url
      }
    }

    // Fotos de medições
    for (let i = 0; i < medicoesArr.length; i++) {
      if (medicoesArr[i]?.fotoPath) {
        const url = await gerarUrlAssinadaNR13(medicoesArr[i].fotoPath)
        if (url) urlMap[`medicao_${i}`] = url
      }
    }

    // Fotos de dispositivos
    for (let i = 0; i < dispArr.length; i++) {
      if (dispArr[i]?.fotoPath) {
        const url = await gerarUrlAssinadaNR13(dispArr[i].fotoPath)
        if (url) urlMap[`dispositivo_${i}`] = url
      }
    }

    // Fotos de NCs
    for (let i = 0; i < (ncs ?? []).length; i++) {
      const nc = (ncs ?? [])[i] as any
      if (nc?.foto_path) {
        const url = await gerarUrlAssinadaNR13(nc.foto_path)
        if (url) urlMap[`nc_${i}`] = url
      }
    }

    setFotosUrl(urlMap)
    setCarregando(false)
  }, [id])

  useEffect(() => {
    carregarInspecao()
  }, [carregarInspecao])

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          Carregando inspeção...
        </div>
      </div>
    )
  }

  if (erro || !initialData) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <p className="text-red-600 mb-4">{erro ?? 'Erro desconhecido'}</p>
        <Link href="/laudos/nr13" className="text-sm text-gray-500 hover:text-gray-700">
          ← Voltar para lista
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/laudos/nr13" className="text-sm text-gray-500 hover:text-gray-700">
          ← Inspeções NR-13
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shadow">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
            </svg>
          </div>
          Editar Inspeção — {initialData.tag}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Editando inspeção existente. Alterações são salvas ao clicar em "Confirmar".
        </p>
      </div>

      <FormInspecaoNR13 initialData={initialData} inspecaoId={id} />
    </div>
  )
}
