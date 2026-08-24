/**
 * Endpoint de keep-alive — chamado periodicamente pelo Vercel Cron (vercel.json)
 * para manter o projeto Supabase ativo. Projetos do plano gratuito são pausados
 * automaticamente após 7 dias sem nenhuma requisição à API.
 *
 * Faz apenas uma consulta leve (head/count) para registrar atividade no projeto —
 * não expõe dados. Autenticado via CRON_SECRET para impedir chamadas externas
 * arbitrárias (evita abuso do endpoint por terceiros).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('usuarios')
      .select('id', { count: 'exact', head: true })

    if (error) throw error

    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error('[keepalive] Erro ao pingar Supabase:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
