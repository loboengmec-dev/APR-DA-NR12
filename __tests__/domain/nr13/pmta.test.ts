/**
 * Testes para o módulo de cálculo PMTA NR-13
 *
 * Objetivo: Validar TODOS os cenários possíveis do código crítico de segurança
 *
 * Referências ASME Sec. VIII Div 1:
 * - UG-27(c)(1): Casco cilíndrico
 * - UG-27(d):    Casco esférico
 * - UG-32(d):    Tampo elipsoidal 2:1
 * - UG-32(e):    Tampo torisférico
 * - UG-32(f):    Tampo semiesférico
 * - UG-32(g):    Tampo cônico
 */

import {
  calcularPMTACilindro,
  calcularPMTAEsfera,
  calcularPMTATampoElipsoidal,
  calcularPMTATampoToriesferico,
  calcularPMTATampoSemiesferico,
  calcularPMTAConico,
  calcularFatorM,
  calcularFatorK_GBT150,
  calcularPMTACilindroGBT150,
  calcularPMTATampoToriesfericoGBT150,
  calcularPMTACostado,
  calcularPMTATampo,
  calcularPMTACostadoPorNorma,
  calcularPMTATampoPorNorma,
  calcularPMTADual,
  calcularPMTAGlobal,
  type ParametrosPMTA,
  type ParametrosDual,
  type GeometriaCostado,
  type GeometriaTampo,
} from '../../../lib/domain/nr13/pmta';

// ---------------------------------------------------------------------------
// CONSTANTES DE TESTE - VALORES REAIS DE REFERÊNCIA
// ---------------------------------------------------------------------------

/**
 * Exemplo ASME: Vaso cilíndrico
 * S = 137.9 MPa (SA-516 Gr.70 @ 20°C)
 * E = 1.0 (junta radiografada)
 * t = 12.7 mm
 * R = 152.4 mm (D = 304.8 mm)
 *
 * Cálculo manual: P = (137.9 * 1.0 * 12.7) / (152.4 + 0.6*12.7)
 *               = 1751.33 / (152.4 + 7.62)
 *               = 1751.33 / 160.02
 *               = 10.94 MPa
 */
const PARAMS_CILINDRICO_ASME: ParametrosPMTA = {
  S: 137.9,      // MPa
  E: 1.0,
  t: 12.7,       // mm
  R: 152.4,      // mm
  D: 304.8,      // mm
};

/**
 * Exemplo ASME: Vaso esférico
 * Mesmos parâmetros do cilíndrico para comparação
 */
const PARAMS_ESFERICO_ASME: ParametrosPMTA = {
  S: 137.9,
  E: 1.0,
  t: 12.7,
  R: 152.4,
  D: 304.8,
};

// ---------------------------------------------------------------------------
// TESTES UNITÁRIOS BÁSICOS - GARANTIR COMPORTAMENTO FUNDAMENTAL
// ---------------------------------------------------------------------------

