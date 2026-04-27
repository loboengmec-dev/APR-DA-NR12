-- 009_fix_caldeiras_constraints.sql
-- Alinha constraints do banco com os valores reais do formulário

-- 1. Categoria C na tabela caldeiras (formulário tinha opção C mas CHECK só aceitava A e B)
ALTER TABLE caldeiras
  DROP CONSTRAINT IF EXISTS caldeiras_categoria_caldeira_check;
ALTER TABLE caldeiras
  ADD CONSTRAINT caldeiras_categoria_caldeira_check
  CHECK (categoria_caldeira IN ('A', 'B', 'C'));

-- 2. Categoria C também no snapshot de inspecoes_caldeiras
ALTER TABLE inspecoes_caldeiras
  DROP CONSTRAINT IF EXISTS inspecoes_caldeiras_categoria_caldeira_check;
ALTER TABLE inspecoes_caldeiras
  ADD CONSTRAINT inspecoes_caldeiras_categoria_caldeira_check
  CHECK (categoria_caldeira IN ('A', 'B', 'C'));

-- 3. distancia_instalacao — simplificar para 'Conforme'/'Não Conforme'/'Dispensa Legal'
ALTER TABLE inspecoes_caldeiras
  DROP CONSTRAINT IF EXISTS inspecoes_caldeiras_distancia_instalacao_check;
ALTER TABLE inspecoes_caldeiras
  ADD CONSTRAINT inspecoes_caldeiras_distancia_instalacao_check
  CHECK (distancia_instalacao IN ('Conforme', 'Não Conforme', 'Dispensa Legal'));

-- 4. qualidade_agua — alinhar com padrão Conforme/Não Conforme do formulário
ALTER TABLE inspecoes_caldeiras
  DROP CONSTRAINT IF EXISTS inspecoes_caldeiras_qualidade_agua_check;
ALTER TABLE inspecoes_caldeiras
  ADD CONSTRAINT inspecoes_caldeiras_qualidade_agua_check
  CHECK (qualidade_agua IN ('Conforme', 'Não Conforme'));

-- 5. certificacao_operador — alinhar com padrão do formulário
ALTER TABLE inspecoes_caldeiras
  DROP CONSTRAINT IF EXISTS inspecoes_caldeiras_certificacao_operador_check;
ALTER TABLE inspecoes_caldeiras
  ADD CONSTRAINT inspecoes_caldeiras_certificacao_operador_check
  CHECK (certificacao_operador IN ('Conforme', 'Não Conforme'));

-- 6. Coluna de espessura anterior (para cálculo de taxa de corrosão)
ALTER TABLE inspecoes_caldeiras
  ADD COLUMN IF NOT EXISTS espessura_costado_anterior NUMERIC;

-- 7. Coluna para PSV pressão de calibração (caso não exista — idempotente)
ALTER TABLE inspecoes_caldeiras
  ADD COLUMN IF NOT EXISTS psv_calibracao_kpa NUMERIC;

-- 8. Coluna de meses entre inspeções (para taxa de corrosão)
ALTER TABLE inspecoes_caldeiras
  ADD COLUMN IF NOT EXISTS meses_entre_inspecoes INTEGER DEFAULT 12;
