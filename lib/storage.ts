// Helper para gerenciar arquivos no Supabase Storage
import { createClient } from '@/lib/supabase/client'

const BUCKET_FOTOS = 'fotos-nc'
const BUCKET_LOGOS = 'logos-usuario'

// Faz upload de uma foto de NC e retorna o storage_path
export async function uploadFotoNC(
  file: File,
  ncId: string,
  ordem: number
): Promise<{ path: string; error: string | null }> {
  const supabase = createClient()
  const extensao = file.name.split('.').pop() ?? 'jpg'
  const path = `${ncId}/${ordem}_${Date.now()}.${extensao}`

  const { data, error } = await supabase.storage
    .from(BUCKET_FOTOS)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    return { path: '', error: error.message }
  }

  return { path: data.path, error: null }
}

// Gera URL pública assinada para uma foto (válida por 1 hora)
export async function gerarUrlAssinada(
  storagePath: string,
  bucket: string = BUCKET_FOTOS
): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 3600)

  if (error) {
    console.error('Erro ao gerar URL assinada:', error)
    return null
  }

  return data.signedUrl
}

// Remove uma foto do storage
export async function removerFoto(
  storagePath: string,
  bucket: string = BUCKET_FOTOS
): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(bucket)
    .remove([storagePath])

  if (error) {
    console.error('Erro ao remover foto:', error)
    return false
  }

  return true
}

// Faz upload da foto geral do equipamento (vista ampla)
export async function uploadFotoEquipamento(
  file: File,
  equipamentoId: string
): Promise<{ path: string; error: string | null }> {
  const supabase = createClient()
  const extensao = file.name.split('.').pop() ?? 'jpg'
  const path = `equipamentos/${equipamentoId}/geral_${Date.now()}.${extensao}`

  const { data, error } = await supabase.storage
    .from(BUCKET_FOTOS)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    return { path: '', error: error.message }
  }

  return { path: data.path, error: null }
}

// Faz upload da logo do usuário
export async function uploadLogo(
  file: File,
  usuarioId: string
): Promise<{ path: string; error: string | null }> {
  const supabase = createClient()
  const extensao = file.name.split('.').pop() ?? 'png'
  const path = `${usuarioId}/logo.${extensao}`

  const { data, error } = await supabase.storage
    .from(BUCKET_LOGOS)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true, // Substituir logo existente
    })

  if (error) {
    return { path: '', error: error.message }
  }

  return { path: data.path, error: null }
}

// Retorna a URL pública da logo (logos são públicas)
export function urlPublicaLogo(storagePath: string, supabaseUrl: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_LOGOS}/${storagePath}`
}
