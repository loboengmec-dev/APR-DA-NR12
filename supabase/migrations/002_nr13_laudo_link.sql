-- 002_nr13_laudo_link.sql
-- Vincula vasos_pressao e inspecoes_nr13 ao sistema de laudos existente

-- FK de vasos_pressao → laudos
ALTER TABLE vasos_pressao ADD COLUMN IF NOT EXISTS laudo_id UUID REFERENCES laudos(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_vasos_pressao_laudo ON vasos_pressao(laudo_id);

-- FK de inspecoes_nr13 → laudos
ALTER TABLE inspecoes_nr13 ADD COLUMN IF NOT EXISTS laudo_id UUID REFERENCES laudos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_inspecoes_nr13_laudo ON inspecoes_nr13(laudo_id);

-- Permitir que inspecoes_nr13.vaso_id aceita temporariamente NULL
ALTER TABLE inspecoes_nr13 ALTER COLUMN vaso_id DROP NOT NULL;
