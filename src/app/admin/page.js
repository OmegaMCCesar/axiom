"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Database, TrendingUp, AlertCircle, 
  CheckCircle, Upload, FileText, Download, Clock,
  RefreshCw, Eye, Trash2 
} from "lucide-react";
import UnansweredQuestions from "@/components/UnansweredQuestions";

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total_docs: 0,
    total_chunks: 0,
    total_queries: 0,
    feedback_positivo: 0,
    feedback_negativo: 0
  });
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarStats();
    cargarDocumentosRecientes();
  }, []);

  const cargarStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error cargando stats:", error);
    }
  };

  const cargarDocumentosRecientes = async () => {
    try {
      const res = await fetch('/api/documents?limit=5');
      const data = await res.json();
      setRecentDocs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando documentos:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([cargarStats(), cargarDocumentosRecientes()]);
  };

  const handleDeleteDoc = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;
    
    try {
      const res = await fetch(`/api/documents?id=${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        cargarDocumentosRecientes();
        cargarStats();
      }
    } catch (error) {
      console.error("Error eliminando:", error);
    }
  };

  const handleExport = () => {
    // Generar CSV con preguntas sin respuesta
    const csvContent = "data:text/csv;charset=utf-8,Pregunta,Veces,Fecha\n" + 
      recentDocs.map(d => `${d.title},${d.chunks || 0},${new Date().toLocaleDateString()}`).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_axiom.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleViewLogs = () => {
    router.push('/admin/logs');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Actualizar"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <Link
                href="/admin/upload"
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Subir documento
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Documentos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_docs}</p>
              </div>
              <Database className="w-8 h-8 text-blue-500 opacity-75" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Fragmentos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_chunks}</p>
              </div>
              <FileText className="w-8 h-8 text-green-500 opacity-75" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Consultas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_queries}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500 opacity-75" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Feedback 👍</p>
                <p className="text-2xl font-bold text-green-600">{stats.feedback_positivo}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-75" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Feedback 👎</p>
                <p className="text-2xl font-bold text-red-600">{stats.feedback_negativo}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500 opacity-75" />
            </div>
          </div>
        </div>

        {/* Dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Documentos recientes */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Documentos recientes
                </h2>
              </div>
              
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : recentDocs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm">No hay documentos</p>
                    <Link href="/admin/upload" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
                      Subir primero
                    </Link>
                  </div>
                ) : (
                  recentDocs.map((doc) => (
                    <div key={doc.id} className="p-4 hover:bg-gray-50 group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span>{doc.chunks || 0} fragmentos</span>
                            <span>•</span>
                            <span>{doc.date || 'Reciente'}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => window.open(doc.url, '_blank')}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Ver documento"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha - Preguntas sin respuesta */}
          <div className="lg:col-span-2">
            <UnansweredQuestions />
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleExport}
            className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
          >
            <Download className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mb-3" />
            <p className="font-medium text-gray-900">Exportar reporte</p>
            <p className="text-sm text-gray-500">CSV con métricas y preguntas</p>
          </button>
          
          <button 
            onClick={handleViewLogs}
            className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all text-left group"
          >
            <Clock className="w-8 h-8 text-gray-400 group-hover:text-green-600 mb-3" />
            <p className="font-medium text-gray-900">Ver logs</p>
            <p className="text-sm text-gray-500">Actividad del sistema</p>
          </button>
          
          <Link 
            href="/admin/upload"
            className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left group"
          >
            <Upload className="w-8 h-8 text-gray-400 group-hover:text-purple-600 mb-3" />
            <p className="font-medium text-gray-900">Subir documentos</p>
            <p className="text-sm text-gray-500">PDF, Word, Excel</p>
          </Link>
        </div>
      </main>
    </div>
  );
}