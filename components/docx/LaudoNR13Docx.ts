/**
 * Gerador do Laudo de Inspeção de Vaso de Pressão — NR-13, em .docx nativo.
 * Substitui o antigo motor @react-pdf/renderer para este laudo: o layout do
 * Word recalcula a altura de cada elemento antes do próximo, então o
 * cabeçalho tabelado nunca sobrepõe o conteúdo (o bug do PDF não existe aqui
 * por construção). Segue o padrão editorial "memória de cálculo" do
 * escritório (Arial, cabeçalho em tabela, folha de revisão, fórmulas nativas
 * do Word com fração de verdade).
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, TableOfContents, ImageRun,
  AlignmentType, BorderStyle, WidthType, VerticalAlign, ShadingType,
  Math as DocxMath, MathRun, PageBreak, LevelFormat,
} from 'docx'
import { formulaCostadoPorNorma, formulaTampoPorNorma, type FormulaDef, type VarDef } from '@/lib/domain/nr13/pmtaFormulasDocx'
import { calcularFatorM, calcularFatorK_GBT150 } from '@/lib/domain/nr13/pmta'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export interface FotoInfo {
  buffer: Buffer
  type: 'png' | 'jpg'
  width: number
  height: number
}

// ---------------------------------------------------------------------------
// Constantes de estilo (espelham TituloMRN1/2, TextoMRN, Figura, Caption)
// ---------------------------------------------------------------------------
const FONT = 'Arial'
const BLACK = '000000'
const GRAY_BORDER = '999999'
const GRAY_SHADE = 'F2F2F2'
const CAPTION_COLOR = '44546A'

const STYLES = {
  paragraphStyles: [
    {
      // basedOn 'Heading1' + outlineLevel explícito: é o w:outlineLvl que o campo de
      // Sumário (TableOfContents) realmente varre para montar o índice — nem o
      // basedOn nem o "Heading1" embutido da lib definem isso sozinhos, então sem o
      // outlineLevel aqui o sumário fica vazio ("não carrega").
      id: 'TituloCap', name: 'Título Capítulo', basedOn: 'Heading1', next: 'TextoCorpo',
      run: { font: FONT, size: 32, bold: true, color: BLACK },
      paragraph: { spacing: { before: 320, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLACK, space: 4 } }, keepNext: true, outlineLevel: 0 },
    },
    {
      id: 'TituloSub', name: 'Título Subseção', basedOn: 'Normal', next: 'TextoCorpo',
      run: { font: FONT, size: 26, bold: true, color: BLACK },
      paragraph: { spacing: { before: 240, after: 120 }, keepNext: true },
    },
    {
      id: 'TextoCorpo', name: 'Texto Corpo', basedOn: 'Normal',
      run: { font: FONT, size: 24, color: BLACK },
      paragraph: { alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 360 } },
    },
    {
      id: 'Figura', name: 'Figura', basedOn: 'Normal',
      run: { font: FONT, size: 24 },
      paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 0, before: 120 }, keepNext: true },
    },
    {
      id: 'Legenda', name: 'Legenda', basedOn: 'Normal',
      run: { font: FONT, size: 20, italics: true, color: CAPTION_COLOR },
      paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 200 } },
    },
  ],
}

// ---------------------------------------------------------------------------
// Helpers de baixo nível
// ---------------------------------------------------------------------------
function t1(text: string): Paragraph {
  return new Paragraph({ style: 'TituloCap', children: [new TextRun(text.toUpperCase())] })
}
function t2(text: string): Paragraph {
  return new Paragraph({ style: 'TituloSub', children: [new TextRun(text)] })
}
/**
 * Parágrafo de corpo. `keepNext` gruda este parágrafo ao próximo elemento do
 * documento (tabela, figura ou outro parágrafo) — usado nos parágrafos de
 * "apresentação dos dados" que antecedem uma tabela/figura, para que o Word
 * nunca quebre a página entre o texto de contexto e o conteúdo que ele apresenta.
 */
function texto(text: string, keepNext = false): Paragraph {
  return new Paragraph({ style: 'TextoCorpo', keepNext, children: [new TextRun(text)] })
}
function bullet(text: string): Paragraph {
  return new Paragraph({ style: 'TextoCorpo', bullet: { level: 0 }, children: [new TextRun(text)] })
}

const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } as const
const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: BLACK } as const
const hairline = { style: BorderStyle.SINGLE, size: 2, color: GRAY_BORDER } as const

