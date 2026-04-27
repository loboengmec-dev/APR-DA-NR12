'use client'

import FormInspecaoCaldeira from '@/components/nr13/FormInspecaoCaldeira'
import Link from 'next/link'

export default function NovaInspecaoCaldeiraPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/laudos/nr13/caldeiras" className="text-sm text-gray-500 hover:text-gray-700">
          ← Inspeções de Caldeiras
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center shadow">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          Nova Inspeção de Caldeira
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Inicie um novo laudo de integridade estrutural preenchendo as medidas no form abaixo.
        </p>
      </div>

      <FormInspecaoCaldeira />
    </div>
  )
}
