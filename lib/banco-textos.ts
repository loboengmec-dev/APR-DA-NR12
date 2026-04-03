// Funções de busca no banco de textos padrão NR-12
import type { BancoTextoNR12 } from '@/types'
import { createClient } from '@/lib/supabase/client'

// Busca textos por item da norma
export async function buscarTextosPorItem(itemNR12: string): Promise<BancoTextoNR12[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('banco_textos_nr12')
    .select('*')
    .ilike('item_nr12', `${itemNR12}%`)
    .order('fonte', { ascending: true })
    .order('titulo_nc', { ascending: true })

  if (error) {
    console.error('Erro ao buscar textos NR-12:', error)
    return []
  }
  return data ?? []
}

// Busca textos por título (autocomplete)
export async function buscarTextosPorTitulo(busca: string): Promise<BancoTextoNR12[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('banco_textos_nr12')
    .select('*')
    .ilike('titulo_nc', `%${busca}%`)
    .limit(10)
    .order('fonte', { ascending: true })

  if (error) {
    console.error('Erro ao buscar textos NR-12:', error)
    return []
  }
  return data ?? []
}

// Busca todos os itens NR-12 distintos disponíveis no banco
export async function listarItensNR12(): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('banco_textos_nr12')
    .select('item_nr12')
    .order('item_nr12', { ascending: true })

  if (error) {
    console.error('Erro ao listar itens NR-12:', error)
    return []
  }

  const itens = [...new Set((data ?? []).map((row) => row.item_nr12))]
  return itens
}
