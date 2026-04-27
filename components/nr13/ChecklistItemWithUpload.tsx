import React from 'react'
import UploadFotoNR13 from './UploadFotoNR13'
import GaleriaFotosNR13 from './GaleriaFotosNR13'

interface ChecklistItemWithUploadProps {
  titulo: string
  descricao: string
  valor: string
  onChangeValor: (v: string) => void
  opcoes: { value: string; label: string }[]
  fotos: any[]
  onChangeFotos: (fotos: any[]) => void
  maxFotos?: number
  alertGrave?: boolean
  alertMensagem?: string
}

export default function ChecklistItemWithUpload({
  titulo,
  descricao,
  valor,
  onChangeValor,
  opcoes,
  fotos,
  onChangeFotos,
  maxFotos = 4,
  alertGrave = false,
  alertMensagem = '⚠️ Risco Iminente Detectado'
}: ChecklistItemWithUploadProps) {
  const handleUpload = async (file: File) => {
    if (fotos.length >= maxFotos) return { path: null, error: `Máximo de ${maxFotos} fotos permitido` }
    const url = URL.createObjectURL(file)
    onChangeFotos([...fotos, { url, arquivo: file }])
    return { path: 'mock-path', error: null }
  }

  const handleRemove = (index: number) => {
    onChangeFotos(fotos.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col p-4 bg-gray-50 border border-gray-100 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{titulo}</p>
          <p className="text-xs text-gray-500 mt-0.5">{descricao}</p>
        </div>
        <select
          className={`input-field border rounded px-3 py-2 text-sm w-48 ${alertGrave ? 'border-red-500 bg-red-50 text-red-700 font-semibold' : 'border-gray-300'}`}
          value={valor}
          onChange={e => onChangeValor(e.target.value)}
        >
          {opcoes.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      
      {alertGrave && (
        <div className="mt-2 text-xs font-bold text-white bg-red-600 px-3 py-1.5 rounded inline-block text-center self-end">
          {alertMensagem}
        </div>
      )}

      {/* Row das fotos */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-600 mb-2">Evidências Fotográficas ({fotos.length}/{maxFotos})</p>
        <div className="flex gap-4 items-start">
          {fotos.length < maxFotos && (
            <div className="w-20 flex-shrink-0">
               <UploadFotoNR13
                 label="Add"
                 onUpload={handleUpload}
                 onPhotoUploaded={() => {}}
                 corBorda="slate"
                 compacto
               />
            </div>
          )}
          <div className="flex-1 w-full">
            <GaleriaFotosNR13
              fotos={fotos.map(f => ({ url: f.url, removivel: true }))}
              onRemove={handleRemove}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
