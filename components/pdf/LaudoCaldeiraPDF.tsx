/**
 * Template PDF — Laudo de Inspeção de Caldeiras (NR-13 / ASME Sec. I)
 * - Usa Helvetica embutida (sem dependência de rede)
 * - Interface alinhada com FormInspecaoCaldeira e /api/caldeira-pdf
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
// Tema visual — consistente com LaudoNR13PDF
// ---------------------------------------------------------------------------
const C = {
  primary:    '#ea580c',   // Laranja — identidade caldeiras
  dark:       '#c2410c',
  text:       '#1e293b',
  muted:      '#64748b',
  border:     '#e2e8f0',
  bg:         '#fafafa',
  white:      '#ffffff',
  success:    '#166534',
  successBg:  '#dcfce7',
  danger:     '#be123c',
  dangerBg:   '#ffe4e6',
  warn:       '#b45309',
  warnBg:     '#fef3c7',
  cardBg:     '#f8fafc',
  accent:     '#334155',
  borderLight:'#f1f5f9',
}

// ---------------------------------------------------------------------------
// Stylesheet
// ---------------------------------------------------------------------------
const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: C.white,
    color: C.text,
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 0,
  },
  pg: { marginHorizontal: 40 },

  // Header fixo
  header: {
    position: 'absolute', top: 18, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    borderBottomWidth: 2, borderBottomColor: C.primary, paddingBottom: 8,
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.text },
  headerSub:   { fontSize: 7.5, color: C.muted, marginTop: 2 },

  // Footer fixo
  footer: {
    position: 'absolute', bottom: 18, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6,
  },
  footerText: { fontSize: 7, color: C.muted },

  // Títulos de seção
  sectionTitle: {
    fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.white,
    backgroundColor: C.primary, paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 8, marginTop: 14,
  },

  // Grid de campos
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  cell2: { width: '48%', marginBottom: 6 },
  cell3: { width: '31%', marginBottom: 6 },
  label: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.muted, marginBottom: 2, textTransform: 'uppercase' },
  value: { fontSize: 9.5, color: C.text },

  // Caixa de alerta
  alertBox: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 4, marginBottom: 8,
  },
  alertText: { fontSize: 10, fontFamily: 'Helvetica-Bold' },

  // Checklist
  checkRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 5, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  checkLabel: { fontSize: 9, color: C.text, flex: 1 },
  checkBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    fontSize: 8, fontFamily: 'Helvetica-Bold',
  },

  // PMTA destaque
  pmtaCard: {
    backgroundColor: C.primary,
    borderRadius: 6, padding: 10, marginTop: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pmtaLabel: { fontSize: 9, color: C.white, fontFamily: 'Helvetica-Bold' },
  pmtaValue: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.white },

  // Corrosão
  corrCard: {
    backgroundColor: C.warnBg, borderRadius: 6, padding: 8, marginTop: 6,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },

  // Parecer
  parecerBox: {
    backgroundColor: C.cardBg, borderRadius: 6, padding: 12,
    borderLeftWidth: 4, borderLeftColor: C.primary, marginTop: 4,
  },
  parecerText: { fontSize: 9.5, color: C.text, lineHeight: 1.6, textAlign: 'justify' },

  // NC
  ncRow: {
    flexDirection: 'column',
    padding: 8, borderRadius: 4, marginBottom: 6,
    borderWidth: 1, borderColor: C.border,
  },
  ncRowHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 4,
  },
  ncGrauBadge: {
    width: 56, paddingVertical: 2, borderRadius: 3, marginRight: 8,
    fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white, textAlign: 'center',
  },
  ncText: { fontSize: 8.5, color: C.text },

  // Assinatura
  signBox: {
    marginTop: 40, alignItems: 'center',
  },
  signLine: {
    width: 240, borderTopWidth: 1, borderTopColor: C.text, marginBottom: 5,
  },
  signName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.text },
  signSub:  { fontSize: 8.5, color: C.muted, marginTop: 2 },

  // Fotos
  fotoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  fotoBox:  { width: '48%', borderRadius: 4, overflow: 'hidden', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  fotoCaption: { fontSize: 7, color: '#64748b', textAlign: 'center', padding: 3 },

  // Capa — consistente com LaudoNR13PDF
  coverRoot:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  coverGrid:     { width: '100%', maxWidth: 400, paddingTop: 30, borderTopWidth: 1, borderTopColor: C.borderLight },
  coverRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  coverLbl:      { fontSize: 9, color: C.muted, textTransform: 'uppercase' },
  coverValor:    { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.text },
  coverTitle:    { fontSize: 26, fontFamily: 'Helvetica-Bold', color: C.text, textAlign: 'center', marginBottom: 14 },
  coverSubtitle: { fontSize: 12, color: C.muted, textAlign: 'center', maxWidth: 400, marginBottom: 40, lineHeight: 1.5 },
})

// ---------------------------------------------------------------------------
// Helpers de dimensão de imagem
// ---------------------------------------------------------------------------

/**
 * Calcula a altura ideal de uma imagem preservando aspect ratio dentro
 * de um container de largura conhecida.
 * @param dims - Dimensões reais da imagem {width, height}
 * @param containerWidth - Largura disponível em pontos PDF
 * @param maxHeight - Altura máxima permitida (evita fotos muito altas)
 */
