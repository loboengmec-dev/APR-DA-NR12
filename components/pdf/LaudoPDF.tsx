import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PDFImage,
  Font,
  Svg,
  Path,
} from '@react-pdf/renderer'
import { labelNivelHRN } from '@/lib/hrn'
import type { NivelHRN } from '@/types'
import { NBR_IMAGE_B64 } from '@/lib/assets/nbrImage'

Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v29/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/roboto/v29/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf', fontWeight: 700 },
  ]
})

const THEME = {
  bg: '#fafafa',           // neutro quente — elimina o cast azulado friozento
  cardBg: '#ffffff',
  textSecondary: '#64748b', // Slate 500 — mais legível que zinc
  textPrimary: '#1e293b',   // Slate 800 — preto suave profissional
  border: '#e2e8f0',        // Slate 200
  borderLight: '#f1f5f9',   // Slate 100
  redMain: '#cd223c',       // Reservado exclusivamente para HRN
  redDark: '#be123c',       // Reservado exclusivamente para HRN
  accent: '#334155',        // Slate 700 — substitui o azul berrante em toda estrutura
  greyCard: '#f1f5f9',      // Slate 100
  redLight: '#ffe4e6',
  // Cores de ícones das seções (muted/desaturados)
  iconDiag: '#475569',      // Slate 600 — diagnóstico
  iconAction: '#92400e',    // Amber 800 — ação recomendada
  iconCheck: '#166534',     // Green 800 — medidas complementares
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    backgroundColor: THEME.cardBg, // White background overall for cleaner borderless look
    color: THEME.textPrimary,
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 0,
  },
  pageContent: { marginHorizontal: 40 },
  
  // Headings globais
  h1: { fontSize: 24, fontWeight: 700, color: THEME.textPrimary, marginBottom: 4 },
  h2: { fontSize: 13, fontWeight: 700, color: THEME.accent, marginBottom: 8, marginTop: 16, borderBottomWidth: 1, borderBottomColor: THEME.borderLight, paddingBottom: 4 },
  h3: { fontSize: 11, fontWeight: 700, color: THEME.textPrimary, marginBottom: 6, marginTop: 8 },
  p: { fontSize: 9, color: THEME.textSecondary, lineHeight: 1.6, marginBottom: 8, textAlign: 'justify' },
  
  // Cabeçalho Fixo
  header: {
    position: 'absolute', top: 20, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    borderBottomWidth: 1, borderBottomColor: THEME.borderLight, paddingBottom: 8,
  },
  headerTitle: { fontSize: 9, color: THEME.accent, fontWeight: 700 },
  headerSub: { fontSize: 7, color: THEME.textSecondary, marginTop: 2 },
  
  // Rodapé Fixo
  footer: {
    position: 'absolute', bottom: 20, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: 6,
  },
  footerText: { fontSize: 7, color: THEME.textSecondary },

  // Cartão Genérico e Tabelas Modernizadas
  card: {
    backgroundColor: THEME.bg, // Grayish background to highlight block without borders
    borderRadius: 8,
    padding: 16, marginBottom: 16,
  },
  table: { width: '100%', marginBottom: 12 },
  tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: THEME.border },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: THEME.borderLight, paddingVertical: 8 },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: THEME.borderLight, paddingVertical: 8 },
  tableCell: { fontSize: 8, flex: 1, paddingHorizontal: 4, color: THEME.textSecondary },
  tableCellHeader: { fontSize: 8, flex: 1, fontWeight: 700, color: THEME.textPrimary, paddingHorizontal: 4 },
  hierarquiaItem: { flexDirection: 'row', marginBottom: 8, backgroundColor: THEME.bg, padding: 12, borderRadius: 6 },
  hierarquiaOrd: { fontSize: 10, fontWeight: 700, width: 24, color: THEME.accent },

  // Estrutura Base de Equipamento (O Grande Card)
  eqContainer: {
    backgroundColor: THEME.cardBg,
    borderRadius: 8, borderWidth: 1, borderColor: THEME.borderLight,
    padding: 16, marginBottom: 16,
    // Add subtle shadow perception using a tiny bottom border
    borderBottomWidth: 2, borderBottomColor: THEME.border,
  },
  
  eqHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 4,
  },
  eqHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  tagPill: {
    backgroundColor: THEME.accent, paddingVertical: 4, paddingHorizontal: 7,
    borderRadius: 4, marginRight: 8,
  },
  tagText: { fontSize: 9, color: '#ffffff', fontWeight: 700 },
  eqTitle: { fontSize: 14, fontWeight: 700, color: THEME.textPrimary },
  
  riskBadge: { flexDirection: 'row', alignItems: 'center' },
  dotRisk: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.redDark, marginRight: 4 },
  riskText: { fontSize: 9, color: THEME.redDark, fontWeight: 700, textTransform: 'uppercase' },
  eqSub: { fontSize: 9, color: THEME.textSecondary, marginTop: 2, marginLeft: 2, borderBottomWidth: 1, borderBottomColor: THEME.borderLight, paddingBottom: 10, marginBottom: 16 },

  // Card Duplo da Não Conformidade
  ncGrid: {
    flexDirection: 'row', marginHorizontal: -4, marginBottom: 16,
  },
  ncColLeft: { flex: 0.5, paddingHorizontal: 4 },
  ncColRight: { flex: 0.5, paddingHorizontal: 4 },
  
  // Painel Foto
  photoCard: {
    backgroundColor: THEME.greyCard, borderRadius: 8,
    overflow: 'hidden', height: '100%',
  },
  photoWrapper: { height: 160, overflow: 'hidden' }, // Fixed height for standard aspect
  fotoNC: { width: '100%', height: '100%', objectFit: 'cover' },
  semFotoBox: { width: '100%', height: 160, backgroundColor: THEME.border, justifyContent: 'center', alignItems: 'center' },
  photoCaption: {
    fontSize: 8, color: THEME.textPrimary, padding: 8, lineHeight: 1.4,
  },

  // Painel HRN
  hrnCard: {
    backgroundColor: THEME.greyCard, borderRadius: 8, padding: 12, height: '100%',
  },
  ncLabelMini: { fontSize: 11, fontWeight: 700, color: THEME.textPrimary, marginBottom: 2 },
  ncTitleMini: { fontSize: 9, color: THEME.textPrimary, marginBottom: 8, lineHeight: 1.3 },
  
  hrnBoxRed: {
    backgroundColor: THEME.redMain, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12,
    marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
  },
  hrnBoxValueText: { color: '#ffffff', fontSize: 18, fontWeight: 700 },
  hrnBoxLabel: { color: '#ffffff', fontSize: 10, fontWeight: 700 },
  hrnBoxRisk: { color: '#ffffff', fontSize: 7, textTransform: 'uppercase' },
  
  // Barrinhas Probabilidade
  probRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  probLabel: { width: 55, fontSize: 8, color: THEME.textSecondary },
  probBlocks: { flexDirection: 'row', flex: 1, gap: 2 },
  probBlock: { flex: 1, height: 6, borderRadius: 1 },

  // Detalhes Textuais (Diagnóstico, etc)
  ncDetailsBox: {
    marginTop: 12, borderTopWidth: 1, borderTopColor: THEME.borderLight, paddingTop: 12,
  },
  ncSubtitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ncSubtitle: { fontSize: 11, fontWeight: 700, color: THEME.textPrimary, flex: 0.8 },
  ncMetaRow: { flexDirection: 'row', marginBottom: 12 },
  ncMetaItem: { fontSize: 9, color: THEME.textSecondary, marginRight: 16 },
  ncMetaValue: { fontWeight: 700, color: THEME.textPrimary },
  
  // HRN Pill Flutuante
  hrnPill: {
    backgroundColor: THEME.redLight, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4,
    flexDirection: 'row', alignItems: 'center',
  },
  
  // Blocos de Texto
  detailSection: { marginBottom: 12 },
  detailTitleBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detailTitle: { fontSize: 10, fontWeight: 700, color: THEME.textPrimary },
  iconCircle: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: '#d4d4d8',
    justifyContent: 'center', alignItems: 'center', marginRight: 6,
  },
  iconCheck: { fontSize: 8, color: '#ffffff', fontWeight: 700 },
  
  detailText: { fontSize: 9, color: THEME.textSecondary, lineHeight: 1.5, marginLeft: 20 },
  bulletList: { marginLeft: 20, marginTop: 4 },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3 },
  bulletArrow: { fontSize: 9, color: '#a1a1aa', marginRight: 4, marginTop: 1 },
  bulletArrowSub: { fontSize: 9, color: '#d4d4d8', marginRight: 4, marginTop: 1, marginLeft: 12 },
  bulletText: { fontSize: 9, color: THEME.textSecondary, flex: 1, lineHeight: 1.4 },
  
  // Visual Blocks Recomendações
  recBlocks: { flexDirection: 'row', marginLeft: 4, alignItems: 'center' },
  recBlockRed: { width: 6, height: 6, backgroundColor: THEME.redMain, marginRight: 1 },
  recBlockOrange: { width: 6, height: 6, backgroundColor: '#ea580c', marginRight: 1 },
  recBlockYellow: { width: 6, height: 6, backgroundColor: '#eab308', marginRight: 1 },
  recBlockGrey: { width: 6, height: 6, backgroundColor: THEME.borderLight },


  
  // Assinatura
  assinaturaBox: { marginTop: 40, alignItems: 'flex-end' },
  assinaturaLinha: { borderTopWidth: 1, borderTopColor: THEME.textPrimary, width: 200, marginBottom: 4 },
  assinaturaNome: { fontSize: 10, fontWeight: 700, textAlign: 'center', width: 200 },
  assinaturaSub: { fontSize: 8, color: THEME.textSecondary, textAlign: 'center', width: 200 },
  
  // Minimalist Cover Styles
  coverRoot: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40,
  },
  coverBadge: {
    backgroundColor: THEME.bg, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, marginBottom: 20,
  },
  coverBadgeText: { fontSize: 10, color: THEME.accent, fontWeight: 700, letterSpacing: 1 },
  coverTitle: {
    fontSize: 28, fontWeight: 700, color: THEME.textPrimary, textAlign: 'center', marginBottom: 16,
  },
  coverSubtitle: { fontSize: 12, color: THEME.textSecondary, textAlign: 'center', maxWidth: 400, marginBottom: 40, lineHeight: 1.5 },
  
  coverMetaGrid: {
    width: '100%', flexDirection: 'column', gap: 10,
    paddingTop: 30, borderTopWidth: 1, borderTopColor: THEME.borderLight
  },
  coverMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 4 },
  coverMetaLabel: { fontSize: 9, color: THEME.textSecondary, textTransform: 'uppercase' },
  coverMetaValue: { fontSize: 11, fontWeight: 700, color: THEME.textPrimary },
})

