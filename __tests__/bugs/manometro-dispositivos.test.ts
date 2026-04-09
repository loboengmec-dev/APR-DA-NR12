/**
 * Testes de regressão — Bug fixes (2026-04-09)
 *
 * 1. Foto do manômetro deve ser exibida na seção de Dispositivos de Segurança do PDF
 *    e NÃO na seção de Identificação.
 * 2. UploadFotoNR13 exporta o componente corretamente (estrutura validada).
 * 3. excluirCliente remove o registro no Supabase (lógica server action).
 */

// ---------------------------------------------------------------------------
// 1. POSIÇÃO DO MANÔMETRO NO PDF
// ---------------------------------------------------------------------------

import fs from 'fs'
import path from 'path'

describe('PDF — Manômetro na seção Dispositivos de Segurança', () => {
  const pdfPath = path.resolve(__dirname, '../../components/pdf/LaudoNR13PDF.tsx')
  let src: string

  beforeAll(() => {
    src = fs.readFileSync(pdfPath, 'utf-8')
  })

  test('Foto do manômetro NÃO aparece junto com a foto da placa (seção 1)', () => {
    // A placa de identificação aparece em um bloco antes da seção 4
    const blocoPlaca = src.indexOf("fotosUrl['placa']")
    const blocoManometroAntigo = src.indexOf("Manômetro — {d.tag}")

    // O bloco da placa deve existir
    expect(blocoPlaca).toBeGreaterThan(-1)

    // O manômetro não deve aparecer ANTES da seção 4 (dispositivos)
    const inicioSecaoDispositivos = src.indexOf('Dispositivos de Segurança — §13.5.1.2')
    expect(inicioSecaoDispositivos).toBeGreaterThan(-1)

    if (blocoManometroAntigo !== -1) {
      // Se existir, deve estar DEPOIS da seção de dispositivos
      expect(blocoManometroAntigo).toBeGreaterThan(inicioSecaoDispositivos)
    }
  })

  test('Foto do manômetro aparece na seção 4 (Dispositivos de Segurança)', () => {
    const inicioSecao4 = src.indexOf('Dispositivos de Segurança — §13.5.1.2')
    const proximaSecao = src.indexOf('5. Exame Externo e Interno')
    const blocoManometro = src.indexOf("fotosUrl['manometro']")

    expect(inicioSecao4).toBeGreaterThan(-1)
    expect(blocoManometro).toBeGreaterThan(-1)

    // Manômetro deve estar entre seção 4 e seção 5
    expect(blocoManometro).toBeGreaterThan(inicioSecao4)
    expect(blocoManometro).toBeLessThan(proximaSecao)
  })

  test('Legenda do manômetro exibe referência normativa §13.5.1.2(d)', () => {
    expect(src).toContain('§13.5.1.2(d)')
  })
})

// ---------------------------------------------------------------------------
// 2. FORMULÁRIO — MANÔMETRO MOVIDO PARA SEÇÃO DE DISPOSITIVOS
// ---------------------------------------------------------------------------

describe('Formulário — Manômetro na seção de Dispositivos de Segurança', () => {
  const formPath = path.resolve(__dirname, '../../components/nr13/FormInspecaoNR13.tsx')
  let src: string

  beforeAll(() => {
    src = fs.readFileSync(formPath, 'utf-8')
  })

  test('Upload do manômetro NÃO está mais na seção 1.1', () => {
    // O bloco antigo com label "1.1.6 Foto do Manômetro" deve ter sido removido
    expect(src).not.toContain('1.1.6 Foto do Manômetro')
  })

  test('Upload do manômetro está DEPOIS do botão "Adicionar Dispositivo"', () => {
    const posAdicionarDispositivo = src.indexOf('Adicionar Dispositivo')
    // Procura a SEGUNDA ocorrência de uploadFotoManometro (a primeira é o import)
    const primeiraOcorrencia = src.indexOf('uploadFotoManometro')
    const posManometroJSX = src.indexOf('uploadFotoManometro', primeiraOcorrencia + 1)

    expect(posAdicionarDispositivo).toBeGreaterThan(-1)
    expect(posManometroJSX).toBeGreaterThan(-1)
    expect(posManometroJSX).toBeGreaterThan(posAdicionarDispositivo)
  })

  test('Contexto do upload do manômetro menciona §13.5.1.2(d)', () => {
    expect(src).toContain('§13.5.1.2(d)')
  })
})

// ---------------------------------------------------------------------------
// 3. COMPONENTE UploadFotoNR13 — ESTRUTURA E DRAG-AND-DROP
// ---------------------------------------------------------------------------

