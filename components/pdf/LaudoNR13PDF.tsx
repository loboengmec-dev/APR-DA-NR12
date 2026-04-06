/**
 * Relatório de Inspeção de Vaso de Pressão — NR-13 (ASME Sec VIII Div 1)
 * Totalmente isolado do módulo NR-12.
 * Usa Fontes Helvetica embutidas (não requer rede).
 */
import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

// ---------------------------------------------------------------------------
// Tema visual — Slate palette, acentos azul-profissional para NR-13
// ---------------------------------------------------------------------------
const T = {
  bg:          '#f8fafc',
  cardBg:      '#ffffff',
  textPrimary: '#1e293b',
  textSec:     '#64748b',
  border:      '#e2e8f0',
  borderLight: '#f1f5f9',
  accent:      '#1e40af',
  accentLight: '#dbeafe',
  amber:       '#b45309',
  amberLight:  '#fef3c7',
  emerald:     '#166534',
  emeraldLight:'#dcfce7',
  red:         '#dc2626',
  redLight:    '#fee2e2',
  grey:        '#f1f5f9',
}

// ---------------------------------------------------------------------------
// Stylesheet
// ---------------------------------------------------------------------------
const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', fontSize: 10, backgroundColor: T.cardBg,
    color: T.textPrimary, paddingTop: 60, paddingBottom: 50, paddingHorizontal: 0,
  },
  pg: { marginHorizontal: 40 },

  // Header / Footer fixo
  header: {
    position: 'absolute', top: 20, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    borderBottomWidth: 1, borderBottomColor: T.borderLight, paddingBottom: 8,
  },
  headerTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: T.accent },
  headerSub:   { fontSize: 7, color: T.textSec, marginTop: 2 },
  footer: {
    position: 'absolute', bottom: 20, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: T.border, paddingTop: 6,
  },
  footerText: { fontSize: 7, color: T.textSec },

  h1: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: T.textPrimary, marginBottom: 4 },
  h2: {
    fontSize: 13, fontFamily: 'Helvetica-Bold', color: T.accent, marginBottom: 8, marginTop: 14,
    borderBottomWidth: 1, borderBottomColor: T.borderLight, paddingBottom: 4,
  },
  h3: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: T.textPrimary, marginBottom: 6, marginTop: 8 },
  p:  { fontSize: 9, color: T.textSec, lineHeight: 1.6, marginBottom: 8, textAlign: 'justify' },

  card:    { backgroundColor: T.bg, borderRadius: 8, padding: 16, marginBottom: 16 },
  tblHeader: {
    flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 2,
    borderBottomColor: T.border, backgroundColor: T.accent,
  },
  tblHdr: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#ffffff', flex: 1, paddingHorizontal: 4 },
  tblRow:  { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: T.borderLight, paddingVertical: 7 },
  tblRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: T.borderLight, paddingVertical: 7, backgroundColor: T.grey },
  tblCell: { fontSize: 8, flex: 1, paddingHorizontal: 4, color: T.textSec },
  tblCellH: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: T.textPrimary, flex: 1, paddingHorizontal: 4 },

  badgeOK:   { backgroundColor: T.emeraldLight, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, flexDirection: 'row', alignItems: 'center' },
  badgeWarn: { backgroundColor: T.amberLight, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  badgeErr:  { backgroundColor: T.redLight,    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  badgeTxt:  { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },

  kpiRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  kpi:    {
    flex: 1, backgroundColor: T.cardBg, padding: 10, borderRadius: 6, borderWidth: 1,
    borderColor: T.borderLight,
  },

  sigBox:        { marginTop: 40, alignItems: 'flex-end' },
  sigLine:       { borderTopWidth: 1, borderTopColor: T.textPrimary, width: 200, marginBottom: 4 },
  sigName:       { fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'center', width: 200 },
  sigSub:        { fontSize: 8, color: T.textSec, textAlign: 'center', width: 200 },

  coverRoot:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  coverBadge:    { backgroundColor: T.bg, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 4, marginBottom: 20 },
  coverBadgeTxt: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: T.accent, letterSpacing: 1 },
  coverTitle:    { fontSize: 26, fontFamily: 'Helvetica-Bold', color: T.textPrimary, textAlign: 'center', marginBottom: 14 },
  coverSubtitle: { fontSize: 11, color: T.textSec, textAlign: 'center', maxWidth: 380, marginBottom: 40, lineHeight: 1.5 },
  coverGrid:     { width: '100%', maxWidth: 380, paddingTop: 30, borderTopWidth: 1, borderTopColor: T.borderLight },
  coverMetaRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  coverLbl:      { fontSize: 9, color: T.textSec, textTransform: 'uppercase' },
  coverVal:      { fontSize: 11, fontFamily: 'Helvetica-Bold', color: T.textPrimary },

  checkLine:     { flexDirection: 'row', alignItems: 'center', marginBottom: 4, paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: T.borderLight },
  dotOK:         { width: 7, height: 7, borderRadius: 3, backgroundColor: T.emerald, marginRight: 6 },
  dotNO:         { width: 7, height: 7, borderRadius: 3, backgroundColor: T.red,     marginRight: 6 },
  dotNA:         { width: 7, height: 7, borderRadius: 3, backgroundColor: T.textSec, marginRight: 6 },
  checkTxt:      { fontSize: 8, flex: 1 },
  checkRef:      { fontSize: 7, color: T.textSec, width: 100, textAlign: 'right' },

  dispCard:      { backgroundColor: T.bg, borderRadius: 6, padding: 10, marginBottom: 6 },
  dispTag:       { fontSize: 9, fontFamily: 'Helvetica-Bold', color: T.accent },
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STATUS_BADGE = (status: string) => {
  const s = status?.toLowerCase() ?? ''
  if (s.includes('aprovado') && !s.includes('restri'))
    return { style: S.badgeOK, color: T.emerald, text: 'Aprovado' }
  if (s.includes('restri'))
    return { style: S.badgeWarn, color: T.amber, text: 'Com Restrições' }
  if (s.includes('reprovado') || s.includes('interditado') || s === 'condenado' || s === 'downgrade_necessario')
    return { style: S.badgeErr, color: T.red, text: status.replace(/_/g, ' ') }
  return { style: S.badgeWarn, color: T.amber, text: status || '—' }
}

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------------
interface LaudoNR13PDFProps {
  dados: Record<string, any>
  perfil?: Record<string, any>
}

export default function LaudoNR13PDF({ dados, perfil }: LaudoNR13PDFProps) {
  const d = dados ?? {}
  const hoje = new Date().toLocaleDateString('pt-BR')
  const fmt = (dt: string | null | undefined) => dt ? new Date(dt + 'T00:00:00').toLocaleDateString('pt-BR') : '—'

  const Header = () => (
    <View style={S.header} fixed>
      <View>
        <Text style={S.headerTitle}>Relatório de Inspeção — NR-13 (Vaso de Pressão)</Text>
        <Text style={S.headerSub}>{d.tag ?? '—'} | {d.fabricante ?? '—'}</Text>
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
        Inspecao NR-13 | {perfil?.nome ?? '—'}
        {perfil?.crea ? ` | CREA: ${perfil.crea}` : ''}
      </Text>
      <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} / ${totalPages}`} />
    </View>
  )

  // =====================================================================
  return (
    <Document title={`Inspecao NR-13 - ${d.tag ?? 'Vaso de Pressao'}`} author={perfil?.nome}>

      {/* ======================== CAPA ======================== */}
      <Page size="A4" style={S.page}>
        <View style={S.coverRoot}>
          <View style={S.coverBadge}><Text style={S.coverBadgeTxt}>NR-13 — ASME Sec VIII Div 1</Text></View>
          <Text style={S.coverTitle}>Relatorio de Inspecao de Vaso de Pressao</Text>
          <Text style={S.coverSubtitle}>
            Avaliacao de integridade mecanica, recalculo de PMTA conforme Codigo ASME e
            verificacao de conformidade com a NR-13 para vasos de pressao estacionarios.
          </Text>

          <View style={S.coverGrid}>
            {[
              ['TAG',                d.tag],
              ['Fabricante',         d.fabricante],
              ['Nº de Série',        d.numeroSerie],
              ['Ano de Fabricação',  d.anoFabricacao],
              ['Código de Projeto',  d.codigoProjeto],
              ['Fluido de Serviço',  d.fluidoServico],
              ['Classe do Fluido',   d.fluidoClasse],
              ['Categoria do Vaso',  d.categoriaVaso],
              ['Tipo de Inspeção',   d.tipoInspecao],
              ['Data da Inspeção',   fmt(d.dataInspecao)],
              ['Responsável',        perfil?.nome ?? d.rthNome],
            ].map(([l, v]) => (
              <View key={l} style={S.coverMetaRow}>
                <Text style={S.coverLbl}>{l}</Text>
                <Text style={S.coverVal}>{v ?? '—'}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>

      {/* ====================== DADOS GERAIS + CATEGORIZAÇÃO ====================== */}
      <Page size="A4" style={S.page}>
        <Header /><Footer />
        <View style={S.pg}>

          <Text style={[S.h2, { marginTop: 0 }]}>1. Identificação do Vaso de Pressão</Text>
          <View style={S.card}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
              {[
                ['TAG', d.tag], ['Fabricante', d.fabricante], ['Nº Série', d.numeroSerie],
                ['Ano', d.anoFabricacao], ['Tipo', d.tipoVaso], ['Cód. Projeto', d.codigoProjeto],
                ['PMTA Fabricante', d.pmtaFabricante ? `${d.pmtaFabricante} kPa` : '—'],
                ['Ambiente', d.ambiente],
              ].map(([l, v]) => (
                <View key={l} style={{ flex: 1, minWidth: '40%' }}>
                  <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>{l}</Text>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: T.textPrimary }}>{v ?? '—'}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Classificação */}
          <Text style={S.h2}>2. Classificação e Categorização — §13.5.1.1</Text>
          <View style={S.card}>
            <View style={[S.kpiRow, { marginBottom: 12 }]}>
              <View style={S.kpi}><Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>Fluido</Text>
                <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: T.textPrimary }}>{d.fluidoServico ?? '—'}</Text></View>
              <View style={S.kpi}><Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>Classe</Text>
                <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: T.accent }}>{d.fluidoClasse ? d.fluidoClasse.charAt(0) : '—'}</Text></View>
              <View style={S.kpi}><Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>P. Op. (MPa)</Text>
                <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: T.textPrimary }}>{d.pressaoOperacao ?? '—'}</Text></View>
              <View style={S.kpi}><Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>Volume (m³)</Text>
                <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: T.textPrimary }}>{d.volume ?? '—'}</Text></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <Text style={{ fontSize: 9, color: T.textSec }}>Grupo P×V: <Text style={{ fontFamily: 'Helvetica-Bold', color: T.textPrimary }}>{d.grupoPV ?? '—'}</Text></Text>
              <Text style={{ fontSize: 9, color: T.textSec }}>Categoria: <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: T.accent }}>{d.categoriaVaso ?? '—'}</Text></Text>
            </View>
          </View>

          {/* Checklist Documental */}
          <Text style={S.h2}>3. Checklist Documental — §13.5.1.5</Text>
          <View style={S.card}>
            {[
              { label: 'Prontuario do Vaso', val: d.prontuario },
              { label: 'Registro de Seguranca', val: d.registroSeguranca },
              { label: 'Projeto de Instalacao', val: d.projetoInstalacao },
              { label: 'Relatorios Anteriores', val: d.relatoriosAnteriores },
              { label: 'Placa de Identificacao', val: d.placaIdentificacao },
              { label: 'Certif. Dispositivos Seguranca', val: d.certificadosDispositivos },
              { label: 'Manual Operacao (Portugues)', val: d.manualOperacao },
            ].map(({ label, val }) => (
              <View key={label} style={S.checkLine}>
                {val === 'Existe Integral' || val === 'Fixada e Legivel' || val === 'Atualizado' || val === 'Existe' || val === 'Disponiveis' || val === 'Disponível em Português' || val === 'Fixada e Legível'
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
      </Page>

      {/* ====================== CHECKLIST SEGURANÇA ====================== */}
      <Page size="A4" style={S.page}>
        <Header /><Footer />
        <View style={S.pg}>
          <Text style={[S.h2, { marginTop: 0 }]}>3.1 Seguranca no Trabalho — Acessibilidade §13.5.2</Text>

          <Text style={S.h3}>Acessibilidade Geral — Art. 13.5.2.1</Text>
          <View style={S.card}>
            <View style={S.checkLine}>
              {d.segDrenosRespirosBV === 'Conforme' ? <View style={S.dotOK} /> : d.segDrenosRespirosBV === 'Não Aplicável' || d.segDrenosRespirosBV === 'Não aplicável' || d.segDrenosRespirosBV === 'N/A' ? <View style={S.dotNA} /> : <View style={S.dotNO} />}
              <Text style={S.checkTxt}>Drenos, respiros, bocas de visita e indicadores acessiveis</Text>
              <Text style={S.checkRef}>{d.segDrenosRespirosBV ?? '—'}</Text>
            </View>
            <View style={S.checkLine}>
              {d.segAspNormativosGerais === 'Conforme' ? <View style={S.dotOK} /> : d.segAspNormativosGerais === 'N/A' || d.segAspNormativosGerais === 'Não Aplicável' || d.segAspNormativosGerais === 'Não aplicável' ? <View style={S.dotNA} /> : <View style={S.dotNO} />}
              <Text style={S.checkTxt}>Adequacao a normas de seguranca, saude e meio ambiente</Text>
              <Text style={S.checkRef}>{d.segAspNormativosGerais ?? '—'}</Text>
            </View>
          </View>

          {d.ambiente === 'Fechado' && (
            <>
              <Text style={S.h3}>Ambiente Fechado — Art. 13.5.2.2</Text>
              <View style={S.card}>
                {[
                  { ref: 'Art. 13.5.2.2(a)', label: 'Minimo de 2 saidas amplas e seguras', val: d.segDuasSaidasAmbFechado },
                  { ref: 'Art. 13.5.2.2(b)', label: 'Acesso facil para manutencao e inspecao', val: d.segAcessoManutencao },
                  { ref: 'Art. 13.5.2.2(c)', label: 'Ventilacao permanente com entradas nao bloqueaveis', val: d.segVentilacaoPermanente },
                  { ref: 'Art. 13.5.2.2(d)', label: 'Iluminacao conforme normas vigentes', val: d.segIluminacaoFechado },
                  { ref: 'Art. 13.5.2.2(e)', label: 'Iluminacao de emergencia', val: d.segIluminacaoEmergenciaFechado },
                ].map(({ ref: r, label, val }) => (
                  <View key={r} style={S.checkLine}>
                    {val === 'Conforme' ? <View style={S.dotOK} /> : val === 'Não Aplicável' || val === 'Não aplicável' || val === 'N/A' ? <View style={S.dotNA} /> : <View style={S.dotNO} />}
                    <Text style={S.checkTxt}>{label}</Text>
                    <Text style={S.checkRef}>{val ?? '—'}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
          {d.ambiente === 'Aberto' && (
            <>
              <Text style={S.h3}>Ambiente Aberto — Art. 13.5.2.3</Text>
              <View style={S.card}>
                {[
                  { ref: '13.5.2.3 / .2.2(a)', label: 'Saidas amplas, desobstruidas e sinalizadas', val: d.segSaidasAmbAberto },
                  { ref: '13.5.2.3 / .2.2(b)', label: 'Acesso seguro para manutencao e inspecao', val: d.segAcessoAmbAberto },
                  { ref: '13.5.2.3 / .2.2(d)', label: 'Iluminacao conforme normas vigentes', val: d.segIluminacaoAberto },
                  { ref: '13.5.2.3 / .2.2(e)', label: 'Iluminacao de emergencia (se aplicavel)', val: d.segIluminacaoEmergenciaAberto },
                ].map(({ ref: r, label, val }) => (
                  <View key={r} style={S.checkLine}>
                    {val === 'Conforme' ? <View style={S.dotOK} /> : val === 'Não Aplicável' || val === 'Não aplicável' || val === 'N/A' ? <View style={S.dotNA} /> : <View style={S.dotNO} />}
                    <Text style={S.checkTxt}>{label}</Text>
                    <Text style={S.checkRef}>{val ?? '—'}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </Page>

      {/* ====================== DISPOSITIVOS + EXAME + MEDIÇÕES ====================== */}
      <Page size="A4" style={S.page}>
        <Header /><Footer />
        <View style={S.pg}>
          <Text style={[S.h2, { marginTop: 0 }]}>4. Dispositivos de Seguranca — §13.5.1.2</Text>
          <View style={{ backgroundColor: T.redLight, borderRadius: 6, padding: 8, marginBottom: 12 }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: T.red }}>
              ATENCAO: Ausencia ou bloqueio de dispositivos configura Grave e Iminente Risco
            </Text>
          </View>

          {(d.dispositivosSeguranca ?? []).length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <View style={S.tblHeader}>
                <Text style={{ ...S.tblHdr, width: 80 }}>TAG</Text>
                <Text style={{ ...S.tblHdr, width: 50 }}>Tipo</Text>
                <Text style={{ ...S.tblHdr, width: 110 }}>P. Ajuste (kPa)</Text>
                <Text style={{ ...S.tblHdr, width: 100 }}>Ult. Teste</Text>
                <Text style={{ ...S.tblHdr, width: 80 }}>Situacao</Text>
              </View>
              {(d.dispositivosSeguranca ?? []).map((disp: any, i: number) => (
                <View key={`disp-${i}`} style={i % 2 === 1 ? S.tblRowAlt : S.tblRow}>
                  <Text style={{ ...S.tblCell, width: 80, fontFamily: 'Helvetica-Bold' }}>{disp.tag ?? '—'}</Text>
                  <Text style={{ ...S.tblCell, width: 50 }}>{disp.tipo ?? '—'}</Text>
                  <Text style={{ ...S.tblCell, width: 110 }}>{disp.pressaoAjusteKpa ?? '—'}</Text>
                  <Text style={{ ...S.tblCell, width: 100 }}>{disp.ultimoTeste ? fmt(disp.ultimoTeste) : '—'}</Text>
                  <View style={{ width: 80 }}>
                    <View style={disp.situacao === 'OK' ? S.badgeOK : S.badgeWarn}>
                      <Text style={{ ...S.badgeTxt, color: disp.situacao === 'OK' ? T.emerald : T.amber }}>{disp.situacao ?? '—'}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <Text style={S.h2}>5. Exame Externo e Interno — §13.3.4</Text>
          <View style={S.card}>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, color: T.textSec, textTransform: 'uppercase' }}>Exame Externo</Text>
                <View style={d.exameExterno === 'Conforme' ? { ...S.badgeOK, marginTop: 4 } : { ...S.badgeErr, marginTop: 4 }}>
                  <Text style={{ ...S.badgeTxt, color: d.exameExterno === 'Conforme' ? T.emerald : T.red }}>{d.exameExterno ?? '—'}</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, color: T.textSec, textTransform: 'uppercase' }}>Exame Interno</Text>
                <View style={d.exameInterno === 'Conforme' ? { ...S.badgeOK, marginTop: 4 } : d.exameInterno === 'Não Aplicável' || d.exameInterno === 'Não aplicável' ? { backgroundColor: T.grey, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, marginTop: 4 } : { ...S.badgeWarn, marginTop: 4 }}>
                  <Text style={{ ...S.badgeTxt, color: d.exameInterno === 'Conforme' ? T.emerald : d.exameInterno === 'Não Aplicável' || d.exameInterno === 'Não aplicável' ? T.textSec : T.amber }}>{d.exameInterno ?? '—'}</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={S.h2}>6. Medicões de Espessura — §13.5.4.11(d)</Text>
          {(d.medicoesEspessura ?? []).length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <View style={S.tblHeader}>
                <Text style={{ ...S.tblHdr, width: 70 }}>Ponto</Text>
                <Text style={{ ...S.tblHdr, width: 100 }}>Esp. Orig (mm)</Text>
                <Text style={{ ...S.tblHdr, width: 110 }}>Esp. Medida</Text>
                <Text style={{ ...S.tblHdr, width: 100 }}>Esp. Min. Adm</Text>
                <Text style={{ ...S.tblHdr, width: 90 }}>Situacao</Text>
              </View>
              {(d.medicoesEspessura ?? []).map((med: any, i: number) => (
                <View key={`med-${i}`} style={i % 2 === 1 ? S.tblRowAlt : S.tblRow}>
                  <Text style={{ ...S.tblCell, width: 70, fontFamily: 'Helvetica-Bold' }}>{med.ponto ?? '—'}</Text>
                  <Text style={{ ...S.tblCell, width: 100 }}>{med.espOriginal ?? 'N/D'}</Text>
                  <Text style={{ ...S.tblCell, width: 110, fontFamily: 'Helvetica-Bold', color: T.textPrimary }}>{med.espMedida ?? '—'}</Text>
                  <Text style={{ ...S.tblCell, width: 100 }}>{med.espMinAdm ?? 'N/D'}</Text>
                  <View style={{ width: 90 }}>
                    <View style={med.situacao === 'OK' ? S.badgeOK : S.badgeErr}>
                      <Text style={{ ...S.badgeTxt, color: med.situacao === 'OK' ? T.emerald : T.red }}>{med.situacao ?? '—'}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>

      {/* ====================== CÁLCULO ASME + PARECER ====================== */}
      <Page size="A4" style={S.page}>
        <Header /><Footer />
        <View style={S.pg}>
          <Text style={[S.h2, { marginTop: 0 }]}>7. Avaliacao Estrutural — ASME Sec VIII Div. 1</Text>
          <View style={S.card}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 12 }}>
              {[
                ['Tensao Admissivel S', d.materialS ? `${d.materialS} MPa` : '—'],
                ['Eficiencia de Solda E', d.eficienciaE ?? '—'],
                ['Diametro Interno D', d.diametroD ? `${d.diametroD} mm` : '—'],
                ['Espessura Costado', d.espessuraCostado ? `${d.espessuraCostado} mm` : '—'],
                ['Espessura Tampo', d.espessuraTampo ? `${d.espessuraTampo} mm` : '—'],
                ['PSV Calibracao', d.psvCalibracao ? `${d.psvCalibracao} MPa` : '—'],
              ].map(([l, v]) => (
                <View key={l} style={{ flex: 1, minWidth: '40%' }}>
                  <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>{l}</Text>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: T.textPrimary }}>{v ?? '—'}</Text>
                </View>
              ))}
            </View>
            {(d._pmtaCostado != null && d._pmtaTampo != null) && (
              <View style={[S.kpiRow, { marginTop: 8 }]}>
                <View style={[S.kpi, { borderLeftWidth: 3, borderLeftColor: T.accent }]}>
                  <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>PMTA Costado</Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: T.accent }}>{(Number(d._pmtaCostado) * 10.197).toFixed(2)}</Text>
                  <Text style={{ fontSize: 7, color: T.textSec }}>kgf/cm2</Text>
                </View>
                <View style={[S.kpi, { borderLeftWidth: 3, borderLeftColor: T.amber }]}>
                  <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>PMTA Tampo</Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: T.amber }}>{(Number(d._pmtaTampo) * 10.197).toFixed(2)}</Text>
                  <Text style={{ fontSize: 7, color: T.textSec }}>kgf/cm2</Text>
                </View>
                <View style={[S.kpi, { borderLeftWidth: 3, borderLeftColor: T.emerald }]}>
                  <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>PMTA Limitante</Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: T.emerald }}>{(Number(d._pmtaLimitante ?? 0) * 10.197).toFixed(2)}</Text>
                  <Text style={{ fontSize: 7, color: T.textSec }}>kgf/cm2</Text>
                </View>
              </View>
            )}
          </View>

          {/* Parecer Técnico */}
          <Text style={S.h2}>8. Parecer Tecnico e Plano de Inspecao — §13.5.4.11</Text>
          <View style={S.card}>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>Condicao do Vaso</Text>
                {(() => {
                  const badge = STATUS_BADGE(d.statusFinalVaso)
                  return (
                    <View style={{ ...badge.style, marginTop: 4 }}>
                      <Text style={{ ...S.badgeTxt, color: badge.color }}>{badge.text}</Text>
                    </View>
                  )
                })()}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>PMTA Fixada pelo PLH</Text>
                <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: T.emerald }}>{d.pmtaFixadaPLH ?? '—'} kgf/cm2</Text>
              </View>
            </View>

            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: T.accent, marginBottom: 6 }}>Proximas Inspecoes</Text>
            <View style={[S.kpiRow, { marginBottom: 12 }]}>
              <View style={S.kpi}>
                <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>Externa</Text>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: T.textPrimary }}>{fmt(d.proximaInspecaoExterna)}</Text>
              </View>
              <View style={S.kpi}>
                <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>Interna</Text>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: T.textPrimary }}>{fmt(d.proximaInspecaoInterna)}</Text>
              </View>
              <View style={S.kpi}>
                <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>Teste Dispositivos</Text>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: T.textPrimary }}>{fmt(d.dataProximoTesteDispositivos)}</Text>
              </View>
            </View>

            {d.parecerTecnico && (
              <View style={{ borderTopWidth: 1, borderTopColor: T.borderLight, paddingTop: 12 }}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: T.accent, marginBottom: 6 }}>Parecer do PLH</Text>
                <Text style={{ fontSize: 9, color: T.textSec, lineHeight: 1.6, textAlign: 'justify' }}>{d.parecerTecnico}</Text>
              </View>
            )}
          </View>

          {/* Não Conformidades */}
          {d.naoConformidades && d.naoConformidades.length > 0 && (
            <>
              <Text style={S.h2}>9. Nao Conformidades — §13.5.4.11(j)</Text>
              {(d.naoConformidades).map((nc: any, i: number) => {
                const riscoColor =
                  nc.grauRisco === 'GIR' ? T.red
                  : nc.grauRisco === 'Crítico' || nc.grauRisco === 'Critico' ? '#ea580c'
                  : nc.grauRisco === 'Moderado' ? '#d97706'
                  : T.accent
                return (
                  <View key={i} style={{
                    backgroundColor: T.cardBg, borderRadius: 6, borderWidth: 1, borderColor: T.borderLight,
                    padding: 14, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: riscoColor,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: T.textPrimary, flex: 1 }}>
                        NC {String(i + 1).padStart(2, '0')} — {nc.descricao ?? 'Sem descricao'}
                      </Text>
                      <View style={{ backgroundColor: T.grey, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, marginLeft: 8 }}>
                        <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>Risco</Text>
                        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: riscoColor }}>{nc.grauRisco ?? '—'}</Text>
                      </View>
                    </View>
                    {nc.refNR13 && (
                      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: T.accent, marginBottom: 4 }}>Ref NR-13: {nc.refNR13}</Text>
                    )}
                    {nc.acaoCorretiva && (
                      <Text style={{ fontSize: 9, color: T.textSec, lineHeight: 1.5 }}>
                        <Text style={{ fontFamily: 'Helvetica-Bold', color: T.textPrimary }}>Acao Corretiva: </Text>{nc.acaoCorretiva}
                      </Text>
                    )}
                    {(nc.prazo || nc.responsavel) && (
                      <Text style={{ fontSize: 8, color: T.textSec, marginTop: 4 }}>
                        Prazo: {nc.prazo ? `${nc.prazo} dias` : '—'} | Responsavel: {nc.responsavel ?? '—'}
                      </Text>
                    )}
                  </View>
                )
              })}
            </>
          )}

          {/* Assinatura */}
          <View style={S.sigBox} wrap={false}>
            <View style={S.sigLine} />
            <Text style={S.sigName}>{d.rthNome ?? perfil?.nome ?? 'Profissional Responsavel'}</Text>
            {d.rthProfissao && <Text style={S.sigSub}>{d.rthProfissao}</Text>}
            {d.rthCrea ? <Text style={S.sigSub}>CREA: {d.rthCrea}</Text> : <Text style={S.sigSub}>CREA: —</Text>}
            <Text style={S.sigSub}>PLH — Responsavel Tecnico pela Inspecao NR-13</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
