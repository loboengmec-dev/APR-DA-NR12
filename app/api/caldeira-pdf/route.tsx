/**
 * Rota de geração de PDF para relatórios de Caldeiras — NR-13 / ASME Sec. I
 * Totalmente isolada do módulo NR-12 e de vasos de pressão (NR-13 VP).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import LaudoCaldeiraPDF from '@/components/pdf/LaudoCaldeiraPDF'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { dados, perfil, fotosUrl } = body

    if (!dados) {
      return NextResponse.json({ error: 'Dados do formulário são obrigatórios' }, { status: 400 })
    }

    // Carrega logo via URL assinada e converte para Data URL (base64)
    // @react-pdf/renderer não carrega URLs HTTPS remotas corretamente
    const perfilComLogo = { ...(perfil ?? {}) }
    if (perfilComLogo.logo_url) {
      try {
        const { createClient: createServiceClient } = await import('@supabase/supabase-js')
        const supabaseAdmin = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const { data: signedData } = await supabaseAdmin.storage
          .from('logos-usuario')
          .createSignedUrl(perfilComLogo.logo_url, 60)

        if (signedData?.signedUrl) {
          const logoResponse = await fetch(signedData.signedUrl)
          if (logoResponse.ok) {
            const buffer = await logoResponse.arrayBuffer()
            const base64 = Buffer.from(buffer).toString('base64')
            const contentType = logoResponse.headers.get('content-type') || 'image/png'
            perfilComLogo._logoPublicUrl = `data:${contentType};base64,${base64}`
          }
        }
      } catch (logoErr) {
        console.warn('Erro ao carregar logo para PDF caldeira:', logoErr)
      }
    }

    // Converte fotos das URLs assinadas para Data URL (base64) — necessário para @react-pdf
    const fotosBase64: Record<string, string> = {}
    if (fotosUrl && typeof fotosUrl === 'object') {
      await Promise.all(
        Object.entries(fotosUrl).map(async ([chave, url]) => {
          if (typeof url !== 'string') return
          try {
            const res = await fetch(url)
            if (res.ok) {
              const buf = await res.arrayBuffer()
              const b64 = Buffer.from(buf).toString('base64')
              const ct = res.headers.get('content-type') || 'image/jpeg'
              fotosBase64[chave] = `data:${ct};base64,${b64}`
            }
          } catch {
            // Foto individual falhou — prosseguir sem ela
          }
        })
      )
    }

    const document = (
      <LaudoCaldeiraPDF
        dados={dados}
        perfil={perfilComLogo}
        fotosUrl={fotosBase64}
      />
    )

    const pdfBlob = await pdf(document).toBlob()

    return new NextResponse(await pdfBlob.arrayBuffer(), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Caldeira_NR13_${dados.tag ?? 'caldeira'}_${dados.dataInspecao ?? new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    })
  } catch (err) {
    console.error('Erro ao gerar PDF Caldeira NR-13:', err)
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 })
  }
}
