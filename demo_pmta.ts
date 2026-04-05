import { calcularPMTACilindro, calcularPMTATampoToriesferico, calcularPMTAGlobal } from './lib/domain/nr13/pmta';

// Vaso de Teste Simulando a Inspeção 
// Aço SA-285 Gr. C (S = 137.9 MPa)
// D = 1000 mm -> R = 500 mm
// Espessura t medida atual (ultrassom): 5.5mm
const parametros = {
  S: 137.9, 
  E: 0.85, 
  t: 5.5,
  D: 1000,
  R: 500
};

const pmtaCostado = calcularPMTACilindro(parametros);
const pmtaTampo = calcularPMTATampoToriesferico(parametros);

console.log("\n==========================================");
console.log(" ASME SEC VIII DIV 1 - CÁLCULO DE PMTA    ");
console.log("==========================================");
console.log(`- Material: SA-285 Gr. C (Tensão: ${parametros.S} MPa)`);
console.log(`- Espessura Efetiva (t): ${parametros.t} mm`);
console.log(`- Diâmetro (D): ${parametros.D} mm`);
console.log(`- Eficiência de Junta (E): ${parametros.E}`);
console.log("------------------------------------------");
console.log(`➤ P. Máx. Costado: ${(pmtaCostado * 10.197).toFixed(2)} kgf/cm² (${pmtaCostado.toFixed(3)} MPa)`);
console.log(`➤ P. Máx. Tampo T: ${(pmtaTampo * 10.197).toFixed(2)} kgf/cm² (${pmtaTampo.toFixed(3)} MPa)`);

const pressaoOperacao = 0.8; // 8 kgf/cm2 eq. approx
const limitante = calcularPMTAGlobal(pmtaCostado, pmtaTampo, pressaoOperacao);

console.log("------------------------------------------");
console.log(`➤ STATUS OFICIAL DO VASO DE PRESSÃO`);
console.log(`- Componente Mais Frágil: ${limitante.componenteFragil}`);
console.log(`- PMTA Declarada: ${(limitante.pmtaLimitante * 10.197).toFixed(2)} kgf/cm²`);
console.log(`- Teste Operacional (0.8 MPa): ${limitante.condena ? "❌ REPROVADO - Downgrade Necessário" : "✅ CONFORME"}`);
console.log("==========================================\n");
