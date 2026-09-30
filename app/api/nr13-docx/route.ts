/**
 * Rota de geração do Laudo NR-13 (vaso de pressão) em .docx nativo do Word.
 * Substitui o antigo /api/nr13-pdf para este laudo — mesmo contrato de
 * entrada (dados, perfil, fotosUrl, fotoDimensoes), saída em .docx editável.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gerarLaudoNR13Docx, type FotoInfo } from '@/components/docx/LaudoNR13Docx'
import {
  calcularPMTACostadoPorNorma,
  calcularPMTATampoPorNorma,
  calcularPMTAGlobal,
  calcularFatorM,
  calcularFatorK_GBT150,
  type GeometriaCostado,
  type GeometriaTampo,
} from '@/lib/domain/nr13/pmta'
import { LABEL_NORMA, type NormaCalculo } from '@/lib/domain/nr13/materiais'

// ---------------------------------------------------------------------------
// Detecção de dimensões e tipo de imagem a partir do buffer binário
// ---------------------------------------------------------------------------
function detectarImagem(buf: Buffer, contentType: string): { type: 'png' | 'jpg'; width: number; height: number } {
  const isPng = contentType.includes('png')
  const type: 'png' | 'jpg' = isPng ? 'png' : 'jpg'
  try {
    if (isPng && buf.length >= 24) {
      return { type, width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
    }
    if (!isPng && buf.length > 10) {
      for (let i = 0; i < buf.length - 8; i++) {
        if (buf[i] === 0xff && (buf[i + 1] === 0xc0 || buf[i + 1] === 0xc1 || buf[i + 1] === 0xc2)) {
          return { type, height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
        }
      }
    }
  } catch {
    // fallback abaixo
  }
  return { type, width: 800, height: 600 }
}

// ---------------------------------------------------------------------------
// Proteção SSRF — só URLs do Supabase Storage do próprio projeto
// ---------------------------------------------------------------------------
function isSafeStorageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname
    return parsed.protocol === 'https:' && (parsed.hostname === supabaseHost || parsed.hostname.endsWith('.supabase.co'))
  } catch {
    return false
  }
}

async function baixarFoto(url: string): Promise<FotoInfo | null> {
  if (!isSafeStorageUrl(url)) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || 'image/jpeg'
    if (!ct.startsWith('image/')) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const { type, width, height } = detectarImagem(buffer, ct)
    return { buffer, type, width, height }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  // Autenticação obrigatória
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { dados, perfil, fotosUrl } = body

    if (!dados) {
      return NextResponse.json({ error: 'Dados do formulário são obrigatórios' }, { status: 400 })
    }

    // Double-check do cálculo de PMTA no servidor (não confia apenas no cliente)
    if (
      dados.materialS && dados.eficienciaE && dados.diametroD &&
      dados.espessuraCostado && dados.espessuraTampo && dados.psvCalibracao
    ) {
      const norma = (dados.normaCalculo || 'ASME') as NormaCalculo
      const R = dados.diametroD / 2
      const sMpa = Number(dados.materialS) / 10.197
      const psvMpa = Number(dados.psvCalibracao) / 10.197
      const geoCostado = (dados.geometriaCostado || 'cilindrico') as GeometriaCostado
      const geoTampo = (dados.geometriaTampo || 'toriesferico') as GeometriaTampo

      const paramsCostado = { S: sMpa, E: dados.eficienciaE, t: dados.espessuraCostado, R, D: dados.diametroD, alpha: dados.anguloConeDeg }
      const paramsTampo = {
        S: sMpa, E: dados.eficienciaE, t: dados.espessuraTampo, R, D: dados.diametroD,
        L: dados.raioAbaulamento || undefined, r: dados.raioRebordo || undefined, alpha: dados.anguloConeDeg,
      }

      const pmtaCostadoMpa = calcularPMTACostadoPorNorma(norma, geoCostado, paramsCostado)
      const pmtaTampoMpa = calcularPMTATampoPorNorma(norma, geoTampo, paramsTampo)
      const global = calcularPMTAGlobal(pmtaCostadoMpa, pmtaTampoMpa, psvMpa)

      dados._pmtaCostado = pmtaCostadoMpa * 10.197
      dados._pmtaTampo = pmtaTampoMpa * 10.197
      dados._pmtaLimitante = global.pmtaLimitante * 10.197
      dados._componenteFragil = global.componenteFragil
      dados._condena = global.condena
      dados._normaSelecionada = LABEL_NORMA[norma]

      if (geoTampo === 'toriesferico') {
        const L = dados.raioAbaulamento || dados.diametroD
        const rK = dados.raioRebordo || 0.06 * dados.diametroD
        if (norma === 'GBT150') dados._fatorK = calcularFatorK_GBT150(dados.diametroD, L, rK)
        else dados._fatorM = calcularFatorM(L, rK)
      }
    }

    // Logo do engenheiro — via service role + signed URL (bucket separado das fotos de inspeção)
    let logoEngenheiro: FotoInfo | null = null
    if (perfil?.logo_url) {
      try {
        const { createClient: createServiceClient } = await import('@supabase/supabase-js')
        const supabaseAdmin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        const { data: signedData } = await supabaseAdmin.storage.from('logos-usuario').createSignedUrl(perfil.logo_url, 60)
        if (signedData?.signedUrl) logoEngenheiro = await baixarFoto(signedData.signedUrl)
      } catch (err) {
        console.warn('Erro ao carregar logo do engenheiro:', err)
      }
    }

    // Fotos da inspeção + logo do cliente (já vêm como URL assinada do cliente, protegidas por SSRF aqui)
    const fotos: Record<string, FotoInfo> = {}
    let logoCliente: FotoInfo | null = null
    if (fotosUrl && typeof fotosUrl === 'object') {
      await Promise.all(
        Object.entries(fotosUrl as Record<string, unknown>).map(async ([chave, url]) => {
          if (typeof url !== 'string') return
          const foto = await baixarFoto(url)
          if (!foto) return
          if (chave === 'logoCliente') logoCliente = foto
          else fotos[chave] = foto
        })
      )
    }

    const buffer = await gerarLaudoNR13Docx(dados, perfil, fotos, logoEngenheiro, logoCliente)

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Inspecao_NR13_${dados.tag ?? 'vaso'}_${dados.dataInspecao ?? new Date().toISOString().slice(0, 10)}.docx"`,
      },
    })
  } catch (err) {
    console.error('Erro ao gerar DOCX NR-13:', err)
    return NextResponse.json({ error: 'Erro ao gerar documento' }, { status: 500 })
  }
}