/** Caixa com borda preta fina (substitui os boxes do PDF) contendo campos rótulo/valor em grade de 2 colunas */
function campoGrid(pairs: Array<[string, string | number | null | undefined]>): Table {
  const rows: TableRow[] = []
  for (let i = 0; i < pairs.length; i += 2) {
    const par = [pairs[i], pairs[i + 1]]
    rows.push(new TableRow({
      children: par.map((p) => {
        if (!p) return new TableCell({ children: [new Paragraph('')], borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder } })
        const [label, value] = p
        return new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
          children: [
            new Paragraph({ children: [new TextRun({ text: label.toUpperCase(), size: 17, color: '555555' })] }),
            new Paragraph({ children: [new TextRun({ text: value != null && value !== '' ? String(value) : '—', bold: true, size: 24 })] }),
          ],
        })
      }),
    }))
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder, insideHorizontal: noBorder, insideVertical: noBorder },
    rows,
  })
}

/** Lista de checklist — rótulo à esquerda, status em negrito à direita, linha fina entre itens */
function checklistBox(items: Array<[string, string | null | undefined]>): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder, insideHorizontal: noBorder, insideVertical: noBorder },
    rows: items.map(([label, value], i) => new TableRow({
      children: [new TableCell({
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        borders: i < items.length - 1 ? { bottom: hairline, top: noBorder, left: noBorder, right: noBorder } : undefined,
        children: [new Paragraph({
          tabStops: [{ type: 'right' as any, position: 9000 }],
          children: [
            new TextRun({ text: label, size: 22 }),
            new TextRun({ text: '\t' }),
            new TextRun({ text: value ?? '—', bold: true, size: 22 }),
          ],
        })],
      })],
    })),
  })
}

/** Caixa de status única (ex: APROVADO) — borda preta, texto grande em negrito */
function statusBox(text: string): Paragraph {
  return new Paragraph({
    border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
    spacing: { before: 80, after: 200 },
    children: [new TextRun({ text: (text || '—').toUpperCase(), bold: true, size: 28 })],
    // padding interno via indent não é suportado por borda; usamos espaço no texto
  })
}

let figCount = 0
/** Imagem com legenda numerada — nunca sobrepõe texto, o Word recalcula o fluxo sozinho */
function figura(foto: FotoInfo | undefined, legenda: string, maxWidthPx = 420): (Paragraph)[] {
  if (!foto) return []
  figCount++
  const ratio = foto.height / foto.width
  const w = Math.min(maxWidthPx, 500)
  const h = Math.round(w * ratio)
  return [
    new Paragraph({
      style: 'Figura',
      children: [new ImageRun({ type: foto.type, data: foto.buffer, transformation: { width: w, height: h } })],
    }),
    new Paragraph({ style: 'Legenda', children: [new TextRun(`Figura ${figCount}: ${legenda}`)] }),
  ]
}

function tabelaDados(headers: string[], rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder, insideHorizontal: hairline, insideVertical: thinBorder },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h) => new TableCell({
          shading: { type: ShadingType.CLEAR, fill: GRAY_SHADE, color: 'auto' },
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: h.toUpperCase(), bold: true, size: 19 })] })],
        })),
      }),
      ...rows.map((r) => new TableRow({
        children: r.map((c, i) => new TableCell({
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: c, bold: i === 0, size: 21 })] })],
        })),
      })),
    ],
  })
}

/** Renderiza a fórmula + tabela de variáveis de um FormulaDef */
function blocoFormula(f: FormulaDef): (Paragraph | Table)[] {
  return [
    new Paragraph({ style: 'TituloSub', spacing: { before: 200, after: 60 }, children: [new TextRun(`${f.titulo} — ${f.ref}`)] }),
    new Paragraph({ keepNext: true, spacing: { before: 60, after: 120 }, children: [f.math] }),
    new Table({
      width: { size: 90, type: WidthType.PERCENTAGE },
      borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: hairline, insideVertical: noBorder },
      rows: f.variaveis.map((v: VarDef) => new TableRow({
        children: [
          new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, margins: { top: 60, bottom: 60 }, children: [new Paragraph({ children: [new TextRun({ text: v.simbolo, italics: true, size: 22 })] })] }),
          new TableCell({ width: { size: 58, type: WidthType.PERCENTAGE }, margins: { top: 60, bottom: 60 }, children: [new Paragraph({ children: [new TextRun({ text: v.descricao, italics: true, size: 22 })] })] }),
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, margins: { top: 60, bottom: 60 }, children: [new Paragraph({ children: [new TextRun({ text: v.valor, size: 22 })] })] }),
        ],
      })),
    }),
    new Paragraph({ text: '', spacing: { after: 160 } }),
  ]
}