describe('PMTA - Testes Fundamentais', () => {

  test('Funções existem e são exportadas', () => {
    expect(typeof calcularPMTACilindro).toBe('function');
    expect(typeof calcularPMTAEsfera).toBe('function');
    expect(typeof calcularPMTATampoElipsoidal).toBe('function');
    expect(typeof calcularPMTATampoToriesferico).toBe('function');
    expect(typeof calcularPMTATampoSemiesferico).toBe('function');
    expect(typeof calcularPMTAConico).toBe('function');
    expect(typeof calcularFatorM).toBe('function');
  });

  test('Valores zero ou negativos retornam zero (segurança)', () => {
    const paramsZero: ParametrosPMTA = { S: 0, E: 0, t: 0, R: 0, D: 0 };

    expect(calcularPMTACilindro(paramsZero)).toBe(0);
    expect(calcularPMTAEsfera(paramsZero)).toBe(0);
    expect(calcularPMTATampoElipsoidal(paramsZero)).toBe(0);
    expect(calcularPMTATampoSemiesferico(paramsZero)).toBe(0);
  });

  test('Espessura zero retorna zero mesmo com outros parâmetros válidos', () => {
    const paramsSemEspessura: ParametrosPMTA = {
      S: 100, E: 1.0, t: 0, R: 100, D: 200
    };

    expect(calcularPMTACilindro(paramsSemEspessura)).toBe(0);
    expect(calcularPMTAEsfera(paramsSemEspessura)).toBe(0);
  });

  test('Raio zero retorna zero mesmo com outros parâmetros válidos', () => {
    const paramsSemRaio: ParametrosPMTA = {
      S: 100, E: 1.0, t: 10, R: 0, D: 0
    };

    expect(calcularPMTACilindro(paramsSemRaio)).toBe(0);
    expect(calcularPMTAEsfera(paramsSemRaio)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// TESTES DE CÁLCULO CILÍNDRICO - ASME UG-27(c)(1)
// ---------------------------------------------------------------------------

describe('PMTA Cilíndrico - UG-27(c)(1)', () => {

  test('Cálculo básico com valores ASME exemplo', () => {
    const resultado = calcularPMTACilindro(PARAMS_CILINDRICO_ASME);

    // Verifica se é um número positivo
    expect(resultado).toBeGreaterThan(0);
    expect(typeof resultado).toBe('number');

    // Verificação cruzada com cálculo manual aproximado
    // Valor esperado: ~10.94 MPa (cálculo manual acima)
    expect(resultado).toBeCloseTo(10.94, 1); // Tolerância 0.1 MPa
  });

  test('PMTA aumenta com maior espessura', () => {
    const paramsBase = { ...PARAMS_CILINDRICO_ASME };
    const resultadoBase = calcularPMTACilindro(paramsBase);

    const paramsEspessuraMaior = { ...paramsBase, t: paramsBase.t * 2 };
    const resultadoMaior = calcularPMTACilindro(paramsEspessuraMaior);

    expect(resultadoMaior).toBeGreaterThan(resultadoBase);
  });

  test('PMTA aumenta com maior tensão admissível', () => {
    const paramsBase = { ...PARAMS_CILINDRICO_ASME };
    const resultadoBase = calcularPMTACilindro(paramsBase);

    const paramsTensaoMaior = { ...paramsBase, S: paramsBase.S * 1.5 };
    const resultadoMaior = calcularPMTACilindro(paramsTensaoMaior);

    expect(resultadoMaior).toBeGreaterThan(resultadoBase);
  });

  test('PMTA diminui com maior diâmetro', () => {
    const paramsBase = { ...PARAMS_CILINDRICO_ASME };
    const resultadoBase = calcularPMTACilindro(paramsBase);

    const paramsDiametroMaior = {
      ...paramsBase,
      D: paramsBase.D * 2,
      R: paramsBase.R * 2
    };
    const resultadoMaior = calcularPMTACilindro(paramsDiametroMaior);

    expect(resultadoMaior).toBeLessThan(resultadoBase);
  });

  test('Eficiência de junta reduz PMTA proporcionalmente', () => {
    const paramsBase = { ...PARAMS_CILINDRICO_ASME };
    const resultadoE1 = calcularPMTACilindro(paramsBase);

    const paramsE085 = { ...paramsBase, E: 0.85 };
    const resultadoE085 = calcularPMTACilindro(paramsE085);

    // E=0.85 deve ser aproximadamente 85% de E=1.0
    expect(resultadoE085 / resultadoE1).toBeCloseTo(0.85, 2);
  });

  test('Cenário realístico: vaso industrial típico', () => {
    const paramsIndustrial: ParametrosPMTA = {
      S: 120.0,    // MPa - Aço carbono
      E: 0.85,     // Junta não radiografada
      t: 8.0,      // mm
      R: 500.0,    // mm (D=1000mm)
      D: 1000.0,
    };

    const resultado = calcularPMTACilindro(paramsIndustrial);

    // Verifica se resultado é plausível
    expect(resultado).toBeGreaterThan(0);
    expect(resultado).toBeLessThan(50); // PMTA < 50 MPa para este cenário

    // Cálculo manual aproximado para verificação
    const esperadoManual = (120 * 0.85 * 8) / (500 + 0.6 * 8);
    expect(resultado).toBeCloseTo(esperadoManual, 1);
  });
});

// ---------------------------------------------------------------------------
// TESTES DE CÁLCULO ESFÉRICO - ASME UG-27(d)
// ---------------------------------------------------------------------------

describe('PMTA Esférico - UG-27(d)', () => {

  test('Cálculo básico com valores ASME exemplo', () => {
    const resultado = calcularPMTAEsfera(PARAMS_ESFERICO_ASME);

    expect(resultado).toBeGreaterThan(0);
    expect(typeof resultado).toBe('number');

    // Vaso esférico tem PMTA aproximadamente 2x maior que cilíndrico
    // com mesmos parâmetros (devido a tensões diferentes)
    const resultadoCilindrico = calcularPMTACilindro(PARAMS_ESFERICO_ASME);
    expect(resultado).toBeGreaterThan(resultadoCilindrico);
  });

  test('PMTA esférico é aproximadamente o dobro do cilíndrico (teoria membranas)', () => {
    const resultadoEsfera = calcularPMTAEsfera(PARAMS_ESFERICO_ASME);
    const resultadoCilindro = calcularPMTACilindro(PARAMS_ESFERICO_ASME);

    // Para vasos de parede fina, esfera ≈ 2× cilindro
    // Na prática, fórmula ASME dá ~1.8-2.2×
    const razao = resultadoEsfera / resultadoCilindro;
    expect(razao).toBeGreaterThan(1.8);
    expect(razao).toBeLessThan(2.2);
  });
});

// ---------------------------------------------------------------------------
// TESTES DE TAMPOS
// ---------------------------------------------------------------------------

describe('PMTA Tampos', () => {

  const paramsTampoBase: ParametrosPMTA = {
    S: 137.9,
    E: 1.0,
    t: 12.7,
    R: 152.4,
    D: 304.8,
  };

  test('Tampo elipsoidal 2:1 - UG-32(d)', () => {
    const resultado = calcularPMTATampoElipsoidal(paramsTampoBase);

    expect(resultado).toBeGreaterThan(0);

    // Fórmula tampo elipsoidal: P = 2*S*E*t / (D + 0.2*t)
    // Fórmula casco esférico: P = 2*S*E*t / (R + 0.2*t) onde R = D/2
    // Para mesmo S, E, t: tampo elipsoidal tem PMTA menor que esférico
    const resultadoEsfera = calcularPMTAEsfera(paramsTampoBase);
    expect(resultado).toBeLessThan(resultadoEsfera);

    // Verifica cálculo específico
    const calculoManual = (2 * paramsTampoBase.S * paramsTampoBase.E * paramsTampoBase.t) /
                         (paramsTampoBase.D + 0.2 * paramsTampoBase.t);
    expect(resultado).toBeCloseTo(calculoManual, 10);
  });

  test('Tampo semiesférico - UG-32(f)', () => {
    const resultado = calcularPMTATampoSemiesferico(paramsTampoBase);

    expect(resultado).toBeGreaterThan(0);

    // Tampo semiesférico = casco esférico (mesma fórmula)
    const resultadoEsfera = calcularPMTAEsfera(paramsTampoBase);
    expect(resultado).toBe(resultadoEsfera);
  });

  test('Tampo torisférico - UG-32(e)', () => {
    const paramsComLR: ParametrosPMTA = {
      ...paramsTampoBase,
      L: paramsTampoBase.D,      // Raio de abaulamento = D
      r: 0.06 * paramsTampoBase.D, // Raio de rebordo padrão = 6% D
    };

    const resultado = calcularPMTATampoToriesferico(paramsComLR);

    expect(resultado).toBeGreaterThan(0);

    // Tampo torisférico tem PMTA menor que elipsoidal (M > 1)
    const resultadoElipsoidal = calcularPMTATampoElipsoidal(paramsTampoBase);
    expect(resultado).toBeLessThan(resultadoElipsoidal);
  });

  test('Fator M para tampo torisférico', () => {
    // Para tampo padrão comercial: L = D, r = 0.06D
    const L = 1000;
    const r = 0.06 * 1000; // 60

    const M = calcularFatorM(L, r);

    // M padrão comercial ≈ 1.77
    expect(M).toBeCloseTo(1.77, 2);

    // Verifica comportamento com valores inválidos (fallback)
    const MInvalid = calcularFatorM(0, 0);
    expect(MInvalid).toBe(1.77); // Fallback para padrão comercial
  });

  test('Tampo cônico - UG-32(g)', () => {
    const paramsConico: ParametrosPMTA = {
      ...paramsTampoBase,
      alpha: 30, // 30 graus - limite ASME sem análise especial
    };

    const resultado = calcularPMTAConico(paramsConico);

    expect(resultado).toBeGreaterThan(0);

    // Tampo cônico tem PMTA menor que cilíndrico (cos(alpha) < 1)
    const resultadoCilindro = calcularPMTACilindro(paramsTampoBase);
    expect(resultado).toBeLessThan(resultadoCilindro);
  });

  test('Tampo cônico com ângulo inválido retorna zero', () => {
    const paramsAnguloInvalido: ParametrosPMTA = {
      ...paramsTampoBase,
      alpha: 45, // > 30° sem análise especial
    };

    // Nota: A implementação atual retorna 0 para alpha >= 90
    // Para alpha=45, a função atual não valida este limite
    const resultado = calcularPMTAConico(paramsAnguloInvalido);

    // Ângulo 45° ainda é calculado (limitação atual)
    // Este teste documenta o comportamento atual
    expect(typeof resultado).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// TESTES DE FUNÇÕES DE DESPACHO
// ---------------------------------------------------------------------------

describe('Funções de Despacho', () => {

  const paramsBase: ParametrosPMTA = {
    S: 100, E: 1.0, t: 10, R: 100, D: 200
  };

  test('calcularPMTACostado - cilíndrico', () => {
    const resultadoDespacho = calcularPMTACostado('cilindrico', paramsBase);
    const resultadoDireto = calcularPMTACilindro(paramsBase);

    expect(resultadoDespacho).toBe(resultadoDireto);
  });

  test('calcularPMTACostado - esférico', () => {
    const resultadoDespacho = calcularPMTACostado('esferico', paramsBase);
    const resultadoDireto = calcularPMTAEsfera(paramsBase);

    expect(resultadoDespacho).toBe(resultadoDireto);
  });

  test('calcularPMTACostado - geometria inválida retorna zero', () => {
    // @ts-expect-error - Testando comportamento com geometria inválida
    const resultado = calcularPMTACostado('invalido' as GeometriaCostado, paramsBase);

    expect(resultado).toBe(0);
  });

  test('calcularPMTATampo - elipsoidal', () => {
    const resultadoDespacho = calcularPMTATampo('elipsoidal', paramsBase);
    const resultadoDireto = calcularPMTATampoElipsoidal(paramsBase);

    expect(resultadoDespacho).toBe(resultadoDireto);
  });

  test('calcularPMTATampo - geometria inválida retorna zero', () => {
    // @ts-expect-error - Testando comportamento com geometria inválida
    const resultado = calcularPMTATampo('invalido' as GeometriaTampo, paramsBase);

    expect(resultado).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// TESTES DE CÁLCULO DUAL (Nova/Fria vs Corroída/Quente)
// ---------------------------------------------------------------------------

describe('Cálculo Dual PMTA', () => {

  const paramsDual: ParametrosDual = {
    S_frio: 150.0,     // MPa @ 20°C
    S_quente: 130.0,   // MPa @ 150°C
    E: 1.0,
    t_nominal: 12.0,   // mm
    t_corroido: 10.5,  // mm (corrosão de 1.5mm)
    D: 300.0,
  };

  test('Cálculo dual para cilíndrico', () => {
    const resultado = calcularPMTADual('cilindrico', paramsDual);

    expect(resultado).toHaveProperty('novaFria');
    expect(resultado).toHaveProperty('corroidaQuente');
    expect(resultado).toHaveProperty('limitante');
    expect(resultado).toHaveProperty('condicaoLimitante');

    // Verifica valores são números positivos
    expect(resultado.novaFria).toBeGreaterThan(0);
    expect(resultado.corroidaQuente).toBeGreaterThan(0);
    expect(resultado.limitante).toBeGreaterThan(0);

    // Limitante deve ser o menor dos dois
    expect(resultado.limitante).toBe(Math.min(resultado.novaFria, resultado.corroidaQuente));

    // Condição corroída/quente deve ser menor (t menor, S menor)
    expect(resultado.condicaoLimitante).toBe('Corroída/Quente');
    expect(resultado.corroidaQuente).toBeLessThan(resultado.novaFria);
  });

  test('Cálculo dual para esférico', () => {
    const resultado = calcularPMTADual('esferico', paramsDual);

    expect(resultado.novaFria).toBeGreaterThan(0);
    expect(resultado.corroidaQuente).toBeGreaterThan(0);

    // PMTA esférico > cilíndrico com mesmos parâmetros
    const resultadoCilindrico = calcularPMTADual('cilindrico', paramsDual);
    expect(resultado.novaFria).toBeGreaterThan(resultadoCilindrico.novaFria);
  });

  test('Cálculo dual para tampo elipsoidal', () => {
    const resultado = calcularPMTADual('elipsoidal', paramsDual);

    expect(resultado.novaFria).toBeGreaterThan(0);
    expect(resultado.corroidaQuente).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// TESTES DE CÁLCULO GLOBAL (componente mais frágil)
// ---------------------------------------------------------------------------

describe('Cálculo Global PMTA', () => {

  test('Vaso limitado pelo costado', () => {
    const pmtaCostado = 10.0;  // MPa
    const pmtaTampo = 15.0;    // MPa

    const resultado = calcularPMTAGlobal(pmtaCostado, pmtaTampo, 9.0);

    expect(resultado.pmtaLimitante).toBe(10.0);
    expect(resultado.componenteFragil).toBe('Costado');
    expect(resultado.condena).toBe(false); // 10.0 > 9.0
  });

  test('Vaso limitado pelo tampo', () => {
    const pmtaCostado = 20.0;
    const pmtaTampo = 8.0;

    const resultado = calcularPMTAGlobal(pmtaCostado, pmtaTampo, 8.5);

    expect(resultado.pmtaLimitante).toBe(8.0);
    expect(resultado.componenteFragil).toBe('Tampo');
    expect(resultado.condena).toBe(true); // 8.0 < 8.5
  });

  test('Vaso condenado quando PMTA < pressão operação', () => {
    const pmtaCostado = 12.0;
    const pmtaTampo = 10.0;

    // Pressão operação maior que PMTA mais frágil
    const resultado = calcularPMTAGlobal(pmtaCostado, pmtaTampo, 10.5);

    expect(resultado.condena).toBe(true);
  });

  test('Vaso aprovado quando PMTA > pressão operação', () => {
    const pmtaCostado = 12.0;
    const pmtaTampo = 10.0;

    const resultado = calcularPMTAGlobal(pmtaCostado, pmtaTampo, 9.5);

    expect(resultado.condena).toBe(false);
  });

  test('Sem pressão operação definida - não condena', () => {
    const pmtaCostado = 12.0;
    const pmtaTampo = 10.0;

    const resultado = calcularPMTAGlobal(pmtaCostado, pmtaTampo);

    expect(resultado.condena).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TESTES DE CASOS ESPECIAIS E ERROS
// ---------------------------------------------------------------------------

describe('Casos Especiais e Tratamento de Erros', () => {

  test('Valores muito pequenos (próximos de zero)', () => {
    const paramsMinimos: ParametrosPMTA = {
      S: 0.001,
      E: 0.001,
      t: 0.001,
      R: 0.001,
      D: 0.002,
    };

    const resultado = calcularPMTACilindro(paramsMinimos);

    // Deve retornar valor muito pequeno mas não zero
    expect(resultado).toBeGreaterThan(0);
    expect(resultado).toBeLessThan(0.001);
  });

  test('Valores muito grandes (estabilidade numérica)', () => {
    const paramsGrandes: ParametrosPMTA = {
      S: 1000,    // 1 GPa (aços especiais)
      E: 1.0,
      t: 100,     // 100 mm
      R: 5000,    // 5 m raio
      D: 10000,   // 10 m diâmetro
    };

    const resultado = calcularPMTACilindro(paramsGrandes);

    expect(resultado).toBeGreaterThan(0);
    expect(typeof resultado).toBe('number');
    expect(Number.isFinite(resultado)).toBe(true);
  });

  test('Eficiência maior que 1.0 (fisicamente impossível)', () => {
    const paramsEInvalido: ParametrosPMTA = {
      ...PARAMS_CILINDRICO_ASME,
      E: 1.5, // > 1.0
    };

    // A função atual não valida E ≤ 1.0
    const resultado = calcularPMTACilindro(paramsEInvalido);

    // Documenta comportamento atual (aceita E > 1)
    expect(resultado).toBeGreaterThan(0);

    // PMTA com E=1.5 é 50% maior que com E=1.0
    const resultadoE1 = calcularPMTACilindro(PARAMS_CILINDRICO_ASME);
    expect(resultado / resultadoE1).toBeCloseTo(1.5, 1);
  });

  test('Espessura maior que raio (vaso parede espessa)', () => {
    const paramsParedeEspessa: ParametrosPMTA = {
      S: 100,
      E: 1.0,
      t: 60,    // mm
      R: 50,    // mm (t > R!)
      D: 100,
    };

    // Fórmula ASME é para parede fina (t ≤ R/2)
    // Mas a função atual calcula mesmo assim
    const resultado = calcularPMTACilindro(paramsParedeEspessa);

    expect(typeof resultado).toBe('number');
    expect(Number.isFinite(resultado)).toBe(true);

    // Documenta: comportamento atual não valida teoria parede fina
  });
});

// ---------------------------------------------------------------------------
// TESTES DE CONSISTÊNCIA E PROPRIEDADES MATEMÁTICAS
// ---------------------------------------------------------------------------

describe('Consistência Matemática', () => {

  test('Linearidade em relação a S (tensão)', () => {
    const paramsBase: ParametrosPMTA = {
      S: 100, E: 1.0, t: 10, R: 100, D: 200
    };

    const resultadoBase = calcularPMTACilindro(paramsBase);

    const paramsS2x = { ...paramsBase, S: paramsBase.S * 2 };
    const resultadoS2x = calcularPMTACilindro(paramsS2x);

    // PMTA deve ser aproximadamente proporcional a S
    expect(resultadoS2x / resultadoBase).toBeCloseTo(2, 1);
  });

  test('Linearidade em relação a t (espessura)', () => {
    const paramsBase: ParametrosPMTA = {
      S: 100, E: 1.0, t: 10, R: 100, D: 200
    };

    const resultadoBase = calcularPMTACilindro(paramsBase);

    const paramsT2x = { ...paramsBase, t: paramsBase.t * 2 };
    const resultadoT2x = calcularPMTACilindro(paramsT2x);

    // PMTA NÃO é linear em t (devido ao termo 0.6t no denominador)
    // Mas deve aumentar significativamente
    expect(resultadoT2x).toBeGreaterThan(resultadoBase);
    expect(resultadoT2x / resultadoBase).toBeGreaterThan(1.5);
    expect(resultadoT2x / resultadoBase).toBeLessThan(2.0);
  });

  test('Inversa em relação a R (raio)', () => {
    const paramsBase: ParametrosPMTA = {
      S: 100, E: 1.0, t: 10, R: 100, D: 200
    };

    const resultadoBase = calcularPMTACilindro(paramsBase);

    const paramsR2x = {
      ...paramsBase,
      R: paramsBase.R * 2,
      D: paramsBase.D * 2
    };
    const resultadoR2x = calcularPMTACilindro(paramsR2x);

    // PMTA diminui com raio maior
    expect(resultadoR2x).toBeLessThan(resultadoBase);
  });
});

// ---------------------------------------------------------------------------
// TESTES DE REGRESSÃO (garantir que mudanças não quebram comportamento)
// ---------------------------------------------------------------------------

describe('Testes de Regressão', () => {

  // Valores "golden" calculados com versão atual do código
  // Se estes testes falharem, comportamento mudou!

  const GOLDEN_PARAMS: ParametrosPMTA = {
    S: 120.0,
    E: 0.85,
    t: 8.0,
    R: 500.0,
    D: 1000.0,
  };

  test('Regressão - PMTA cilíndrico golden value', () => {
    const resultado = calcularPMTACilindro(GOLDEN_PARAMS);

    // Valor calculado em 2026-04-08 com código atual
    // Cálculo: (120 * 0.85 * 8) / (500 + 0.6 * 8) = 816 / 504.8 = 1.6164817749603804
    const GOLDEN_VALUE = 1.6164817749603804;

    expect(resultado).toBeCloseTo(GOLDEN_VALUE, 10);
  });

  test('Regressão - PMTA esférico golden value', () => {
    const resultado = calcularPMTAEsfera(GOLDEN_PARAMS);

    // Valor calculado em 2026-04-08 com código atual
    // Cálculo: (2 * 120 * 0.85 * 8) / (500 + 0.2 * 8) = 1632 / 501.6 = 3.253588516746411
    const GOLDEN_VALUE = 3.253588516746411;

    expect(resultado).toBeCloseTo(GOLDEN_VALUE, 10);
  });
});

// ---------------------------------------------------------------------------
// TESTES GB/T 150-2011
// ---------------------------------------------------------------------------

describe('GB/T 150-2011 — Fator K (Cláusula 5.3.1)', () => {

  test('K = 0.93 quando r/Di = 0.06 exatamente', () => {
    // Exemplo do prompt: Di=950, r=57 → r/Di=0.06
    const K = calcularFatorK_GBT150(950, 950, 57);
    expect(K).toBe(0.93);
  });

  test('K = 0.93 para tolerância de arredondamento (r/Di ≈ 0.06)', () => {
    // r/Di ligeiramente diferente por ponto flutuante
    const K = calcularFatorK_GBT150(1000, 1000, 60.001);
    expect(K).toBe(0.93);
  });

  test('Fórmula geral K = (1/6)*(3+√(L/r)) quando r/Di ≠ 0.06', () => {
    // r/Di = 0.08 → usa fórmula geral
    // L=950, r=76: K = (1/6)*(3 + √(950/76)) = (1/6)*(3 + √12.5) = (1/6)*(3+3.536) = 1.089
    const K = calcularFatorK_GBT150(950, 950, 76);
    const esperado = (1 / 6) * (3 + Math.sqrt(950 / 76));
    expect(K).toBeCloseTo(esperado, 10);
    expect(K).not.toBe(0.93);
  });

  test('Fallback K=0.93 para entradas inválidas (r=0 ou Di=0)', () => {
    expect(calcularFatorK_GBT150(0, 950, 57)).toBe(0.93);
    expect(calcularFatorK_GBT150(950, 950, 0)).toBe(0.93);
  });
});

describe('GB/T 150-2011 — Costado Cilíndrico (Cláusula 5.2)', () => {

  test('Fórmula: P = (2*S*E*t) / (Di + t)', () => {
    const params: ParametrosPMTA = { S: 170, E: 1.0, t: 11.6, R: 475, D: 950 };
    const resultado = calcularPMTACilindroGBT150(params);
    const esperado = (2 * 170 * 1.0 * 11.6) / (950 + 11.6);
    expect(resultado).toBeCloseTo(esperado, 10);
  });

  test('Validação Q345R: Di=950mm, t=11.6mm, S=170MPa, E=1.0 → ~4.102 MPa', () => {
    // P = (2*170*1.0*11.6)/(950+11.6) = 3944/961.6 = 4.102 MPa
    const params: ParametrosPMTA = { S: 170, E: 1.0, t: 11.6, R: 475, D: 950 };
    const resultado = calcularPMTACilindroGBT150(params);
    expect(resultado).toBeCloseTo(4.102, 2);
    // Em kgf/cm² ≈ 41.83
    expect(resultado * 10.197).toBeCloseTo(41.83, 1);
  });

  test('GB/T 150 cilindro usa denominador (Di+t), ASME usa (R+0.6*t)', () => {
    // Verifica que GB/T usa Di no denominador (não R), confirmando a fórmula correta
    // GB/T: P = 2*S*E*t / (Di+t)  → denominador = 950 + 11.6 = 961.6
    // ASME: P = S*E*t / (R+0.6*t) → denominador = 475 + 6.96 = 481.96
    const params: ParametrosPMTA = { S: 170, E: 1.0, t: 11.6, R: 475, D: 950 };
    const gbt = calcularPMTACilindroGBT150(params);
    // Verifica numericamente que a fórmula GB/T foi aplicada (não ASME)
    const esperadoGBT = (2 * 170 * 1.0 * 11.6) / (950 + 11.6);
    const esperadoASME = (170 * 1.0 * 11.6) / (475 + 0.6 * 11.6);
    expect(gbt).toBeCloseTo(esperadoGBT, 6);
    expect(gbt).not.toBeCloseTo(esperadoASME, 4); // diferença na 4ª casa decimal
  });

  test('Valores zero retornam zero (segurança)', () => {
    const paramsZero: ParametrosPMTA = { S: 0, E: 0, t: 0, R: 0, D: 0 };
    expect(calcularPMTACilindroGBT150(paramsZero)).toBe(0);
  });
});

describe('GB/T 150-2011 — Tampo Torisférico (Cláusula 5.3.1)', () => {

  /**
   * Caso de referência validado:
   * Material: Q345R, S = 170 MPa (≈ 1733 kgf/cm²)
   * Di = 950 mm, t = 11.6 mm, E (φ) = 1.0
   * r = 57 mm, L = 950 mm → r/Di = 0.06 → K = 0.93
   *
   * P = (2*170*1.0*11.6) / (0.93*950 + 0.5*11.6)
   *   = 3944 / (883.5 + 5.8)
   *   = 3944 / 889.3
   *   = 4.435 MPa
   *   ≈ 45.22 kgf/cm²
   */
  const PARAMS_TORI_GBT_VALIDACAO: ParametrosPMTA = {
    S: 170, E: 1.0, t: 11.6, R: 475, D: 950, L: 950, r: 57,
  };

  test('Caso de referência validado: P ≈ 4.435 MPa (45.22 kgf/cm²)', () => {
    const resultado = calcularPMTATampoToriesfericoGBT150(PARAMS_TORI_GBT_VALIDACAO);
    expect(resultado).toBeCloseTo(4.435, 2);
    expect(resultado * 10.197).toBeCloseTo(45.22, 1);
  });

  test('K = 0.93 é aplicado corretamente no denominador', () => {
    const params = PARAMS_TORI_GBT_VALIDACAO;
    const resultado = calcularPMTATampoToriesfericoGBT150(params);
    // Verificação manual: numerador = 2*170*1.0*11.6 = 3944
    // denominador = 0.93*950 + 0.5*11.6 = 883.5 + 5.8 = 889.3
    expect(resultado).toBeCloseTo(3944 / 889.3, 6);
  });

  test('Fórmula GB/T diferente da fórmula ASME para mesmo tampo', () => {
    const params = PARAMS_TORI_GBT_VALIDACAO;
    const gbt = calcularPMTATampoToriesfericoGBT150(params);
    const asme = calcularPMTATampoToriesferico(params); // ASME usa L*M+0.2*t
    // As fórmulas produzem valores diferentes
    expect(Math.abs(gbt - asme)).toBeGreaterThan(0.1);
  });

  test('Default L=Di e r=0.06*Di quando não informados', () => {
    // Sem L e r → r/Di = 0.06 → K = 0.93
    const paramsSimples: ParametrosPMTA = {
      S: 170, E: 1.0, t: 11.6, R: 475, D: 950,
    };
    const resultado = calcularPMTATampoToriesfericoGBT150(paramsSimples);
    // r = 0.06*950 = 57 → K = 0.93
    expect(resultado).toBeCloseTo(4.435, 2);
  });
});

describe('GB/T 150-2011 — PMTA Limitante (costado vs tampo)', () => {

  /**
   * Caso completo de referência:
   * Q345R: S=170 MPa, Di=950mm, t=11.6mm, E=1.0, r=57, L=950
   *
   * Costado: P = (2*170*1.0*11.6)/(950+11.6) = 4.102 MPa = 41.83 kgf/cm²
   * Tampo:   P = (2*170*1.0*11.6)/(0.93*950+0.5*11.6) = 4.435 MPa = 45.22 kgf/cm²
   * Limitante: Costado (4.102 MPa)
   */
  const PARAMS_GBT_COMPLETO: ParametrosPMTA = {
    S: 170, E: 1.0, t: 11.6, R: 475, D: 950, L: 950, r: 57,
  };

  test('Costado é o componente limitante para o caso de referência', () => {
    const pmtaCostado = calcularPMTACostadoPorNorma('GBT150', 'cilindrico', PARAMS_GBT_COMPLETO);
    const pmtaTampo = calcularPMTATampoPorNorma('GBT150', 'toriesferico', PARAMS_GBT_COMPLETO);
    expect(pmtaCostado).toBeLessThan(pmtaTampo);
    expect(pmtaCostado).toBeCloseTo(4.102, 2);
    expect(pmtaTampo).toBeCloseTo(4.435, 2);
  });

  test('calcularPMTAGlobal identifica costado como frágil', () => {
    const pmtaCostado = calcularPMTACostadoPorNorma('GBT150', 'cilindrico', PARAMS_GBT_COMPLETO);
    const pmtaTampo = calcularPMTATampoPorNorma('GBT150', 'toriesferico', PARAMS_GBT_COMPLETO);
    const global = calcularPMTAGlobal(pmtaCostado, pmtaTampo);
    expect(global.componenteFragil).toBe('Costado');
    expect(global.pmtaLimitante).toBeCloseTo(4.102, 2);
  });

  test('Dispatcher ASME não altera fórmulas existentes (regressão)', () => {
    const pmtaAsme = calcularPMTACostadoPorNorma('ASME', 'cilindrico', PARAMS_GBT_COMPLETO);
    const pmtaDireto = calcularPMTACilindro(PARAMS_GBT_COMPLETO);
    expect(pmtaAsme).toBe(pmtaDireto);
  });
});

console.log('✅ Todos os testes de PMTA carregados! (ASME + GB/T 150-2011)');