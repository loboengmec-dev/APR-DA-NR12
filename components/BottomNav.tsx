'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function BottomNav() {
  const pathname = usePathname()
  const [nr13Open, setNr13Open] = useState(false)

  // Fecha o sheet ao trocar de rota
  useEffect(() => {
    setNr13Open(false)
  }, [pathname])

  const isHome = pathname === '/dashboard'
  const isNr12 = pathname.startsWith('/dashboard/nr12') || (pathname.startsWith('/laudos') && !pathname.includes('/nr13'))
  const isNr13 = pathname.includes('/nr13')
  const isPerfil = pathname === '/perfil'

  return (
    <>
      {/* Backdrop do sheet NR-13 */}
      {nr13Open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setNr13Open(false)}
          aria-hidden="true"
        />
      )}

      {/* Sheet de seleção NR-13 */}
      {nr13Open && (
        <div className="fixed bottom-16 left-0 right-0 z-50 md:hidden bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 pb-2">
          {/* Handle visual */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 mb-2">
            Equipamentos (NR-13)
          </p>

          <Link
            href="/laudos/nr13/vasos"
            className={`flex items-center gap-4 px-5 py-3.5 hover:bg-emerald-50 transition-colors ${
              pathname.includes('/nr13/vasos') ? 'bg-emerald-50' : ''
            }`}
            onClick={() => setNr13Open(false)}
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Vasos de Pressão</p>
              <p className="text-xs text-gray-400">Inspeção ASME Sec. VIII · PMTA</p>
            </div>
          </Link>

          <Link
            href="/laudos/nr13/caldeiras"
            className={`flex items-center gap-4 px-5 py-3.5 hover:bg-orange-50 transition-colors ${
              pathname.includes('/nr13/caldeiras') ? 'bg-orange-50' : ''
            }`}
            onClick={() => setNr13Open(false)}
          >
            <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Caldeiras</p>
              <p className="text-xs text-gray-400">Inspeção e cálculo de PMTA</p>
            </div>
          </Link>
        </div>
      )}

      {/* Barra de navegação inferior */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-16">

          {/* Visão Geral */}
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg transition-colors ${
              isHome ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11l-9-9-9 9m18 0v10a1 1 0 01-1 1h-3m-6 0v-4a2 2 0 012-2h2a2 2 0 012 2v4" />
            </svg>
            <span className="text-[10px] font-medium leading-none">Início</span>
          </Link>

          {/* NR-12 */}
          <Link
            href="/dashboard/nr12"
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg transition-colors ${
              isNr12 ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.049.58.025 1.194-.14 1.743" />
            </svg>
            <span className="text-[10px] font-medium leading-none">NR-12</span>
          </Link>

          {/* NR-13 — abre sheet */}
          <button
            onClick={() => setNr13Open((prev) => !prev)}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg transition-colors ${
              isNr13 || nr13Open ? 'text-emerald-600' : 'text-gray-400'
            }`}
            aria-expanded={nr13Open}
            aria-haspopup="dialog"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
            </svg>
            <span className="text-[10px] font-medium leading-none">NR-13</span>
          </button>

          {/* Perfil */}
          <Link
            href="/perfil"
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg transition-colors ${
              isPerfil ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span className="text-[10px] font-medium leading-none">Perfil</span>
          </Link>

        </div>
      </nav>
    </>
  )
}
