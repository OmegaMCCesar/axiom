"use client";

import { useState, useEffect } from "react";
import { AlertCircle, ChevronDown, ChevronUp, CheckCircle, RefreshCw } from "lucide-react";

export default function UnansweredQuestions() {
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [filtro, setFiltro] = useState('pendientes');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarPreguntas();
  }, [filtro]);

  const cargarPreguntas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/unanswered?filtro=${filtro}`);
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // Asegurar que data es un array
      setPreguntas(Array.isArray(data) ? data : []);
      
    } catch (error) {
      console.error("Error cargando preguntas:", error);
      setError(error.message);
      setPreguntas([]); // Array vacío en caso de error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    cargarPreguntas();
  };

  const marcarResuelta = async (id) => {
    try {
      const res = await fetch('/api/unanswered', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, resuelta: true })
      });
      
      if (!res.ok) {
        throw new Error('Error al actualizar');
      }
      
      // Actualizar la lista
      cargarPreguntas();
      
    } catch (error) {
      console.error("Error actualizando:", error);
      alert("No se pudo actualizar la pregunta");
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "Desconocida";
    
    try {
      const d = fecha.toDate ? fecha.toDate() : new Date(fecha);
      return d.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando preguntas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900">Preguntas sin respuesta</h2>
            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
              {preguntas.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5 bg-white"
            >
              <option value="pendientes">Pendientes</option>
              <option value="todas">Todas</option>
              <option value="resueltas">Resueltas</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-100">
          <p className="text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Error: {error}
          </p>
          <button 
            onClick={handleRefresh}
            className="mt-2 text-xs text-red-600 underline"
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {preguntas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <p className="text-sm">¡No hay preguntas {filtro === 'pendientes' ? 'pendientes' : ''}!</p>
            {filtro === 'pendientes' && (
              <p className="text-xs text-gray-400 mt-1">
                Cuando alguien haga una pregunta sin respuesta, aparecerá aquí
              </p>
            )}
          </div>
        ) : (
          preguntas.map((pq) => (
            <div key={pq.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      pq.resuelta 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {pq.resuelta ? '✓ Resuelta' : '⏳ Pendiente'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {pq.veces_preguntada || 1} {pq.veces_preguntada === 1 ? 'vez' : 'veces'}
                    </span>
                    {pq.razon && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {pq.razon === 'sin_resultados' ? 'Sin resultados' : 
                         pq.razon === 'sin_documentos' ? 'Sin documentos' : pq.razon}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-900 font-medium wrap-break-word">{pq.pregunta_original}</p>
                  
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <div>Primera vez: {formatearFecha(pq.primera_vez)}</div>
                    <div>Última vez: {formatearFecha(pq.ultima_vez)}</div>
                  </div>
                </div>
                
                {!pq.resuelta && (
                  <button
                    onClick={() => marcarResuelta(pq.id)}
                    className="ml-4 px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors whitespace-nowrap shrink-0"
                  >
                    ✓ Marcar resuelta
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {preguntas.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          Mostrando {preguntas.length} preguntas
        </div>
      )}
    </div>
  );
}