'use server';

/**
 * Server Actions para persistência de inspeções NR-13 no Supabase.
 *
 * Fluxo de salvamento:
 * 1. Cria o laudo (norma = 'NR-13') em `laudos`
 * 2. Cria a inspeção em `inspecoes_nr13`
 * 3. Para cada NC manual → `ncs_nr13` (NCs automáticas vão direto de dados do formulário)
 */
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult, InspecoesNR13 } from '@/types'
import { z } from 'zod'
import { calcularGrupoPV, calcularCategoria, extrairLetraClasse } from '../domain/nr13/categorization'
import { calcularPMTACilindro, calcularPMTATampoToriesferico, calcularPMTAGlobal } from '../domain/nr13/pmta'

// ---------------------------------------------------------------------------
// SCHEMA — espelha exatamente o FormSchema do cliente
// ---------------------------------------------------------------------------
const InspecaoNR13Schema = z.object({
  tag: z.string().min(1),
  fabricante: z.string().min(1),
  numeroSerie: z.string().min(1),
  anoFabricacao: z.number().int().min(1900).max(new Date().getFullYear()),
  tipoVaso: z.enum(['Coluna (Vertical)', 'Vaso Horizontal', 'Esférico']),
  codigoProjeto: z.enum(['ASME Sec. VIII Div 1', 'ASME Sec. VIII Div 2', 'PD 5500', 'GB/T 150', 'Desconhecido']),
  pmtaFabricante: z.number().positive(),
  dataInspecao: z.string().min(10),
  dataEmissaoLaudo: z.string().min(10),
  tipoInspecao: z.enum(['Inicial', 'Periódica', 'Extraordinária']),
  ambiente: z.enum(['Aberto', 'Fechado']),

  fluidoServico: z.string().min(1),
  fluidoClasse: z.enum(['A (Inflamável/Tóxico)', 'B (Combustível/Tóxico leve)', 'C (Vapor de Água/Gases asfixiantes)', 'D (Água/Outros)']),
  pressaoOperacao: z.number().positive(),
  volume: z.number().positive(),
  grupoPV: z.number().int().min(1).max(5),
  categoriaVaso: z.enum(['I', 'II', 'III', 'IV', 'V']),

  prontuario: z.enum(['Existe Integral', 'Parcial / Sendo Reconstituído', 'Não Existe']),
  registroSeguranca: z.enum(['Atualizado', 'Desatualizado', 'Inexistente']),
  projetoInstalacao: z.enum(['Existe', 'Dispensa Legal (Antigo)', 'Não Existe']),
  relatoriosAnteriores: z.enum(['Disponíveis', 'Primeira Inspeção', 'Indisponíveis']),
  placaIdentificacao: z.enum(['Fixada e Legível', 'Ilegível / Danificada', 'Inexistente']),
  certificadosDispositivos: z.enum(['Disponíveis', 'Não Disponíveis', 'N/A']),
  manualOperacao: z.enum(['Disponível em Português', 'Ausente / Sem Tradução', 'N/A']),

  exameExterno: z.enum(['Conforme', 'Não Conforme']),
  exameInterno: z.enum(['Conforme', 'Não Conforme', 'Não Aplicável']),

  medicoesEspessura: z.array(z.object({
    ponto: z.string().min(1),
    espOriginal: z.number().nullable(),
    espMedida: z.number().positive(),
    espMinAdm: z.number().nullable(),
    situacao: z.enum(['OK', 'Crítico']),
    fotoPath: z.string().optional().nullable(),
  })).min(1),

  dispositivosSeguranca: z.array(z.object({
    tag: z.string().min(1),
    tipo: z.enum(['VS', 'VR', 'DR']),
    pressaoAjusteKpa: z.number().positive(),
    ultimoTeste: z.string().min(10),
    situacao: z.enum(['OK', 'Reparo']),
    fotoPath: z.string().optional().nullable(),
  })).min(1),

  materialS: z.number().positive(),
  eficienciaE: z.number().min(0.1).max(1),
  diametroD: z.number().positive().min(50),
  espessuraCostado: z.number().positive(),
  espessuraTampo: z.number().positive(),
  psvCalibracao: z.number().positive(),

  statusFinalVaso: z.enum(['Aprovado', 'Aprovado com Restrições', 'Reprovado — Downgrade Necessário', 'Interditado']),
  proximaInspecaoExterna: z.string().min(10),
  proximaInspecaoInterna: z.string().min(10),
  dataProximoTesteDispositivos: z.string().min(10),
  parecerTecnico: z.string().min(20),
  pmtaFixadaPLH: z.number().positive(),

  naoConformidades: z.array(z.object({
    descricao: z.string().min(5),
    refNR13: z.string().min(1),
    acaoCorretiva: z.string().min(10),
    grauRisco: z.enum(['GIR', 'Crítico', 'Moderado', 'Baixo']),
    prazo: z.number().int().positive(),
    responsavel: z.string().min(2),
    fotoPath: z.string().optional().nullable(),
  })).optional(),

  rthNome: z.string().min(3),
  rthCrea: z.string().min(4),
  rthProfissao: z.enum(['Engenheiro Mecânico', 'Engenheiro de Segurança do Trabalho', 'Técnico de Segurança do Trabalho', 'Outro']),

  // Extras — cliente e dados do laudo
  clienteId: z.string().nullable().optional(),
  numeroDocumento: z.string().nullable().optional(),
  art: z.string().nullable().optional(),
});

