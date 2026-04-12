/**
 * Testes de validação do cálculo HRN (Hazard Rating Number)
 * Cobre: aritmética, fronteiras de classificação e todas as combinações válidas das tabelas
 */

import {
  calcularHRN,
  classificarNivel,
  TABELA_LO,
  TABELA_FE,
  TABELA_DPH,
  TABELA_NP,
} from './hrn'
import type { NivelHRN } from '@/types'

// ---------------------------------------------------------------------------
// 1. calcularHRN — aritmética
// ---------------------------------------------------------------------------

describe('calcularHRN — aritmética', () => {
  test('caso base documentado no PRD: LO=2 FE=5 DPH=15 NP=1 → 150', () => {
    expect(calcularHRN(2, 5, 15, 1)).toBe(150)
  })

  test('mínimo possível das tabelas: LO=0.033 FE=0.5 DPH=0.1 NP=1 → arredonda para 0', () => {
    // 0.033 × 0.5 × 0.1 × 1 = 0.00165 → toFixed(2) → "0.00" → 0
    // Correto: qualquer HRN < 0.005 é classificado como Aceitável
    expect(calcularHRN(0.033, 0.5, 0.1, 1)).toBe(0)
  })

  test('máximo possível das tabelas: LO=15 FE=5 DPH=20 NP=12 → 18000', () => {
    expect(calcularHRN(15, 5, 20, 12)).toBe(18000)
  })

  test('retorna número com no máximo 2 casas decimais', () => {
    const resultado = calcularHRN(1.5, 2.5, 0.5, 1)
    const casasDecimais = (resultado.toString().split('.')[1] ?? '').length
    expect(casasDecimais).toBeLessThanOrEqual(2)
  })

  test('resultado nunca é negativo com valores válidos das tabelas', () => {
    TABELA_LO.forEach(lo => {
      TABELA_FE.forEach(fe => {
        const resultado = calcularHRN(lo.valor, fe.valor, 4, 1)
        expect(resultado).toBeGreaterThanOrEqual(0)
      })
    })
  })
})

// ---------------------------------------------------------------------------
// 2. classificarNivel — fronteiras exatas
// ---------------------------------------------------------------------------

describe('classificarNivel — fronteiras de classificação', () => {
  // Tabela de referência da metodologia HRN
  const casos: Array<[number, NivelHRN]> = [
    [0,      'aceitavel'],
    [0.999,  'aceitavel'],
    [1,      'muito_baixo'],
    [4.999,  'muito_baixo'],
    [5,      'baixo'],
    [49.999, 'baixo'],
    [50,     'moderado'],
    [99.999, 'moderado'],
    [100,    'alto'],
    [499.999,'alto'],
    [500,    'muito_alto'],
    [999.999,'muito_alto'],
    [1000,   'intoleravel'],
    [18000,  'intoleravel'],
  ]

  test.each(casos)('HRN=%s → %s', (hrn, esperado) => {
    expect(classificarNivel(hrn)).toBe(esperado)
  })
})

// ---------------------------------------------------------------------------
// 3. Validação completa de todas as combinações das tabelas
// ---------------------------------------------------------------------------

