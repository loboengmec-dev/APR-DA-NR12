/**
 * Rota de geração de PDF para relatórios NR-13.
 * Recebe os dados do formulário via POST, todos em kgf/cm² para pressão.
 * Totalmente isolado do módulo NR-12.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import LaudoNR13PDF from '@/components/pdf/LaudoNR13PDF'
import {
  calcularPMTACostado,
  calcularPMTATampo,
  calcularPMTAGlobal,
  calcularFatorM,
  type GeometriaCostado,
  type GeometriaTampo,
} from '@/lib/domain/nr13/pmta'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { dados, perfil, fotosUrl, fotoDimensoes } = body

    if (!dados) {
      return NextResponse.json({ error: 'Dados do formulário são obrigatórios' }, { status: 400 })
    }

    // Cálculos ASME — valores de pressão chegam em kgf/cm², converte para MPa
    if (
      dados.materialS && dados.eficienciaE && dados.diametroD &&
      dados.espessuraCostado && dados.espessuraTampo && dados.psvCalibracao
    ) {
      const R = dados.diametroD / 2
      const sMpa = Number(dados.materialS) / 10.197
      const psvMpa = Number(dados.psvCalibracao) / 10.197
      const geoCostado = (dados.geometriaCostado || 'cilindrico') as GeometriaCostado
      const geoTampo = (dados.geometriaTampo || 'toriesferico') as GeometriaTampo

      const paramsCostado = {
        S: sMpa, E: dados.eficienciaE, t: dados.espessuraCostado,
        R, D: dados.diametroD, alpha: dados.anguloConeDeg,
      }
      const paramsTampo = {
        S: sMpa, E: dados.eficienciaE, t: dados.espessuraTampo,
        R, D: dados.diametroD,
        L: dados.raioAbaulamento || undefined,
        r: dados.raioRebordo || undefined,
        alpha: dados.anguloConeDeg,
      }

      const pmtaCostadoMpa = calcularPMTACostado(geoCostado, paramsCostado)
      const pmtaTampoMpa = calcularPMTATampo(geoTampo, paramsTampo)
      const global = calcularPMTAGlobal(pmtaCostadoMpa, pmtaTampoMpa, psvMpa)

      // Converte para kgf/cm² para exibição no PDF
      dados._pmtaCostado = pmtaCostadoMpa * 10.197
      dados._pmtaTampo = pmtaTampoMpa * 10.197
      dados._pmtaLimitante = global.pmtaLimitante * 10.197
      dados._componenteFragil = global.componenteFragil
      dados._condena = global.condena

      // Fator M para torisférico
      if (geoTampo === 'toriesferico') {
        const L = dados.raioAbaulamento || dados.diametroD
        const rK = dados.raioRebordo || 0.06 * dados.diametroD
        dados._fatorM = calcularFatorM(L, rK)
      }
    }

    // Carrega logo do Storage via URL assinada e converte para Data URL (base64)
    // @react-pdf/renderer não carrega URLs remotas bem, então precisa ser data URI
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
        console.warn('Erro ao carregar logo para PDF:', logoErr)
      }
    }

    const document = <LaudoNR13PDF dados={dados} perfil={perfilComLogo} fotosUrl={fotosUrl ?? {}} fotoDimensoes={fotoDimensoes ?? {}} />
    const pdfBlob = await pdf(document).toBlob()

    return new NextResponse(await pdfBlob.arrayBuffer(), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Inspecao_NR13_${dados.tag ?? 'vaso'}_${dados.dataInspecao ?? new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    })
  } catch (err) {
    console.error('Erro ao gerar PDF NR-13:', err)
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 })
  }
}
