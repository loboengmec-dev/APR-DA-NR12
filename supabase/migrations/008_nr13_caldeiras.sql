-- 008_nr13_caldeiras.sql
-- Schema do módulo NR-13 para Caldeiras — baseado na estrutura validada de Vasos de Pressão

-- ============================================================================
-- 1. Tabela: Caldeiras
-- ============================================================================
CREATE TABLE IF NOT EXISTS caldeiras (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  fabricante TEXT,
  numero_serie TEXT,
  ano_fabricacao INTEGER CHECK (ano_fabricacao >= 1900),
  categoria_caldeira TEXT CHECK (categoria_caldeira IN ('A', 'B')),
  codigo_projeto TEXT CHECK (codigo_projeto IN ('ASME Sec. I', 'ASME Sec. IV', 'DIN', 'GB/T', 'Desconhecido')),
  pmta_fabricante_kpa NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE caldeiras ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_caldeiras_cliente ON caldeiras(cliente_id);

CREATE POLICY "usuario_acessa_caldeiras" ON caldeiras
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = caldeiras.cliente_id
        AND clientes.usuario_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. Tabela: Inspecoes Caldeiras
-- ============================================================================
CREATE TABLE IF NOT EXISTS inspecoes_caldeiras (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  caldeira_id UUID REFERENCES caldeiras(id) ON DELETE CASCADE NOT NULL,
  laudo_id UUID REFERENCES laudos(id) ON DELETE SET NULL,

  -- Snapshot
  tag TEXT NOT NULL,
  fabricante TEXT,
  numero_serie TEXT,
  ano_fabricacao INTEGER,
  categoria_caldeira TEXT,
  codigo_projeto TEXT,
  pmta_fabricante_kpa NUMERIC,

  -- Dados da inspeção
  data_inspecao DATE,
  data_emissao_laudo DATE,
  tipo_inspecao TEXT CHECK (tipo_inspecao IN ('Inicial', 'Periódica', 'Extraordinária')),
  ambiente TEXT CHECK (ambiente IN ('Aberto', 'Fechado')),

  -- Operação
  pressao_operacao_mpa NUMERIC,
  volume_m3 NUMERIC,
  capacidade_producao_vapor NUMERIC,

  -- Checklist Auditoria NR-13 (Caldeiras)
  controle_nivel_intertravamento TEXT CHECK (controle_nivel_intertravamento IN ('Conforme', 'Não Conforme', 'Inexistente')),
  distancia_instalacao TEXT CHECK (distancia_instalacao IN ('Conforme (>= 3m)', 'Não Conforme', 'Dispensa Legal')),
  iluminacao_emergencia TEXT CHECK (iluminacao_emergencia IN ('Conforme', 'Não Conforme')),
  manual_operacao_ptbr TEXT CHECK (manual_operacao_ptbr IN ('Disponível', 'Ausente')),
  qualidade_agua TEXT CHECK (qualidade_agua IN ('Controlada', 'Sem Controle')),
  certificacao_operador TEXT CHECK (certificacao_operador IN ('Certificado', 'Não Certificado')),

  -- Exames 
  exame_externo TEXT CHECK (exame_externo IN ('Conforme', 'Não Conforme')),
  exame_interno TEXT CHECK (exame_interno IN ('Conforme', 'Não Conforme', 'Não Aplicável')),
  teste_hidrostatico TEXT CHECK (teste_hidrostatico IN ('Aprovado', 'Reprovado', 'Não Aplicável')),

  -- JSONBs
  medicoes_espessura JSONB,
  dispositivos_seguranca JSONB,
  fotos_exame JSONB,

  -- Parâmetros ASME Sec. I e IV
  material_s NUMERIC,
  eficiencia_e NUMERIC,
  diametro_d NUMERIC,
  espessura_costado NUMERIC,
  espessura_espelho NUMERIC,
  psv_calibracao_kpa NUMERIC,

  -- PMTA calculada
  pmta_asme_kpa NUMERIC,
  pmta_plh_kpa NUMERIC,
  norma_calculo TEXT,

  -- Status Final e Parecer
  status_final TEXT CHECK (
    status_final IN ('Aprovado', 'Aprovado com Restrições', 'Reprovado — Downgrade Necessário', 'Interditado')
  ),
  status_seguranca TEXT CHECK (status_seguranca IN ('Conforme', 'Risco_Grave_Iminente')),
  proxima_inspecao_externa DATE,
  proxima_inspecao_interna DATE,
  data_proximo_teste_dispositivos DATE,
  parecer_tecnico TEXT,

  -- RTH
  rth_nome TEXT,
  rth_crea TEXT,
  rth_profissao TEXT,

  -- Foto Fixas
  foto_placa_path TEXT,
  foto_manometro_path TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inspecoes_caldeiras ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_inspecoes_caldeiras_ref ON inspecoes_caldeiras(caldeira_id);

CREATE POLICY "usuario_acessa_inspecoes_caldeiras" ON inspecoes_caldeiras
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM caldeiras
      JOIN clientes ON clientes.id = caldeiras.cliente_id
      WHERE caldeiras.id = inspecoes_caldeiras.caldeira_id
        AND clientes.usuario_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. Tabela: NCs Caldeiras
-- ============================================================================
CREATE TABLE IF NOT EXISTS ncs_caldeiras (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inspecao_id UUID REFERENCES inspecoes_caldeiras(id) ON DELETE CASCADE NOT NULL,
  descricao TEXT NOT NULL,
  ref_nr13 TEXT NOT NULL,
  acao_corretiva TEXT NOT NULL,
  grau_risco TEXT NOT NULL,
  prazo_dias INTEGER,
  responsavel TEXT,
  foto_path TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ncs_caldeiras ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ncs_caldeiras_inspecao ON ncs_caldeiras(inspecao_id);

CREATE POLICY "usuario_acessa_ncs_caldeiras" ON ncs_caldeiras
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM inspecoes_caldeiras
      JOIN caldeiras ON caldeiras.id = inspecoes_caldeiras.caldeira_id
      JOIN clientes ON clientes.id = caldeiras.cliente_id
      WHERE inspecoes_caldeiras.id = ncs_caldeiras.inspecao_id
        AND clientes.usuario_id = auth.uid()
    )
  );
