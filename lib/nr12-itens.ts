// Lista estática completa de itens relevantes da NR-12
// Organizada por capítulo para uso no seletor hierárquico

export interface ItemNR12 {
  codigo: string
  titulo: string
  capitulo: string
}

export const CAPITULOS_NR12 = [
  { codigo: '12.2',  nome: '12.2 — Arranjo Físico e Instalações' },
  { codigo: '12.3',  nome: '12.3 — Instalações e Dispositivos Elétricos' },
  { codigo: '12.4',  nome: '12.4 — Dispositivos de Partida, Acionamento e Parada' },
  { codigo: '12.5',  nome: '12.5 — Sistemas de Segurança (Proteções)' },
  { codigo: '12.6',  nome: '12.6 — Dispositivos de Parada de Emergência' },
  { codigo: '12.7',  nome: '12.7 — Sinalização' },
  { codigo: '12.8',  nome: '12.8 — Sistemas de Segurança' },
  { codigo: '12.9',  nome: '12.9 — Transportadores de Materiais' },
  { codigo: '12.10', nome: '12.10 — Aspectos Ergonômicos' },
  { codigo: '12.11', nome: '12.11 — Manutenção, Inspeção, Preparação, Ajuste, Reparo e Limpeza' },
  { codigo: '12.12', nome: '12.12 — Sinalização' },
  { codigo: '12.13', nome: '12.13 — Manuais' },
  { codigo: '12.14', nome: '12.14 — Procedimentos de Trabalho e Segurança' },
  { codigo: '12.15', nome: '12.15 — Riscos Adicionais' },
  { codigo: '12.16', nome: '12.16 — Capacitação' },
]

