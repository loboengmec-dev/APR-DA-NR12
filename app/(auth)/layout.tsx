export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white tracking-tight leading-none">
            ENG<span className="text-blue-300"> HUB</span>
          </h1>
          <p className="text-blue-200 mt-2 text-sm">Plataforma de laudos técnicos NR-12 e NR-13</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
