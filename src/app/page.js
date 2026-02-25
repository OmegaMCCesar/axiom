"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Database, Settings, ShieldCheck, Send, Loader2 } from "lucide-react";
import { consultarAxiom } from "./admin/actions/consultarAxiom";
import { registrarFeedback } from "./admin/actions/feedback";
import SearchBar from "@/components/SearchBar";
import ResultCard from "@/components/ResultCard";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const { role } = useAuth()
  
  // Nuevos estados para el modo conversacional
  const [conversacion, setConversacion] = useState([]); // Guarda el hilo actual
  const [followUpQuery, setFollowUpQuery] = useState(""); // Input del chat
  const chatEndRef = useRef(null); // Para hacer scroll automático

  // Cargar historial del localStorage al iniciar
  useEffect(() => {
    const saved = localStorage.getItem('axiom_history');
    if (saved) {
      setHistorial(JSON.parse(saved).slice(0, 10));
    }
  }, []);

  // Hacer scroll automático al final cuando hay nuevos mensajes
  useEffect(() => {
    if (conversacion.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversacion, isSearching]);

  // Búsqueda inicial
  const handleSearch = async (busquedaInicial = query) => {
    if (!busquedaInicial.trim() || isSearching) return;

    setIsSearching(true);
    // Iniciamos la conversación con la pregunta del usuario
    setConversacion([{ role: "user", content: busquedaInicial }]);

    try {
      const resultado = await consultarAxiom(busquedaInicial);
      
      // Añadimos la respuesta al hilo
      setConversacion(prev => [...prev, { role: "assistant", data: resultado }]);
      
      // Guardar en historial global
      const nuevoHistorial = [
        { query: busquedaInicial, timestamp: Date.now() },
        ...historial.filter(h => h.query !== busquedaInicial)
      ].slice(0, 10);
      
      setHistorial(nuevoHistorial);
      localStorage.setItem('axiom_history', JSON.stringify(nuevoHistorial));
      
    } catch (error) {
      console.error("Error:", error);
      setConversacion(prev => [...prev, { 
        role: "assistant", 
        data: { respuesta: "Error de conexión. Intenta de nuevo.", fuente: 'error' } 
      }]);
    } finally {
      setIsSearching(false);
    }
  };

  // Continuar la conversación (Chat)
  const handleFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpQuery.trim() || isSearching) return;

    const nuevaPregunta = followUpQuery;
    setFollowUpQuery(""); // Limpiar input
    setIsSearching(true);

    // Añadir pregunta al hilo visualmente
    const mensajesPrevios = [...conversacion, { role: "user", content: nuevaPregunta }];
    setConversacion(mensajesPrevios);

    try {
      // AQUÍ: Idealmente consultarAxiom debería aceptar el historial (mensajesPrevios)
      // para que el LLM tenga el contexto de la charla completa.
      const resultado = await consultarAxiom(nuevaPregunta, mensajesPrevios);
      
      setConversacion(prev => [...prev, { role: "assistant", data: resultado }]);
    } catch (error) {
      console.error("Error:", error);
      setConversacion(prev => [...prev, { 
        role: "assistant", 
        data: { respuesta: "Error de conexión. Intenta de nuevo.", fuente: 'error' } 
      }]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFeedback = async (tipo, indexMensaje) => {
    const mensajeAsistente = conversacion[indexMensaje];
    const mensajeUsuario = conversacion[indexMensaje - 1]; // La pregunta anterior
    
    if (!mensajeAsistente || !mensajeUsuario) return;
    
    await registrarFeedback({
      pregunta: mensajeUsuario.content,
      respuesta: typeof mensajeAsistente.data === 'string' ? mensajeAsistente.data : mensajeAsistente.data.respuesta,
      tipo,
      fuente: mensajeAsistente.data.fuente
    });
  };

  const handleSelectSugerencia = (sugerencia) => {
    if (conversacion.length === 0) {
      setQuery(sugerencia);
      setTimeout(() => handleSearch(sugerencia), 100);
    } else {
      setFollowUpQuery(sugerencia);
      // Opcional: Auto-enviar si se selecciona en modo chat
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="w-full p-6 flex justify-between items-center bg-white shadow-sm z-10 relative">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Database className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">
            AXIOM<span className="text-blue-600">_ENGINE</span>
          </span>
        </div>
        
        {role === 'super_admin' &&  <Link href="/admin" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <Settings className="w-4 h-4" />
          Administrar
        </Link>}
      </header>

      <main className="flex-1 flex flex-col items-center justify-start pt-16 px-4 sm:px-6 lg:px-8 pb-32">
        <div className="w-full max-w-4xl">
          
          {/* VISTA INICIAL: Si no hay conversación, mostramos el buscador principal */}
          {conversacion.length === 0 ? (
            <>
              <div className="text-center space-y-4 mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Veracidad Corporativa Garantizada</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                  ¿Qué necesitas consultar hoy?
                </h1>
              </div>

              <SearchBar
                onSearch={() => handleSearch(query)}
                isSearching={isSearching}
                query={query}
                setQuery={setQuery}
                sugerencias={sugerencias}
                historial={historial.map(h => h.query)}
              />

              {!isSearching && (
                <div className="mt-12 text-center">
                  <p className="text-sm font-medium text-gray-500 mb-3">Consultas frecuentes</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {["Proceso de Q&A", "Políticas de Garantía", "Manual de Mantenimiento"].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setQuery(suggestion);
                          setTimeout(() => handleSearch(suggestion), 100);
                        }}
                        className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 bg-white hover:border-blue-300 hover:text-blue-700 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* VISTA CONVERSACIONAL: Hilo de chat y resultados */
            <div className="space-y-6">
              {conversacion.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'user' ? (
                    <div className="bg-blue-600 text-white px-6 py-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
                      <p className="text-lg font-medium">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="w-full">
                      <ResultCard
                        respuesta={msg.data}
                        query={conversacion[index - 1]?.content || query} // Toma la pregunta anterior
                        onFeedback={(tipo) => handleFeedback(tipo, index)}
                        sugerencias={msg.data.sugerencias || []}
                        onSelectSugerencia={handleSelectSugerencia}
                      />
                    </div>
                  )}
                </div>
              ))}
              
              {isSearching && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-gray-500 font-medium text-sm">Axiom está analizando los documentos...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* INPUT FLOTANTE TIPO CHAT (Solo visible si ya inició la conversación) */}
      {conversacion.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleFollowUp} className="relative flex items-center">
              <input
                type="text"
                value={followUpQuery}
                onChange={(e) => setFollowUpQuery(e.target.value)}
                placeholder="Haz una pregunta de seguimiento sobre esta información..."
                className="w-full pl-6 pr-14 py-4 rounded-full border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner text-gray-800"
                disabled={isSearching}
              />
              <button
                type="submit"
                disabled={!followUpQuery.trim() || isSearching}
                className="absolute right-2 p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}