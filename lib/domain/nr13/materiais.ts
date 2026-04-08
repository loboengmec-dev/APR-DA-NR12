/**
 * Catálogo centralizado de materiais para cálculo PMTA.
 *
 * Suporta dois sistemas normativos:
 *  - ASME Sec. VIII Div. 1 (materiais SA/A)
 *  - GB/T 150-2011 (materiais Q e S — aços chineses)
 *
 * Convenção de unidades:
 *  - tensaoKgfCm2: valor exibido na UI e armazenado no banco (kgf/cm²)
 *  - tensaoMPa: valor utilizado internamente pelo motor de cálculo
 *
 * Fator de conversão: 1 MPa = 10.1972 kgf/cm²
 */

export type NormaCalculo = 'ASME' | 'GBT150';

export interface MaterialPMTA {
  nome: string;
  tensaoKgfCm2: number;
  tensaoMPa: number;
  norma: NormaCalculo;
}

/** Materiais ASME Sec. VIII Div. 1 */
export const MATERIAIS_ASME: MaterialPMTA[] = [
  { nome: 'SA-285 Gr. C',  tensaoKgfCm2: 1406.1, tensaoMPa: 137.9, norma: 'ASME' },
  { nome: 'SA-36',         tensaoKgfCm2: 1167.4, tensaoMPa: 114.5, norma: 'ASME' },
  { nome: 'SA-516 Gr. 70', tensaoKgfCm2: 1406.1, tensaoMPa: 137.9, norma: 'ASME' },
  { nome: 'AISI 304',      tensaoKgfCm2: 1172.5, tensaoMPa: 115.0, norma: 'ASME' },
];

/**
 * Materiais GB/T 150-2011 (tensões admissíveis a temperatura ambiente, ~20°C).
 *
 * Fontes: GB/T 150.2-2011 Tabela 5-1
 *  - Q235B : [σ] = 113 MPa  → 1152 kgf/cm²
 *  - Q245R : [σ] = 148 MPa  → 1509 kgf/cm²  (placa de caldeira)
 *  - Q345R : [σ] = 170 MPa  → 1733 kgf/cm²  (placa de vaso de pressão)
 *  - S30408: [σ] = 137 MPa  → 1397 kgf/cm²  (inox austenítico)
 */
export const MATERIAIS_GBT150: MaterialPMTA[] = [
  { nome: 'Q235B',   tensaoKgfCm2: 1152.0, tensaoMPa: 113.0,  norma: 'GBT150' },
  { nome: 'Q245R',   tensaoKgfCm2: 1509.0, tensaoMPa: 148.0,  norma: 'GBT150' },
  { nome: 'Q345R',   tensaoKgfCm2: 1733.0, tensaoMPa: 170.0,  norma: 'GBT150' },
  { nome: 'S30408',  tensaoKgfCm2: 1397.0, tensaoMPa: 137.0,  norma: 'GBT150' },
];

/** Retorna a lista de materiais para a norma informada */
export function getMateriaisPorNorma(norma: NormaCalculo): MaterialPMTA[] {
  return norma === 'GBT150' ? MATERIAIS_GBT150 : MATERIAIS_ASME;
}

/** Busca um material pelo valor de tensão em kgf/cm² e norma */
export function getMaterialPorTensao(
  tensaoKgfCm2: number,
  norma: NormaCalculo
): MaterialPMTA | undefined {
  return getMateriaisPorNorma(norma).find(m => m.tensaoKgfCm2 === tensaoKgfCm2);
}

/** Busca um material pelo nome e norma */
export function getMaterialPorNome(
  nome: string,
  norma: NormaCalculo
): MaterialPMTA | undefined {
  return getMateriaisPorNorma(norma).find(m => m.nome === nome);
}

/** Label para exibição da norma no PDF e na UI */
export const LABEL_NORMA: Record<NormaCalculo, string> = {
  ASME:   'ASME Sec. VIII Div. 1',
  GBT150: 'GB/T 150-2011',
};
