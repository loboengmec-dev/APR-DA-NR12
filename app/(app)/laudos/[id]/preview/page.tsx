import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PreviewPDFWrapper from '@/components/pdf/PreviewPDFWrapper'

/**
 * Baixa uma imagem a partir de uma URL e retorna como data URI base64.
 */
async function urlParaBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!response.ok) return null

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    return `data:${contentType};base64,${base64}`
  } catch (err) {
    console.error('[Preview] Falha ao converter imagem para base64:', err)
    return null
  }
}

export default async function PreviewLaudoPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Buscar laudo completo
  const { data: laudo, error } = await supabase
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
    .eq('id', params.id)
    .eq('usuario_id', user.id)
    .single()

  if (error || !laudo) {
    return <div className="p-10 text-red-500">Laudo não encontrado</div>
  }

  // Buscar perfil do usuário
  const { data: perfilRaw } = await supabase
    .from('usuarios')
    .select('nome, crea, email, logo_url')
    .eq('id', user.id)
    .single()

  // Converter logo para base64 (react-pdf não aceita URLs externas diretamente)
  const perfil: Record<string, any> = { ...(perfilRaw ?? {}) }
  if (perfilRaw?.logo_url) {
    try {
      const { data: signedData } = await supabase.storage
        .from('logos-usuario')
        .createSignedUrl(perfilRaw.logo_url, 3600)
      if (signedData?.signedUrl) {
        const logoBase64 = await urlParaBase64(signedData.signedUrl)
        if (logoBase64) perfil._logoPublicUrl = logoBase64
      }
    } catch (logoErr) {
      console.warn('[Preview NR12] Falha ao carregar logo:', logoErr)
    }
  }

  // Ordenar equipamentos e NCs
  if (laudo.equipamentos) {
    laudo.equipamentos.sort((a: any, b: any) => a.ordem - b.ordem)
    laudo.equipamentos.forEach((eq: any) => {
      if (eq.nao_conformidades) {
        eq.nao_conformidades.sort((a: any, b: any) => a.ordem - b.ordem)
      }
    })
  }

  // Gerar URLs assinadas e converter para base64 (data URI)
  const fotosUrl: Record<string, string> = {}
  const tarefas: { chave: string; urlPromise: Promise<string | null> }[] = []

  for (const eq of (laudo.equipamentos ?? [])) {
    if (eq.foto_geral_url) {
      const { data: urlData } = await supabase.storage
        .from('fotos-nc')
        .createSignedUrl(eq.foto_geral_url, 3600)
      if (urlData?.signedUrl) {
        tarefas.push({
          chave: `eq_${eq.id}`,
          urlPromise: urlParaBase64(urlData.signedUrl),
        })
      }
    }
    for (const nc of (eq.nao_conformidades ?? [])) {
      for (const foto of (nc.fotos_nc ?? [])) {
        const { data: urlData } = await supabase.storage
          .from('fotos-nc')
          .createSignedUrl(foto.storage_path, 3600)
        if (urlData?.signedUrl) {
          tarefas.push({
            chave: foto.id,
            urlPromise: urlParaBase64(urlData.signedUrl),
          })
        }
      }
    }
  }

  const resultados = await Promise.all(
    tarefas.map(async (t) => ({ chave: t.chave, base64: await t.urlPromise }))
  )
  for (const r of resultados) {
    if (r.base64) {
      fotosUrl[r.chave] = r.base64
    }
  }

  return <PreviewPDFWrapper laudo={laudo} perfil={perfil} fotosUrl={fotosUrl} />
}

