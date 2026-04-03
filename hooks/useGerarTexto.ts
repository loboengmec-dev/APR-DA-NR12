import { useState } from 'react'

interface TextosGerados {
  texto_identificacao: string
  texto_recomendacao: string
  medida_controle: string
}

interface UseGerarTextoReturn {
  gerar: (itemNR12: string, tituloNC: string, risco?: string) => Promise<TextosGerados | null>
  gerando: boolean
  erro: string | null
}

export function useGerarTexto(): UseGerarTextoReturn {
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function gerar(itemNR12: string, tituloNC: string, risco?: string): Promise<TextosGerados | null> {
    setErro(null)
    setGerando(true)

    try {
      const resp = await fetch('/api/gerar-texto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemNR12, tituloNC, risco }),
      })

      if (!resp.ok) {
        const json = await resp.json()
        setErro(json.error ?? 'Erro ao gerar texto')
        return null
      }

      return await resp.json()
    } catch {
      setErro('Erro de conexão')
      return null
    } finally {
      setGerando(false)
    }
  }

  return { gerar, gerando, erro }
}
