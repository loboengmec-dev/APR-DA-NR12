'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavBarProps {
  nomeUsuario: string
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

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/dashboard" className="font-bold text-blue-700 text-base sm:text-lg whitespace-nowrap">
            APR NR-12
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-sm">
            <Link
              href="/dashboard"
              className={pathname === '/dashboard' ? 'text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900'}
            >
              Laudos
            </Link>
            <Link
              href="/perfil"
              className={pathname === '/perfil' ? 'text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900'}
            >
              Perfil
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:block truncate max-w-[160px]">
            {nomeUsuario}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