// ---------------------------------------------------------------------------
// Cabeçalho tabelado (4 linhas) — repete em toda página das seções de conteúdo
// ---------------------------------------------------------------------------
function construirTabelaCabecalho(opts: {
  logo?: FotoInfo | null
  logoCliente?: FotoInfo | null
  instalacao: string
  numeroDocumento: string
  titulo: string
  engenheiro: string
}): Table {
  const logos: any[] = []
  if (opts.logo) logos.push(new ImageRun({ type: opts.logo.type, data: opts.logo.buffer, transformation: { width: 60, height: Math.round(60 * (opts.logo.height / opts.logo.width)) } }))
  if (opts.logoCliente) {
    if (logos.length) logos.push(new TextRun('   '))
    logos.push(new ImageRun({ type: opts.logoCliente.type, data: opts.logoCliente.buffer, transformation: { width: 60, height: Math.round(60 * (opts.logoCliente.height / opts.logoCliente.width)) } }))
  }

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder, insideHorizontal: thinBorder, insideVertical: thinBorder },
    rows: [
      new TableRow({ children: [
        new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER, margins: { top: 60, bottom: 60 }, children: logos.length ? [new Paragraph({ alignment: AlignmentType.CENTER, children: logos })] : [new Paragraph('')] }),
        new TableCell({ width: { size: 78, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'LAUDO DE INSPEÇÃO — NR-13', bold: true, size: 28 })] })] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ width: { size: 46, type: WidthType.PERCENTAGE }, margins: { top: 40, bottom: 40, left: 80 }, children: [
          new Paragraph({ children: [new TextRun({ text: 'INSTALAÇÃO', bold: true, size: 15 })] }),
          new Paragraph({ children: [new TextRun({ text: opts.instalacao, size: 19 })] }),
        ]}),
        new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, margins: { top: 40, bottom: 40, left: 80 }, children: [
          new Paragraph({ children: [new TextRun({ text: 'Nº', bold: true, size: 15 })] }),
          new Paragraph({ children: [new TextRun({ text: opts.numeroDocumento, size: 19 })] }),
        ]}),
        new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, margins: { top: 40, bottom: 40, left: 80 }, children: [
          new Paragraph({ children: [new TextRun({ text: 'REV.', bold: true, size: 15 })] }),
          new Paragraph({ children: [new TextRun({ text: '0', size: 19 })] }),
        ]}),
        new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, margins: { top: 40, bottom: 40, left: 80 }, children: [
          new Paragraph({ children: [new TextRun({ text: 'FOLHA', bold: true, size: 15 })] }),
          new Paragraph({ children: [new TextRun({ children: [PageNumber.CURRENT, new TextRun('/'), PageNumber.TOTAL_PAGES] as any, size: 19 })] }),
        ]}),
      ]}),
      new TableRow({ children: [new TableCell({
        columnSpan: 4, margins: { top: 40, bottom: 40, left: 80 },
        children: [
          new Paragraph({ children: [new TextRun({ text: 'TÍTULO', bold: true, size: 15 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: opts.titulo, bold: true, size: 21 })] }),
        ],
      })]}),
      new TableRow({ children: [new TableCell({
        columnSpan: 4, margins: { top: 40, bottom: 40, left: 80 },
        children: [
          new Paragraph({ children: [new TextRun({ text: 'ENGENHEIRO RESPONSÁVEL', bold: true, size: 15 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: opts.engenheiro, bold: true, size: 20 })] }),
        ],
      })]}),
    ],
  })

  return table
}

function construirCabecalho(opts: Parameters<typeof construirTabelaCabecalho>[0]): Header {
  return new Header({ children: [construirTabelaCabecalho(opts)] })
}

function construirRodape(): Footer {
  return new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
    new TextRun({ text: 'Folha ', size: 18, color: '666666' }),
    new TextRun({ children: [PageNumber.CURRENT] as any, size: 18, color: '666666' }),
    new TextRun({ text: ' de ', size: 18, color: '666666' }),
    new TextRun({ children: [PageNumber.TOTAL_PAGES] as any, size: 18, color: '666666' }),
  ]})]})
}

// ---------------------------------------------------------------------------
// GEOMETRIA — labels
// ---------------------------------------------------------------------------
const GEO_LABELS: Record<string, string> = {
  cilindrico: 'Cilíndrico', esferico: 'Esférico', elipsoidal: 'Elipsoidal 2:1',
  toriesferico: 'Torisférico (F&D)', semiesferico: 'Semiesférico', conico: 'Cônico',
}

