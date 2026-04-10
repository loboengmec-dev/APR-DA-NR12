'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavBarProps {
  nomeUsuario: string
}

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function NavBar({ nomeUsuario }: NavBarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = getInitials(nomeUsuario)
  const isLaudos = pathname.startsWith('/dashboard') || pathname.startsWith('/laudos')
  const isPerfil = pathname === '/perfil'

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* LOGO + NAV */}
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.049.58.025 1.194-.14 1.743" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight hidden sm:block">APR NR-12</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                isLaudos
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Laudos
            </Link>
            <Link
              href="/perfil"
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                isPerfil
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Perfil
            </Link>
          </nav>
        </div>

        {/* USER + LOGOUT */}
        <div className="flex items-center gap-2.5">
          <span className="text-sm text-gray-500 hidden sm:block truncate max-w-[140px]">
            {nomeUsuario}
          </span>
          <div
            className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 select-none"
            title={nomeUsuario}
          >
            {initials}
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-red-600 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
          >
            Sair
          </button>
        </div>

      </div>
    </header>
  )
}
