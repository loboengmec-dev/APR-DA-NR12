'use server';

import { z } from 'zod';
import { calcularPMTACilindro, calcularPMTATampoToriesferico, calcularPMTATampoSemiEliptico, calcularPMTAGlobal } from '../domain/nr13/pmta';

// Zod Schema para proteger o Server Action contra Payload Injection
const InspecaoNR13Schema = z.object({
  vaso_id: z.string().uuid(),
  tipo_inspecao: z.enum(['Inicial', 'Periódica', 'Extraordinária']),
  data_inspecao: z.string(),
  // Variáveis Físicas
  espessura_medida_costado_mm: z.number().positive().min(1, "Espessura < 1mm não é permitida sem colapso estrutural"),
  espessura_medida_tampo_mm: z.number().positive().min(1),
  // Geometria Inherente (Isso normalmente viria do BD consultando o Vaso, mas assumindo payload para facilitar)
  S_mpa: z.number().positive(),
  E_junta: z.number().max(1).min(0.1),
  D_interno_mm: z.number().positive(),
  geometria_tampo: z.enum(['Toriesferico', 'Semi-eliptico']),
  // Dispositivos
  psv_calibracao_mpa: z.number().positive()
});

export async function salvarInspecaoNR13(formData: unknown) {
  // 1. Zod Parsing
  const data = InspecaoNR13Schema.safeParse(formData);
  if (!data.success) {
    return { success: false, errors: data.error.flatten() };
  }

  const {
    S_mpa, E_junta, D_interno_mm, 
    espessura_medida_costado_mm, 
    espessura_medida_tampo_mm, 
    geometria_tampo,
    psv_calibracao_mpa
  } = data.data;

  const R_interno = D_interno_mm / 2;

  // 2. DOUBLE-CHECK SILENCIOSO (Protocolo Arquiteto Sênior)
  // O Front-End já calculou, mas nós recalculamos aqui na Server Action 
  // usando o Domínio Puro. A segurança não confia no browser do usuário.
  const pmtaCostado = calcularPMTACilindro({
    S: S_mpa, E: E_junta, t: espessura_medida_costado_mm, R: R_interno, D: D_interno_mm
  });

  const pmtaTampo = geometria_tampo === 'Toriesferico' 
    ? calcularPMTATampoToriesferico({ S: S_mpa, E: E_junta, t: espessura_medida_tampo_mm, R: R_interno, D: D_interno_mm })
    : calcularPMTATampoSemiEliptico({ S: S_mpa, E: E_junta, t: espessura_medida_tampo_mm, R: R_interno, D: D_interno_mm });

  const limitante = calcularPMTAGlobal(pmtaCostado, pmtaTampo, psv_calibracao_mpa);

  // 3. Regra de Negócio Crítica (Especialista NR-13)
  // A PMTA recalculada devido ao desgaste na espessura não pode ser menor que a calibração da PSV (Válvula de Segurança).
  // Se for menor, a PSV não vai abrir a tempo e o vaso explode. Atribuímos status de CONDENAÇÃO ou DOWNGRADE restritivo.
  const statusSeguranca = limitante.condena ? 'Downgrade_Necessario' : 'Conforme';

  /*
   * 4. INSERT BANCO DE DADOS (Supabase SSR)
   * const supabase = createClient();
   * await supabase.from('inspecoes_nr13').insert({
   *    pmta_recalculada_mpa: limitante.pmtaLimitante,
   *    status: statusSeguranca,
   *    ...
   * })
   */

  return {
    success: true,
    pmtaVerificada: limitante.pmtaLimitante,
    statusFinal: statusSeguranca,
    alerta: limitante.condena ? 'CRITICO: PMTA inferior à calibração da PSV.' : 'Safe'
  };
}
