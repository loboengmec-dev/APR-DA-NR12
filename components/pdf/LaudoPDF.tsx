import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PDFImage,
} from '@react-pdf/renderer'
import { labelNivelHRN } from '@/lib/hrn'
import type { NivelHRN } from '@/types'

const THEME = {
  bg: '#f8fafc',
  cardBg: '#ffffff',
  textSecondary: '#71717a',
  textPrimary: '#3f3f46',
  border: '#e4e4e7',
  borderLight: '#f4f4f5',
  redMain: '#cd223c',      // main red used for HRN box
  redDark: '#be123c',      // dark red for the dot
  blue: '#1d4ed8',
  greyCard: '#f4f4f5',     // background for image and NC side panel
  redLight: '#ffe4e6',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: THEME.bg,
    color: THEME.textPrimary,
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 0,
  },
  pageContent: { marginHorizontal: 40 },
  
  // Headings globais
  h1: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: THEME.blue, marginBottom: 4, textAlign: 'center' },
  h2: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: THEME.blue, marginBottom: 8, marginTop: 12, borderBottomWidth: 1, borderBottomColor: THEME.border, paddingBottom: 4 },
  h3: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, marginBottom: 6, marginTop: 8 },
  p: { fontSize: 9, color: THEME.textSecondary, lineHeight: 1.5, marginBottom: 6, textAlign: 'justify' },
  
  // Cabeçalho Fixo
  header: {
    position: 'absolute', top: 20, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    borderBottomWidth: 1, borderBottomColor: THEME.border, paddingBottom: 6,
  },
  headerTitle: { fontSize: 9, color: THEME.blue, fontFamily: 'Helvetica-Bold' },
  headerSub: { fontSize: 7, color: THEME.textSecondary, marginTop: 2 },
  
  // Rodapé Fixo
  footer: {
    position: 'absolute', bottom: 20, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: 6,
  },
  footerText: { fontSize: 7, color: THEME.textSecondary },

  // Cartão Genérico e Tabelas Antigas
  card: {
    backgroundColor: THEME.cardBg,
    borderRadius: 8, borderWidth: 1, borderColor: THEME.borderLight,
    padding: 16, marginBottom: 16,
  },
  table: { width: '100%', marginBottom: 12, borderRadius: 6, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: THEME.borderLight, padding: 6, borderBottomWidth: 1, borderBottomColor: THEME.border },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: THEME.border, padding: 6, backgroundColor: THEME.cardBg },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: THEME.border, padding: 6, backgroundColor: THEME.bg },
  tableCell: { fontSize: 8, flex: 1, paddingHorizontal: 2, color: THEME.textSecondary },
  tableCellHeader: { fontSize: 8, flex: 1, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, paddingHorizontal: 2 },
  hierarquiaItem: { flexDirection: 'row', marginBottom: 6, backgroundColor: THEME.cardBg, padding: 8, borderRadius: 6, borderWidth: 1, borderColor: THEME.borderLight },
  hierarquiaOrd: { fontSize: 10, fontFamily: 'Helvetica-Bold', width: 24, color: THEME.blue },

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
    backgroundColor: THEME.border, paddingVertical: 4, paddingHorizontal: 7,
    borderRadius: 4, marginRight: 8,
  },
  tagText: { fontSize: 9, color: THEME.textSecondary, fontFamily: 'Helvetica-Bold' },
  eqTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary },
  
  riskBadge: { flexDirection: 'row', alignItems: 'center' },
  dotRisk: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.redDark, marginRight: 4 },
  riskText: { fontSize: 9, color: THEME.redDark, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
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
  ncLabelMini: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, marginBottom: 2 },
  ncTitleMini: { fontSize: 9, color: THEME.textPrimary, marginBottom: 8, lineHeight: 1.3 },
  
  hrnBoxRed: {
    backgroundColor: THEME.redMain, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12,
    marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
  },
  hrnBoxValueText: { color: '#ffffff', fontSize: 18, fontFamily: 'Helvetica-Bold' },
  hrnBoxLabel: { color: '#ffffff', fontSize: 10, fontFamily: 'Helvetica-Bold' },
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
  ncSubtitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary, flex: 0.8 },
  ncMetaRow: { flexDirection: 'row', marginBottom: 12 },
  ncMetaItem: { fontSize: 9, color: THEME.textSecondary, marginRight: 16 },
  ncMetaValue: { fontFamily: 'Helvetica-Bold', color: THEME.textPrimary },
  
  // HRN Pill Flutuante
  hrnPill: {
    backgroundColor: THEME.redLight, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4,
    flexDirection: 'row', alignItems: 'center',
  },
  
  // Blocos de Texto
  detailSection: { marginBottom: 12 },
  detailTitleBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detailTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: THEME.textPrimary },
  iconCircle: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: '#d4d4d8',
    justifyContent: 'center', alignItems: 'center', marginRight: 6,
  },
  iconCheck: { fontSize: 8, color: '#ffffff', fontFamily: 'Helvetica-Bold' },
  
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
  assinaturaNome: { fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'center', width: 200 },
  assinaturaSub: { fontSize: 8, color: THEME.textSecondary, textAlign: 'center', width: 200 },
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
      {/* ===== PÁGINA 1: Capa / Identificação ===== */}
      <Page size="A4" style={styles.page}>
        <Header />
        <Footer />
        <View style={styles.pageContent}>
          <View style={{ marginBottom: 20, marginTop: 10 }}>
            <Text style={styles.h1}>APRECIAÇÃO DE RISCO</Text>
            <Text style={{ fontSize: 10, textAlign: 'center', color: THEME.textSecondary }}>Conforme NR-12 e ABNT NBR 14153</Text>
          </View>

          <Text style={styles.h2}>1. Identificação</Text>
          <View style={styles.table}>
            {[
              ['Cliente', cliente.razao_social ?? '—'],
              ['CNPJ', cliente.cnpj ?? '—'],
              ['Endereço', `${cliente.endereco ?? ''} — ${cliente.cidade ?? ''}/${cliente.estado ?? ''}`],
              ['Data da Inspeção', dataInspecao],
              ['Documento', laudo.numero_documento ?? '—'],
              ['Revisão', laudo.revisao ?? '0'],
              ['Responsável Técnico', perfil?.nome ?? '—'],
              ['CREA', perfil?.crea ?? '—'],
            ].map(([label, valor]: any, i) => (
              <View key={label} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold', flex: 0.3, color: THEME.textPrimary }]}>{label}</Text>
                <Text style={[styles.tableCell, { flex: 0.7 }]}>{valor}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>2. Objetivo</Text>
          <View style={styles.card}>
            <Text style={styles.p}>
              O presente laudo técnico tem por objetivo realizar a Apreciação de Risco das máquinas e equipamentos instalados nas dependências da empresa {cliente.razao_social ?? '—'}, localizada em {cliente.cidade ?? '—'}/{cliente.estado ?? '—'}, em conformidade com a Norma Regulamentadora 12 (NR-12) do Ministério do Trabalho e Emprego e com a norma técnica ABNT NBR 14153.
            </Text>
          </View>

          <Text style={styles.h2}>3. Equipamentos Inspecionados</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, { flex: 0.1 }]}>Nº</Text>
              <Text style={[styles.tableCellHeader, { flex: 0.5 }]}>Equipamento</Text>
              <Text style={[styles.tableCellHeader, { flex: 0.2 }]}>Categoria</Text>
              <Text style={[styles.tableCellHeader, { flex: 0.2 }]}>NCs</Text>
            </View>
            {equipamentos.map((eq: any, i: number) => (
              <View key={eq.id} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.1 }]}>{i + 1}</Text>
                <Text style={[styles.tableCell, { flex: 0.5, color: THEME.textPrimary }]}>{eq.nome} {eq.modelo ? `(${eq.modelo})` : ''}</Text>
                <Text style={[styles.tableCell, { flex: 0.2 }]}>{eq.categoria_resultado ?? '—'}</Text>
                <Text style={[styles.tableCell, { flex: 0.2 }]}>{(eq.nao_conformidades ?? []).length}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>4. Metodologia</Text>
          <View style={[styles.card, { marginBottom: 12 }]}>
            <Text style={styles.p}>
              A avaliação de risco foi realizada pela metodologia HRN (Hazard Rating Number), que quantifica os riscos pela fórmula HRN = LO × FE × DPH × NP, onde: LO = probabilidade de ocorrência, FE = frequência de exposição, DPH = grau de severidade do dano potencial e NP = número de pessoas expostas. A categorização de segurança foi determinada conforme a ABNT NBR 14153 (Performance Level).
            </Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, { flex: 0.2 }]}>HRN</Text>
              <Text style={[styles.tableCellHeader, { flex: 0.3 }]}>Nível de Risco</Text>
              <Text style={[styles.tableCellHeader, { flex: 0.5 }]}>Ação Necessária</Text>
            </View>
            {[
              ['< 1', 'Aceitável', 'Nenhuma ação necessária', COR_HRN.aceitavel],
              ['1 – 4', 'Muito Baixo', 'Pode ser tolerado', COR_HRN.muito_baixo],
              ['5 – 49', 'Baixo', 'Atenção necessária', COR_HRN.baixo],
              ['50 – 99', 'Moderado', 'Ação corretiva necessária', COR_HRN.moderado],
              ['100 – 499', 'Alto', 'Ação imediata necessária', COR_HRN.alto],
              ['500 – 999', 'Muito Alto', 'Paralisação e ação urgente', COR_HRN.muito_alto],
              ['≥ 1000', 'Intolerável', 'Paralisação imediata', COR_HRN.intoleravel],
            ].map(([hrn, nivel, acao, cor]: any, i) => (
              <View key={hrn} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.2, fontFamily: 'Helvetica-Bold' }]}>{hrn}</Text>
                <View style={{ flex: 0.3, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cor, marginRight: 4 }} />
                  <Text style={{ fontSize: 8, color: THEME.textPrimary }}>{nivel}</Text>
                </View>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>{acao}</Text>
              </View>
            ))}
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
              
              {/* O NOVO CABEÇALHO GIGANTE (EQ CONTAINER) */}
              <View style={styles.eqContainer}>
                <View style={styles.eqHeader}>
                  <View style={styles.eqHeaderLeft}>
                    <View style={styles.tagPill}>
                      <Text style={styles.tagText}>| TAG {String(eqIdx + 1).padStart(2, '0')}</Text>
                    </View>
                    <Text style={styles.eqTitle}>{eq.nome}</Text>
                  </View>
                  <View style={styles.riskBadge}>
                    <View style={styles.dotRisk} />
                    <Text style={styles.riskText}>RISCO ALTO</Text>
                  </View>
                </View>
                
                <Text style={styles.eqSub}>
                  Categoria NBR 14153: {eq.categoria_resultado ?? '—'} | S{eq.categoria_s ?? '?'} · F{eq.categoria_f ?? '?'} · P{eq.categoria_p ?? '?'}
                </Text>
                
                {/* Foto geral do equipamento */}
                {fotosUrl[`eq_${eq.id}`] ? (
                  <View style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: THEME.borderLight }}>
                    <PDFImage src={fotosUrl[`eq_${eq.id}`]} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                    <Text style={{ fontSize: 8, color: THEME.textSecondary, padding: 6, backgroundColor: THEME.greyCard }}>Vista geral — {eq.nome}</Text>
                  </View>
                ) : null}

                {/* As NCs agora seguem diretamente dentro deste fluxo ou como "cartões embutidos" */}
                {ncs.map((nc: any, ncIdx: number) => {
                  const fotosNC = nc.fotos_nc ?? []
                  const colorHex = nc.nivel_hrn ? COR_HRN[nc.nivel_hrn] : THEME.redMain
                  
                  return (
                    <View key={nc.id} style={{ marginBottom: 24 }} wrap={false}>
                      
                      {/* PAINEL DUPLO FOTO + HRN */}
                      <View style={styles.ncGrid}>
                        {/* Esquerda: Foto */}
                        <View style={styles.ncColLeft}>
                          <View style={styles.photoCard}>
                            <View style={styles.photoWrapper}>
                              {fotosNC.length > 0 && fotosUrl[fotosNC[0].id] ? (
                                <PDFImage src={fotosUrl[fotosNC[0].id]} style={styles.fotoNC} />
                              ) : (
                                <View style={styles.semFotoBox}>
                                  <Text style={{color: '#94a3b8', fontSize: 10}}>Sem Imagem</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.photoCaption}>
                              {fotosNC[0]?.legenda || nc.texto_identificacao || 'Ponto de perigo não especificado'}
                            </Text>
                          </View>
                        </View>
                        
                        {/* Direita: Card HRN */}
                        <View style={styles.ncColRight}>
                          <View style={styles.hrnCard}>
                            <Text style={styles.ncLabelMini}>NC {String(ncIdx + 1).padStart(2, '0')}</Text>
                            <Text style={styles.ncTitleMini}>{nc.titulo_nc || 'Risco indentificado'}</Text>
                            
                            <View style={[styles.hrnBoxRed, { backgroundColor: colorHex }]}>
                              <Text style={styles.hrnBoxLabel}>HRN:</Text>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.hrnBoxValueText}>{nc.hrn ?? '---'}</Text>
                                <Text style={styles.hrnBoxRisk}>{nc.nivel_hrn ? labelNivelHRN(nc.nivel_hrn as NivelHRN) : 'N/A'}</Text>
                              </View>
                            </View>
                            
                            <View style={{ marginTop: 2 }}>
                              <HRNBars label="Probabilidade" value={nc.lo} max={5} />
                              <HRNBars label="LO" value={nc.lo} max={5} />
                              <HRNBars label="FE" value={nc.fe} max={5} />
                              <HRNBars label="NP" value={nc.np} max={5} />
                              <HRNBars label="DPH" value={nc.dph} max={5} />
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* FOTOS ADICIONAIS DA NC (2ª em diante) */}
                      {fotosNC.length > 1 ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, marginHorizontal: -2 }}>
                          {fotosNC.slice(1).map((foto: any) => (
                            fotosUrl[foto.id] ? (
                              <View key={foto.id} style={{ width: '50%', paddingHorizontal: 2, marginBottom: 4 }}>
                                <View style={{ borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: THEME.borderLight }}>
                                  <PDFImage src={fotosUrl[foto.id]} style={{ width: '100%', height: 100, objectFit: 'cover' }} />
                                  {foto.legenda ? <Text style={{ fontSize: 7, color: THEME.textSecondary, padding: 4 }}>{foto.legenda}</Text> : null}
                                </View>
                              </View>
                            ) : null
                          ))}
                        </View>
                      ) : null}

                      {/* PAINEL INFERIOR DETALHES DA NC */}
                      <View style={styles.ncDetailsBox}>
                        
                        <View style={styles.ncSubtitleRow}>
                          <Text style={styles.ncSubtitle}>
                            NC {String(ncIdx + 1).padStart(2, '0')} — {nc.titulo_nc}
                          </Text>
                          <View style={[styles.hrnPill, { backgroundColor: THEME.redLight }]}>
                            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: THEME.redDark }}>
                              HRN: {nc.hrn ?? '--'} <Text style={{ fontSize: 7 }}>{nc.nivel_hrn ? labelNivelHRN(nc.nivel_hrn as NivelHRN) : ''}</Text>
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.ncMetaRow}>
                          <Text style={styles.ncMetaItem}>NR-12: <Text style={styles.ncMetaValue}>{nc.item_nr12 || '--'}</Text></Text>
                          <Text style={styles.ncMetaItem}>Risco: <Text style={styles.ncMetaValue}>{nc.risco || '--'}</Text></Text>
                        </View>

                        {/* Diagnóstico */}
                        {nc.texto_identificacao ? (
                          <View style={styles.detailSection}>
                            <View style={styles.detailTitleBox}>
                              <Text style={styles.detailTitle}>Diagnóstico</Text>
                            </View>
                            <Text style={[styles.detailText, { marginLeft: 0 }]}>{nc.texto_identificacao}</Text>
                          </View>
                        ) : null}
                        
                        {/* Recomendação */}
                        {nc.texto_recomendacao ? (
                          <View style={styles.detailSection}>
                            <View style={styles.detailTitleBox}>
                              <View style={styles.iconCircle}><Text style={styles.iconCheck}>✓</Text></View>
                              <Text style={styles.detailTitle}>Recomendação</Text>
                            </View>
                            
                            <View style={styles.bulletList}>
                              <View style={styles.bulletItem}>
                                <Text style={styles.bulletArrow}>→</Text>
                                <Text style={styles.bulletText}>{nc.texto_recomendacao}</Text>
                              </View>
                              
                              {/* Quadradinhos Visuais Decorativos */}
                              <View style={[styles.bulletItem, { marginTop: 4 }]}>
                                <Text style={styles.bulletArrowSub}>→</Text>
                                <View style={styles.recBlocks}>
                                  <View style={styles.recBlockRed} />
                                  <View style={styles.recBlockOrange} />
                                  <View style={styles.recBlockYellow} />
                                  <View style={styles.recBlockGrey} />
                                </View>
                              </View>
                            </View>
                          </View>
                        ) : null}

                        {/* Medidas Complementares */}
                        {nc.medida_controle ? (
                          <View style={styles.detailSection}>
                            <View style={styles.detailTitleBox}>
                              <View style={styles.iconCircle}><Text style={styles.iconCheck}>✓</Text></View>
                              <Text style={styles.detailTitle}>Medidas Complementares</Text>
                            </View>
                            
                            <View style={styles.bulletList}>
                              <View style={styles.bulletItem}>
                                <Text style={styles.bulletArrow}>→</Text>
                                <Text style={styles.bulletText}>{nc.medida_controle}</Text>
                              </View>
                            </View>
                          </View>
                        ) : null}
                        
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
