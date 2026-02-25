"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, AlertCircle, CheckCircle, Search, Upload, RefreshCw } from "lucide-react";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('todos');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarLogs();
  }, []);

  const cargarLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/logs');
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
      
    } catch (error) {
      console.error("Error cargando logs:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    cargarLogs();
  };

  const getIcon = (tipo) => {
    switch(tipo) {
      case 'consulta':
        return <Search className="w-4 h-4 text-blue-500" />;
      case 'upload':
        return <Upload className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getColor = (tipo) => {
    switch(tipo) {
      case 'consulta': return 'bg-blue-50 text-blue-700';
      case 'upload': return 'bg-green-50 text-green-700';
      case 'error': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const filteredLogs = filter === 'todos' 
    ? logs 
    : logs.filter(log => log.tipo === filter);

  const formatDate = (fecha) => {
    if (!fecha) return 'Fecha desconocida';
    
    try {
      const date = new Date(fecha);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Hace un momento';
      if (diffMins < 60) return `Hace ${diffMins} minutos`;
      if (diffHours < 24) return `Hace ${diffHours} horas`;
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays} días`;
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Logs del Sistema</h1>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Filtros y estadísticas */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('todos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'todos' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('consulta')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                filter === 'consulta' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Search className="w-4 h-4" />
              Consultas
            </button>
            <button
              onClick={() => setFilter('upload')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                filter === 'upload' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Upload className="w-4 h-4" />
              Subidas
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                filter === 'error' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              Errores
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            {filteredLogs.length} eventos
          </div>
        </div>

        {/* Lista de logs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 font-medium">Error al cargar logs</p>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Reintentar
              </button>
            </div>
          ) : loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-500">Cargando logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hay logs para mostrar</p>
              <p className="text-sm text-gray-400 mt-1">
                {filter !== 'todos' ? 'Prueba con otro filtro' : 'Los logs aparecerán cuando haya actividad'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredLogs.map((log, idx) => (
                <div key={log.id || idx} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${getColor(log.tipo)}`}>
                      {getIcon(log.tipo)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getColor(log.tipo)}`}>
                          {log.tipo || 'info'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(log.fecha || log.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-900 wrap-break-word">
                        {log.mensaje || 'Sin descripción'}
                      </p>
                      
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            Ver detalles
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info adicional */}
        <div className="mt-4 text-xs text-gray-400 text-center">
          Mostrando {filteredLogs.length} de {logs.length} logs • 
          Actualizado {new Date().toLocaleTimeString()}
        </div>
      </main>
    </div>
  );
}