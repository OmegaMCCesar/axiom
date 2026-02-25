"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState([]);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setError(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Error al subir');
      
      setUploaded(data.files || []);
      setFiles([]);
      
      // Limpiar input
      document.getElementById('file-upload').value = '';
      
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Subir Documentos</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Área de subida */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Subir documentos</h2>
            <p className="text-sm text-gray-500 mt-1">
              PDF, Word o Excel - Máximo 50MB por archivo
            </p>
          </div>

          {/* Input file */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Seleccionar archivos
            </label>
            <p className="text-xs text-gray-400 mt-2">
              o arrastra y suelta aquí
            </p>
          </div>

          {/* Lista de archivos seleccionados */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Archivos seleccionados ({files.length})
              </h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Subir {files.length} archivo(s)
                  </>
                )}
              </button>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Archivos subidos recientemente */}
          {uploaded.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Subidos correctamente
              </h3>
              <div className="space-y-2">
                {uploaded.map((file, index) => (
                  <div key={index} className="bg-green-50 p-3 rounded-lg flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instrucciones */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
          <h3 className="text-sm font-medium text-blue-800 mb-2">📌 Formatos soportados:</h3>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>PDF - Documentos, manuales, guías</li>
            <li>Word (.docx) - Documentos de texto</li>
            <li>Excel (.xlsx) - Bases de datos, tablas</li>
            <li>TXT - Texto plano</li>
          </ul>
        </div>
      </main>
    </div>
  );
}