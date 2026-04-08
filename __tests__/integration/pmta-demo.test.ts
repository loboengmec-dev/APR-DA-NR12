/**
 * Teste de Integração - Demo PMTA
 *
 * Testa o fluxo completo do arquivo demo_pmta.ts
 * Garante que o exemplo de uso real funciona corretamente
 */

import { calcularPMTACilindro, calcularPMTATampoToriesferico, calcularPMTAGlobal } from '../../lib/domain/nr13/pmta';

describe('Integração - Demo PMTA (exemplo real)', () => {

  test('Demo PMTA - cálculo completo conforme demo_pmta.ts', () => {
    // Parâmetros do demo (vaso SA-285 Gr. C)
    const parametros = {
      S: 137.9,  // MPa - Aço SA-285 Gr. C
      E: 0.85,   // Eficiência de junta
      t: 5.5,    // mm - Espessura medida
      D: 1000,   // mm - Diâmetro
      R: 500,    // mm - Raio (D/2)
    };

    // 1. Cálculo do costado cilíndrico
    const pmtaCostado = calcularPMTACilindro(parametros);

    // Verificação do cálculo
    expect(pmtaCostado).toBeGreaterThan(0);
    expect(typeof pmtaCostado).toBe('number');

    // Cálculo manual para verificação:
    // (S * E * t) / (R + 0.6 * t)
    // = (137.9 * 0.85 * 5.5) / (500 + 0.6 * 5.5)
    // = (644.3825) / (500 + 3.3)
    // = 644.3825 / 503.3
    // = 1.2805 MPa
    expect(pmtaCostado).toBeCloseTo(1.2805, 3);

    // 2. Cálculo do tampo torisférico
    const pmtaTampo = calcularPMTATampoToriesferico(parametros);

    expect(pmtaTampo).toBeGreaterThan(0);
    expect(pmtaTampo).toBeLessThan(pmtaCostado); // Tampo geralmente mais frágil

    // 3. Cálculo global
    const pressaoOperacao = 0.8; // MPa (8 kgf/cm²)
    const resultadoGlobal = calcularPMTAGlobal(pmtaCostado, pmtaTampo, pressaoOperacao);

    // Verifica estrutura do resultado
    expect(resultadoGlobal).toHaveProperty('pmtaLimitante');
    expect(resultadoGlobal).toHaveProperty('componenteFragil');
    expect(resultadoGlobal).toHaveProperty('condena');

    // PMTA limitante deve ser o menor valor
    expect(resultadoGlobal.pmtaLimitante).toBe(Math.min(pmtaCostado, pmtaTampo));

    // Componente frágil deve ser o com menor PMTA
    if (pmtaCostado <= pmtaTampo) {
      expect(resultadoGlobal.componenteFragil).toBe('Costado');
    } else {
      expect(resultadoGlobal.componenteFragil).toBe('Tampo');
    }

    // Verifica condenação
    // PMTA limitante deve ser > pressão operação para não condenar
    const esperaCondena = resultadoGlobal.pmtaLimitante < pressaoOperacao;
    expect(resultadoGlobal.condena).toBe(esperaCondena);
  });

  test('Conversão de unidades (MPa ↔ kgf/cm²)', () => {
    // Fator de conversão: 1 MPa = 10.197 kgf/cm²
    const fatorConversao = 10.197;

    const pmtaMPa = 1.2805; // MPa
    const pmtaKgfCm2 = pmtaMPa * fatorConversao;

    // Verifica conversão
    expect(pmtaKgfCm2).toBeCloseTo(13.057, 2);

    // Teste inverso
    const kgfCm2 = 8.0;
    const mpa = kgfCm2 / fatorConversao;
    expect(mpa).toBeCloseTo(0.7845, 3);
  });

  test('Cenário real: vaso reprovado (PMTA < pressão operação)', () => {
    const parametros = {
      S: 137.9,
      E: 0.85,
      t: 3.0,  // Espessura muito fina!
      D: 1000,
      R: 500,
    };

    const pmtaCostado = calcularPMTACilindro(parametros);
    const pmtaTampo = calcularPMTATampoToriesferico(parametros);
    const pressaoOperacao = 0.8; // MPa

    const resultado = calcularPMTAGlobal(pmtaCostado, pmtaTampo, pressaoOperacao);

    // Com t=3mm, PMTA deve ser muito baixa
    expect(pmtaCostado).toBeLessThan(0.71); // Valor real: ~0.700767
    expect(resultado.condena).toBe(true); // Deve condenar
  });

  test('Cenário real: vaso aprovado (PMTA > pressão operação)', () => {
    const parametros = {
      S: 137.9,
      E: 1.0,   // Junta radiografada
      t: 12.0,  // Espessura generosa
      D: 1000,
      R: 500,
    };

    const pmtaCostado = calcularPMTACilindro(parametros);
    const pmtaTampo = calcularPMTATampoToriesferico(parametros);
    const pressaoOperacao = 1.0; // MPa

    const resultado = calcularPMTAGlobal(pmtaCostado, pmtaTampo, pressaoOperacao);

    // Com t=12mm e E=1.0, PMTA deve ser alta
    expect(pmtaCostado).toBeGreaterThan(2.0);
    expect(resultado.condena).toBe(false); // Não deve condenar
  });

  test('Execução do demo_pmta.ts (simulação)', () => {
    // Este teste simula a execução do arquivo demo_pmta.ts
    // Garante que o exemplo do repositório funciona

    const parametros = {
      S: 137.9,
      E: 0.85,
      t: 5.5,
      D: 1000,
      R: 500,
    };

    const pmtaCostado = calcularPMTACilindro(parametros);
    const pmtaTampo = calcularPMTATampoToriesferico(parametros);
    const pressaoOperacao = 0.8;

    const resultado = calcularPMTAGlobal(pmtaCostado, pmtaTampo, pressaoOperacao);

    // Valores esperados do demo
    expect(pmtaCostado).toBeCloseTo(1.2805, 3);

    // Cálculo real do tampo torisférico com parâmetros padrão:
    // Fator M padrão = 1.77 (para L=D, r=0.06D)
    // PMTA = (2*S*E*t) / (D*M + 0.2*t)
    // = (2*137.9*0.85*5.5) / (1000*1.77 + 0.2*5.5)
    // = (1288.765) / (1770 + 1.1) = 1288.765 / 1771.1 ≈ 0.7277 MPa
    expect(pmtaTampo).toBeCloseTo(0.7277, 2); // Valor calculado corretamente

    // No demo, com pressão 0.8 MPa:
    // PMTA costado ≈ 1.28 MPa > 0.8 MPa ✓
    // PMTA tampo ≈ 0.7277 MPa < 0.8 MPa ✗ → CONDENA (tampo é componente frágil)
    expect(resultado.condena).toBe(true);
    expect(resultado.componenteFragil).toBe('Tampo');
  });
});

