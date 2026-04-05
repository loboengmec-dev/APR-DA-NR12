import FormInspecaoNR13 from '@/components/nr13/FormInspecaoNR13';

export default function DemoNR13Page() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Playground de Vistoria NR-13
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Protótipo visual do Especialista Front-end. Teste a reatividade offline do recálculo de PMTA 
            utilizando o formulário focado no Código ASME. Tente forçar falhas variando as espessuras.
          </p>
        </div>
        
        {/* Renderiza o componente criado isolado e com padding amplo para mobile */}
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <FormInspecaoNR13 />
        </div>
      </div>
    </div>
  );
}
