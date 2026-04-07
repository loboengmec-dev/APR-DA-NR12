/**
 * Especialista NR-13 (ASME Sec. VIII Div 1)
 * Módulo de Domínio Isolado (Domain-Driven Design)
 *
 * Cálculos de PMTA (Pressão Máxima de Trabalho Admissível) para
 * todas as geometrias previstas na norma ASME Sec. VIII Div 1.
 *
 * Referências:
 *  - UG-27(c)(1): Casco cilíndrico
 *  - UG-27(d):    Casco esférico
 *  - UG-32(d):    Tampo elipsoidal 2:1
 *  - UG-32(e):    Tampo torisférico
 *  - UG-32(f):    Tampo semiesférico
 *  - UG-32(g):    Tampo cônico (sem transição)
 */

// ---------------------------------------------------------------------------
// TIPOS
// ---------------------------------------------------------------------------

export type GeometriaCostado = 'cilindrico' | 'esferico';
export type GeometriaTampo =
  | 'elipsoidal'    // 2:1 — UG-32(d)
  | 'toriesferico'  // UG-32(e)
  | 'semiesferico'  // UG-32(f)
  | 'conico';       // UG-32(g)

export interface ParametrosPMTA {
  S: number;       // Tensão Admissível do Material (MPa)
  E: number;       // Eficiência de Junta (ex: 1.0, 0.85, 0.70)
  t: number;       // Espessura disponível (mm) — já descontada a corrosão quando aplicável
  R: number;       // Raio Interno do vaso (mm)
  D: number;       // Diâmetro Interno do vaso (mm)
  L?: number;      // Raio de abaulamento — torisférico (mm). Default = D
  r?: number;      // Raio de rebordo (knuckle) — torisférico (mm). Default = 0.06·D
  alpha?: number;  // Semi-ângulo do cone — cônico (graus)
}

/** Resultado de cálculo dual: condição Nova/Fria vs Corroída/Quente */
export interface ResultadoPMTADual {
  novaFria: number;        // PMTA com S_frio e t_nominal (MPa)
  corroidaQuente: number;  // PMTA com S_quente e t_corroído (MPa)
  limitante: number;       // menor das duas (MPa)
  condicaoLimitante: 'Nova/Fria' | 'Corroída/Quente';
}

/** Resultado do cálculo global (componente mais frágil) */
export interface ResultadoPMTAGlobal {
  pmtaLimitante: number;
  componenteFragil: 'Costado' | 'Tampo';
  condena: boolean;
}

// ---------------------------------------------------------------------------
// COSTADOS
// ---------------------------------------------------------------------------

/**
 * PMTA para Costado Cilíndrico — circunferencial (longitudinal stress)
 * ASME Sec. VIII Div. 1 — UG-27(c)(1)
 *
 * Fórmula da espessura: t = P·R / (S·E − 0.6·P)
 * Isolando P:  P = S·E·t / (R + 0.6·t)
 *
 * Válida quando t ≤ R/2 (vasos de parede fina).
 */
export function calcularPMTACilindro({ S, E, t, R }: ParametrosPMTA): number {
  if (t <= 0 || R <= 0) return 0;
  return (S * E * t) / (R + 0.6 * t);
}

/**
 * PMTA para Costado Esférico
 * ASME Sec. VIII Div. 1 — UG-27(d)
 *
 * Fórmula da espessura: t = P·R / (2·S·E − 0.2·P)
 * Isolando P:  P = 2·S·E·t / (R + 0.2·t)
 *
 * Válida quando t ≤ 0.356·R.
 */
export function calcularPMTAEsfera({ S, E, t, R }: ParametrosPMTA): number {
  if (t <= 0 || R <= 0) return 0;
  return (2 * S * E * t) / (R + 0.2 * t);
}

// ---------------------------------------------------------------------------
// TAMPOS
// ---------------------------------------------------------------------------

/**
 * PMTA para Tampo Elipsoidal 2:1
 * ASME Sec. VIII Div. 1 — UG-32(d)
 *
 * Fórmula da espessura: t = P·D / (2·S·E − 0.2·P)
 * Isolando P:  P = 2·S·E·t / (D + 0.2·t)
 */
