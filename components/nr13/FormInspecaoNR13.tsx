'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { calcularPMTACilindro, calcularPMTATampoToriesferico, calcularPMTAGlobal } from '../../lib/domain/nr13/pmta';

// Zod Schema para Validação Local
const FormSchema = z.object({
  // Dados de Identificação NR-13
  tag: z.string().min(1, 'TAG é obrigatório'),
  tipoVaso: z.enum(['Coluna (Vertical)', 'Vaso Horizontal', 'Esférico']),
  ambiente: z.enum(['Aberto', 'Fechado']),
  volume: z.coerce.number().positive('Volume deve ser maior que 0'),
  fluidoClasse: z.enum(['A (Inflamável/Tóxico)', 'B (Combustível/Tóxico leve)', 'C (Vapor de Água/Gases asfixiantes)', 'D (Água/Outros)']),
  categoriaVaso: z.enum(['I', 'II', 'III', 'IV', 'V']),
  
  // Rastreabilidade do Equipamento
  fabricante: z.string().min(1, 'Fabricante é obrigatório'),
  numeroSerie: z.string().min(1, 'Número de Série é obrigatório'),
  anoFabricacao: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  codigoProjeto: z.enum(['ASME Sec. VIII Div 1', 'ASME Sec. VIII Div 2', 'PD 5500', 'Desconhecido']),

  // Checklist Documental
  prontuario: z.enum(['Existe Integral', 'Não Existe', 'Parcial / Sendo Reconstituído']),
  registroSeguranca: z.enum(['Atualizado', 'Desatualizado', 'Inexistente']),
  projetoInstalacao: z.enum(['Existe', 'Não Existe', 'Dispensa Legal (Antigo)']),
  relatoriosAnteriores: z.enum(['Disponíveis', 'Indisponíveis', 'Primeira Inspeção']),
  placaIdentificacao: z.enum(['Fixada e Legível', 'Ilegível / Danificada', 'Inexistente']),

  // Datas e Avaliação Física NR-13
  dataInspecao: z.string().min(10, 'Data inválida'),
  tipoInspecao: z.enum(['Inicial', 'Periódica', 'Extraordinária']),
  exameExterno: z.enum(['Conforme', 'Não Conforme']),
  exameInterno: z.enum(['Conforme', 'Não Conforme', 'Não Aplicável']),
  
  // Dados ASME (Ultrassom e PMTA)
  materialS: z.coerce.number().positive(),
  eficienciaE: z.coerce.number().max(1).min(0.1),
  diametroD: z.coerce.number().positive().min(50),
  espessuraCostado: z.coerce.number().positive(),
  espessuraTampo: z.coerce.number().positive(),
  psvCalibracao: z.coerce.number().positive(),
});

type FormData = z.infer<typeof FormSchema>;

