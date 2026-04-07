/**
 * Relatório de Inspeção de Vaso de Pressão — NR-13 (ASME Sec VIII Div 1)
 * Totalmente isolado do módulo NR-12.
 * Usa Fontes Helvetica embutidas (não requer rede).
 * Estilo visual adotado do LaudoPDF NR-12 para consistência.
 */
import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PDFImage,
  Svg,
  Path,
} from '@react-pdf/renderer'

// ---------------------------------------------------------------------------
// Tema visual — adotado do LaudoPDF NR-12 para consistência entre módulos
// ---------------------------------------------------------------------------
const THEME = {
  bg: '#fafafa',
  cardBg: '#ffffff',
  textSecondary: '#64748b',
  textPrimary: '#1e293b',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  redMain: '#cd223c',
  redDark: '#be123c',
  accent: '#334155',
  greyCard: '#f1f5f9',
  redLight: '#ffe4e6',
  // Cores de ícones das seções (muted/desaturados)
  iconDiag: '#475569',
  iconAction: '#92400e',
  iconCheck: '#166534',
  // Acentos específicos NR-13
  blueAccent: '#1d4ed8',
  blueLight: '#dbeafe',
  amberAccent: '#b45309',
  amberLight: '#fef3c7',
  emerald: '#166534',
  emeraldLight: '#dcfce7',
}

// ---------------------------------------------------------------------------
// Cor de risco para NCs
// ---------------------------------------------------------------------------
const COR_RISCO: Record<string, string> = {
  GIR: THEME.redMain,
  'Crítico': '#ea580c',
  Moderado: '#d97706',
  Baixo: THEME.blueAccent,
}

// ---------------------------------------------------------------------------
// Stylesheet
// ---------------------------------------------------------------------------
const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', fontSize: 10, backgroundColor: THEME.cardBg,
    color: THEME.textPrimary, paddingTop: 60, paddingBottom: 50, paddingHorizontal: 0,
  },
  pg: { marginHorizontal: 40 },
  pgFlow: { marginHorizontal: 40, paddingTop: 20, paddingBottom: 20 },

  // Header / Footer fixo
  header: {
    position: 'absolute', top: 20, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    borderBottomWidth: 1, borderBottomColor: THEME.borderLight, paddingBottom: 8,
  },
  headerTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: THEME.accent },
  headerSub:   { fontSize: 7, color: THEME.textSecondary, marginTop: 2 },
  footer: {
    position: 'absolute', bottom: 20, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: 6,
  },
  footerText: { fontSize: 7, color: THEME.textSecondary },

  // Tipografia
  h1: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, marginBottom: 4 },
  h2: {
    fontSize: 13, fontFamily: 'Helvetica-Bold', color: THEME.accent, marginBottom: 8, marginTop: 14,
    borderBottomWidth: 1, borderBottomColor: THEME.borderLight, paddingBottom: 4,
  },
  h2NoPage: {
    fontSize: 13, fontFamily: 'Helvetica-Bold', color: THEME.accent, marginBottom: 8, marginTop: 14,
    borderBottomWidth: 1, borderBottomColor: THEME.borderLight, paddingBottom: 4,
    minHeight: 30,
  },
  h3: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, marginBottom: 6, marginTop: 8 },
  h3NoPage: {
    fontSize: 11, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, marginBottom: 6, marginTop: 8,
    minHeight: 24,
  },
  p:  { fontSize: 9, color: THEME.textSecondary, lineHeight: 1.6, marginBottom: 8, textAlign: 'justify' },

  // Cards — wrap=false impede quebra interna
  card: {
    backgroundColor: THEME.bg, borderRadius: 8, padding: 16, marginBottom: 16,
    wrap: false,
  },
  cardWrap: {
    backgroundColor: THEME.bg, borderRadius: 8, padding: 16, marginBottom: 16,
  },
  eqContainer: {
    backgroundColor: THEME.cardBg, borderRadius: 8, borderWidth: 1, borderColor: THEME.borderLight,
    padding: 16, marginBottom: 16, borderBottomWidth: 2, borderBottomColor: THEME.border,
    wrap: false,
  },

  // Tabelas
  tblHeader: {
    flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 2,
    borderBottomColor: THEME.border, backgroundColor: THEME.accent,
  },
  tblHdr: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#ffffff', flex: 1, paddingHorizontal: 4 },
  tblRow:  { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: THEME.borderLight, paddingVertical: 7 },
  tblRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: THEME.borderLight, paddingVertical: 7, backgroundColor: THEME.greyCard },
  tblCell: { fontSize: 8, flex: 1, paddingHorizontal: 4, color: THEME.textSecondary },
  tblCellH: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, flex: 1, paddingHorizontal: 4 },

  // Badges
  badgeOK:   { backgroundColor: THEME.emeraldLight, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  badgeWarn: { backgroundColor: THEME.amberLight, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  badgeErr:  { backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  badgeTxt:  { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },

  // KPIs
  kpiRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  kpi: {
    flex: 1, backgroundColor: THEME.cardBg, padding: 10, borderRadius: 6, borderWidth: 1,
    borderColor: THEME.borderLight,
  },

  // Checklists
  checkLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: THEME.borderLight },
  dotOK:     { width: 7, height: 7, borderRadius: 3, backgroundColor: THEME.emerald, marginRight: 6 },
  dotNO:     { width: 7, height: 7, borderRadius: 3, backgroundColor: THEME.redDark,  marginRight: 6 },
  dotNA:     { width: 7, height: 7, borderRadius: 3, backgroundColor: THEME.textSecondary, marginRight: 6 },
  checkTxt:  { fontSize: 8, flex: 1 },
  checkRef:  { fontSize: 7, color: THEME.textSecondary, width: 100, textAlign: 'right' },

  // Blocos textuais com ícones (estilo NR-12)
  detailSection: { marginBottom: 10 },
  detailTitleBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detailTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary },
  iconCircle: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: '#d4d4d8',
    justifyContent: 'center', alignItems: 'center', marginRight: 6,
  },
  iconCheck: { fontSize: 8, color: '#ffffff', fontFamily: 'Helvetica-Bold' },
  detailText: { fontSize: 9, color: THEME.textSecondary, lineHeight: 1.5, marginLeft: 20 },

  // Assinatura
  sigBox:  { marginTop: 40, alignItems: 'flex-end' },
  sigLine: { borderTopWidth: 1, borderTopColor: THEME.textPrimary, width: 200, marginBottom: 4 },
  sigName: { fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'center', width: 200 },
  sigSub:  { fontSize: 8, color: THEME.textSecondary, textAlign: 'center', width: 200 },

  // Capa — estilo NR-12
  coverRoot:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  coverGrid:     { width: '100%', maxWidth: 400, paddingTop: 30, borderTopWidth: 1, borderTopColor: THEME.borderLight },
  rowMeta:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  lbl:           { fontSize: 9, color: THEME.textSecondary, textTransform: 'uppercase' },
  valor:         { fontSize: 12, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary },
  title:         { fontSize: 26, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, textAlign: 'center', marginBottom: 14 },
  subtitle:      { fontSize: 12, color: THEME.textSecondary, textAlign: 'center', maxWidth: 400, marginBottom: 40, lineHeight: 1.5 },

  // Foto
  photoBox: { width: '100%', height: 180, backgroundColor: THEME.borderLight, borderRadius: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 8 },
  photoCaption: { fontSize: 8, color: THEME.textSecondary, textAlign: 'center', marginBottom: 12 },
  noPhotoBox: { width: '100%', height: 180, backgroundColor: THEME.greyCard, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
})

