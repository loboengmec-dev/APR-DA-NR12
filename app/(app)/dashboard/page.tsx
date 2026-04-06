'use client'

import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Painel de Inspeções</h1>
        <p className="text-sm text-gray-500 mt-1">
          Selecione o módulo de inspeção para iniciar um novo laudo ou gerenciar laudos existentes.
        </p>
      </div>

      {/* CARDS DOS MÓDULOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* NR-12 — Máquinas e Equipamentos */}
        <Link
          href="/dashboard/nr12"
          className="group relative overflow-hidden rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-50 p-8 hover:border-blue-400 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex flex-col items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.049.58.025 1.194-.14 1.743" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">NR-12</h3>
              <p className="text-base font-medium text-gray-700 mt-0.5">Máquinas e Equipamentos</p>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">Apreciação de Risco, cálculo HRN, categorização de segurança (NBR 14153) e geração de laudos técnicos.</p>
            </div>
          </div>
          <div className="absolute top-6 right-6 text-gray-200 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </Link>

        {/* NR-13 — Vasos de Pressão */}
        <Link
          href="/laudos/nr13"
          className="group relative overflow-hidden rounded-2xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-8 hover:border-emerald-400 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex flex-col items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">NR-13</h3>
              <p className="text-base font-medium text-gray-700 mt-0.5">Vasos de Pressão e Caldeiras</p>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">Inspeção ASME Sec. VIII, cálculo de PMTA em campo, medição de espessura e avaliação de PSV.</p>
            </div>
          </div>
          <div className="absolute top-6 right-6 text-gray-200 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </Link>

      </div>
    </div>
  )
}
