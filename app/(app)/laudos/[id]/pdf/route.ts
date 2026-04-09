import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import LaudoPDF from '@/components/pdf/LaudoPDF'

/**
 * Baixa uma imagem a partir de uma URL e retorna como data URI base64.
 * Isso garante que o @react-pdf/renderer consiga renderizar a imagem
 * sem depender de fetch externo (que pode falhar por CORS, timeout, etc).
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
    console.error('[PDF] Falha ao converter imagem para base64:', err)
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new NextResponse('Não autenticado', { status: 401 })
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
    return new NextResponse('Laudo não encontrado', { status: 404 })
  }

  // Buscar perfil do usuário
  const { data: perfilRaw } = await supabase
    .from('usuarios')
    .select('nome, crea, email, logo_url')
    .eq('id', user.id)
    .single()

  // Converter logo para base64 data URI — mesmo padrão da NR-13
  const perfil = { ...(perfilRaw ?? {}) }
  if (perfil?.logo_url) {
    try {
      const { data: signedData } = await supabase.storage
        .from('logos-usuario')
        .createSignedUrl(perfil.logo_url, 60)

      if (signedData?.signedUrl) {
        const logoBase64 = await urlParaBase64(signedData.signedUrl)
        if (logoBase64) {
          perfil._logoPublicUrl = logoBase64
        }
      }
    } catch (logoErr) {
      console.warn('[PDF] Erro ao carregar logo para PDF:', logoErr)
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
  // Isso elimina completamente problemas de CORS e fetch em mobile
  const fotosUrl: Record<string, string> = {}

  // Coletar todas as tarefas de download em paralelo para performance
  const tarefas: { chave: string; urlPromise: Promise<string | null> }[] = []

  for (const eq of (laudo.equipamentos ?? [])) {
    // Foto geral do equipamento
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

  // Aguardar todas as conversões em paralelo
  const resultados = await Promise.all(
    tarefas.map(async (t) => ({ chave: t.chave, base64: await t.urlPromise }))
  )
  for (const r of resultados) {
    if (r.base64) {
      fotosUrl[r.chave] = r.base64
    }
  }

  console.log(`[PDF] ${Object.keys(fotosUrl).length} fotos convertidas para base64 de ${tarefas.length} total`)

  // Renderizar PDF
  const buffer = await renderToBuffer(
    createElement(LaudoPDF, { laudo, perfil, fotosUrl })
  )

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="laudo-${params.id.slice(0, 8)}.pdf"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
