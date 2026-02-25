"use server";

import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/firebaseAdmin";
import { normalizarTexto, calcularSimilitudTexto, generarHash } from "@/lib/utils";
import { registrarPreguntaSinRespuesta } from "./feedback";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Fórmula matemática para similitud de vectores
function similitudCoseno(vecA, vecB) {
  let productoPunto = 0, normaA = 0, normaB = 0;
  for (let i = 0; i < vecA.length; i++) {
    productoPunto += vecA[i] * vecB[i];
    normaA += vecA[i] * vecA[i];
    normaB += vecB[i] * vecB[i];
  }
  return productoPunto / (Math.sqrt(normaA) * Math.sqrt(normaB));
}

export async function consultarAxiom(preguntaUsuario, historial = []) {
 const startTime = Date.now();
  
  try {
    // --- NUEVO: ENRIQUECIMIENTO DE CONTEXTO ---
    // Extraemos todas las preguntas previas para que el buscador no tenga "amnesia"
    const preguntasAnteriores = historial
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join(" ");

    // Si hay historial, buscará ej: "boletin rt53 escarcha... dame un check list de esto"
    // Si no hay historial, buscará solo la pregunta inicial.
    const queryParaBusqueda = preguntasAnteriores.trim() !== "" ? preguntasAnteriores : preguntaUsuario;

    // PASO 1: Normalizar pregunta (usamos el texto enriquecido)
    const preguntaNormalizada = normalizarTexto(queryParaBusqueda);
    
    // Variable para saber si estamos en medio de una conversación
    const esSeguimiento = historial.length > 1;

    // PASO 2: Buscar en consultas frecuentes (CACHÉ)
    // OMITIMOS el caché si es una pregunta de seguimiento, porque las respuestas 
    // dentro de un chat dependen mucho del contexto y no deben traer resultados estáticos.
    if (!esSeguimiento) {
      const consultasFrecuentes = await db.collection("frequent_queries")
        .where("veces_consultada", ">=", 2)
        .where("confianza", ">=", 0.7)
        .orderBy("confianza", "desc")
        .limit(10)
        .get();
      
      let mejorMatch = null;
      let mejorSimilitud = 0;
      const UMBRAL_SIMILITUD_TEXTO = 0.75;
      
      for (const doc of consultasFrecuentes.docs) {
        const data = doc.data();
        const similitud = calcularSimilitudTexto(preguntaNormalizada, data.pregunta_normalizada);
        
        if (similitud > UMBRAL_SIMILITUD_TEXTO && similitud > mejorSimilitud) {
          mejorSimilitud = similitud;
          mejorMatch = { id: doc.id, ...data, similitud_exacta: similitud };
        }
      }
      
      if (mejorMatch && mejorMatch.confianza > 0.8) {
        await db.collection("frequent_queries").doc(mejorMatch.id).update({
          veces_consultada: admin.firestore.FieldValue.increment(1),
          ultima_consulta: new Date(),
          historial_fechas: admin.firestore.FieldValue.arrayUnion(new Date())
        });
        
        console.log(`🎯 Cache hit: "${preguntaUsuario}"`);
        
        return {
          respuesta: mejorMatch.respuesta,
          fuente: 'cache',
          confianza: mejorMatch.confianza,
          frecuencia: mejorMatch.veces_consultada,
          documentos_usados: mejorMatch.documentos_fuente || []
        };
      }
    }
    
    // PASO 3: Generar embedding y buscar en documentos
    // Aquí está la magia: vectorizamos la pregunta enriquecida con el contexto, NO la aislada.
    const embeddingRes = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: queryParaBusqueda, 
    });
    
    const queryVector = embeddingRes.embeddings[0].values;

    // PASO 4: Buscar en todos los chunks
    const docsSnapshot = await db.collection("knowledge_docs").get();
    const todosLosChunks = [];
    
    for (const doc of docsSnapshot.docs) {
      const chunksSnap = await db.collection(`knowledge_docs/${doc.id}/chunks`).get();
      
      chunksSnap.forEach((chunkDoc) => {
        const data = chunkDoc.data();
        if (data.embedding) {
          const similitud = similitudCoseno(queryVector, data.embedding);
          todosLosChunks.push({
            texto: data.text,
            similitud: similitud,
            documento: doc.data().title || "Documento sin título",
            docId: doc.id,
            chunkId: chunkDoc.id,
            orden: data.orden || 0
          });
        }
      });
    }

    // PASO 5: Si no hay chunks, registrar como pregunta sin respuesta
    if (todosLosChunks.length === 0) {
      console.log("📝 CASO 1: No hay documentos - registrando...");
      await registrarPreguntaSinRespuesta(preguntaUsuario, "sin_documentos");
      
      return {
        respuesta: "No hay documentos cargados en la base de conocimiento. Por favor, contacta al administrador para subir manuales o documentos.",
        fuente: 'error',
        sugerencias: ["Subir documentos", "Ver manuales disponibles"]
      };
    }

    // PASO 6: Ordenar por similitud y filtrar por umbral
    const UMBRAL_SIMILITUD_VECTOR = 0.5;
    const chunksRelevantes = todosLosChunks
      .filter(c => c.similitud > UMBRAL_SIMILITUD_VECTOR)
      .sort((a, b) => b.similitud - a.similitud);

    // PASO 7: Si no hay chunks relevantes, registrar como no encontrado
    if (chunksRelevantes.length === 0) {
        console.log("📝 CASO 2: No hay chunks relevantes - registrando...");
  console.log("Mejor similitud encontrada:", todosLosChunks[0]?.similitud);
      await registrarPreguntaSinRespuesta(preguntaUsuario, "sin_resultados");
      
      // Sugerencias basadas en chunks más cercanos
      const sugerencias = todosLosChunks
        .sort((a, b) => b.similitud - a.similitud)
        .slice(0, 3)
        .map(c => `Tema relacionado: ${c.texto.substring(0, 50)}...`);
      
      return {
        respuesta: "Lo siento, no encontré información específica sobre esto en los manuales. ¿Podrías reformular tu pregunta o consultar sobre un tema diferente?",
        fuente: 'error',
        sugerencias
      };
    }

    // PASO 8: Tomar mejores chunks (AUMENTADO A 20 para manuales técnicos)
  // Necesitamos más contexto para que no se corten los boletines largos
  const mejoresChunks = chunksRelevantes.slice(0, 20); 
  const contextoExtraido = mejoresChunks
    .map(c => `[Documento: ${c.documento}]\n${c.texto}`)
    .join("\n\n---\n\n");

  // Preparar el historial para que la IA entienda el contexto de la charla
  const historialTexto = historial.length > 0 
    ? historial.map(msg => `${msg.role === 'user' ? 'Usuario' : 'Axiom'}: ${msg.content || (msg.data && msg.data.respuesta) || ''}`).join('\n')
    : "Esta es la primera pregunta de la sesión.";

