"use client";

import { useState } from "react";
import ReactMarkdown from 'react-markdown'; // Importamos la librería
import { 
  CheckCircle2, ThumbsUp, ThumbsDown, FileText, Copy, Check,
  Calendar, ChevronDown, ChevronUp,
  BookOpen, Download, AlertTriangle
} from "lucide-react";

export default function ResultCard({ 
  respuesta, 
  query, 
  onFeedback,
  sugerencias = [],
  onSelectSugerencia
}) {
  const [copied, setCopied] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const [showAllSources, setShowAllSources] = useState(false);

  const respuestaTexto = typeof respuesta === 'string' ? respuesta : respuesta.respuesta;
  const metadata = typeof respuesta !== 'string' ? respuesta : null;
  
  const tieneViñetas = respuestaTexto.includes('•') || respuestaTexto.includes('-') || respuestaTexto.includes('*');
  const tieneFechas = respuestaTexto.match(/\d{1,2}\s+de\s+[a-zA-Z]+\s+de\s+\d{4}/) || 
                      respuestaTexto.match(/\d{4}-\d{2}-\d{2}/);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(respuestaTexto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (tipo) => {
    if (feedbackGiven) return;
    setFeedbackGiven(tipo);
    onFeedback(tipo);
  };

  return (
    <div className="mt-8 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        
        {/* Header con metadata */}
        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 leading-none">Respuesta de Axiom Engine</h3>
                <div className="flex items-center gap-2 mt-2">
                  {metadata?.fuente === 'cache' && (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                      Respuesta validada
                    </span>
                  )}
                  {tieneViñetas && (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                      Información estructurada
                    </span>
                  )}
                  {tieneFechas && (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Con fechas
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Contenido de la respuesta con Markdown */}
        <div className="p-6">
          <div className="prose prose-blue max-w-none text-gray-800 leading-relaxed">
            <ReactMarkdown
              components={{
                // Títulos (###)
                h3: ({node, ...props}) => (
                  <h3 className="text-lg font-bold text-blue-900 mt-6 mb-3 flex items-center gap-2 border-b border-blue-50 pb-1" {...props} />
                ),
                // Párrafos
                p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                // Listas con viñetas
                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2 text-gray-700" {...props} />,
                // Elementos de lista
                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                // Negritas (**)
                strong: ({node, ...props}) => <strong className="font-bold text-gray-900 bg-yellow-50 px-0.5 rounded" {...props} />,
                // Separadores (---)
                hr: () => <hr className="my-6 border-gray-100" />
              }}
            >
              {respuestaTexto}
            </ReactMarkdown>
          </div>

          {/* Advertencia de información limitada */}
          {respuestaTexto.length < 400 && metadata?.documentos_usados?.length > 0 && (
            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900">Información resumida</p>
                <p className="text-xs text-amber-800 mt-0.5">Puedes encontrar más detalles en los documentos fuente listados abajo.</p>
              </div>
            </div>
          )}

          {/* Documentos fuente */}
          {metadata?.documentos_usados?.length > 0 && (
            <div className="mt-8 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowAllSources(!showAllSources)}
                className="flex items-center justify-between w-full text-left group"
              >
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 group-hover:text-gray-700 transition-colors">
                  <FileText className="w-3.5 h-3.5" /> Fuentes consultadas ({metadata.documentos_usados.length})
                </p>
                {showAllSources ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              
              <div className={`mt-3 overflow-hidden transition-all duration-300 ${showAllSources ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-wrap gap-2 pb-2">
                  {metadata.documentos_usados.map((doc, idx) => (
                    <span key={idx} className="text-[11px] px-3 py-1.5 bg-gray-50 text-gray-600 rounded-md border border-gray-100 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> {doc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Feedback y Sugerencias - Simplificados para ahorrar espacio */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">¿Útil?</span>
              <button onClick={() => handleFeedback('positivo')} className={`p-1.5 rounded-md transition-all ${feedbackGiven === 'positivo' ? 'bg-green-600 text-white' : 'hover:bg-green-50 text-green-600'}`}>
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button onClick={() => handleFeedback('negativo')} className={`p-1.5 rounded-md transition-all ${feedbackGiven === 'negativo' ? 'bg-red-600 text-white' : 'hover:bg-red-50 text-red-600'}`}>
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                const blob = new Blob([respuestaTexto], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `axiom_${Date.now()}.txt`;
                a.click();
              }}
              className="text-[11px] font-medium text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1 justify-center"
            >
              <Download className="w-3.5 h-3.5" /> Descargar reporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}