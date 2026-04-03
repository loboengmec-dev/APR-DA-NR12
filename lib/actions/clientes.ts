'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult, Cliente, FormCliente } from '@/types'

export async function listarClientes(): Promise<ActionResult<Cliente[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('razao_social', { ascending: true })

  if (error) return { error: error.message }
  return { data: data ?? [] }
}

export async function criarCliente(form: FormCliente): Promise<ActionResult<Cliente>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('clientes')
    .insert({ ...form, usuario_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { data }
}

export async function atualizarCliente(id: string, form: Partial<FormCliente>): Promise<ActionResult<Cliente>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('clientes')
    .update(form)
    .eq('id', id)
    .eq('usuario_id', user.id)
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function excluirCliente(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id)
    .eq('usuario_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return {}
}
