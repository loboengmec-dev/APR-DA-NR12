// Cálculo de HRN (Hazard Rating Number) conforme metodologia NR-12
import type { NivelHRN, TabelaHRNItem } from '@/types'

// Probabilidade de ocorrência do acidente
export const TABELA_LO: TabelaHRNItem[] = [
  { valor: 0.033, descricao: 'Praticamente impossível' },
  { valor: 1,     descricao: 'Quase impossível' },
  { valor: 1.5,   descricao: 'Muito improvável' },
  { valor: 2,     descricao: 'Improvável mas possível' },
  { valor: 5,     descricao: 'Provável' },
  { valor: 8,     descricao: 'Provável no tempo' },
  { valor: 15,    descricao: 'Certo sem medida de controle' },
]

// Frequência de exposição ao perigo
export const TABELA_FE: TabelaHRNItem[] = [
  { valor: 0.5, descricao: 'Anualmente' },
  { valor: 1,   descricao: 'Mensalmente' },
  { valor: 1.5, descricao: 'Semanalmente' },
  { valor: 2.5, descricao: 'Diariamente' },
  { valor: 4,   descricao: 'De hora em hora' },
  { valor: 5,   descricao: 'Permanentemente' },
]

// Grau de severidade do dano potencial
export const TABELA_DPH: TabelaHRNItem[] = [
  { valor: 0.1, descricao: 'Arranhão / contusão leve' },
  { valor: 0.5, descricao: 'Laceração / contusão moderada' },
  { valor: 2,   descricao: 'Laceração / fratura leve' },
  { valor: 4,   descricao: 'Fratura grave' },
  { valor: 8,   descricao: 'Perda de membro' },
  { valor: 10,  descricao: 'Lesão grave irreversível' },
  { valor: 15,  descricao: 'Fatalidade' },
  { valor: 20,  descricao: 'Múltiplas fatalidades' },
]

// Número de pessoas expostas ao perigo
export const TABELA_NP: TabelaHRNItem[] = [
  { valor: 1,  descricao: '1–2 pessoas' },
  { valor: 2,  descricao: '3–7 pessoas' },
  { valor: 4,  descricao: '8–15 pessoas' },
  { valor: 8,  descricao: '16–50 pessoas' },
  { valor: 12, descricao: 'Mais de 50 pessoas' },
]

// Classificação do nível de risco pelo HRN calculado
export function classificarNivel(hrn: number): NivelHRN {
  if (hrn < 1)    return 'aceitavel'
  if (hrn < 5)    return 'muito_baixo'
  if (hrn < 50)   return 'baixo'
  if (hrn < 100)  return 'moderado'
  if (hrn < 500)  return 'alto'
  if (hrn < 1000) return 'muito_alto'
  return 'intoleravel'
}

// Calcula o HRN: LO × FE × DPH × NP
export function calcularHRN(lo: number, fe: number, dph: number, np: number): number {
  return Number((lo * fe * dph * np).toFixed(2))
}

// Retorna a cor CSS para exibição do nível HRN
export function corNivelHRN(nivel: NivelHRN): string {
  const cores: Record<NivelHRN, string> = {
    aceitavel:   'bg-green-100 text-green-800',
    muito_baixo: 'bg-green-200 text-green-900',
    baixo:       'bg-yellow-100 text-yellow-800',
    moderado:    'bg-orange-100 text-orange-800',
    alto:        'bg-red-100 text-red-800',
    muito_alto:  'bg-red-200 text-red-900',
    intoleravel: 'bg-red-600 text-white',
  }
  return cores[nivel]
}

// Retorna o label em português para o nível HRN
export function labelNivelHRN(nivel: NivelHRN): string {
  const labels: Record<NivelHRN, string> = {
    aceitavel:   'Aceitável',
    muito_baixo: 'Muito Baixo',
    baixo:       'Baixo',
    moderado:    'Moderado',
    alto:        'Alto',
    muito_alto:  'Muito Alto',
    intoleravel: 'Intolerável',
  }
  return labels[nivel]
}

// Retorna a faixa de HRN em texto para o nível
export function faixaNivelHRN(nivel: NivelHRN): string {
  const faixas: Record<NivelHRN, string> = {
    aceitavel:   '< 1',
    muito_baixo: '1 – 4',
    baixo:       '5 – 49',
    moderado:    '50 – 99',
    alto:        '100 – 499',
    muito_alto:  '500 – 999',
    intoleravel: '≥ 1000',
  }
  return faixas[nivel]
}
