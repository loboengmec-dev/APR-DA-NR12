/**
 * Construtores de fórmula nativa do Word (OMML) para a memória de cálculo de PMTA.
 * Espelha exatamente as fórmulas de lib/domain/nr13/pmta.ts — isoladas aqui por
 * dependerem da lib `docx` (não usada no motor de cálculo puro).
 *
 * Cada função retorna a equação (fração real, com traço horizontal — não texto
 * aproximado) mais a tabela de variáveis com os valores da inspeção.
 */
import { Math as DocxMath, MathRun, MathFraction, type MathComponent } from 'docx'
import type { GeometriaCostado, GeometriaTampo } from './pmta'
import type { NormaCalculo } from './materiais'

export interface VarDef {
  simbolo: string
  descricao: string
  valor: string
}

export interface FormulaDef {
  /** Nome da referência normativa (ex: "UG-27(c)(1)") */
  ref: string
  titulo: string
  /** Fórmula original despejando P (isolada) — elemento Math nativo */
  math: DocxMath
  variaveis: VarDef[]
}

const mr = (t: string) => new MathRun(t)
const frac = (num: string, den: string) => new MathFraction({ numerator: [mr(num)], denominator: [mr(den)] })

function eq(...parts: MathComponent[]): DocxMath {
  return new DocxMath({ children: parts })
}

// ---------------------------------------------------------------------------
// COSTADOS
// ---------------------------------------------------------------------------

export function formulaCostadoCilindrico(S: number, E: number, t: number, R: number): FormulaDef {
  return {
    ref: 'ASME UG-27(c)(1)',
    titulo: 'Costado Cilíndrico — pressão interna',
    math: eq(mr('P = '), frac('S · E · t', 'R + 0,6 · t')),
    variaveis: [
      { simbolo: 'S', descricao: 'Tensão admissível de projeto', valor: `${S.toFixed(1)} kgf/cm²` },
      { simbolo: 'E', descricao: 'Eficiência da junta soldada', valor: `${E}` },
      { simbolo: 't', descricao: 'Espessura disponível', valor: `${t.toFixed(2)} mm` },
      { simbolo: 'R', descricao: 'Raio interno do costado', valor: `${R.toFixed(1)} mm` },
    ],
  }
}

export function formulaCostadoEsferico(S: number, E: number, t: number, R: number): FormulaDef {
  return {
    ref: 'ASME UG-27(d)',
    titulo: 'Costado Esférico — pressão interna',
    math: eq(mr('P = '), frac('2 · S · E · t', 'R + 0,2 · t')),
    variaveis: [
      { simbolo: 'S', descricao: 'Tensão admissível de projeto', valor: `${S.toFixed(1)} kgf/cm²` },
      { simbolo: 'E', descricao: 'Eficiência da junta soldada', valor: `${E}` },
      { simbolo: 't', descricao: 'Espessura disponível', valor: `${t.toFixed(2)} mm` },
      { simbolo: 'R', descricao: 'Raio interno do costado', valor: `${R.toFixed(1)} mm` },
    ],
  }
}

export function formulaCostadoCilindricoGBT150(S: number, E: number, t: number, D: number): FormulaDef {
  return {
    ref: 'GB/T 150-2011 Cláusula 5.2',
    titulo: 'Costado Cilíndrico — pressão interna (GB/T 150)',
    math: eq(mr('P = '), frac('2 · [σ] · φ · te', 'Di + te')),
    variaveis: [
      { simbolo: '[σ]', descricao: 'Tensão admissível', valor: `${S.toFixed(1)} kgf/cm²` },
      { simbolo: 'φ', descricao: 'Eficiência de junta', valor: `${E}` },
      { simbolo: 'te', descricao: 'Espessura efetiva', valor: `${t.toFixed(2)} mm` },
      { simbolo: 'Di', descricao: 'Diâmetro interno', valor: `${D.toFixed(1)} mm` },
    ],
  }
}

// ---------------------------------------------------------------------------
// TAMPOS
// ---------------------------------------------------------------------------

export function formulaTampoElipsoidal(S: number, E: number, t: number, D: number): FormulaDef {
  return {
    ref: 'ASME UG-32(d)',
    titulo: 'Tampo Elipsoidal 2:1 — pressão interna',
    math: eq(mr('P = '), frac('2 · S · E · t', 'D + 0,2 · t')),
    variaveis: [
      { simbolo: 'S', descricao: 'Tensão admissível de projeto', valor: `${S.toFixed(1)} kgf/cm²` },
      { simbolo: 'E', descricao: 'Eficiência da junta soldada', valor: `${E}` },
      { simbolo: 't', descricao: 'Espessura disponível', valor: `${t.toFixed(2)} mm` },
      { simbolo: 'D', descricao: 'Diâmetro interno', valor: `${D.toFixed(1)} mm` },
    ],
  }
}

