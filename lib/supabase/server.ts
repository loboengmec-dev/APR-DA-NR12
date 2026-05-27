import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (err) {
            // Em Server Components somente leitura de cookies é possível.
            // Este catch é esperado nesse contexto — não indica falha de sessão.
            // Em Route Handlers e Server Actions cookies são graváveis normalmente.
            if (process.env.NODE_ENV === 'development') {
              console.debug('[supabase/server] setAll ignorado (Server Component read-only):', err)
            }
          }
        },
      },
    }
  )
}
