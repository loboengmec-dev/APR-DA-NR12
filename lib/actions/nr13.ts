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
// SCHEMA — aceita rascunhos parciais (campos opcionais) para permitir
// salvar a qualquer momento. Validação rigorosa fica no export PDF.
// ---------------------------------------------------------------------------
const InspecaoNR13Schema = z.object({
  tag: z.string().default(''),
  fabricante: z.string().default(''),
  numeroSerie: z.string().default(''),
  anoFabricacao: z.number().int().optional().nullable(),
  tipoVaso: z.string().optional().nullable(),
  codigoProjeto: z.string().optional().nullable(),
  pmtaFabricante: z.number().optional().nullable(),
  dataInspecao: z.string().optional().nullable(),
  dataEmissaoLaudo: z.string().optional().nullable(),
  tipoInspecao: z.string().optional().nullable(),
  ambiente: z.string().optional().nullable(),

  fluidoServico: z.string().optional().nullable(),
  fluidoClasse: z.string().optional().nullable(),
  pressaoOperacao: z.number().optional().nullable(),
  volume: z.number().optional().nullable(),
  grupoPV: z.number().int().optional().nullable(),
  categoriaVaso: z.string().optional().nullable(),

  prontuario: z.string().optional().nullable(),
  registroSeguranca: z.string().optional().nullable(),
  projetoInstalacao: z.string().optional().nullable(),
  relatoriosAnteriores: z.string().optional().nullable(),
  placaIdentificacao: z.string().optional().nullable(),
  certificadosDispositivos: z.string().optional().nullable(),
  manualOperacao: z.string().optional().nullable(),

  exameExterno: z.string().optional().nullable(),
  exameInterno: z.string().optional().nullable(),

  medicoesEspessura: z.array(z.object({
    ponto: z.string(),
    espOriginal: z.number().nullable().optional(),
    espMedida: z.number().nullable().optional(),
    espMinAdm: z.number().nullable().optional(),
    situacao: z.string().optional(),
    fotoPath: z.string().optional().nullable(),
  })).optional().nullable(),

  dispositivosSeguranca: z.array(z.object({
    tag: z.string(),
    tipo: z.string().optional(),
    pressaoAjusteKpa: z.number().optional().nullable(),
    ultimoTeste: z.string().optional(),
    situacao: z.string().optional(),
    fotoPath: z.string().optional().nullable(),
  })).optional().nullable(),

  materialS: z.number().optional().nullable(),
  eficienciaE: z.number().optional().nullable(),
  diametroD: z.number().optional().nullable(),
  espessuraCostado: z.number().optional().nullable(),
  espessuraTampo: z.number().optional().nullable(),
  psvCalibracao: z.number().optional().nullable(),

  statusFinalVaso: z.string().optional().nullable(),
  proximaInspecaoExterna: z.string().optional().nullable(),
  proximaInspecaoInterna: z.string().optional().nullable(),
  dataProximoTesteDispositivos: z.string().optional().nullable(),
  parecerTecnico: z.string().optional().nullable(),
  pmtaFixadaPLH: z.number().optional().nullable(),

  naoConformidades: z.array(z.object({
    descricao: z.string(),
    refNR13: z.string().optional().default(''),
    acaoCorretiva: z.string().optional().default(''),
    grauRisco: z.string().optional().default('Moderado'),
    prazo: z.number().int().optional().default(30),
    responsavel: z.string().optional().default(''),
    fotoPath: z.string().optional().nullable(),
  })).optional().nullable(),

  rthNome: z.string().optional().nullable(),
  rthCrea: z.string().optional().nullable(),
  rthProfissao: z.string().optional().nullable(),

  // Extras
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

  console.log('[NR13-Server] salvarInspecaoNR13: usuario', user.id, 'dados', JSON.stringify(formData).slice(0, 200))

  // 1. Parse e validação
  const parsed = InspecaoNR13Schema.safeParse(formData)
  if (!parsed.success) {
    console.error('[NR13-Server] Zod falhou:', parsed.error.flatten())
    return { success: false, errors: parsed.error.flatten() }
  }
  const data = parsed.data

  // 2. Double-check condicional — só valida se os campos necessários estão presentes
  let pmtaAsmeKpa: number | null = null
  let statusSeguranca: string | null = null

  const classeExtraida = data.fluidoClasse ? extrairLetraClasse(data.fluidoClasse) : null
  if (classeExtraida && data.pressaoOperacao && data.volume && data.grupoPV && data.categoriaVaso) {
    const presMpa = data.pressaoOperacao / 10.197
    const grupoPVVerificado = calcularGrupoPV(presMpa, data.volume)
    const categoriaVerificada = calcularCategoria(classeExtraida, grupoPVVerificado)
    if (grupoPVVerificado !== data.grupoPV) return { success: false, errors: { formErrors: ['Grupo P×V inválido'], fieldErrors: {} } }
    if (categoriaVerificada !== data.categoriaVaso) return { success: false, errors: { formErrors: ['Categoria inválida'], fieldErrors: {} } }
  }

  if (data.materialS && data.eficienciaE && data.diametroD && data.espessuraCostado && data.espessuraTampo && data.psvCalibracao) {
    const R = data.diametroD / 2
    const sMpa = data.materialS / 10.197
    const psvMpa = data.psvCalibracao / 10.197
    const pmtaCostado = calcularPMTACilindro({ S: sMpa, E: data.eficienciaE, t: data.espessuraCostado, R, D: data.diametroD })
    const pmtaTampo = calcularPMTATampoToriesferico({ S: sMpa, E: data.eficienciaE, t: data.espessuraTampo, R, D: data.diametroD })
    const limitante = calcularPMTAGlobal(pmtaCostado, pmtaTampo, psvMpa)
    pmtaAsmeKpa = limitante.pmtaLimitante * 1000
    statusSeguranca = limitante.condena ? 'Downgrade_Necessario' : 'Conforme'

    if (data.pmtaFixadaPLH && data.pmtaFixadaPLH > pmtaAsmeKpa) {
      return {
        success: false,
        errors: {
          formErrors: [`PMTA fixada (${data.pmtaFixadaPLH} kPa) excede o limitante ASME (${pmtaAsmeKpa.toFixed(1)} kPa)`],
          fieldErrors: {},
        },
      }
    }
  }

  // 3. Encontrar ou criar cliente (necessário para RLS)
  const { data: clientes } = await supabase.from('clientes').select('id').eq('usuario_id', user.id).limit(1)
  let clienteId: string | null = clientes?.[0]?.id ?? null

  if (!clienteId) {
    // Cria cliente genérico associado ao usuário
    const { data: novoCliente, error: cliErr } = await supabase
      .from('clientes')
      .insert({ usuario_id: user.id, razao_social: data.tag || 'Cliente Sem Nome' })
      .select()
      .single()
    if (cliErr || !novoCliente) {
      console.error('[NR13-Server] Erro ao criar cliente:', cliErr)
      return { success: false, errors: { formErrors: [`Erro ao criar cliente: ${cliErr?.message}`], fieldErrors: {} } }
    }
    clienteId = novoCliente.id
    console.log('[NR13-Server] Cliente criado:', clienteId)
  }

  // 4. Criar vaso_pressao (necessário para RLS de inspecoes_nr13)
  const { data: novoVaso, error: vasoErr } = await supabase
    .from('vasos_pressao')
    .insert({
      cliente_id: clienteId,
      tag: data.tag || 'SEM_TAG',
      fabricante: data.fabricante,
      numero_serie: data.numeroSerie,
      ano_fabricacao: data.anoFabricacao,
      tipo_vaso: data.tipoVaso,
      codigo_projeto: data.codigoProjeto,
      pmta_fabricante_kpa: data.pmtaFabricante,
    })
    .select()
    .single()

  if (vasoErr || !novoVaso) {
    console.error('[NR13-Server] Erro ao criar vaso:', vasoErr)
    return { success: false, errors: { formErrors: ['Erro ao criar vaso: ' + (vasoErr?.message ?? 'desconhecido')], fieldErrors: {} } }
  }
  console.log('[NR13-Server] Vaso criado:', novoVaso.id)

  // 5. Cria inspeção com vaso_id válido
  const { data: inspecao, error: inspError } = await supabase
    .from('inspecoes_nr13')
    .insert({
      vaso_id: novoVaso.id,
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
      medicoes_espessura: data.medicoesEspessura ? JSON.stringify(data.medicoesEspessura) : null,
      dispositivos_seguranca: data.dispositivosSeguranca ? JSON.stringify(data.dispositivosSeguranca) : null,
      material_s: data.materialS,
      eficiencia_e: data.eficienciaE,
      diametro_d: data.diametroD,
      espessura_costado: data.espessuraCostado,
      espessura_tampo: data.espessuraTampo,
      psv_calibracao_kpa: data.psvCalibracao,
      pmta_asme_kpa: pmtaAsmeKpa,
      pmta_plh_kpa: data.pmtaFixadaPLH,
      status_final: data.statusFinalVaso,
      status_seguranca: statusSeguranca,
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
    console.error('[NR13-Server] Erro ao criar inspeção:', inspError)
    return { success: false, errors: { formErrors: [`Erro ao salvar: ${inspError?.message}`], fieldErrors: {} } }
  }

  // 6. NCs — salva todas (incluindo AUTO:)
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
  revalidatePath('/laudos/nr13')

  return {
    success: true,
    inspecaoId: inspecao.id,
    pmtaVerificada: pmtaAsmeKpa,
    alerta: statusSeguranca === 'Downgrade_Necessario' ? 'CRÍTICO: PMTA inferior à calibração da PSV.' : 'OK',
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
// SERVER ACTION: Atualizar inspeção (camelCase → snake_case)
// ---------------------------------------------------------------------------
export async function atualizarInspecaoNR13(
  id: string,
  form: Record<string, any>
): Promise<ActionResult<InspecoesNR13>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Mapeia camelCase do form → snake_case do banco (mesmo mapeamento do insert)
  const updateData: Record<string, any> = {
    tag: form.tag,
    fabricante: form.fabricante,
    numero_serie: form.numeroSerie,
    ano_fabricacao: form.anoFabricacao,
    tipo_vaso: form.tipoVaso,
    codigo_projeto: form.codigoProjeto,
    pmta_fabricante_kpa: form.pmtaFabricante,
    data_inspecao: form.dataInspecao,
    data_emissao_laudo: form.dataEmissaoLaudo,
    tipo_inspecao: form.tipoInspecao,
    ambiente: form.ambiente,
    fluido_servico: form.fluidoServico,
    fluido_classe: form.fluidoClasse,
    pressao_operacao_mpa: form.pressaoOperacao,
    volume_m3: form.volume,
    grupo_pv: form.grupoPV,
    categoria_vaso: form.categoriaVaso,
    prontuario: form.prontuario,
    registro_seguranca: form.registroSeguranca,
    projeto_instalacao: form.projetoInstalacao,
    relatorios_anteriores: form.relatoriosAnteriores,
    placa_identificacao: form.placaIdentificacao,
    certificados_dispositivos: form.certificadosDispositivos,
    manual_operacao: form.manualOperacao,
    exame_externo: form.exameExterno,
    exame_interno: form.exameInterno,
    medicoes_espessura: form.medicoesEspessura ? JSON.stringify(form.medicoesEspessura) : undefined,
    dispositivos_seguranca: form.dispositivosSeguranca ? JSON.stringify(form.dispositivosSeguranca) : undefined,
    material_s: form.materialS,
    eficiencia_e: form.eficienciaE,
    diametro_d: form.diametroD,
    espessura_costado: form.espessuraCostado,
    espessura_tampo: form.espessuraTampo,
    psv_calibracao_kpa: form.psvCalibracao,
    pmta_plh_kpa: form.pmtaFixadaPLH,
    status_final: form.statusFinalVaso,
    proxima_inspecao_externa: form.proximaInspecaoExterna,
    proxima_inspecao_interna: form.proximaInspecaoInterna,
    data_proximo_teste_dispositivos: form.dataProximoTesteDispositivos,
    parecer_tecnico: form.parecerTecnico,
    rth_nome: form.rthNome,
    rth_crea: form.rthCrea,
    rth_profissao: form.rthProfissao,
  }

  // Remove campos undefined para não sobrescrever com null
  Object.keys(updateData).forEach(k => { if (updateData[k] === undefined) delete updateData[k] })

  const { data, error } = await supabase
    .from('inspecoes_nr13')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }

  // Atualiza NCs — deleta antigas e insere novas
  const ncs = form.naoConformidades ?? []
  await supabase.from('ncs_nr13').delete().eq('inspecao_id', id)
  for (let i = 0; i < ncs.length; i++) {
    const nc = ncs[i]
    await supabase.from('ncs_nr13').insert({
      inspecao_id: id,
      descricao: nc.descricao,
      ref_nr13: nc.refNR13,
      acao_corretiva: nc.acaoCorretiva,
      grau_risco: nc.grauRisco,
      prazo_dias: nc.prazo,
      responsavel: nc.responsavel,
      ordem: i,
    })
  }

  revalidatePath('/laudos/nr13')
  revalidatePath(`/laudos/nr13/${id}`)

  return { data }
}
