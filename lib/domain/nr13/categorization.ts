/**
 * Domínio NR-13 — Categorização de Vasos de Pressão
 * Tabela 1 da NR-13 (Portaria MTP nº 1.846/2022)
 *
 * A categorização é DETERMINÍSTICA: Categoria = f(Classe do Fluido, Grupo P×V)
 * Nenhuma dependência de React ou UI — módulo puro e testável.
 */

export type ClasseFluido = 'A' | 'B' | 'C' | 'D';
export type GrupoPV = 1 | 2 | 3 | 4 | 5;
export type CategoriaVaso = 'I' | 'II' | 'III' | 'IV' | 'V';

/**
 * Limites do Produto P×V (MPa·m³) para cada Grupo — NR-13 Tabela 1
 */
const LIMITES_GRUPO: Record<GrupoPV, string> = {
  1: 'P×V > 100',
  2: '30 < P×V ≤ 100',
  3: '2,5 < P×V ≤ 30',
  4: '1 < P×V ≤ 2,5',
  5: 'P×V ≤ 1',
};

/**
 * Matriz de categorização NR-13 Tabela 1
 * Linha = Classe do Fluido | Coluna = Grupo (índice 0 = Grupo 1)
 */
const MATRIZ_CATEGORIA: Record<ClasseFluido, CategoriaVaso[]> = {
  A: ['I',  'I',   'II',  'III', 'III'],
  B: ['I',  'II',  'III', 'IV',  'IV' ],
  C: ['I',  'II',  'III', 'IV',  'V'  ],
  D: ['II', 'III', 'IV',  'V',   'V'  ],
};

/**
 * Calcula o Grupo de Potencial de Risco a partir do produto P×V.
 * @param pressao Pressão máxima de operação em MPa
 * @param volume  Volume interno em m³
 */
export function calcularGrupoPV(pressao: number, volume: number): GrupoPV {
  const pv = pressao * volume;
  if (pv > 100) return 1;
  if (pv > 30)  return 2;
  if (pv > 2.5) return 3;
  if (pv > 1)   return 4;
  return 5;
}

/**
 * Determina a Categoria do Vaso a partir da Classe do Fluido e do Grupo P×V.
 * @param classe Classe do fluido (A, B, C ou D)
 * @param grupo  Grupo de potencial de risco (1–5)
 */
export function calcularCategoria(classe: ClasseFluido, grupo: GrupoPV): CategoriaVaso {
  return MATRIZ_CATEGORIA[classe][grupo - 1];
}

/**
 * Extrai a letra da Classe a partir do enum completo do formulário.
 * Ex: 'A (Inflamável/Tóxico)' → 'A'
 */
export function extrairLetraClasse(fluidoClasse: string): ClasseFluido | null {
  const letra = fluidoClasse.charAt(0) as ClasseFluido;
  if (['A', 'B', 'C', 'D'].includes(letra)) return letra;
  return null;
}

export { LIMITES_GRUPO };
