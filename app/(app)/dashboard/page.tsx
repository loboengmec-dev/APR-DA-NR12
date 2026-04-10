import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

async function buscarEstatisticas() {
  try {
    const supabase = await createClient()
    const [{ count: totalLaudos }, { count: totalInspecoes }] = await Promise.all([
      supabase.from('laudos').select('*', { count: 'exact', head: true }),
      supabase.from('inspecoes_nr13').select('*', { count: 'exact', head: true }),
    ])
    return {
      totalLaudos: totalLaudos ?? 0,
      totalInspecoes: totalInspecoes ?? 0,
    }
  } catch {
    return { totalLaudos: 0, totalInspecoes: 0 }
  }
}

export default async function DashboardPage() {
  const { totalLaudos, totalInspecoes } = await buscarEstatisticas()
  const totalGeral = totalLaudos + totalInspecoes

  return (
    <div className="space-y-8">

      {/* ── HEADER ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Painel de Inspeções</h1>
        <p className="text-sm text-gray-500 mt-1">
          Selecione o módulo para iniciar ou gerenciar laudos técnicos de conformidade.
        </p>
      </div>

      {/* ── KPI STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Laudos NR-12</p>
          <p className="text-3xl font-bold text-gray-900 mt-1 tabular-nums">{totalLaudos}</p>
          <p className="text-xs text-gray-400 mt-1">documentos gerados</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Inspeções NR-13</p>
          <p className="text-3xl font-bold text-gray-900 mt-1 tabular-nums">{totalInspecoes}</p>
          <p className="text-xs text-gray-400 mt-1">vasos inspecionados</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total de Laudos</p>
          <p className="text-3xl font-bold text-gray-900 mt-1 tabular-nums">{totalGeral}</p>
          <p className="text-xs text-gray-400 mt-1">todos os módulos</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-sm font-semibold text-emerald-700">Sistema ativo</p>
          </div>
          <p className="text-xs text-gray-400 mt-1">NR-12 · NR-13</p>
        </div>
      </div>

      {/* ── MÓDULOS ── */}
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Módulos Disponíveis</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* NR-12 */}
          <Link
            href="/dashboard/nr12"
            className="group relative overflow-hidden rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-7 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
          >
            <div className="absolute top-5 right-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Ativo
              </span>
            </div>

            <div className="flex flex-col gap-5">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-md group-hover:shadow-blue-200 group-hover:scale-105 transition-all duration-200">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.049.58.025 1.194-.14 1.743" />
                </svg>
              </div>

              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">NR-12</h3>
                  <span className="text-sm text-gray-500">Máquinas e Equipamentos</span>
                </div>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Apreciação de Risco, cálculo HRN, categorização de segurança (NBR 14153) e geração de laudos técnicos.
                </p>
                <div className="mt-4 pt-4 border-t border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="font-semibold text-gray-800 tabular-nums">{totalLaudos}</span>
                    <span className="text-gray-400">laudos</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 group-hover:translate-x-0.5 transition-transform">
                    Acessar
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* NR-13 */}
          <Link
            href="/laudos/nr13"
            className="group relative overflow-hidden rounded-2xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-7 hover:border-emerald-300 hover:shadow-lg transition-all duration-200"
          >
            <div className="absolute top-5 right-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Ativo
              </span>
            </div>

            <div className="flex flex-col gap-5">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md group-hover:shadow-emerald-200 group-hover:scale-105 transition-all duration-200">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                </svg>
              </div>

              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">NR-13</h3>
                  <span className="text-sm text-gray-500">Vasos de Pressão e Caldeiras</span>
                </div>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Inspeção ASME Sec. VIII, cálculo de PMTA em campo, medição de espessura e avaliação de PSV.
                </p>
                <div className="mt-4 pt-4 border-t border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                    <span className="font-semibold text-gray-800 tabular-nums">{totalInspecoes}</span>
                    <span className="text-gray-400">inspeções</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                    Acessar
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>

        </div>
      </div>

      {/* ── AÇÕES RÁPIDAS ── */}
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Ações Rápidas</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

          <Link
            href="/laudos/novo"
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/40 transition-all duration-150 group shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Novo NR-12</p>
              <p className="text-xs text-gray-400">Laudo de máquina</p>
            </div>
          </Link>

          <Link
            href="/laudos/nr13/novo-cliente"
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all duration-150 group shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Nova NR-13</p>
              <p className="text-xs text-gray-400">Inspeção de vaso</p>
            </div>
          </Link>

          <Link
            href="/perfil"
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150 group shadow-sm col-span-2 sm:col-span-1"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Meu Perfil</p>
              <p className="text-xs text-gray-400">Dados e empresa</p>
            </div>
          </Link>

        </div>
      </div>

    </div>
  )
}