export default function FormInspecaoNR13() {
  const [pmtaTempoReal, setPmtaTempoReal] = useState<number | null>(null);
  const [alerta, setAlerta] = useState<string | null>(null);

  const { register, watch, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
    defaultValues: { 
      diametroD: 1000, 
      psvCalibracao: 0.8, 
      materialS: 137.9, 
      eficienciaE: 0.85,
      dataInspecao: new Date().toISOString().split('T')[0],
      codigoProjeto: 'ASME Sec. VIII Div 1',
      anoFabricacao: new Date().getFullYear(),
      prontuario: 'Existe Integral',
      registroSeguranca: 'Atualizado',
      projetoInstalacao: 'Existe',
      relatoriosAnteriores: 'Disponíveis',
      placaIdentificacao: 'Fixada e Legível'
    }
  });

  const valoresAtuais = watch();

  // Dados detalhados do cálculo para exibição transparente
  const [detalheCalculo, setDetalheCalculo] = useState<{
    pmtaCostado: number;
    pmtaTampo: number;
    pmtaLimitante: number;
    componenteFragil: 'Costado' | 'Tampo';
    psvInformada: number;
    condena: boolean;
  } | null>(null);

  useEffect(() => {
    if (valoresAtuais.materialS && valoresAtuais.eficienciaE && valoresAtuais.diametroD && valoresAtuais.espessuraCostado && valoresAtuais.espessuraTampo && valoresAtuais.psvCalibracao) {
      const { materialS, eficienciaE, diametroD, espessuraCostado, espessuraTampo, psvCalibracao } = valoresAtuais;
      const R = diametroD! / 2;
      
      const pmtaCostado = calcularPMTACilindro({ S: materialS!, E: eficienciaE!, t: espessuraCostado!, R, D: diametroD! });
      const pmtaTampo = calcularPMTATampoToriesferico({ S: materialS!, E: eficienciaE!, t: espessuraTampo!, R, D: diametroD! });
      
      const calc = calcularPMTAGlobal(pmtaCostado, pmtaTampo, psvCalibracao!);
      
      setPmtaTempoReal(calc.pmtaLimitante);
      setDetalheCalculo({
        pmtaCostado,
        pmtaTampo,
        pmtaLimitante: calc.pmtaLimitante,
        componenteFragil: calc.componenteFragil,
        psvInformada: psvCalibracao!,
        condena: calc.condena,
      });
      setAlerta(calc.condena 
        ? `A PSV está calibrada em ${(psvCalibracao! * 10.197).toFixed(2)} kgf/cm², mas a PMTA recalculada é apenas ${(calc.pmtaLimitante * 10.197).toFixed(2)} kgf/cm². A válvula não abrirá a tempo.`
        : '✅ Vaso Conforme — PSV abrirá antes do limite estrutural.'
      );
    } else {
      setPmtaTempoReal(null);
      setDetalheCalculo(null);
    }
  }, [valoresAtuais]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Avaliação NR-13 preenchida e enviada com Sucesso!");
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-xl shadow-md w-full mx-auto border-t-4 border-slate-800 space-y-10">
      
      {/* SEÇÃO 1: IDENTIFICAÇÃO DO VASO (NR-13) */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">1. Rastreabilidade e Dados do Equipamento</h2>
        
        {/* Row 1: TAG, Fabricante, Série */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium">TAG do Equipamento</label>
            <input type="text" {...register('tag')} className="mt-1 block w-full p-2 border rounded border-gray-300 shadow-sm focus:ring-slate-500 focus:border-slate-500" placeholder="Ex: V-101" />
            {errors.tag && <span className="text-xs text-red-500">{errors.tag.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium">Fabricante</label>
            <input type="text" {...register('fabricante')} className="mt-1 block w-full p-2 border rounded border-gray-300 shadow-sm focus:ring-slate-500 focus:border-slate-500" placeholder="Ex: Metalúrgica Alfa" />
            {errors.fabricante && <span className="text-xs text-red-500">{errors.fabricante.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium">Número de Série</label>
            <input type="text" {...register('numeroSerie')} className="mt-1 block w-full p-2 border rounded border-gray-300 shadow-sm focus:ring-slate-500 focus:border-slate-500" placeholder="Ex: SN-2023-44" />
            {errors.numeroSerie && <span className="text-xs text-red-500">{errors.numeroSerie.message}</span>}
          </div>
        </div>

        {/* Row 2: Ano, Tipo, Código */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium">Ano de Fabricação</label>
            <input type="number" {...register('anoFabricacao')} className="mt-1 block w-full p-2 border rounded border-gray-300 shadow-sm focus:ring-slate-500 focus:border-slate-500" />
            {errors.anoFabricacao && <span className="text-xs text-red-500">{errors.anoFabricacao.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium">Tipo de Vaso</label>
            <select {...register('tipoVaso')} className="mt-1 block w-full p-2 border rounded bg-slate-50">
              <option value="Coluna (Vertical)">Coluna (Vertical)</option>
              <option value="Vaso Horizontal">Vaso Horizontal</option>
              <option value="Esférico">Esférico</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-800">Código de Projeto</label>
            <select {...register('codigoProjeto')} className="mt-1 block w-full p-2 border rounded bg-blue-50 border-blue-200">
              <option value="ASME Sec. VIII Div 1">ASME Sec. VIII Div 1</option>
              <option value="ASME Sec. VIII Div 2">ASME Sec. VIII Div 2</option>
              <option value="PD 5500">PD 5500</option>
              <option value="Desconhecido">Desconhecido (Requer Reconstituição)</option>
            </select>
          </div>
        </div>
        
        {/* Row 3: Instalação e Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium">Data da Inspeção</label>
            <input type="date" {...register('dataInspecao')} className="mt-1 block w-full p-2 border rounded border-gray-300 shadow-sm focus:ring-slate-500 focus:border-slate-500" />
            {errors.dataInspecao && <span className="text-xs text-red-500">{errors.dataInspecao.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium">Ambiente de Instalação</label>
            <select {...register('ambiente')} className="mt-1 block w-full p-2 border rounded bg-slate-50">
              <option value="Aberto">Aberto (Sujeito a intempéries)</option>
              <option value="Fechado">Fechado (Abrigado)</option>
            </select>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: CHECKLIST DOCUMENTAL (UX para Mobile) */}
      <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
        <h2 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2 border-slate-300">2. Requisitos Documentais (NR-13.5.1.6)</h2>
        
        <p className="text-sm text-gray-500 mb-5">Verifique a existência física e disponibilidade dos documentos técnicos do VASO de Pressão, além da placa de identificação estrutural.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Prontuário */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Prontuário do Equipamento</label>
            <select {...register('prontuario')} className="block w-full p-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
              <option value="Existe Integral">Existe Integralmente</option>
              <option value="Parcial / Sendo Reconstituído">Parcial / Em Reconstituição</option>
              <option value="Não Existe">Não Existe (Falta Grave)</option>
            </select>
          </div>

          {/* Registro de Segurança */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Registro de Segurança</label>
            <select {...register('registroSeguranca')} className="block w-full p-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
              <option value="Atualizado">Atualizado (Em dia)</option>
              <option value="Desatualizado">Desatualizado</option>
              <option value="Inexistente">Inexistente</option>
            </select>
          </div>

          {/* Projeto de Instalação */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Projeto de Instalação</label>
            <select {...register('projetoInstalacao')} className="block w-full p-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
              <option value="Existe">Aprovado e Arquivado</option>
              <option value="Dispensa Legal (Antigo)">Dispensado (Vaso Antigo)</option>
              <option value="Não Existe">Ausente / Não Autorizado</option>
            </select>
          </div>

          {/* Relatórios Anteriores */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Relatórios de Inspeção Ant.</label>
            <select {...register('relatoriosAnteriores')} className="block w-full p-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
              <option value="Disponíveis">Catalogados / Disponíveis</option>
              <option value="Primeira Inspeção">N/A (Primeira Inspeção)</option>
              <option value="Indisponíveis">Arquivo Indisponível</option>
            </select>
          </div>

          {/* Placa de Identificação Fixada */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-bold text-amber-800 mb-1">Placa de Identificação (Metal)</label>
            <select {...register('placaIdentificacao')} className="block w-full p-2.5 bg-white border border-amber-300 rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500">
              <option value="Fixada e Legível">Fixada e Legível no Costado</option>
              <option value="Ilegível / Danificada">Ilegível / Avariada</option>
              <option value="Inexistente">Inexistente (Riscos Operacionais)</option>
            </select>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: ENQUADRAMENTO NR-13 */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">3. Enquadramento NR-13</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Volume (m³)</label>
            <input type="number" step="0.01" {...register('volume')} className="mt-1 block w-full p-2 border rounded" placeholder="Ex: 5.0" />
          </div>
          <div>
            <label className="block text-sm font-medium">Classe do Fluido</label>
            <select {...register('fluidoClasse')} className="mt-1 block w-full p-2 border rounded">
              <option value="A (Inflamável/Tóxico)">Classe A — Inflamável ou Tóxico</option>
              <option value="B (Combustível/Tóxico leve)">Classe B — Combustível / Tóxico leve</option>
              <option value="C (Vapor de Água/Gases asfixiantes)">Classe C — Vapor d'água / Asfixiantes</option>
              <option value="D (Água/Outros)">Classe D — Água / Outros</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Categoria do Vaso (NR-13 Anexo I)</label>
            <select {...register('categoriaVaso')} className="mt-1 block w-full p-2 border rounded">
              <option value="I">Categoria I</option>
              <option value="II">Categoria II</option>
              <option value="III">Categoria III</option>
              <option value="IV">Categoria IV</option>
              <option value="V">Categoria V (Dispensado)</option>
            </select>
          </div>
        </div>
      </section>

      {/* SEÇÃO 4: AVALIAÇÃO FÍSICA E DISPOSITIVOS (NR-13) */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">4. Exames e Dispositivos de Segurança</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Exame Externo</label>
            <select {...register('exameExterno')} className="mt-1 block w-full p-2 border rounded bg-slate-50">
              <option value="Conforme">Conforme</option>
              <option value="Não Conforme">Não Conforme</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Exame Interno</label>
            <select {...register('exameInterno')} className="mt-1 block w-full p-2 border rounded bg-slate-50">
              <option value="Conforme">Conforme</option>
              <option value="Não Conforme">Não Conforme</option>
              <option value="Não Aplicável">Não Aplicável</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-800">Calibração PSV (MPa)</label>
            <input type="number" step="0.01" {...register('psvCalibracao')} className="mt-1 block w-full p-2 border rounded" placeholder="Pressão de Abertura" />
          </div>
        </div>
      </section>

      {/* SEÇÃO 4: CÁLCULO DE PMTA (ASME SEC VIII) */}
      <section className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h2 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2 border-slate-300">4. Ultrassom e Base de Cálculo ASME</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium">Material (Tensão Admitida S)</label>
            <select {...register('materialS')} className="mt-1 block w-full rounded-md border-gray-300 p-2 border">
              <option value="137.9">SA-285 / SA-516 (137.9 MPa)</option>
              <option value="114.5">SA-36 Estrutural (114.5 MPa)</option>
              <option value="115.0">SA-240 304L Inox (115.0 MPa)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Eficiência de Solda (ER)</label>
            <select {...register('eficienciaE')} className="mt-1 block w-full rounded-md border-gray-300 p-2 border">
              <option value="1.0">1.00 - Total (100%)</option>
              <option value="0.85">0.85 - Spot (Parcial)</option>
              <option value="0.70">0.70 - Sem Radiografia</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-700">Ultrassom Costado (mm)</label>
            <input type="number" step="0.1" {...register('espessuraCostado')} className="mt-1 block w-full p-2 border rounded" placeholder="Ex: 5.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-700">Ultrassom Tampo (mm)</label>
            <input type="number" step="0.1" {...register('espessuraTampo')} className="mt-1 block w-full p-2 border rounded" placeholder="Ex: 4.8" />
          </div>
        </div>

        <div className="mt-6 p-5 bg-white rounded-xl border border-slate-300 shadow-sm space-y-4">
          <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Resultado da Avaliação Estrutural</h3>
          
          {detalheCalculo ? (
            <div className="space-y-5">
              
              {/* PMTA por Componente */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg border ${detalheCalculo.componenteFragil === 'Costado' ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="text-xs font-medium text-gray-500 uppercase">PMTA Costado</p>
                  <p className="text-2xl font-bold text-gray-900">{(detalheCalculo.pmtaCostado * 10.197).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">kgf/cm²</p>
                  {detalheCalculo.componenteFragil === 'Costado' && (
                    <span className="inline-block mt-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">⚠ Mais frágil</span>
                  )}
                </div>
                <div className={`p-3 rounded-lg border ${detalheCalculo.componenteFragil === 'Tampo' ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="text-xs font-medium text-gray-500 uppercase">PMTA Tampo</p>
                  <p className="text-2xl font-bold text-gray-900">{(detalheCalculo.pmtaTampo * 10.197).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">kgf/cm²</p>
                  {detalheCalculo.componenteFragil === 'Tampo' && (
                    <span className="inline-block mt-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">⚠ Mais frágil</span>
                  )}
                </div>
              </div>

              {/* COMPARAÇÃO PSV vs PMTA */}
              <div className={`p-4 rounded-xl border-2 ${detalheCalculo.condena ? 'bg-red-50 border-red-300' : 'bg-emerald-50 border-emerald-300'}`}>
                <div className="grid grid-cols-3 items-center text-center">
                  {/* PSV */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">PSV Calibrada</p>
                    <p className={`text-2xl font-black ${detalheCalculo.condena ? 'text-red-600' : 'text-gray-700'}`}>
                      {(detalheCalculo.psvInformada * 10.197).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">kgf/cm²</p>
                  </div>

                  {/* Indicador Visual */}
                  <div className="flex flex-col items-center">
                    {detalheCalculo.condena ? (
                      <>
                        <span className="text-red-500 text-2xl font-bold">&gt;</span>
                        <span className="text-xs font-bold text-red-600 mt-1">EXCEDE</span>
                      </>
                    ) : (
                      <>
                        <span className="text-emerald-500 text-2xl font-bold">≤</span>
                        <span className="text-xs font-bold text-emerald-600 mt-1">OK</span>
                      </>
                    )}
                  </div>

                  {/* PMTA Limitante */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">PMTA Limitante</p>
                    <p className={`text-2xl font-black ${detalheCalculo.condena ? 'text-red-600' : 'text-emerald-700'}`}>
                      {(detalheCalculo.pmtaLimitante * 10.197).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">kgf/cm² ({detalheCalculo.componenteFragil})</p>
                  </div>
                </div>

                {/* Mensagem explicativa */}
                <p className={`text-sm mt-3 pt-3 border-t ${detalheCalculo.condena ? 'text-red-700 border-red-200 font-semibold' : 'text-emerald-700 border-emerald-200'}`}>
                  {alerta}
                </p>
              </div>

            </div>
          ) : (
            <p className="text-sm text-gray-500">Preencha as espessuras do ultrassom para visualizar o recálculo ASME.</p>
          )}
        </div>
      </section>

      <button disabled={!isValid} type="submit" className="w-full bg-slate-800 text-white font-bold py-4 px-4 rounded mt-4 disabled:opacity-50 text-lg hover:bg-slate-700 transition">
        Confirmar Inspeção NR-13
      </button>

    </form>
  );
}
