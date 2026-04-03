'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Algo deu errado</h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>{error.message || 'Erro inesperado.'}</p>
            <button
              onClick={reset}
              style={{ padding: '8px 16px', backgroundColor: '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
