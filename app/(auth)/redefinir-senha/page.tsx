'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Estado = 'verificando' | 'pronto' | 'link_invalido'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [estado, setEstado] = useState<Estado>('verificando')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  // Ao chegar pelo link do e-mail, o Supabase estabelece uma sessão temporária de
  // recuperação. Fluxo PKCE: o link traz ?code=... que trocamos por sessão.
  // Fluxo implícito: o token vem no hash e é detectado automaticamente pelo client.
  useEffect(() => {
    const supabase = createClient()

    async function validar() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        setEstado(error ? 'link_invalido' : 'pronto')
        return
      }

      // Sem code na query — verifica se há sessão (hash já processado pelo client)
      const { data } = await supabase.auth.getSession()
      setEstado(data.session ? 'pronto' : 'link_invalido')
    }

    validar()
  }, [])

  async function handleRedefinir(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }

    setSalvando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSalvando(false)

    if (error) {
      setErro('Não foi possível redefinir a senha. O link pode ter expirado — solicite um novo.')
      return
    }

    setSucesso(true)
    // Encerra a sessão de recuperação e leva ao login para entrar com a nova senha
    await supabase.auth.signOut()
    setTimeout(() => {
      router.push('/login')
      router.refresh()
    }, 2500)
  }

  if (estado === 'verificando') {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Validando o link de recuperação...</p>
      </div>
    )
  }

  if (estado === 'link_invalido') {
    return (
      <>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Link inválido ou expirado</h2>
        <p className="text-sm text-gray-600 mb-6">
          Este link de recuperação não é mais válido. Solicite um novo para redefinir sua senha.
        </p>
        <Link href="/recuperar-senha" className="btn-primary w-full py-3 text-base block text-center">
          Solicitar novo link
        </Link>
      </>
    )
  }

  if (sucesso) {
    return (
      <>
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Senha redefinida!</h2>
        <p className="text-sm text-gray-600 text-center">
          Sua senha foi alterada com sucesso. Redirecionando para o login...
        </p>
      </>
    )
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Criar nova senha</h2>
      <p className="text-sm text-gray-600 mb-6">
        Escolha uma nova senha para sua conta. Use no mínimo 6 caracteres.
      </p>
      <form onSubmit={handleRedefinir} className="space-y-4">
        <div>
          <label htmlFor="senha" className="label">Nova senha</label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            className="input"
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
        </div>
        <div>
          <label htmlFor="confirmar" className="label">Confirmar nova senha</label>
          <input
            id="confirmar"
            type="password"
            value={confirmar}
            onChange={e => setConfirmar(e.target.value)}
            className="input"
            placeholder="••••••••"
            required
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
          disabled={salvando}
          className="btn-primary w-full py-3 text-base"
        >
          {salvando ? 'Salvando...' : 'Redefinir senha'}
        </button>
      </form>
    </>
  )
}
