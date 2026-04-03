'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AppError({
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
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Algo deu errado</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">{error.message || 'Ocorreu um erro inesperado. Tente novamente.'}</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          Tentar novamente
        </button>
        <Link href="/dashboard" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
          ← Dashboard
        </Link>
      </div>
    </div>
  )
}
