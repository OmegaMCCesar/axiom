"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Sparkles, X, Clock } from "lucide-react";

export default function SearchBar({ 
  onSearch, 
  isSearching, 
  query, 
  setQuery,
  sugerencias = [],
  historial = []
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !isSearching) {
      onSearch(query);
      setShowSuggestions(false);
      setShowHistory(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    setShowHistory(false);
  };

  return (
    <div className="relative w-full" ref={suggestionsRef}>
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          className="block w-full pl-12 pr-24 py-4 text-lg border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-0 focus:border-blue-500 shadow-sm transition-all focus:shadow-md outline-none bg-white"
          placeholder="Ej. ¿Cuáles son las políticas de garantía?"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setShowHistory(false);
          }}
          onFocus={() => {
            if (historial.length > 0 && !query) {
              setShowHistory(true);
            }
          }}
          disabled={isSearching}
        />
        
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-20 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="absolute inset-y-2 right-2 inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 border border-transparent rounded-xl text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
        >
          {isSearching ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              <span className="hidden sm:inline">Buscando</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Consultar</span>
            </span>
          )}
        </button>
      </form>

      {/* Sugerencias en tiempo real */}
      {showSuggestions && sugerencias.length > 0 && query && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {sugerencias.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSuggestion(sug)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-gray-400" />
              <span>{sug}</span>
            </button>
          ))}
        </div>
      )}

      {/* Historial de búsquedas */}
      {showHistory && historial.length > 0 && !query && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-b">
            Búsquedas recientes
          </div>
          {historial.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSuggestion(item)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{item}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}