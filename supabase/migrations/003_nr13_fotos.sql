-- 003_nr13_fotos.sql
-- Sistema de fotos do módulo NR-13 — totalmente isolado do NR-12

-- ============================================================================
-- 1. Tabela: Foto da Placa de Identificação do Vaso
-- ============================================================================
CREATE TABLE IF NOT EXISTS placa_identificacao_fotos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vaso_id UUID REFERENCES vasos_pressao(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  legenda TEXT DEFAULT 'Placa de identificação',
  tamanho_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE placa_identificacao_fotos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_acessa_fotos_placa" ON placa_identificacao_fotos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vasos_pressao
      JOIN clientes ON clientes.id = vasos_pressao.cliente_id
      WHERE vasos_pressao.id = placa_identificacao_fotos.vaso_id
        AND clientes.usuario_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. Tabela: Fotos do Exame Externo / Interno
-- ============================================================================
CREATE TABLE IF NOT EXISTS exames_fotos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inspecao_id UUID REFERENCES inspecoes_nr13(id) ON DELETE CASCADE NOT NULL,
  tipo_exame TEXT NOT NULL CHECK (tipo_exame IN ('externo', 'interno')),
  storage_path TEXT NOT NULL,
  legenda TEXT,
  tamanho_bytes INTEGER,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE exames_fotos ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_exames_fotos_inspecao ON exames_fotos(inspecao_id);

CREATE POLICY "usuario_acessa_fotos_exame" ON exames_fotos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM inspecoes_nr13
      JOIN vasos_pressao ON vasos_pressao.id = inspecoes_nr13.vaso_id
      JOIN clientes ON clientes.id = vasos_pressao.cliente_id
      WHERE inspecoes_nr13.id = exames_fotos.inspecao_id
        AND clientes.usuario_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. Tabela: Fotos das Mediciones de Espessura
-- ============================================================================
CREATE TABLE IF NOT EXISTS medicoes_fotos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inspecao_id UUID REFERENCES inspecoes_nr13(id) ON DELETE CASCADE NOT NULL,
  ponto TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  legenda TEXT,
  tamanho_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE medicoes_fotos ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_medicoes_fotos_inspecao ON medicoes_fotos(inspecao_id);

CREATE POLICY "usuario_acessa_fotos_medicao" ON medicoes_fotos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM inspecoes_nr13
      JOIN vasos_pressao ON vasos_pressao.id = inspecoes_nr13.vaso_id
      JOIN clientes ON clientes.id = vasos_pressao.cliente_id
      WHERE inspecoes_nr13.id = medicoes_fotos.inspecao_id
        AND clientes.usuario_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. Tabela: Tabela de Não Conformidades do NR-13 (nova — não reusa do NR-12)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ncs_nr13 (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inspecao_id UUID REFERENCES inspecoes_nr13(id) ON DELETE CASCADE NOT NULL,
  descricao TEXT NOT NULL,
  ref_nr13 TEXT NOT NULL,
  acao_corretiva TEXT NOT NULL,
  grau_risco TEXT NOT NULL, -- GIR, Crítico, Moderado, Baixo
  prazo_dias INTEGER,
  responsavel TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ncs_nr13 ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ncs_nr13_inspecao ON ncs_nr13(inspecao_id);

CREATE POLICY "usuario_acessa_ncs_nr13" ON ncs_nr13
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM inspecoes_nr13
      JOIN vasos_pressao ON vasos_pressao.id = inspecoes_nr13.vaso_id
      JOIN clientes ON clientes.id = vasos_pressao.cliente_id
      WHERE inspecoes_nr13.id = ncs_nr13.inspecao_id
        AND clientes.usuario_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. Tabela: Fotos das Não Conformidades do NR-13
-- ============================================================================
CREATE TABLE IF NOT EXISTS ncs_fotos_nr13 (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nc_id UUID REFERENCES ncs_nr13(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  legenda TEXT,
  tamanho_bytes INTEGER,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ncs_fotos_nr13 ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ncs_fotos_nr13_nc ON ncs_fotos_nr13(nc_id);

CREATE POLICY "usuario_acessa_fotos_nc_nr13" ON ncs_fotos_nr13
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ncs_nr13
      JOIN inspecoes_nr13 ON inspecoes_nr13.id = ncs_nr13.inspecao_id
      JOIN vasos_pressao ON vasos_pressao.id = inspecoes_nr13.vaso_id
      JOIN clientes ON clientes.id = vasos_pressao.cliente_id
      WHERE ncs_nr13.id = ncs_fotos_nr13.nc_id
        AND clientes.usuario_id = auth.uid()
    )
  );