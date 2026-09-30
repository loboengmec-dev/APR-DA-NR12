-- 012_nr13_numero_documento.sql
-- Número de documento do laudo (ex: RI-NR13-2026), exibido no cabeçalho
-- padronizado do relatório. Gerado automaticamente pelo formulário mas
-- editável pelo engenheiro.

ALTER TABLE inspecoes_nr13
  ADD COLUMN IF NOT EXISTS numero_documento TEXT DEFAULT NULL;