type InspecaoNR13Data = z.infer<typeof InspecaoNR13Schema>;

// ---------------------------------------------------------------------------
// SERVER ACTION: Salvar inspeção completa
// ---------------------------------------------------------------------------
export async function salvarInspecaoNR13(formData: InspecaoNR13Data) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, errors: { formErrors: ['Não autenticado'], fieldErrors: {} } }

  // 1. Parse e validação
  const parsed = InspecaoNR13Schema.safeParse(formData)
  if (!parsed.success) return { success: false, errors: parsed.error.flatten() }
  const data = parsed.data

  // 2. Double-check — categorização §13.5.1.1
  const classeExtraida = extrairLetraClasse(data.fluidoClasse)
  if (classeExtraida) {
    const presMpa = data.pressaoOperacao / 10.197 // kgf/cm² → MPa
    const grupoPVVerificado = calcularGrupoPV(presMpa, data.volume)
    const categoriaVerificada = calcularCategoria(classeExtraida, grupoPVVerificado)
    if (grupoPVVerificado !== data.grupoPV) return { success: false, errors: { formErrors: ['Grupo P×V inválido'], fieldErrors: {} } }
    if (categoriaVerificada !== data.categoriaVaso) return { success: false, errors: { formErrors: ['Categoria inválida'], fieldErrors: {} } }
  }

  // 3. Double-check — PMTA ASME
  const R = data.diametroD / 2
  const sMpa = data.materialS / 10.197
  const psvMpa = data.psvCalibracao / 10.197
  const pmtaCostado = calcularPMTACilindro({ S: sMpa, E: data.eficienciaE, t: data.espessuraCostado, R, D: data.diametroD })
  const pmtaTampo = calcularPMTATampoToriesferico({ S: sMpa, E: data.eficienciaE, t: data.espessuraTampo, R, D: data.diametroD })
  const limitante = calcularPMTAGlobal(pmtaCostado, pmtaTampo, psvMpa)
  const pmtaLimitanteKpa = limitante.pmtaLimitante * 1000

  if (data.pmtaFixadaPLH > pmtaLimitanteKpa) {
    return {
      success: false,
      errors: {
        formErrors: [`PMTA fixada (${data.pmtaFixadaPLH} kPa) excede o limitante ASME (${pmtaLimitanteKpa.toFixed(1)} kPa)`],
        fieldErrors: {},
      },
    }
  }

  // 4. Cria inspeção
  const { data: inspecao, error: inspError } = await supabase
    .from('inspecoes_nr13')
    .insert({
      tag: data.tag,
      fabricante: data.fabricante,
      numero_serie: data.numeroSerie,
      ano_fabricacao: data.anoFabricacao,
      tipo_vaso: data.tipoVaso,
      codigo_projeto: data.codigoProjeto,
      pmta_fabricante_kpa: data.pmtaFabricante,
      data_inspecao: data.dataInspecao,
      data_emissao_laudo: data.dataEmissaoLaudo,
      tipo_inspecao: data.tipoInspecao,
      ambiente: data.ambiente,
      fluido_servico: data.fluidoServico,
      fluido_classe: data.fluidoClasse,
      pressao_operacao_mpa: data.pressaoOperacao,
      volume_m3: data.volume,
      grupo_pv: data.grupoPV,
      categoria_vaso: data.categoriaVaso,
      prontuario: data.prontuario,
      registro_seguranca: data.registroSeguranca,
      projeto_instalacao: data.projetoInstalacao,
      relatorios_anteriores: data.relatoriosAnteriores,
      placa_identificacao: data.placaIdentificacao,
      certificados_dispositivos: data.certificadosDispositivos,
      manual_operacao: data.manualOperacao,
      exame_externo: data.exameExterno,
      exame_interno: data.exameInterno,
      medicoes_espessura: JSON.stringify(data.medicoesEspessura),
      dispositivos_seguranca: JSON.stringify(data.dispositivosSeguranca),
      material_s: data.materialS,
      eficiencia_e: data.eficienciaE,
      diametro_d: data.diametroD,
      espessura_costado: data.espessuraCostado,
      espessura_tampo: data.espessuraTampo,
      psv_calibracao_kpa: data.psvCalibracao,
      pmta_asme_kpa: limitante.pmtaLimitante * 1000,
      pmta_plh_kpa: data.pmtaFixadaPLH,
      status_final: data.statusFinalVaso,
      status_seguranca: limitante.condena ? 'Downgrade_Necessario' : 'Conforme',
      proxima_inspecao_externa: data.proximaInspecaoExterna,
      proxima_inspecao_interna: data.proximaInspecaoInterna,
      data_proximo_teste_dispositivos: data.dataProximoTesteDispositivos,
      parecer_tecnico: data.parecerTecnico,
      rth_nome: data.rthNome,
      rth_crea: data.rthCrea,
      rth_profissao: data.rthProfissao,
    })
    .select()
    .single()

  if (inspError || !inspecao) {
    return { success: false, errors: { formErrors: [`Erro ao salvar: ${inspError?.message}`], fieldErrors: {} } }
  }

  // 5. NCs — salva todas (incluindo AUTO:)
  const ncs = data.naoConformidades ?? []
  for (let i = 0; i < ncs.length; i++) {
    const nc = ncs[i]
    await supabase.from('ncs_nr13').insert({
      inspecao_id: inspecao.id,
      descricao: nc.descricao,
      ref_nr13: nc.refNR13,
      acao_corretiva: nc.acaoCorretiva,
      grau_risco: nc.grauRisco,
      prazo_dias: nc.prazo,
      responsavel: nc.responsavel,
      ordem: i,
    })
  }

  revalidatePath('/dashboard')

  return {
    success: true,
    inspecaoId: inspecao.id,
    pmtaVerificada: limitante.pmtaLimitante,
    alerta: limitante.condena ? 'CRÍTICO: PMTA inferior à calibração da PSV.' : 'OK',
  }
}

