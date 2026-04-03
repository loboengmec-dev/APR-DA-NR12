'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult, Equipamento, FormEquipamento } from '@/types'
import { calcularCategoria } from '@/lib/categoria-seguranca'
import type { CategoriaSeguranca } from '@/types'

export async function criarEquipamento(
  laudoId: string,
  form: FormEquipamento
): Promise<ActionResult<Equipamento>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Verifica se o laudo pertence ao usuário
  const { data: laudo } = await supabase
    .from('laudos')
    .select('id')
    .eq('id', laudoId)
    .eq('usuario_id', user.id)
    .single()

  if (!laudo) return { error: 'Laudo não encontrado' }

  const categoriaResultado = calcularCategoria(
    form.categoria_s,
    form.categoria_f,
    form.categoria_p
  )

  // Obtém a próxima ordem
  const { count } = await supabase
    .from('equipamentos')
    .select('*', { count: 'exact', head: true })
    .eq('laudo_id', laudoId)

  const { data, error } = await supabase
    .from('equipamentos')
    .insert({
      laudo_id: laudoId,
      nome: form.nome,
      modelo: form.modelo || null,
      categoria_s: form.categoria_s || null,
      categoria_f: form.categoria_f || null,
      categoria_p: form.categoria_p || null,
      categoria_resultado: categoriaResultado,
      ordem: count ?? 0,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/laudos/${laudoId}`)
  return { data }
}

export async function atualizarEquipamento(
  id: string,
  laudoId: string,
  form: Partial<FormEquipamento & { foto_geral_url: string }>
): Promise<ActionResult<Equipamento>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const updates: Record<string, unknown> = { ...form }

  // Recalcula categoria se campos S/F/P forem atualizados
  if (form.categoria_s && form.categoria_f && form.categoria_p) {
    updates.categoria_resultado = calcularCategoria(
      form.categoria_s,
      form.categoria_f,
      form.categoria_p
    )
  }

  const { data, error } = await supabase
    .from('equipamentos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/laudos/${laudoId}`)
  return { data }
}

export async function excluirEquipamento(id: string, laudoId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('equipamentos')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/laudos/${laudoId}`)
  return {}
}