describe('UploadFotoNR13 — componente redesenhado', () => {
  const uploadPath = path.resolve(__dirname, '../../components/nr13/UploadFotoNR13.tsx')
  let src: string

  beforeAll(() => {
    src = fs.readFileSync(uploadPath, 'utf-8')
  })

  test('Componente exporta default function', () => {
    expect(src).toContain('export default function UploadFotoNR13')
  })

  test('Suporta drag-and-drop (onDragOver, onDrop)', () => {
    expect(src).toContain('onDragOver')
    expect(src).toContain('onDrop')
    expect(src).toContain('handleDrop')
  })

  test('Input mantém capture="environment" para câmera mobile', () => {
    expect(src).toContain('capture="environment"')
  })

  test('Estado arrastando controla feedback visual', () => {
    expect(src).toContain('arrastando')
    expect(src).toContain('setArrastando')
  })

  test('Modo compacto mantido para uso em tabelas', () => {
    expect(src).toContain('compacto')
  })

  test('Exibe mensagem de erro com ícone', () => {
    expect(src).toContain('text-red-600')
    expect(src).toMatch(/erro.*&&/)
  })

  test('Preview mostra botão de remoção com ícone de lixeira', () => {
    expect(src).toContain('onPhotoDelete')
    // Verifica que há um ícone SVG de lixeira (path do ícone de lixeira)
    expect(src).toContain('8.75 1A2.75')
  })
})

// ---------------------------------------------------------------------------
// 4. EXCLUSÃO DE CLIENTE — MODAL + TOAST NA PÁGINA
// ---------------------------------------------------------------------------

describe('Página novo-cliente — exclusão com modal e toast', () => {
  const pagePath = path.resolve(
    __dirname,
    '../../app/(app)/laudos/nr13/novo-cliente/page.tsx'
  )
  let src: string

  beforeAll(() => {
    src = fs.readFileSync(pagePath, 'utf-8')
  })

  test('Importa excluirCliente da server action', () => {
    expect(src).toContain('excluirCliente')
    expect(src).toContain("from '@/lib/actions/clientes'")
  })

  test('Componente ModalConfirmarExclusao está definido na página', () => {
    expect(src).toContain('ModalConfirmarExclusao')
  })

  test('Componente Toast está definido inline', () => {
    expect(src).toContain('function Toast')
  })

  test('Estado clienteParaExcluir controla abertura do modal', () => {
    expect(src).toContain('clienteParaExcluir')
    expect(src).toContain('setClienteParaExcluir')
  })

  test('Modal tem botão cancelar e botão confirmar exclusão', () => {
    expect(src).toContain('Cancelar')
    expect(src).toContain('Excluir definitivamente')
  })

  test('Toast de sucesso exibe mensagem após exclusão', () => {
    expect(src).toContain("tipo: 'ok'")
    expect(src).toContain('excluído com sucesso')
  })

  test('Toast de erro exibe mensagem quando exclusão falha', () => {
    expect(src).toContain("tipo: 'erro'")
    expect(src).toContain('Erro ao excluir')
  })

  test('Botão de lixeira está presente na lista de clientes', () => {
    // Verifica que há um botão de excluir para cada cliente na lista
    expect(src).toContain('setClienteParaExcluir(c)')
    expect(src).toContain('aria-label')
  })

  test('Ao excluir, remove cliente da lista local sem recarregar a página', () => {
    // Verifica remoção otimista da lista local
    expect(src).toContain('prev.filter')
    expect(src).toContain('clienteParaExcluir.id')
  })

  test('Modal fecha ao clicar fora (backdrop click)', () => {
    expect(src).toContain('onClick={onCancelar}')
    expect(src).toContain('e.stopPropagation()')
  })

  test('Estado excluindo desabilita botões durante operação', () => {
    expect(src).toContain('disabled={excluindo}')
  })
})

// ---------------------------------------------------------------------------
// 5. SERVER ACTION — excluirCliente usa RLS (protegida por usuario_id)
// ---------------------------------------------------------------------------

describe('Server Action — excluirCliente segurança RLS', () => {
  const actionPath = path.resolve(__dirname, '../../lib/actions/clientes.ts')
  let src: string

  beforeAll(() => {
    src = fs.readFileSync(actionPath, 'utf-8')
  })

  test('excluirCliente filtra por usuario_id (RLS)', () => {
    const fn = src.slice(src.indexOf('export async function excluirCliente'))
    expect(fn).toContain('.eq(\'usuario_id\', user.id)')
  })

  test('excluirCliente retorna error se usuário não autenticado', () => {
    const fn = src.slice(src.indexOf('export async function excluirCliente'))
    expect(fn).toContain('Não autenticado')
  })

  test('excluirCliente chama revalidatePath para atualizar cache', () => {
    const fn = src.slice(src.indexOf('export async function excluirCliente'))
    expect(fn).toContain('revalidatePath')
  })
})

console.log('✅ Testes de regressão de bugs carregados!')
