'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { calcularPMTACilindro, calcularPMTATampoToriesferico, calcularPMTAGlobal } from '../../lib/domain/nr13/pmta';
import { calcularGrupoPV, calcularCategoria, extrairLetraClasse, LIMITES_GRUPO } from '../../lib/domain/nr13/categorization';
import { uploadFotoPlaca, uploadFotoExame, uploadFotoMedicao, uploadFotoNCNr13, gerarUrlAssinadaNR13, removerFotoNR13 } from '../../lib/nr13/storage';
import UploadFotoNR13 from './UploadFotoNR13';
import GaleriaFotosNR13 from './GaleriaFotosNR13';

// Intervalos de inspeção periódica por classe de fluido (NR-13 Anexo I)
const INTERVALOS_NR13: Record<string, { externo: number; interno: number; label: string }> = {
  'A (Inflamável/Tóxico)':              { externo: 1, interno: 2,  label: 'Ext: 1 ano / Int: 2 anos' },
  'B (Combustível/Tóxico leve)':        { externo: 2, interno: 4,  label: 'Ext: 2 anos / Int: 4 anos' },
  'C (Vapor de Água/Gases asfixiantes)':{ externo: 3, interno: 6,  label: 'Ext: 3 anos / Int: 6 anos' },
  'D (Água/Outros)':                    { externo: 5, interno: 10, label: 'Ext: 5 anos / Int: 10 anos' },
};

