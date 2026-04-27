/**
 * Motor de Cálculo PMTA para Caldeiras
 * Módulo de Domínio Isolado (Domain-Driven Design)
 *
 * Suporta normativas para Caldeiras (ASME Sec. I e ASME Sec. IV)
 *
 * Unidades: MPa para tensão, mm para dimensões → resultado em MPa.
 */

import { NormaCalculo } from './materiais';

// ---------------------------------------------------------------------------
// TIPOS
// ---------------------------------------------------------------------------

export interface ParametrosPMTACaldeira {
  S: number;       // Tensão Admissível do Material (MPa)
  E: number;       // Eficiência de Junta (ex: 1.0, 0.85)
  t: number;       // Espessura disponível medida (mm) — já descontada corrosão futura
  D: number;       // Diâmetro Interno (mm)
  y?: number;      // Coeficiente de temperatura (default 0.4 para T < 482°C)
  C?: number;      // Fator estrutural do espelho plano (default 0.33)
}

// ---------------------------------------------------------------------------
// COSTADO (Cylindrical Shell) - ASME Sec. I (PG-27.2.2)
// ---------------------------------------------------------------------------

/**
 * PMTA para Costado Cilíndrico de Caldeira (ASME Section I - PG-27.2.2)
 *
 * Fórmula da espessura: t = P·D / (2·S·E + 2·y·P)
 * Isolando P: P = 2·S·E·t / (D - 2·y·t)
 *
 * Onde:
 *  - D = Diâmetro Interno
 *  - y = Coeficiente de temperatura (0.4 para aços ferríticos < 482°C)
 */
export function calcularPMTACostadoCaldeira({ S, E, t, D, y = 0.4 }: ParametrosPMTACaldeira): number {
  if (t <= 0 || D <= 0) return 0;
  
  // Condição para prevenir divisor < 0 em espessuras gigantescas anormais
  const divisor = D - (2 * y * t);
  if (divisor <= 0) return 0;

  return (2 * S * E * t) / divisor;
}

// ---------------------------------------------------------------------------
// ESPELHOS PLANOS (Flat Unstayed Heads) - ASME Sec. I (PG-31)
// ---------------------------------------------------------------------------

/**
 * PMTA para Espelhos Planos NÂO estaiados (Flat Unstayed Heads - ASME Section I - PG-31)
 *
 * Aplicável para espelhos retos/planos comuns.
 * Fórmula da espessura min: t = d * sqrt(C * P / (S * E))
 * Onde "d" = Diâmetro Interno = D
 * 
 * Isolando P:
 * t² = D² * (C * P) / (S * E)
 * P = t² * S * E / (D² * C)
 *
 * @param C - Fator construtivo (default 0.33 para espelhos soldados tipicamente)
 */
export function calcularPMTAEspelhoPlano({ S, E, t, D, C = 0.33 }: ParametrosPMTACaldeira): number {
  if (t <= 0 || D <= 0 || C <= 0) return 0;
  
  return (Math.pow(t, 2) * S * E) / (Math.pow(D, 2) * C);
}

// ---------------------------------------------------------------------------
// CÁLCULO DUAL PARA CORROSÃO / TAXA DE CORROSÃO
// ---------------------------------------------------------------------------

/**
 * Calcula a Taxa de Corrosão em mm/ano a partir de medições históricas de espessura.
 * @param espessuraAnterior mm medido no laudo passado
 * @param espessuraAtual mm medido no laudo presente
 * @param mesesDecorridos Tempo percorrido entre as malhas de medição
 * @returns mm/ano de desgaste
 */
export function calcularTaxaCorrosaoAnual(espessuraAnterior: number, espessuraAtual: number, mesesDecorridos: number): number {
  if (mesesDecorridos <= 0) return 0;
  if (espessuraAtual >= espessuraAnterior) return 0; // Ganho ou manutenção de espessura real/erro tolerável

  const perda = espessuraAnterior - espessuraAtual;
  const anos = mesesDecorridos / 12;
  return perda / anos;
}

export interface ResultadoPMTACaldeiraGlobal {
  pmtaLimitante: number;
  componenteFragil: 'Costado' | 'Espelho';
  condena: boolean;
}

/**
 * Retorna a menor PMTA da caldeira como um todo.
 * Limitado pelo componente mais frágil.
 */
export function calcularPMTACaldeiraGlobal(
  pmtaCostado: number,
  pmtaEspelho: number,
  pressaoProjeto?: number
): ResultadoPMTACaldeiraGlobal {
  const limitante = Math.min(pmtaCostado, pmtaEspelho);
  const componenteFragil = pmtaCostado <= pmtaEspelho ? 'Costado' : 'Espelho';
  const condena = pressaoProjeto ? limitante < pressaoProjeto : false;

  return { pmtaLimitante: limitante, componenteFragil, condena };
}