export function formulaTampoToriesferico(S: number, E: number, t: number, L: number, M: number): FormulaDef {
  return {
    ref: 'ASME UG-32(e)',
    titulo: 'Tampo Torisférico (Flanged & Dished) — pressão interna',
    math: eq(mr('P = '), frac('2 · S · E · t', 'L · M + 0,2 · t')),
    variaveis: [
      { simbolo: 'S', descricao: 'Tensão admissível de projeto', valor: `${S.toFixed(1)} kgf/cm²` },
      { simbolo: 'E', descricao: 'Eficiência da junta soldada', valor: `${E}` },
      { simbolo: 't', descricao: 'Espessura disponível', valor: `${t.toFixed(2)} mm` },
      { simbolo: 'L', descricao: 'Raio de abaulamento', valor: `${L.toFixed(1)} mm` },
      { simbolo: 'M', descricao: 'Fator geométrico M = (3 + √(L/r)) / 4', valor: M.toFixed(4) },
    ],
  }
}

export function formulaTampoToriesfericoGBT150(S: number, E: number, t: number, D: number, K: number): FormulaDef {
  return {
    ref: 'GB/T 150-2011 Cláusula 5.3.1',
    titulo: 'Tampo Torisférico — pressão interna (GB/T 150)',
    math: eq(mr('P = '), frac('2 · [σ] · φ · te', 'K · Di + 0,5 · te')),
    variaveis: [
      { simbolo: '[σ]', descricao: 'Tensão admissível', valor: `${S.toFixed(1)} kgf/cm²` },
      { simbolo: 'φ', descricao: 'Eficiência de junta', valor: `${E}` },
      { simbolo: 'te', descricao: 'Espessura efetiva', valor: `${t.toFixed(2)} mm` },
      { simbolo: 'Di', descricao: 'Diâmetro interno', valor: `${D.toFixed(1)} mm` },
      { simbolo: 'K', descricao: 'Fator geométrico (Cláusula 5.3.1)', valor: K.toFixed(4) },
    ],
  }
}

export function formulaTampoSemiesferico(S: number, E: number, t: number, D: number): FormulaDef {
  return {
    ref: 'ASME UG-32(f)',
    titulo: 'Tampo Semiesférico — pressão interna',
    math: eq(mr('P = '), frac('2 · S · E · t', 'R + 0,2 · t')),
    variaveis: [
      { simbolo: 'S', descricao: 'Tensão admissível de projeto', valor: `${S.toFixed(1)} kgf/cm²` },
      { simbolo: 'E', descricao: 'Eficiência da junta soldada', valor: `${E}` },
      { simbolo: 't', descricao: 'Espessura disponível', valor: `${t.toFixed(2)} mm` },
      { simbolo: 'R', descricao: 'Raio interno do tampo (D/2)', valor: `${(D / 2).toFixed(1)} mm` },
    ],
  }
}

export function formulaTampoConico(S: number, E: number, t: number, D: number, alphaDeg: number): FormulaDef {
  return {
    ref: 'ASME UG-32(g)',
    titulo: 'Tampo Cônico (sem transição) — pressão interna',
    math: eq(mr('P = '), frac('2 · S · E · t · cos(α)', 'D + 1,2 · t · cos(α)')),
    variaveis: [
      { simbolo: 'S', descricao: 'Tensão admissível de projeto', valor: `${S.toFixed(1)} kgf/cm²` },
      { simbolo: 'E', descricao: 'Eficiência da junta soldada', valor: `${E}` },
      { simbolo: 't', descricao: 'Espessura disponível', valor: `${t.toFixed(2)} mm` },
      { simbolo: 'D', descricao: 'Diâmetro interno', valor: `${D.toFixed(1)} mm` },
      { simbolo: 'α', descricao: 'Semi-ângulo do cone', valor: `${alphaDeg}°` },
    ],
  }
}

// ---------------------------------------------------------------------------
// DESPACHO — mesma assinatura de lib/domain/nr13/pmta.ts (calcularPMTA*PorNorma)
// ---------------------------------------------------------------------------

export function formulaCostadoPorNorma(
  norma: NormaCalculo,
  geometria: GeometriaCostado,
  params: { S: number; E: number; t: number; R: number; D: number }
): FormulaDef {
  if (norma === 'GBT150' && geometria === 'cilindrico') {
    return formulaCostadoCilindricoGBT150(params.S, params.E, params.t, params.D)
  }
  if (geometria === 'esferico') return formulaCostadoEsferico(params.S, params.E, params.t, params.R)
  return formulaCostadoCilindrico(params.S, params.E, params.t, params.R)
}

export function formulaTampoPorNorma(
  norma: NormaCalculo,
  geometria: GeometriaTampo,
  params: { S: number; E: number; t: number; D: number; L?: number; M?: number; K?: number; alphaDeg?: number }
): FormulaDef {
  if (norma === 'GBT150' && geometria === 'toriesferico') {
    return formulaTampoToriesfericoGBT150(params.S, params.E, params.t, params.D, params.K ?? 0.93)
  }
  switch (geometria) {
    case 'elipsoidal':   return formulaTampoElipsoidal(params.S, params.E, params.t, params.D)
    case 'toriesferico': return formulaTampoToriesferico(params.S, params.E, params.t, params.L ?? params.D, params.M ?? 1.77)
    case 'semiesferico': return formulaTampoSemiesferico(params.S, params.E, params.t, params.D)
    case 'conico':       return formulaTampoConico(params.S, params.E, params.t, params.D, params.alphaDeg ?? 30)
    default:              return formulaTampoElipsoidal(params.S, params.E, params.t, params.D)
  }
}