describe('Integração - Fluxo completo NR-13', () => {

  test('Fluxo: medição → cálculo → decisão', () => {
    // Simula fluxo completo de uma inspeção NR-13

    // 1. Dados da inspeção (medidos em campo)
    const dadosInspecao = {
      materialS: 137.9,           // MPa - SA-285 Gr. C
      eficienciaE: 0.85,          // Junta não radiografada
      espessuraMedida: 5.5,       // mm - ultrassom
      diametroInterno: 1000,      // mm
      pressaoOperacao: 0.8,       // MPa
    };

    // 2. Cálculos
    const raio = dadosInspecao.diametroInterno / 2;

    const params = {
      S: dadosInspecao.materialS,
      E: dadosInspecao.eficienciaE,
      t: dadosInspecao.espessuraMedida,
      D: dadosInspecao.diametroInterno,
      R: raio,
    };

    const pmtaCostado = calcularPMTACilindro(params);
    const pmtaTampo = calcularPMTATampoToriesferico(params);
    const resultado = calcularPMTAGlobal(pmtaCostado, pmtaTampo, dadosInspecao.pressaoOperacao);

    // 3. Decisão técnica
    const decisao = {
      pmtaDeclarada: resultado.pmtaLimitante,
      componenteCritico: resultado.componenteFragil,
      status: resultado.condena ? 'REPROVADO' : 'APROVADO',
      margemSeguranca: resultado.pmtaLimitante / dadosInspecao.pressaoOperacao,
    };

    // Verificações
    expect(decisao.pmtaDeclarada).toBeGreaterThan(0);
    expect(['Costado', 'Tampo']).toContain(decisao.componenteCritico);
    expect(['REPROVADO', 'APROVADO']).toContain(decisao.status);

    // Margem de segurança deve ser razoável (>1 se aprovado)
    if (decisao.status === 'APROVADO') {
      expect(decisao.margemSeguranca).toBeGreaterThan(1.0);
    }
  });

  test('Cálculo com diferentes eficiências de junta', () => {
    // Testa impacto da eficiência E na PMTA
    const paramsBase = {
      S: 137.9,
      t: 8.0,
      D: 1000,
      R: 500,
    };

    const resultados = [];

    // E varia de 0.7 (junta simples) a 1.0 (radiografada)
    for (const E of [0.7, 0.85, 1.0]) {
      const params = { ...paramsBase, E };
      const pmta = calcularPMTACilindro(params);
      resultados.push({ E, pmta });
    }

    // PMTA deve aumentar com E maior
    expect(resultados[0].pmta).toBeLessThan(resultados[1].pmta); // 0.7 < 0.85
    expect(resultados[1].pmta).toBeLessThan(resultados[2].pmta); // 0.85 < 1.0

    // Proporcionalidade aproximada
    const razao07_10 = resultados[0].pmta / resultados[2].pmta;
    expect(razao07_10).toBeCloseTo(0.7, 1); // ≈ 0.7
  });
});

console.log('✅ Testes de integração PMTA carregados!');