function somarAnos(dataISO: string, anos: number): string {
  const d = new Date(dataISO + 'T00:00:00');
  d.setFullYear(d.getFullYear() + anos);
  return d.toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// SCHEMA ZOD
// ---------------------------------------------------------------------------
const FormSchema = z.object({
  // --- Seção 1: Identificação ---
  tag: z.string().min(1, 'TAG é obrigatório'),
  fabricante: z.string().min(1, 'Fabricante é obrigatório'),
  numeroSerie: z.string().min(1, 'Número de Série é obrigatório'),
  anoFabricacao: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  tipoVaso: z.enum(['Coluna (Vertical)', 'Vaso Horizontal', 'Esférico']),
  codigoProjeto: z.enum(['ASME Sec. VIII Div 1', 'ASME Sec. VIII Div 2', 'PD 5500', 'GB/T 150', 'Desconhecido']),
  pmtaFabricante: z.coerce.number().positive('PMTA da placa é obrigatória'),
  dataInspecao: z.string().min(10, 'Data inválida'),
  dataEmissaoLaudo: z.string().min(10, 'Data de emissão obrigatória'),
  tipoInspecao: z.enum(['Inicial', 'Periódica', 'Extraordinária']),
  ambiente: z.enum(['Aberto', 'Fechado']),

  // --- Seção 1.2: Classificação e Categorização §13.5.1.1 ---
  fluidoServico: z.string().min(1, 'Fluido de serviço é obrigatório'),
  fluidoClasse: z.enum(['A (Inflamável/Tóxico)', 'B (Combustível/Tóxico leve)', 'C (Vapor de Água/Gases asfixiantes)', 'D (Água/Outros)']),
  pressaoOperacao: z.coerce.number().positive('Pressão de operação é obrigatória'),
  volume: z.coerce.number().positive('Volume deve ser maior que 0'),
  // grupoPV e categoriaVaso são calculados — apenas armazenados para validação
  grupoPV: z.coerce.number().int().min(1).max(5),
  categoriaVaso: z.enum(['I', 'II', 'III', 'IV', 'V']),

  // --- Seção 2: Checklist Documental §13.5.1.5 ---
  prontuario: z.enum(['Existe Integral', 'Parcial / Sendo Reconstituído', 'Não Existe']),
  registroSeguranca: z.enum(['Atualizado', 'Desatualizado', 'Inexistente']),
  projetoInstalacao: z.enum(['Existe', 'Dispensa Legal (Antigo)', 'Não Existe']),
  relatoriosAnteriores: z.enum(['Disponíveis', 'Primeira Inspeção', 'Indisponíveis']),
  placaIdentificacao: z.enum(['Fixada e Legível', 'Ilegível / Danificada', 'Inexistente']),
  certificadosDispositivos: z.enum(['Disponíveis', 'Não Disponíveis', 'N/A']),
  manualOperacao: z.enum(['Disponível em Português', 'Ausente / Sem Tradução', 'N/A']),

  // --- Seção 3: Checklist de Segurança no Trabalho — §13.5.2 (Acessibilidade) ---
  segDrenosRespirosBV: z.enum(['Conforme', 'Não Conforme', 'Não Aplicável']),
  segDuasSaidasAmbFechado: z.enum(['Conforme', 'Não Conforme', 'Não Aplicável']),
  segAcessoManutencao: z.enum(['Conforme', 'Não Conforme', 'Não Aplicável']),
  segVentilacaoPermanente: z.enum(['Conforme', 'Não Conforme', 'Não Aplicável']),
  segIluminacaoFechado: z.enum(['Conforme', 'Não Conforme', 'Não Aplicável']),
  segIluminacaoEmergenciaFechado: z.enum(['Conforme', 'Não Conforme', 'Não Aplicável']),
  segSaidasAmbAberto: z.enum(['Conforme', 'Não Conforme', 'Não Aplicável']),
  segAcessoAmbAberto: z.enum(['Conforme', 'Não Conforme', 'Não Aplicável']),
  segIluminacaoAberto: z.enum(['Conforme', 'Não Conforme', 'Não Aplicável']),
  segIluminacaoEmergenciaAberto: z.enum(['Conforme', 'Não Conforme', 'Não Aplicável']),
  segAspNormativosGerais: z.enum(['Conforme', 'Não Conforme', 'Não Aplicável']),

  // --- Seção 4: Exame Externo §13.3.4 ---
  exameExterno: z.enum(['Conforme', 'Não Conforme']),
  exameInterno: z.enum(['Conforme', 'Não Conforme', 'Não Aplicável']),

  // Foto da placa de identificação
  fotoPlacaPath: z.string().optional(),

  // Tabela de medições de espessura (múltiplos pontos) §13.5.4.11(d)
  medicoesEspessura: z.array(z.object({
    ponto: z.string().min(1, 'Ponto obrigatório'),
    espOriginal: z.coerce.number().nullable(),
    espMedida: z.coerce.number().positive('Espessura medida é obrigatória'),
    espMinAdm: z.coerce.number().nullable(),
    situacao: z.enum(['OK', 'Crítico']),
    fotoPath: z.string().optional(),
  })).min(1, 'Registre ao menos um ponto de medição'),

  // Fotos do exame externo/interno
  fotosExame: z.array(z.object({
    tipoExame: z.enum(['externo', 'interno']),
    storagePath: z.string().min(1),
    legenda: z.string().optional(),
    tamanhoBytes: z.number().optional(),
    ordem: z.number().int().optional(),
  })).optional(),

  // --- Seção 4: Dispositivos de Segurança §13.5.1.2 / §13.5.4.11(n) ---
  dispositivosSeguranca: z.array(z.object({
    tag: z.string().min(1, 'TAG do dispositivo obrigatória'),
    tipo: z.enum(['VS', 'VR', 'DR']),
    pressaoAjusteKpa: z.coerce.number().positive('Pressão de ajuste obrigatória'),
    ultimoTeste: z.string().min(10, 'Data obrigatória'),
    situacao: z.enum(['OK', 'Reparo']),
    fotoPath: z.string().optional(),
  })).min(1, 'Registre ao menos um dispositivo de segurança'),

  // --- Seção 4: Cálculo ASME Sec. VIII ---
  materialS: z.coerce.number().positive(),
  eficienciaE: z.coerce.number().max(1).min(0.1),
  diametroD: z.coerce.number().positive().min(50),
  espessuraCostado: z.coerce.number().positive(),
  espessuraTampo: z.coerce.number().positive(),
  psvCalibracao: z.coerce.number().positive(),

  // --- Seção 5: Parecer e Plano §13.5.4.11(j)(k)(l) ---
  statusFinalVaso: z.enum(['Aprovado', 'Aprovado com Restrições', 'Reprovado — Downgrade Necessário', 'Interditado']),
  proximaInspecaoExterna: z.string().min(10, 'Data obrigatória'),
  proximaInspecaoInterna: z.string().min(10, 'Data obrigatória'),
  dataProximoTesteDispositivos: z.string().min(10, 'Data obrigatória'),
  parecerTecnico: z.string().min(20, 'Parecer técnico deve ser descritivo (mín. 20 caracteres)'),
  pmtaFixadaPLH: z.coerce.number().positive('PMTA fixada pelo PLH é obrigatória'),

  // Não Conformidades §13.5.4.11(j)
  naoConformidades: z.array(z.object({
    descricao: z.string().min(5, 'Descreva a não conformidade'),
    refNR13: z.string().min(1, 'Referência normativa obrigatória'),
    acaoCorretiva: z.string().min(10, 'Descreva a ação corretiva'),
    grauRisco: z.enum(['GIR', 'Crítico', 'Moderado', 'Baixo']),
    prazo: z.coerce.number().int().positive('Prazo em dias'),
    responsavel: z.string().min(2, 'Responsável obrigatório'),
    fotoPath: z.string().optional(),
  })).optional(),

  // --- Seção 5.5: RTH §13.5.4.11(m) ---
  rthNome: z.string().min(3, 'Nome do responsável é obrigatório'),
  rthCrea: z.string().min(4, 'Registro profissional é obrigatório'),
  rthProfissao: z.enum(['Engenheiro Mecânico', 'Engenheiro de Segurança do Trabalho', 'Técnico de Segurança do Trabalho', 'Outro']),
});

type FormData = z.infer<typeof FormSchema>;

// ---------------------------------------------------------------------------
// COMPONENTE
// ---------------------------------------------------------------------------
export default function FormInspecaoNR13() {
  const [alerta, setAlerta] = useState<string | null>(null);
  const [detalheCalculo, setDetalheCalculo] = useState<{
    pmtaCostado: number; pmtaTampo: number; pmtaLimitante: number;
    componenteFragil: 'Costado' | 'Tampo'; psvInformada: number; condena: boolean;
  } | null>(null);

  // ─── Estado de pré-visualização de fotos (urls assinadas temporárias) ───
  const [urlFotoPlaca, setUrlFotoPlaca] = useState<string | null>(null);
  const [urlsExame, setUrlsExame] = useState<string[]>([]);

  // ─── Estado de exportação PDF ───
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [mostrarErros, setMostrarErros] = useState(false);

  const { register, watch, setValue, control, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(FormSchema) as Resolver<FormData>,
    mode: 'onChange',
    defaultValues: {
      diametroD: 1000,
      psvCalibracao: 0.8,
      materialS: 137.9,
      eficienciaE: 0.85,
      dataInspecao: new Date().toISOString().split('T')[0],
      dataEmissaoLaudo: new Date().toISOString().split('T')[0],
      codigoProjeto: 'ASME Sec. VIII Div 1',
      anoFabricacao: new Date().getFullYear(),
      prontuario: 'Existe Integral',
      registroSeguranca: 'Atualizado',
      projetoInstalacao: 'Existe',
      relatoriosAnteriores: 'Disponíveis',
      placaIdentificacao: 'Fixada e Legível',
      certificadosDispositivos: 'Disponíveis',
      manualOperacao: 'N/A',
      tipoInspecao: 'Periódica',
      statusFinalVaso: 'Aprovado',
      rthProfissao: 'Engenheiro Mecânico',
      segDrenosRespirosBV: 'Conforme',
      segDuasSaidasAmbFechado: 'Não Aplicável',
      segAcessoManutencao: 'Não Aplicável',
      segVentilacaoPermanente: 'Não Aplicável',
      segIluminacaoFechado: 'Não Aplicável',
      segIluminacaoEmergenciaFechado: 'Não Aplicável',
      segSaidasAmbAberto: 'Não Aplicável',
      segAcessoAmbAberto: 'Não Aplicável',
      segIluminacaoAberto: 'Não Aplicável',
      segIluminacaoEmergenciaAberto: 'Não Aplicável',
      segAspNormativosGerais: 'Conforme',
      fotoPlacaPath: '',
      naoConformidades: [],
      fotosExame: [],
      medicoesEspessura: [{ ponto: 'PE-01', espOriginal: null, espMedida: 0, espMinAdm: null, situacao: 'OK', fotoPath: '' }],
      dispositivosSeguranca: [{ tag: '', tipo: 'VS', pressaoAjusteKpa: 0, ultimoTeste: '', situacao: 'OK', fotoPath: '' }],
    },
  });

  const v = watch();

  // useFieldArrays
  const { fields: medFields, append: medAppend, remove: medRemove } = useFieldArray({ control, name: 'medicoesEspessura' });
  const { fields: dispFields, append: dispAppend, remove: dispRemove } = useFieldArray({ control, name: 'dispositivosSeguranca' });
  const { fields: ncFields, append: ncAppend, remove: ncRemove } = useFieldArray({ control, name: 'naoConformidades' });
  const { fields: fotosExameFields, append: fotosExameAppend, remove: fotosExameRemove } = useFieldArray({ control, name: 'fotosExame' });

  // ─── Auto-detecção de Não Conformidades ───
  function autoNcsFromValues(vals: typeof v): Array<{
    descricao: string; refNR13: string; acaoCorretiva: string;
    grauRisco: 'GIR' | 'Crítico' | 'Moderado' | 'Baixo';
    prazo: number; responsavel: string; fotoPath?: string;
  }> {
    const nc: Array<{ descricao: string; refNR13: string; acaoCorretiva: string; grauRisco: 'GIR' | 'Crítico' | 'Moderado' | 'Baixo'; prazo: number; responsavel: string; fotoPath?: string }> = [];
    const r: string = String(vals.rthNome) || 'A definir';
    const dispositivos = Array.isArray(vals.dispositivosSeguranca) ? vals.dispositivosSeguranca : [];
    const medicoes = Array.isArray(vals.medicoesEspessura) ? vals.medicoesEspessura : [];

    // Dispositivos com situação Reparo
    for (const d of dispositivos) {
      if (d?.situacao === 'Reparo') {
        nc.push({ descricao: `Dispositivo ${d.tag || 'sem tag'} necessita reparo ou recalibração`, refNR13: 'AUTO: §13.5.1.2', acaoCorretiva: `Realizar reparo ou recalibração do dispositivo de segurança ${d.tag || 'sem identificação'}`, grauRisco: 'GIR', prazo: 15, responsavel: r });
      }
    }

    // Medições com situação Crítico
    for (const m of medicoes) {
      if (m?.situacao === 'Crítico') {
        nc.push({ descricao: `Espessura crítica no ponto ${m.ponto || 'N/D'} — corrosão ou desgaste excessivo`, refNR13: 'AUTO: §13.5.4.11(d)', acaoCorretiva: `Reavaliar integridade do ponto ${m.ponto || 'N/D'} com ultrassom adicional e definir reparo`, grauRisco: 'GIR', prazo: 7, responsavel: r });
      }
    }

    // Checklist Documental
    const docNCs = [
      { key: 'prontuario', val: 'Existe Integral', ref: 'AUTO: §13.5.1.5(a)', desc: 'Prontuário do vaso inexistente ou incompleto', acao: 'Reconstituir prontuário completo com todos os documentos exigidos pela NR-13' },
      { key: 'registroSeguranca', val: 'Atualizado', ref: 'AUTO: §13.5.1.7', desc: 'Registro de Segurança desatualizado ou inexistente', acao: 'Atualizar Registro de Segurança com todas as informações exigidas' },
      { key: 'projetoInstalacao', val: 'Existe', ref: 'AUTO: §13.5.1.5(c)', desc: 'Projeto de Instalação não disponível', acao: 'Providenciar projeto de instalação do vaso conforme exigido' },
      { key: 'relatoriosAnteriores', val: 'Disponíveis', ref: 'AUTO: §13.5.1.5(d)', desc: 'Relatórios de inspeção anteriores indisponíveis', acao: 'Localizar e arquivar relatórios de inspeções anteriores' },
      { key: 'placaIdentificacao', val: 'Fixada e Legível', ref: 'AUTO: Art. 13.5.1.3', desc: 'Placa de identificação ilegível, danificada ou inexistente', acao: 'Providenciar nova placa de identificação conforme norma' },
      { key: 'certificadosDispositivos', val: 'Disponíveis', ref: 'AUTO: §13.5.1.5(e)', desc: 'Certificados dos dispositivos de segurança indisponíveis', acao: 'Solicitar certificados atualizados dos dispositivos de segurança' },
      { key: 'manualOperacao', val: 'Disponível em Português', ref: 'AUTO: §13.5.3.1', desc: 'Manual de Operação em Português ausente', acao: 'Providenciar tradução do manual de operação para Português' },
    ];
    for (const item of docNCs) {
      const actual = (vals as Record<string, any>)[item.key];
      if (actual && actual !== item.val) {
        nc.push({ descricao: item.desc, refNR13: item.ref, acaoCorretiva: item.acao, grauRisco: 'Moderado', prazo: 30, responsavel: r });
      }
    }

    // Checklist de Segurança
    type GrauRisco = 'GIR' | 'Crítico' | 'Moderado' | 'Baixo';
    const segChecks: Array<{ key: string; ref: string; desc: string; risco: GrauRisco; prazo: number }> = [
      { key: 'segDrenosRespirosBV', ref: 'AUTO: Art. 13.5.2.1', desc: 'Drenos, respiros e bocas de visita não acessíveis por meios seguros', risco: 'GIR', prazo: 15 },
      { key: 'segAspNormativosGerais', ref: 'AUTO: Art. 13.5.2.4', desc: 'Instalação não conforme normas de segurança, saúde e meio ambiente', risco: 'GIR', prazo: 15 },
      { key: 'segDuasSaidasAmbFechado', ref: 'AUTO: Art. 13.5.2.2(a)', desc: 'Ambiente fechado sem mínimo 2 saídas amplas e seguras', risco: 'GIR', prazo: 7 },
      { key: 'segAcessoManutencao', ref: 'AUTO: Art. 13.5.2.2(b)', desc: 'Acesso para manutenção e inspeção deficiente em ambiente fechado', risco: 'Moderado', prazo: 30 },
      { key: 'segVentilacaoPermanente', ref: 'AUTO: Art. 13.5.2.2(c)', desc: 'Ventilação permanente deficiente ou inexistente em ambiente fechado', risco: 'GIR', prazo: 15 },
      { key: 'segIluminacaoFechado', ref: 'AUTO: Art. 13.5.2.2(d)', desc: 'Iluminação deficiente em ambiente fechado', risco: 'Moderado', prazo: 30 },
      { key: 'segIluminacaoEmergenciaFechado', ref: 'AUTO: Art. 13.5.2.2(e)', desc: 'Iluminação de emergência inexistente ou defeituosa em ambiente fechado', risco: 'Moderado', prazo: 30 },
      { key: 'segSaidasAmbAberto', ref: 'AUTO: Art. 13.5.2.3', desc: 'Saídas obstruídas ou não sinalizadas em ambiente aberto', risco: 'Moderado', prazo: 30 },
      { key: 'segAcessoAmbAberto', ref: 'AUTO: Art. 13.5.2.3', desc: 'Acesso inseguro para manutenção em ambiente aberto', risco: 'Moderado', prazo: 30 },
      { key: 'segIluminacaoAberto', ref: 'AUTO: Art. 13.5.2.3', desc: 'Iluminação deficiente em ambiente aberto', risco: 'Moderado', prazo: 30 },
      { key: 'segIluminacaoEmergenciaAberto', ref: 'AUTO: Art. 13.5.2.3', desc: 'Iluminação de emergência inexistente em ambiente aberto', risco: 'Moderado', prazo: 30 },
    ];
    for (const item of segChecks) {
      const actual = (vals as Record<string, any>)[item.key];
      if (actual === 'Não Conforme') {
        nc.push({ descricao: item.desc, refNR13: item.ref, acaoCorretiva: `Implementar correções para: ${item.desc}`, grauRisco: item.risco, prazo: item.prazo, responsavel: r });
      }
    }

    // Exames
    if (vals.exameExterno === 'Não Conforme') {
      nc.push({ descricao: 'Exame externo revelou não conformidades no vaso', refNR13: 'AUTO: §13.3.4', acaoCorretiva: 'Investigar e sanar não conformidades identificadas no exame externo', grauRisco: 'Crítico', prazo: 15, responsavel: r });
    }
    if (vals.exameInterno === 'Não Conforme') {
      nc.push({ descricao: 'Exame interno revelou não conformidades no vaso', refNR13: 'AUTO: §13.3.4', acaoCorretiva: 'Investigar e sanar não conformidades identificadas no exame interno', grauRisco: 'Crítico', prazo: 30, responsavel: r });
    }

    return nc;
  }

  // Auto-atualiza NCs quando campos relevantes mudam
  // Usa refs para evitar loop infinito (watch + setValue no mesmo campo)
  const prevNcsRef = useRef<any>(null);

  useEffect(() => {
    // Filtra NCs manuais (sem refNR13 começando com "AUTO:")
    const atuais = watch('naoConformidades') ?? [];
    const manuais = atuais.filter((nc: any) => !nc?.refNR13?.startsWith('AUTO:'));

    // Gera NCs automáticas
    const autoNCs = autoNcsFromValues(v);

    // Combina: manuais + automáticas
    const todas = [...manuais, ...autoNCs];

    // Só atualiza se houver mudança real
    const key = JSON.stringify(todas.length > 0 ? todas : []);
    if (prevNcsRef.current !== key) {
      prevNcsRef.current = key;
      setValue('naoConformidades', todas.length > 0 ? todas : [], { shouldValidate: true });
    }
  }, [
    v.prontuario, v.registroSeguranca, v.projetoInstalacao,
    v.relatoriosAnteriores, v.placaIdentificacao,
    v.certificadosDispositivos, v.manualOperacao,
    v.segDrenosRespirosBV, v.segDuasSaidasAmbFechado,
    v.segAcessoManutencao, v.segVentilacaoPermanente,
    v.segIluminacaoFechado, v.segIluminacaoEmergenciaFechado,
    v.segSaidasAmbAberto, v.segAcessoAmbAberto,
    v.segIluminacaoAberto, v.segIluminacaoEmergenciaAberto,
    v.segAspNormativosGerais,
    v.exameExterno, v.exameInterno,
    v.dispositivosSeguranca, v.medicoesEspessura,
    v.rthNome,
  ]);

  // Auto-calcula Grupo P×V e Categoria ao mudar classe, pressão ou volume
  useEffect(() => {
    const classe = extrairLetraClasse(v.fluidoClasse ?? '');
    const p = v.pressaoOperacao;
    const vol = v.volume;
    if (!classe || !p || !vol) return;
    const grupo = calcularGrupoPV(p, vol);
    const cat = calcularCategoria(classe, grupo);
    setValue('grupoPV', grupo, { shouldValidate: true });
    setValue('categoriaVaso', cat, { shouldValidate: true });
  }, [v.fluidoClasse, v.pressaoOperacao, v.volume, setValue]);

  // Auto-calcula datas das próximas inspeções ao mudar classe ou data
  useEffect(() => {
    const { fluidoClasse, dataInspecao } = v;
    if (!fluidoClasse || !dataInspecao || dataInspecao.length < 10) return;
    const intervalo = INTERVALOS_NR13[fluidoClasse];
    if (!intervalo) return;
    setValue('proximaInspecaoExterna', somarAnos(dataInspecao, intervalo.externo), { shouldValidate: true });
    setValue('proximaInspecaoInterna', somarAnos(dataInspecao, intervalo.interno), { shouldValidate: true });
    setValue('dataProximoTesteDispositivos', somarAnos(dataInspecao, intervalo.interno), { shouldValidate: true });
  }, [v.fluidoClasse, v.dataInspecao, setValue]);

  // Auto-calcula PMTA em tempo real e auto-sugere PMTA fixada pelo PLH
  useEffect(() => {
    if (!v.materialS || !v.eficienciaE || !v.diametroD || !v.espessuraCostado || !v.espessuraTampo || !v.psvCalibracao) return;
    const R = v.diametroD / 2;
    const pmtaCostado = calcularPMTACilindro({ S: v.materialS, E: v.eficienciaE, t: v.espessuraCostado, R, D: v.diametroD });
    const pmtaTampo = calcularPMTATampoToriesferico({ S: v.materialS, E: v.eficienciaE, t: v.espessuraTampo, R, D: v.diametroD });
    const calc = calcularPMTAGlobal(pmtaCostado, pmtaTampo, v.psvCalibracao);
    setDetalheCalculo({ pmtaCostado, pmtaTampo, pmtaLimitante: calc.pmtaLimitante, componenteFragil: calc.componenteFragil, psvInformada: v.psvCalibracao, condena: calc.condena });
    setAlerta(calc.condena
      ? `A PSV está calibrada em ${(v.psvCalibracao * 10.197).toFixed(2)} kgf/cm², mas a PMTA recalculada é apenas ${(calc.pmtaLimitante * 10.197).toFixed(2)} kgf/cm². A válvula não abrirá a tempo.`
      : '✅ Vaso Conforme — PSV abrirá antes do limite estrutural.'
    );
    // Sugere PMTA fixada pelo PLH = limitante ASME (PLH pode sobrescrever)
    if (!v.pmtaFixadaPLH) {
      setValue('pmtaFixadaPLH', parseFloat((calc.pmtaLimitante * 10.197).toFixed(2)), { shouldValidate: false });
    }
  }, [v.materialS, v.eficienciaE, v.diametroD, v.espessuraCostado, v.espessuraTampo, v.psvCalibracao]);

  // Auto-sugere status final com base no resultado ASME + exames físicos
  useEffect(() => {
    if (!detalheCalculo) return;
    let sugestao: FormData['statusFinalVaso'] = 'Aprovado';
    if (detalheCalculo.condena) sugestao = 'Reprovado — Downgrade Necessário';
    else if (v.exameExterno === 'Não Conforme' || v.exameInterno === 'Não Conforme') sugestao = 'Aprovado com Restrições';
    setValue('statusFinalVaso', sugestao, { shouldValidate: true });
  }, [detalheCalculo, v.exameExterno, v.exameInterno, setValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Avaliação NR-13 preenchida e enviada com Sucesso!');
  };

  // Helpers de estilo
  const baseInputCls = 'mt-1 block w-full p-2 border rounded-lg text-sm focus:ring-slate-500 focus:border-slate-500 bg-white';
  const baseSelectCls = 'mt-1 block w-full p-2 border rounded-lg text-sm focus:ring-slate-500 focus:border-slate-500 bg-slate-50';
  const inputCls = (field: keyof typeof errors | string = '') => {
    const hasErr = field && errors[field as keyof typeof errors];
    return `${baseInputCls} ${hasErr ? 'border-red-400 ring-1 ring-red-400 bg-red-50' : 'border-slate-300'}`;
  };
  const selectCls = (field: keyof typeof errors | string = '') => {
    const hasErr = field && errors[field as keyof typeof errors];
    return `${baseSelectCls} ${hasErr ? 'border-red-400 ring-1 ring-red-400 bg-red-50' : 'border-slate-300'}`;
  };
  const labelCls = 'block text-sm font-medium text-slate-700';
  const errCls = 'text-xs text-red-500 mt-0.5';
  const sectionTitle = 'text-xl font-bold text-slate-800 border-b pb-2 mb-4';
  const subTitle = 'text-sm font-bold text-slate-700 uppercase tracking-wide mb-3';

  // ─── Mapa legível de campos (antes do cálculo de progresso) ───
  const labelMap: Record<string, string> = {
    tag: 'TAG', fabricante: 'Fabricante', numeroSerie: 'Nº de Série', anoFabricacao: 'Ano de Fabricação',
    tipoVaso: 'Tipo de Vaso', codigoProjeto: 'Código de Projeto', pmtaFabricante: 'PMTA da Placa',
    dataInspecao: 'Data de Início', dataEmissaoLaudo: 'Data de Emissão', tipoInspecao: 'Tipo de Inspeção',
    ambiente: 'Ambiente de Instalação', fluidoServico: 'Fluido de Serviço', fluidoClasse: 'Classe do Fluido',
    pressaoOperacao: 'Pressão de Operação', volume: 'Volume', grupoPV: 'Grupo P×V', categoriaVaso: 'Categoria',
    prontuario: 'Prontuário', registroSeguranca: 'Registro de Segurança', projetoInstalacao: 'Projeto de Instalação',
    relatoriosAnteriores: 'Relatórios Anteriores', placaIdentificacao: 'Placa de Identificação',
    certificadosDispositivos: 'Certificados Dispositivos', manualOperacao: 'Manual de Operação',
    exameExterno: 'Exame Externo', exameInterno: 'Exame Interno', materialS: 'Tensão Admissível',
    eficienciaE: 'Eficiência de Solda', diametroD: 'Diâmetro Interno', espessuraCostado: 'Espessura Costado',
    espessuraTampo: 'Espessura Tampo', psvCalibracao: 'PSV Calibração', statusFinalVaso: 'Status Final',
    proximaInspecaoExterna: 'Próx. Inspeção Externa', proximaInspecaoInterna: 'Próx. Inspeção Interna',
    dataProximoTesteDispositivos: 'Teste Dispositivos', parecerTecnico: 'Parecer Técnico',
    pmtaFixadaPLH: 'PMTA Fixada PLH', rthNome: 'Nome Profissional', rthCrea: 'CREA',
    rthProfissao: 'Formação', medicoesEspessura: 'Medições de Espessura',
    dispositivosSeguranca: 'Dispositivos de Segurança',
  };

  // Lista de erros com labels legíveis
  const errosComLabel = Object.keys(errors).map(key => ({
    campo: key,
    label: labelMap[key] ?? key,
    msg: (errors as Record<string, { message?: string }>)[key]?.message ?? 'obrigatório',
  }));

  const errosTopLevel = errosComLabel.filter(e => !e.campo.includes('.'));
  const camposPreenchidos = Object.keys(labelMap).length - errosComLabel.filter(e => Object.keys(labelMap).includes(e.campo)).length;
  const totalCamposForm = Object.keys(labelMap).length;
  const pctConcluido = Math.round((camposPreenchidos / totalCamposForm) * 100);

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-xl shadow-md w-full mx-auto border-t-4 border-slate-800 space-y-10">

      {/* ═══ PAINEL DE PROGRESSO / VALIDAÇÃO ═══ */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Progresso do Formulário</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{camposPreenchidos} de {totalCamposForm} preenchidos</span>
            <span className={`text-sm font-bold ${isValid ? 'text-emerald-700' : 'text-amber-700'}`}>
              {pctConcluido}%
            </span>
          </div>
        </div>
        {/* Barra de progresso */}
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              pctConcluido === 100 ? 'bg-emerald-500' : pctConcluido > 60 ? 'bg-amber-500' : 'bg-red-400'
            }`}
            style={{ width: `${pctConcluido}%` }}
          />
        </div>
        {errosTopLevel.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setMostrarErros(!mostrarErros)}
              className="text-xs text-red-600 font-medium hover:underline flex items-center gap-1"
            >
              <span>{mostrarErros ? '▾' : '▸'}</span>
              <span>{errosTopLevel.length} campo(s) pendente(s) — clique para ver</span>
            </button>
            {mostrarErros && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
                {errosTopLevel.map(e => (
                  <div key={e.campo} className="flex items-start gap-1.5 text-xs">
                    <span className="text-red-500 mt-0.5">●</span>
                    <div>
                      <span className="font-medium text-slate-700">{e.label}</span>
                      <span className="text-slate-400"> — {e.msg}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {isValid && (
          <p className="text-xs text-emerald-700 font-medium">✓ Todos os campos preenchidos — formulário pronto para exportar!</p>
        )}
      </div>

      {/* ================================================================
          SEÇÃO 1 — IDENTIFICAÇÃO DO VASO  §13.5.1.3
      ================================================================ */}
      <section>
        <h2 className={sectionTitle}>1. Identificação e Dados Gerais do Vaso</h2>

        {/* 1.1 Dados da Placa */}
        <p className={`${subTitle} mb-2`}>1.1 Dados da Placa de Identificação — Art. 13.5.1.3</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={labelCls}>TAG / Código de Identificação</label>
            <input type="text" {...register('tag')} className={inputCls('tag')} placeholder="Ex: R231194" />
            {errors.tag && <p className={errCls}>{errors.tag.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Fabricante (conforme placa)</label>
            <input type="text" {...register('fabricante')} className={inputCls('fabricante')} placeholder="Ex: Zhejiang Yinlong" />
            {errors.fabricante && <p className={errCls}>{errors.fabricante.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Nº de Identificação do Fabricante</label>
            <input type="text" {...register('numeroSerie')} className={inputCls('numeroSerie')} placeholder="Ex: SN-2023-44" />
            {errors.numeroSerie && <p className={errCls}>{errors.numeroSerie.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className={labelCls}>Ano de Fabricação</label>
            <input type="number" {...register('anoFabricacao')} className={inputCls('anoFabricacao')} />
            {errors.anoFabricacao && <p className={errCls}>{errors.anoFabricacao.message}</p>}
          </div>
          <div>
            <label className={`${labelCls} text-blue-800`}>Código de Construção (Placa)</label>
            <select {...register('codigoProjeto')} className={`${baseSelectCls} bg-blue-50 border-blue-200`}>
              <option value="ASME Sec. VIII Div 1">ASME Sec. VIII Div 1</option>
              <option value="ASME Sec. VIII Div 2">ASME Sec. VIII Div 2</option>
              <option value="PD 5500">PD 5500</option>
              <option value="GB/T 150">GB/T 150</option>
              <option value="Desconhecido">Desconhecido</option>
            </select>
          </div>
          <div>
            <label className={`${labelCls} text-emerald-800`}>PMTA da Placa (kPa)</label>
            <input type="number" step="0.1" {...register('pmtaFabricante')} className={`${inputCls('pmtaFabricante')} bg-emerald-50 border-emerald-300`} placeholder="Ex: 4200" />
            {errors.pmtaFabricante && <p className={errCls}>{errors.pmtaFabricante.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Tipo de Vaso</label>
            <select {...register('tipoVaso')} className={selectCls('tipoVaso')}>
              <option value="Coluna (Vertical)">Coluna (Vertical)</option>
              <option value="Vaso Horizontal">Vaso Horizontal</option>
              <option value="Esférico">Esférico</option>
            </select>
          </div>
        </div>

        {/* 1.1.5 Foto da Placa de Identificação */}
        <p className={`${subTitle} mt-4`}>1.1.5 Foto da Placa de Identificação</p>
        <div className="mb-4">
          <UploadFotoNR13
            label="Foto da placa de identificação do vaso"
            corBorda="slate"
            fotoPreviewUrl={urlFotoPlaca}
            onUpload={async (file) => await uploadFotoPlaca(file, v.tag || 'temp')}
            onPhotoUploaded={(path) => {
              setValue('fotoPlacaPath', path, { shouldValidate: true });
              gerarUrlAssinadaNR13(path).then((url) => url && setUrlFotoPlaca(url));
            }}
            onPhotoDelete={async () => {
              if (v.fotoPlacaPath) await removerFotoNR13(v.fotoPlacaPath);
              setValue('fotoPlacaPath', '', { shouldValidate: true });
              setUrlFotoPlaca(null);
            }}
          />
        </div>

        {/* 1.2 Datas e Tipo de Inspeção */}
        <p className={`${subTitle} mt-4`}>1.2 Inspeção</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className={labelCls}>Tipo de Inspeção</label>
            <select {...register('tipoInspecao')} className={selectCls('tipoInspecao')}>
              <option value="Inicial">Inicial</option>
              <option value="Periódica">Periódica</option>
              <option value="Extraordinária">Extraordinária</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Data de Início da Inspeção</label>
            <input type="date" {...register('dataInspecao')} className={inputCls('dataInspecao')} />
            {errors.dataInspecao && <p className={errCls}>{errors.dataInspecao.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Data de Emissão do Laudo</label>
            <input type="date" {...register('dataEmissaoLaudo')} className={inputCls('dataEmissaoLaudo')} />
            {errors.dataEmissaoLaudo && <p className={errCls}>{errors.dataEmissaoLaudo.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Ambiente de Instalação</label>
            <select {...register('ambiente')} className={selectCls('ambiente')}>
              <option value="Aberto">Aberto</option>
              <option value="Fechado">Fechado</option>
            </select>
          </div>
        </div>

        {/* 1.3 Classificação e Categorização §13.5.1.1 */}
        <p className={`${subTitle} mt-4`}>1.3 Classificação e Categorização — Tabela 1 NR-13 / Art. 13.5.1.1</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={labelCls}>Fluido de Serviço</label>
            <input type="text" {...register('fluidoServico')} className={inputCls('fluidoServico')} placeholder="Ex: Ar comprimido, Vapor de água" />
            {errors.fluidoServico && <p className={errCls}>{errors.fluidoServico.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Classe do Fluido</label>
            <select {...register('fluidoClasse')} className={selectCls('fluidoClasse')}>
              <option value="A (Inflamável/Tóxico)">Classe A — Inflamável ou Tóxico</option>
              <option value="B (Combustível/Tóxico leve)">Classe B — Combustível / Tóxico leve</option>
              <option value="C (Vapor de Água/Gases asfixiantes)">Classe C — Vapor d&apos;água / Asfixiantes</option>
              <option value="D (Água/Outros)">Classe D — Água / Outros</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Pressão Máxima de Operação — P (MPa)</label>
            <input type="number" step="0.01" {...register('pressaoOperacao')} className={inputCls('pressaoOperacao')} placeholder="Ex: 4.2" />
            {errors.pressaoOperacao && <p className={errCls}>{errors.pressaoOperacao.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Volume Interno — V (m³)</label>
            <input type="number" step="0.01" {...register('volume')} className={inputCls('volume')} placeholder="Ex: 1.0" />
            {errors.volume && <p className={errCls}>{errors.volume.message}</p>}
          </div>
          {/* Grupo P×V — calculado automaticamente */}
          <div className="flex flex-col justify-end">
            <label className={`${labelCls} text-slate-500`}>Produto P×V (auto)</label>
            <div className="mt-1 p-2 bg-slate-100 rounded-lg border border-slate-200 text-sm text-slate-700 font-mono">
              {v.pressaoOperacao && v.volume
                ? `${(v.pressaoOperacao * v.volume).toFixed(2)} MPa·m³ → Grupo ${v.grupoPV ?? '—'}`
                : '—'}
              {v.grupoPV && <span className="ml-2 text-xs text-slate-500">({LIMITES_GRUPO[v.grupoPV as 1|2|3|4|5]})</span>}
            </div>
          </div>
          {/* Categoria — calculada automaticamente */}
          <div className="flex flex-col justify-end">
            <label className={`${labelCls} text-slate-500`}>Categoria do Vaso (auto — Tabela 1)</label>
            <div className={`mt-1 p-2 rounded-lg border text-center font-black text-2xl ${
              v.categoriaVaso === 'I' ? 'bg-red-50 border-red-300 text-red-700'
              : v.categoriaVaso === 'II' ? 'bg-orange-50 border-orange-300 text-orange-700'
              : v.categoriaVaso === 'III' ? 'bg-amber-50 border-amber-300 text-amber-700'
              : v.categoriaVaso === 'IV' ? 'bg-blue-50 border-blue-300 text-blue-700'
              : v.categoriaVaso === 'V' ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}>
              {v.categoriaVaso ?? '—'}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SEÇÃO 2 — CHECKLIST DOCUMENTAL  §13.5.1.5
      ================================================================ */}
      <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
        <h2 className={sectionTitle}>2. Checklist Documental — §13.5.1.5</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { field: 'prontuario' as const, label: 'Prontuário do Vaso', opts: ['Existe Integral', 'Parcial / Sendo Reconstituído', 'Não Existe'] },
            { field: 'registroSeguranca' as const, label: 'Registro de Segurança — §13.5.1.7', opts: ['Atualizado', 'Desatualizado', 'Inexistente'] },
            { field: 'projetoInstalacao' as const, label: 'Projeto de Instalação', opts: ['Existe', 'Dispensa Legal (Antigo)', 'Não Existe'] },
            { field: 'relatoriosAnteriores' as const, label: 'Relatórios de Inspeção Anteriores — §13.5.1.5(d)', opts: ['Disponíveis', 'Primeira Inspeção', 'Indisponíveis'] },
            { field: 'certificadosDispositivos' as const, label: 'Certificados dos Dispositivos — §13.5.1.5(e)', opts: ['Disponíveis', 'Não Disponíveis', 'N/A'] },
            { field: 'manualOperacao' as const, label: 'Manual de Operação em Português — §13.5.3.1', opts: ['Disponível em Português', 'Ausente / Sem Tradução', 'N/A'] },
            { field: 'placaIdentificacao' as const, label: 'Placa de Identificação — §13.5.1.3', opts: ['Fixada e Legível', 'Ilegível / Danificada', 'Inexistente'] },
          ].map(({ field, label, opts }) => (
            <div key={field}>
              <label className="block text-sm font-bold text-slate-700 mb-1">{label}</label>
              <select {...register(field)} className={`${selectCls(field)} mt-0.5`}>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {(errors as Record<string, { message?: string }>)[field] && (
                <p className={errCls}>{(errors as Record<string, { message?: string }>)[field].message}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================
          SEÇÃO 3 — SEGURANÇA NO TRABALHO — §13.5.2 (ACESSIBILIDADE)
      ================================================================ */}
      <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
        <h2 className={sectionTitle}>3. Segurança no Trabalho — ACESSIBILIDADE §13.5.2</h2>

        {/* 3.1 Acessibilidade Geral — Art. 13.5.2.1 */}
        <div className="mb-6">
          <p className={subTitle}>3.1 Acessibilidade Geral — Art. 13.5.2.1</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Drenos, respiros, bocas de visita e indicadores acessíveis por meios seguros
              </label>
              <span className="text-xs text-slate-400 block mb-2">Art. 13.5.2.1</span>
              <select {...register('segDrenosRespirosBV')} className="block w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-slate-500 focus:border-slate-500">
                <option value="Conforme">Conforme</option>
                <option value="Não Conforme">Não Conforme</option>
                <option value="Não Aplicável">Não Aplicável</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3.2 Vasos em Ambiente Fechado — Art. 13.5.2.2 */}
        <div className="mb-6">
          <p className={subTitle}>3.2 Vasos em Ambiente Fechado — Art. 13.5.2.2</p>
          <p className="text-xs text-slate-500 mb-4">
            {v.ambiente === 'Aberto'
              ? '⚠ Ambiente definido como "Aberto" — estes itens são N/A para este vaso.'
              : 'Aplicável para ambiente fechado.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { field: 'segDuasSaidasAmbFechado' as const, label: 'Mínimo de 2 saídas amplas, desobstruídas, sinalizadas e em direções distintas', ref: 'Art. 13.5.2.2(a)' },
              { field: 'segAcessoManutencao' as const, label: 'Acesso fácil e seguro para manutenção, operação e inspeção; vãos de guarda-corpo adequados', ref: 'Art. 13.5.2.2(b)' },
              { field: 'segVentilacaoPermanente' as const, label: 'Ventilação permanente com entradas de ar não bloqueáveis', ref: 'Art. 13.5.2.2(c)' },
              { field: 'segIluminacaoFechado' as const, label: 'Iluminação conforme normas vigentes — ambiente fechado', ref: 'Art. 13.5.2.2(d)' },
              { field: 'segIluminacaoEmergenciaFechado' as const, label: 'Sistema de iluminação de emergência (exceto vasos móveis sem operador permanente)', ref: 'Art. 13.5.2.2(e)' },
            ].map(({ field, label, ref: r }) => (
              <div key={field}>
                <label className="block text-sm font-bold text-slate-700 mb-1">{label}</label>
                <span className="text-xs text-slate-400 block mb-2">{r}</span>
                <select
                  {...register(field)}
                  disabled={v.ambiente === 'Aberto'}
                  className={`block w-full p-2.5 rounded-lg text-sm focus:ring-2 focus:border-slate-400 transition-colors ${
                    v.ambiente === 'Aberto'
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-slate-300 focus:ring-slate-500'
                  }`}
                >
                  <option value="Conforme">Conforme</option>
                  <option value="Não Conforme">Não Conforme</option>
                  <option value="Não Aplicável">Não Aplicável</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* 3.3 Vasos em Ambiente Aberto — Art. 13.5.2.3 */}
        <div className="mb-6">
          <p className={subTitle}>3.3 Vasos em Ambiente Aberto — Art. 13.5.2.3</p>
          <p className="text-xs text-slate-500 mb-4">
            {v.ambiente === 'Fechado'
              ? '⚠ Ambiente definido como "Fechado" — estes itens são N/A para este vaso.'
              : 'Aplicável para ambiente aberto.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { field: 'segSaidasAmbAberto' as const, label: 'Saídas amplas, desobstruídas, sinalizadas e em direções distintas', ref: 'Art. 13.5.2.3 / 13.5.2.2(a)' },
              { field: 'segAcessoAmbAberto' as const, label: 'Acesso seguro para manutenção, operação e inspeção', ref: 'Art. 13.5.2.3 / 13.5.2.2(b)' },
              { field: 'segIluminacaoAberto' as const, label: 'Iluminação conforme normas vigentes — ambiente aberto', ref: 'Art. 13.5.2.3 / 13.5.2.2(d)' },
              { field: 'segIluminacaoEmergenciaAberto' as const, label: 'Sistema de iluminação de emergência (se aplicável)', ref: 'Art. 13.5.2.3 / 13.5.2.2(e)' },
            ].map(({ field, label, ref: r }) => (
              <div key={field}>
                <label className="block text-sm font-bold text-slate-700 mb-1">{label}</label>
                <span className="text-xs text-slate-400 block mb-2">{r}</span>
                <select
                  {...register(field)}
                  disabled={v.ambiente === 'Fechado'}
                  className={`block w-full p-2.5 rounded-lg text-sm focus:ring-2 focus:border-slate-400 transition-colors ${
                    v.ambiente === 'Fechado'
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-slate-300 focus:ring-slate-500'
                  }`}
                >
                  <option value="Conforme">Conforme</option>
                  <option value="Não Conforme">Não Conforme</option>
                  <option value="Não Aplicável">Não Aplicável</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* 3.4 Aspectos Normativos Gerais — Art. 13.5.2.4 */}
        <div>
          <p className={subTitle}>3.4 Aspectos Normativos Gerais — Art. 13.5.2.4</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Instalação obedece aos aspectos de segurança, saúde e meio ambiente das NRs aplicáveis
              </label>
              <span className="text-xs text-slate-400 block mb-2">Art. 13.5.2.4</span>
              <select {...register('segAspNormativosGerais')} className="block w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-slate-500 focus:border-slate-500">
                <option value="Conforme">Conforme</option>
                <option value="Não Conforme">Não Conforme</option>
                <option value="Não Aplicável">Não Aplicável</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SEÇÃO 4 — DISPOSITIVOS DE SEGURANÇA  §13.5.1.2 / §13.5.4.11(n)
      ================================================================ */}
      <section>
        <h2 className={sectionTitle}>4. Dispositivos de Segurança — §13.5.1.2 / §13.5.4.11(n)</h2>
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5 mb-4 font-semibold">
          ATENÇÃO: Ausência ou bloqueio de dispositivos configura Grave e Iminente Risco — Art. 13.3.1(a)(c)
        </p>

        {/* Tabela dinâmica de dispositivos */}
        <div className="space-y-3 mb-3">
          {dispFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-2 md:grid-cols-7 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">TAG</label>
                <input {...register(`dispositivosSeguranca.${index}.tag`)} placeholder="Ex: VS-01" className={baseInputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                <select {...register(`dispositivosSeguranca.${index}.tipo`)} className={baseSelectCls}>
                  <option value="VS">VS — Válvula de Segurança</option>
                  <option value="VR">VR — Válvula de Alívio</option>
                  <option value="DR">DR — Disco de Ruptura</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Pressão Ajuste (kPa)</label>
                <input type="number" step="1" {...register(`dispositivosSeguranca.${index}.pressaoAjusteKpa`)} placeholder="Ex: 4200" className={baseInputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Último Teste</label>
                <input type="date" {...register(`dispositivosSeguranca.${index}.ultimoTeste`)} className={baseInputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Situação</label>
                <select {...register(`dispositivosSeguranca.${index}.situacao`)} className={`${baseSelectCls} ${watch(`dispositivosSeguranca.${index}.situacao`) === 'Reparo' ? 'border-amber-400 bg-amber-50' : 'border-emerald-300 bg-emerald-50'}`}>
                  <option value="OK">OK</option>
                  <option value="Reparo">Reparo / Calibrar</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Foto</label>
                <UploadFotoNR13
                  compacto
                  corBorda="green"
                  label="Foto dispositivo"
                  fotoPreviewUrl={watch(`dispositivosSeguranca.${index}.fotoPath`) ? `data:image/svg+xml,` : null}
                  onUpload={async (f) => await uploadFotoNCNr13(f, `disp-${index}`, 0)}
                  onPhotoUploaded={(path) => setValue(`dispositivosSeguranca.${index}.fotoPath`, path, { shouldValidate: true })}
                  onPhotoDelete={() => setValue(`dispositivosSeguranca.${index}.fotoPath`, '', { shouldValidate: true })}
                />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={() => dispRemove(index)} disabled={dispFields.length === 1}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => dispAppend({ tag: '', tipo: 'VS', pressaoAjusteKpa: 0, ultimoTeste: '', situacao: 'OK', fotoPath: '' })}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 border border-dashed border-slate-400 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
          Adicionar Dispositivo
        </button>

        {/* Indicador de pressão §13.5.1.2(d) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <label className={labelCls}>Exame Externo do Vaso — §13.3.4</label>
            <select {...register('exameExterno')} className={`${baseSelectCls} ${v.exameExterno === 'Não Conforme' ? 'border-red-400 bg-red-50' : 'border-emerald-300 bg-emerald-50'}`}>
              <option value="Conforme">Conforme</option>
              <option value="Não Conforme">Não Conforme</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Exame Interno do Vaso</label>
            <select {...register('exameInterno')} className={`${baseSelectCls} ${v.exameInterno === 'Não Conforme' ? 'border-red-400 bg-red-50' : ''}`}>
              <option value="Conforme">Conforme</option>
              <option value="Não Conforme">Não Conforme</option>
              <option value="Não Aplicável">Não Aplicável</option>
            </select>
          </div>
        </div>

        {/* Fotos do Exame Externo/Interno */}
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <p className={`${subTitle} mb-0`}>Fotos do Exame</p>
            <span className="text-xs text-slate-400">{fotosExameFields.length} foto(s)</span>
          </div>
          <UploadFotoNR13
            label="Adicionar foto do exame"
            corBorda="blue"
            onUpload={async (file) => {
              const tipoExame = v.exameInterno !== 'Não Aplicável' ? 'interno' : 'externo';
              return await uploadFotoExame(file, 'temp', tipoExame, fotosExameFields.length);
            }}
            onPhotoUploaded={(path) => {
              fotosExameAppend({ tipoExame: 'externo', storagePath: path, ordem: fotosExameFields.length });
              gerarUrlAssinadaNR13(path).then((url) => {
                if (url) setUrlsExame((prev) => [...prev, url]);
              });
            }}
          />
          {urlsExame.length > 0 && (
            <GaleriaFotosNR13
              fotos={urlsExame.map((url, i) => ({ url, legenda: `Foto ${i + 1}`, removivel: true }))}
              onRemove={(index) => {
                urlsExame.splice(index, 1);
                setUrlsExame([...urlsExame]);
                fotosExameFields.splice(index, 1);
                const vals = watch('fotosExame');
                vals?.splice(index, 1);
                setValue('fotosExame', vals);
              }}
            />
          )}
        </div>

        {/* Medições de Espessura §13.5.4.11(d) */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className={subTitle}>Medições de Espessura por Ultrassom — §13.5.4.11(d)</p>
            <span className="text-xs text-slate-400">{medFields.length} ponto(s)</span>
          </div>
          <div className="space-y-2 mb-3">
            {medFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-2 md:grid-cols-7 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 items-end">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Ponto</label>
                  <input {...register(`medicoesEspessura.${index}.ponto`)} placeholder="PE-01" className={baseInputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Esp. Original (mm)</label>
                  <input type="number" step="0.1" {...register(`medicoesEspessura.${index}.espOriginal`)} placeholder="N/D" className={baseInputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Esp. Medida (mm) *</label>
                  <input type="number" step="0.1" {...register(`medicoesEspessura.${index}.espMedida`)} placeholder="Ex: 11.7" className={`${baseInputCls} border-blue-300 bg-blue-50`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Esp. Mín. Adm. (mm)</label>
                  <input type="number" step="0.1" {...register(`medicoesEspessura.${index}.espMinAdm`)} placeholder="N/D" className={baseInputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Situação</label>
                  <select {...register(`medicoesEspessura.${index}.situacao`)} className={`${baseSelectCls} ${watch(`medicoesEspessura.${index}.situacao`) === 'Crítico' ? 'border-red-400 bg-red-50' : 'border-emerald-300 bg-emerald-50'}`}>
                    <option value="OK">OK</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Foto</label>
                  <UploadFotoNR13
                    compacto
                    corBorda="blue"
                    label="Foto ultrassom"
                    onUpload={async (f) => await uploadFotoMedicao(f, 'temp', watch(`medicoesEspessura.${index}.ponto`))}
                    onPhotoUploaded={(path) => setValue(`medicoesEspessura.${index}.fotoPath`, path, { shouldValidate: true })}
                  />
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={() => medRemove(index)} disabled={medFields.length === 1}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => medAppend({ ponto: `PE-0${medFields.length + 1}`, espOriginal: null, espMedida: 0, espMinAdm: null, situacao: 'OK', fotoPath: '' })}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 border border-dashed border-slate-400 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
            Adicionar Ponto de Medição
          </button>
        </div>
      </section>

      {/* ================================================================
          SEÇÃO 4 — CÁLCULO ASME SEC. VIII
      ================================================================ */}
      <section className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h2 className={sectionTitle}>4. Base de Cálculo ASME Sec. VIII Div. 1</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>Material — Tensão Admissível S (MPa)</label>
            <select {...register('materialS')} className={`${baseSelectCls} mt-1`}>
              <option value="137.9">SA-285 / SA-516 (137.9 MPa)</option>
              <option value="114.5">SA-36 Estrutural (114.5 MPa)</option>
              <option value="115.0">SA-240 304L Inox (115.0 MPa)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Eficiência de Solda — E</label>
            <select {...register('eficienciaE')} className={`${baseSelectCls} mt-1`}>
              <option value="1.0">1.00 — Total (100% Radiografado)</option>
              <option value="0.85">0.85 — Spot (Parcial)</option>
              <option value="0.70">0.70 — Sem Radiografia</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Diâmetro Interno — D (mm)</label>
            <input type="number" step="1" {...register('diametroD')} className={inputCls('diametroD')} />
          </div>
          <div>
            <label className={`${labelCls} text-blue-700`}>Ultrassom Costado — t (mm)</label>
            <input type="number" step="0.1" {...register('espessuraCostado')} className={`${inputCls('espessuraCostado')} border-blue-300 bg-blue-50`} placeholder="Ex: 5.5" />
          </div>
          <div>
            <label className={`${labelCls} text-blue-700`}>Ultrassom Tampo — t (mm)</label>
            <input type="number" step="0.1" {...register('espessuraTampo')} className={`${inputCls('espessuraTampo')} border-blue-300 bg-blue-50`} placeholder="Ex: 4.8" />
          </div>
        </div>

        <div>
          <label className={`${labelCls} text-purple-800 mt-4 mb-1 block`}>Pressão de Calibração da PSV (MPa)</label>
          <input type="number" step="0.01" {...register('psvCalibracao')} className={`${inputCls('psvCalibracao')} border-purple-300 bg-purple-50 max-w-xs`} placeholder="Ex: 0.8" />
        </div>

        {/* Resultado ASME */}
        <div className="mt-6 p-5 bg-white rounded-xl border border-slate-300 shadow-sm space-y-4">
          <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Resultado — Avaliação Estrutural ASME</h3>
          {detalheCalculo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {(['Costado', 'Tampo'] as const).map(comp => {
                  const val = comp === 'Costado' ? detalheCalculo.pmtaCostado : detalheCalculo.pmtaTampo;
                  const fragil = detalheCalculo.componenteFragil === comp;
                  return (
                    <div key={comp} className={`p-3 rounded-lg border ${fragil ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
                      <p className="text-xs font-medium text-gray-500 uppercase">PMTA {comp}</p>
                      <p className="text-2xl font-bold text-gray-900">{(val * 10.197).toFixed(2)}</p>
                      <p className="text-xs text-gray-400">kgf/cm²</p>
                      {fragil && <span className="inline-block mt-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">⚠ Mais frágil</span>}
                    </div>
                  );
                })}
              </div>
              <div className={`p-4 rounded-xl border-2 ${detalheCalculo.condena ? 'bg-red-50 border-red-300' : 'bg-emerald-50 border-emerald-300'}`}>
                <div className="grid grid-cols-3 items-center text-center">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">PSV Calibrada</p>
                    <p className={`text-2xl font-black ${detalheCalculo.condena ? 'text-red-600' : 'text-gray-700'}`}>{(detalheCalculo.psvInformada * 10.197).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">kgf/cm²</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`text-2xl font-bold ${detalheCalculo.condena ? 'text-red-500' : 'text-emerald-500'}`}>{detalheCalculo.condena ? '>' : '≤'}</span>
                    <span className={`text-xs font-bold mt-1 ${detalheCalculo.condena ? 'text-red-600' : 'text-emerald-600'}`}>{detalheCalculo.condena ? 'EXCEDE' : 'OK'}</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">PMTA Limitante</p>
                    <p className={`text-2xl font-black ${detalheCalculo.condena ? 'text-red-600' : 'text-emerald-700'}`}>{(detalheCalculo.pmtaLimitante * 10.197).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">kgf/cm² ({detalheCalculo.componenteFragil})</p>
                  </div>
                </div>
                <p className={`text-sm mt-3 pt-3 border-t ${detalheCalculo.condena ? 'text-red-700 border-red-200 font-semibold' : 'text-emerald-700 border-emerald-200'}`}>{alerta}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Preencha as espessuras do ultrassom para visualizar o recálculo ASME.</p>
          )}
        </div>
      </section>

      {/* ================================================================
          SEÇÃO 5 — PARECER TÉCNICO E PLANO DE INSPEÇÃO  §13.5.4.11
      ================================================================ */}
      <section className="bg-white border-2 border-slate-800 rounded-xl p-6 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-800">5. Parecer Técnico e Plano de Inspeção — §13.5.4.11</h2>
          <p className="text-sm text-slate-500 mt-1">Conclusão oficial da inspeção. Confere validade legal ao documento.</p>
        </div>

        {/* 5.1 Status final */}
        <div>
          <h3 className={subTitle}>5.1 Aptidão Operacional — §13.5.4.11(k)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div>
              <label className={labelCls}>Condição do Vaso</label>
              <select {...register('statusFinalVaso')} className={`block w-full p-2.5 border rounded-lg font-semibold text-sm focus:ring-2 mt-1 ${
                v.statusFinalVaso === 'Aprovado' ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                : v.statusFinalVaso === 'Aprovado com Restrições' ? 'bg-amber-50 border-amber-400 text-amber-800'
                : 'bg-red-50 border-red-400 text-red-800'
              }`}>
                <option value="Aprovado">Aprovado</option>
                <option value="Aprovado com Restrições">Aprovado com Restrições</option>
                <option value="Reprovado — Downgrade Necessário">Reprovado — Downgrade Necessário</option>
                <option value="Interditado">Interditado</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">Auto-sugerido com base no cálculo ASME e exames.</p>
            </div>
            <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
              v.statusFinalVaso === 'Aprovado' ? 'bg-emerald-50 border-emerald-300'
              : v.statusFinalVaso === 'Aprovado com Restrições' ? 'bg-amber-50 border-amber-300'
              : 'bg-red-50 border-red-300'
            }`}>
              <span className="text-3xl">{v.statusFinalVaso === 'Aprovado' ? '✅' : v.statusFinalVaso === 'Aprovado com Restrições' ? '⚠️' : '🚫'}</span>
              <div>
                <p className={`font-bold text-sm ${v.statusFinalVaso === 'Aprovado' ? 'text-emerald-800' : v.statusFinalVaso === 'Aprovado com Restrições' ? 'text-amber-800' : 'text-red-800'}`}>{v.statusFinalVaso ?? '—'}</p>
                <p className="text-xs text-slate-500 mt-0.5">Parecer técnico oficial</p>
              </div>
            </div>
          </div>
        </div>

        {/* 5.2 PMTA fixada pelo PLH */}
        <div>
          <h3 className={subTitle}>5.2 PMTA Fixada pelo PLH</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`${labelCls} text-emerald-800`}>PMTA Fixada pelo PLH (kgf/cm²)</label>
              <input type="number" step="0.01" {...register('pmtaFixadaPLH')} className={`${inputCls('pmtaFixadaPLH')} border-emerald-300 bg-emerald-50`} placeholder="Auto-sugerida pelo ASME" />
              {errors.pmtaFixadaPLH && <p className={errCls}>{errors.pmtaFixadaPLH.message}</p>}
              <p className="text-xs text-slate-400 mt-1">PLH pode ratificar o valor ASME ou fixar valor mais conservador.</p>
            </div>
          </div>
        </div>

        {/* 5.3 Plano de inspeções §13.5.4.11(l) */}
        <div>
          <h3 className={subTitle}>5.3 Plano de Inspeções Periódicas — §13.5.4.11(l)</h3>
          {v.fluidoClasse && INTERVALOS_NR13[v.fluidoClasse] && (
            <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-3 py-1.5 mb-3 inline-block">
              NR-13 Anexo I — {v.fluidoClasse.split(' ')[0]}: {INTERVALOS_NR13[v.fluidoClasse].label}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={`${labelCls} text-blue-700`}>Próxima Inspeção Externa</label>
              <input type="date" {...register('proximaInspecaoExterna')} className={`${inputCls('proximaInspecaoExterna')} bg-blue-50 border-blue-300`} />
              {errors.proximaInspecaoExterna && <p className={errCls}>{errors.proximaInspecaoExterna.message}</p>}
            </div>
            <div>
              <label className={`${labelCls} text-purple-700`}>Próxima Inspeção Interna</label>
              <input type="date" {...register('proximaInspecaoInterna')} className={`${inputCls('proximaInspecaoInterna')} bg-purple-50 border-purple-300`} />
              {errors.proximaInspecaoInterna && <p className={errCls}>{errors.proximaInspecaoInterna.message}</p>}
            </div>
            <div>
              <label className={`${labelCls} text-amber-700`}>Próximo Teste dos Dispositivos</label>
              <input type="date" {...register('dataProximoTesteDispositivos')} className={`${inputCls('dataProximoTesteDispositivos')} bg-amber-50 border-amber-300`} />
              {errors.dataProximoTesteDispositivos && <p className={errCls}>{errors.dataProximoTesteDispositivos.message}</p>}
            </div>
          </div>
        </div>

        {/* 5.4 Não Conformidades §13.5.4.11(j) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={subTitle}>5.4 Não Conformidades — §13.5.4.11(j)</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{ncFields.length} NC(s) no total</span>
              {/* Conta quantas são automáticas vs manuais */}
              {(() => {
                const autoCount = ncFields.filter((f) => {
                  const nc = watch('naoConformidades')?.[(f as any).index];
                  return nc?.refNR13?.startsWith('AUTO:');
                }).length;
                const manualCount = ncFields.length - autoCount;
                return autoCount > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded" title="Detectadas automaticamente">🤖 {autoCount} auto</span>
                    {manualCount > 0 && <span className="text-xs text-slate-500">{manualCount} manual(is)</span>}
                  </div>
                ) : null;
              })()}
            </div>
          </div>
          <div className="space-y-4 mb-3">
            {ncFields.length === 0 && <p className="text-sm text-slate-400 italic py-2">Preencha o formulário. As não conformidades são detectadas automaticamente a partir dos checklists e exames.</p>}
            {ncFields.map((field, index) => {
              const nc = watch('naoConformidades')?.[index];
              const isAuto = nc?.refNR13?.startsWith('AUTO:');
              return (
              <div key={field.id} className={`p-4 rounded-xl border space-y-3 ${isAuto ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase">NC {String(index + 1).padStart(2, '0')}</span>
                    {isAuto && <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium">auto</span>}
                  </div>
                  <button type="button" onClick={() => ncRemove(index)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z" clipRule="evenodd" /></svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Descrição da Não Conformidade</label>
                    <input {...register(`naoConformidades.${index}.descricao`)} placeholder="Ex: Placa de identificação não redigida em português" className={baseInputCls} />
                    {errors.naoConformidades?.[index]?.descricao && <p className={errCls}>{errors.naoConformidades[index]?.descricao?.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Referência NR-13</label>
                    <input {...register(`naoConformidades.${index}.refNR13`)} placeholder="Ex: 13.5.1.3" className={baseInputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Ação Corretiva</label>
                  <textarea {...register(`naoConformidades.${index}.acaoCorretiva`)} rows={2} placeholder="Descreva a ação corretiva necessária..." className={`${baseInputCls} resize-none`} />
                  {errors.naoConformidades?.[index]?.acaoCorretiva && <p className={errCls}>{errors.naoConformidades[index]?.acaoCorretiva?.message}</p>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Grau de Risco</label>
                    <select {...register(`naoConformidades.${index}.grauRisco`)} className={`${baseSelectCls} font-semibold ${
                      watch(`naoConformidades.${index}.grauRisco`) === 'GIR' ? 'border-red-600 bg-red-50 text-red-800'
                      : watch(`naoConformidades.${index}.grauRisco`) === 'Crítico' ? 'border-orange-400 bg-orange-50 text-orange-800'
                      : watch(`naoConformidades.${index}.grauRisco`) === 'Moderado' ? 'border-amber-400 bg-amber-50 text-amber-800'
                      : 'border-blue-300 bg-blue-50 text-blue-800'
                    }`}>
                      <option value="GIR">GIR — Grave e Iminente Risco</option>
                      <option value="Crítico">Crítico</option>
                      <option value="Moderado">Moderado</option>
                      <option value="Baixo">Baixo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prazo (dias)</label>
                    <input type="number" {...register(`naoConformidades.${index}.prazo`)} placeholder="Ex: 30" className={baseInputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Responsável</label>
                    <input {...register(`naoConformidades.${index}.responsavel`)} placeholder="Ex: Manutenção" className={baseInputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Foto da NC</label>
                  <UploadFotoNR13
                    label={`Foto da NC ${String(index + 1).padStart(2, '0')}`}
                    corBorda="purple"
                    onUpload={async (f) => await uploadFotoNCNr13(f, `nc-${index}`, 0)}
                    onPhotoUploaded={(path) => setValue(`naoConformidades.${index}.fotoPath`, path, { shouldValidate: true })}
                    onPhotoDelete={() => {
                      const fp = watch(`naoConformidades.${index}.fotoPath`);
                      if (fp) removerFotoNR13(fp);
                      setValue(`naoConformidades.${index}.fotoPath`, '', { shouldValidate: true });
                    }}
                  />
                </div>
              </div>
              );})}
          </div>
          <button type="button" onClick={() => ncAppend({ descricao: '', refNR13: '', acaoCorretiva: '', grauRisco: 'Moderado', prazo: 30, responsavel: '', fotoPath: '' })}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 border border-dashed border-slate-400 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
            Adicionar Não Conformidade
          </button>
        </div>

        {/* 5.5 Parecer técnico narrativo */}
        <div>
          <h3 className={subTitle}>5.5 Parecer Técnico do PLH — §13.5.4.11(k)</h3>
          <textarea {...register('parecerTecnico')} rows={5}
            placeholder="Submetido à inspeção de segurança periódica em [data], o vaso de pressão TAG [TAG], fabricado por [fabricante]..."
            className={`${inputCls('parecerTecnico')} resize-none`} />
          {errors.parecerTecnico && <p className={errCls}>{errors.parecerTecnico.message}</p>}
        </div>

        {/* 5.6 RTH §13.5.4.11(m) */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
          <h3 className={subTitle}>5.6 Profissional Legalmente Habilitado (PLH) — §13.3.2 / §13.5.4.11(m)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Formação</label>
              <select {...register('rthProfissao')} className={baseSelectCls}>
                <option value="Engenheiro Mecânico">Engenheiro Mecânico</option>
                <option value="Engenheiro de Segurança do Trabalho">Eng. de Segurança do Trabalho</option>
                <option value="Técnico de Segurança do Trabalho">Técnico de Segurança do Trabalho</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Nome Completo</label>
              <input type="text" {...register('rthNome')} placeholder="Ex: Danilo Lobo Souza" className={inputCls('rthNome')} />
              {errors.rthNome && <p className={errCls}>{errors.rthNome.message}</p>}
            </div>
            <div>
              <label className={labelCls}>CREA / Registro — §13.5.4.11(m)</label>
              <input type="text" {...register('rthCrea')} placeholder="Ex: 389785MG" className={inputCls('rthCrea')} />
              {errors.rthCrea && <p className={errCls}>{errors.rthCrea.message}</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="flex gap-3 mt-4">
        <button disabled={!isValid} type="submit"
          className="flex-1 bg-slate-800 text-white font-bold py-4 px-4 rounded-lg disabled:opacity-50 text-lg hover:bg-slate-700 transition">
          Confirmar Inspeção NR-13
        </button>
        <button
          disabled={exportandoPDF}
          onClick={async () => {
            setExportandoPDF(true);
            try {
              // Gerar URLs assinadas para todas as fotos do relatório
              const fotosUrlMap: Record<string, string> = {};

              // Foto da placa
              if (v.fotoPlacaPath && urlFotoPlaca) {
                fotosUrlMap['placa'] = urlFotoPlaca;
              }

              // Fotos do exame (primeiras de cada tipo como representativas)
              for (let i = 0; i < fotosExameFields.length; i++) {
                const field = fotosExameFields[i];
                const foto = field as any;
                if (foto && foto.storagePath) {
                  const url = await gerarUrlAssinadaNR13(foto.storagePath);
                  if (url) {
                    // Usa o tipo do exame como chave principal
                    fotosUrlMap[foto.tipoExame] = url;
                  }
                }
              }

              // URLs do exame que já estão carregadas — sincroniza
              urlsExame.forEach((url, i) => {
                const fotosExame = watch('fotosExame');
                if (fotosExame && fotosExame[i]?.storagePath) {
                  fotosUrlMap.fotosExame = url; // fallback
                }
              });

              // Fotos das NCs
              for (let i = 0; i < ncFields.length; i++) {
                const nc = watch(`naoConformidades.${i}.fotoPath`);
                if (nc) {
                  const url = await gerarUrlAssinadaNR13(nc);
                  if (url) fotosUrlMap[`nc_${i}`] = url;
                }
              }

              const resposta = await fetch('/api/nr13-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  dados: {
                    ...v,
                    medicoesEspessura: v.medicoesEspessura?.map((m: any) => ({
                      ponto: m.ponto, espOriginal: m.espOriginal,
                      espMedida: m.espMedida, espMinAdm: m.espMinAdm, situacao: m.situacao,
                    })),
                    dispositivosSeguranca: v.dispositivosSeguranca?.map((d: any) => ({
                      tag: d.tag, tipo: d.tipo, pressaoAjusteKpa: d.pressaoAjusteKpa,
                      ultimoTeste: d.ultimoTeste, situacao: d.situacao,
                    })),
                    naoConformidades: v.naoConformidades?.map((nc: any) => ({
                      descricao: nc.descricao, refNR13: nc.refNR13, acaoCorretiva: nc.acaoCorretiva,
                      grauRisco: nc.grauRisco, prazo: nc.prazo, responsavel: nc.responsavel,
                    })),
                  },
                  perfil: {},
                  fotosUrl: fotosUrlMap,
                }),
              });
              if (!resposta.ok) throw new Error('Erro ao gerar PDF');
              const blob = await resposta.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Inspecao_NR13_${v.tag || 'vaso'}_${v.dataInspecao}.pdf`;
              a.click();
              URL.revokeObjectURL(url);
            } catch (err) {
              console.error('Erro ao exportar PDF:', err);
              alert('Erro ao gerar o PDF. Verifique o console.');
            } finally {
              setExportandoPDF(false);
            }
          }}
          type="button"
          className="flex items-center justify-center gap-2 bg-blue-700 text-white font-bold py-4 px-6 rounded-lg disabled:opacity-50 text-lg hover:bg-blue-600 transition"
        >
          {exportandoPDF ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Gerando PDF...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.23a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.905 3.134V2.75z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
              Exportar PDF
            </>
          )}
        </button>
      </div>
    </form>
  );
}
