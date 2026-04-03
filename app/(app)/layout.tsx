import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'

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
    <div className="min-h-screen bg-gray-50">
      <NavBar nomeUsuario={perfil?.nome ?? user.email ?? 'Usuário'} />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
