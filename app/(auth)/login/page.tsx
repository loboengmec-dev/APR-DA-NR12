'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setErro('E-mail ou senha incorretos. Verifique seus dados.')
      setCarregando(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Entrar</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input"
            placeholder="seu@email.com"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="senha" className="label">Senha</label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            className="input"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="btn-primary w-full py-3 text-base"
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Não tem conta?{' '}
        <Link href="/cadastro" className="text-blue-700 font-medium hover:underline">
          Criar conta gratuita
        </Link>
      </p>
    </>
  )
}
