-- Migration 007: Adiciona coluna norma_calculo em inspecoes_nr13
-- Necessário para rastrear qual norma técnica foi usada no cálculo de PMTA.
-- Default 'ASME' garante retrocompatibilidade com registros existentes.

ALTER TABLE inspecoes_nr13
  ADD COLUMN IF NOT EXISTS norma_calculo TEXT NOT NULL DEFAULT 'ASME'
    CHECK (norma_calculo IN ('ASME', 'GBT150'));

-- Índice para facilitar filtros/relatórios por norma
CREATE INDEX IF NOT EXISTS idx_inspecoes_nr13_norma_calculo
  ON inspecoes_nr13 (norma_calculo);

COMMENT ON COLUMN inspecoes_nr13.norma_calculo IS
  'Norma técnica usada no cálculo de PMTA: ASME = ASME Sec. VIII Div. 1 | GBT150 = GB/T 150-2011';
