/**
 * Helpers exclusivos para fotos do módulo NR-13.
 * Usa o bucket existente 'fotos-nc' com path prefixado nr13/ — isolamento
 * por tabela RLS, não por bucket separado.
 * NÃO tocar em lib/storage.ts (NR-12) — módulos independentes.
 */
import { createClient } from '@/lib/supabase/client'

// Prefixo dentro do bucket existente — mantém tudo separado do NR-12
const NR13_PREFIX = 'nr13'

function bucketPath(subPath: string): string {
  return `${NR13_PREFIX}/${subPath}`
}

// --------------------------------------------------------------------------
// Upload de fotos — retornam apenas o path
// --------------------------------------------------------------------------

export async function uploadFotoPlaca(
  file: File,
  vasoId: string
): Promise<{ path: string; error: string | null }> {
  return uploadFile(file, bucketPath(`placa/${vasoId}/${Date.now()}`))
}

export async function uploadFotoExame(
  file: File,
  inspecaoId: string,
  tipoExame: 'externo' | 'interno',
  ordem: number
): Promise<{ path: string; error: string | null }> {
  return uploadFile(file, bucketPath(`exame/${inspecaoId}/${tipoExame}/${ordem}_${Date.now()}`))
}

export async function uploadFotoMedicao(
  file: File,
  inspecaoId: string,
  ponto: string
): Promise<{ path: string; error: string | null }> {
  return uploadFile(file, bucketPath(`medicao/${inspecaoId}/${ponto}_${Date.now()}`))
}

export async function uploadFotoNCNr13(
  file: File,
  ncId: string,
  ordem: number
): Promise<{ path: string; error: string | null }> {
  return uploadFile(file, bucketPath(`nc/${ncId}/${ordem}_${Date.now()}`))
}

export async function uploadFotoManometro(
  file: File,
  vasoId: string
): Promise<{ path: string; error: string | null }> {
  return uploadFile(file, bucketPath(`manometro/${vasoId}/${Date.now()}`))
}

// --------------------------------------------------------------------------
// Helpers internos — usa o bucket existente 'fotos-nc'
// --------------------------------------------------------------------------

const BUCKET_FOTOS = 'fotos-nc'

async function uploadFile(
  file: File,
  basePath: string
): Promise<{ path: string; error: string | null }> {
  const supabase = createClient()
  const extensao = file.name.split('.').pop() ?? 'jpg'
  const path = `${basePath}.${extensao}`

  const { data, error } = await supabase.storage
    .from(BUCKET_FOTOS)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) return { path: '', error: error.message }
  return { path: data.path, error: null }
}

// Gera URL assinada para uma foto (válida por 1 hora)
export async function gerarUrlAssinadaNR13(
  storagePath: string
): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(BUCKET_FOTOS)
    .createSignedUrl(storagePath, 3600)

  if (error) {
    console.error('Erro ao gerar URL assinada NR-13:', error)
    return null
  }
  return data.signedUrl
}

// Remove uma foto do storage NR-13
export async function removerFotoNR13(storagePath: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(BUCKET_FOTOS)
    .remove([storagePath])

  if (error) {
    console.error('Erro ao remover foto NR-13:', error)
    return false
  }
  return true
}
