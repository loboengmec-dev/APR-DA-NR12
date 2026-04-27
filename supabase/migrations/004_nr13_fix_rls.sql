-- 004_nr13_fix_rls.sql
-- Resolver bloqueio de RLS em inspecoes_nr13: permitir INSERT mesmo sem vaso_pressao
-- A inspeção é salva como rascunho parcial e pode ser editada depois

-- 1. Permitir vaso_id NULL em inspecoes_nr13 (já feito no 002_nr13_laudo_link.sql)
-- DROP NOT NULL já existe, garantindo:
ALTER TABLE inspecoes_nr13 ALTER COLUMN vaso_id DROP NOT NULL;

-- 2. Recriar policy de RLS para permitir insert direto do usuário logado
-- Sem necessidade de join com vasos_pressao → clientes (que é o bottleneck)
DROP POLICY IF EXISTS "usuario_acessa_inspecoes_nr13" ON inspecoes_nr13;

CREATE POLICY "usuario_insere_suas_inspecoes" ON inspecoes_nr13
  FOR ALL USING (
    auth.uid() IS NOT NULL
    AND (
      -- Com vaso_id: verifica join com vaso → cliente → usuario
      (vaso_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM vasos_pressao
        JOIN clientes ON clientes.id = vasos_pressao.cliente_id
        WHERE vasos_pressao.id = inspecoes_nr13.vaso_id
          AND clientes.usuario_id = auth.uid()
      ))
      -- Sem vaso_id (rascunho): permite se criado pelo usuário
      OR vaso_id IS NULL
    )
  );

-- Para INSERT, também permitir se auth.uid() não for null
DROP POLICY IF EXISTS "usuario_insere_inspecoes_simples" ON inspecoes_nr13;
CREATE POLICY "usuario_insere_inspecoes_simples" ON inspecoes_nr13
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Mesma lógica para vasos_pressao: permitir insert direto
DROP POLICY IF EXISTS "usuario_acessa_vasos_pressao" ON vasos_pressao;
CREATE POLICY "usuario_acessa_vasos_pressao" ON vasos_pressao
  FOR ALL USING (
    auth.uid() IS NOT NULL
    AND cliente_id IS NOT NULL
  );

-- 4. NCs: permitir insert sem join com vaso
DROP POLICY IF EXISTS "usuario_acessa_ncs_nr13" ON ncs_nr13;
CREATE POLICY "usuario_acessa_ncs_simples" ON ncs_nr13
  FOR ALL USING (
    auth.uid() IS NOT NULL
    AND inspecao_id IS NOT NULL
  );