function calcImageHeight(
  dims: { width: number; height: number } | undefined,
  containerWidth: number,
  maxHeight: number = 300
): number {
  if (!dims || dims.width === 0) return maxHeight
  const ratio = dims.height / dims.width
  const natural = containerWidth * ratio
  return Math.min(natural, maxHeight)
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface LaudoCaldeiraPDFProps {
  dados: Record<string, any>
  perfil?: Record<string, any>
  fotosUrl?: Record<string, string>
  /** Dimensões reais (px) de cada imagem — chave idêntica à de fotosUrl */
  fotoDimensoes?: Record<string, { width: number; height: number }>
  cliente?: Record<string, any>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function badgeStatus(status: string) {
  if (status === 'Aprovado') return { bg: C.successBg, color: C.success }
  if (status?.includes('Restrições')) return { bg: C.warnBg, color: C.warn }
  return { bg: C.dangerBg, color: C.danger }
}

function badgeCheck(valor: string) {
  if (valor === 'Conforme' || valor === 'Disponível') return { bg: C.successBg, color: C.success }
  if (valor === 'Inexistente' || valor === 'Não Conforme') return { bg: C.dangerBg, color: C.danger }
  return { bg: C.warnBg, color: C.warn }
}

function formatDate(d?: string) {
  if (!d) return '—'
  try { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') }
  catch { return d }
}

function CheckRow({ label, valor }: { label: string; valor: string }) {
  const { bg, color } = badgeCheck(valor)
  return (
    <View style={S.checkRow}>
      <Text style={S.checkLabel}>{label}</Text>
      <Text style={[S.checkBadge, { backgroundColor: bg, color }]}>{valor || '—'}</Text>
    </View>
  )
}

function Campo({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <View style={S.cell2}>
      <Text style={S.label}>{label}</Text>
      <Text style={S.value}>{value ?? '—'}</Text>
    </View>
  )
}

function Campo3({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <View style={S.cell3}>
      <Text style={S.label}>{label}</Text>
      <Text style={S.value}>{value ?? '—'}</Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function LaudoCaldeiraPDF({ dados, perfil, fotosUrl = {}, fotoDimensoes = {}, cliente }: LaudoCaldeiraPDFProps) {
  const d = dados
  const statusColors = badgeStatus(d.statusFinal)
  const ncs: any[] = d.naoConformidades ?? []
  const logoUrl: string | null = perfil?._logoPublicUrl ?? null
  const fmt = (dt: string | undefined) => dt ? new Date(dt + 'T00:00:00').toLocaleDateString('pt-BR') : '—'

  // Fotos do exame interno
  const fotosInterno = Object.entries(fotosUrl)
    .filter(([k]) => k.startsWith('interno_'))
    .map(([k, url]) => ({ key: k, url }))

  return (
    <Document title={`Inspeção NR-13 — Caldeira ${d.tag ?? ''}`} author={perfil?.nome ?? d.rthNome}>

      {/* ======================== CAPA ======================== */}
      <Page size="A4" style={S.page}>
        <View style={S.coverRoot}>

          {/* Logo da empresa */}
          {logoUrl ? (
            <View style={{ marginBottom: 20, alignItems: 'center' }}>
              <PDFImage src={logoUrl} style={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain' }} />
            </View>
          ) : null}

          <Text style={S.coverTitle}>Laudo Técnico NR-13</Text>
          <Text style={S.coverSubtitle}>
            Documento de avaliação técnica de integridade mecânica e conformidade de caldeira a vapor estacionária, em conformidade com a NR-13 e o Código ASME Sec. I.
          </Text>

          <View style={S.coverGrid}>
            <View style={{ flexDirection: 'column', gap: 0, width: '100%' }}>
              <View style={S.coverRow}>
                <Text style={S.coverLbl}>TAG do Equipamento</Text>
                <Text style={S.coverValor}>{d.tag ?? '—'}</Text>
              </View>
              <View style={S.coverRow}>
                <Text style={S.coverLbl}>Fabricante</Text>
                <Text style={S.coverValor}>{d.fabricante ?? '—'}</Text>
              </View>
              <View style={S.coverRow}>
                <Text style={S.coverLbl}>Ano de Fabricação</Text>
                <Text style={S.coverValor}>{d.anoFabricacao ?? '—'}</Text>
              </View>
              <View style={S.coverRow}>
                <Text style={S.coverLbl}>Categoria NR-13</Text>
                <Text style={S.coverValor}>Categoria {d.categoria ?? '—'}</Text>
              </View>
              <View style={S.coverRow}>
                <Text style={S.coverLbl}>Empresa Inspecionada</Text>
                <Text style={S.coverValor}>{cliente?.razao_social ?? d.empresaInspecionada ?? '—'}</Text>
              </View>
              <View style={S.coverRow}>
                <Text style={S.coverLbl}>Localidade</Text>
                <Text style={S.coverValor}>
                  {cliente?.cidade ?? d.cidadeInspecionada ?? '—'} / {cliente?.estado ?? d.estadoInspecionado ?? '—'}
                </Text>
              </View>
              <View style={S.coverRow}>
                <Text style={S.coverLbl}>Data da Inspeção</Text>
                <Text style={S.coverValor}>{fmt(d.dataInspecao)}</Text>
              </View>
              <View style={S.coverRow}>
                <Text style={S.coverLbl}>Tipo de Inspeção</Text>
                <Text style={S.coverValor}>{d.tipoInspecao ?? '—'}</Text>
              </View>
              <View style={S.coverRow}>
                <Text style={S.coverLbl}>Responsável Técnico</Text>
                <Text style={S.coverValor}>{d.rthNome ?? perfil?.nome ?? '—'}</Text>
              </View>
            </View>
          </View>

        </View>
      </Page>

      {/* ================================================================
          PÁGINA 2 — IDENTIFICAÇÃO E CHECKLIST
      ================================================================ */}
      <Page size="A4" style={S.page}>

        {/* Header fixo */}
        <View style={S.header} fixed>
          <View style={S.headerLeft}>
            <Text style={S.headerTitle}>LAUDO DE INSPEÇÃO — CALDEIRA A VAPOR</Text>
            <Text style={S.headerSub}>NR-13 (MTE/SIT) · ASME Section I · {d.codigoProjeto ?? ''}</Text>
          </View>
          {logoUrl && (
            <PDFImage src={logoUrl} style={{ height: 24, maxWidth: 80, objectFit: 'contain' }} />
          )}
        </View>

        <View style={S.pg}>

          {/* Status */}
          <View style={[S.alertBox, { backgroundColor: statusColors.bg, marginTop: 4 }]}>
            <Text style={[S.alertText, { color: statusColors.color }]}>
              STATUS: {d.statusFinal?.toUpperCase() ?? 'N/D'}
              {d.rgiAtivo ? '  ⚠️ RISCO GRAVE E IMINENTE ATIVO' : ''}
            </Text>
          </View>

          {/* Seção 1: Identificação da Caldeira */}
          <Text style={S.sectionTitle}>1. IDENTIFICAÇÃO DA CALDEIRA</Text>
          <View style={S.grid2}>
            <Campo label="TAG" value={d.tag} />
            <Campo label="Fabricante" value={d.fabricante} />
            <Campo label="Número de Série" value={d.numeroSerie} />
            <Campo label="Ano de Fabricação" value={d.anoFabricacao} />
            <Campo label="Categoria NR-13" value={`Categoria ${d.categoria}`} />
            <Campo label="Código de Projeto" value={d.codigoProjeto} />
            <Campo label="PMTA de Fábrica (kgf/cm²)" value={d.pmtaFabricante ? `${Number(d.pmtaFabricante).toFixed(2)} kgf/cm²` : '—'} />
            <Campo label="Capacidade de Produção" value={d.capacidadeProducao ? `${d.capacidadeProducao} kg/h` : '—'} />
          </View>

          {/* Seção 2: Dados da Inspeção */}
          <Text style={S.sectionTitle}>2. DADOS DA INSPEÇÃO</Text>
          <View style={S.grid2}>
            <Campo label="Data da Inspeção" value={formatDate(d.dataInspecao)} />
            <Campo label="Data de Emissão" value={formatDate(d.dataEmissaoLaudo)} />
            <Campo label="Tipo de Inspeção" value={d.tipoInspecao} />
            <Campo label="Ambiente" value={d.ambiente} />
            <Campo label="Pressão de Operação (kgf/cm²)" value={d.pressaoOperacao ? `${Number(d.pressaoOperacao).toFixed(2)} kgf/cm²` : '—'} />
            <Campo label="PSV — Pressão de Calibração (kgf/cm²)" value={d.psvCalibracao ? `${Number(d.psvCalibracao).toFixed(2)} kgf/cm²` : '—'} />
          </View>

          {/* Seção 3: Checklist NR-13 */}
          <Text style={S.sectionTitle}>3. AUDITORIA NORMATIVA (NR-13 §13.4)</Text>
          <CheckRow label="Válvulas de Segurança e Alívio (PSV/VSA)" valor={d.valvulaSeguranca ?? d.teste_hidrostatico ?? '—'} />
          <CheckRow label="Controle de Nível Automático e Intertravamento (§13.4.1.2)" valor={d.controleNivel ?? '—'} />
          <CheckRow label="Distanciamento da Casa de Caldeiras ≥ 3 m (§13.4.2.1)" valor={d.distanciaInstalacao ?? '—'} />
          <CheckRow label="Iluminação de Emergência (§13.4.2.2)" valor={d.iluminacaoEmergencia ?? '—'} />
          <CheckRow label="Gestão de Qualidade da Água (§13.4.3)" valor={d.qualidadeAgua ?? '—'} />
          <CheckRow label="Certificação do Operador de Caldeira (§13.4.4)" valor={d.certificacaoOperador ?? '—'} />
          <CheckRow label="Manual de Operação em Português (§13.4.5)" valor={d.manualOperacao ?? '—'} />
          <CheckRow label="Exame Externo" valor={d.exameExterno ?? '—'} />
          <CheckRow label="Exame Interno" valor={d.exameInterno ?? '—'} />

        </View>

        {/* Footer fixo */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>
            Laudo de Integridade — Caldeira TAG: {d.tag} · NR-13 / ASME Sec. I
          </Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Pág. ${pageNumber}/${totalPages}`} />
        </View>
      </Page>

      {/* ================================================================
          PÁGINA 2 — CÁLCULO ASME E PMTA
      ================================================================ */}
      <Page size="A4" style={S.page}>

        <View style={S.header} fixed>
          <View style={S.headerLeft}>
            <Text style={S.headerTitle}>MEMÓRIA DE CÁLCULO — PMTA (ASME Section I)</Text>
            <Text style={S.headerSub}>TAG: {d.tag}  ·  Data: {formatDate(d.dataInspecao)}</Text>
          </View>
          {logoUrl && (
            <PDFImage src={logoUrl} style={{ height: 24, maxWidth: 80, objectFit: 'contain' }} />
          )}
        </View>

        <View style={S.pg}>

          <Text style={S.sectionTitle}>4. PARÂMETROS DE CÁLCULO — ASME SECTION I</Text>
          <View style={S.grid2}>
            <Campo label="Material / Norma" value={d.normaCalc} />
            <Campo label="Tensão Admissível [S]" value={`${d.S} MPa`} />
            <Campo label="Eficiência de Junta [E]" value={`${d.E}`} />
            <Campo label="Diâmetro Interno da Carcaça [D]" value={`${d.D} mm`} />
            <Campo label="Espessura Costado Medida" value={`${d.espessuraCostado} mm`} />
            <Campo label="Espessura Costado Anterior" value={`${d.espessuraCostadoAnterior} mm`} />
            <Campo label="Espessura Espelho Plano" value={`${d.espessuraEspelho} mm`} />
            <Campo label="Intervalo entre Inspeções" value={`${d.mesesEntreInspecoes} meses`} />
          </View>
          {/* Destaque especial para `d` — variável mais comum de ser confundida com D */}
          <View style={{ backgroundColor: C.warnBg, borderRadius: 4, padding: 8, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: C.warn }}>
            <Text style={[S.label, { color: C.warn, marginBottom: 2 }]}>
              MAIOR DISTÂNCIA ENTRE SUPORTES — d (ASME PG-31)
            </Text>
            <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.warn }}>
              {d.dEspelho ?? d.d_espelho_mm ?? '—'} mm
            </Text>
            <Text style={{ fontSize: 7.5, color: C.warn, marginTop: 2 }}>
              Maior vão livre entre centros de tubos de fogo ou estroncas · C = 0,33 (fixo — espelho soldado)
            </Text>
          </View>

          {/* Taxa de corrosão */}
          <View style={S.corrCard}>
            <View>
              <Text style={[S.label, { color: C.warn }]}>Taxa de Corrosão Média</Text>
              <Text style={{ fontSize: 8.5, color: C.warn }}>Costado: {d.espessuraCostadoAnterior} → {d.espessuraCostado} mm em {d.mesesEntreInspecoes} meses</Text>
            </View>
            <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.warn }}>
              {d.taxaCorrosao !== undefined ? Number(d.taxaCorrosao).toFixed(3) : '—'} mm/ano
            </Text>
          </View>

          {/* Resultados PMTA */}
          <Text style={[S.sectionTitle, { marginTop: 16 }]}>5. RESULTADO — PMTA CALCULADA</Text>

          {/* Todos os valores chegam em kgf/cm² — exibir diretamente */}
          <View style={S.grid2}>
            <Campo label="PMTA Costado Cilíndrico (PG-27.2.2)" value={d.pmtaCostado !== undefined ? `${Number(d.pmtaCostado).toFixed(2)} kgf/cm²` : '—'} />
            <Campo label="PMTA Espelho Plano (PG-31)" value={d.pmtaEspelho !== undefined ? `${Number(d.pmtaEspelho).toFixed(2)} kgf/cm²` : '—'} />
          </View>

          <View style={S.pmtaCard}>
            <View>
              <Text style={S.pmtaLabel}>PMTA EFETIVA — COMPONENTE LIMITANTE: {d.componenteFragil?.toUpperCase() ?? 'COSTADO'}</Text>
              <Text style={{ fontSize: 8, color: C.white, marginTop: 2 }}>
                PSV Calibração: {d.psvCalibracao ? `${Number(d.psvCalibracao).toFixed(2)} kgf/cm²` : '—'}  ·  PMTA de Fábrica: {d.pmtaFabricante ? `${Number(d.pmtaFabricante).toFixed(2)} kgf/cm²` : '—'}
              </Text>
            </View>
            <Text style={S.pmtaValue}>
              {d.pmtaLimitante !== undefined ? `${Number(d.pmtaLimitante).toFixed(2)} kgf/cm²` : '—'}
            </Text>
          </View>

          {/* PMTA PLH */}
          <View style={{ marginTop: 8, padding: 8, backgroundColor: C.cardBg, borderRadius: 4, borderWidth: 1, borderColor: C.border }}>
            <Text style={[S.label, { marginBottom: 2 }]}>PMTA Fixada pelo PLH (Profissional Legalmente Habilitado)</Text>
            <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.primary }}>
              {d.pmtaPlh
                ? `${Number(d.pmtaPlh).toFixed(2)} kgf/cm²`
                : `${d.pmtaLimitante !== undefined ? Number(d.pmtaLimitante).toFixed(2) : '—'} kgf/cm²`}
            </Text>
          </View>

          {/* Cronograma */}
          <Text style={[S.sectionTitle, { marginTop: 16 }]}>6. CRONOGRAMA DE INSPEÇÕES PERIÓDICAS (NR-13 QUADRO XIII)</Text>
          <View style={S.grid2}>
            <Campo label="Próxima Inspeção Externa" value={formatDate(d.dataProximaInspExterna)} />
            <Campo label="Próxima Inspeção Interna" value={formatDate(d.dataProximaInspInterna)} />
            <Campo label="Próximo Teste de Dispositivos" value={formatDate(d.dataProximoTesteDisp)} />
            <Campo label="Categoria (Intervalo Referência)" value={`Cat. ${d.categoria} — Ext. ${d.categoria === 'A' || d.categoria === 'C' ? '1' : '2'} ano(s) / Int. ${d.categoria === 'A' || d.categoria === 'C' ? '2' : '4'} anos`} />
          </View>

        </View>

        <View style={S.footer} fixed>
          <Text style={S.footerText}>Laudo de Integridade — Caldeira TAG: {d.tag} · NR-13 / ASME Sec. I</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Pág. ${pageNumber}/${totalPages}`} />
        </View>
      </Page>

      {/* ================================================================
          PÁGINA 3 — NCs, PARECER E ASSINATURA
      ================================================================ */}
      <Page size="A4" style={S.page}>

        <View style={S.header} fixed>
          <View style={S.headerLeft}>
            <Text style={S.headerTitle}>PARECER TÉCNICO E NÃO CONFORMIDADES</Text>
            <Text style={S.headerSub}>TAG: {d.tag}  ·  Data: {formatDate(d.dataInspecao)}</Text>
          </View>
          {logoUrl && (
            <PDFImage src={logoUrl} style={{ height: 24, maxWidth: 80, objectFit: 'contain' }} />
          )}
        </View>

        <View style={S.pg}>

          {/* NCs */}
          <Text style={S.sectionTitle}>7. NÃO CONFORMIDADES (NR-13 §13.5.4.11j)</Text>
          {ncs.length === 0 ? (
            <View style={[S.checkRow, { justifyContent: 'center', paddingVertical: 10 }]}>
              <Text style={{ fontSize: 9, color: C.muted }}>Nenhuma não conformidade registrada.</Text>
            </View>
          ) : (
            ncs.map((nc, i) => {
              const ncBg = nc.grauRisco === 'Crítico' ? '#dc2626' : nc.grauRisco === 'Moderado' ? '#d97706' : '#2563eb'
              return (
                <View key={i} style={S.ncRow} wrap={false}>
                  {/* Linha de cabeçalho: badge + título */}
                  <View style={S.ncRowHeader}>
                    <Text style={[S.ncGrauBadge, { backgroundColor: ncBg }]}>{nc.grauRisco}</Text>
                    <Text style={[S.ncText, { fontFamily: 'Helvetica-Bold', flex: 1 }]}>
                      {nc.descricao}{'  '}
                      <Text style={{ fontFamily: 'Helvetica', color: C.muted }}>({nc.refNR13})</Text>
                    </Text>
                  </View>
                  {/* Ação corretiva */}
                  <Text style={[S.ncText, { color: C.muted, marginBottom: 2 }]}>
                    → {nc.acaoCorretiva}
                  </Text>
                  {/* Prazo e responsável */}
                  <Text style={[S.ncText, { color: C.muted }]}>
                    Prazo: {nc.prazo} dias  ·  Resp.: {nc.responsavel || '—'}
                  </Text>
                </View>
              )
            })
          )}

          {/* Fotos exame interno — dimensão adaptativa */}
          {fotosInterno.length > 0 && (
            <>
              {/* Título ancorado à 1ª linha de fotos — impede quebra de página entre label e imagem */}
              <View wrap={false}>
                <Text style={[S.sectionTitle, { marginTop: 16 }]}>8. EVIDÊNCIAS FOTOGRÁFICAS — EXAME INTERNO</Text>
                <View style={S.fotoGrid}>
                  {fotosInterno.slice(0, fotosInterno.length === 1 ? 1 : 2).map(({ key, url }, i) => {
                    const dims = fotoDimensoes[key]
                    const containerW = fotosInterno.length === 1 ? 475 : 235
                    const h = calcImageHeight(dims, containerW, 320)
                    const w = fotosInterno.length === 1 ? '100%' : '48%'
                    return (
                      <View key={i} style={[S.fotoBox, { width: w }]} wrap={false}>
                        <PDFImage src={url} style={{ width: '100%', height: h, objectFit: 'contain' }} />
                        <Text style={S.fotoCaption}>Exame Interno — Foto {i + 1}</Text>
                      </View>
                    )
                  })}
                </View>
              </View>
              {/* Fotos restantes (3ª em diante) fluem livremente entre páginas */}
              {fotosInterno.length > 2 && (
                <View style={S.fotoGrid}>
                  {fotosInterno.slice(2, 6).map(({ key, url }, i) => {
                    const dims = fotoDimensoes[key]
                    const h = calcImageHeight(dims, 235, 320)
                    return (
                      <View key={i + 2} style={[S.fotoBox, { width: '48%' }]} wrap={false}>
                        <PDFImage src={url} style={{ width: '100%', height: h, objectFit: 'contain' }} />
                        <Text style={S.fotoCaption}>Exame Interno — Foto {i + 3}</Text>
                      </View>
                    )
                  })}
                </View>
              )}
            </>
          )}

          {/* Fotos dos demais grupos de checklist */}
          {(() => {
            const gruposChecklist = [
              { prefixo: 'valvulas_',         label: 'Válvulas de Segurança' },
              { prefixo: 'nivel_',            label: 'Controle de Nível' },
              { prefixo: 'distanciaInstalacao_', label: 'Distanciamento' },
              { prefixo: 'iluminacao_',       label: 'Iluminação de Emergência' },
              { prefixo: 'qualidadeAgua_',    label: 'Qualidade da Água' },
              { prefixo: 'certificacaoOperador_', label: 'Certificação do Operador' },
            ]
            const fotosPorGrupo = gruposChecklist
              .map(g => ({
                label: g.label,
                fotos: Object.entries(fotosUrl)
                  .filter(([k]) => k.startsWith(g.prefixo))
                  .map(([k, url]) => ({ key: k, url })),
              }))
              .filter(g => g.fotos.length > 0)

            if (fotosPorGrupo.length === 0) return null
            const sectionNum = fotosInterno.length > 0 ? '9' : '8'
            return (
              <>
                <Text style={[S.sectionTitle, { marginTop: 16 }]}>{sectionNum}. EVIDÊNCIAS FOTOGRÁFICAS — CHECKLIST NR-13</Text>
                {fotosPorGrupo.map((grupo, gi) => (
                  <View key={gi} wrap={false} style={{ marginBottom: 10 }}>
                    <Text style={[S.label, { marginBottom: 4, color: C.primary }]}>{grupo.label}</Text>
                    <View style={S.fotoGrid}>
                      {grupo.fotos.slice(0, 4).map(({ key, url }, i) => {
                        const dims = fotoDimensoes[key]
                        const containerW = grupo.fotos.length === 1 ? 475 : 235
                        const h = calcImageHeight(dims, containerW, 200)
                        const w = grupo.fotos.length === 1 ? '100%' : '48%'
                        return (
                          <View key={i} style={[S.fotoBox, { width: w }]} wrap={false}>
                            <PDFImage src={url} style={{ width: '100%', height: h, objectFit: 'contain' }} />
                            <Text style={S.fotoCaption}>{grupo.label} — Foto {i + 1}</Text>
                          </View>
                        )
                      })}
                    </View>
                  </View>
                ))}
              </>
            )
          })()}

          {/* Parecer */}
          <Text style={[S.sectionTitle, { marginTop: 16 }]}>{
            (() => {
              let n = 8
              if (fotosInterno.length > 0) n++
              const hasChecklist = Object.keys(fotosUrl).some(k =>
                ['valvulas_','nivel_','distanciaInstalacao_','iluminacao_','qualidadeAgua_','certificacaoOperador_']
                  .some(p => k.startsWith(p))
              )
              if (hasChecklist) n++
              return n
            })()
          }. PARECER TÉCNICO CONCLUSIVO</Text>
          <View style={S.parecerBox}>
            <Text style={S.parecerText}>
              {d.parecerTecnico ||
                `A Caldeira identificada pela TAG "${d.tag ?? '—'}", categoria NR-13 ${d.categoria ?? '—'}, foi submetida a inspeção ${d.tipoInspecao?.toLowerCase() ?? 'periódica'} em ${formatDate(d.dataInspecao)}, resultando no status de INTEGRIDADE: ${d.statusFinal ?? 'Aprovado'}. A PMTA calculada pelo método ASME Sec. I é de ${d.pmtaLimitante !== undefined ? Number(d.pmtaLimitante).toFixed(2) : '—'} kgf/cm², limitada pelo componente ${d.componenteFragil ?? 'costado'}.`
              }
            </Text>
          </View>

          {/* Assinatura */}
          <View style={S.signBox}>
            <View style={S.signLine} />
            <Text style={S.signName}>{d.rthNome || perfil?.nome || 'Profissional Legalmente Habilitado'}</Text>
            <Text style={S.signSub}>{d.rthProfissao || 'Engenheiro Mecânico'}</Text>
            <Text style={S.signSub}>CREA/CRAM: {d.rthCrea || perfil?.crea || '—'}</Text>
            <Text style={S.signSub}>Responsável Técnico — NR-13 / ASME Sec. I</Text>
          </View>

        </View>

        <View style={S.footer} fixed>
          <Text style={S.footerText}>Laudo de Integridade — Caldeira TAG: {d.tag} · NR-13 / ASME Sec. I</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Pág. ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