function iniciais(nome: string | null | undefined): string {
  if (!nome) return '—'
  return nome.trim().split(/\s+/).map((p) => p[0]?.toUpperCase() ?? '').join('').slice(0, 4)
}

const fmt = (dt: string | null | undefined) => (dt ? new Date(dt + 'T00:00:00').toLocaleDateString('pt-BR') : '—')

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------------
export async function gerarLaudoNR13Docx(
  d: Record<string, any>,
  perfil: Record<string, any> | undefined,
  fotos: Record<string, FotoInfo>,
  logo?: FotoInfo | null,
  logoCliente?: FotoInfo | null,
): Promise<Buffer> {
  figCount = 0
  const engNome = d.rthNome || perfil?.nome || '—'
  const numeroDocumento = d.numeroDocumento || `RI-NR13-${new Date().getFullYear()}`
  const tituloDocumento = `LAUDO TÉCNICO DE INSPEÇÃO DE VASO DE PRESSÃO — TAG ${d.tag ?? '—'}`
  const instalacao = [d.empresaInspecionada, [d.cidadeInspecionada, d.estadoInspecionado].filter(Boolean).join('/')].filter(Boolean).join(' — ') || '—'
  const isFechado = d.ambiente === 'Fechado'
  const normaSelecionada = d._normaSelecionada ?? (d.normaCalculo === 'GBT150' ? 'GB/T 150-2011' : 'ASME Sec. VIII Div. 1')
  const engIniciais = iniciais(engNome)

  const header = construirCabecalho({ logo, logoCliente, instalacao, numeroDocumento, titulo: tituloDocumento, engenheiro: `${engNome}${d.rthCrea ? ` — CREA ${d.rthCrea}` : ''}` })
  const footer = construirRodape()

  // ---- Fórmulas do capítulo 6 ----
  // Campos numéricos chegam como STRING do formulário (register() sem valueAsNumber;
  // a coerção do Zod só roda no resolver de submit, não em watch()/getValues()).
  // Number(...) aqui evita TypeError em .toFixed() dentro de pmtaFormulasDocx.
  const numS = Number(d.materialS) || 0
  const numE = Number(d.eficienciaE) || 0
  const numD = Number(d.diametroD) || 0
  const numTCostado = Number(d.espessuraCostado) || 0
  const numTTampo = Number(d.espessuraTampo) || 0
  const RCostado = numD / 2
  const geoCostado = d.geometriaCostado || 'cilindrico'
  const geoTampo = d.geometriaTampo || 'toriesferico'
  const fCostado = formulaCostadoPorNorma(d.normaCalculo, geoCostado, { S: numS, E: numE, t: numTCostado, R: RCostado, D: numD })
  const raioAbaulamento = Number(d.raioAbaulamento) || numD
  const raioRebordo = Number(d.raioRebordo) || 0.06 * numD
  const fTampo = formulaTampoPorNorma(d.normaCalculo, geoTampo, {
    S: numS, E: numE, t: numTTampo, D: numD,
    L: raioAbaulamento,
    M: calcularFatorM(raioAbaulamento, raioRebordo),
    K: calcularFatorK_GBT150(numD, raioAbaulamento, raioRebordo),
    alphaDeg: Number(d.anguloConeDeg) || 30,
  })

  // =====================================================================
  // Seção 0 — CAPA / FOLHA DE REVISÃO (sem cabeçalho repetido)
  // =====================================================================
  const capa: (Paragraph | Table)[] = [
    construirTabelaCabecalho({ logo, logoCliente, instalacao, numeroDocumento, titulo: tituloDocumento, engenheiro: `${engNome}${d.rthCrea ? ` — CREA ${d.rthCrea}` : ''}` }),
    new Paragraph({ text: '', spacing: { after: 300 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder, insideHorizontal: thinBorder, insideVertical: thinBorder },
      rows: [
        ['1. Revisão', 'ORIGINAL'],
        ['Data', fmt(d.dataEmissaoLaudo || d.dataInspecao)],
        ['Preparado', engIniciais],
        ['Conferido', engIniciais],
        ['Aprovado', engIniciais],
      ].map(([label, value]) => new TableRow({ children: [
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: GRAY_SHADE, color: 'auto' }, margins: { top: 80, bottom: 80, left: 100 }, children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 22 })] })] }),
        new TableCell({ width: { size: 75, type: WidthType.PERCENTAGE }, margins: { top: 80, bottom: 80, left: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: value, bold: true, size: 23 })] })] }),
      ]})),
    }),
    new Paragraph({ text: '', spacing: { after: 300 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder, insideHorizontal: hairline, insideVertical: thinBorder },
      rows: [
        new TableRow({ children: [
          new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: GRAY_SHADE, color: 'auto' }, margins: { top: 60, bottom: 60, left: 80 }, children: [new Paragraph({ children: [new TextRun({ text: 'REV', bold: true, size: 19 })] })] }),
          new TableCell({ width: { size: 88, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: GRAY_SHADE, color: 'auto' }, margins: { top: 60, bottom: 60, left: 80 }, children: [new Paragraph({ children: [new TextRun({ text: 'HISTÓRICO DE REVISÕES', bold: true, size: 19 })] })] }),
        ]}),
        new TableRow({ children: [
          new TableCell({ margins: { top: 60, bottom: 60, left: 80 }, children: [new Paragraph({ children: [new TextRun({ text: '0', size: 22 })] })] }),
          new TableCell({ margins: { top: 60, bottom: 60, left: 80 }, children: [new Paragraph({ children: [new TextRun({ text: 'Emissão original', size: 22 })] })] }),
        ]}),
      ],
    }),
  ]

  // =====================================================================
  // Seção 1 — ÍNDICE + CAPÍTULOS (cabeçalho/rodapé repetem)
  // =====================================================================
  const conteudo: (Paragraph | Table)[] = [
    new Paragraph({ style: 'TituloCap', children: [new TextRun('ÍNDICE')] }),
    new TableOfContents('Índice', { hyperlink: true, headingStyleRange: '1-1' }),
    new Paragraph({ children: [new PageBreak()] }),

    // 1. OBJETIVO
    t1('1. Objetivo'),
    texto(`Este capítulo apresenta a finalidade e o escopo do presente laudo técnico, elaborado em atendimento à Norma Regulamentadora NR-13 (Portaria MTP nº 1.846/2022), que disciplina os requisitos mínimos para gestão da integridade estrutural de vasos de pressão ao longo de sua vida útil, com o objetivo de reduzir a probabilidade de ocorrência de acidentes.`),
    texto(`O presente laudo técnico tem como objetivo apresentar os resultados da inspeção de segurança realizada no vaso de pressão identificado pela TAG "${d.tag ?? '—'}", conforme os requisitos estabelecidos pela NR-13 e pelo código de projeto ${d.codigoProjeto ?? normaSelecionada}, verificando sua integridade estrutural, documentação obrigatória e condições de operação segura.`),
    texto(`O cliente contratante do serviço é ${d.empresaInspecionada ?? '—'}${(d.cidadeInspecionada || d.estadoInspecionado) ? `, localizado em ${[d.cidadeInspecionada, d.estadoInspecionado].filter(Boolean).join('/')}` : ''}. A inspeção foi realizada em ${fmt(d.dataInspecao)}, na modalidade ${d.tipoInspecao?.toLowerCase() ?? 'periódica'}.`),

    // 2. NORMAS
    t1('2. Normas Utilizadas'),
    texto('A NR-13, item §13.5.4.11, exige que o laudo de inspeção referencie explicitamente as normas e os códigos técnicos empregados na avaliação do equipamento, de modo a permitir a rastreabilidade da metodologia adotada. Relacionam-se a seguir os documentos normativos aplicados:', true),
    bullet('NR-13 — Caldeiras, Vasos de Pressão e Tubulações (Portaria MTP nº 1.846/2022)'),
    bullet(`${normaSelecionada} — Código de cálculo de PMTA`),
    bullet(`Código de Construção da Placa: ${d.codigoProjeto ?? '—'}`),

    // 3. DADOS E CLASSIFICAÇÃO
    t1('3. Dados e Classificação do Equipamento'),
    texto('Este capítulo reúne os dados de identificação do vaso, extraídos de sua placa conforme o Art. 13.5.1.3, e a classificação quanto ao risco, determinada pelo item §13.5.1.1 a partir do Grupo de Potencial de Risco (P×V) e da Classe do fluido de serviço. Essa classificação define a Categoria do vaso, da qual decorrem os intervalos de inspeção periódica exigidos pela norma.'),
    t2('3.1 Dados da Placa de Identificação — Art. 13.5.1.3'),
    texto('Seguem os dados coletados diretamente da placa de identificação fixada ao equipamento:', true),
    campoGrid([
      ['TAG', d.tag], ['Fabricante', d.fabricante],
      ['Nº de Série', d.numeroSerie], ['Ano de Fabricação', d.anoFabricacao],
      ['Tipo de Vaso', d.tipoVaso], ['Código de Projeto', d.codigoProjeto],
      ['PMTA de Fábrica', d.pmtaFabricante ? `${d.pmtaFabricante} kgf/cm²` : '—'],
      ['Ambiente de Instalação', d.ambiente],
    ]),
    ...figura(fotos['placa'], `Placa de identificação — ${d.tag ?? '—'}`, 500),
    t2('3.2 Classificação e Categorização — §13.5.1.1'),
    texto('Os parâmetros de operação e a classificação de risco resultante são apresentados a seguir:', true),
    campoGrid([
      ['Fluido de Serviço', d.fluidoServico], ['Classe do Fluido', d.fluidoClasse],
      ['Pressão de Operação', d.pressaoOperacao ? `${d.pressaoOperacao} kgf/cm²` : '—'],
      ['Volume', d.volume ? `${d.volume} m³` : '—'],
      ['Grupo P×V', d.grupoPV], ['Categoria do Vaso', d.categoriaVaso],
    ]),

    // 4. CHECKLIST
    t1('4. Checklist Documental e de Segurança'),
    texto('A NR-13 condiciona a operação regular do vaso à existência de documentação obrigatória (item §13.5.1.5) e ao atendimento de requisitos de acessibilidade e segurança no local de instalação (item §13.5.2). A ausência ou desatualização desses itens compromete a rastreabilidade do histórico do equipamento e, em alguns casos, configura risco à integridade física dos envolvidos na operação e manutenção.'),
    t2('4.1 Checklist Documental — §13.5.1.5'),
    texto('O quadro a seguir apresenta a situação de cada documento obrigatório verificado durante a inspeção:', true),
    checklistBox([
      ['Prontuário do Vaso', d.prontuario],
      ['Registro de Segurança — §13.5.1.7', d.registroSeguranca],
      ['Projeto de Instalação', d.projetoInstalacao],
      ['Relatórios de Inspeção Anteriores', d.relatoriosAnteriores],
      ['Placa de Identificação', d.placaIdentificacao],
      ['Certificados dos Dispositivos de Segurança', d.certificadosDispositivos],
      ['Manual de Operação em Português', d.manualOperacao],
    ]),
    t2(`4.2 Segurança no Trabalho — Acessibilidade (${isFechado ? 'Ambiente Fechado — §13.5.2.2' : 'Ambiente Aberto — §13.5.2.3'})`),
    texto('Verificação das condições de acessibilidade e segurança do local de instalação do vaso:', true),
    checklistBox(isFechado ? [
      ['Drenos, respiros, bocas de visita e indicadores acessíveis — Art. 13.5.2.1', d.segDrenosRespirosBV],
      ['Adequação a normas de segurança, saúde e meio ambiente — Art. 13.5.2.4', d.segAspNormativosGerais],
      ['Mínimo de 2 saídas amplas e seguras', d.segDuasSaidasAmbFechado],
      ['Acesso fácil para manutenção e inspeção', d.segAcessoManutencao],
      ['Ventilação permanente com entradas não bloqueáveis', d.segVentilacaoPermanente],
      ['Iluminação conforme normas vigentes', d.segIluminacaoFechado],
      ['Iluminação de emergência', d.segIluminacaoEmergenciaFechado],
    ] : [
      ['Drenos, respiros, bocas de visita e indicadores acessíveis — Art. 13.5.2.1', d.segDrenosRespirosBV],
      ['Adequação a normas de segurança, saúde e meio ambiente — Art. 13.5.2.4', d.segAspNormativosGerais],
      ['Saídas amplas, desobstruídas e sinalizadas', d.segSaidasAmbAberto],
      ['Acesso seguro para manutenção e inspeção', d.segAcessoAmbAberto],
      ['Iluminação conforme normas vigentes', d.segIluminacaoAberto],
      ['Iluminação de emergência (se aplicável)', d.segIluminacaoEmergenciaAberto],
    ]),

    // 5. DISPOSITIVOS
    t1('5. Dispositivos de Segurança — §13.5.1.2'),
    texto('Os dispositivos de segurança (válvulas de segurança/alívio e demais instrumentos de proteção contra sobrepressão) são o último nível de proteção do vaso contra falha estrutural. A ausência ou o bloqueio desses dispositivos configura Grave e Iminente Risco, conforme Art. 13.3.1, alíneas (a) e (c) da NR-13, exigindo interdição imediata do equipamento.'),
    texto('Relacionam-se a seguir os dispositivos de segurança identificados e inspecionados no vaso:', true),
    ...(d.dispositivosSeguranca?.length ? [tabelaDados(
      ['TAG', 'Tipo', 'P. Ajuste (kgf/cm²)', 'Últ. Teste', 'Situação'],
      d.dispositivosSeguranca.map((disp: any) => [disp.tag ?? '—', disp.tipo ?? '—', String(disp.pressaoAjusteKpa ?? '—'), disp.ultimoTeste ? fmt(disp.ultimoTeste) : '—', disp.situacao ?? '—']),
    ), new Paragraph({ text: '', spacing: { after: 160 } })] : [texto('Nenhum dispositivo de segurança foi identificado no equipamento — ver Não Conformidades, capítulo 9.')]),
    ...(d.dispositivosSeguranca ?? []).flatMap((disp: any, i: number) => figura(fotos[`dispositivo_${i}`], `${disp.tag ?? 'Dispositivo'} — ${disp.tipo ?? ''}`, 300)),
    ...(fotos['manometro'] ? [t2('5.1 Indicador de Pressão — Manômetro (§13.5.1.2(d))'), ...figura(fotos['manometro'], `Manômetro — ${d.tag ?? '—'}`, 300)] : []),

    // 6. MEMÓRIA DE CÁLCULO
    new Paragraph({ children: [new PageBreak()] }),
    t1(`6. Memória de Cálculo — PMTA (${normaSelecionada})`),
    texto(`A determinação da Pressão Máxima de Trabalho Admissível (PMTA) é o núcleo técnico da avaliação estrutural exigida pela NR-13, pois estabelece o limite seguro de operação do vaso a partir das espessuras efetivamente medidas — e não apenas das espessuras nominais de projeto. Este capítulo apresenta a metodologia de cálculo conforme ${normaSelecionada}, aplicada ao costado e ao tampo do vaso, com base nos parâmetros geométricos e de material levantados em campo.`),
    ...blocoFormula(fCostado),
    ...blocoFormula(fTampo),
    t2('6.1 Resultado — PMTA Calculada'),
    texto('A PMTA efetiva do vaso é limitada pelo componente estruturalmente mais frágil entre o costado e o tampo, conforme resumido a seguir:', true),
    campoGrid([
      ['PMTA do Costado', d._pmtaCostado != null ? `${Number(d._pmtaCostado).toFixed(2)} kgf/cm²` : '—'],
      ['PMTA do Tampo', d._pmtaTampo != null ? `${Number(d._pmtaTampo).toFixed(2)} kgf/cm²` : '—'],
      ['Componente Limitante', d._componenteFragil],
      ['PMTA Efetiva (Limitante)', d._pmtaLimitante != null ? `${Number(d._pmtaLimitante).toFixed(2)} kgf/cm²` : '—'],
    ]),
    texto(
      d._pmtaLimitante != null && d.psvCalibracao != null
        ? (d._condena
          ? `ATENÇÃO: a PSV calibrada (${Number(d.psvCalibracao).toFixed(2)} kgf/cm²) EXCEDE a PMTA limitante — downgrade necessário conforme §13.4.1.`
          : 'PSV calibrada dentro do limite admissível — condição conforme.')
        : '',
    ),

    // 7. EXAME EXTERNO
    new Paragraph({ children: [new PageBreak()] }),
    t1('7. Exame Externo — Registros Fotográficos (§13.3.4)'),
    texto('O exame externo, previsto no item §13.3.4 da NR-13, consiste na inspeção visual da superfície externa do vaso, seus suportes, conexões e acessórios, em busca de indícios de corrosão, deformação, vazamento ou outra anomalia que comprometa a integridade estrutural do equipamento. O resultado consolidado e os registros fotográficos que evidenciam as condições observadas são apresentados a seguir.'),
    texto('Resultado do Exame Externo:', true),
    statusBox(d.exameExterno ?? '—'),
    ...Array.from({ length: 6 }).flatMap((_, i) => figura(fotos[`exame_${i}`], `Registro fotográfico da inspeção — TAG ${d.tag ?? '—'}`, 400)),

    // 8. MEDIÇÕES
    t1('8. Medições de Espessura — §13.5.4.11(d)'),
    texto('O monitoramento da espessura das partes pressurizadas, exigido pelo item §13.5.4.11(d) da NR-13, permite quantificar a taxa de corrosão do equipamento ao longo do tempo e é o dado de entrada essencial para o recálculo da PMTA apresentado no capítulo 6. A tabela a seguir relaciona os pontos de medição ultrassônica realizados durante a inspeção:', true),
    ...(d.medicoesEspessura?.length ? [tabelaDados(
      ['Ponto', 'Esp. Orig. (mm)', 'Esp. Medida (mm)', 'Esp. Mín. Adm. (mm)', 'Situação'],
      d.medicoesEspessura.map((m: any) => [m.ponto ?? '—', String(m.espOriginal ?? 'N/D'), String(m.espMedida ?? '—'), String(m.espMinAdm ?? 'N/D'), m.situacao ?? '—']),
    ), new Paragraph({ text: '', spacing: { after: 160 } })] : []),
    ...(d.medicoesEspessura ?? []).flatMap((m: any, i: number) => figura(fotos[`medicao_${i}`], `Medição de espessura — Ponto ${m.ponto ?? i + 1}`, 300)),

    // 9. NÃO CONFORMIDADES
    new Paragraph({ children: [new PageBreak()] }),
    t1('9. Não Conformidades — §13.5.4.11(j)'),
    texto('Nos termos do item §13.5.4.11(j) da NR-13, o laudo de inspeção deve relacionar as não conformidades identificadas, com a respectiva referência normativa, o grau de risco associado e o prazo para a ação corretiva. As não conformidades constatadas durante a presente inspeção são detalhadas a seguir.'),
    ...((!d.naoConformidades || d.naoConformidades.length === 0)
      ? [texto('Nenhuma não conformidade identificada durante a inspeção.')]
      : d.naoConformidades.flatMap((nc: any, i: number) => [
        new Paragraph({ style: 'TituloSub', spacing: { before: 160, after: 40 }, children: [new TextRun(`NC ${String(i + 1).padStart(2, '0')} — ${nc.descricao ?? 'Sem descrição'}`)] }),
        texto(`Ref. NR-13: ${nc.refNR13 ?? '—'}   ·   Grau de Risco: ${nc.grauRisco ?? '—'}   ·   Prazo: ${nc.prazo ? `${nc.prazo} dias` : '—'}`),
        ...(nc.acaoCorretiva ? [texto(`Ação Corretiva: ${nc.acaoCorretiva}`)] : []),
        texto(`Responsável: ${nc.responsavel ?? '—'}`),
        ...figura(fotos[`nc_${i}`], nc.descricao ?? `Não conformidade ${i + 1}`, 300),
      ])),

    // 10. PARECER
    new Paragraph({ children: [new PageBreak()] }),
    t1('10. Parecer Técnico e Conclusão — §13.5.4.11'),
    texto('Este capítulo consolida o parecer conclusivo do Profissional Legalmente Habilitado (PLH) sobre a integridade do vaso, conforme exigido pelo item §13.5.4.11 da NR-13, definindo a condição de operação do equipamento e o cronograma das próximas inspeções periódicas obrigatórias, calculado a partir da Categoria do vaso (Tabela 2 da norma).'),
    texto('Condição do Vaso:', true),
    statusBox(d.statusFinalVaso ?? '—'),
    texto('Dados complementares do parecer e cronograma de inspeções futuras:', true),
    campoGrid([
      ['PMTA Fixada pelo PLH', d.pmtaFixadaPLH ? `${d.pmtaFixadaPLH} kgf/cm²` : '—'],
      ['Próxima Inspeção Externa', fmt(d.proximaInspecaoExterna)],
      ['Próxima Inspeção Interna', fmt(d.proximaInspecaoInterna)],
      ['Próximo Teste de Dispositivos', fmt(d.dataProximoTesteDispositivos)],
    ]),
    ...(d.parecerTecnico ? [t2('Parecer do Profissional Legalmente Habilitado (PLH)'), texto(d.parecerTecnico)] : []),
    new Paragraph({ text: '', spacing: { before: 400 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLACK } }, spacing: { before: 200 }, children: [new TextRun('')] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: engNome, bold: true, size: 23 })] }),
    ...(d.rthProfissao ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: d.rthProfissao, size: 20 })] })] : []),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `CREA: ${d.rthCrea ?? '—'}`, size: 20 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Profissional Legalmente Habilitado — Responsável Técnico pela Inspeção NR-13', size: 19 })] }),
  ]

  const doc = new Document({
    creator: engNome,
    title: `Laudo NR-13 — ${d.tag ?? 'Vaso de Pressão'}`,
    features: { updateFields: true },
    styles: STYLES,
    sections: [
      {
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 567, bottom: 567, left: 1418, right: 567 } } },
        children: capa,
      },
      {
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1843, bottom: 567, left: 1418, right: 567, header: 283, footer: 510 } } },
        headers: { default: header },
        footers: { default: footer },
        children: conteudo,
      },
    ],
  })

  return Packer.toBuffer(doc)
}
