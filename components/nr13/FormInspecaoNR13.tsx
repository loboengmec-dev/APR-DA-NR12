'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { calcularPMTACilindro, calcularPMTATampoToriesferico, calcularPMTAGlobal } from '../../lib/domain/nr13/pmta';
import { calcularGrupoPV, calcularCategoria, extrairLetraClasse, LIMITES_GRUPO } from '../../lib/domain/nr13/categorization';

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

  // --- Seção 4: Exame Externo §13.3.4 ---
  exameExterno: z.enum(['Conforme', 'Não Conforme']),
  exameInterno: z.enum(['Conforme', 'Não Conforme', 'Não Aplicável']),

  // Tabela de medições de espessura (múltiplos pontos) §13.5.4.11(d)
  medicoesEspessura: z.array(z.object({
    ponto: z.string().min(1, 'Ponto obrigatório'),
    espOriginal: z.coerce.number().nullable(),
    espMedida: z.coerce.number().positive('Espessura medida é obrigatória'),
    espMinAdm: z.coerce.number().nullable(),
    situacao: z.enum(['OK', 'Crítico']),
  })).min(1, 'Registre ao menos um ponto de medição'),

  // --- Seção 4: Dispositivos de Segurança §13.5.1.2 / §13.5.4.11(n) ---
  dispositivosSeguranca: z.array(z.object({
    tag: z.string().min(1, 'TAG do dispositivo obrigatória'),
    tipo: z.enum(['VS', 'VR', 'DR']),
    pressaoAjusteKpa: z.coerce.number().positive('Pressão de ajuste obrigatória'),
    ultimoTeste: z.string().min(10, 'Data obrigatória'),
    situacao: z.enum(['OK', 'Reparo']),
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
      naoConformidades: [],
      medicoesEspessura: [{ ponto: 'PE-01', espOriginal: null, espMedida: 0, espMinAdm: null, situacao: 'OK' }],
      dispositivosSeguranca: [{ tag: '', tipo: 'VS', pressaoAjusteKpa: 0, ultimoTeste: '', situacao: 'OK' }],
    },
  });

  const v = watch();

  // useFieldArrays
  const { fields: medFields, append: medAppend, remove: medRemove } = useFieldArray({ control, name: 'medicoesEspessura' });
  const { fields: dispFields, append: dispAppend, remove: dispRemove } = useFieldArray({ control, name: 'dispositivosSeguranca' });
  const { fields: ncFields, append: ncAppend, remove: ncRemove } = useFieldArray({ control, name: 'naoConformidades' });

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
  const inputCls = 'mt-1 block w-full p-2 border rounded-lg border-slate-300 text-sm focus:ring-slate-500 focus:border-slate-500 bg-white';
  const selectCls = 'mt-1 block w-full p-2 border rounded-lg border-slate-300 text-sm focus:ring-slate-500 focus:border-slate-500 bg-slate-50';
  const labelCls = 'block text-sm font-medium text-slate-700';
  const errCls = 'text-xs text-red-500 mt-0.5';
  const sectionTitle = 'text-xl font-bold text-slate-800 border-b pb-2 mb-4';
  const subTitle = 'text-sm font-bold text-slate-700 uppercase tracking-wide mb-3';

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-xl shadow-md w-full mx-auto border-t-4 border-slate-800 space-y-10">

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
            <input type="text" {...register('tag')} className={inputCls} placeholder="Ex: R231194" />
            {errors.tag && <p className={errCls}>{errors.tag.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Fabricante (conforme placa)</label>
            <input type="text" {...register('fabricante')} className={inputCls} placeholder="Ex: Zhejiang Yinlong" />
            {errors.fabricante && <p className={errCls}>{errors.fabricante.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Nº de Identificação do Fabricante</label>
            <input type="text" {...register('numeroSerie')} className={inputCls} placeholder="Ex: SN-2023-44" />
            {errors.numeroSerie && <p className={errCls}>{errors.numeroSerie.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className={labelCls}>Ano de Fabricação</label>
            <input type="number" {...register('anoFabricacao')} className={inputCls} />
            {errors.anoFabricacao && <p className={errCls}>{errors.anoFabricacao.message}</p>}
          </div>
          <div>
            <label className={`${labelCls} text-blue-800`}>Código de Construção (Placa)</label>
            <select {...register('codigoProjeto')} className={`${selectCls} bg-blue-50 border-blue-200`}>
              <option value="ASME Sec. VIII Div 1">ASME Sec. VIII Div 1</option>
              <option value="ASME Sec. VIII Div 2">ASME Sec. VIII Div 2</option>
              <option value="PD 5500">PD 5500</option>
              <option value="GB/T 150">GB/T 150</option>
              <option value="Desconhecido">Desconhecido</option>
            </select>
          </div>
          <div>
            <label className={`${labelCls} text-emerald-800`}>PMTA da Placa (kPa)</label>
            <input type="number" step="0.1" {...register('pmtaFabricante')} className={`${inputCls} bg-emerald-50 border-emerald-300`} placeholder="Ex: 4200" />
            {errors.pmtaFabricante && <p className={errCls}>{errors.pmtaFabricante.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Tipo de Vaso</label>
            <select {...register('tipoVaso')} className={selectCls}>
              <option value="Coluna (Vertical)">Coluna (Vertical)</option>
              <option value="Vaso Horizontal">Vaso Horizontal</option>
              <option value="Esférico">Esférico</option>
            </select>
          </div>
        </div>

        {/* 1.2 Datas e Tipo de Inspeção */}
        <p className={`${subTitle} mt-4`}>1.2 Inspeção</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className={labelCls}>Tipo de Inspeção</label>
            <select {...register('tipoInspecao')} className={selectCls}>
              <option value="Inicial">Inicial</option>
              <option value="Periódica">Periódica</option>
              <option value="Extraordinária">Extraordinária</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Data de Início da Inspeção</label>
            <input type="date" {...register('dataInspecao')} className={inputCls} />
            {errors.dataInspecao && <p className={errCls}>{errors.dataInspecao.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Data de Emissão do Laudo</label>
            <input type="date" {...register('dataEmissaoLaudo')} className={inputCls} />
            {errors.dataEmissaoLaudo && <p className={errCls}>{errors.dataEmissaoLaudo.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Ambiente de Instalação</label>
            <select {...register('ambiente')} className={selectCls}>
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
            <input type="text" {...register('fluidoServico')} className={inputCls} placeholder="Ex: Ar comprimido, Vapor de água" />
            {errors.fluidoServico && <p className={errCls}>{errors.fluidoServico.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Classe do Fluido</label>
            <select {...register('fluidoClasse')} className={selectCls}>
              <option value="A (Inflamável/Tóxico)">Classe A — Inflamável ou Tóxico</option>
              <option value="B (Combustível/Tóxico leve)">Classe B — Combustível / Tóxico leve</option>
              <option value="C (Vapor de Água/Gases asfixiantes)">Classe C — Vapor d&apos;água / Asfixiantes</option>
              <option value="D (Água/Outros)">Classe D — Água / Outros</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Pressão Máxima de Operação — P (MPa)</label>
            <input type="number" step="0.01" {...register('pressaoOperacao')} className={inputCls} placeholder="Ex: 4.2" />
            {errors.pressaoOperacao && <p className={errCls}>{errors.pressaoOperacao.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Volume Interno — V (m³)</label>
            <input type="number" step="0.01" {...register('volume')} className={inputCls} placeholder="Ex: 1.0" />
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
              <select {...register(field)} className="block w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-slate-500 focus:border-slate-500">
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================
          SEÇÃO 3 — DISPOSITIVOS DE SEGURANÇA  §13.5.1.2 / §13.5.4.11(n)
      ================================================================ */}
      <section>
        <h2 className={sectionTitle}>3. Dispositivos de Segurança — §13.5.1.2 / §13.5.4.11(n)</h2>
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5 mb-4 font-semibold">
          ATENÇÃO: Ausência ou bloqueio de dispositivos configura Grave e Iminente Risco — Art. 13.3.1(a)(c)
        </p>

        {/* Tabela dinâmica de dispositivos */}
        <div className="space-y-3 mb-3">
          {dispFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-2 md:grid-cols-6 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">TAG</label>
                <input {...register(`dispositivosSeguranca.${index}.tag`)} placeholder="Ex: VS-01" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                <select {...register(`dispositivosSeguranca.${index}.tipo`)} className={selectCls}>
                  <option value="VS">VS — Válvula de Segurança</option>
                  <option value="VR">VR — Válvula de Alívio</option>
                  <option value="DR">DR — Disco de Ruptura</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Pressão Ajuste (kPa)</label>
                <input type="number" step="1" {...register(`dispositivosSeguranca.${index}.pressaoAjusteKpa`)} placeholder="Ex: 4200" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Último Teste</label>
                <input type="date" {...register(`dispositivosSeguranca.${index}.ultimoTeste`)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Situação</label>
                <select {...register(`dispositivosSeguranca.${index}.situacao`)} className={`${selectCls} ${watch(`dispositivosSeguranca.${index}.situacao`) === 'Reparo' ? 'border-amber-400 bg-amber-50' : 'border-emerald-300 bg-emerald-50'}`}>
                  <option value="OK">OK</option>
                  <option value="Reparo">Reparo / Calibrar</option>
                </select>
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
        <button type="button" onClick={() => dispAppend({ tag: '', tipo: 'VS', pressaoAjusteKpa: 0, ultimoTeste: '', situacao: 'OK' })}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 border border-dashed border-slate-400 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
          Adicionar Dispositivo
        </button>

        {/* Indicador de pressão §13.5.1.2(d) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <label className={labelCls}>Exame Externo do Vaso — §13.3.4</label>
            <select {...register('exameExterno')} className={`${selectCls} ${v.exameExterno === 'Não Conforme' ? 'border-red-400 bg-red-50' : 'border-emerald-300 bg-emerald-50'}`}>
              <option value="Conforme">Conforme</option>
              <option value="Não Conforme">Não Conforme</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Exame Interno do Vaso</label>
            <select {...register('exameInterno')} className={`${selectCls} ${v.exameInterno === 'Não Conforme' ? 'border-red-400 bg-red-50' : ''}`}>
              <option value="Conforme">Conforme</option>
              <option value="Não Conforme">Não Conforme</option>
              <option value="Não Aplicável">Não Aplicável</option>
            </select>
          </div>
        </div>

        {/* Medições de Espessura §13.5.4.11(d) */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className={subTitle}>Medições de Espessura por Ultrassom — §13.5.4.11(d)</p>
            <span className="text-xs text-slate-400">{medFields.length} ponto(s)</span>
          </div>
          <div className="space-y-2 mb-3">
            {medFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-2 md:grid-cols-6 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 items-end">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Ponto</label>
                  <input {...register(`medicoesEspessura.${index}.ponto`)} placeholder="PE-01" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Esp. Original (mm)</label>
                  <input type="number" step="0.1" {...register(`medicoesEspessura.${index}.espOriginal`)} placeholder="N/D" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Esp. Medida (mm) *</label>
                  <input type="number" step="0.1" {...register(`medicoesEspessura.${index}.espMedida`)} placeholder="Ex: 11.7" className={`${inputCls} border-blue-300 bg-blue-50`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Esp. Mín. Adm. (mm)</label>
                  <input type="number" step="0.1" {...register(`medicoesEspessura.${index}.espMinAdm`)} placeholder="N/D" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Situação</label>
                  <select {...register(`medicoesEspessura.${index}.situacao`)} className={`${selectCls} ${watch(`medicoesEspessura.${index}.situacao`) === 'Crítico' ? 'border-red-400 bg-red-50' : 'border-emerald-300 bg-emerald-50'}`}>
                    <option value="OK">OK</option>
                    <option value="Crítico">Crítico</option>
                  </select>
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
          <button type="button" onClick={() => medAppend({ ponto: `PE-0${medFields.length + 1}`, espOriginal: null, espMedida: 0, espMinAdm: null, situacao: 'OK' })}
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
            <select {...register('materialS')} className={`${selectCls} mt-1`}>
              <option value="137.9">SA-285 / SA-516 (137.9 MPa)</option>
              <option value="114.5">SA-36 Estrutural (114.5 MPa)</option>
              <option value="115.0">SA-240 304L Inox (115.0 MPa)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Eficiência de Solda — E</label>
            <select {...register('eficienciaE')} className={`${selectCls} mt-1`}>
              <option value="1.0">1.00 — Total (100% Radiografado)</option>
              <option value="0.85">0.85 — Spot (Parcial)</option>
              <option value="0.70">0.70 — Sem Radiografia</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Diâmetro Interno — D (mm)</label>
            <input type="number" step="1" {...register('diametroD')} className={inputCls} />
          </div>
          <div>
            <label className={`${labelCls} text-blue-700`}>Ultrassom Costado — t (mm)</label>
            <input type="number" step="0.1" {...register('espessuraCostado')} className={`${inputCls} border-blue-300 bg-blue-50`} placeholder="Ex: 5.5" />
          </div>
          <div>
            <label className={`${labelCls} text-blue-700`}>Ultrassom Tampo — t (mm)</label>
            <input type="number" step="0.1" {...register('espessuraTampo')} className={`${inputCls} border-blue-300 bg-blue-50`} placeholder="Ex: 4.8" />
          </div>
        </div>

        <div>
          <label className={`${labelCls} text-purple-800 mt-4 mb-1 block`}>Pressão de Calibração da PSV (MPa)</label>
          <input type="number" step="0.01" {...register('psvCalibracao')} className={`${inputCls} border-purple-300 bg-purple-50 max-w-xs`} placeholder="Ex: 0.8" />
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
              <input type="number" step="0.01" {...register('pmtaFixadaPLH')} className={`${inputCls} border-emerald-300 bg-emerald-50`} placeholder="Auto-sugerida pelo ASME" />
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
              <input type="date" {...register('proximaInspecaoExterna')} className={`${inputCls} bg-blue-50 border-blue-300`} />
              {errors.proximaInspecaoExterna && <p className={errCls}>{errors.proximaInspecaoExterna.message}</p>}
            </div>
            <div>
              <label className={`${labelCls} text-purple-700`}>Próxima Inspeção Interna</label>
              <input type="date" {...register('proximaInspecaoInterna')} className={`${inputCls} bg-purple-50 border-purple-300`} />
              {errors.proximaInspecaoInterna && <p className={errCls}>{errors.proximaInspecaoInterna.message}</p>}
            </div>
            <div>
              <label className={`${labelCls} text-amber-700`}>Próximo Teste dos Dispositivos</label>
              <input type="date" {...register('dataProximoTesteDispositivos')} className={`${inputCls} bg-amber-50 border-amber-300`} />
              {errors.dataProximoTesteDispositivos && <p className={errCls}>{errors.dataProximoTesteDispositivos.message}</p>}
            </div>
          </div>
        </div>

        {/* 5.4 Não Conformidades §13.5.4.11(j) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={subTitle}>5.4 Não Conformidades — §13.5.4.11(j)</h3>
            <span className="text-xs text-slate-400">{ncFields.length} NC(s)</span>
          </div>
          <div className="space-y-4 mb-3">
            {ncFields.length === 0 && <p className="text-sm text-slate-400 italic py-2">Nenhuma NC. Clique em &quot;+ Adicionar&quot; para incluir.</p>}
            {ncFields.map((field, index) => (
              <div key={field.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase">NC {String(index + 1).padStart(2, '0')}</span>
                  <button type="button" onClick={() => ncRemove(index)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z" clipRule="evenodd" /></svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Descrição da Não Conformidade</label>
                    <input {...register(`naoConformidades.${index}.descricao`)} placeholder="Ex: Placa de identificação não redigida em português" className={inputCls} />
                    {errors.naoConformidades?.[index]?.descricao && <p className={errCls}>{errors.naoConformidades[index]?.descricao?.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Referência NR-13</label>
                    <input {...register(`naoConformidades.${index}.refNR13`)} placeholder="Ex: 13.5.1.3" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Ação Corretiva</label>
                  <textarea {...register(`naoConformidades.${index}.acaoCorretiva`)} rows={2} placeholder="Descreva a ação corretiva necessária..." className={`${inputCls} resize-none`} />
                  {errors.naoConformidades?.[index]?.acaoCorretiva && <p className={errCls}>{errors.naoConformidades[index]?.acaoCorretiva?.message}</p>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Grau de Risco</label>
                    <select {...register(`naoConformidades.${index}.grauRisco`)} className={`${selectCls} font-semibold ${
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
                    <input type="number" {...register(`naoConformidades.${index}.prazo`)} placeholder="Ex: 30" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Responsável</label>
                    <input {...register(`naoConformidades.${index}.responsavel`)} placeholder="Ex: Manutenção" className={inputCls} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => ncAppend({ descricao: '', refNR13: '', acaoCorretiva: '', grauRisco: 'Moderado', prazo: 30, responsavel: '' })}
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
            className={`${inputCls} resize-none`} />
          {errors.parecerTecnico && <p className={errCls}>{errors.parecerTecnico.message}</p>}
        </div>

        {/* 5.6 RTH §13.5.4.11(m) */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
          <h3 className={subTitle}>5.6 Profissional Legalmente Habilitado (PLH) — §13.3.2 / §13.5.4.11(m)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Formação</label>
              <select {...register('rthProfissao')} className={selectCls}>
                <option value="Engenheiro Mecânico">Engenheiro Mecânico</option>
                <option value="Engenheiro de Segurança do Trabalho">Eng. de Segurança do Trabalho</option>
                <option value="Técnico de Segurança do Trabalho">Técnico de Segurança do Trabalho</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Nome Completo</label>
              <input type="text" {...register('rthNome')} placeholder="Ex: Danilo Lobo Souza" className={inputCls} />
              {errors.rthNome && <p className={errCls}>{errors.rthNome.message}</p>}
            </div>
            <div>
              <label className={labelCls}>CREA / Registro — §13.5.4.11(m)</label>
              <input type="text" {...register('rthCrea')} placeholder="Ex: 389785MG" className={inputCls} />
              {errors.rthCrea && <p className={errCls}>{errors.rthCrea.message}</p>}
            </div>
          </div>
        </div>
      </section>

      <button disabled={!isValid} type="submit"
        className="w-full bg-slate-800 text-white font-bold py-4 px-4 rounded mt-4 disabled:opacity-50 text-lg hover:bg-slate-700 transition">
        Confirmar Inspeção NR-13
      </button>
    </form>
  );
}
