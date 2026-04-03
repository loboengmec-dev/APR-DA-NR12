'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult, NaoConformidade, FormNC } from '@/types'
import { calcularHRN, classificarNivel } from '@/lib/hrn'

export async function criarNC(
  equipamentoId: string,
  laudoId: string,
  form: FormNC
): Promise<ActionResult<NaoConformidade>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Calcula HRN se todos os valores forem fornecidos
  let hrn: number | null = null
  let nivel_hrn = null

  if (form.lo !== null && form.fe !== null && form.dph !== null && form.np !== null) {
    hrn = calcularHRN(form.lo, form.fe, form.dph, form.np)
    nivel_hrn = classificarNivel(hrn)
  }

  // Obtém a próxima ordem
  const { count } = await supabase
    .from('nao_conformidades')
    .select('*', { count: 'exact', head: true })
    .eq('equipamento_id', equipamentoId)

  const { data, error } = await supabase
    .from('nao_conformidades')
    .insert({
      equipamento_id: equipamentoId,
      item_nr12: form.item_nr12,
      titulo_nc: form.titulo_nc,
      descricao: form.descricao || null,
      risco: form.risco || null,
      lo: form.lo,
      fe: form.fe,
      dph: form.dph,
      np: form.np,
      hrn,
      nivel_hrn,
      texto_identificacao: form.texto_identificacao || null,
      texto_recomendacao: form.texto_recomendacao || null,
      medida_controle: form.medida_controle || null,
      ordem: count ?? 0,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/laudos/${laudoId}`)
  return { data }
}

export async function atualizarNC(
  id: string,
  laudoId: string,
  form: Partial<FormNC>
): Promise<ActionResult<NaoConformidade>> {
  const supabase = await createClient()

  const updates: Record<string, unknown> = { ...form }

  // Recalcula HRN se valores forem atualizados
  if (form.lo !== undefined && form.fe !== undefined && form.dph !== undefined && form.np !== undefined) {
    if (form.lo !== null && form.fe !== null && form.dph !== null && form.np !== null) {
      updates.hrn = calcularHRN(form.lo, form.fe, form.dph, form.np)
      updates.nivel_hrn = classificarNivel(updates.hrn as number)
    }
  }

  const { data, error } = await supabase
    .from('nao_conformidades')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/laudos/${laudoId}`)
  return { data }
}

export async function excluirNC(id: string, laudoId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('nao_conformidades')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/laudos/${laudoId}`)
  return {}
}
