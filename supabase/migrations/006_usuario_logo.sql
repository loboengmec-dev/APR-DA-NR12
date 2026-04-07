-- Adiciona coluna logo_url na tabela usuarios (idempotente)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;

-- Bucket logos-usuario (público, sem autenticação para leitura)
-- Executar via Supabase Dashboard > Storage > New Bucket:
--   Nome: logos-usuario | Public: true
-- A política de INSERT/UPDATE/DELETE protege por RLS (auth.uid):
-- INSERT: bucket_id = 'logos-usuario' AND (storage.foldername(name))[1] = auth.uid()::text
-- UPDATE/DELETE: mesma condição
