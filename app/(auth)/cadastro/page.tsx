'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CadastroPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [crea, setCrea] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    if (senha.length < 8) {
      setErro('A senha deve ter no mínimo 8 caracteres.')
      setCarregando(false)
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome, crea },
      },
    })

    if (error) {
      setErro('Erro ao criar conta: ' + error.message)
      setCarregando(false)
      return
    }

    // Inserir perfil na tabela usuarios
    if (data.user) {
      await supabase.from('usuarios').insert({
        id: data.user.id,
        nome,
        crea: crea || null,
        email,
        plano: 'beta',
      })
    }

    setSucesso(true)
    setCarregando(false)
  }

  if (sucesso) {
    return (
      <div className="text-center">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Conta criada!</h2>
        <p className="text-gray-600 text-sm mb-6">
          Verifique seu e-mail para confirmar o cadastro e em seguida faça login.
        </p>
        <Link href="/login" className="btn-primary inline-block">
          Ir para o Login
        </Link>
      </div>
    )
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Criar conta</h2>
      <form onSubmit={handleCadastro} className="space-y-4">
        <div>
          <label htmlFor="nome" className="label">Nome completo</label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="input"
            placeholder="Eng. João da Silva"
            required
          />
        </div>
        <div>
          <label htmlFor="crea" className="label">CREA <span className="text-gray-400 font-normal">(opcional)</span></label>
          <input
            id="crea"
            type="text"
            value={crea}
            onChange={e => setCrea(e.target.value)}
            className="input"
            placeholder="MG-123456/D"
          />
        </div>
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
          <label htmlFor="senha" className="label">Senha <span className="text-gray-400 font-normal">(mín. 8 caracteres)</span></label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            className="input"
            placeholder="••••••••"
            required
            minLength={8}
            autoComplete="new-password"
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
          {carregando ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Já tem conta?{' '}
        <Link href="/login" className="text-blue-700 font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </>
  )
}
