/**
 * Testes de VALIDAÇÃO para o módulo PMTA
 *
 * Foco: Erros, casos limite, validação de domínio
 * Objetivo: Garantir que o código lida corretamente com inputs inválidos
 */

import {
  calcularPMTACilindro,
  calcularPMTAEsfera,
  calcularPMTATampoElipsoidal,
  calcularPMTATampoToriesferico,
  calcularPMTATampoSemiesferico,
  calcularPMTAConico,
  calcularFatorM,
  calcularPMTACostado,
  calcularPMTATampo,
  calcularPMTADual,
  calcularPMTAGlobal,
  type ParametrosPMTA,
  type ParametrosDual,
} from '../../../lib/domain/nr13/pmta';

// ---------------------------------------------------------------------------
// TESTES DE VALIDAÇÃO DE INPUTS
// ---------------------------------------------------------------------------

describe('Validação de Inputs - Casos de Erro', () => {

  describe('Valores negativos ou zero', () => {
    test('Tensão (S) negativa retorna resultado negativo (comportamento atual)', () => {
      const params: ParametrosPMTA = { S: -100, E: 1.0, t: 10, R: 100, D: 200 };
      const resultado = calcularPMTACilindro(params);

      // Comportamento atual: aceita valores negativos
      expect(resultado).toBeLessThan(0);
    });

    test('Eficiência (E) negativa retorna resultado negativo (comportamento atual)', () => {
      const params: ParametrosPMTA = { S: 100, E: -0.5, t: 10, R: 100, D: 200 };
      const resultado = calcularPMTACilindro(params);

      expect(resultado).toBeLessThan(0);
    });

    test('Espessura (t) negativa retorna zero', () => {
      const params: ParametrosPMTA = { S: 100, E: 1.0, t: -5, R: 100, D: 200 };
      const resultado = calcularPMTACilindro(params);

      expect(resultado).toBe(0);
    });

    test('Raio (R) negativo retorna zero', () => {
      const params: ParametrosPMTA = { S: 100, E: 1.0, t: 10, R: -50, D: -100 };
      const resultado = calcularPMTACilindro(params);

      expect(resultado).toBe(0);
    });
  });

  describe('Valores extremamente pequenos', () => {
    test('Valores próximos de zero (evitar divisão por zero)', () => {
      const params: ParametrosPMTA = {
        S: 1e-10,  // Praticamente zero
        E: 1e-10,
        t: 1e-10,
        R: 1e-10,
        D: 2e-10,
      };

      const resultado = calcularPMTACilindro(params);

      // Deve retornar zero ou valor muito próximo
      expect(resultado).toBeGreaterThanOrEqual(0);
      expect(resultado).toBeLessThan(1e-10);
    });

    test('Espessura extremamente pequena com raio normal', () => {
      const params: ParametrosPMTA = {
        S: 100,
        E: 1.0,
        t: 0.001,  // 1 micrômetro
        R: 1000,    // 1 metro
        D: 2000,
      };

      const resultado = calcularPMTACilindro(params);

      // PMTA deve ser muito pequena mas positiva
      expect(resultado).toBeGreaterThan(0);
      expect(resultado).toBeLessThan(0.01); // < 0.01 MPa
    });
  });

  describe('Valores extremamente grandes', () => {
    test('Valores grandes (teste de estabilidade numérica)', () => {
      const params: ParametrosPMTA = {
        S: 1e6,    // 1 GPa (aço ultra resistente)
        E: 1.0,
        t: 1000,   // 1 metro de espessura
        R: 5000,   // 5 metros raio
        D: 10000,
      };

      const resultado = calcularPMTACilindro(params);

      // Deve ser um número finito
      expect(Number.isFinite(resultado)).toBe(true);
      expect(resultado).toBeGreaterThan(0);
    });

    test('Razão t/R muito grande (parede espessa)', () => {
      const params: ParametrosPMTA = {
        S: 100,
        E: 1.0,
        t: 100,    // Espessura
        R: 50,     // Raio (t > R!)
        D: 100,
      };

      const resultado = calcularPMTACilindro(params);

      // Fórmula ASME é para parede fina (t ≤ R/2)
      // Mas código atual calcula mesmo assim
      expect(Number.isFinite(resultado)).toBe(true);
      expect(resultado).toBeGreaterThan(0);
    });
  });

  describe('Valores não numéricos (TypeScript impede, mas testamos limites)', () => {
    test('Eficiência maior que 1.0 (fisicamente impossível)', () => {
      const params: ParametrosPMTA = {
        S: 100,
        E: 1.5,    // > 1.0!
        t: 10,
        R: 100,
        D: 200,
      };

      const resultado = calcularPMTACilindro(params);

      // Código atual aceita E > 1.0
      // PMTA com E=1.5 deve ser 50% maior que com E=1.0
      const paramsE1 = { ...params, E: 1.0 };
      const resultadoE1 = calcularPMTACilindro(paramsE1);

      expect(resultado / resultadoE1).toBeCloseTo(1.5, 5);
    });

    test('Eficiência zero retorna zero', () => {
      const params: ParametrosPMTA = {
        S: 100,
        E: 0,
        t: 10,
        R: 100,
        D: 200,
      };

      const resultado = calcularPMTACilindro(params);
      expect(resultado).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// TESTES DE VALIDAÇÃO DE DOMÍNIO (regras de negócio)
// ---------------------------------------------------------------------------

describe('Validação de Domínio - Regras NR-13/ASME', () => {

  describe('Limites da teoria de paredes finas', () => {
    test('Cilíndrico: t ≤ R/2 para validade da fórmula', () => {
      // Este teste documenta que a função NÃO valida este limite
      // Mas calculamos para ver o comportamento
      const paramsParedeFina: ParametrosPMTA = {
        S: 100, E: 1.0, t: 10, R: 100, D: 200  // t = R/10 (OK)
      };

      const paramsParedeEspessa: ParametrosPMTA = {
        S: 100, E: 1.0, t: 60, R: 50, D: 100  // t > R (viola teoria)
      };

      const resultadoFino = calcularPMTACilindro(paramsParedeFina);
      const resultadoEspesso = calcularPMTACilindro(paramsParedeEspessa);

      // Ambos calculam (não validam limite)
      expect(Number.isFinite(resultadoFino)).toBe(true);
      expect(Number.isFinite(resultadoEspesso)).toBe(true);
    });

    test('Esférico: t ≤ 0.356R para validade da fórmula', () => {
      const paramsDentroLimite: ParametrosPMTA = {
        S: 100, E: 1.0, t: 35, R: 100, D: 200  // t = 0.35R (OK)
      };

      const paramsForaLimite: ParametrosPMTA = {
        S: 100, E: 1.0, t: 40, R: 100, D: 200  // t = 0.4R > 0.356R
      };

      const resultadoDentro = calcularPMTAEsfera(paramsDentroLimite);
      const resultadoFora = calcularPMTAEsfera(paramsForaLimite);

      // Ambos calculam (não validam limite)
      expect(Number.isFinite(resultadoDentro)).toBe(true);
      expect(Number.isFinite(resultadoFora)).toBe(true);
    });
  });

  describe('Cônico: limite de ângulo ASME', () => {
    test('Ângulo zero graus (degenerado em cilindro)', () => {
      const params: ParametrosPMTA = {
        S: 100, E: 1.0, t: 10, R: 100, D: 200, alpha: 0
      };

      const resultado = calcularPMTAConico(params);

      // alpha=0 deve retornar 0 (atualmente)
      expect(resultado).toBe(0);
    });

    test('Ângulo 30° (limite ASME sem análise especial)', () => {
      const params: ParametrosPMTA = {
        S: 100, E: 1.0, t: 10, R: 100, D: 200, alpha: 30
      };

      const resultado = calcularPMTAConico(params);
      expect(resultado).toBeGreaterThan(0);
    });

    test('Ângulo 45° (requer análise especial - código atual calcula)', () => {
      const params: ParametrosPMTA = {
        S: 100, E: 1.0, t: 10, R: 100, D: 200, alpha: 45
      };

      const resultado = calcularPMTAConico(params);
      // Código atual calcula mesmo para ângulos > 30°
      expect(Number.isFinite(resultado)).toBe(true);
    });

    test('Ângulo 90° (degenerado - retorna zero)', () => {
      const params: ParametrosPMTA = {
        S: 100, E: 1.0, t: 10, R: 100, D: 200, alpha: 90
      };

      const resultado = calcularPMTAConico(params);
      expect(resultado).toBe(0);
    });

    test('Ângulo negativo (inválido - retorna zero)', () => {
      const params: ParametrosPMTA = {
        S: 100, E: 1.0, t: 10, R: 100, D: 200, alpha: -10
      };

      const resultado = calcularPMTAConico(params);
      expect(resultado).toBe(0);
    });
  });

  describe('Torisférico: parâmetros L e r', () => {
    test('Fator M com L e r padrão (comercial)', () => {
      const L = 1000;
      const r = 0.06 * 1000; // 60

      const M = calcularFatorM(L, r);

      // M padrão comercial ≈ 1.77
      expect(M).toBeCloseTo(1.77, 2);
    });

    test('Fator M com L/r muito grande', () => {
      const L = 1000;
      const r = 10; // L/r = 100

      const M = calcularFatorM(L, r);

      // M = (3 + sqrt(100)) / 4 = (3 + 10) / 4 = 13/4 = 3.25
      expect(M).toBeCloseTo(3.25, 2);
    });

    test('Fator M com L/r muito pequeno', () => {
      const L = 1000;
      const r = 1000; // L/r = 1

      const M = calcularFatorM(L, r);

      // M = (3 + sqrt(1)) / 4 = (3 + 1) / 4 = 4/4 = 1
      expect(M).toBeCloseTo(1.0, 2);
    });

    test('Fator M com valores zero (usa fallback)', () => {
      const M = calcularFatorM(0, 0);

      // Deve retornar fallback padrão comercial
      expect(M).toBe(1.77);
    });

    test('Fator M com r zero (divisão por zero protegida)', () => {
      const M = calcularFatorM(1000, 0);

      // Deve retornar fallback
      expect(M).toBe(1.77);
    });
  });
});

// ---------------------------------------------------------------------------
// TESTES DE CÁLCULO DUAL - CASOS ESPECIAIS
// ---------------------------------------------------------------------------

describe('Cálculo Dual - Casos Especiais', () => {

  test('Condição corroída/quente sempre menor que nova/fria', () => {
    const params: ParametrosDual = {
      S_frio: 150.0,
      S_quente: 130.0,   // S menor
      E: 1.0,
      t_nominal: 12.0,
      t_corroido: 10.5,   // t menor
      D: 300.0,
    };

    const resultado = calcularPMTADual('cilindrico', params);

    // Ambas condições devem reduzir PMTA
    expect(resultado.corroidaQuente).toBeLessThan(resultado.novaFria);
    expect(resultado.condicaoLimitante).toBe('Corroída/Quente');
  });

  test('Corroída mas com material melhor (cenário improvável)', () => {
    const params: ParametrosDual = {
      S_frio: 150.0,
      S_quente: 180.0,   // S maior na temperatura!
      E: 1.0,
      t_nominal: 12.0,
      t_corroido: 11.5,   // Pouca corrosão
      D: 300.0,
    };

    const resultado = calcularPMTADual('cilindrico', params);

    // Se S_quente > S_frio, pode compensar corrosão
    // Testa apenas que cálculo não quebra
    expect(Number.isFinite(resultado.novaFria)).toBe(true);
    expect(Number.isFinite(resultado.corroidaQuente)).toBe(true);
  });

  test('Corrosão total (t_corroido = 0)', () => {
    const params: ParametrosDual = {
      S_frio: 150.0,
      S_quente: 130.0,
      E: 1.0,
      t_nominal: 12.0,
      t_corroido: 0,      // Corrosão total!
      D: 300.0,
    };

    const resultado = calcularPMTADual('cilindrico', params);

    // PMTA corroída deve ser zero
    expect(resultado.corroidaQuente).toBe(0);
    expect(resultado.limitante).toBe(0);
    expect(resultado.condicaoLimitante).toBe('Corroída/Quente');
  });

  test('Espessura corroída maior que nominal (erro de medição?)', () => {
    const params: ParametrosDual = {
      S_frio: 150.0,
      S_quente: 130.0,
      E: 1.0,
      t_nominal: 12.0,
      t_corroido: 13.0,   // t_corroido > t_nominal!
      D: 300.0,
    };

    const resultado = calcularPMTADual('cilindrico', params);

    // Cálculo deve funcionar (t_corroido > t_nominal)
    expect(resultado.corroidaQuente).toBeGreaterThan(0);
    // Mas PMTA corroída pode ser maior que nova se S_quente não for muito menor
  });
});

// ---------------------------------------------------------------------------
// TESTES DE CÁLCULO GLOBAL - CASOS LIMITE
// ---------------------------------------------------------------------------

describe('Cálculo Global - Casos Limite', () => {

  test('PMTA zero em um componente', () => {
    const pmtaCostado = 0;      // Componente com PMTA zero
    const pmtaTampo = 15.0;
    const pressaoOperacao = 10.0;

    const resultado = calcularPMTAGlobal(pmtaCostado, pmtaTampo, pressaoOperacao);

    expect(resultado.pmtaLimitante).toBe(0);
    expect(resultado.componenteFragil).toBe('Costado');
    expect(resultado.condena).toBe(true); // 0 < 10.0
  });

  test('Ambos componentes com PMTA zero', () => {
    const pmtaCostado = 0;
    const pmtaTampo = 0;
    const pressaoOperacao = 0;

    const resultado = calcularPMTAGlobal(pmtaCostado, pmtaTampo, pressaoOperacao);

    expect(resultado.pmtaLimitante).toBe(0);
    expect(resultado.condena).toBe(false); // 0 < 0 é falso
  });

  test('Pressão operação zero', () => {
    const pmtaCostado = 10.0;
    const pmtaTampo = 15.0;
    const pressaoOperacao = 0;

    const resultado = calcularPMTAGlobal(pmtaCostado, pmtaTampo, pressaoOperacao);

    expect(resultado.condena).toBe(false); // PMTA > 0
  });

  test('Pressão operação negativa (erro de input)', () => {
    const pmtaCostado = 10.0;
    const pmtaTampo = 15.0;
    const pressaoOperacao = -5.0;

    const resultado = calcularPMTAGlobal(pmtaCostado, pmtaTampo, pressaoOperacao);

    // Código atual: condena = pressaoOperacao ? pmtaLimitante < pressaoOperacao : false
    // Com pressaoOperacao = -5.0: 10.0 < -5.0? false
    expect(resultado.condena).toBe(false);
  });

  test('PMTA negativa (erro de cálculo)', () => {
    const pmtaCostado = -5.0;   // Erro!
    const pmtaTampo = 15.0;
    const pressaoOperacao = 10.0;

    const resultado = calcularPMTAGlobal(pmtaCostado, pmtaTampo, pressaoOperacao);

    expect(resultado.pmtaLimitante).toBe(-5.0);
    expect(resultado.componenteFragil).toBe('Costado');
    expect(resultado.condena).toBe(true); // -5.0 < 10.0
  });
});

// ---------------------------------------------------------------------------
// TESTES DE CONSISTÊNCIA ENTRE FUNÇÕES
// ---------------------------------------------------------------------------

describe('Consistência entre Funções', () => {

  test('Tampo semiesférico = casco esférico (mesma fórmula)', () => {
    const params: ParametrosPMTA = {
      S: 100, E: 1.0, t: 10, R: 100, D: 200
    };

    const resultadoEsfera = calcularPMTAEsfera(params);
    const resultadoSemiesferico = calcularPMTATampoSemiesferico(params);

    // Devem ser idênticos
    expect(resultadoSemiesferico).toBe(resultadoEsfera);
  });

  test('Despacho funciona igual chamada direta', () => {
    const params: ParametrosPMTA = {
      S: 100, E: 1.0, t: 10, R: 100, D: 200
    };

    const diretoCilindrico = calcularPMTACilindro(params);
    const despachoCilindrico = calcularPMTACostado('cilindrico', params);

    expect(despachoCilindrico).toBe(diretoCilindrico);

    const diretoElipsoidal = calcularPMTATampoElipsoidal(params);
    const despachoElipsoidal = calcularPMTATampo('elipsoidal', params);

    expect(despachoElipsoidal).toBe(diretoElipsoidal);
  });

  test('Geometria inválida retorna zero', () => {
    const params: ParametrosPMTA = {
      S: 100, E: 1.0, t: 10, R: 100, D: 200
    };

    // @ts-expect-error - Testando comportamento com geometria inválida
    const resultadoCostado = calcularPMTACostado('invalido' as any, params);
    // @ts-expect-error - Testando comportamento com geometria inválida
    const resultadoTampo = calcularPMTATampo('invalido' as any, params);

    expect(resultadoCostado).toBe(0);
    expect(resultadoTampo).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// TESTES DE PERFORMANCE (não devem ser lentos)
// ---------------------------------------------------------------------------

describe('Performance', () => {
  test('Cálculo rápido para 1000 iterações', () => {
    const params: ParametrosPMTA = {
      S: 100, E: 1.0, t: 10, R: 100, D: 200
    };

    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      calcularPMTACilindro(params);
      calcularPMTAEsfera(params);
      calcularPMTATampoElipsoidal(params);
    }

    const end = performance.now();
    const duration = end - start;

    // 1000 cálculos devem levar menos de 100ms
    expect(duration).toBeLessThan(100);
  });

  test('Cálculo dual rápido', () => {
    const params: ParametrosDual = {
      S_frio: 150.0,
      S_quente: 130.0,
      E: 1.0,
      t_nominal: 12.0,
      t_corroido: 10.5,
      D: 300.0,
    };

    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      calcularPMTADual('cilindrico', params);
      calcularPMTADual('esferico', params);
      calcularPMTADual('elipsoidal', params);
    }

    const end = performance.now();
    const duration = end - start;

    // 300 cálculos devem levar menos de 50ms
    expect(duration).toBeLessThan(50);
  });
});

console.log('✅ Todos os testes de validação PMTA carregados!');