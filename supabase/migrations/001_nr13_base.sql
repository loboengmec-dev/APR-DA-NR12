-- 001_nr13_base.sql
-- Schema base do módulo NR-13 — extende `laudos` com `norma = 'NR-13'`
-- Dependências: tabela `clientes` (já existe do NR-12), `laudos` (já existe)

-- ============================================================================
-- 1. Tabela: Vasos de Pressão (espelha o conceito de `equipamentos` do NR-12)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vasos_pressao (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  fabricante TEXT,
  numero_serie TEXT,
  ano_fabricacao INTEGER CHECK (ano_fabricacao >= 1900),
  tipo_vaso TEXT CHECK (tipo_vaso IN ('Coluna (Vertical)', 'Vaso Horizontal', 'Esférico')),
  codigo_projeto TEXT CHECK (codigo_projeto IN ('ASME Sec. VIII Div 1', 'ASME Sec. VIII Div 2', 'PD 5500', 'GB/T 150', 'Desconhecido')),
  pmta_fabricante_kpa NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vasos_pressao ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_vasos_pressao_cliente ON vasos_pressao(cliente_id);

-- RLS: usuário acessa vasos dos seus clientes
CREATE POLICY "usuario_acessa_vasos_pressao" ON vasos_pressao
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = vasos_pressao.cliente_id
        AND clientes.usuario_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. Tabela: Inspecoes NR-13 (registro central de inspeção)
-- ============================================================================
CREATE TABLE IF NOT EXISTS inspecoes_nr13 (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vaso_id UUID REFERENCES vasos_pressao(id) ON DELETE CASCADE NOT NULL,

  -- Identificação do vaso (denormalizado para o snapshot da inspeção)
  tag TEXT NOT NULL,
  fabricante TEXT,
  numero_serie TEXT,
  ano_fabricacao INTEGER,
  tipo_vaso TEXT,
  codigo_projeto TEXT,
  pmta_fabricante_kpa NUMERIC,

  -- Dados da inspeção
  data_inspecao DATE,
  data_emissao_laudo DATE,
  tipo_inspecao TEXT CHECK (tipo_inspecao IN ('Inicial', 'Periódica', 'Extraordinária')),
  ambiente TEXT CHECK (ambiente IN ('Aberto', 'Fechado')),

  -- Classificação §13.5.1.1
  fluido_servico TEXT,
  fluido_classe TEXT CHECK (fluido_classe IN (
    'A (Inflamável/Tóxico)',
    'B (Combustível/Tóxico leve)',
    'C (Vapor de Água/Gases asfixiantes)',
    'D (Água/Outros)'
  )),
  pressao_operacao_mpa NUMERIC,
  volume_m3 NUMERIC,
  grupo_pv INTEGER,
  categoria_vaso TEXT CHECK (categoria_vaso IN ('I', 'II', 'III', 'IV', 'V')),

  -- Checklist Documental §13.5.1.5
  prontuario TEXT CHECK (prontuario IN ('Existe Integral', 'Parcial / Sendo Reconstituído', 'Não Existe')),
  registro_seguranca TEXT CHECK (registro_seguranca IN ('Atualizado', 'Desatualizado', 'Inexistente')),
  projeto_instalacao TEXT CHECK (projeto_instalacao IN ('Existe', 'Dispensa Legal (Antigo)', 'Não Existe')),
  relatorios_anteriores TEXT CHECK (relatorios_anteriores IN ('Disponíveis', 'Primeira Inspeção', 'Indisponíveis')),
  placa_identificacao TEXT CHECK (placa_identificacao IN ('Fixada e Legível', 'Ilegível / Danificada', 'Inexistente')),
  certificados_dispositivos TEXT CHECK (certificados_dispositivos IN ('Disponíveis', 'Não Disponíveis', 'N/A')),
  manual_operacao TEXT CHECK (manual_operacao IN ('Disponível em Português', 'Ausente / Sem Tradução', 'N/A')),

  -- Exames §13.3.4
  exame_externo TEXT CHECK (exame_externo IN ('Conforme', 'Não Conforme')),
  exame_interno TEXT CHECK (exame_interno IN ('Conforme', 'Não Conforme', 'Não Aplicável')),

  -- Medições de espessura §13.5.4.11(d) — JSON para evitar tabela filho extra
  medicoes_espessura JSONB,

  -- Dispositivos de segurança §13.5.1.2 / §13.5.4.11(n) — JSON
  dispositivos_seguranca JSONB,

  -- Parâmetros ASME Sec. VIII
  material_s NUMERIC,
  eficiencia_e NUMERIC,
  diametro_d NUMERIC,
  espessura_costado NUMERIC,
  espessura_tampo NUMERIC,
  psv_calibracao_kpa NUMERIC,

  -- PMTA calculada
  pmta_asme_kpa NUMERIC,
  pmta_plh_kpa NUMERIC,

  -- Status e parecer
  status_final TEXT CHECK (
    status_final IN ('Aprovado', 'Aprovado com Restrições', 'Reprovado — Downgrade Necessário', 'Interditado')
  ),
  status_seguranca TEXT CHECK (status_seguranca IN ('Conforme', 'Downgrade_Necessario')),
  proxima_inspecao_externa DATE,
  proxima_inspecao_interna DATE,
  data_proximo_teste_dispositivos DATE,
  parecer_tecnico TEXT,

  -- RTH §13.5.4.11(m)
  rth_nome TEXT,
  rth_crea TEXT,
  rth_profissao TEXT CHECK (rth_profissao IN (
    'Engenheiro Mecânico',
    'Engenheiro de Segurança do Trabalho',
    'Técnico de Segurança do Trabalho',
    'Outro'
  )),

  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inspecoes_nr13 ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_inspecoes_nr13_vaso ON inspecoes_nr13(vaso_id);

-- RLS via join com vasos_pressao → clientes
CREATE POLICY "usuario_acessa_inspecoes_nr13" ON inspecoes_nr13
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vasos_pressao
      JOIN clientes ON clientes.id = vasos_pressao.cliente_id
      WHERE vasos_pressao.id = inspecoes_nr13.vaso_id
        AND clientes.usuario_id = auth.uid()
    )
  );
