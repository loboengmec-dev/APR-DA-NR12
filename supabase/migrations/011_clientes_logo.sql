-- 011_clientes_logo.sql
-- Permite anexar a logo do cliente/parceiro a cada registro de `clientes`.
-- Usado no cabeçalho do laudo NR-13 quando o serviço é prestado em parceria
-- e o relatório deve exibir a marca do cliente contratante.

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;
