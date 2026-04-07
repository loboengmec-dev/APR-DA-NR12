-- 005_nr13_foto_paths.sql
-- Adiciona colunas para persistir caminhos de fotos que antes ficavam apenas em memória.
-- Resolve bug de fotos não disponíveis entre dispositivos (mobile ↔ desktop).

-- Fotos avulsas na inspeção (placa, manômetro, exame)
ALTER TABLE inspecoes_nr13 ADD COLUMN IF NOT EXISTS foto_placa_path TEXT;
ALTER TABLE inspecoes_nr13 ADD COLUMN IF NOT EXISTS foto_manometro_path TEXT;
ALTER TABLE inspecoes_nr13 ADD COLUMN IF NOT EXISTS fotos_exame JSONB;

-- Foto da NC — campo texto simples com storage_path
ALTER TABLE ncs_nr13 ADD COLUMN IF NOT EXISTS foto_path TEXT;
