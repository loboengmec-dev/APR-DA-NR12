-- 010_d_espelho_mm.sql
-- Adiciona coluna para a variável `d` do ASME PG-31 (espelho plano)
--
-- `d` = maior distância não suportada entre centros de tubos de fogo ou estroncas.
-- NÃO é o diâmetro interno da caldeira. Valor típico: 100–350 mm.
-- Default 200 mm para registros existentes (vão moderado conservador).

ALTER TABLE inspecoes_caldeiras
  ADD COLUMN IF NOT EXISTS d_espelho_mm NUMERIC DEFAULT 200;
