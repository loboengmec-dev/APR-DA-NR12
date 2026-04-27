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

/** Parâmetros para o costado cilíndrico (PG-27.2.2) */
export interface ParametrosPMTACaldeira {
  S: number;       // Tensão Admissível do Material (MPa)
  E: number;       // Eficiência de Junta (ex: 1.0, 0.85)
  t: number;       // Espessura disponível medida (mm)
  D: number;       // Diâmetro Interno da carcaça (mm)
  y?: number;      // Coeficiente de temperatura (default 0.4 para T < 482°C)
}

/**
 * Parâmetros para espelhos planos suportados (PG-31).
 *
 * ATENÇÃO: `d` ≠ Diâmetro total da caldeira.
 * Conforme ASME Section I PG-31, `d` é a MAIOR DISTÂNCIA NÃO SUPORTADA
 * entre os centros dos tubos de fogo, estroncas ou suportes adjacentes.
 * Usar o diâmetro da carcaça resulta em PMTA muito inferior à real.
 */
export interface ParametrosPMTAEspelhoPlano {
  S: number;   // Tensão Admissível do Material (MPa)
  E: number;   // Eficiência de Junta
  t: number;   // Espessura do espelho (mm)
  /** Maior distância não suportada entre centros de tubos/suportes (mm) — ASME PG-31 */
  d: number;
  /** Fator estrutural — 0.33 para espelhos soldados (fixo por norma, não editável) */
  C?: number;
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
// ESPELHOS PLANOS SUPORTADOS (Flat Stayed Heads) - ASME Sec. I (PG-31)
// ---------------------------------------------------------------------------

/**
 * PMTA para Espelhos Planos Suportados por Tubos de Fogo/Estroncas
 * Referência: ASME Section I — PG-31
 *
 * Fórmula canônica:
 *   t = d · √(C · P / (S · E))
 *
 * Isolando P:
 *   P = (t² · S · E) / (d² · C)
 *
 * VARIÁVEL CRÍTICA — `d`:
 *   Não é o diâmetro interno da caldeira (D).
 *   É a MAIOR DISTÂNCIA NÃO SUPORTADA entre os centros dos tubos de fogo,
 *   estroncas ou suportes adjacentes no espelho. Em caldeiras fire-tube
 *   típicas, `d` varia entre 100 mm e 350 mm (passo dos tubos).
 *   Usar D em vez de d produz PMTA artificial e incorretamente baixa.
 *
 * CONSTANTE C:
 *   0,33 — espelhos planos soldados com suporte por tubos (fixo por norma).
 *   Não deve ser editável pelo usuário.
 *
 * @param d  Maior distância não suportada entre centros de tubos/suportes (mm)
 * @param C  Fator estrutural (default 0.33 — não alterar sem base normativa)
 */
export function calcularPMTAEspelhoPlano({ S, E, t, d, C = 0.33 }: ParametrosPMTAEspelhoPlano): number {
  if (t <= 0 || d <= 0 || C <= 0) return 0;

  return (Math.pow(t, 2) * S * E) / (Math.pow(d, 2) * C);
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