// PASO 9: Generar respuesta con Gemini - VERSIÓN DIGERIBLE
  const prompt = `
  Eres Axiom Engine, el buscador inteligente corporativo experto en documentación técnica y de procesos internos administrativos de samsung.

  INSTRUCCIONES ESTRICTAS PARA EL FORMATO:
  1. Usa SOLAMENTE la información del CONTEXTO proporcionado.
  2. SINTETIZA SIN PERDER DATOS DUROS: Mantén TODOS los pasos del procedimiento, advertencias de seguridad, herramientas y valores técnicos (medidas en mm, temperaturas, voltajes, códigos), pero ELIMINA el texto redundante o explicaciones innecesarias.
  3. MODO ESCÁNER: Haz la información extremadamente fácil de digerir visualmente. Usa oraciones cortas y directas.
  4. Usa formato de checklist o viñetas (•) para los procedimientos.
  5. Resalta en **negritas** únicamente lo vital: valores numéricos, nombres exactos de piezas y códigos de error.
  6. Agrupa la información bajo subtítulos claros y cortos.
  7. Si la información del contexto está incompleta, entrega lo que tengas y al final sugiere temas relacionados.

  HISTORIAL DE LA CONVERSACIÓN:
  ${historialTexto}

  CONTEXTO OFICIAL EXTRAÍDO:
  ${contextoExtraido}

  PREGUNTA DEL USUARIO:
  ${preguntaUsuario}

  RESPUESTA TÉCNICA, CONCISA Y AL GRANO:
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      temperature: 0.2, // Un poco más de libertad para que redacte fluido sin inventar
      maxOutputTokens: 3000, // Aumentado para permitir respuestas largas y detalladas
    }
  });

  const respuestaGenerada = response.text;
    
    // PASO 10: Guardar en caché para futuras consultas
    const preguntaHash = generarHash(preguntaNormalizada);
    
    await db.collection("query_cache").add({
      pregunta_hash: preguntaHash,
      pregunta_original: preguntaUsuario,
      pregunta_normalizada: preguntaNormalizada,
      respuesta: respuestaGenerada,
      timestamp: new Date(),
      expira: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      documentos_usados: mejoresChunks.map(c => c.documento),
      tiempo_procesamiento: Date.now() - startTime
    });

    // PASO 11: Registrar métricas
    await db.collection("metrics").add({
      tipo: "consulta_generada",
      pregunta: preguntaUsuario,
      chunks_encontrados: chunksRelevantes.length,
      tiempo_respuesta: Date.now() - startTime,
      timestamp: new Date()
    });

    return {
      respuesta: respuestaGenerada,
      fuente: 'generado',
      documentos_usados: [...new Set(mejoresChunks.map(c => c.documento))]
    };

  } catch (error) {
    console.error("🔥 Error en Axiom:", error);
    
    // Registrar error
    await db.collection("errors").add({
      error: error.message,
      pregunta: preguntaUsuario,
      timestamp: new Date()
    });
    
    return {
      respuesta: "Ocurrió un error interno. Por favor intenta de nuevo en unos momentos.",
      fuente: 'error',
      sugerencias: ["Intentar de nuevo", "Contactar soporte"]
    };
  }
}