const COR_HRN: Record<string, string> = {
  aceitavel:   '#22c55e',
  muito_baixo: '#84cc16',
  baixo:       '#eab308',
  moderado:    '#f97316',
  alto:        '#ef4444',
  muito_alto:  '#b91c1c',
  intoleravel: '#7f1d1d',
}

// Componente helper para as barrinhas contínuas baseadas no peso do valor
const HRNBars = ({ label, value, max = 5 }: any) => {
  let bars = 1
  if (value > 15) bars = 5
  else if (value > 5) bars = 4
  else if (value > 2) bars = 3
  else if (value > 0.5) bars = 2
  
  // Cores de opacidade decrescente do vermelho #cc1b35 para criar o efeito visual
  const opacities = ['#cc1b35', '#e45063', '#f08693', '#f8b4bc', THEME.border]

  return (
    <View style={styles.probRow}>
      <Text style={styles.probLabel}>{label}</Text>
      <View style={styles.probBlocks}>
        {Array.from({ length: max }).map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.probBlock, 
              { backgroundColor: i < bars ? opacities[i] : THEME.border }
            ]} 
          />
        ))}
      </View>
    </View>
  )
}

export default function LaudoPDF({ laudo, perfil, fotosUrl }: any) {
  const equipamentos = laudo.equipamentos ?? []
  const cliente = laudo.clientes ?? {}
  const dataInspecao = laudo.data_inspecao
    ? new Date(laudo.data_inspecao + 'T00:00:00').toLocaleDateString('pt-BR')
    : '—'

  const Header = () => (
    <View style={styles.header} fixed>
      <View>
        <Text style={styles.headerTitle}>APR NR-12 — APRECIAÇÃO DE RISCO</Text>
        <Text style={styles.headerSub}>{cliente.razao_social}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.headerSub}>Doc: {laudo.numero_documento ?? '—'} | Rev: {laudo.revisao ?? '0'}</Text>
        <Text style={styles.headerSub}>Data: {dataInspecao}</Text>
      </View>
    </View>
  )

  const Footer = () => (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        Elaborado por: {perfil?.nome ?? '—'} {perfil?.crea ? `| CREA: ${perfil.crea}` : ''}
      </Text>
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} / ${totalPages}`} />
    </View>
  )

  return (
    <Document title={`APR NR-12 — ${cliente.razao_social}`} author={perfil?.nome}>
      {/* ===== PÁGINA 1: Capa Minimalista ===== */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverRoot}>
          <Text style={styles.coverTitle}>Laudo Técnico NR-12</Text>
          <Text style={styles.coverSubtitle}>
            Documento de análise técnica de segurança em máquinas e equipamentos, em conformidade com as exigências da Norma Regulamentadora NR-12 e NBR 14153.
          </Text>

          <View style={{ width: '100%', maxWidth: 400, marginTop: 20 }}>
            <View style={styles.coverMetaGrid}>
              <View style={styles.coverMetaRow}>
                <Text style={styles.coverMetaLabel}>Empresa Inspecionada</Text>
                <Text style={styles.coverMetaValue}>{cliente.razao_social ?? '—'}</Text>
              </View>
              <View style={styles.coverMetaRow}>
                <Text style={styles.coverMetaLabel}>CNPJ</Text>
                <Text style={styles.coverMetaValue}>{cliente.cnpj ?? '—'}</Text>
              </View>
              <View style={styles.coverMetaRow}>
                <Text style={styles.coverMetaLabel}>Localidade</Text>
                <Text style={styles.coverMetaValue}>{cliente.cidade ?? '—'} / {cliente.estado ?? '—'}</Text>
              </View>
              <View style={styles.coverMetaRow}>
                <Text style={styles.coverMetaLabel}>Data da Inspeção</Text>
                <Text style={styles.coverMetaValue}>{dataInspecao}</Text>
              </View>
              <View style={styles.coverMetaRow}>
                <Text style={styles.coverMetaLabel}>Documento e Revisão</Text>
                <Text style={styles.coverMetaValue}>Doc: {laudo.numero_documento ?? '—'} | Rev: {laudo.revisao ?? '0'}</Text>
              </View>
              <View style={styles.coverMetaRow}>
                <Text style={styles.coverMetaLabel}>Responsável Técnico</Text>
                <Text style={styles.coverMetaValue}>{perfil?.nome ?? '—'}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
      
      {/* ===== PÁGINA 2: Objetivo e Metodologia ===== */}
      <Page size="A4" style={styles.page}>
        <Header />
        <Footer />
        <View style={styles.pageContent}>
          <Text style={[styles.h2, { marginTop: 0 }]}>1. Objetivo do Laudo</Text>
          <View style={styles.card}>
            <Text style={styles.p}>
              O presente laudo técnico tem por objetivo realizar a Apreciação de Risco das máquinas e equipamentos instalados nas dependências da empresa {cliente.razao_social ?? '—'}, localizada em {cliente.cidade ?? '—'}/{cliente.estado ?? '—'}, em conformidade com a Norma Regulamentadora 12 (NR-12) do Ministério do Trabalho e Emprego e com a norma técnica ABNT NBR 14153.
            </Text>
          </View>

          <Text style={styles.h2}>3. Dashboard de Equipamentos Inspecionados</Text>
          <View style={{ marginBottom: 20 }}>
            {equipamentos.map((eq: any, i: number) => {
              const qtdNcs = (eq.nao_conformidades ?? []).length;
              const hasRisk = qtdNcs > 0;
              return (
                <View key={eq.id} style={{ flexDirection: 'row', backgroundColor: THEME.bg, borderRadius: 8, borderWidth: 1, borderColor: THEME.borderLight, padding: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 0.6 }}>
                    <View style={{ backgroundColor: THEME.accent, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ color: '#ffffff', fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{i + 1}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>{eq.nome}</Text>
                      {eq.modelo ? <Text style={{ fontSize: 8, color: THEME.textSecondary, marginTop: 2 }}>Mod: {eq.modelo}</Text> : null}
                    </View>
                  </View>
                  
                  <View style={{ flexDirection: 'row', flex: 0.4, justifyContent: 'flex-end', alignItems: 'center' }}>
                    {/* Chip Categoria */}
                    <View style={{ backgroundColor: THEME.cardBg, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4, borderWidth: 1, borderColor: THEME.borderLight, marginRight: 8 }}>
                      <Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase', marginBottom: 2 }}>Cat. NBR 14153</Text>
                      <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, textAlign: 'center' }}>{eq.categoria_resultado ?? '—'}</Text>
                    </View>
                    
                    {/* Chip NCs */}
                    <View style={{ backgroundColor: hasRisk ? '#fee2e2' : THEME.greyCard, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 4, minWidth: 60, alignItems: 'center' }}>
                      <Text style={{ fontSize: 7, color: hasRisk ? THEME.redMain : THEME.textSecondary, textTransform: 'uppercase', marginBottom: 2 }}>Riscos (NCs)</Text>
                      <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: hasRisk ? '#b91c1c' : THEME.textPrimary }}>
                        {qtdNcs}
                      </Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>

          <Text style={styles.h2}>4. Metodologia</Text>
          <View style={[styles.card, { marginBottom: 12 }]}>
            <Text style={styles.p}>
              A avaliação de risco foi realizada pela metodologia HRN (Hazard Rating Number), que quantifica os riscos pela fórmula HRN = LO × FE × DPH × NP, onde: LO = probabilidade de ocorrência, FE = frequência de exposição, DPH = grau de severidade do dano potencial e NP = número de pessoas expostas.
            </Text>
          </View>
          <View style={{ marginBottom: 24 }}>
            {[
              ['< 1', 'Aceitável', 'Nenhuma ação necessária', COR_HRN.aceitavel],
              ['1 – 4', 'Muito Baixo', 'Pode ser tolerado', COR_HRN.muito_baixo],
              ['5 – 49', 'Baixo', 'Atenção necessária', COR_HRN.baixo],
              ['50 – 99', 'Moderado', 'Ação corretiva necessária', COR_HRN.moderado],
              ['100 – 499', 'Alto', 'Ação imediata necessária', COR_HRN.alto],
              ['500 – 999', 'Muito Alto', 'Paralisação e ação urgente', COR_HRN.muito_alto],
              ['≥ 1000', 'Intolerável', 'Paralisação imediata', COR_HRN.intoleravel],
            ].map(([hrn, nivel, acao, cor]: any) => (
              <View key={hrn} style={{ flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: cor, backgroundColor: THEME.bg, borderRadius: 4, padding: 10, marginBottom: 6 }} wrap={false}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, width: 65 }}>{hrn}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', width: 100 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cor, marginRight: 6 }} />
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>{nivel}</Text>
                </View>
                <Text style={{ fontSize: 9, color: THEME.textSecondary, flex: 1 }}>{acao}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>5. Categorização de Risco (ABNT NBR 14153)</Text>
          <View style={styles.card} wrap={false}>
            <Text style={styles.p}>
              A determinação da categoria de risco para o maquinário avaliado baseia-se nos critérios da norma ABNT NBR 14153. A norma exige que a robustez necessária do sistema de comando de segurança seja definida através da análise de três parâmetros de exposição:
            </Text>
            
            {/* Cards de Parâmetros S/F/P */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 16 }}>
              <View style={{ flex: 1, backgroundColor: THEME.bg, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: THEME.borderLight, marginRight: 8 }}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.accent, marginBottom: 6 }}>S (Severidade do Dano)</Text>
                <Text style={{ fontSize: 9, color: THEME.textSecondary, marginBottom: 4 }}><Text style={{ color: THEME.textPrimary, fontFamily: 'Helvetica-Bold' }}>S1:</Text> Leve ou Reversível</Text>
                <Text style={{ fontSize: 9, color: THEME.textSecondary }}><Text style={{ color: THEME.textPrimary, fontFamily: 'Helvetica-Bold' }}>S2:</Text> Grave ou Irreversível</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: THEME.bg, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: THEME.borderLight, marginRight: 8 }}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.accent, marginBottom: 6 }}>F (Frequência de Exposição)</Text>
                <Text style={{ fontSize: 9, color: THEME.textSecondary, marginBottom: 4 }}><Text style={{ color: THEME.textPrimary, fontFamily: 'Helvetica-Bold' }}>F1:</Text> Rara a pouca exposição</Text>
                <Text style={{ fontSize: 9, color: THEME.textSecondary }}><Text style={{ color: THEME.textPrimary, fontFamily: 'Helvetica-Bold' }}>F2:</Text> Frequente a Contínua</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: THEME.bg, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: THEME.borderLight }}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.accent, marginBottom: 6 }}>P (Possibilidade de Evitar)</Text>
                <Text style={{ fontSize: 9, color: THEME.textSecondary, marginBottom: 4 }}><Text style={{ color: THEME.textPrimary, fontFamily: 'Helvetica-Bold' }}>P1:</Text> Possível sob condições certas</Text>
                <Text style={{ fontSize: 9, color: THEME.textSecondary }}><Text style={{ color: THEME.textPrimary, fontFamily: 'Helvetica-Bold' }}>P2:</Text> Quase impossível</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ flex: 0.45, paddingRight: 16 }}>
                <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, marginBottom: 8 }}>Requisitos Operacionais</Text>
                <Text style={{ fontSize: 9, color: THEME.textSecondary, lineHeight: 1.5, marginBottom: 12 }}>
                  Nas fichas a seguir, cada equipamento apresentará um resultado da análise. Ex: os parâmetros identificados foram S2, F1 e P1 resultando na classificação de Categoria 1, 2, 3 ou 4.
                </Text>
                <View style={{ borderLeftWidth: 2, borderLeftColor: THEME.accent, paddingLeft: 8 }}>
                  <Text style={{ fontSize: 9, color: THEME.textSecondary, marginBottom: 8, lineHeight: 1.4 }}>
                    <Text style={{ color: THEME.textPrimary, fontFamily: 'Helvetica-Bold' }}>Cat 3:</Text> A ocorrência de um único defeito não deve resultar na perda da função de segurança.
                  </Text>
                  <Text style={{ fontSize: 9, color: THEME.textSecondary, lineHeight: 1.4 }}>
                    <Text style={{ color: THEME.textPrimary, fontFamily: 'Helvetica-Bold' }}>Cat 4:</Text> Um único defeito deve ser detectado antes da próxima atuação e o acúmulo de defeitos não pode comprometer a segurança.
                  </Text>
                </View>
              </View>
              <View style={{ flex: 0.55, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: THEME.borderLight, backgroundColor: '#ffffff', padding: 10 }}>
                <PDFImage src={NBR_IMAGE_B64} style={{ width: '100%', height: 180, objectFit: 'contain' }} />
              </View>
            </View>
          </View>
        </View>
      </Page>

      {/* ===== PÁGINAS DE EQUIPAMENTOS ===== */}
      {equipamentos.map((eq: any, eqIdx: number) => {
        const ncs = eq.nao_conformidades ?? []
        return (
          <Page key={eq.id} size="A4" style={styles.page}>
            <Header />
            <Footer />
            
            <View style={styles.pageContent}>
              <Text style={styles.h2}>{eqIdx + 5}. Emissão de Avaliação</Text>
              
              {/* O NOVO CABEÇALHO GIGANTE (FAIXA EDITORIAL) */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ backgroundColor: THEME.accent, padding: 14, borderRadius: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#ffffff', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, marginRight: 10 }}>
                      <Text style={{ fontSize: 9, color: THEME.accent, fontWeight: 700 }}>TAG {String(eqIdx + 1).padStart(2, '0')}</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>{eq.nome}</Text>
                  </View>
                  <Text style={{ fontSize: 9, color: '#ffffff', opacity: 0.9 }}>
                    NBR 14153: {eq.categoria_resultado ?? '—'}
                  </Text>
                </View>
                
                {/* Foto geral do equipamento */}
                {fotosUrl[`eq_${eq.id}`] ? (
                  <View style={{ marginBottom: 16, backgroundColor: THEME.cardBg }}>
                    <PDFImage src={fotosUrl[`eq_${eq.id}`]} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 }} />
                    <Text style={{ fontSize: 8, color: THEME.textSecondary, padding: 6, textAlign: 'center' }}>Vista geral — {eq.nome}</Text>
                  </View>
                ) : null}

                {/* Resumo Dinâmico do Equipamento */}
                <View style={{ marginBottom: 24, backgroundColor: THEME.bg, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: THEME.borderLight }} wrap={false}>
                  <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, marginBottom: 10 }}>Resumo de Diagnóstico — {eq.nome}</Text>
                  
                  {/* Cards KPIs */}
                  <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                    <View style={{ flex: 1, backgroundColor: THEME.cardBg, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: THEME.borderLight, marginRight: 8 }}>
                      <Text style={{ fontSize: 8, color: THEME.textSecondary, textTransform: 'uppercase' }}>Volume de Riscos</Text>
                      <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, marginTop: 4 }}>{ncs.length} <Text style={{ fontSize: 9, color: THEME.textSecondary, fontFamily: 'Helvetica' }}>NCs</Text></Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: THEME.cardBg, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: THEME.borderLight, marginRight: 8, borderLeftWidth: 3, borderLeftColor: THEME.redMain }}>
                      <Text style={{ fontSize: 8, color: THEME.textSecondary, textTransform: 'uppercase' }}>Maior Índice HRN</Text>
                      <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: THEME.redMain, marginTop: 4 }}>
                        {ncs.length > 0 ? Math.max(...ncs.map((nc: any) => parseFloat(nc.hrn || '0'))) : '0'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: THEME.cardBg, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: THEME.borderLight, borderLeftWidth: 3, borderLeftColor: THEME.accent }}>
                      <Text style={{ fontSize: 8, color: THEME.textSecondary, textTransform: 'uppercase' }}>Categoria NBR</Text>
                      <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: THEME.accent, marginTop: 4 }}>
                        {eq.categoria_resultado ?? 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* Tabela Resumo das NCs */}
                  {ncs.length > 0 ? (
                    <View style={[styles.table, { marginBottom: 0 }]}>
                      <View style={styles.tableHeader}>
                        <Text style={[styles.tableCellHeader, { flex: 0.15 }]}>Item</Text>
                        <Text style={[styles.tableCellHeader, { flex: 0.65 }]}>Não Conformidade Encontrada</Text>
                        <Text style={[styles.tableCellHeader, { flex: 0.2 }]}>HRN</Text>
                      </View>
                      {ncs.map((nc: any, nIdx: number) => {
                        const rowColorHex = nc.nivel_hrn ? COR_HRN[nc.nivel_hrn] : THEME.redMain;
                        return (
                          <View key={nc.id} style={nIdx % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                            <Text style={[styles.tableCell, { flex: 0.15, fontFamily: 'Helvetica-Bold' }]}>{nc.item_nr12 || '--'}</Text>
                            <Text style={[styles.tableCell, { flex: 0.65, color: THEME.textPrimary }]}>{nc.titulo_nc || 'Risco identificado'}</Text>
                            <View style={{ flex: 0.2, flexDirection: 'row', alignItems: 'center' }}>
                              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: rowColorHex, marginRight: 4 }} />
                              <Text style={{ fontSize: 8, color: THEME.textPrimary, fontFamily: 'Helvetica-Bold' }}>{nc.hrn ?? '--'}</Text>
                            </View>
                          </View>
                        )
                      })}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 9, color: THEME.textSecondary, fontStyle: 'italic' }}>Nenhuma não conformidade registrada neste equipamento.</Text>
                  )}
                </View>

                {/* As NCs agora seguem diretamente dentro deste fluxo ou como "cartões embutidos" */}
                {ncs.map((nc: any, ncIdx: number) => {
                  const fotosNC = nc.fotos_nc ?? []
                  const colorHex = nc.nivel_hrn ? COR_HRN[nc.nivel_hrn] : THEME.redMain
                  
                  return (
                    <View key={nc.id} style={{ marginBottom: 32, backgroundColor: THEME.cardBg, borderRadius: 8, borderWidth: 1, borderColor: THEME.borderLight, overflow: 'hidden' }}>
                      
                      {/* BLOCO HEADER: Foto e Título unidos (evita viúva/órfã agressiva, mas não quebra layout inteiro) */}
                      <View wrap={false}>
                        {/* TOP: FOTO COM ARESTAS ARREDONDADAS (MARGEM SEGURA) */}
                        <View style={{ position: 'relative', height: 280, backgroundColor: THEME.bg, justifyContent: 'center', alignItems: 'center', margin: 12, marginBottom: 4 }}>
                          {fotosNC.length > 0 && fotosUrl[fotosNC[0].id] ? (
                            <PDFImage src={fotosUrl[fotosNC[0].id]} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6, borderWidth: 1, borderColor: THEME.borderLight }} />
                          ) : (
                            <Text style={{color: '#94a3b8', fontSize: 12}}>Sem Imagem Registrada</Text>
                          )}
                          
                          {/* MEGA BADGE (HRN) */}
                          <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: colorHex, padding: 12, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}>
                             <View>
                               <Text style={{ color: '#ffffff', fontSize: 18, fontFamily: 'Helvetica-Bold' }}>{nc.hrn ?? '---'}</Text>
                               <Text style={{ color: '#ffffff', fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', opacity: 0.9 }}>ÍNDICE HRN</Text>
                             </View>
                             <View style={{ marginLeft: 12, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.3)', justifyContent: 'center' }}>
                               <Text style={{ color: '#ffffff', fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{nc.nivel_hrn ? labelNivelHRN(nc.nivel_hrn as NivelHRN).toUpperCase() : 'N/A'}</Text>
                             </View>
                          </View>
                        </View>
                        
                        <View style={{ padding: 16, paddingBottom: 0 }}>
                          {/* CABEÇALHO E METADADOS */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: THEME.borderLight, paddingBottom: 10 }}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                              <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>
                                NC {String(ncIdx + 1).padStart(2, '0')} — {nc.titulo_nc || 'Risco identificado'}
                              </Text>
                              <Text style={{ fontSize: 9, color: THEME.textSecondary, marginTop: 4 }}>
                                Legenda: {fotosNC[0]?.legenda || 'Nenhuma legenda informada para a foto principal.'}
                              </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end', backgroundColor: THEME.bg, padding: 6, borderRadius: 6, borderWidth: 1, borderColor: THEME.borderLight }}>
                              <Text style={{ fontSize: 7, color: THEME.textSecondary, textTransform: 'uppercase' }}>Referência Normativa</Text>
                              <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: THEME.accent, marginTop: 2 }}>Item {nc.item_nr12 || '--'}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      
                      {/* BLOCO TEXTOS: Permite quebra fluída de página (Engine Wrap) */}
                      <View style={{ padding: 16, paddingTop: 0 }}>

                        {/* BLOCOS EDITORIAIS EMPILHADOS — cada seção é um mini-card independente */}
                        {/* Chip de Risco */}
                        <View style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'center', backgroundColor: THEME.bg, padding: 8, borderRadius: 6, borderWidth: 1, borderColor: THEME.borderLight }} wrap={false}>
                          <Text style={{ fontSize: 8, color: THEME.textSecondary, marginRight: 6, textTransform: 'uppercase' }}>Risco Foco da NC:</Text>
                          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary }}>{nc.risco || 'Não informado'}</Text>
                        </View>

                        {/* Bloco 1: Diagnóstico */}
                        {nc.texto_identificacao ? (
                          <View style={{ marginBottom: 10, borderLeftWidth: 3, borderLeftColor: THEME.iconDiag, backgroundColor: THEME.bg, borderRadius: 4, padding: 12 }} wrap={false}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                              <Svg viewBox="0 0 24 24" width="12" height="12" style={{ marginRight: 6 }}><Path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill={THEME.iconDiag} /></Svg>
                              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.iconDiag }}>Diagnóstico da Situação</Text>
                            </View>
                            <Text style={{ fontSize: 9, color: THEME.textSecondary, lineHeight: 1.5, textAlign: 'justify', paddingLeft: 18 }}>{nc.texto_identificacao}</Text>
                          </View>
                        ) : null}

                        {/* Bloco 2: Ação Recomendada */}
                        {nc.texto_recomendacao ? (
                          <View style={{ marginBottom: 10, borderLeftWidth: 3, borderLeftColor: THEME.iconAction, backgroundColor: THEME.bg, borderRadius: 4, padding: 12 }} wrap={false}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                              <Svg viewBox="0 0 24 24" width="12" height="12" style={{ marginRight: 6 }}><Path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill={THEME.iconAction} /></Svg>
                              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.iconAction }}>Ação Recomendada (NR-12)</Text>
                            </View>
                            <Text style={{ fontSize: 9, color: THEME.textSecondary, lineHeight: 1.5, textAlign: 'justify', paddingLeft: 18 }}>{nc.texto_recomendacao}</Text>
                          </View>
                        ) : null}

                        {/* Bloco 3: Medidas Complementares */}
                        {nc.medida_controle ? (
                          <View style={{ marginBottom: 10, borderLeftWidth: 3, borderLeftColor: THEME.iconCheck, backgroundColor: THEME.bg, borderRadius: 4, padding: 12 }} wrap={false}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                              <Svg viewBox="0 0 24 24" width="12" height="12" style={{ marginRight: 6 }}><Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill={THEME.iconCheck} /></Svg>
                              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.iconCheck }}>Medidas Complementares de Controle</Text>
                            </View>
                            <Text style={{ fontSize: 9, color: THEME.textSecondary, lineHeight: 1.5, textAlign: 'justify', paddingLeft: 18 }}>{nc.medida_controle}</Text>
                          </View>
                        ) : null}

                        {/* FOTOS ADICIONAIS */}
                        {fotosNC.length > 1 ? (
                          <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: THEME.borderLight, paddingTop: 10 }}>
                            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, marginBottom: 8 }}>Fotos Adicionais da NC</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3 }}>
                              {fotosNC.slice(1).map((foto: any) => (
                                fotosUrl[foto.id] ? (
                                  <View key={foto.id} style={{ width: '50%', paddingHorizontal: 3, marginBottom: 6 }}>
                                    <View style={{ borderWidth: 1, borderColor: THEME.borderLight, borderRadius: 6 }}>
                                      <PDFImage src={fotosUrl[foto.id]} style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6 }} />
                                      {foto.legenda ? <Text style={{ fontSize: 7, color: THEME.textSecondary, padding: 5 }}>{foto.legenda}</Text> : null}
                                    </View>
                                  </View>
                                ) : null
                              ))}
                            </View>
                          </View>
                        ) : null}

                        {/* HRN breakdown minimalista no rodapé do bloco de texto */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: THEME.borderLight }}>
                          <View style={{ flex: 1, paddingRight: 4 }}><HRNBars label="Prob. (LO)" value={nc.lo} max={5} /></View>
                          <View style={{ flex: 1, paddingRight: 4 }}><HRNBars label="Freq. (FE)" value={nc.fe} max={5} /></View>
                          <View style={{ flex: 1, paddingRight: 4 }}><HRNBars label="Dano (DPH)" value={nc.dph} max={5} /></View>
                          <View style={{ flex: 1 }}><HRNBars label="Pessoas (NP)" value={nc.np} max={5} /></View>
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>
          </Page>
        )
      })}

      {/* ===== PÁGINA FINAL: Considerações Finais ===== */}
      <Page size="A4" style={styles.page}>
        <Header />
        <Footer />
        <View style={styles.pageContent}>
          <Text style={styles.h2}>Considerações Finais</Text>
          <View style={styles.card}>
            <Text style={styles.p}>
              Com base na Apreciação de Risco realizada, foram identificadas as não conformidades descritas neste documento, com seus respectivos níveis de risco quantificados pela metodologia HRN. Recomenda-se a implantação imediata das medidas de controle indicadas, priorizando as não conformidades de maior HRN, conforme a hierarquia de controles estabelecida na NR-12.
            </Text>
          </View>

          {/* Tabela consolidada */}
          <Text style={styles.h3}>Resumo Consolidado de Intervenções</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, { flex: 0.25 }]}>Equipamento</Text>
              <Text style={[styles.tableCellHeader, { flex: 0.15 }]}>Item</Text>
              <Text style={[styles.tableCellHeader, { flex: 0.35 }]}>Não Conformidade</Text>
              <Text style={[styles.tableCellHeader, { flex: 0.25 }]}>Ação (HRN)</Text>
            </View>
            {equipamentos.flatMap((eq: any) =>
              (eq.nao_conformidades ?? []).map((nc: any, i: number) => (
                <View key={nc.id} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 0.25, color: THEME.textPrimary }]}>{eq.nome}</Text>
                  <Text style={[styles.tableCell, { flex: 0.15 }]}>{nc.item_nr12}</Text>
                  <Text style={[styles.tableCell, { flex: 0.35 }]}>{nc.titulo_nc}</Text>
                  <View style={{ flex: 0.25, flexDirection: 'column' }}>
                    <Text style={{ fontSize: 8, color: THEME.textPrimary, fontFamily: 'Helvetica-Bold' }}>HRN: {nc.hrn ?? '—'}</Text>
                    <Text style={{ fontSize: 7, color: THEME.textSecondary }}>{nc.nivel_hrn ? labelNivelHRN(nc.nivel_hrn as NivelHRN) : '—'}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Hierarquia de controles */}
          <Text style={styles.h3}>Hierarquia de Medidas de Controle</Text>
          <Text style={styles.p}>Conforme a NR-12 e a ISO 12100, as medidas devem ser tratadas na seguinte ordem:</Text>
          <View>
            {[
              ['1º', 'Eliminação', 'Eliminar o perigo por projeto'],
              ['2º', 'Substituição', 'Substituir por solução de menor risco'],
              ['3º', 'Controles de Engenharia', 'Proteções, intertravamentos, dispositivos de segurança'],
              ['4º', 'Controles Administrativos', 'POPs, treinamentos, sinalização'],
              ['5º', 'EPI', 'Equipamentos de proteção individual como última medida'],
            ].map(([ord, titulo, desc]) => (
              <View key={ord} style={styles.hierarquiaItem}>
                <Text style={styles.hierarquiaOrd}>{ord}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, marginBottom: 2 }}>{titulo}</Text>
                  <Text style={{ fontSize: 8, color: THEME.textSecondary }}>{desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Assinatura */}
          <View style={styles.assinaturaBox} wrap={false}>
            <View style={styles.assinaturaLinha} />
            <Text style={styles.assinaturaNome}>{perfil?.nome ?? 'Profissional Responsável'}</Text>
            {perfil?.crea ? <Text style={styles.assinaturaSub}>CREA: {perfil.crea}</Text> : null}
            <Text style={styles.assinaturaSub}>Responsável Técnico</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