describe('todas as combinações válidas das tabelas', () => {
  // Extrai apenas os valores numéricos de cada tabela
  const valoresLO  = TABELA_LO.map(i => i.valor)
  const valoresFE  = TABELA_FE.map(i => i.valor)
  const valoresDPH = TABELA_DPH.map(i => i.valor)
  const valoresNP  = TABELA_NP.map(i => i.valor)

  // Total: 7 × 6 × 8 × 5 = 1.680 combinações
  test('nenhuma combinação produz NaN ou Infinity', () => {
    valoresLO.forEach(lo => {
      valoresFE.forEach(fe => {
        valoresDPH.forEach(dph => {
          valoresNP.forEach(np => {
            const hrn = calcularHRN(lo, fe, dph, np)
            expect(isNaN(hrn)).toBe(false)
            expect(isFinite(hrn)).toBe(true)
          })
        })
      })
    })
  })

  test('nenhuma combinação produz HRN negativo', () => {
    valoresLO.forEach(lo => {
      valoresFE.forEach(fe => {
        valoresDPH.forEach(dph => {
          valoresNP.forEach(np => {
            expect(calcularHRN(lo, fe, dph, np)).toBeGreaterThanOrEqual(0)
          })
        })
      })
    })
  })

  test('classificarNivel retorna valor válido para toda combinação possível', () => {
    const niveisValidos: NivelHRN[] = [
      'aceitavel', 'muito_baixo', 'baixo', 'moderado', 'alto', 'muito_alto', 'intoleravel'
    ]

    valoresLO.forEach(lo => {
      valoresFE.forEach(fe => {
        valoresDPH.forEach(dph => {
          valoresNP.forEach(np => {
            const hrn = calcularHRN(lo, fe, dph, np)
            const nivel = classificarNivel(hrn)
            expect(niveisValidos).toContain(nivel)
          })
        })
      })
    })
  })

  test('quanto maior o HRN, nunca retorna nível de risco menor (monotonia)', () => {
    // A classificação deve ser monotônica: HRN maior → nível igual ou mais grave
    const escala: NivelHRN[] = [
      'aceitavel', 'muito_baixo', 'baixo', 'moderado', 'alto', 'muito_alto', 'intoleravel'
    ]

    const hrnsCrescentes = [0, 0.5, 1, 3, 5, 30, 50, 75, 100, 300, 500, 750, 1000, 5000, 18000]

    for (let i = 1; i < hrnsCrescentes.length; i++) {
      const nivelAnterior = escala.indexOf(classificarNivel(hrnsCrescentes[i - 1]))
      const nivelAtual    = escala.indexOf(classificarNivel(hrnsCrescentes[i]))
      expect(nivelAtual).toBeGreaterThanOrEqual(nivelAnterior)
    }
  })
})

// ---------------------------------------------------------------------------
// 4. Casos reais de laudos para regressão
// ---------------------------------------------------------------------------

describe('casos reais — regressão', () => {
  // Casos extraídos de laudos reais gerados pelo sistema
  const casosReais: Array<{
    descricao: string
    lo: number; fe: number; dph: number; np: number
    hrnEsperado: number
    nivelEsperado: NivelHRN
  }> = [
    {
      descricao: 'Proteção ausente — operador exposto diariamente',
      lo: 5, fe: 2.5, dph: 8, np: 1,
      hrnEsperado: 100,
      nivelEsperado: 'alto',
    },
    {
      descricao: 'Falta de aterramento — risco elétrico leve',
      lo: 2, fe: 1.5, dph: 4, np: 2,
      hrnEsperado: 24,
      nivelEsperado: 'baixo',
    },
    {
      descricao: 'Ausência de parada de emergência — risco crítico',
      lo: 8, fe: 5, dph: 15, np: 4,
      hrnEsperado: 2400,
      nivelEsperado: 'intoleravel',
    },
    {
      descricao: 'Sinalização ausente — risco baixo',
      lo: 1, fe: 1, dph: 2, np: 1,
      hrnEsperado: 2,
      nivelEsperado: 'muito_baixo',
    },
    {
      descricao: 'Risco praticamente impossível',
      lo: 0.033, fe: 0.5, dph: 0.1, np: 1,
      hrnEsperado: 0,
      nivelEsperado: 'aceitavel',
    },
  ]

  test.each(casosReais)('$descricao', ({ lo, fe, dph, np, hrnEsperado, nivelEsperado }) => {
    const hrn = calcularHRN(lo, fe, dph, np)
    expect(hrn).toBeCloseTo(hrnEsperado, 1)
    expect(classificarNivel(hrn)).toBe(nivelEsperado)
  })
})
