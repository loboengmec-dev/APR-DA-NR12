'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Usuario } from '@/types'

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<Partial<Usuario>>({})
  const [nome, setNome] = useState('')
  const [crea, setCrea] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setPerfil(data)
        setNome(data.nome ?? '')
        setCrea(data.crea ?? '')
      }
    }
    carregar()
  }, [])

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    setMensagem('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('usuarios')
      .update({ nome, crea: crea || null })
      .eq('id', user.id)

    if (error) {
      setErro('Erro ao salvar perfil: ' + error.message)
    } else {
      setMensagem('Perfil atualizado com sucesso.')
    }
    setSalvando(false)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meu Perfil</h1>

      <div className="card p-6">
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="label">Nome completo</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">CREA</label>
            <input
              type="text"
              value={crea}
              onChange={e => setCrea(e.target.value)}
              className="input"
              placeholder="MG-123456/D"
            />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              value={perfil.email ?? ''}
              className="input bg-gray-50 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado.</p>
          </div>
          <div>
            <label className="label">Plano</label>
            <input
              type="text"
              value={perfil.plano ?? ''}
              className="input bg-gray-50 cursor-not-allowed capitalize"
              disabled
            />
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {erro}
            </div>
          )}
          {mensagem && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
              {mensagem}
            </div>
          )}

          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}
