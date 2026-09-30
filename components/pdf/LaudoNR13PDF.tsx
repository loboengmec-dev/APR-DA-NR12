/**
 * Relatório de Inspeção de Vaso de Pressão — NR-13 (ASME Sec VIII Div 1 / GB/T 150)
 * Layout editorial "memória de cálculo" — cabeçalho tabelado fixo, folha de
 * revisão, índice e capítulos numerados, 100% preto e branco.
 * Totalmente isolado do módulo NR-12.
 */
import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PDFImage,
} from '@react-pdf/renderer'

// ---------------------------------------------------------------------------
// Paleta — 100% preto e branco (padrão editorial de memória de cálculo)
// ---------------------------------------------------------------------------
const C = {
  black: '#000000',
  white: '#ffffff',
  grayBg: '#f2f2f2',
}

// ---------------------------------------------------------------------------
// Stylesheet
// ---------------------------------------------------------------------------
const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', fontSize: 9, color: C.black, backgroundColor: C.white,
    paddingTop: 148, paddingBottom: 30, paddingHorizontal: 30,
  },
  body: {},

  // ---- Cabeçalho tabelado fixo (repete em toda página) ----
  hdrBox: {
    position: 'absolute', top: 18, left: 30, right: 30,
    borderWidth: 1, borderColor: C.black,
  },
  hdrRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.black },
  hdrRowLast: { flexDirection: 'row' },
  hdrCellLogo: {
    width: 130, borderRightWidth: 1, borderRightColor: C.black,
    padding: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  hdrCellDocType: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 6 },
  hdrDocTypeText: { fontSize: 13, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  hdrCellInstal: { flex: 2.1, borderRightWidth: 1, borderRightColor: C.black, padding: 5, justifyContent: 'center' },
  hdrCellNum: { flex: 1.3, borderRightWidth: 1, borderRightColor: C.black, padding: 5, justifyContent: 'center' },
  hdrCellRev: { flex: 0.6, borderRightWidth: 1, borderRightColor: C.black, padding: 5, alignItems: 'center', justifyContent: 'center' },
  hdrCellFolha: { flex: 0.9, padding: 5, alignItems: 'center', justifyContent: 'center' },
  hdrLabel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  hdrValue: { fontSize: 8, marginTop: 1 },
  hdrValueCenter: { fontSize: 8, marginTop: 1, textAlign: 'center' },
  hdrTituloBox: { padding: 6, borderBottomWidth: 1, borderBottomColor: C.black },
  hdrTituloLabel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  hdrTituloValue: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginTop: 2, lineHeight: 1.3 },
  hdrEngBox: { padding: 6 },
  hdrEngLabel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  hdrEngValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginTop: 2 },
  hdrLogoImg: { height: 26, maxWidth: 56, objectFit: 'contain' },

  // ---- Tipografia de capítulos ----
  chapterTitle: {
    fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 4, marginBottom: 10,
    borderBottomWidth: 1.5, borderBottomColor: C.black, paddingBottom: 4,
  },
  subTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginTop: 10, marginBottom: 6 },
  p: { fontSize: 9, lineHeight: 1.6, marginBottom: 8, textAlign: 'justify' },
  bullet: { flexDirection: 'row', marginBottom: 4 },
  bulletDot: { fontSize: 9, width: 12 },
  bulletText: { fontSize: 9, flex: 1, lineHeight: 1.5 },

  // ---- Boxes com borda simples (substitui os "cards" coloridos) ----
  box: { borderWidth: 1, borderColor: C.black, padding: 10, marginBottom: 12 },

  // ---- Grade de campos rótulo/valor ----
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  fieldItem: { minWidth: '42%', marginBottom: 6 },
  fieldLabel: { fontSize: 7, textTransform: 'uppercase', color: '#333333' },
  fieldValue: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginTop: 1 },

  // ---- Tabelas ----
  tHeader: { flexDirection: 'row', borderWidth: 1, borderColor: C.black, backgroundColor: C.grayBg },
  tHdrCell: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', padding: 4, textTransform: 'uppercase' },
  tRow: { flexDirection: 'row', borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: C.black },
  tCell: { fontSize: 8, padding: 4 },

  // ---- Checklist (linha rótulo + status, sem cor) ----
  checkRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 0.75, borderBottomColor: '#999999', paddingVertical: 4 },
  checkLabel: { fontSize: 8.5, flex: 1, paddingRight: 8 },
  checkValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },

  // ---- Status em caixa (substitui badge colorido) ----
  statusBox: { borderWidth: 1, borderColor: C.black, paddingVertical: 5, paddingHorizontal: 10, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },

  // ---- Figuras ----
  figureBox: { borderWidth: 1, borderColor: C.black, marginBottom: 4 },
  figureImg: { width: '100%', objectFit: 'contain', backgroundColor: C.white },
  figureCaption: { fontSize: 8, fontFamily: 'Helvetica-Oblique', textAlign: 'center', marginBottom: 14, marginTop: 3 },

  // ---- Capa / Folha de revisão ----
  revTable: { borderWidth: 1, borderColor: C.black, marginTop: 16 },
  revRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.black },
  revRowLast: { flexDirection: 'row' },
  revLabelCell: { width: 110, borderRightWidth: 1, borderRightColor: C.black, padding: 6, justifyContent: 'center', backgroundColor: C.grayBg },
  revLabelText: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  revValCell: { flex: 1, borderRightWidth: 1, borderRightColor: C.black, padding: 6, alignItems: 'center', justifyContent: 'center' },
  revValCellLast: { flex: 1, padding: 6, alignItems: 'center', justifyContent: 'center' },
  revValText: { fontSize: 9, fontFamily: 'Helvetica-Bold' },

  histTable: { borderWidth: 1, borderColor: C.black, marginTop: 16 },
  histHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.black, backgroundColor: C.grayBg },
  histRow: { flexDirection: 'row', borderBottomWidth: 0.75, borderBottomColor: '#999999' },
  histRevCell: { width: 40, borderRightWidth: 1, borderRightColor: C.black, padding: 6, alignItems: 'center' },
  histDescCell: { flex: 1, padding: 6 },
  histHdrText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  histText: { fontSize: 8.5 },

  // ---- Índice ----
  tocRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 9 },
  tocNum: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', width: 20 },
  tocTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold' },

  // ---- Assinatura ----
  sigBox: { marginTop: 34, alignItems: 'center' },
  sigLine: { borderTopWidth: 1, borderTopColor: C.black, width: 220, marginBottom: 4 },
  sigName: { fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  sigSub: { fontSize: 8, textAlign: 'center', marginTop: 1 },
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function calcImageHeight(
  dims: { width: number; height: number } | undefined,
  containerWidth: number,
  maxHeight: number = 320
): number {
  if (!dims) return 180
  const ratio = dims.height / dims.width
  return Math.min(containerWidth * ratio, maxHeight)
}

function iniciais(nome: string | null | undefined): string {
  if (!nome) return '—'
  return nome.trim().split(/\s+/).map(p => p[0]?.toUpperCase() ?? '').join('').slice(0, 4)
}

const GEO_LABELS: Record<string, string> = {
  cilindrico: 'Cilíndrico',
  esferico: 'Esférico',
  elipsoidal: 'Elipsoidal 2:1',
  toriesferico: 'Torisférico (F&D)',
  semiesferico: 'Semiesférico',
  conico: 'Cônico',
}

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------------
interface LaudoNR13PDFProps {
  dados: Record<string, any>
  perfil?: Record<string, any>
  fotosUrl?: Record<string, string>
  fotoDimensoes?: Record<string, { width: number; height: number }>
}

export default function LaudoNR13PDF({ dados, perfil, fotosUrl = {}, fotoDimensoes = {} }: LaudoNR13PDFProps) {
  const d = dados ?? {}
  const fmt = (dt: string | null | undefined) => dt ? new Date(dt + 'T00:00:00').toLocaleDateString('pt-BR') : '—'

  const logoUrl: string | null = perfil?._logoPublicUrl ?? null
  const logoClienteUrl: string | null = fotosUrl['logoCliente'] ?? null

  const numeroDocumento = d.numeroDocumento || `RI-NR13-${new Date().getFullYear()}`
  const engNome = d.rthNome || perfil?.nome || '—'
  const engIniciais = iniciais(engNome)
  const tituloDocumento = `LAUDO TÉCNICO DE INSPEÇÃO DE VASO DE PRESSÃO — TAG ${d.tag ?? '—'}`
  const instalacaoTexto = [d.empresaInspecionada, [d.cidadeInspecionada, d.estadoInspecionado].filter(Boolean).join('/')]
    .filter(Boolean).join(' — ') || '—'

  // Contador de figuras — numeração sequencial única no documento inteiro
  let figCount = 0
  const nextFig = () => ++figCount

  // ---- Cabeçalho tabelado, fixo em toda página ----
  const DocHeader = () => (
    <View style={S.hdrBox} fixed>
      {/* Linha 1 — logo(s) + tipo de documento */}
      <View style={S.hdrRow}>
        {(logoUrl || logoClienteUrl) && (
          <View style={S.hdrCellLogo}>
            {logoUrl ? <PDFImage src={logoUrl} style={S.hdrLogoImg} /> : null}
            {logoClienteUrl ? <PDFImage src={logoClienteUrl} style={S.hdrLogoImg} /> : null}
          </View>
        )}
        <View style={S.hdrCellDocType}>
          <Text style={S.hdrDocTypeText}>LAUDO DE INSPEÇÃO — NR-13</Text>
        </View>
      </View>
      {/* Linha 2 — instalação | nº | rev | folha */}
      <View style={S.hdrRow}>
        <View style={S.hdrCellInstal}>
          <Text style={S.hdrLabel}>Instalação</Text>
          <Text style={S.hdrValue}>{instalacaoTexto}</Text>
        </View>
        <View style={S.hdrCellNum}>
          <Text style={S.hdrLabel}>Nº</Text>
          <Text style={S.hdrValue}>{numeroDocumento}</Text>
        </View>
        <View style={S.hdrCellRev}>
          <Text style={S.hdrLabel}>Rev.</Text>
          <Text style={S.hdrValueCenter}>0</Text>
        </View>
        <View style={S.hdrCellFolha}>
          <Text style={S.hdrLabel}>Folha</Text>
          <Text style={S.hdrValueCenter} render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`} />
        </View>
      </View>
      {/* Linha 3 — título */}
      <View style={S.hdrTituloBox}>
        <Text style={S.hdrTituloLabel}>Título</Text>
        <Text style={S.hdrTituloValue}>{tituloDocumento}</Text>
      </View>
      {/* Linha 4 — engenheiro responsável */}
      <View style={S.hdrEngBox}>
        <Text style={S.hdrEngLabel}>Engenheiro Responsável</Text>
        <Text style={S.hdrEngValue}>
          {engNome}{d.rthCrea ? ` — CREA ${d.rthCrea}` : ''}
        </Text>
      </View>
    </View>
  )

  // ---- Campo rótulo/valor reutilizável ----
  const Campo = ({ label, value }: { label: string; value: any }) => (
    <View style={S.fieldItem}>
      <Text style={S.fieldLabel}>{label}</Text>
      <Text style={S.fieldValue}>{value ?? '—'}</Text>
    </View>
  )

  // ---- Linha de checklist (sem cor — apenas rótulo + status em negrito) ----
  const CheckRow = ({ label, value }: { label: string; value: any }) => (
    <View style={S.checkRow}>
      <Text style={S.checkLabel}>{label}</Text>
      <Text style={S.checkValue}>{value ?? '—'}</Text>
    </View>
  )

  // ---- Figura com legenda numerada ----
  const Figura = ({ url, legenda, dims, width = 240, maxH = 260 }: { url: string; legenda: string; dims?: { width: number; height: number }; width?: number; maxH?: number }) => {
    const n = nextFig()
    return (
      <View wrap={false} style={{ marginBottom: 4 }}>
        <View style={S.figureBox}>
          <PDFImage src={url} style={[S.figureImg, { height: calcImageHeight(dims, width, maxH) }]} />
        </View>
        <Text style={S.figureCaption}>Figura {n}: {legenda}</Text>
      </View>
    )
  }

  const isFechado = d.ambiente === 'Fechado'
  const normaSelecionada = d._normaSelecionada ?? (d.normaCalculo === 'GBT150' ? 'GB/T 150-2011' : 'ASME Sec. VIII Div. 1')

  // =====================================================================
  return (
    <Document title={`Laudo NR-13 — ${d.tag ?? 'Vaso de Pressão'}`} author={engNome}>

      {/* ======================== CAPA / FOLHA DE REVISÃO ======================== */}
      <Page size="A4" style={S.page}>
        <DocHeader />
        <View>
          <View style={S.revTable}>
            <View style={S.revRow}>
              <View style={S.revLabelCell}><Text style={S.revLabelText}>1. Revisão</Text></View>
              <View style={S.revValCellLast}><Text style={S.revValText}>ORIGINAL</Text></View>
            </View>
            <View style={S.revRow}>
              <View style={S.revLabelCell}><Text style={S.revLabelText}>Data</Text></View>
              <View style={S.revValCellLast}><Text style={S.revValText}>{fmt(d.dataEmissaoLaudo || d.dataInspecao).toUpperCase()}</Text></View>
            </View>
            <View style={S.revRow}>
              <View style={S.revLabelCell}><Text style={S.revLabelText}>Preparado</Text></View>
              <View style={S.revValCellLast}><Text style={S.revValText}>{engIniciais}</Text></View>
            </View>
            <View style={S.revRow}>
              <View style={S.revLabelCell}><Text style={S.revLabelText}>Conferido</Text></View>
              <View style={S.revValCellLast}><Text style={S.revValText}>{engIniciais}</Text></View>
            </View>
            <View style={S.revRowLast}>
              <View style={S.revLabelCell}><Text style={S.revLabelText}>Aprovado</Text></View>
              <View style={S.revValCellLast}><Text style={S.revValText}>{engIniciais}</Text></View>
            </View>
          </View>

          <View style={S.histTable}>
            <View style={S.histHeaderRow}>
              <View style={S.histRevCell}><Text style={S.histHdrText}>Rev</Text></View>
              <View style={S.histDescCell}><Text style={S.histHdrText}>Histórico de Revisões</Text></View>
            </View>
            <View style={S.histRow}>
              <View style={S.histRevCell}><Text style={S.histText}>0</Text></View>
              <View style={S.histDescCell}><Text style={S.histText}>Emissão original</Text></View>
            </View>
          </View>
        </View>
      </Page>

      {/* ======================== ÍNDICE ======================== */}
      <Page size="A4" style={S.page}>
        <DocHeader />
        <View>
          <Text style={S.chapterTitle}>ÍNDICE</Text>
          {[
            '1. OBJETIVO',
            '2. NORMAS UTILIZADAS',
            '3. DADOS E CLASSIFICAÇÃO DO EQUIPAMENTO',
            '4. CHECKLIST DOCUMENTAL E DE SEGURANÇA',
            '5. DISPOSITIVOS DE SEGURANÇA',
            '6. MEMÓRIA DE CÁLCULO — PMTA',
            '7. EXAME EXTERNO — REGISTROS FOTOGRÁFICOS',
            '8. MEDIÇÕES DE ESPESSURA',
            '9. NÃO CONFORMIDADES',
            '10. PARECER TÉCNICO E CONCLUSÃO',
          ].map((item) => {
            const [num, ...rest] = item.split('. ')
            return (
              <View key={item} style={S.tocRow}>
                <Text style={S.tocNum}>{num}.</Text>
                <Text style={S.tocTitle}>{rest.join('. ')}</Text>
              </View>
            )
          })}
        </View>
      </Page>

      {/* ======================== CAP. 1-4 ======================== */}
      <Page size="A4" style={S.page}>
        <DocHeader />
        <View>

          <Text style={S.chapterTitle}>1. OBJETIVO</Text>
          <Text style={S.p}>
            O presente laudo técnico tem como objetivo apresentar os resultados da inspeção de
            segurança realizada no vaso de pressão identificado pela TAG "{d.tag ?? '—'}", conforme os
            requisitos estabelecidos pela Norma Regulamentadora NR-13 (Portaria MTP nº 1.846/2022) e
            pelo código de projeto {d.codigoProjeto ?? normaSelecionada}, verificando sua integridade
            estrutural, documentação obrigatória e condições de operação segura.
          </Text>
          <Text style={S.p}>
            O cliente contratante do serviço é {d.empresaInspecionada ?? '—'}
            {(d.cidadeInspecionada || d.estadoInspecionado) ? `, localizado em ${[d.cidadeInspecionada, d.estadoInspecionado].filter(Boolean).join('/')}` : ''}.
            A inspeção foi realizada em {fmt(d.dataInspecao)}, na modalidade {d.tipoInspecao?.toLowerCase() ?? 'periódica'}.
          </Text>

          <Text style={S.chapterTitle}>2. NORMAS UTILIZADAS</Text>
          <View style={{ marginBottom: 12 }}>
            <View style={S.bullet}><Text style={S.bulletDot}>•</Text><Text style={S.bulletText}>NR-13 — Caldeiras, Vasos de Pressão e Tubulações (Portaria MTP nº 1.846/2022)</Text></View>
            <View style={S.bullet}><Text style={S.bulletDot}>•</Text><Text style={S.bulletText}>{normaSelecionada} — Código de cálculo de PMTA</Text></View>
            <View style={S.bullet}><Text style={S.bulletDot}>•</Text><Text style={S.bulletText}>Código de Construção da Placa: {d.codigoProjeto ?? '—'}</Text></View>
          </View>

          <Text style={S.chapterTitle}>3. DADOS E CLASSIFICAÇÃO DO EQUIPAMENTO</Text>
          <Text style={S.subTitle}>3.1 Dados da Placa de Identificação — Art. 13.5.1.3</Text>
          <View style={S.box} wrap={false}>
            <View style={S.fieldGrid}>
              <Campo label="TAG" value={d.tag} />
              <Campo label="Fabricante" value={d.fabricante} />
              <Campo label="Nº de Série" value={d.numeroSerie} />
              <Campo label="Ano de Fabricação" value={d.anoFabricacao} />
              <Campo label="Tipo de Vaso" value={d.tipoVaso} />
              <Campo label="Código de Projeto" value={d.codigoProjeto} />
              <Campo label="PMTA de Fábrica" value={d.pmtaFabricante ? `${d.pmtaFabricante} kgf/cm²` : '—'} />
              <Campo label="Ambiente de Instalação" value={d.ambiente} />
            </View>
          </View>

          {fotosUrl['placa'] ? (
            <Figura url={fotosUrl['placa']} legenda={`Placa de identificação — ${d.tag ?? '—'}`} dims={fotoDimensoes['placa']} width={400} maxH={220} />
          ) : null}

          <Text style={S.subTitle}>3.2 Classificação e Categorização — §13.5.1.1</Text>
          <View style={S.box} wrap={false}>
            <View style={S.fieldGrid}>
              <Campo label="Fluido de Serviço" value={d.fluidoServico} />
              <Campo label="Classe do Fluido" value={d.fluidoClasse} />
              <Campo label="Pressão de Operação" value={d.pressaoOperacao ? `${d.pressaoOperacao} kgf/cm²` : '—'} />
              <Campo label="Volume" value={d.volume ? `${d.volume} m³` : '—'} />
              <Campo label="Grupo P×V" value={d.grupoPV} />
              <Campo label="Categoria do Vaso" value={d.categoriaVaso} />
            </View>
          </View>
        </View>
      </Page>

      {/* ======================== CAP. 4 (cont.) — CHECKLIST ======================== */}
      <Page size="A4" style={S.page}>
        <DocHeader />
        <View>
          <Text style={S.chapterTitle}>4. CHECKLIST DOCUMENTAL E DE SEGURANÇA</Text>

          <Text style={S.subTitle}>4.1 Checklist Documental — §13.5.1.5</Text>
          <View style={S.box} wrap={false}>
            <CheckRow label="Prontuário do Vaso" value={d.prontuario} />
            <CheckRow label="Registro de Segurança — §13.5.1.7" value={d.registroSeguranca} />
            <CheckRow label="Projeto de Instalação" value={d.projetoInstalacao} />
            <CheckRow label="Relatórios de Inspeção Anteriores" value={d.relatoriosAnteriores} />
            <CheckRow label="Placa de Identificação" value={d.placaIdentificacao} />
            <CheckRow label="Certificados dos Dispositivos de Segurança" value={d.certificadosDispositivos} />
            <CheckRow label="Manual de Operação em Português" value={d.manualOperacao} />
          </View>

          <Text style={S.subTitle}>
            4.2 Segurança no Trabalho — Acessibilidade {isFechado ? '(Ambiente Fechado — §13.5.2.2)' : '(Ambiente Aberto — §13.5.2.3)'}
          </Text>
          <View style={S.box} wrap={false}>
            <CheckRow label="Drenos, respiros, bocas de visita e indicadores acessíveis — Art. 13.5.2.1" value={d.segDrenosRespirosBV} />
            <CheckRow label="Adequação a normas de segurança, saúde e meio ambiente — Art. 13.5.2.4" value={d.segAspNormativosGerais} />
            {isFechado ? (
              <>
                <CheckRow label="Mínimo de 2 saídas amplas e seguras" value={d.segDuasSaidasAmbFechado} />
                <CheckRow label="Acesso fácil para manutenção e inspeção" value={d.segAcessoManutencao} />
                <CheckRow label="Ventilação permanente com entradas não bloqueáveis" value={d.segVentilacaoPermanente} />
                <CheckRow label="Iluminação conforme normas vigentes" value={d.segIluminacaoFechado} />
                <CheckRow label="Iluminação de emergência" value={d.segIluminacaoEmergenciaFechado} />
              </>
            ) : (
              <>
                <CheckRow label="Saídas amplas, desobstruídas e sinalizadas" value={d.segSaidasAmbAberto} />
                <CheckRow label="Acesso seguro para manutenção e inspeção" value={d.segAcessoAmbAberto} />
                <CheckRow label="Iluminação conforme normas vigentes" value={d.segIluminacaoAberto} />
                <CheckRow label="Iluminação de emergência (se aplicável)" value={d.segIluminacaoEmergenciaAberto} />
              </>
            )}
          </View>
        </View>
      </Page>

      {/* ======================== CAP. 5 — DISPOSITIVOS DE SEGURANÇA ======================== */}
      <Page size="A4" style={S.page}>
        <DocHeader />
        <View>
          <Text style={S.chapterTitle}>5. DISPOSITIVOS DE SEGURANÇA — §13.5.1.2</Text>
          <Text style={S.p}>
            A ausência ou o bloqueio de dispositivos de segurança configura Grave e Iminente Risco,
            conforme Art. 13.3.1, alíneas (a) e (c) da NR-13.
          </Text>

          {(d.dispositivosSeguranca ?? []).length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <View style={S.tHeader}>
                <Text style={[S.tHdrCell, { width: 80 }]}>TAG</Text>
                <Text style={[S.tHdrCell, { width: 55 }]}>Tipo</Text>
                <Text style={[S.tHdrCell, { width: 100 }]}>P. Ajuste (kgf/cm²)</Text>
                <Text style={[S.tHdrCell, { width: 90 }]}>Últ. Teste</Text>
                <Text style={[S.tHdrCell, { flex: 1 }]}>Situação</Text>
              </View>
              {(d.dispositivosSeguranca ?? []).map((disp: any, i: number) => (
                <View key={`disp-${i}`} style={S.tRow}>
                  <Text style={[S.tCell, { width: 80, fontFamily: 'Helvetica-Bold' }]}>{disp.tag ?? '—'}</Text>
                  <Text style={[S.tCell, { width: 55 }]}>{disp.tipo ?? '—'}</Text>
                  <Text style={[S.tCell, { width: 100 }]}>{disp.pressaoAjusteKpa ?? '—'}</Text>
                  <Text style={[S.tCell, { width: 90 }]}>{disp.ultimoTeste ? fmt(disp.ultimoTeste) : '—'}</Text>
                  <Text style={[S.tCell, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>{disp.situacao ?? '—'}</Text>
                </View>
              ))}
            </View>
          )}

          {(d.dispositivosSeguranca ?? []).map((disp: any, i: number) => {
            const url = fotosUrl[`dispositivo_${i}`]
            if (!url) return null
            return <Figura key={`disp-fig-${i}`} url={url} legenda={`${disp.tag ?? 'Dispositivo'} — ${disp.tipo ?? ''}`} dims={fotoDimensoes[`dispositivo_${i}`]} width={240} maxH={200} />
          })}

          {fotosUrl['manometro'] ? (
            <>
              <Text style={S.subTitle}>5.1 Indicador de Pressão — Manômetro (§13.5.1.2(d))</Text>
              <Figura url={fotosUrl['manometro']} legenda={`Manômetro — ${d.tag ?? '—'}`} dims={fotoDimensoes['manometro']} width={240} maxH={200} />
            </>
          ) : null}
        </View>
      </Page>

      {/* ======================== CAP. 6 — MEMÓRIA DE CÁLCULO PMTA ======================== */}
      <Page size="A4" style={S.page}>
        <DocHeader />
        <View>
          <Text style={S.chapterTitle}>6. MEMÓRIA DE CÁLCULO — PMTA ({normaSelecionada})</Text>

          <Text style={S.subTitle}>6.1 Parâmetros de Cálculo</Text>
          <View style={S.box} wrap={false}>
            <View style={S.fieldGrid}>
              <Campo label="Geometria do Costado" value={GEO_LABELS[d.geometriaCostado] ?? d.geometriaCostado ?? 'Cilíndrico'} />
              <Campo label="Geometria do Tampo" value={GEO_LABELS[d.geometriaTampo] ?? d.geometriaTampo ?? 'Torisférico'} />
              <Campo label="Tensão Admissível [S]" value={d.materialS ? `${Number(d.materialS).toFixed(1)} kgf/cm²  (${(Number(d.materialS) / 10.197).toFixed(1)} MPa)` : '—'} />
              <Campo label="Eficiência de Solda [E]" value={d.eficienciaE} />
              <Campo label="Diâmetro Interno [D]" value={d.diametroD ? `${d.diametroD} mm` : '—'} />
              <Campo label="Espessura do Costado" value={d.espessuraCostado ? `${d.espessuraCostado} mm` : '—'} />
              <Campo label="Espessura do Tampo" value={d.espessuraTampo ? `${d.espessuraTampo} mm` : '—'} />
              <Campo
                label="PSV — Pressão de Calibração"
                value={d.psvCalibracao ? `${Number(d.psvCalibracao).toFixed(2)} kgf/cm²  (${(Number(d.psvCalibracao) / 10.197).toFixed(2)} MPa)` : '—'}
              />
              {d.geometriaTampo === 'toriesferico' && d._fatorM ? <Campo label="Fator M (ASME UG-32e)" value={Number(d._fatorM).toFixed(4)} /> : null}
              {d.geometriaTampo === 'toriesferico' && d._fatorK ? <Campo label="Fator K (GB/T 150 Cláus. 5.3.1)" value={Number(d._fatorK).toFixed(4)} /> : null}
              {d.geometriaTampo === 'conico' && d.anguloConeDeg ? <Campo label="Semi-ângulo α" value={`${d.anguloConeDeg}°`} /> : null}
              {d.geometriaTampo === 'toriesferico' && d.raioAbaulamento ? <Campo label="Raio de Abaulamento L" value={`${d.raioAbaulamento} mm`} /> : null}
              {d.geometriaTampo === 'toriesferico' && d.raioRebordo ? <Campo label="Raio de Rebordo r" value={`${d.raioRebordo} mm`} /> : null}
            </View>
          </View>

          <Text style={S.subTitle}>6.2 Resultado — PMTA Calculada</Text>
          <View style={S.box} wrap={false}>
            <View style={S.fieldGrid}>
              <Campo label="PMTA do Costado" value={d._pmtaCostado != null ? `${Number(d._pmtaCostado).toFixed(2)} kgf/cm²` : '—'} />
              <Campo label="PMTA do Tampo" value={d._pmtaTampo != null ? `${Number(d._pmtaTampo).toFixed(2)} kgf/cm²` : '—'} />
              <Campo label="Componente Limitante" value={d._componenteFragil} />
              <Campo label="PMTA Efetiva (Limitante)" value={d._pmtaLimitante != null ? `${Number(d._pmtaLimitante).toFixed(2)} kgf/cm²` : '—'} />
            </View>
            {(d._pmtaLimitante != null && d.psvCalibracao != null) && (
              <View style={{ marginTop: 8, borderTopWidth: 0.75, borderTopColor: '#999999', paddingTop: 8 }}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>
                  {d._condena
                    ? `ATENÇÃO: a PSV calibrada (${(Number(d.psvCalibracao) * 10.197 / 10.197).toFixed(2)} kgf/cm²) EXCEDE a PMTA limitante — downgrade necessário conforme §13.4.1.`
                    : 'PSV calibrada dentro do limite admissível — condição conforme.'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Page>

      {/* ======================== CAP. 7 — EXAME EXTERNO / FOTOS ======================== */}
      <Page size="A4" style={S.page}>
        <DocHeader />
        <View>
          <Text style={S.chapterTitle}>7. EXAME EXTERNO — REGISTROS FOTOGRÁFICOS (§13.3.4)</Text>
          <View style={{ marginBottom: 12 }}>
            <Text style={S.fieldLabel}>Resultado do Exame Externo</Text>
            <View style={[S.statusBox, { marginTop: 4 }]}>
              <Text style={S.statusText}>{d.exameExterno ?? '—'}</Text>
            </View>
          </View>

          {Array.from({ length: 6 }).map((_, i) => {
            const url = fotosUrl[`exame_${i}`]
            if (!url) return null
            return <Figura key={`exame-${i}`} url={url} legenda={`Registro fotográfico da inspeção — TAG ${d.tag ?? '—'}`} dims={fotoDimensoes[`exame_${i}`]} width={240} maxH={260} />
          })}
        </View>
      </Page>

      {/* ======================== CAP. 8 — MEDIÇÕES DE ESPESSURA ======================== */}
      <Page size="A4" style={S.page}>
        <DocHeader />
        <View>
          <Text style={S.chapterTitle}>8. MEDIÇÕES DE ESPESSURA — §13.5.4.11(d)</Text>

          {(d.medicoesEspessura ?? []).length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <View style={S.tHeader}>
                <Text style={[S.tHdrCell, { width: 70 }]}>Ponto</Text>
                <Text style={[S.tHdrCell, { width: 95 }]}>Esp. Orig. (mm)</Text>
                <Text style={[S.tHdrCell, { width: 95 }]}>Esp. Medida (mm)</Text>
                <Text style={[S.tHdrCell, { width: 95 }]}>Esp. Mín. Adm. (mm)</Text>
                <Text style={[S.tHdrCell, { flex: 1 }]}>Situação</Text>
              </View>
              {(d.medicoesEspessura ?? []).map((med: any, i: number) => (
                <View key={`med-${i}`} style={S.tRow}>
                  <Text style={[S.tCell, { width: 70, fontFamily: 'Helvetica-Bold' }]}>{med.ponto ?? '—'}</Text>
                  <Text style={[S.tCell, { width: 95 }]}>{med.espOriginal ?? 'N/D'}</Text>
                  <Text style={[S.tCell, { width: 95, fontFamily: 'Helvetica-Bold' }]}>{med.espMedida ?? '—'}</Text>
                  <Text style={[S.tCell, { width: 95 }]}>{med.espMinAdm ?? 'N/D'}</Text>
                  <Text style={[S.tCell, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>{med.situacao ?? '—'}</Text>
                </View>
              ))}
            </View>
          )}

          {(d.medicoesEspessura ?? []).map((med: any, i: number) => {
            const url = fotosUrl[`medicao_${i}`]
            if (!url) return null
            return <Figura key={`med-fig-${i}`} url={url} legenda={`Medição de espessura — Ponto ${med.ponto ?? i + 1}`} dims={fotoDimensoes[`medicao_${i}`]} width={240} maxH={220} />
          })}
        </View>
      </Page>

      {/* ======================== CAP. 9 — NÃO CONFORMIDADES ======================== */}
      <Page size="A4" style={S.page}>
        <DocHeader />
        <View>
          <Text style={S.chapterTitle}>9. NÃO CONFORMIDADES — §13.5.4.11(j)</Text>

          {(!d.naoConformidades || d.naoConformidades.length === 0) ? (
            <Text style={S.p}>Nenhuma não conformidade identificada durante a inspeção.</Text>
          ) : (
            d.naoConformidades.map((nc: any, i: number) => (
              <View key={`nc-${i}`} style={S.box} wrap={false}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>
                  NC {String(i + 1).padStart(2, '0')} — {nc.descricao ?? 'Sem descrição'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 6 }}>
                  <Text style={{ fontSize: 8 }}>Ref. NR-13: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{nc.refNR13 ?? '—'}</Text></Text>
                  <Text style={{ fontSize: 8 }}>Grau de Risco: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{nc.grauRisco ?? '—'}</Text></Text>
                  <Text style={{ fontSize: 8 }}>Prazo: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{nc.prazo ? `${nc.prazo} dias` : '—'}</Text></Text>
                </View>
                {nc.acaoCorretiva ? (
                  <Text style={S.p}>Ação Corretiva: {nc.acaoCorretiva}</Text>
                ) : null}
                <Text style={{ fontSize: 8 }}>Responsável: {nc.responsavel ?? '—'}</Text>
                {fotosUrl[`nc_${i}`] ? (
                  <View style={{ marginTop: 8 }}>
                    <Figura url={fotosUrl[`nc_${i}`]} legenda={nc.descricao ?? `Não conformidade ${i + 1}`} dims={fotoDimensoes[`nc_${i}`]} width={240} maxH={200} />
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>
      </Page>

      {/* ======================== CAP. 10 — PARECER E CONCLUSÃO ======================== */}
      <Page size="A4" style={S.page}>
        <DocHeader />
        <View>
          <Text style={S.chapterTitle}>10. PARECER TÉCNICO E CONCLUSÃO — §13.5.4.11</Text>

          <View style={S.box} wrap={false}>
            <View style={{ flexDirection: 'row', gap: 20, marginBottom: 10 }}>
              <View>
                <Text style={S.fieldLabel}>Condição do Vaso</Text>
                <View style={[S.statusBox, { marginTop: 4 }]}>
                  <Text style={S.statusText}>{d.statusFinalVaso ?? '—'}</Text>
                </View>
              </View>
              <Campo label="PMTA Fixada pelo PLH" value={d.pmtaFixadaPLH ? `${d.pmtaFixadaPLH} kgf/cm²` : '—'} />
            </View>

            <Text style={S.subTitle}>Cronograma — Próximas Inspeções (NR-13 Tabela 2)</Text>
            <View style={S.fieldGrid}>
              <Campo label="Próxima Inspeção Externa" value={fmt(d.proximaInspecaoExterna)} />
              <Campo label="Próxima Inspeção Interna" value={fmt(d.proximaInspecaoInterna)} />
              <Campo label="Próximo Teste de Dispositivos" value={fmt(d.dataProximoTesteDispositivos)} />
            </View>
          </View>

          {d.parecerTecnico ? (
            <>
              <Text style={S.subTitle}>Parecer do Profissional Legalmente Habilitado (PLH)</Text>
              <Text style={S.p}>{d.parecerTecnico}</Text>
            </>
          ) : null}

          <View style={S.sigBox} wrap={false}>
            <View style={S.sigLine} />
            <Text style={S.sigName}>{engNome}</Text>
            {d.rthProfissao ? <Text style={S.sigSub}>{d.rthProfissao}</Text> : null}
            <Text style={S.sigSub}>CREA: {d.rthCrea ?? '—'}</Text>
            <Text style={S.sigSub}>Profissional Legalmente Habilitado — Responsável Técnico pela Inspeção NR-13</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