// ---------------------------------------------------------------------------
// Helpers de status (mesmo padrão NR-12)
// ---------------------------------------------------------------------------
const STATUS_BADGE = (status: string) => {
  const s = status?.toLowerCase() ?? ''
  if (s.includes('aprovado') && !s.includes('restri'))
    return { style: S.badgeOK, color: THEME.emerald, text: 'Aprovado' }
  if (s.includes('restri'))
    return { style: S.badgeWarn, color: THEME.amberAccent, text: 'Com Restrições' }
  if (s.includes('reprovado') || s.includes('interditado'))
    return { style: S.badgeErr, color: THEME.redMain, text: status.replace(/_/g, ' ') }
  return { style: S.badgeWarn, color: THEME.amberAccent, text: status || '—' }
}

/**
 * Calcula altura proporcional da imagem para caber na largura do PDF.
 * Largura útil = 515px - 80px margin = ~225px.
 * Para 2 colunas: ~100px cada.
 */
function calcImageHeight(
  dims: { width: number; height: number } | undefined,
  containerWidth: number,
  maxHeight: number = 400
): number {
  if (!dims) return 160; // fallback
  const ratio = dims.height / dims.width;
  return Math.min(containerWidth * ratio, maxHeight);
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

  const Header = () => (
    <View style={S.header} fixed>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {logoUrl ? (
          <PDFImage src={logoUrl} style={{ height: 22, maxWidth: 70, objectFit: 'contain' }} />
        ) : null}
        <View>
          <Text style={S.headerTitle}>RELATÓRIO DE INSPEÇÃO — NR-13</Text>
          <Text style={S.headerSub}>{d.tag ?? '—'} | {d.fabricante ?? '—'}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={S.headerSub}>Doc: {d.tag ?? '—'} | Rev: 0</Text>
        <Text style={S.headerSub}>Data: {fmt(d.dataInspecao)}</Text>
      </View>
    </View>
  )

  const Footer = () => (
    <View style={S.footer} fixed>
      <Text style={S.footerText}>
        Inspeção NR-13 | {perfil?.nome ?? '—'}
        {perfil?.crea ? ` | CREA: ${perfil.crea}` : ''}
      </Text>
      <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} / ${totalPages}`} />
    </View>
  )

  // =====================================================================
  return (
    <Document title={`Inspeção NR-13 — ${d.tag ?? 'Vaso de Pressão'}`} author={perfil?.nome}>

      {/* ======================== CAPA ======================== */}
      <Page size="A4" style={S.page}>
        <View style={S.coverRoot}>
          {/* Logo da empresa — exibida no topo da capa quando disponível */}
          {logoUrl ? (
            <View style={{ marginBottom: 20, alignItems: 'center' }}>
              <PDFImage src={logoUrl} style={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain' }} />
            </View>
          ) : null}
          <Text style={S.title}>Laudo Técnico NR-13</Text>
          <Text style={S.subtitle}>
            Documento de avaliação técnica de integridade mecânica e conformidade de vaso de pressão estacionário, em conformidade com a NR-13 e o Código ASME Sec. VIII Div. 1.
          </Text>

          <View style={{ width: '100%', maxWidth: 400, marginTop: 20 }}>
            <View style={{ flexDirection: 'column', gap: 0 }}>
              <View style={S.rowMeta}>
                <Text style={S.lbl}>TAG do Equipamento</Text>
                <Text style={S.valor}>{d.tag ?? '—'}</Text>
              </View>
              <View style={S.rowMeta}>
                <Text style={S.lbl}>Empresa Inspecionada</Text>
                <Text style={S.valor}>{perfil?.empresa ?? '—'}</Text>
              </View>
              <View style={S.rowMeta}>
                <Text style={S.lbl}>Localidade</Text>
                <Text style={S.valor}>{perfil?.cidade ?? '—'} / {perfil?.estado ?? '—'}</Text>
              </View>
              <View style={S.rowMeta}>
                <Text style={S.lbl}>Data da Inspeção</Text>
                <Text style={S.valor}>{fmt(d.dataInspecao)}</Text>
              </View>
              <View style={S.rowMeta}>
                <Text style={S.lbl}>Tipo de Inspeção</Text>
                <Text style={S.valor}>{d.tipoInspecao ?? '—'}</Text>
              </View>
              <View style={S.rowMeta}>
                <Text style={S.lbl}>Responsável Técnico</Text>
                <Text style={S.valor}>{perfil?.nome ?? d.rthNome ?? '—'}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>

      {/* ====================== DADOS GERAIS ====================== */}
      <Page size="A4" style={S.page}>
        <Header /><Footer />
        <View style={S.pg}>

          <Text style={[S.h2, { marginTop: 0 }]}>1. Identificação do Vaso de Pressão</Text>

          {/* Tag + Foto da placa */}
          <View style={{ marginBottom: 20 }} wrap={false}>
            <View style={{ backgroundColor: THEME.accent, padding: 14, borderRadius: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }} wrap={false}>
              <View style={{ flexDirection: 'column' }}>
                <Text style={{ fontSize: 9, color: '#ffffff', opacity: 0.8 }}>TAG {d.tag ?? '—'}</Text>
                <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#ffffff' }}>{d.fabricante ?? '—'}</Text>
              </View>
              <Text style={{ fontSize: 9, color: '#ffffff', opacity: 0.9 }}>
                {d.ambiente === 'Fechado' ? 'Ambiente Fechado' : 'Ambiente Aberto'}
              </Text>
            </View>

            {/* Foto da placa de identificação */}
            {fotosUrl['placa'] ? (
              <View style={{ marginBottom: 16, backgroundColor: THEME.cardBg, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: THEME.borderLight }}>
                <PDFImage src={fotosUrl['placa']} style={{ width: '100%', height: 160, objectFit: 'contain' }} />
                <Text style={{ fontSize: 8, color: THEME.textSecondary, padding: 6, textAlign: 'center' }}>Placa de Identificação — {d.tag}</Text>
              </View>
            ) : null}

            {/* Foto do manômetro */}
            {fotosUrl['manometro'] ? (
              <View style={{ marginBottom: 16, backgroundColor: THEME.cardBg, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: THEME.borderLight }}>
                <PDFImage src={fotosUrl['manometro']} style={{ width: '100%', height: 160, objectFit: 'contain' }} />
                <Text style={{ fontSize: 8, color: THEME.textSecondary, padding: 6, textAlign: 'center' }}>Manômetro — {d.tag}</Text>
              </View>
            ) : null}
          </View>

          {/* Dados da placa */}
          <View style={S.card}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, marginBottom: 10 }}>Dados da Placa de Identificação — Art. 13.5.1.3</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {[
                ['TAG', d.tag], ['Fabricante', d.fabricante], ['Nº de Série', d.numeroSerie],
                ['Ano de Fabricação', d.anoFabricacao], ['Tipo', d.tipoVaso], ['Cód. Projeto', d.codigoProjeto],
                ['PMTA Fabricante', d.pmtaFabricante ? `${d.pmtaFabricante} kgf/cm²` : '—'],
                ['Ambiente', d.ambiente],
              ].map(([l, v]: any) => (
                <View key={l} style={{ flex: 1, minWidth: '40%' }}>
                  <Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>{l}</Text>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>{v ?? '—'}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Classificação e Categorização — wrap=false evita separar do título */}
          <View wrap={false}>
            <Text style={S.h2}>2. Classificação e Categorização — §13.5.1.1</Text>
            <View style={S.card}>
              <Text style={{ fontSize: 9, color: THEME.textSecondary, marginBottom: 8 }}>
                Classificação baseada na tabela do Anexo I da NR-13 (Classe do Fluido e Produto P×V).
              </Text>
              <View style={[S.kpiRow, { marginBottom: 12 }]}>
                <View style={S.kpi}><Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>Fluido</Text>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>{d.fluidoServico ?? '—'}</Text></View>
                <View style={S.kpi}><Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>Classe</Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: THEME.blueAccent }}>{d.fluidoClasse ? d.fluidoClasse.charAt(0) : '—'}</Text></View>
              </View>
              <View style={[S.kpiRow, { marginBottom: 8 }]}>
                <View style={S.kpi}><Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>P. Op. (kgf/cm²)</Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>{d.pressaoOperacao ?? '—'}</Text></View>
                <View style={S.kpi}><Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>Volume (m³)</Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>{d.volume ?? '—'}</Text></View>
                <View style={S.kpi}><Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>P×V</Text>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>{d.grupoPV ? `Grupo ${d.grupoPV}` : '—'}</Text></View>
                <View style={S.kpi}><Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>Categoria</Text>
                  <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: THEME.blueAccent }}>{d.categoriaVaso ?? '—'}</Text></View>
              </View>
            </View>
          </View>

          {/* Checklist Documental */}
          <View wrap={false}>
            <Text style={S.h2}>3. Checklist Documental — §13.5.1.5</Text>
            <View style={S.card}>
              {[
                { label: 'Prontuário do Vaso', val: d.prontuario },
                { label: 'Registro de Segurança', val: d.registroSeguranca },
                { label: 'Projeto de Instalação', val: d.projetoInstalacao },
                { label: 'Relatórios Anteriores', val: d.relatoriosAnteriores },
                { label: 'Placa de Identificação', val: d.placaIdentificacao },
                { label: 'Certif. Dispositivos Segurança', val: d.certificadosDispositivos },
                { label: 'Manual Operação (Português)', val: d.manualOperacao },
              ].map(({ label, val }) => (
                <View key={label} style={S.checkLine}>
                  {val === 'Existe Integral' || val === 'Atualizado' || val === 'Existe' || val === 'Disponíveis' || val === 'Disponível em Português' || val === 'Fixada e Legível'
                    ? <View style={S.dotOK} />
                    : val === 'N/A' || val === 'Não Aplicável' || (!val)
                      ? <View style={S.dotNA} />
                      : <View style={S.dotNO} />}
                  <Text style={S.checkTxt}>{label}</Text>
                  <Text style={S.checkRef}>{val ?? '—'}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Page>

      {/* ====================== CHECKLIST SEGURANÇA ====================== */}
      <Page size="A4" style={S.page}>
        <Header /><Footer />
        <View style={S.pg}>
          <Text style={[S.h2, { marginTop: 0 }]}>3.1 Segurança no Trabalho — Acessibilidade §13.5.2</Text>

          <View wrap={false}>
            <Text style={S.h3NoPage}>Acessibilidade Geral — Art. 13.5.2.1</Text>
            <View style={S.card}>
              <View style={S.checkLine}>
                {d.segDrenosRespirosBV === 'Conforme' ? <View style={S.dotOK} /> : d.segDrenosRespirosBV === 'Não Aplicável' ? <View style={S.dotNA} /> : <View style={S.dotNO} />}
                <Text style={S.checkTxt}>Drenos, respiros, bocas de visita e indicadores acessíveis</Text>
                <Text style={S.checkRef}>{d.segDrenosRespirosBV ?? '—'}</Text>
              </View>
              <View style={S.checkLine}>
                {d.segAspNormativosGerais === 'Conforme' ? <View style={S.dotOK} /> : d.segAspNormativosGerais === 'N/A' ? <View style={S.dotNA} /> : <View style={S.dotNO} />}
                <Text style={S.checkTxt}>Adequação a normas de segurança, saúde e meio ambiente</Text>
                <Text style={S.checkRef}>{d.segAspNormativosGerais ?? '—'}</Text>
              </View>
            </View>
          </View>

          {d.ambiente === 'Fechado' && (
            <View wrap={false}>
              <Text style={S.h3NoPage}>Ambiente Fechado — Art. 13.5.2.2</Text>
              <View style={S.card}>
                {[
                  { ref: 'Art. 13.5.2.2(a)', label: 'Mínimo de 2 saídas amplas e seguras', val: d.segDuasSaidasAmbFechado },
                  { ref: 'Art. 13.5.2.2(b)', label: 'Acesso fácil para manutenção e inspeção', val: d.segAcessoManutencao },
                  { ref: 'Art. 13.5.2.2(c)', label: 'Ventilação permanente com entradas não bloqueáveis', val: d.segVentilacaoPermanente },
                  { ref: 'Art. 13.5.2.2(d)', label: 'Iluminação conforme normas vigentes', val: d.segIluminacaoFechado },
                  { ref: 'Art. 13.5.2.2(e)', label: 'Iluminação de emergência', val: d.segIluminacaoEmergenciaFechado },
                ].map(({ ref: r, label, val }) => (
                  <View key={r} style={S.checkLine}>
                    {val === 'Conforme' ? <View style={S.dotOK} /> : val === 'Não Aplicável' ? <View style={S.dotNA} /> : <View style={S.dotNO} />}
                    <Text style={S.checkTxt}>{label}</Text>
                    <Text style={S.checkRef}>{val ?? '—'}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {d.ambiente === 'Aberto' && (
            <View wrap={false}>
              <Text style={S.h3NoPage}>Ambiente Aberto — Art. 13.5.2.3</Text>
              <View style={S.card}>
                {[
                  { ref: '13.5.2.3 / .2.2(a)', label: 'Saídas amplas, desobstruídas e sinalizadas', val: d.segSaidasAmbAberto },
                  { ref: '13.5.2.3 / .2.2(b)', label: 'Acesso seguro para manutenção e inspeção', val: d.segAcessoAmbAberto },
                  { ref: '13.5.2.3 / .2.2(d)', label: 'Iluminação conforme normas vigentes', val: d.segIluminacaoAberto },
                  { ref: '13.5.2.3 / .2.2(e)', label: 'Iluminação de emergência (se aplicável)', val: d.segIluminacaoEmergenciaAberto },
                ].map(({ ref: r, label, val }) => (
                  <View key={r} style={S.checkLine}>
                    {val === 'Conforme' ? <View style={S.dotOK} /> : val === 'Não Aplicável' ? <View style={S.dotNA} /> : <View style={S.dotNO} />}
                    <Text style={S.checkTxt}>{label}</Text>
                    <Text style={S.checkRef}>{val ?? '—'}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </Page>

      {/* ====================== DISPOSITIVOS + EXAME + MEDIÇÕES ====================== */}
      <Page size="A4" style={S.page}>
        <Header /><Footer />
        <View style={S.pg}>
          <Text style={[S.h2, { marginTop: 0 }]}>4. Dispositivos de Segurança — §13.5.1.2</Text>
          <View style={{ backgroundColor: THEME.redLight, borderRadius: 6, padding: 8, marginBottom: 12 }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: THEME.redDark }}>
              ATENÇÃO: Ausência ou bloqueio de dispositivos configura Grave e Iminente Risco — Art. 13.3.1(a)(c)
            </Text>
          </View>

          {/* Tabela de dispositivos */}
          {(d.dispositivosSeguranca ?? []).length > 0 && (
            <View>
              <View style={S.tblHeader}>
                <Text style={{ ...S.tblHdr, width: 80 }}>TAG</Text>
                <Text style={{ ...S.tblHdr, width: 50 }}>Tipo</Text>
                <Text style={{ ...S.tblHdr, width: 110 }}>P. Ajuste (kgf/cm²)</Text>
                <Text style={{ ...S.tblHdr, width: 100 }}>Últ. Teste</Text>
                <Text style={{ ...S.tblHdr, width: 80 }}>Situação</Text>
              </View>
              {(d.dispositivosSeguranca ?? []).map((disp: any, i: number) => (
                <View key={`disp-${i}`} style={i % 2 === 1 ? S.tblRowAlt : S.tblRow}>
                  <Text style={{ ...S.tblCell, width: 80, fontFamily: 'Helvetica-Bold' }}>{disp.tag ?? '—'}</Text>
                  <Text style={{ ...S.tblCell, width: 50 }}>{disp.tipo ?? '—'}</Text>
                  <Text style={{ ...S.tblCell, width: 110 }}>{disp.pressaoAjusteKpa ?? '—'}</Text>
                  <Text style={{ ...S.tblCell, width: 100 }}>{disp.ultimoTeste ? fmt(disp.ultimoTeste) : '—'}</Text>
                  <View style={{ width: 80 }}>
                    <View style={disp.situacao === 'OK' ? S.badgeOK : S.badgeWarn}>
                      <Text style={{ ...S.badgeTxt, color: disp.situacao === 'OK' ? THEME.emerald : THEME.amberAccent }}>{disp.situacao ?? '—'}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Fotos dos dispositivos — wrap=false evita quebra parcial */}
          {Object.keys(fotosUrl).some(k => k.startsWith('dispositivo_')) && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }} wrap={false}>
              {(d.dispositivosSeguranca ?? []).map((disp: any, i: number) => {
                const fotoUrl = fotosUrl[`dispositivo_${i}`];
                if (!fotoUrl) return null;
                return (
                  <View key={`disp-foto-${i}`} style={{ width: '48%', minWidth: '45%', backgroundColor: THEME.cardBg, borderWidth: 1, borderColor: THEME.borderLight, borderRadius: 6, overflow: 'hidden' }}>
                    <PDFImage src={fotoUrl} style={{ width: '100%', height: 160, objectFit: 'contain', backgroundColor: '#fafafa' }} />
                    <Text style={{ fontSize: 7, color: THEME.textSecondary, padding: 4, textAlign: 'center' }}>{disp.tag ?? 'Dispositivo'} — {disp.tipo}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Exame Externo e Interno — wrap=false mantém título + conteúdo juntos */}
          <View wrap={false}>
            <Text style={S.h2NoPage}>5. Exame Externo e Interno — §13.3.4</Text>
            <View style={S.eqContainer}>
              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 8, color: THEME.textSecondary, textTransform: 'uppercase' }}>Exame Externo</Text>
                  <View style={{ marginTop: 4, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: d.exameExterno === 'Conforme' ? THEME.emeraldLight : '#fee2e2', borderRadius: 6 }}>
                    <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: d.exameExterno === 'Conforme' ? THEME.emerald : THEME.redMain }}>
                      {d.exameExterno ?? '—'}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 8, color: THEME.textSecondary, textTransform: 'uppercase' }}>Exame Interno</Text>
                  <View style={{ marginTop: 4, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: d.exameInterno === 'Conforme' ? THEME.emeraldLight : d.exameInterno === 'Não Aplicável' ? THEME.greyCard : THEME.amberLight, borderRadius: 6 }}>
                    <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: d.exameInterno === 'Conforme' ? THEME.emerald : d.exameInterno === 'Não Aplicável' ? THEME.textSecondary : THEME.amberAccent }}>
                      {d.exameInterno ?? '—'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Fotos do exame externo e interno — renderiza todas que existirem */}
              {(fotosUrl['exame_externo'] || fotosUrl['exame_interno'] || fotosUrl['exame_externo_0'] || fotosUrl['exame_interno_0']) && (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' }} wrap={false}>
                  {fotosUrl['exame_externo'] ? (
                    <>
                      <View style={{ flex: 1, minWidth: '45%' }}>
                        {fotosUrl['exame_interno'] ? (
                          <>
                            <PDFImage src={fotosUrl['exame_externo']} style={{ width: '100%', height: calcImageHeight(fotoDimensoes['exame_0'] || fotoDimensoes['exame_externo'], 225, 350), objectFit: 'contain', borderRadius: 6, backgroundColor: '#fafafa' }} />
                            <Text style={{ fontSize: 7, color: THEME.textSecondary, padding: 3, textAlign: 'center' }}>Exame Externo</Text>
                          </>
                        ) : (
                          <>
                            <PDFImage src={fotosUrl['exame_externo']} style={{ width: '100%', height: calcImageHeight(fotoDimensoes['exame_0'] || fotoDimensoes['exame_externo'], 400, 450), objectFit: 'contain', borderRadius: 6, backgroundColor: '#fafafa' }} />
                            <Text style={{ fontSize: 7, color: THEME.textSecondary, padding: 3, textAlign: 'center' }}>Exame Externo</Text>
                          </>
                        )}
                      </View>
                      {fotosUrl['exame_interno'] && (
                        <View style={{ flex: 1, minWidth: '45%' }}>
                          <PDFImage src={fotosUrl['exame_interno']} style={{ width: '100%', height: calcImageHeight(fotoDimensoes['exame_1'] || fotoDimensoes['exame_interno'], 225, 350), objectFit: 'contain', borderRadius: 6, backgroundColor: '#fafafa' }} />
                          <Text style={{ fontSize: 7, color: THEME.textSecondary, padding: 3, textAlign: 'center' }}>Exame Interno</Text>
                        </View>
                      )}
                    </>
                  ) : fotosUrl['exame_interno'] ? (
                    <View style={{ flex: 1, minWidth: '45%' }} wrap={false}>
                      <PDFImage src={fotosUrl['exame_interno']} style={{ width: '100%', height: calcImageHeight(fotoDimensoes['exame_1'] || fotoDimensoes['exame_interno'], 400, 450), objectFit: 'contain', borderRadius: 6, backgroundColor: '#fafafa' }} />
                      <Text style={{ fontSize: 7, color: THEME.textSecondary, padding: 3, textAlign: 'center' }}>Exame Interno</Text>
                    </View>
                  ) : null}
                  {fotosUrl['exame_externo_0'] && (
                    <View style={{ flex: 1, minWidth: '45%' }} wrap={false}>
                      <PDFImage src={fotosUrl['exame_externo_0']} style={{ width: '100%', height: calcImageHeight(fotoDimensoes['exame_externo_0'], 200, 350), objectFit: 'contain', borderRadius: 6, backgroundColor: '#fafafa' }} />
                      <Text style={{ fontSize: 7, color: THEME.textSecondary, padding: 3, textAlign: 'center' }}>Exame Externo #2</Text>
                    </View>
                  )}
                  {fotosUrl['exame_interno_0'] && (
                    <View style={{ flex: 1, minWidth: '45%' }} wrap={false}>
                      <PDFImage src={fotosUrl['exame_interno_0']} style={{ width: '100%', height: calcImageHeight(fotoDimensoes['exame_interno_0'], 200, 350), objectFit: 'contain', borderRadius: 6, backgroundColor: '#fafafa' }} />
                      <Text style={{ fontSize: 7, color: THEME.textSecondary, padding: 3, textAlign: 'center' }}>Exame Interno #2</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Medições de Espessura */}
          <View wrap={false}>
            <Text style={S.h2NoPage}>6. Medições de Espessura — §13.5.4.11(d)</Text>
            {(d.medicoesEspessura ?? []).length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <View style={S.tblHeader}>
                  <Text style={{ ...S.tblHdr, width: 70 }}>Ponto</Text>
                  <Text style={{ ...S.tblHdr, width: 100 }}>Esp. Orig (mm)</Text>
                  <Text style={{ ...S.tblHdr, width: 110 }}>Esp. Medida</Text>
                  <Text style={{ ...S.tblHdr, width: 100 }}>Esp. Mín. Adm</Text>
                  <Text style={{ ...S.tblHdr, width: 90 }}>Situação</Text>
                </View>
                {(d.medicoesEspessura ?? []).map((med: any, i: number) => (
                  <View key={`med-${i}`} style={i % 2 === 1 ? S.tblRowAlt : S.tblRow}>
                    <Text style={{ ...S.tblCell, width: 70, fontFamily: 'Helvetica-Bold' }}>{med.ponto ?? '—'}</Text>
                    <Text style={{ ...S.tblCell, width: 100 }}>{med.espOriginal ?? 'N/D'}</Text>
                    <Text style={{ ...S.tblCell, width: 110, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>{med.espMedida ?? '—'}</Text>
                    <Text style={{ ...S.tblCell, width: 100 }}>{med.espMinAdm ?? 'N/D'}</Text>
                    <View style={{ width: 90 }}>
                      <View style={med.situacao === 'OK' ? S.badgeOK : S.badgeErr}>
                        <Text style={{ ...S.badgeTxt, color: med.situacao === 'OK' ? THEME.emerald : THEME.redMain }}>{med.situacao ?? '—'}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Fotos das medições de espessura — 1 foto = full width, 2+ = lado-a-lado */}
          {Object.keys(fotosUrl).some(k => k.startsWith('medicao_')) && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {(d.medicoesEspessura ?? []).map((med: any, i: number) => {
                const fotoUrl = fotosUrl[`medicao_${i}`];
                if (!fotoUrl) return null;
                const dims = fotoDimensoes[`medicao_${i}`];
                const medCount = (d.medicoesEspessura ?? []).filter((m: any, idx: number) => fotosUrl[`medicao_${idx}`]).length;
                const medWidth = medCount <= 1 ? '100%' : '48%';
                const containerW = medCount <= 1 ? 400 : 200;
                return (
                  <View key={`med-foto-${i}`} style={{ width: medWidth, minWidth: '45%', backgroundColor: THEME.cardBg, borderWidth: 1, borderColor: THEME.borderLight, borderRadius: 6, overflow: 'hidden' }} wrap={false}>
                    <PDFImage src={fotoUrl} style={{ width: '100%', height: calcImageHeight(dims, containerW, 400), objectFit: 'contain', backgroundColor: '#fafafa' }} />
                    <Text style={{ fontSize: 7, color: THEME.textSecondary, padding: 4, textAlign: 'center' }}>Ponto {med.ponto ?? i + 1} — {med.situacao === 'Crítico' ? 'Crítico' : 'OK'}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </Page>

      {/* ====================== CÁLCULO ASME + PARECER ====================== */}
      <Page size="A4" style={S.page} break>
        <Header /><Footer />
        <View style={S.pg}>
          {/* Avaliação Estrutural — estilo editorial NR-12 */}
          <Text style={[S.h2, { marginTop: 0 }]}>7. Avaliação Estrutural — ASME Sec VIII Div. 1</Text>

          {/* Card do Cabeçalho com TAG */}
          <View style={{ marginBottom: 20, backgroundColor: THEME.bg, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: THEME.borderLight }} wrap={false}>
            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, marginBottom: 10 }}>Resumo de Avaliação — {d.tag ?? 'Vaso'}</Text>

            {/* KPIs */}
            <View style={[S.kpiRow, { marginBottom: 12 }]}>
              <View style={[S.kpi, { borderLeftWidth: 3, borderLeftColor: THEME.blueAccent }]}>
                <Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>PMTA Costado</Text>
                <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: THEME.blueAccent, marginTop: 4 }}>
                  {d._pmtaCostado != null ? Number(d._pmtaCostado).toFixed(2) : '—'}
                  <Text style={{ fontSize: 8, color: THEME.textSecondary, fontFamily: 'Helvetica' }}> kgf/cm²</Text>
                </Text>
              </View>
              <View style={[S.kpi, { borderLeftWidth: 3, borderLeftColor: THEME.amberAccent }]}>
                <Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>PMTA Tampo</Text>
                <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: THEME.amberAccent, marginTop: 4 }}>
                  {d._pmtaTampo != null ? Number(d._pmtaTampo).toFixed(2) : '—'}
                  <Text style={{ fontSize: 8, color: THEME.textSecondary, fontFamily: 'Helvetica' }}> kgf/cm²</Text>
                </Text>
              </View>
              <View style={[S.kpi, { borderLeftWidth: 3, borderLeftColor: THEME.emerald }]}>
                <Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>PMTA Limitante</Text>
                <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: THEME.emerald, marginTop: 4 }}>
                  {d._pmtaLimitante != null ? Number(d._pmtaLimitante).toFixed(2) : '—'}
                  <Text style={{ fontSize: 8, color: THEME.textSecondary, fontFamily: 'Helvetica' }}> kgf/cm²</Text>
                </Text>
              </View>
            </View>

            {/* Condutório de comparação PSV vs PMTA */}
            {(d._pmtaLimitante != null && d.psvCalibracao != null) && (
              <View style={{ backgroundColor: d._condena ? '#fee2e2' : THEME.emeraldLight, borderRadius: 6, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: d._condena ? THEME.redMain : THEME.emerald }} />
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: d._condena ? THEME.redMain : THEME.emerald, flex: 1 }}>
                  {d._condena ? `A PSV (${(Number(d.psvCalibracao) * 10.197).toFixed(2)} kgf/cm²) EXCEDE a PMTA limitante — VASO CONDENADO` : 'PSV calibrada dentro do limite — VASO CONFORME'}
                </Text>
              </View>
            )}

            {/* Parâmetros de entrada */}
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: THEME.borderLight }}>
              {/* Geometria */}
              {(() => {
                const geoLabels: Record<string, string> = {
                  cilindrico: 'Cilíndrico — UG-27(c)(1)',
                  esferico: 'Esférico — UG-27(d)',
                  elipsoidal: 'Elipsoidal 2:1 — UG-32(d)',
                  toriesferico: 'Torisférico (F&D) — UG-32(e)',
                  semiesferico: 'Semiesférico — UG-32(f)',
                  conico: 'Cônico — UG-32(g)',
                }
                return (
                  <View style={{ flexDirection: 'row', gap: 16, marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>Geometria do Costado</Text>
                      <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>
                        {geoLabels[d.geometriaCostado] ?? d.geometriaCostado ?? 'Cilíndrico — UG-27(c)(1)'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>Geometria do Tampo</Text>
                      <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>
                        {geoLabels[d.geometriaTampo] ?? d.geometriaTampo ?? 'Torisférico — UG-32(e)'}
                      </Text>
                    </View>
                    {d._componenteFragil && (
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>Componente Limitante</Text>
                        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: THEME.amberAccent }}>{d._componenteFragil}</Text>
                      </View>
                    )}
                  </View>
                )
              })()}

              {/* Campos numéricos */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                {[
                  ['Tensão Admissível S', d.materialS ? `${d.materialS} kgf/cm²` : '—'],
                  ['Eficiência de Solda E', d.eficienciaE ?? '—'],
                  ['Diâmetro Interno D', d.diametroD ? `${d.diametroD} mm` : '—'],
                  ['Espessura Costado', d.espessuraCostado ? `${d.espessuraCostado} mm` : '—'],
                  ['Espessura Tampo', d.espessuraTampo ? `${d.espessuraTampo} mm` : '—'],
                  ['PSV Calibração', d.psvCalibracao ? `${d.psvCalibracao} kgf/cm²` : '—'],
                  ...(d.geometriaTampo === 'toriesferico' && d._fatorM
                    ? [['Fator M (torisférico)', Number(d._fatorM).toFixed(4)]] : []),
                  ...(d.geometriaTampo === 'conico' && d.anguloConeDeg
                    ? [['Semi-ângulo α', `${d.anguloConeDeg}°`]] : []),
                  ...(d.geometriaTampo === 'toriesferico' && d.raioAbaulamento
                    ? [['Raio Abaulamento L', `${d.raioAbaulamento} mm`]] : []),
                  ...(d.geometriaTampo === 'toriesferico' && d.raioRebordo
                    ? [['Raio Rebordo r', `${d.raioRebordo} mm`]] : []),
                ].map(([l, v]: any) => (
                  <View key={l} style={{ flex: 1, minWidth: '40%' }}>
                    <Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>{l}</Text>
                    <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>{v ?? '—'}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Parecer Técnico e Plano — wrap=false mantém título + conteúdo */}
          <View wrap={false}>
            <Text style={S.h2NoPage}>8. Parecer Técnico e Plano de Inspeção — §13.5.4.11</Text>
            <View style={S.card}>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>Condição do Vaso</Text>
                  {(() => {
                    const badge = STATUS_BADGE(d.statusFinalVaso)
                    return (
                      <View style={{ ...badge.style, marginTop: 4, paddingVertical: 6, paddingHorizontal: 10 }}>
                        <Text style={{ ...S.badgeTxt, color: badge.color, fontSize: 9 }}>{badge.text}</Text>
                      </View>
                    )
                  })()}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>PMTA Fixada pelo PLH</Text>
                  <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: THEME.emerald, marginTop: 2 }}>
                    {d.pmtaFixadaPLH ?? '—'} kgf/cm²
                  </Text>
                </View>
              </View>

              {/* Próximas inspeções */}
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: THEME.accent, marginBottom: 6 }}>Próximas Inspeções</Text>
              <View style={[S.kpiRow, { marginBottom: 12 }]}>
                <View style={S.kpi}>
                  <Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>Externa</Text>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>{fmt(d.proximaInspecaoExterna)}</Text>
                </View>
                <View style={S.kpi}>
                  <Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>Interna</Text>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>{fmt(d.proximaInspecaoInterna)}</Text>
                </View>
                <View style={S.kpi}>
                  <Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>Teste Dispositivos</Text>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>{fmt(d.dataProximoTesteDispositivos)}</Text>
                </View>
              </View>

              {/* Parecer com ícone estilo NR-12 */}
              {d.parecerTecnico && (
                <View style={{ borderTopWidth: 1, borderTopColor: THEME.borderLight, paddingTop: 12 }}>
                  <View style={S.detailTitleBox}>
                    <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: THEME.iconDiag, justifyContent: 'center', alignItems: 'center', marginRight: 6 }}>
                      <Text style={{ fontSize: 8, color: '#ffffff', fontFamily: 'Helvetica-Bold' }}>P</Text>
                    </View>
                    <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>Parecer do PLH</Text>
                  </View>
                  <Text style={{ fontSize: 9, color: THEME.textSecondary, lineHeight: 1.6, textAlign: 'justify', marginLeft: 20 }}>{d.parecerTecnico}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Não Conformidades */}
          {d.naoConformidades && d.naoConformidades.length > 0 && (
            <>
              <View wrap={false}>
                <Text style={S.h2NoPage}>9. Não Conformidades — §13.5.4.11(j)</Text>
              </View>
              {(d.naoConformidades).map((nc: any, i: number) => {
                const riscoColor = COR_RISCO[nc.grauRisco] ?? THEME.textPrimary
                return (
                  <View key={i} style={{
                    backgroundColor: THEME.cardBg, borderRadius: 8, borderWidth: 1, borderColor: THEME.borderLight,
                    padding: 14, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: riscoColor, overflow: 'hidden',
                  }} wrap={false}>

                    {/* Header da NC com foto */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>
                          NC {String(i + 1).padStart(2, '0')} — {nc.descricao ?? 'Sem descrição'}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: THEME.greyCard, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, minWidth: 70, alignItems: 'center' }}>
                        <Text style={{ fontSize: 6, color: THEME.textSecondary, textTransform: 'uppercase' }}>Risco</Text>
                        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: riscoColor }}>{nc.grauRisco ?? '—'}</Text>
                      </View>
                    </View>

                    {/* Foto da NC */}
                    {fotosUrl[`nc_${i}`] ? (
                      <View style={{ marginBottom: 8, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: THEME.borderLight }}>
                        <PDFImage src={fotosUrl[`nc_${i}`]} style={{ width: '100%', height: 160, objectFit: 'contain', backgroundColor: '#fafafa' }} />
                        {nc.descricao && <Text style={{ fontSize: 7, color: THEME.textSecondary, padding: 4, textAlign: 'center' }}>{nc.descricao}</Text>}
                      </View>
                    ) : null}

                    {/* Referência e ação corretiva */}
                    {nc.refNR13 && (
                      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: THEME.accent, marginBottom: 4 }}>Ref NR-13: {nc.refNR13}</Text>
                    )}
                    {nc.acaoCorretiva && (
                      <View style={{ marginBottom: 6, borderLeftWidth: 3, borderLeftColor: THEME.iconCheck, backgroundColor: THEME.bg, borderRadius: 4, padding: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Svg viewBox="0 0 24 24" width="10" height="10" style={{ marginRight: 4 }}>
                            <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill={THEME.iconCheck} />
                          </Svg>
                          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: THEME.iconCheck }}>Ação Corretiva</Text>
                        </View>
                        <Text style={{ fontSize: 8, color: THEME.textSecondary, lineHeight: 1.4, textAlign: 'justify', paddingLeft: 14 }}>{nc.acaoCorretiva}</Text>
                      </View>
                    )}
                    {(nc.prazo || nc.responsavel) && (
                      <Text style={{ fontSize: 8, color: THEME.textSecondary, marginTop: 4 }}>
                        Prazo: {nc.prazo ? `${nc.prazo} dias` : '—'} | Responsável: {nc.responsavel ?? '—'}
                      </Text>
                    )}
                  </View>
                )
              })}
            </>
          )}

          {/* Assinatura */}
          <View style={{ ...S.sigBox, alignItems: 'center', marginTop: 30 }} wrap={false}>
            <View style={{ width: 200, borderTopWidth: 1, borderTopColor: THEME.textPrimary, marginBottom: 4 }} />
            <Text style={{ ...S.sigName, textAlign: 'center' }}>{d.rthNome ?? perfil?.nome ?? 'Profissional Responsável'}</Text>
            {d.rthProfissao && <Text style={{ ...S.sigSub, textAlign: 'center' }}>{d.rthProfissao}</Text>}
            {d.rthCrea ? <Text style={{ ...S.sigSub, textAlign: 'center' }}>CREA: {d.rthCrea}</Text> : <Text style={{ ...S.sigSub, textAlign: 'center' }}>CREA: —</Text>}
            <Text style={{ ...S.sigSub, textAlign: 'center' }}>PLH — Responsável Técnico pela Inspeção NR-13</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
