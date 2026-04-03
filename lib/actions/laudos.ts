'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult, Laudo, FormLaudo } from '@/types'

export async function listarLaudos(): Promise<ActionResult<Laudo[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('laudos')
    .select('*, clientes(id, razao_social, cnpj, endereco, cidade, estado)')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data: data ?? [] }
}

export async function buscarLaudo(id: string): Promise<ActionResult<Laudo>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('laudos')
    .select(`
      *,
      clientes(*),
      equipamentos(
        *,
        nao_conformidades(
          *,
          fotos_nc(*)
        )
      )
    `)
    .eq('id', id)
    .eq('usuario_id', user.id)
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function criarLaudo(form: FormLaudo): Promise<ActionResult<Laudo>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('laudos')
    .insert({ ...form, usuario_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { data }
}

export async function atualizarLaudo(id: string, form: Partial<FormLaudo>): Promise<ActionResult<Laudo>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('laudos')
    .update({ ...form, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('usuario_id', user.id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/laudos/${id}`)
  return { data }
}

export async function excluirLaudo(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('laudos')
    .delete()
    .eq('id', id)
    .eq('usuario_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return {}
}

export async function atualizarStatusLaudo(
  id: string,
  status: 'rascunho' | 'em_revisao' | 'finalizado'
): Promise<ActionResult<Laudo>> {
  return atualizarLaudo(id, { status } as Partial<FormLaudo> & { status: typeof status })
}
