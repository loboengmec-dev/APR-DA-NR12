/**
 * Relatório de Inspeção de Vaso de Pressão — NR-13 (ASME Sec VIII Div 1)
 * Totalmente isolado do módulo NR-12.
 */
import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// ---------------------------------------------------------------------------
// Fontes
// ---------------------------------------------------------------------------
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v29/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/roboto/v29/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf', fontWeight: 700 },
  ]
})

// ---------------------------------------------------------------------------
// Tema visual — mesmo DNA do LaudoPDF.tsx (Slate palette), mas com acentos
// em azul-profissional para diferenciar NR-13 de NR-12 (vermelho HRN).
// ---------------------------------------------------------------------------
const T = {
  bg:          '#f8fafc',
  cardBg:      '#ffffff',
  textPrimary: '#1e293b',
  textSec:     '#64748b',
  border:      '#e2e8f0',
  borderLight: '#f1f5f9',
  accent:      '#1e40af',      // Azul NR-13 — diferencia do vermelho HRN
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
    fontFamily: 'Roboto', fontSize: 10, backgroundColor: T.cardBg,
    color: T.textPrimary, paddingTop: 60, paddingBottom: 50, paddingHorizontal: 0,
  },
  pg: { marginHorizontal: 40 },

  // Header / Footer fixo
  header: {
    position: 'absolute', top: 20, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    borderBottomWidth: 1, borderBottomColor: T.borderLight, paddingBottom: 8,
  },
  headerTitle: { fontSize: 9, fontWeight: 700, color: T.accent },
  headerSub:   { fontSize: 7, color: T.textSec, marginTop: 2 },
  footer: {
    position: 'absolute', bottom: 20, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: T.border, paddingTop: 6,
  },
  footerText: { fontSize: 7, color: T.textSec },

  // Tipografia
  h1: { fontSize: 24, fontWeight: 700, color: T.textPrimary, marginBottom: 4 },
  h2: {
    fontSize: 13, fontWeight: 700, color: T.accent, marginBottom: 8, marginTop: 14,
    borderBottomWidth: 1, borderBottomColor: T.borderLight, paddingBottom: 4,
  },
  h3: { fontSize: 11, fontWeight: 700, color: T.textPrimary, marginBottom: 6, marginTop: 8 },
  p:  { fontSize: 9, color: T.textSec, lineHeight: 1.6, marginBottom: 8, textAlign: 'justify' },

  // Cards e tabelas
  card:    { backgroundColor: T.bg, borderRadius: 8, padding: 16, marginBottom: 16 },
  tblHeader: {
    flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 2,
    borderBottomColor: T.border, backgroundColor: T.accent,
  },
  tblHdr: { fontSize: 8, fontWeight: 700, color: '#ffffff', flex: 1, paddingHorizontal: 4 },
  tblRow:  { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: T.borderLight, paddingVertical: 7 },
  tblRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: T.borderLight, paddingVertical: 7, backgroundColor: T.grey },
  tblCell: { fontSize: 8, flex: 1, paddingHorizontal: 4, color: T.textSec },
  tblCellH: { fontSize: 8, fontWeight: 700, color: T.textPrimary, flex: 1, paddingHorizontal: 4 },

  // Status badges
  badgeOK:   { backgroundColor: T.emeraldLight, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, flexDirection: 'row', alignItems: 'center' },
  badgeWarn: { backgroundColor: T.amberLight, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  badgeErr:  { backgroundColor: T.redLight,    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  badgeTxt:  { fontSize: 7, fontWeight: 700, textTransform: 'uppercase' },

  // KPI Cards
  kpiRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  kpi:    {
    flex: 1, backgroundColor: T.cardBg, padding: 10, borderRadius: 6, borderWidth: 1,
    borderColor: T.borderLight,
  },

  // Assinatura
  sigBox:        { marginTop: 40, alignItems: 'flex-end' },
  sigLine:       { borderTopWidth: 1, borderTopColor: T.textPrimary, width: 200, marginBottom: 4 },
  sigName:       { fontSize: 10, fontWeight: 700, textAlign: 'center', width: 200 },
  sigSub:        { fontSize: 8, color: T.textSec, textAlign: 'center', width: 200 },

  // Cover
  coverRoot:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  coverBadge:    { backgroundColor: T.bg, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 4, marginBottom: 20 },
  coverBadgeTxt: { fontSize: 10, color: T.accent, fontWeight: 700, letterSpacing: 1 },
  coverTitle:    { fontSize: 26, fontWeight: 700, color: T.textPrimary, textAlign: 'center', marginBottom: 14 },
  coverSubtitle: { fontSize: 11, color: T.textSec, textAlign: 'center', maxWidth: 380, marginBottom: 40, lineHeight: 1.5 },
  coverGrid:     { width: '100%', maxWidth: 380, paddingTop: 30, borderTopWidth: 1, borderTopColor: T.borderLight },
  coverMetaRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  coverLbl:      { fontSize: 9, color: T.textSec, textTransform: 'uppercase' },
  coverVal:      { fontSize: 11, fontWeight: 700, color: T.textPrimary },

  // Checklist visual
  checkLine:     { flexDirection: 'row', alignItems: 'center', marginBottom: 4, paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: T.borderLight },
  dotOK:         { width: 7, height: 7, borderRadius: 3, backgroundColor: T.emerald, marginRight: 6 },
  dotNO:         { width: 7, height: 7, borderRadius: 3, backgroundColor: T.red,     marginRight: 6 },
  dotNA:         { width: 7, height: 7, borderRadius: 3, backgroundColor: T.textSec, marginRight: 6 },
  checkTxt:      { fontSize: 8, color: T.textPrimary, flex: 1 },
  checkRef:      { fontSize: 7, color: T.textSec, flex: 0.35, textAlign: 'right' },

  // Dispositivo card
  dispCard:      { backgroundColor: T.bg, borderRadius: 6, padding: 10, marginBottom: 6 },
  dispTag:       { fontSize: 9, fontWeight: 700, color: T.accent },
})

