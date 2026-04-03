import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import LaudoPDF from '@/components/pdf/LaudoPDF'

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
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('nome, crea, email, logo_url')
    .eq('id', user.id)
    .single()

  // Ordenar equipamentos e NCs
  if (laudo.equipamentos) {
    laudo.equipamentos.sort((a: any, b: any) => a.ordem - b.ordem)
    laudo.equipamentos.forEach((eq: any) => {
      if (eq.nao_conformidades) {
        eq.nao_conformidades.sort((a: any, b: any) => a.ordem - b.ordem)
      }
    })
  }

  // Gerar URLs assinadas para fotos
  const fotosUrl: Record<string, string> = {}
  for (const eq of (laudo.equipamentos ?? [])) {
    // Foto geral do equipamento
    if (eq.foto_geral_url) {
      const { data: urlData } = await supabase.storage
        .from('fotos-nc')
        .createSignedUrl(eq.foto_geral_url, 3600)
      if (urlData?.signedUrl) {
        fotosUrl[`eq_${eq.id}`] = urlData.signedUrl
      }
    }
    for (const nc of (eq.nao_conformidades ?? [])) {
      for (const foto of (nc.fotos_nc ?? [])) {
        const { data: urlData } = await supabase.storage
          .from('fotos-nc')
          .createSignedUrl(foto.storage_path, 3600)
        if (urlData?.signedUrl) {
          fotosUrl[foto.id] = urlData.signedUrl
        }
      }
    }
  }

  // Renderizar PDF
  const buffer = await renderToBuffer(
    createElement(LaudoPDF, { laudo, perfil, fotosUrl })
  )

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="laudo-${params.id.slice(0, 8)}.pdf"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
