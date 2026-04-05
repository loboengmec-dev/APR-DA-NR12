/**
 * Especialista NR-13 (ASME Sec. VIII Div 1)
 * Módulo de Domínio Isolado (Domain-Driven Design)
 */

export interface ParametrosPMTA {
  S: number; // Tensão Admissível do Material (MPa)
  E: number; // Eficiência de Junta (ex: 1.0, 0.85, 0.70)
  t: number; // Espessura mínima medida menos margem de corrosão (mm)
  R: number; // Raio Interno do vaso (mm)
  D: number; // Diâmetro Interno do vaso (mm)
  L?: number; // Raio de abaulamento (apenas toriesférico, frequentemente = D) (mm)
}

/**
 * PMTA para o Costado Cilíndrico
 * ASME Sec. VIII Div. 1 - UG-27(c)(1)
 * @returns Pressão Máxima de Trabalho Admissível em MPa
 */
export function calcularPMTACilindro({ S, E, t, R }: ParametrosPMTA): number {
  if (t <= 0) return 0;
  return (S * E * t) / (R + 0.6 * t);
}

/**
 * PMTA para Tampo Semi-Elíptico (2:1)
 * ASME Sec. VIII Div. 1 - UG-32(c)
 * @returns Pressão Máxima de Trabalho Admissível em MPa
 */
export function calcularPMTATampoSemiEliptico({ S, E, t, D }: ParametrosPMTA): number {
  if (t <= 0) return 0;
  return (2 * S * E * t) / (D + 0.2 * t);
}

/**
 * PMTA para Tampo Toriesférico
 * ASME Sec. VIII Div. 1 - UG-32(d)
 * @returns Pressão Máxima de Trabalho Admissível em MPa
 */
export function calcularPMTATampoToriesferico({ S, E, t, D, L }: ParametrosPMTA): number {
  if (t <= 0) return 0;
  const raioAbaulamento = L ?? D; // Para tipo padrão comercial L = D
  return (S * E * t) / (0.885 * raioAbaulamento + 0.1 * t);
}

/**
 * Função unificada que retorna a menor PMTA da caldeira/vaso
 * O vaso inteiro é limitado pelo componente mais frágil.
 */
export function calcularPMTAGlobal(
  pmtaCostado: number,
  pmtaTampo: number,
  pressaoOperacao?: number
): { pmtaLimitante: number; componenteFragil: 'Costado' | 'Tampo'; condena: boolean } {
  
  const pmtaLimitante = Math.min(pmtaCostado, pmtaTampo);
  const componenteFragil = pmtaCostado < pmtaTampo ? 'Costado' : 'Tampo';
  const condena = pressaoOperacao ? pmtaLimitante < pressaoOperacao : false;

  return {
    pmtaLimitante,
    componenteFragil,
    condena
  };
}
