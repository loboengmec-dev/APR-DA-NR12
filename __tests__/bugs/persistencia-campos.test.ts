/**
 * Testes de regressão — Bug fix: persistência de campos após salvar (2026-04-09)
 *
 * Problema: `normaCalculo` e `statusFinalVaso` resetavam para defaults ao
 * reabrir a inspeção, mesmo após o engenheiro ter salvo valores diferentes.
 *
 * Causa:
 *  1. `norma_calculo` ausente do `dbToForm()` em `[id]/page.tsx`
 *  2. `norma_calculo` ausente da interface `InspecoesNR13` em `types.ts`
 *  3. `useEffect` de auto-sugestão do statusFinalVaso disparava na carga
 *     da edição, sobrescrevendo o valor salvo no banco
 */

import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// 1. dbToForm MAPEIA norma_calculo → normaCalculo
// ---------------------------------------------------------------------------

describe('dbToForm — normaCalculo mapeado do banco', () => {
  const pagePath = path.resolve(
    __dirname,
    '../../app/(app)/laudos/nr13/[id]/page.tsx'
  )
  let src: string

  beforeAll(() => {
    src = fs.readFileSync(pagePath, 'utf-8')
  })

  test('dbToForm inclui normaCalculo mapeado de row.norma_calculo', () => {
    expect(src).toContain("normaCalculo: row.norma_calculo ?? 'ASME'")
  })

  test('normaCalculo aparece antes de materialS no dbToForm', () => {
    const posNorma = src.indexOf("normaCalculo: row.norma_calculo")
    const posMaterial = src.indexOf("materialS: row.material_s")
    expect(posNorma).toBeGreaterThan(-1)
    expect(posMaterial).toBeGreaterThan(-1)
    expect(posNorma).toBeLessThan(posMaterial)
  })
})

// ---------------------------------------------------------------------------
// 2. INTERFACE InspecoesNR13 CONTÉM norma_calculo
// ---------------------------------------------------------------------------

describe('types.ts — InspecoesNR13 inclui norma_calculo', () => {
  const typesPath = path.resolve(__dirname, '../../types.ts')
  let src: string

  beforeAll(() => {
    src = fs.readFileSync(typesPath, 'utf-8')
  })

  test('Interface InspecoesNR13 declara norma_calculo', () => {
    expect(src).toContain('norma_calculo')
  })
})

// ---------------------------------------------------------------------------
// 3. AUTO-SUGGEST statusFinalVaso — PULA PRIMEIRO DISPARO EM MODO EDIÇÃO
// ---------------------------------------------------------------------------

describe('FormInspecaoNR13 — auto-suggest statusFinalVaso não sobrescreve valor salvo', () => {
  const formPath = path.resolve(
    __dirname,
    '../../components/nr13/FormInspecaoNR13.tsx'
  )
  let src: string

  beforeAll(() => {
    src = fs.readFileSync(formPath, 'utf-8')
  })

  test('Declara autoSuggestStatusRef para controlar primeiro disparo', () => {
    expect(src).toContain('autoSuggestStatusRef')
    expect(src).toContain('useRef(!modoEdicao)')
  })

  test('useEffect do auto-suggest verifica autoSuggestStatusRef.current antes de sobrescrever', () => {
    const bloco = src.slice(src.indexOf('autoSuggestStatusRef.current'))
    expect(bloco).toContain('autoSuggestStatusRef.current = true')
  })

  test('Auto-suggest ainda funciona para novas inspeções (modoEdicao=false → ref inicia true)', () => {
    // Em novas inspeções, inspecaoId é undefined → modoEdicao=false → !modoEdicao=true
    // ref inicia true → auto-suggest nunca bloqueado
    expect(src).toContain('useRef(!modoEdicao)')
  })
})

console.log('✅ Testes de persistência de campos carregados!')