export const ITENS_NR12: ItemNR12[] = [
  // ── 12.2 Arranjo Físico e Instalações ──────────────────────────────────────
  { capitulo: '12.2', codigo: '12.2.1',     titulo: 'Ausência de demarcação das áreas de circulação' },
  { capitulo: '12.2', codigo: '12.2.1.1',   titulo: 'Largura das vias de circulação fora do padrão' },
  { capitulo: '12.2', codigo: '12.2.1.2',   titulo: 'Vias de circulação obstruídas' },
  { capitulo: '12.2', codigo: '12.2.2',     titulo: 'Iluminação inadequada no posto de trabalho' },
  { capitulo: '12.2', codigo: '12.2.3',     titulo: 'Espaço insuficiente para operação e manutenção' },
  { capitulo: '12.2', codigo: '12.2.4',     titulo: 'Piso em mau estado de conservação' },
  { capitulo: '12.2', codigo: '12.2.5',     titulo: 'Ausência de proteção contra queda de objetos' },

  // ── 12.3 Instalações e Dispositivos Elétricos ──────────────────────────────
  { capitulo: '12.3', codigo: '12.3.1',     titulo: 'Instalação elétrica em desacordo com a NR-10' },
  { capitulo: '12.3', codigo: '12.3.2',     titulo: 'Ausência ou inadequação do aterramento elétrico' },
  { capitulo: '12.3', codigo: '12.3.3',     titulo: 'Condutores elétricos sem identificação' },
  { capitulo: '12.3', codigo: '12.3.4',     titulo: 'Quadro elétrico sem proteção ou identificação' },
  { capitulo: '12.3', codigo: '12.3.5',     titulo: 'Cabos elétricos expostos ou danificados' },
  { capitulo: '12.3', codigo: '12.3.6',     titulo: 'Ausência de proteção contra contatos indiretos' },
  { capitulo: '12.3', codigo: '12.3.7',     titulo: 'Dispositivos elétricos sem proteção adequada (IP)' },

  // ── 12.4 Dispositivos de Partida, Acionamento e Parada ────────────────────
  { capitulo: '12.4', codigo: '12.4.1',     titulo: 'Dispositivo de partida/parada em local inadequado' },
  { capitulo: '12.4', codigo: '12.4.1.1',   titulo: 'Dispositivos de acionamento sem proteção contra acionamento acidental' },
  { capitulo: '12.4', codigo: '12.4.2',     titulo: 'Ausência de proteção contra acionamento acidental' },
  { capitulo: '12.4', codigo: '12.4.3',     titulo: 'Possibilidade de religamento automático indesejado' },
  { capitulo: '12.4', codigo: '12.4.4',     titulo: 'Múltiplos pontos de acionamento sem comando único' },
  { capitulo: '12.4', codigo: '12.4.5',     titulo: 'Dispositivo de acionamento sem identificação' },

  // ── 12.5 Sistemas de Segurança ─────────────────────────────────────────────
  { capitulo: '12.5', codigo: '12.5.1',     titulo: 'Ausência de proteção em zona de perigo' },
  { capitulo: '12.5', codigo: '12.5.2',     titulo: 'Proteção não atende aos requisitos da norma' },
  { capitulo: '12.5', codigo: '12.5.3',     titulo: 'Material da proteção inadequado' },
  { capitulo: '12.5', codigo: '12.5.4',     titulo: 'Proteção fixa removível sem uso de ferramenta' },
  { capitulo: '12.5', codigo: '12.5.5',     titulo: 'Proteção móvel sem dispositivo de retenção' },
  { capitulo: '12.5', codigo: '12.5.6',     titulo: 'Proteção móvel com retenção ineficaz' },
  { capitulo: '12.5', codigo: '12.5.7',     titulo: 'Intertravamento inativo ou ineficaz' },
  { capitulo: '12.5', codigo: '12.5.8',     titulo: 'Dispositivo de segurança ausente ou inoperante' },
  { capitulo: '12.5', codigo: '12.5.9',     titulo: 'Dispositivo eletrossensível (cortina de luz) inadequado' },
  { capitulo: '12.5', codigo: '12.5.10',    titulo: 'Borda de pressão ausente ou inoperante' },
  { capitulo: '12.5', codigo: '12.5.11',    titulo: 'Proteção não atende requisitos dimensionais' },
  { capitulo: '12.5', codigo: '12.5.11a',   titulo: 'Proteção não impede acesso à zona de perigo' },
  { capitulo: '12.5', codigo: '12.5.11b',   titulo: 'Proteção não resiste aos esforços aplicados' },
  { capitulo: '12.5', codigo: '12.5.11c',   titulo: 'Proteção removível sem uso de ferramenta' },
  { capitulo: '12.5', codigo: '12.5.11d',   titulo: 'Proteção não permite visibilidade do processo' },
  { capitulo: '12.5', codigo: '12.5.12',    titulo: 'Proteção interfere na produção criando pressão para remoção' },

  // ── 12.6 Dispositivos de Parada de Emergência ─────────────────────────────
  { capitulo: '12.6', codigo: '12.6.1',     titulo: 'Ausência de dispositivo de parada de emergência' },
  { capitulo: '12.6', codigo: '12.6.2',     titulo: 'Dispositivo de emergência fora das especificações' },
  { capitulo: '12.6', codigo: '12.6.3',     titulo: 'Dispositivo de emergência em local de difícil acesso' },
  { capitulo: '12.6', codigo: '12.6.4',     titulo: 'Rearmamento automático do dispositivo de emergência' },
  { capitulo: '12.6', codigo: '12.6.5',     titulo: 'Dispositivo de emergência sem identificação visual' },

  // ── 12.7 Sinalização ───────────────────────────────────────────────────────
  { capitulo: '12.7', codigo: '12.7.1',     titulo: 'Ausência de sinal sonoro/visual de partida da máquina' },
  { capitulo: '12.7', codigo: '12.7.2',     titulo: 'Dispositivo de advertência inoperante' },

  // ── 12.8 Sistemas de Segurança ────────────────────────────────────────────
  { capitulo: '12.8', codigo: '12.8.1',     titulo: 'Distâncias de segurança fora do especificado' },
  { capitulo: '12.8', codigo: '12.8.2',     titulo: 'Aberturas em proteções permitem acesso à zona de perigo' },
  { capitulo: '12.8', codigo: '12.8.3',     titulo: 'Distância insuficiente entre partes móveis' },

  // ── 12.9 Transportadores de Materiais ─────────────────────────────────────
  { capitulo: '12.9', codigo: '12.9.1',     titulo: 'Sistema de alimentação expõe operador à zona de perigo' },
  { capitulo: '12.9', codigo: '12.9.2',     titulo: 'Ausência de dispositivo de alimentação automática' },

  // ── 12.10 Aspectos Ergonômicos ─────────────────────────────────────────────
  { capitulo: '12.10', codigo: '12.10.1',   titulo: 'Posto de trabalho em desacordo com NR-17' },
  { capitulo: '12.10', codigo: '12.10.2',   titulo: 'Esforço excessivo na operação da máquina' },
  { capitulo: '12.10', codigo: '12.10.3',   titulo: 'Postura inadequada imposta pela máquina' },

  // ── 12.11 Manutenção, Inspeção, Preparação, Ajuste, Reparo e Limpeza ──────
  { capitulo: '12.11', codigo: '12.11.1',   titulo: 'Ausência de manual de operação e manutenção' },
  { capitulo: '12.11', codigo: '12.11.2',   titulo: 'Ausência de registro de manutenções' },
  { capitulo: '12.11', codigo: '12.11.3',   titulo: 'Plano de manutenção preventiva inexistente' },
  { capitulo: '12.11', codigo: '12.11.4',   titulo: 'Ausência de dispositivo de bloqueio (LOTO)' },
  { capitulo: '12.11', codigo: '12.11.5',   titulo: 'Manutenção realizada com máquina em operação' },

  // ── 12.12 Sinalização ──────────────────────────────────────────────────────
  { capitulo: '12.12', codigo: '12.12.1',   titulo: 'Ausência de sinalização de risco' },
  { capitulo: '12.12', codigo: '12.12.1a',  titulo: 'Ausência de sinalização de risco de choque elétrico' },
  { capitulo: '12.12', codigo: '12.12.1b',  titulo: 'Ausência de sinalização de risco de mutilação' },
  { capitulo: '12.12', codigo: '12.12.1c',  titulo: 'Ausência de sinalização de risco de esmagamento' },
  { capitulo: '12.12', codigo: '12.12.1d',  titulo: 'Ausência de sinalização de risco de queimadura' },
  { capitulo: '12.12', codigo: '12.12.2',   titulo: 'Sinalização ilegível, danificada ou desbotada' },
  { capitulo: '12.12', codigo: '12.12.3',   titulo: 'Sinalização não está em português' },
  { capitulo: '12.12', codigo: '12.12.4',   titulo: 'Sinalização posicionada em local de difícil visualização' },

  // ── 12.13 Manuais ──────────────────────────────────────────────────────────
  { capitulo: '12.13', codigo: '12.13.1',   titulo: 'Ausência de manual de operação em português' },
  { capitulo: '12.13', codigo: '12.13.2',   titulo: 'Manual desatualizado ou incompleto' },

  // ── 12.14 Procedimentos de Trabalho e Segurança ──────────────────────────
  { capitulo: '12.14', codigo: '12.14.1',   titulo: 'Ausência de Procedimento Operacional Padrão (POP)' },
  { capitulo: '12.14', codigo: '12.14.2',   titulo: 'POP desatualizado ou sem aprovação técnica' },
  { capitulo: '12.14', codigo: '12.14.3',   titulo: 'Ausência de procedimento de bloqueio e etiquetagem (LOTO)' },

  // ── 12.15 Riscos Adicionais ────────────────────────────────────────────────
  { capitulo: '12.15', codigo: '12.15.1',   titulo: 'Exposição a agentes químicos sem proteção coletiva' },
  { capitulo: '12.15', codigo: '12.15.2',   titulo: 'Exposição a ruído acima do limite de tolerância' },
  { capitulo: '12.15', codigo: '12.15.3',   titulo: 'Exposição a vibração sem medidas de controle' },
  { capitulo: '12.15', codigo: '12.15.4',   titulo: 'Exposição a temperaturas extremas sem proteção' },
  { capitulo: '12.15', codigo: '12.15.5',   titulo: 'Projeção de partículas sem proteção coletiva' },

  // ── 12.16 Capacitação ──────────────────────────────────────────────────────
  { capitulo: '12.16', codigo: '12.16.1',   titulo: 'Ausência de capacitação dos operadores' },
  { capitulo: '12.16', codigo: '12.16.2',   titulo: 'Capacitação sem conteúdo mínimo exigido' },
  { capitulo: '12.16', codigo: '12.16.3',   titulo: 'Carga horária da capacitação insuficiente' },
  { capitulo: '12.16', codigo: '12.16.4',   titulo: 'Ausência de documentação da capacitação' },
]

// Retorna os itens filtrados por capítulo
export function itensPorCapitulo(codigoCapitulo: string): ItemNR12[] {
  return ITENS_NR12.filter(item => item.capitulo === codigoCapitulo)
}
