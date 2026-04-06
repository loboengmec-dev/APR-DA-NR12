/**
 * Rota de geração de PDF para relatórios NR-13.
 * Recebe os dados do formulário via POST e retorna o PDF binário.
 * Totalmente isolado do módulo NR-12.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import LaudoNR13PDF from '@/components/pdf/LaudoNR13PDF'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { dados, perfil, fotosUrl } = body

    if (!dados) {
      return NextResponse.json({ error: 'Dados do formulário são obrigatórios' }, { status: 400 })
    }

    // Cálculos ASME para exibir no PDF (server-side double-check)
    if (
      dados.materialS && dados.eficienciaE && dados.diametroD &&
      dados.espessuraCostado && dados.espessuraTampo && dados.psvCalibracao
    ) {
      const R = dados.diametroD / 2

      // Costado cilíndrico: P = (S * E * t) / (R + 0.6 * t)
      const pmtaCostado = (dados.materialS * dados.eficienciaE * dados.espessuraCostado) / (R + 0.6 * dados.espessuraCostado)

      // Tampo semi-elíptico 2:1: P = (2 * S * E * t) / (D + 0.2 * t)
      const pmtaTampo = (2 * dados.materialS * dados.eficienciaE * dados.espessuraTampo) / (dados.diametroD + 0.2 * dados.espessuraTampo)

      const pmtaLimitante = Math.min(pmtaCostado, pmtaTampo)

      dados._pmtaCostado = pmtaCostado
      dados._pmtaTampo = pmtaTampo
      dados._pmtaLimitante = pmtaLimitante
      dados._condena = dados.psvCalibracao > pmtaLimitante
    }

    const document = <LaudoNR13PDF dados={dados} perfil={perfil ?? {}} fotosUrl={fotosUrl ?? {}} />
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
