import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `Você é um assistente técnico especializado em laudos de Apreciação de Risco conforme NR-12.
Redija textos técnicos formais em português brasileiro, no estilo de um engenheiro de segurança experiente.
Use linguagem precisa, referencie os itens da norma, descreva os riscos com clareza técnica e as recomendações com especificidade.
Evite linguagem genérica.
Responda APENAS com JSON válido, sem explicações, sem markdown, sem blocos de código.
Formato exato: {"texto_identificacao": "...", "texto_recomendacao": "...", "medida_controle": "..."}`

// Rate limiting simples por usuário (sem dependência externa)
// Limite: 20 requisições por janela de 60 segundos por usuário
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 20
const RATE_LIMIT_WINDOW_MS = 60_000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  // Verificar autenticação
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Rate limiting por usuário
  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Limite de requisições atingido. Aguarde 1 minuto.' },
      { status: 429 }
    )
  }

  const { itemNR12, tituloNC, risco } = await request.json()

  if (!itemNR12 || !tituloNC) {
    return NextResponse.json({ error: 'itemNR12 e tituloNC são obrigatórios' }, { status: 400 })
  }

  const userPrompt = `Gere os textos técnicos para a seguinte não conformidade:
- Item NR-12: ${itemNR12}
- Título: ${tituloNC}
- Risco identificado: ${risco || 'não especificado'}

Gere: texto_identificacao (descrição técnica formal da não conformidade e do risco), texto_recomendacao (ação corretiva detalhada), medida_controle (resumo objetivo da medida).`

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Resposta inválida da IA' }, { status: 500 })
    }

    const resultado = JSON.parse(content.text)
    return NextResponse.json(resultado)
  } catch (err) {
    console.error('Erro ao chamar Claude API:', err)
    return NextResponse.json({ error: 'Erro ao gerar texto' }, { status: 500 })
  }
}
