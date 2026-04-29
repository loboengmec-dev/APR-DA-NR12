import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Busca dados do perfil
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('nome, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar nomeUsuario={perfil?.nome ?? user.email ?? 'Usuário'} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 overflow-y-auto h-screen pb-24 md:pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
