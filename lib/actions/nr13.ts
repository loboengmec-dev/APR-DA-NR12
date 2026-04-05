'use server';

import { z } from 'zod';
import { calcularPMTACilindro, calcularPMTATampoToriesferico, calcularPMTATampoSemiEliptico, calcularPMTAGlobal } from '../domain/nr13/pmta';
import { calcularGrupoPV, calcularCategoria, extrairLetraClasse } from '../domain/nr13/categorization';

// ---------------------------------------------------------------------------
// SCHEMA — espelha exatamente o FormSchema do client para double-check seguro
// ---------------------------------------------------------------------------
const InspecaoNR13Schema = z.object({
  // Identificação
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

  // Classificação §13.5.1.1
  fluidoServico: z.string().min(1),
  fluidoClasse: z.enum(['A (Inflamável/Tóxico)', 'B (Combustível/Tóxico leve)', 'C (Vapor de Água/Gases asfixiantes)', 'D (Água/Outros)']),
  pressaoOperacao: z.number().positive(),
  volume: z.number().positive(),
  grupoPV: z.number().int().min(1).max(5),
  categoriaVaso: z.enum(['I', 'II', 'III', 'IV', 'V']),

  // Checklist Documental §13.5.1.5
  prontuario: z.enum(['Existe Integral', 'Parcial / Sendo Reconstituído', 'Não Existe']),
  registroSeguranca: z.enum(['Atualizado', 'Desatualizado', 'Inexistente']),
  projetoInstalacao: z.enum(['Existe', 'Dispensa Legal (Antigo)', 'Não Existe']),
  relatoriosAnteriores: z.enum(['Disponíveis', 'Primeira Inspeção', 'Indisponíveis']),
  placaIdentificacao: z.enum(['Fixada e Legível', 'Ilegível / Danificada', 'Inexistente']),
  certificadosDispositivos: z.enum(['Disponíveis', 'Não Disponíveis', 'N/A']),
  manualOperacao: z.enum(['Disponível em Português', 'Ausente / Sem Tradução', 'N/A']),

  // Exames §13.3.4
  exameExterno: z.enum(['Conforme', 'Não Conforme']),
  exameInterno: z.enum(['Conforme', 'Não Conforme', 'Não Aplicável']),

  // Medições de espessura §13.5.4.11(d)
  medicoesEspessura: z.array(z.object({
    ponto: z.string().min(1),
    espOriginal: z.number().nullable(),
    espMedida: z.number().positive(),
    espMinAdm: z.number().nullable(),
    situacao: z.enum(['OK', 'Crítico']),
  })).min(1),

  // Dispositivos de segurança §13.5.1.2 / §13.5.4.11(n)
  dispositivosSeguranca: z.array(z.object({
    tag: z.string().min(1),
    tipo: z.enum(['VS', 'VR', 'DR']),
    pressaoAjusteKpa: z.number().positive(),
    ultimoTeste: z.string().min(10),
    situacao: z.enum(['OK', 'Reparo']),
  })).min(1),

  // Parâmetros ASME Sec. VIII
  materialS: z.number().positive(),
  eficienciaE: z.number().min(0.1).max(1),
  diametroD: z.number().positive().min(50),
  espessuraCostado: z.number().positive(),
  espessuraTampo: z.number().positive(),
  psvCalibracao: z.number().positive(),

  // Parecer e plano §13.5.4.11(j)(k)(l)
  statusFinalVaso: z.enum(['Aprovado', 'Aprovado com Restrições', 'Reprovado — Downgrade Necessário', 'Interditado']),
  proximaInspecaoExterna: z.string().min(10),
  proximaInspecaoInterna: z.string().min(10),
  dataProximoTesteDispositivos: z.string().min(10),
  parecerTecnico: z.string().min(20),
  pmtaFixadaPLH: z.number().positive(),

  // Não conformidades §13.5.4.11(j)
  naoConformidades: z.array(z.object({
    descricao: z.string().min(5),
    refNR13: z.string().min(1),
    acaoCorretiva: z.string().min(10),
    grauRisco: z.enum(['GIR', 'Crítico', 'Moderado', 'Baixo']),
    prazo: z.number().int().positive(),
    responsavel: z.string().min(2),
  })).optional(),

  // RTH §13.5.4.11(m)
  rthNome: z.string().min(3),
  rthCrea: z.string().min(4),
  rthProfissao: z.enum(['Engenheiro Mecânico', 'Engenheiro de Segurança do Trabalho', 'Técnico de Segurança do Trabalho', 'Outro']),
});

type InspecaoNR13Data = z.infer<typeof InspecaoNR13Schema>;

