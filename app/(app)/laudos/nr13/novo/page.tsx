'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FormInspecaoNR13 from '@/components/nr13/FormInspecaoNR13'

export default function NovoLaudoNR13Page() {
  const router = useRouter()

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shadow">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
            </svg>
          </div>
          Nova Inspeção NR-13
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Preencha todos os campos para criar uma inspeção de vaso de pressão.
        </p>
      </div>

      <FormInspecaoNR13 />
    </div>
  )
}