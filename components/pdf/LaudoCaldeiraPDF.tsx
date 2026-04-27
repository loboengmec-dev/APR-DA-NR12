import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer'

// ============================================================================
// CONFIGURAÇÃO DE FONTES
// ============================================================================
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fMZhrib2Bg-4.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf', fontWeight: 700 },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#ea580c',
    paddingBottom: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1a2e4a',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#ea580c',
    marginTop: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    width: '48%',
    marginBottom: 8,
  },
  label: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: 600,
  },
  value: {
    fontSize: 11,
    color: '#0f172a',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: '#64748b',
  },
  parecerBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#ea580c',
    marginTop: 20,
  },
  parecerText: {
    fontSize: 11,
    lineHeight: 1.5,
    color: '#1e293b',
  },
  signatureBox: {
    marginTop: 60,
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#475569',
    width: 250,
    marginBottom: 5,
  },
  signatureName: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0f172a',
  },
  signatureCREA: {
    fontSize: 10,
    color: '#475569',
    marginTop: 2,
  },
})

interface LaudoCaldeiraPDFProps {
  inspecao: any
  cliente: any
  usuario: any
}

export default function LaudoCaldeiraPDF({ inspecao, cliente, usuario }: LaudoCaldeiraPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* CABEÇALHO */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>LAUDO DE INSPEÇÃO DE CALDEIRA</Text>
            <Text style={styles.headerSubtitle}>Normas Requeridas: NR-13 e ASME Sec. I</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.headerSubtitle}>TAG: {inspecao?.tag ?? 'N/A'}</Text>
            <Text style={styles.headerSubtitle}>Data: {inspecao?.data_inspecao || 'N/A'}</Text>
          </View>
        </View>

        {/* IDENTIFICAÇÃO DO PROPRIETÁRIO */}
        <Text style={styles.sectionTitle}>1. PROPRIETÁRIO</Text>
        <View style={styles.grid}>
          <View style={styles.cell}>
            <Text style={styles.label}>NOME CORPORATIVO / RAZÃO SOCIAL</Text>
            <Text style={styles.value}>{cliente?.razao_social ?? 'Não informado'}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.label}>CNPJ</Text>
            <Text style={styles.value}>{cliente?.cnpj ?? 'Não informado'}</Text>
          </View>
        </View>

        {/* IDENTIFICAÇÃO DA CALDEIRA */}
        <Text style={styles.sectionTitle}>2. IDENTIFICAÇÃO DA CALDEIRA</Text>
        <View style={styles.grid}>
          <View style={styles.cell}>
            <Text style={styles.label}>TAG / IDENTIFICAÇÃO</Text>
            <Text style={styles.value}>{inspecao?.tag ?? 'N/A'}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.label}>FABRICANTE</Text>
            <Text style={styles.value}>{inspecao?.fabricante ?? 'N/A'}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.label}>SÉRIE E ANO</Text>
            <Text style={styles.value}>{inspecao?.numero_serie ?? 'N/A'} - {inspecao?.ano_fabricacao ?? 'N/A'}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.label}>CÓDIGO DE PROJETO</Text>
            <Text style={styles.value}>{inspecao?.codigo_projeto ?? 'N/A'}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.label}>CATEGORIA (NR-13)</Text>
            <Text style={styles.value}>{inspecao?.categoria_caldeira ?? 'B'}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.label}>PRESSÃO DE OPERAÇÃO (MPa)</Text>
            <Text style={styles.value}>{inspecao?.pressao_operacao_mpa ?? '0.00'}</Text>
          </View>
        </View>

        {/* AUDITORIA NR-13 */}
        <Text style={styles.sectionTitle}>3. AUDITORIA NR-13 E ITENS PRÓPRIOS DE CALDEIRAS</Text>
        <View style={styles.grid}>
          <View style={styles.cell}>
            <Text style={styles.label}>CONTROLE DE NÍVEL DE ÁGUA</Text>
            <Text style={styles.value}>{inspecao?.controle_nivel_intertravamento ?? 'N/A'}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.label}>DISTANCIAMENTO (CASA DE CALDEIRAS)</Text>
            <Text style={styles.value}>{inspecao?.distancia_instalacao ?? 'N/A'}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.label}>ILUMINAÇÃO DE EMERGÊNCIA</Text>
            <Text style={styles.value}>{inspecao?.iluminacao_emergencia ?? 'N/A'}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.label}>QUALIDADE DE ÁGUA / PRONTUÁRIO</Text>
            <Text style={styles.value}>{inspecao?.qualidade_agua ?? 'N/A'}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.label}>CERTIFICAÇÃO DO OPERADOR (OPC)</Text>
            <Text style={styles.value}>{inspecao?.certificacao_operador ?? 'N/A'}</Text>
          </View>
        </View>

        {/* CÁLCULO PMTA ASME */}
        <Text style={styles.sectionTitle}>4. MEMÓRIA DE CÁLCULO - ASME SECTION I</Text>
        <View style={styles.grid}>
          <View style={styles.cell}>
            <Text style={styles.label}>TENSÃO ADMISSÍVEL [S]</Text>
            <Text style={styles.value}>{inspecao?.material_s ?? 'N/A'} MPa</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.label}>EFICIÊNCIA DE JUNTA [E]</Text>
            <Text style={styles.value}>{inspecao?.eficiencia_e ?? 'N/A'}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.label}>ESPESSURA COSTADO MEDIDA</Text>
            <Text style={styles.value}>{inspecao?.espessura_costado ?? 'N/A'} mm</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.label}>ESPESSURA ESPELHO MEDIDA</Text>
            <Text style={styles.value}>{inspecao?.espessura_espelho ?? 'N/A'} mm</Text>
          </View>
        </View>
        
        <View style={{ marginTop: 10, padding: 8, backgroundColor: '#fff7ed', borderRadius: 4, width: '50%' }}>
          <Text style={{ fontSize: 10, color: '#9a3412', fontWeight: 700 }}>RESULTADO COMPUTACIONAL ASME I:</Text>
          <Text style={{ fontSize: 13, color: '#ea580c', fontWeight: 700, marginTop: 4 }}>
            PMTA LIMITANTE DO CORPO: {inspecao?.pmta_asme_kpa ? (inspecao?.pmta_asme_kpa / 1000).toFixed(3) : 'N/A'} MPa
          </Text>
        </View>

        {/* PARECER FINAL */}
        <Text style={styles.sectionTitle}>5. CONCLUSÃO TÉCNICA (INTEGRIDADE)</Text>
        <View style={styles.parecerBox}>
          <Text style={styles.parecerText}>
            Submeto a presente caldeira designada pelo tag "{inspecao?.tag ?? 'N/A'}", instalada no cliente supracitado, aos rigores normativos da NR-13 e do ASME Section I/IV. Foi constatado que seu estado de conservação atual atinge o status "{inspecao?.status_final ?? 'Aprovado'}" tendo em vista sua Pressão Máxima de Trabalho Admissível atual calculada, restando a integridade {inspecao?.status_final === 'Aprovado' ? 'assegurada' : 'com restrições'}.
          </Text>
        </View>

        {/* ASSINATURA */}
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>{usuario?.nome ?? 'Profissional Legalmente Habilitado'}</Text>
          <Text style={styles.signatureCREA}>Engenheiro(a) Responsável Técnico(a)</Text>
          <Text style={styles.signatureCREA}>CREA: {usuario?.crea ?? 'Não informado'}</Text>
          <Text style={styles.signatureCREA}>Profissional Legalmente Habilitado - NR-13</Text>
        </View>

        {/* RODAPÉ DINAMICO - NUMERAÇÃO DE PÁGINAS */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Documento Eletrônico de Integridade - NR13</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
            `Página ${pageNumber} de ${totalPages}`
          )} />
        </View>
      </Page>
    </Document>
  )
}
