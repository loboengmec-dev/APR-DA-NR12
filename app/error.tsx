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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Algo deu errado</h2>
            <p className="text-gray-500 text-sm mb-4">{error.message || 'Erro inesperado.'}</p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
