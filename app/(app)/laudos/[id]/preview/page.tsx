import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PreviewPDFWrapper from '@/components/pdf/PreviewPDFWrapper'

export default async function PreviewLaudoPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Buscar laudo completo
  const { data: laudo, error } = await supabase
    .from('laudos')
    .select(`
      *,
      clientes(*),
      equipamentos(
        *,
        nao_conformidades(
          *,
          fotos_nc(*)
        )
      )
    `)
    .eq('id', params.id)
    .eq('usuario_id', user.id)
    .single()

  if (error || !laudo) {
    return <div className="p-10 text-red-500">Laudo não encontrado</div>
  }

  // Buscar perfil do usuário
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('nome, crea, email, logo_url')
    .eq('id', user.id)
    .single()

  // Ordenar equipamentos e NCs
  if (laudo.equipamentos) {
    laudo.equipamentos.sort((a: any, b: any) => a.ordem - b.ordem)
    laudo.equipamentos.forEach((eq: any) => {
      if (eq.nao_conformidades) {
        eq.nao_conformidades.sort((a: any, b: any) => a.ordem - b.ordem)
      }
    })
  }

  // Gerar URLs assinadas para fotos
  const fotosUrl: Record<string, string> = {}
  for (const eq of (laudo.equipamentos ?? [])) {
    // Foto geral do equipamento
    if (eq.foto_geral_url) {
      const { data: urlData } = await supabase.storage
        .from('fotos-nc')
        .createSignedUrl(eq.foto_geral_url, 3600)
      if (urlData?.signedUrl) {
        fotosUrl[`eq_${eq.id}`] = urlData.signedUrl
      }
    }
    for (const nc of (eq.nao_conformidades ?? [])) {
      for (const foto of (nc.fotos_nc ?? [])) {
        const { data: urlData } = await supabase.storage
          .from('fotos-nc')
          .createSignedUrl(foto.storage_path, 3600)
        if (urlData?.signedUrl) {
          fotosUrl[foto.id] = urlData.signedUrl
        }
      }
    }
  }

  return <PreviewPDFWrapper laudo={laudo} perfil={perfil} fotosUrl={fotosUrl} />
}
