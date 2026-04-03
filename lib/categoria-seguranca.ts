// Categorização de segurança conforme NBR 14153 / ISO 13849-1
// S = Severidade do dano | F = Frequência de exposição | P = Possibilidade de evitar o dano
import type { CategoriaSeguranca } from '@/types'

export const OPCOES_S = [
  { valor: 'S1', descricao: 'S1 — Dano leve (reversível)' },
  { valor: 'S2', descricao: 'S2 — Dano grave (irreversível, incluindo morte)' },
]

export const OPCOES_F = [
  { valor: 'F1', descricao: 'F1 — Rara a menos frequente e/ou tempo de exposição curto' },
  { valor: 'F2', descricao: 'F2 — Frequente a contínua e/ou tempo de exposição longo' },
]

export const OPCOES_P = [
  { valor: 'P1', descricao: 'P1 — Possível sob certas condições' },
  { valor: 'P2', descricao: 'P2 — Quase impossível' },
]

// Matriz de categorias conforme NBR 14153 Tabela 1
// Chave: S-F-P → Categoria resultante
const MATRIZ_CATEGORIA: Record<string, CategoriaSeguranca> = {
  'S1-F1-P1': 'B',
  'S1-F1-P2': '1',
  'S1-F2-P1': '1',
  'S1-F2-P2': '2',
  'S2-F1-P1': '2',
  'S2-F1-P2': '3',
  'S2-F2-P1': '3',
  'S2-F2-P2': '4',
}

export function calcularCategoria(s: string, f: string, p: string): CategoriaSeguranca | null {
  const chave = `${s}-${f}-${p}`
  return MATRIZ_CATEGORIA[chave] ?? null
}

export function descricaoCategoria(categoria: CategoriaSeguranca): string {
  const descricoes: Record<CategoriaSeguranca, string> = {
    'B': 'Categoria B — Princípios básicos de segurança',
    '1': 'Categoria 1 — Componentes bem testados',
    '2': 'Categoria 2 — Monitoramento periódico',
    '3': 'Categoria 3 — Falha simples não causa perda da função de segurança',
    '4': 'Categoria 4 — Tolerância total a falha simples e múltipla',
  }
  return descricoes[categoria]
}
