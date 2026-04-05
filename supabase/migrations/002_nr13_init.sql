-- 002_nr13_init.sql
-- Módulo de Expansão NR-13 (Phase 1)

-- 1. Dicionários Restritos (Eliminar input texto do engenheiro para materiais)
CREATE TABLE IF NOT EXISTS materiais_asme (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  tensao_admissivel_mpa NUMERIC NOT NULL
);

-- Seed de Materiais Comuns (ASME Sec VIII Div 1 - Part UCS/UHA)
INSERT INTO materiais_asme (nome, tensao_admissivel_mpa) VALUES
('SA-285 Gr. C (Corpo Padrão)', 137.9),
('SA-516 Gr. 70 (Alta Resistência)', 137.9),
('SA-36 (Aço Estrutural)', 114.5),
('SA-240 304L (Inox)', 115.0)
ON CONFLICT DO NOTHING;

-- 2. Vasos de Pressão (Base de Equipamentos NR-13)
CREATE TABLE IF NOT EXISTS vasos_pressao (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  fabricante TEXT,
  ano_fabricacao INTEGER,
  volume_m3 NUMERIC NOT NULL,
  fluido_classe TEXT NOT NULL, -- A, B, C, D
  categoria TEXT NOT NULL, -- I, II, III, IV, V
  geometria_tampo TEXT NOT NULL, -- Toriesferico, Semi-eliptico
  material_id INTEGER REFERENCES materiais_asme(id),
  diametro_interno_mm NUMERIC NOT NULL,
  eficiencia_junta_e NUMERIC NOT NULL DEFAULT 0.85, -- 1.0, 0.85, 0.70
  pmta_original_mpa NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Histórico de Inspeções e Recálculo Matemático
CREATE TABLE IF NOT EXISTS inspecoes_nr13 (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vaso_id UUID REFERENCES vasos_pressao(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
  data_inspecao DATE NOT NULL,
  tipo_inspecao TEXT NOT NULL, -- Inicial, Periódica, Extraordinária
  espessura_medida_costado_mm NUMERIC NOT NULL,
  espessura_medida_tampo_mm NUMERIC NOT NULL,
  psv_tag TEXT,
  psv_calibracao_mpa NUMERIC, 
  pmta_recalculada_mpa NUMERIC NOT NULL, -- Guardião: recalculado pela Server Action
  status TEXT NOT NULL, -- Conforme, Downgrade, Condenado
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ativar Row Level Security
ALTER TABLE vasos_pressao ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspecoes_nr13 ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiais_asme ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "usuario_acessa_seus_vasos" ON vasos_pressao
  FOR ALL USING (
    EXISTS (SELECT 1 FROM clientes WHERE clientes.id = vasos_pressao.cliente_id AND clientes.usuario_id = auth.uid())
  );

CREATE POLICY "materiais_leitura_publica" ON materiais_asme
  FOR SELECT USING (true);
