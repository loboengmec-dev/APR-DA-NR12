'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult, FotoNC } from '@/types'

export async function registrarFotoNC(
  ncId: string,
  laudoId: string,
  storagePath: string,
  legenda: string,
  tamanhoBytes: number,
  ordem: number
): Promise<ActionResult<FotoNC>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('fotos_nc')
    .insert({
      nc_id: ncId,
      storage_path: storagePath,
      legenda: legenda || null,
      tamanho_bytes: tamanhoBytes,
      ordem,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/laudos/${laudoId}`)
  return { data }
}

export async function excluirFotoNC(id: string, laudoId: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Busca o storage_path antes de excluir para remover do storage
  const { data: foto } = await supabase
    .from('fotos_nc')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (foto?.storage_path) {
    await supabase.storage
      .from('fotos-nc')
      .remove([foto.storage_path])
  }

  const { error } = await supabase
    .from('fotos_nc')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/laudos/${laudoId}`)
  return {}
}

export async function atualizarLegendaFoto(
  id: string,
  legenda: string,
  laudoId: string
): Promise<ActionResult<FotoNC>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('fotos_nc')
    .update({ legenda })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/laudos/${laudoId}`)
  return { data }
}
