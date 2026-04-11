// Lista estática completa de itens relevantes da NR-12
// Atualizada rigorosamente conforme a revisão mais recente da norma

export interface ItemNR12 {
  codigo: string
  titulo: string
  capitulo: string
}

export const CAPITULOS_NR12 = [
  { codigo: '12.2',  nome: '12.2 — Arranjo Físico e Instalações' },
  { codigo: '12.3',  nome: '12.3 — Instalações e Dispositivos Elétricos' },
  { codigo: '12.4',  nome: '12.4 — Dispositivos de Partida, Acionamento e Parada' },
  { codigo: '12.5',  nome: '12.5 — Sistemas de Segurança' },
  { codigo: '12.6',  nome: '12.6 — Dispositivos de Parada de Emergência' },
  { codigo: '12.7',  nome: '12.7 — Componentes Pressurizados' },
  { codigo: '12.8',  nome: '12.8 — Transportadores de Materiais' },
  { codigo: '12.9',  nome: '12.9 — Aspectos Ergonômicos' },
  { codigo: '12.10', nome: '12.10 — Riscos Adicionais' },
  { codigo: '12.11', nome: '12.11 — Manutenção, Inspeção, Preparação, Ajuste, Reparo e Limpeza' },
  { codigo: '12.12', nome: '12.12 — Sinalização' },
  { codigo: '12.13', nome: '12.13 — Manuais' },
  { codigo: '12.14', nome: '12.14 — Procedimentos de Trabalho e Segurança' },
  { codigo: '12.16', nome: '12.16 — Capacitação' },
]

