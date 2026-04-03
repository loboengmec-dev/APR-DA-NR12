// ============================================================
// Tipos centrais do SaaS APR NR-12
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
