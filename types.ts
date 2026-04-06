// ============================================================
// Tipos centrais do SaaS APR NR-12/NR-13
// ============================================================

// --- Utilitário genérico para ações Server Actions ---
export type ActionResult<T = void> = {
  data?: T
  error?: string
}

// --- Usuário / Perfil ---
export interface Usuario {
  id: string
  nome: string | null
  email: string
  crea: string | null
  logo_url: string | null
  plano: string | null
  created_at: string
}

// --- Cliente ---
export interface Cliente {
  id: string
  usuario_id: string
  razao_social: string
  cnpj: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  created_at: string
}

export interface FormCliente {
  razao_social: string
  cnpj?: string | null
  endereco?: string | null
  cidade?: string | null
  estado?: string | null
}

// --- Laudo ---
export interface Laudo {
  id: string
  usuario_id: string
  cliente_id: string | null
  numero_documento: string | null
  revisao: string | null
  data_inspecao: string | null
  status: 'rascunho' | 'em_revisao' | 'finalizado'
  norma: string | null
  created_at: string
  updated_at: string | null
}

export interface FormLaudo {
  cliente_id?: string | null
  numero_documento?: string | null
  revisao?: string | null
  data_inspecao?: string | null
  status?: 'rascunho' | 'em_revisao' | 'finalizado'
  art?: string | null
  norma?: string | null
}

// --- Equipamento ---
export interface Equipamento {
  id: string
  laudo_id: string
  nome: string
  modelo: string | null
  categoria_s: string | null
  categoria_f: string | null
  categoria_p: string | null
  categoria_resultado: CategoriaSeguranca | null
  foto_geral_url: string | null
  ordem: number
  created_at: string
}

export interface FormEquipamento {
  nome: string
  modelo?: string | null
  categoria_s: string
  categoria_f: string
  categoria_p: string
}

// --- Categorias de Segurança NBR 14153 ---
export type CategoriaSeguranca = 'B' | '1' | '2' | '3' | '4'

// --- Não Conformidade ---
export interface NaoConformidade {
  id: string
  equipamento_id: string
  banco_texto_id: string | null
  item_nr12: string
  titulo_nc: string
  descricao: string | null
  risco: string | null
  lo: number | null
  fe: number | null
  dph: number | null
  np: number | null
  hrn: number | null
  nivel_hrn: NivelHRN | null
  texto_identificacao: string | null
  texto_recomendacao: string | null
  medida_controle: string | null
  ordem: number
  created_at: string
}

export interface FormNC {
  item_nr12: string
  titulo_nc: string
  descricao?: string | null
  risco?: string | null
  lo: number | null
  fe: number | null
  dph: number | null
  np: number | null
  texto_identificacao?: string | null
  texto_recomendacao?: string | null
  medida_controle?: string | null
}

// --- Foto de NC ---
export interface FotoNC {
  id: string
  nc_id: string
  storage_path: string
  legenda: string | null
  tamanho_bytes: number | null
  ordem: number
  created_at: string
}

// --- HRN (Hazard Rating Number) ---
export type NivelHRN =
  | 'aceitavel'
  | 'muito_baixo'
  | 'baixo'
  | 'moderado'
  | 'alto'
  | 'muito_alto'
  | 'intoleravel'

export interface TabelaHRNItem {
  valor: number
  descricao: string
}

// --- Banco de Textos NR-12 ---
export interface BancoTextoNR12 {
  id: string
  item_nr12: string
  titulo_nc: string
  risco: string | null
  hrn_tipico: Record<string, number | string> | null
  hrn_tipico_json: Record<string, number | string> | null
  texto_identificacao: string | null
  texto_recomendacao: string | null
  medida_controle: string | null
  fonte: string | null
}

// ============================================================
// Tipos NR-13 — Vasos de Pressão
// ============================================================

export interface VasoPressao {
  id: string
  cliente_id: string
  laudo_id: string | null
  tag: string
  fabricante: string | null
  numero_serie: string | null
  ano_fabricacao: number | null
  tipo_vaso: string | null
  codigo_projeto: string | null
  pmta_fabricante_kpa: number | null
  created_at: string
}

export interface InspecoesNR13 {
  id: string
  vaso_id: string | null
  laudo_id: string | null
  tag: string
  fabricante: string | null
  numero_serie: string | null
  ano_fabricacao: number | null
  tipo_vaso: string | null
  codigo_projeto: string | null
  pmta_fabricante_kpa: number | null
  data_inspecao: string | null
  data_emissao_laudo: string | null
  tipo_inspecao: string | null
  ambiente: string | null
  fluido_servico: string | null
  fluido_classe: string | null
  pressao_operacao_mpa: number | null
  volume_m3: number | null
  grupo_pv: number | null
  categoria_vaso: string | null
  prontuario: string | null
  registro_seguranca: string | null
  projeto_instalacao: string | null
  relatorios_anteriores: string | null
  placa_identificacao: string | null
  certificados_dispositivos: string | null
  manual_operacao: string | null
  exame_externo: string | null
  exame_interno: string | null
  medicoes_espessura: any | null
  dispositivos_seguranca: any | null
  material_s: number | null
  eficiencia_e: number | null
  diametro_d: number | null
  espessura_costado: number | null
  espessura_tampo: number | null
  psv_calibracao_kpa: number | null
  pmta_asme_kpa: number | null
  pmta_plh_kpa: number | null
  status_final: string | null
  status_seguranca: string | null
  proxima_inspecao_externa: string | null
  proxima_inspecao_interna: string | null
  data_proximo_teste_dispositivos: string | null
  parecer_tecnico: string | null
  rth_nome: string | null
  rth_crea: string | null
  rth_profissao: string | null
  created_at: string
}

export interface NcNR13 {
  id: string
  inspecao_id: string
  descricao: string
  ref_nr13: string
  acao_corretiva: string
  grau_risco: string
  prazo_dias: number | null
  responsavel: string | null
  ordem: number
  created_at: string
}

export interface FotoNR13 {
  id: string
  storage_path: string
  legenda: string | null
  tamanho_bytes: number | null
  created_at: string
}