// ---------------------------------------------------------------------------
// SERVER ACTION
// ---------------------------------------------------------------------------
export async function salvarInspecaoNR13(formData: unknown) {
  // 1. Parse e validação — rejeita payload malformado
  const parsed = InspecaoNR13Schema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten() };
  }

  const data: InspecaoNR13Data = parsed.data;

  // 2. DOUBLE-CHECK SILENCIOSO — Categorização §13.5.1.1
  // O browser calcula para UX, mas a Server Action recalcula autoritativamente.
  const classeExtraida = extrairLetraClasse(data.fluidoClasse);
  if (classeExtraida) {
    const grupoPVVerificado = calcularGrupoPV(data.pressaoOperacao, data.volume);
    const categoriaVerificada = calcularCategoria(classeExtraida, grupoPVVerificado);

    // Rejeita se o cliente enviou categoria divergente (payload injection)
    if (grupoPVVerificado !== data.grupoPV) {
      return { success: false, errors: { formErrors: ['Grupo P×V inválido — recalculado no servidor.'], fieldErrors: {} } };
    }
    if (categoriaVerificada !== data.categoriaVaso) {
      return { success: false, errors: { formErrors: ['Categoria do vaso inválida — recalculada no servidor.'], fieldErrors: {} } };
    }
  }

  // 3. DOUBLE-CHECK SILENCIOSO — PMTA §13.3.2 / ASME Sec. VIII
  const R = data.diametroD / 2;

  const pmtaCostado = calcularPMTACilindro({
    S: data.materialS,
    E: data.eficienciaE,
    t: data.espessuraCostado,
    R,
    D: data.diametroD,
  });

  const pmtaTampo = calcularPMTATampoSemiEliptico({
    S: data.materialS,
    E: data.eficienciaE,
    t: data.espessuraTampo,
    R,
    D: data.diametroD,
  });

  const limitante = calcularPMTAGlobal(pmtaCostado, pmtaTampo, data.psvCalibracao);

  // 4. Regra crítica: PMTA fixada pelo PLH não pode exceder o limitante ASME
  if (data.pmtaFixadaPLH > limitante.pmtaLimitante * 1000) {
    // pmtaFixadaPLH está em kPa, pmtaLimitante em MPa — converte para comparar
    return {
      success: false,
      errors: {
        formErrors: [`PMTA fixada pelo PLH (${data.pmtaFixadaPLH} kPa) excede o limitante ASME calculado (${(limitante.pmtaLimitante * 1000).toFixed(1)} kPa).`],
        fieldErrors: {},
      },
    };
  }

  const statusSeguranca = limitante.condena ? 'Downgrade_Necessario' : 'Conforme';

  /*
   * 5. INSERT SUPABASE (SSR)
   * const supabase = createClient();
   * const { error } = await supabase.from('inspecoes_nr13').insert({
   *   tag: data.tag,
   *   fabricante: data.fabricante,
   *   numero_serie: data.numeroSerie,
   *   ano_fabricacao: data.anoFabricacao,
   *   tipo_vaso: data.tipoVaso,
   *   codigo_projeto: data.codigoProjeto,
   *   pmta_fabricante_kpa: data.pmtaFabricante,
   *   data_inspecao: data.dataInspecao,
   *   data_emissao_laudo: data.dataEmissaoLaudo,
   *   tipo_inspecao: data.tipoInspecao,
   *   fluido_servico: data.fluidoServico,
   *   fluido_classe: data.fluidoClasse,
   *   pressao_operacao_mpa: data.pressaoOperacao,
   *   volume_m3: data.volume,
   *   grupo_pv: data.grupoPV,
   *   categoria_vaso: data.categoriaVaso,
   *   pmta_asme_kpa: limitante.pmtaLimitante * 1000,
   *   pmta_plh_kpa: data.pmtaFixadaPLH,
   *   status_final: data.statusFinalVaso,
   *   proxima_inspecao_externa: data.proximaInspecaoExterna,
   *   proxima_inspecao_interna: data.proximaInspecaoInterna,
   *   proximo_teste_dispositivos: data.dataProximoTesteDispositivos,
   *   parecer_tecnico: data.parecerTecnico,
   *   rth_nome: data.rthNome,
   *   rth_crea: data.rthCrea,
   *   rth_profissao: data.rthProfissao,
   * });
   * if (error) return { success: false, errors: { formErrors: [error.message], fieldErrors: {} } };
   */

  return {
    success: true,
    pmtaVerificada: limitante.pmtaLimitante,
    statusFinal: statusSeguranca,
    alerta: limitante.condena ? 'CRÍTICO: PMTA inferior à calibração da PSV.' : 'OK',
  };
}
