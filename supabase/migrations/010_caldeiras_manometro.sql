-- 010_caldeiras_manometro.sql
-- Adiciona verificação de conformidade de calibração do manômetro às inspeções de caldeira.
-- As fotos do manômetro são armazenadas no JSONB `fotos_exame` (chave "manometro"),
-- portanto não exigem nova coluna.

ALTER TABLE inspecoes_caldeiras
  ADD COLUMN IF NOT EXISTS manometro_calibracao TEXT;

-- Valores esperados (validados na aplicação, sem CHECK rígido para permitir evolução):
--   'Conforme'      → manômetro calibrado e dentro da validade
--   'Não Conforme'  → manômetro descalibrado/danificado
--   'Vencido'       → certificado de calibração expirado
COMMENT ON COLUMN inspecoes_caldeiras.manometro_calibracao IS
  'Conformidade da calibração do manômetro: Conforme | Não Conforme | Vencido';