// ---------------------------------------------------------------------------
// SERVER ACTION: Listar inspeções NR-13
// ---------------------------------------------------------------------------
export async function listarInspecoesNR13(): Promise<ActionResult<InspecoesNR13[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('inspecoes_nr13')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data: data ?? [] }
}

// ---------------------------------------------------------------------------
// SERVER ACTION: Buscar inspeção por ID
// ---------------------------------------------------------------------------
export async function buscarInspecaoNR13(id: string): Promise<ActionResult<InspecoesNR13 & { ncs?: any[] }>> {
  const supabase = await createClient()

  const { data: inspecao, error } = await supabase
    .from('inspecoes_nr13')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !inspecao) return { error: error?.message ?? 'Inspeção não encontrada' }

  // Busca NCs
  const { data: ncs } = await supabase
    .from('ncs_nr13')
    .select('*')
    .eq('inspecao_id', id)
    .order('ordem', { ascending: true })

  return { data: { ...inspecao, ncs: ncs ?? [] } }
}

// ---------------------------------------------------------------------------
// SERVER ACTION: Atualizar inspeção
// ---------------------------------------------------------------------------
export async function atualizarInspecaoNR13(
  id: string,
  form: Partial<InspecaoNR13Data> & { medicoesEspessura?: any[]; dispositivosSeguranca?: any[]; naoConformidades?: any[] }
): Promise<ActionResult<InspecoesNR13>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const updateData: Record<string, any> = { ...form }

  // Serializa arrays JSON
  if (form.medicoesEspessura) updateData.medicoes_espessura = JSON.stringify(form.medicoesEspessura)
  if (form.dispositivosSeguranca) updateData.dispositivos_seguranca = JSON.stringify(form.dispositivosSeguranca)

  delete updateData.naoConformidades

  const { data, error } = await supabase
    .from('inspecoes_nr13')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}