export const ITENS_NR12: ItemNR12[] = [
  // ── 12.2 Arranjo Físico e Instalações ──────────────────────────────────────
  { capitulo: '12.2', codigo: '12.2.1',   titulo: 'Ausência de circulação e demarcação nas áreas de instalação' },
  { capitulo: '12.2', codigo: '12.2.2',   titulo: 'Distância mínima entre máquinas insuficiente, impedindo segura operação ou manutenção' },
  { capitulo: '12.2', codigo: '12.2.3',   titulo: 'Áreas de circulação dimensionadas incorretamente para trabalhadores e transportadores' },
  { capitulo: '12.2', codigo: '12.2.4',   titulo: 'Piso em mau estado, não resistente às cargas ou que oferece riscos de acidentes' },
  { capitulo: '12.2', codigo: '12.2.5',   titulo: 'Ferramentas de processo desorganizadas, sem armazenamento específico' },

  // ── 12.3 Instalações e Dispositivos Elétricos ──────────────────────────────
  { capitulo: '12.3', codigo: '12.3.1',   titulo: 'Circuitos não previnem perigos de choque elétrico, incêndio ou explosão (não conformes à NR-10)' },
  { capitulo: '12.3', codigo: '12.3.2',   titulo: 'Ausência ou inadequação do aterramento elétrico nas partes condutoras' },
  { capitulo: '12.3', codigo: '12.3.3',   titulo: 'Falta de blindagem de componentes elétricos sujeitos a água ou agentes corrosivos' },
  { capitulo: '12.3', codigo: '12.3.4',   titulo: 'Condutores elétricos expostos e oferecendo riscos mecânicos' },
  { capitulo: '12.3', codigo: '12.3.5',   titulo: 'Porta de painel de comando sem fechamento ou partes vivas expostas no interior' },
  { capitulo: '12.3', codigo: '12.3.6',   titulo: 'Ligações e derivações dos condutores elétricos de forma inadequada' },
  { capitulo: '12.3', codigo: '12.3.7',   titulo: 'Instalação elétrica sem dispositivo protetor contra sobrecorrente' },

  // ── 12.4 Dispositivos de Partida, Acionamento e Parada ────────────────────
  { capitulo: '12.4', codigo: '12.4.1',   titulo: 'Dispositivo de acionamento em zona perigosa ou sem proteção contra acidental' },
  { capitulo: '12.4', codigo: '12.4.2',   titulo: 'Possibilidade de funcionamento automático acidental após retomada de energia' },
  { capitulo: '12.4', codigo: '12.4.3',   titulo: 'Acionamento bimanual não atende aos requisitos técnicos e atuadores sincrônicos' },
  { capitulo: '12.4', codigo: '12.4.4',   titulo: 'Atuação síncrona incompatível em operação supervisionada múltipla' },
  { capitulo: '12.4', codigo: '12.4.5',   titulo: 'Posicionamento do dispositivo de acionamento sem distância segura (burlando cálculo)' },

  // ── 12.5 Sistemas de Segurança ─────────────────────────────────────────────
  { capitulo: '12.5', codigo: '12.5.1',   titulo: 'Zonas de perigo sem sistemas de proteção fixas, móveis ou dispositivos de segurança' },
  { capitulo: '12.5', codigo: '12.5.2',   titulo: 'Categoria de segurança selecionada aquém do indicado pela Apreciação de Riscos' },
  { capitulo: '12.5', codigo: '12.5.3',   titulo: 'Ausência de reset (rearme manual) onde exigido' },
  { capitulo: '12.5', codigo: '12.5.4',   titulo: 'Proteção física sem resistência mecânica / material impróprio' },
  { capitulo: '12.5', codigo: '12.5.5',   titulo: 'Componentes de intertravamento não garantem a manutenção do estado seguro ante falhas' },
  { capitulo: '12.5', codigo: '12.5.6',   titulo: 'Proteção móvel de uso constante sem intertravamento e bloqueio associado' },
  { capitulo: '12.5', codigo: '12.5.7',   titulo: 'Intertravamento falho: permite máquina rodar com porta/fresta aberta' },
  { capitulo: '12.5', codigo: '12.5.8',   titulo: 'Intertravamento mecânico/chave burlando fechadura em proteção móvel' },
  { capitulo: '12.5', codigo: '12.5.9',   titulo: 'Ausência de proteção perimetral para componentes móveis de transmissão de força' },
  { capitulo: '12.5', codigo: '12.5.10',  titulo: 'Máquina sem proteção contra risco de ruptura grave / projeção de peças e partículas' },
  { capitulo: '12.5', codigo: '12.5.11',  titulo: 'Violação aos requisitos físicos operacionais das proteções instaladas' },
  { capitulo: '12.5', codigo: '12.5.12',  titulo: 'Interferência do vão da proteção física desconsidera distâncias seguras padronizadas' },

  // ── 12.6 Dispositivos de Parada de Emergência ─────────────────────────────
  { capitulo: '12.6', codigo: '12.6.1',   titulo: 'Ausência de parada de emergência para atenuação de acidentes e riscos latentes' },
  { capitulo: '12.6', codigo: '12.6.2',   titulo: 'Dispositivo botão de emergência bloqueado ou de difícil acesso/visualização' },
  { capitulo: '12.6', codigo: '12.6.3',   titulo: 'Falha do suporte físico/interligação que impossibilita a função emergencial' },
  { capitulo: '12.6', codigo: '12.6.4',   titulo: 'Parada de emergência em conflito e prejudicando a segurança primária local' },
  { capitulo: '12.6', codigo: '12.6.5',   titulo: 'Retenção física inútil (acionador não se mantém bloqueado até seu rearme)' },

  // ── 12.7 Componentes Pressurizados ─────────────────────────────────────────
  { capitulo: '12.7', codigo: '12.7.1',   titulo: 'Ausência de medidas de proteção adicionais em mangueiras/tubulações pressurizadas expostas a impactos' },
  { capitulo: '12.7', codigo: '12.7.2',   titulo: 'Vazamentos de fluidos oferecendo risco e falta de proteção perimetral contra ruptura' },

  // ── 12.8 Transportadores de Materiais (Contínuos) ─────────────────────────
  { capitulo: '12.8', codigo: '12.8.1',   titulo: 'Movimentos de esmagamento no transportador desprotegidos em operação normal' },
  { capitulo: '12.8', codigo: '12.8.2',   titulo: 'Carenagem, correia e roletes sem dispositivos para paralisação ou sem contorno mecânico' },
  { capitulo: '12.8', codigo: '12.8.3',   titulo: 'Uso de transportador de carga acima da capacidade nominal desenhada' },

  // ── 12.9 Aspectos Ergonômicos ──────────────────────────────────────────────
  { capitulo: '12.9', codigo: '12.9.1',   titulo: 'Disposições incompatíveis com a NR-17 (posturas prejudiciais de operação ou força/peso além do limite)' },
  { capitulo: '12.9', codigo: '12.9.2',   titulo: 'Concepção do layout das peças sujeitando o manipulador a transtornos antropométricos crônicos' },

  // ── 12.10 Riscos Adicionais ────────────────────────────────────────────────
  { capitulo: '12.10', codigo: '12.10.1',  titulo: 'Exposição aguda a agentes biológicos ou químicos devido ao maquinário' },
  { capitulo: '12.10', codigo: '12.10.2',  titulo: 'Falta de controle prioritário em emissões de particulados, vibrações sonoras ou efluentes nocivos no local' },
  { capitulo: '12.10', codigo: '12.10.3',  titulo: 'Riscos perigosos reativos ignorados (Exposição a líquidos inflamáveis e substâncias reativas do motor/bomba)' },

  // ── 12.11 Manutenção, Inspeção, Preparação, Ajuste, Reparo e Limpeza ──────
  { capitulo: '12.11', codigo: '12.11.1',  titulo: 'Manutenções periódicas inadequadas, ignorando referências do fabricante' },
  { capitulo: '12.11', codigo: '12.11.2',  titulo: 'Controle contínuo de registros/livro de manutenção defasado ou inexistente' },
  { capitulo: '12.11', codigo: '12.11.3',  titulo: 'Trabalho rotineiro complexo por profissionais não qualificados/autorizados' },
  { capitulo: '12.11', codigo: '12.11.4',  titulo: 'Falta de indicação para ensaio não destrutivo em eixo fraturado com fadiga visual (componentes estruturais)' },
  { capitulo: '12.11', codigo: '12.11.5',  titulo: 'Ausência de substituição compulsória de componente trincado ou falhando (burla e postergação de reparos vitais)' },

  // ── 12.12 Sinalização ──────────────────────────────────────────────────────
  { capitulo: '12.12', codigo: '12.12.1',  titulo: 'Ausência generalizada de sinalização advertindo a presença de riscos ou instrução na máquina' },
  { capitulo: '12.12', codigo: '12.12.2',  titulo: 'Adesivo/Sinalização não destacável, desbotado, posicionado inadequadamente' },
  { capitulo: '12.12', codigo: '12.12.3',  titulo: 'Padrão não condizente com sinalizações oficiais vigentes estipuladas' },
  { capitulo: '12.12', codigo: '12.12.4',  titulo: 'Sinalizações no maquinário escritas em linguagem ilegível ou em idioma estrangeiro s/ tradução' },

  // ── 12.13 Manuais ──────────────────────────────────────────────────────────
  { capitulo: '12.13', codigo: '12.13.1',  titulo: 'Trabalhos efetuados sem o norteamento de manual do fabricante à época' },
  { capitulo: '12.13', codigo: '12.13.2',  titulo: 'O manual fornecido desrespeita linguagem brasileira, faltando diagramas' },

  // ── 12.14 Procedimentos de Trabalho e Segurança ──────────────────────────
  { capitulo: '12.14', codigo: '12.14.1',  titulo: 'Ausência de POP (Procedimentos de operação consolidados baseados nos riscos)' },
  { capitulo: '12.14', codigo: '12.14.2',  titulo: 'Falta de checagem do perigo oculto na retomada de uma limpeza/preparação em nova rotina operacional' },
  { capitulo: '12.14', codigo: '12.14.3',  titulo: 'Procedimentos de bloqueio (LOTO/Energias perigosas) faltantes na equipe base' },

  // ── 12.16 Capacitação ──────────────────────────────────────────────────────
  { capitulo: '12.16', codigo: '12.16.1',  titulo: 'Trabalhadores intervindo na máquina sem devido treinamento oficial' },
  { capitulo: '12.16', codigo: '12.16.2',  titulo: 'Capacitação falha (incompatibilidade com as complexidades da operação específica)' },
  { capitulo: '12.16', codigo: '12.16.3',  titulo: 'Carga horária inadequada (ou curso assumido online para riscos intoleráveis que demanda prática)' },
  { capitulo: '12.16', codigo: '12.16.4',  titulo: 'Módulo didático do treinamento confuso sem provar retenção legal de proficiência aos contratados' },
]

// Retorna os itens filtrados por capítulo
export function itensPorCapitulo(codigoCapitulo: string): ItemNR12[] {
  return ITENS_NR12.filter(item => item.capitulo === codigoCapitulo)
}
