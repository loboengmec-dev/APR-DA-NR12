import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'APR NR-12 — Laudos Técnicos',
  description: 'Sistema de Apreciação de Risco conforme NR-12',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'APR NR-12',
  },
}

export const viewport: Viewport = {
  themeColor: '#1d4ed8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