export function calcularPMTATampoElipsoidal({ S, E, t, D }: ParametrosPMTA): number {
  if (t <= 0 || D <= 0) return 0;
  return (2 * S * E * t) / (D + 0.2 * t);
}

/**
 * Fator M para tampos torisféricos — UG-32(e)
 *
 * M = (3 + √(L/r)) / 4
 *
 * Onde L = raio de abaulamento e r = raio de rebordo.
 * Para tampo padrão comercial (Flanged & Dished): L = D, r = 0.06·D → M ≈ 1.77
 */
export function calcularFatorM(L: number, r: number): number {
  if (r <= 0 || L <= 0) return 1.77; // fallback padrão comercial
  return (3 + Math.sqrt(L / r)) / 4;
}

/**
 * PMTA para Tampo Torisférico (Flanged & Dished)
 * ASME Sec. VIII Div. 1 — UG-32(e)
 *
 * Fórmula da espessura: t = P·L·M / (2·S·E − 0.2·P)
 * Isolando P:  P = 2·S·E·t / (L·M + 0.2·t)
 *
 * @param L - Raio de abaulamento (mm). Default = D.
 * @param r - Raio de rebordo (mm). Default = 0.06·D (padrão comercial).
 */
export function calcularPMTATampoToriesferico({ S, E, t, D, L, r: rKnuckle }: ParametrosPMTA): number {
  if (t <= 0 || D <= 0) return 0;
  const raioAbaulamento = L ?? D;
  const raioRebordo = rKnuckle ?? 0.06 * D;
  const M = calcularFatorM(raioAbaulamento, raioRebordo);
  return (2 * S * E * t) / (raioAbaulamento * M + 0.2 * t);
}

/**
 * PMTA para Tampo Semiesférico
 * ASME Sec. VIII Div. 1 — UG-32(f)
 *
 * Mesma fórmula do casco esférico:
 * t = P·R / (2·S·E − 0.2·P)
 * Isolando P:  P = 2·S·E·t / (R + 0.2·t)
 *
 * Onde R = D/2 (raio interno do tampo semiesférico).
 */
export function calcularPMTATampoSemiesferico({ S, E, t, D }: ParametrosPMTA): number {
  if (t <= 0 || D <= 0) return 0;
  const R = D / 2;
  return (2 * S * E * t) / (R + 0.2 * t);
}

/**
 * PMTA para Tampo Cônico (sem transição — knuckle)
 * ASME Sec. VIII Div. 1 — UG-32(g)
 *
 * Fórmula da espessura: t = P·D / (2·cos(α)·(S·E − 0.6·P))
 * Isolando P:  P = 2·S·E·t·cos(α) / (D + 1.2·t·cos(α))
 *
 * @param alpha - Semi-ângulo do cone em GRAUS (ex: 30°). Máximo 30° sem análise especial.
 */
export function calcularPMTAConico({ S, E, t, D, alpha }: ParametrosPMTA): number {
  if (t <= 0 || D <= 0 || !alpha || alpha <= 0 || alpha >= 90) return 0;
  const cosAlpha = Math.cos((alpha * Math.PI) / 180);
  return (2 * S * E * t * cosAlpha) / (D + 1.2 * t * cosAlpha);
}

// ---------------------------------------------------------------------------
// FUNÇÕES DE DESPACHO (por geometria)
// ---------------------------------------------------------------------------

/** Calcula PMTA do costado pela geometria selecionada */
export function calcularPMTACostado(
  geometria: GeometriaCostado,
  params: ParametrosPMTA
): number {
  switch (geometria) {
    case 'cilindrico': return calcularPMTACilindro(params);
    case 'esferico':   return calcularPMTAEsfera(params);
    default:           return 0;
  }
}

