'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const supabase = createClient()
    // O link do e-mail leva o usuário para /redefinir-senha, onde define a nova senha.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })

    setCarregando(false)

    if (error) {
      setErro('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.')
      return
    }

    // Sempre confirmamos o envio, mesmo que o e-mail não exista — evita
    // que a tela revele quais e-mails estão cadastrados (enumeração de contas).
    setEnviado(true)
  }

  if (enviado) {
    return (
      <>
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Verifique seu e-mail</h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Se houver uma conta associada a <strong>{email}</strong>, enviamos um link para
          redefinir sua senha. Confira também a caixa de spam.
        </p>
        <Link href="/login" className="btn-primary w-full py-3 text-base block text-center">
          Voltar para o login
        </Link>
      </>
    )
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Recuperar senha</h2>
      <p className="text-sm text-gray-600 mb-6">
        Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.
      </p>
      <form onSubmit={handleEnviar} className="space-y-4">
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
          {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Lembrou a senha?{' '}
        <Link href="/login" className="text-blue-700 font-medium hover:underline">
          Voltar para o login
        </Link>
      </p>
    </>
  )
}
