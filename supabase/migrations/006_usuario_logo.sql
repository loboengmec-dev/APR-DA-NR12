-- Adiciona coluna logo_url na tabela usuarios (idempotente)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;

-- ========== RLS Policies para bucket 'logos-usuario' ==========
-- Bucket deve ser criado como PUBLIC (permitindo leitura pública)
-- Mas as políticas abaixo restringem INSERT/UPDATE/DELETE apenas ao usuário autenticado

-- Política: Usuários autenticados podem fazer upload (INSERT) apenas em sua própria pasta
CREATE POLICY "Users can upload their own logo"
  ON storage.objects FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id = 'logos-usuario' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: Usuários autenticados podem atualizar (UPDATE) apenas sua própria logo
CREATE POLICY "Users can update their own logo"
  ON storage.objects FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'logos-usuario' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id = 'logos-usuario' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: Usuários autenticados podem deletar (DELETE) apenas sua própria logo
CREATE POLICY "Users can delete their own logo"
  ON storage.objects FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'logos-usuario' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: Qualquer um (público) pode ler (SELECT) as logos
CREATE POLICY "Logos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos-usuario');