/** Calcula PMTA do tampo pela geometria selecionada */
export function calcularPMTATampo(
  geometria: GeometriaTampo,
  params: ParametrosPMTA
): number {
  switch (geometria) {
    case 'elipsoidal':   return calcularPMTATampoElipsoidal(params);
    case 'toriesferico': return calcularPMTATampoToriesferico(params);
    case 'semiesferico': return calcularPMTATampoSemiesferico(params);
    case 'conico':       return calcularPMTAConico(params);
    default:             return 0;
  }
}

// ---------------------------------------------------------------------------
// CÁLCULO DUAL: NOVA/FRIA vs CORROÍDA/QUENTE
// ---------------------------------------------------------------------------

export interface ParametrosDual {
  /** Tensão admissível na temperatura ambiente / fria (MPa) */
  S_frio: number;
  /** Tensão admissível na temperatura de operação / quente (MPa) */
  S_quente: number;
  /** Eficiência de junta */
  E: number;
  /** Espessura nominal de projeto (mm) */
  t_nominal: number;
  /** Espessura mínima medida menos corrosão futura (mm) */
  t_corroido: number;
  /** Diâmetro interno (mm) */
  D: number;
  /** Raio de abaulamento — torisférico (mm) */
  L?: number;
  /** Raio de rebordo — torisférico (mm) */
  r?: number;
  /** Semi-ângulo do cone (graus) */
  alpha?: number;
}

/**
 * Calcula PMTA para ambas as condições de um componente:
 * - Nova/Fria: S = S_frio, t = t_nominal
 * - Corroída/Quente: S = S_quente, t = t_corroído
 *
 * A PMTA efetiva é a MENOR das duas condições.
 */
export function calcularPMTADual(
  geometria: GeometriaCostado | GeometriaTampo,
  params: ParametrosDual
): ResultadoPMTADual {
  const R = params.D / 2;

  const baseNovaFria: ParametrosPMTA = {
    S: params.S_frio, E: params.E, t: params.t_nominal,
    R, D: params.D, L: params.L, r: params.r, alpha: params.alpha,
  };

  const baseCorroida: ParametrosPMTA = {
    S: params.S_quente, E: params.E, t: params.t_corroido,
    R, D: params.D, L: params.L, r: params.r, alpha: params.alpha,
  };

  // Determina se é costado ou tampo para despachar a função correta
  const isCostado = geometria === 'cilindrico' || geometria === 'esferico';
  const novaFria = isCostado
    ? calcularPMTACostado(geometria as GeometriaCostado, baseNovaFria)
    : calcularPMTATampo(geometria as GeometriaTampo, baseNovaFria);

  const corroidaQuente = isCostado
    ? calcularPMTACostado(geometria as GeometriaCostado, baseCorroida)
    : calcularPMTATampo(geometria as GeometriaTampo, baseCorroida);

  const limitante = Math.min(novaFria, corroidaQuente);
  const condicaoLimitante: ResultadoPMTADual['condicaoLimitante'] =
    novaFria <= corroidaQuente ? 'Nova/Fria' : 'Corroída/Quente';

  return { novaFria, corroidaQuente, limitante, condicaoLimitante };
}

// ---------------------------------------------------------------------------
// CÁLCULO GLOBAL (componente mais frágil)
// ---------------------------------------------------------------------------

/**
 * Retorna a menor PMTA do vaso inteiro.
 * O vaso é limitado pelo componente estruturalmente mais frágil.
 */
export function calcularPMTAGlobal(
  pmtaCostado: number,
  pmtaTampo: number,
  pressaoOperacao?: number
): ResultadoPMTAGlobal {
  const pmtaLimitante = Math.min(pmtaCostado, pmtaTampo);
  const componenteFragil = pmtaCostado <= pmtaTampo ? 'Costado' : 'Tampo';
  const condena = pressaoOperacao ? pmtaLimitante < pressaoOperacao : false;

  return { pmtaLimitante, componenteFragil, condena };
}

// ---------------------------------------------------------------------------
// ALIAS DE RETROCOMPATIBILIDADE
// ---------------------------------------------------------------------------

/**
 * @deprecated Use calcularPMTATampoElipsoidal. Mantido para compatibilidade.
 */
export const calcularPMTATampoSemiEliptico = calcularPMTATampoElipsoidal;
