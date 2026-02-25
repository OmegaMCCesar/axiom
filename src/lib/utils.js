// Funciones de utilidad para toda la app

/**
 * Normaliza texto para búsquedas (quita acentos, mayúsculas, puntuación)
 */
export function normalizarTexto(texto) {
  if (!texto) return "";
  
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/[^\w\s]/g, " ") // quitar puntuación
    .replace(/\s+/g, " ") // espacios múltiples
    .trim();
}

/**
 * Genera un hash simple de un string
 */
export function generarHash(texto) {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    const char = texto.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Calcula similitud entre dos textos usando índice Jaccard
 */
export function calcularSimilitudTexto(a, b) {
  if (!a || !b) return 0;
  
  const palabrasA = new Set(a.split(" "));
  const palabrasB = new Set(b.split(" "));
  
  const interseccion = new Set([...palabrasA].filter(x => palabrasB.has(x)));
  const union = new Set([...palabrasA, ...palabrasB]);
  
  return interseccion.size / union.size;
}

/**
 * Trunca texto a cierta longitud
 */
export function truncarTexto(texto, longitud = 100) {
  if (!texto) return "";
  if (texto.length <= longitud) return texto;
  return texto.substring(0, longitud) + "...";
}

/**
 * Formatea fecha
 */
export function formatearFecha(timestamp) {
  if (!timestamp) return "Fecha desconocida";
  
  const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(fecha);
}