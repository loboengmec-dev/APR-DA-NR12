'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadLogo } from '@/lib/storage'
import type { Usuario } from '@/types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const BUCKET_LOGOS = 'logos-usuario'

function urlPublicaLogo(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_LOGOS}/${storagePath}`
}

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<Partial<Usuario>>({})
  const [nome, setNome] = useState('')
  const [crea, setCrea] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  // Logo
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadandoLogo, setUploadandoLogo] = useState(false)
  const [erroLogo, setErroLogo] = useState('')
  const inputLogoRef = useRef<HTMLInputElement>(null)

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
        if (data.logo_url) setLogoPreview(urlPublicaLogo(data.logo_url))
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

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validações de arquivo
    if (!file.type.startsWith('image/')) {
      setErroLogo('Apenas imagens são aceitas (PNG, JPG, SVG).')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setErroLogo('A logo deve ter no máximo 2 MB.')
      return
    }

    setErroLogo('')
    setUploadandoLogo(true)

    // Preview local imediato
    const localUrl = URL.createObjectURL(file)
    setLogoPreview(localUrl)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploadandoLogo(false); return }

    const { path, error: uploadError } = await uploadLogo(file, user.id)

    if (uploadError || !path) {
      setErroLogo('Erro ao enviar logo: ' + (uploadError ?? 'tente novamente.'))
      setLogoPreview(perfil.logo_url ? urlPublicaLogo(perfil.logo_url) : null)
      setUploadandoLogo(false)
      return
    }

    // Persiste o path no banco
    const { error: dbError } = await supabase
      .from('usuarios')
      .update({ logo_url: path })
      .eq('id', user.id)

    if (dbError) {
      setErroLogo('Logo enviada, mas erro ao salvar no perfil: ' + dbError.message)
    } else {
      setPerfil(prev => ({ ...prev, logo_url: path }))
      setLogoPreview(urlPublicaLogo(path))
      setMensagem('Logo atualizada com sucesso.')
    }

    setUploadandoLogo(false)
    URL.revokeObjectURL(localUrl)
  }

  async function handleRemoverLogo() {
    if (!perfil.logo_url) return
    setUploadandoLogo(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploadandoLogo(false); return }

    await supabase.storage.from(BUCKET_LOGOS).remove([perfil.logo_url])
    await supabase.from('usuarios').update({ logo_url: null }).eq('id', user.id)

    setPerfil(prev => ({ ...prev, logo_url: null }))
    setLogoPreview(null)
    setMensagem('Logo removida.')
    setUploadandoLogo(false)
    if (inputLogoRef.current) inputLogoRef.current.value = ''
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meu Perfil</h1>

      {/* ── Logo da empresa ── */}
      <div className="card p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Logo da Empresa</h2>
        <p className="text-xs text-gray-400 mb-4">
          Aparece na capa e no cabeçalho de todos os relatórios PDF. PNG ou SVG transparente recomendado. Máx. 2 MB.
        </p>

        <div className="flex items-center gap-4">
          {/* Preview */}
          <div className="w-32 h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain p-1" />
            ) : (
              <span className="text-xs text-gray-400 text-center px-2">Sem logo</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={uploadandoLogo}
              onClick={() => inputLogoRef.current?.click()}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {uploadandoLogo ? 'Enviando...' : logoPreview ? 'Trocar logo' : 'Fazer upload'}
            </button>
            {logoPreview && (
              <button
                type="button"
                disabled={uploadandoLogo}
                onClick={handleRemoverLogo}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                Remover logo
              </button>
            )}
          </div>
        </div>

        <input
          ref={inputLogoRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={handleLogoChange}
        />

        {erroLogo && (
          <p className="text-xs text-red-600 mt-2">{erroLogo}</p>
        )}
      </div>

      {/* ── Dados pessoais ── */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Dados do Profissional</h2>
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