// ---------------------------------------------------------------------------
// Helpers de cor e texto
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
  dados: Record<string, any>   // dados do FormInspecaoNR13
  perfil?: Record<string, any> // nome, crea, etc
}

export default function LaudoNR13PDF({ dados, perfil }: LaudoNR13PDFProps) {
  const d = dados ?? {}
  const hoje = new Date().toLocaleDateString('pt-BR')

  const Header = () => (
    <View style={S.header} fixed>
      <View>
        <Text style={S.headerTitle}>Relatório de Inspeção — NR-13 (Vaso de Pressão)</Text>
        <Text style={S.headerSub}>{d.tag ?? '—'} | {d.fabricante ?? '—'}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={S.headerSub}>Doc: {d.tag ?? '—'} | Rev: 0</Text>
        <Text style={S.headerSub}>Data: {d.dataInspecao ? new Date(d.dataInspecao + 'T00:00:00').toLocaleDateString('pt-BR') : hoje}</Text>
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
          <View style={S.coverBadge}><Text style={S.coverBadgeTxt}>NR-13 — ASME Sec VIII Div 1</Text></View>
          <Text style={S.coverTitle}>Relatório de Inspeção de Vaso de Pressão</Text>
          <Text style={S.coverSubtitle}>
            Avaliação de integridade mecânica, recálculo de PMTA conforme Código ASME e
            verificação de conformidade com a NR-13 para vasos de pressão estacionários.
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
              ['Data da Inspeção',   d.dataInspecao ? new Date(d.dataInspecao + 'T00:00:00').toLocaleDateString('pt-BR') : '—'],
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

          {/* 1. Identificação */}
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
                  <Text style={{ fontSize: 10, fontWeight: 700, color: T.textPrimary }}>{v ?? '—'}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 2. Classificação e Categorização */}
          <Text style={S.h2}>2. Classificação e Categorização — §13.5.1.1</Text>
          <View style={S.card}>
            <View style={[S.kpiRow, { marginBottom: 12 }]}>
              <View style={S.kpi}><Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>Fluido</Text>
                <Text style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>{d.fluidoServico ?? '—'}</Text></View>
              <View style={S.kpi}><Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>Classe</Text>
                <Text style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{d.fluidoClasse ? d.fluidoClasse.charAt(0) : '—'}</Text></View>
              <View style={S.kpi}><Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>Pressão Op. (MPa)</Text>
                <Text style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>{d.pressaoOperacao ?? '—'}</Text></View>
              <View style={S.kpi}><Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>Volume (m³)</Text>
                <Text style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>{d.volume ?? '—'}</Text></View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 8, color: T.textSec }}>Grupo P×V: </Text>
                <Text style={{ fontSize: 10, fontWeight: 700, color: T.textPrimary }}>{d.grupoPV ?? '—'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 8, color: T.textSec }}>Categoria: </Text>
                <Text style={{ fontSize: 14, fontWeight: 700, color: T.accent }}>{d.categoriaVaso ?? '—'}</Text>
              </View>
            </View>
          </View>

          {/* 3. Checklist Documental */}
          <Text style={S.h2}>3. Checklist Documental — §13.5.1.5</Text>
          <View style={S.card}>
            {[
              { label: 'Prontuário do Vaso', val: d.prontuario },
              { label: 'Registro de Segurança', val: d.registroSeguranca },
              { label: 'Projeto de Instalação', val: d.projetoInstalacao },
              { label: 'Relatórios Anteriores', val: d.relatoriosAnteriores },
              { label: 'Placa de Identificação', val: d.placaIdentificacao },
              { label: 'Certif. Dispositivos de Segurança', val: d.certificadosDispositivos },
              { label: 'Manual de Operação (Português)', val: d.manualOperacao },
            ].map(({ label, val }) => (
              <View key={label} style={S.checkLine}>
                {val === 'Existe Integral' || val === 'Fixada e Legível' || val === 'Atualizado' || val === 'Existe' || val === 'Disponíveis' || val === 'Disponível em Português' || val === 'Conforme'
                  ? <View style={S.dotOK} />
                  : val === 'N/A' || (!val)
                    ? <View style={S.dotNA} />
                    : <View style={S.dotNO} />}
                <Text style={S.checkTxt}>{label}</Text>
                <Text style={S.checkRef}>{val ?? '—'}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>

      {/* ====================== CHECKLIST SEGURANÇA (SEÇÃO 3) ====================== */}
      <Page size="A4" style={S.page}>
        <Header /><Footer />
        <View style={S.pg}>
          <Text style={[S.h2, { marginTop: 0 }]}>3.1 Segurança no Trabalho — Acessibilidade §13.5.2</Text>

          <Text style={S.h3}>Acessibilidade Geral — Art. 13.5.2.1</Text>
          <View style={S.card}>
            <View style={S.checkLine}>
              {d.segDrenosRespirosBV === 'Conforme' ? <View style={S.dotOK} /> : d.segDrenosRespirosBV === 'N/A' || d.segDrenosRespirosBV === 'Não Aplicável' ? <View style={S.dotNA} /> : <View style={S.dotNO} />}
              <Text style={S.checkTxt}>Drenos, respiros, bocas de visita e indicadores acessíveis</Text>
              <Text style={S.checkRef}>{d.segDrenosRespirosBV ?? '—'}</Text>
            </View>
            <View style={S.checkLine}>
              {d.segAspNormativosGerais === 'Conforme' ? <View style={S.dotOK} /> : d.segAspNormativosGerais === 'N/A' || d.segAspNormativosGerais === 'Não Aplicável' ? <View style={S.dotNA} /> : <View style={S.dotNO} />}
              <Text style={S.checkTxt}>Adequação normas de segurança, saúde e meio ambiente</Text>
              <Text style={S.checkRef}>{d.segAspNormativosGerais ?? '—'}</Text>
            </View>
          </View>

          {d.ambiente === 'Fechado' && (
            <>
              <Text style={S.h3}>Ambiente Fechado — Art. 13.5.2.2</Text>
              <View style={S.card}>
                {[
                  { ref: 'Art. 13.5.2.2(a)', label: 'Mínimo de 2 saídas amplas e seguras', val: d.segDuasSaidasAmbFechado },
                  { ref: 'Art. 13.5.2.2(b)', label: 'Acesso fácil para manutenção e inspeção', val: d.segAcessoManutencao },
                  { ref: 'Art. 13.5.2.2(c)', label: 'Ventilação permanente com entradas não bloqueáveis', val: d.segVentilacaoPermanente },
                  { ref: 'Art. 13.5.2.2(d)', label: 'Iluminação conforme normas vigentes', val: d.segIluminacaoFechado },
                  { ref: 'Art. 13.5.2.2(e)', label: 'Iluminação de emergência', val: d.segIluminacaoEmergenciaFechado },
                ].map(({ ref: r, label, val }) => (
                  <View key={r} style={S.checkLine}>
                    {val === 'Conforme' ? <View style={S.dotOK} /> : val === 'Não Aplicável' || val === 'N/A' ? <View style={S.dotNA} /> : <View style={S.dotNO} />}
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
                  { ref: '13.5.2.3 / .2.2(a)', label: 'Saídas amplas, desobstruídas e sinalizadas', val: d.segSaidasAmbAberto },
                  { ref: '13.5.2.3 / .2.2(b)', label: 'Acesso seguro para manutenção e inspeção', val: d.segAcessoAmbAberto },
                  { ref: '13.5.2.3 / .2.2(d)', label: 'Iluminação conforme normas vigentes', val: d.segIluminacaoAberto },
                  { ref: '13.5.2.3 / .2.2(e)', label: 'Iluminação de emergência (se aplicável)', val: d.segIluminacaoEmergenciaAberto },
                ].map(({ ref: r, label, val }) => (
                  <View key={r} style={S.checkLine}>
                    {val === 'Conforme' ? <View style={S.dotOK} /> : val === 'Não Aplicável' || val === 'N/A' ? <View style={S.dotNA} /> : <View style={S.dotNO} />}
                    <Text style={S.checkTxt}>{label}</Text>
                    <Text style={S.checkRef}>{val ?? '—'}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </Page>

      {/* ====================== DISPOSITIVOS DE SEGURANÇA ====================== */}
      <Page size="A4" style={S.page}>
        <Header /><Footer />
        <View style={S.pg}>
          <Text style={[S.h2, { marginTop: 0 }]}>4. Dispositivos de Segurança — §13.5.1.2 / §13.5.4.11(n)</Text>
          <View style={{ backgroundColor: T.redLight, borderRadius: 6, padding: 8, marginBottom: 12 }}>
            <Text style={{ fontSize: 8, color: T.red, fontWeight: 700 }}>
              ATENÇÃO: Ausência ou bloqueio de dispositivos configura Grave e Iminente Risco — Art. 13.3.1(a)(c)
            </Text>
          </View>

          {(d.dispositivosSeguranca ?? []).length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <View style={S.tblHeader}>
                <Text style={{ ...S.tblHdr, flex: 0.15 }}>TAG</Text>
                <Text style={{ ...S.tblHdr, flex: 0.15 }}>Tipo</Text>
                <Text style={{ ...S.tblHdr, flex: 0.25 }}>Pressão Ajuste (kPa)</Text>
                <Text style={{ ...S.tblHdr, flex: 0.25 }}>Último Teste</Text>
                <Text style={{ ...S.tblHdr, flex: 0.2 }}>Situação</Text>
              </View>
              {(d.dispositivosSeguranca ?? []).map((disp: any, i: number) => (
                <View key={`disp-${i}`} style={i % 2 === 1 ? S.tblRowAlt : S.tblRow}>
                  <Text style={[S.tblCell, { flex: 0.15, fontWeight: 700 }]}>{disp.tag ?? '—'}</Text>
                  <Text style={[S.tblCell, { flex: 0.15 }]}>{disp.tipo ?? '—'}</Text>
                  <Text style={[S.tblCell, { flex: 0.25 }]}>{disp.pressaoAjusteKpa ?? '—'}</Text>
                  <Text style={[S.tblCell, { flex: 0.25 }]}>{disp.ultimoTeste ? new Date(disp.ultimoTeste + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</Text>
                  <View style={{ flex: 0.2, justifyContent: 'center' }}>
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
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, color: T.textSec, textTransform: 'uppercase' }}>Exame Externo</Text>
                <View style={d.exameExterno === 'Conforme' ? { ...S.badgeOK, marginTop: 4 } : { ...S.badgeErr, marginTop: 4 }}>
                  <Text style={{ ...S.badgeTxt, color: d.exameExterno === 'Conforme' ? T.emerald : T.red }}>{d.exameExterno ?? '—'}</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, color: T.textSec, textTransform: 'uppercase' }}>Exame Interno</Text>
                <View style={d.exameInterno === 'Conforme' ? { ...S.badgeOK, marginTop: 4 } : d.exameInterno === 'Não Aplicável' ? { ...{ backgroundColor: T.grey, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 }, marginTop: 4 } : { ...S.badgeWarn, marginTop: 4 }}>
                  <Text style={{ ...S.badgeTxt, color: d.exameInterno === 'Conforme' ? T.emerald : d.exameInterno === 'Não Aplicável' ? T.textSec : T.amber }}>{d.exameInterno ?? '—'}</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={S.h2}>6. Medições de Espessura — Ultrassom §13.5.4.11(d)</Text>
          {(d.medicoesEspessura ?? []).length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <View style={S.tblHeader}>
                <Text style={{ ...S.tblHdr, flex: 0.15 }}>Ponto</Text>
                <Text style={{ ...S.tblHdr, flex: 0.2 }}>Esp. Original (mm)</Text>
                <Text style={{ ...S.tblHdr, flex: 0.2 }}>Esp. Medida (mm)</Text>
                <Text style={{ ...S.tblHdr, flex: 0.2 }}>Esp. Mín. Adm. (mm)</Text>
                <Text style={{ ...S.tblHdr, flex: 0.25 }}>Situação</Text>
              </View>
              {(d.medicoesEspessura ?? []).map((med: any, i: number) => (
                <View key={`med-${i}`} style={i % 2 === 1 ? S.tblRowAlt : S.tblRow}>
                  <Text style={[S.tblCell, { flex: 0.15, fontWeight: 700 }]}>{med.ponto ?? '—'}</Text>
                  <Text style={[S.tblCell, { flex: 0.2 }]}>{med.espOriginal ?? 'N/D'}</Text>
                  <Text style={[S.tblCell, { flex: 0.2, fontWeight: 700, color: T.textPrimary }]}>{med.espMedida ?? '—'}</Text>
                  <Text style={[S.tblCell, { flex: 0.2 }]}>{med.espMinAdm ?? 'N/D'}</Text>
                  <View style={{ flex: 0.25, justifyContent: 'center' }}>
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
          <Text style={[S.h2, { marginTop: 0 }]}>7. Avaliação Estrutural — ASME Sec VIII Div. 1</Text>
          <View style={S.card}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 12 }}>
              {[
                ['Tensão Admissível S', d.materialS ? `${d.materialS} MPa` : '—'],
                ['Eficiência de Solda E', d.eficienciaE ?? '—'],
                ['Diâmetro Interno D', d.diametroD ? `${d.diametroD} mm` : '—'],
                ['Espessura Costado', d.espessuraCostado ? `${d.espessuraCostado} mm` : '—'],
                ['Espessura Tampo', d.espessuraTampo ? `${d.espessuraTampo} mm` : '—'],
                ['PSV Calibração', d.psvCalibracao ? `${d.psvCalibracao} MPa` : '—'],
              ].map(([l, v]) => (
                <View key={l} style={{ flex: 1, minWidth: '40%' }}>
                  <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>{l}</Text>
                  <Text style={{ fontSize: 10, fontWeight: 700, color: T.textPrimary }}>{v ?? '—'}</Text>
                </View>
              ))}
            </View>
            {(d._pmtaCostado != null && d._pmtaTampo != null) && (
              <View style={[S.kpiRow, { marginTop: 8 }]}>
                <View style={[S.kpi, { borderLeftWidth: 3, borderLeftColor: T.accent }]}>
                  <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>PMTA Costado</Text>
                  <Text style={{ fontSize: 14, fontWeight: 700, color: T.accent }}>{(Number(d._pmtaCostado) * 10.197).toFixed(2)}</Text>
                  <Text style={{ fontSize: 7, color: T.textSec }}>kgf/cm²</Text>
                </View>
                <View style={[S.kpi, { borderLeftWidth: 3, borderLeftColor: T.amber }]}>
                  <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>PMTA Tampo</Text>
                  <Text style={{ fontSize: 14, fontWeight: 700, color: T.amber }}>{(Number(d._pmtaTampo) * 10.197).toFixed(2)}</Text>
                  <Text style={{ fontSize: 7, color: T.textSec }}>kgf/cm²</Text>
                </View>
                <View style={[S.kpi, { borderLeftWidth: 3, borderLeftColor: T.emerald }]}>
                  <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>PMTA Limitante</Text>
                  <Text style={{ fontSize: 14, fontWeight: 700, color: T.emerald }}>{(Number(d._pmtaLimitante ?? 0) * 10.197).toFixed(2)}</Text>
                  <Text style={{ fontSize: 7, color: T.textSec }}>kgf/cm²</Text>
                </View>
              </View>
            )}
          </View>

          {/* Parecer Técnico */}
          <Text style={S.h2}>8. Parecer Técnico e Plano de Inspeção — §13.5.4.11</Text>
          <View style={S.card}>
            {/* Condição final */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>Condição do Vaso</Text>
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
                <Text style={{ fontSize: 14, fontWeight: 700, color: T.emerald }}>{d.pmtaFixadaPLH ?? '—'} kgf/cm²</Text>
              </View>
            </View>

            {/* Plano de inspeções */}
            <Text style={{ fontSize: 9, fontWeight: 700, color: T.accent, marginBottom: 6 }}>Próximas Inspeções</Text>
            <View style={[S.kpiRow, { marginBottom: 12 }]}>
              <View style={S.kpi}>
                <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>Inspeção Externa</Text>
                <Text style={{ fontSize: 10, fontWeight: 700, color: T.textPrimary }}>{d.proximaInspecaoExterna ? new Date(d.proximaInspecaoExterna + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</Text>
              </View>
              <View style={S.kpi}>
                <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>Inspeção Interna</Text>
                <Text style={{ fontSize: 10, fontWeight: 700, color: T.textPrimary }}>{d.proximaInspecaoInterna ? new Date(d.proximaInspecaoInterna + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</Text>
              </View>
              <View style={S.kpi}>
                <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>Teste Dispositivos</Text>
                <Text style={{ fontSize: 10, fontWeight: 700, color: T.textPrimary }}>{d.dataProximoTesteDispositivos ? new Date(d.dataProximoTesteDispositivos + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</Text>
              </View>
            </View>

            {/* Parecer narrativo */}
            {d.parecerTecnico && (
              <View style={{ borderTopWidth: 1, borderTopColor: T.borderLight, paddingTop: 12 }}>
                <Text style={{ fontSize: 9, fontWeight: 700, color: T.accent, marginBottom: 6 }}>Parecer do PLH</Text>
                <Text style={{ fontSize: 9, color: T.textSec, lineHeight: 1.6, textAlign: 'justify' }}>{d.parecerTecnico}</Text>
              </View>
            )}
          </View>

          {/* Não Conformidades */}
          {d.naoConformidades && d.naoConformidades.length > 0 && (
            <>
              <Text style={S.h2}>9. Não Conformidades — §13.5.4.11(j)</Text>
              {(d.naoConformidades).map((nc: any, i: number) => {
                const riscoColor =
                  nc.grauRisco === 'GIR' ? T.red
                  : nc.grauRisco === 'Crítico' ? '#ea580c'
                  : nc.grauRisco === 'Moderado' ? '#d97706'
                  : T.accent
                return (
                  <View key={i} style={{
                    backgroundColor: T.cardBg, borderRadius: 6, borderWidth: 1, borderColor: T.borderLight,
                    padding: 14, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: riscoColor,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: 700, color: T.textPrimary, flex: 1 }}>
                        NC {String(i + 1).padStart(2, '0')} — {nc.descricao ?? 'Sem descrição'}
                      </Text>
                      <View style={{ backgroundColor: T.grey, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, marginLeft: 8 }}>
                        <Text style={{ fontSize: 7, color: T.textSec, textTransform: 'uppercase' }}>Risco</Text>
                        <Text style={{ fontSize: 9, fontWeight: 700, color: riscoColor }}>{nc.grauRisco ?? '—'}</Text>
                      </View>
                    </View>
                    {nc.refNR13 && (
                      <Text style={{ fontSize: 8, color: T.accent, fontWeight: 700, marginBottom: 4 }}>Ref NR-13: {nc.refNR13}</Text>
                    )}
                    {nc.acaoCorretiva && (
                      <Text style={{ fontSize: 9, color: T.textSec, lineHeight: 1.5 }}>
                        <Text style={{ fontWeight: 700, color: T.textPrimary }}>Ação Corretiva: </Text>{nc.acaoCorretiva}
                      </Text>
                    )}
                    {(nc.prazo || nc.responsavel) && (
                      <Text style={{ fontSize: 8, color: T.textSec, marginTop: 4 }}>
                        Prazo: {nc.prazo ? `${nc.prazo} dias` : '—'} | Responsável: {nc.responsavel ?? '—'}
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
            <Text style={S.sigName}>{d.rthNome ?? perfil?.nome ?? 'Profissional Responsável'}</Text>
            {d.rthProfissao && <Text style={S.sigSub}>{d.rthProfissao}</Text>}
            {d.rthCrea ? <Text style={S.sigSub}>CREA: {d.rthCrea}</Text> : <Text style={S.sigSub}>CREA: —</Text>}
            <Text style={S.sigSub}>PLH — Responsável Técnico pela Inspeção NR-13</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
