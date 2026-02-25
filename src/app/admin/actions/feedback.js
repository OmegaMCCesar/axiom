"use server";

import { db } from "@/lib/firebaseAdmin";
import { normalizarTexto, generarHash } from "@/lib/utils";

/**
 * Registra feedback de usuario
 */
export async function registrarFeedback({ pregunta, respuesta, tipo, fuente = 'generado' }) {
  try {
    const preguntaNormalizada = normalizarTexto(pregunta);
    
    // Buscar si ya existe en frecuentes
    const snapshot = await db.collection("frequent_queries")
      .where("pregunta_normalizada", "==", preguntaNormalizada)
      .limit(1)
      .get();
    
    const feedbackData = {
      pregunta,
      pregunta_normalizada: preguntaNormalizada,
      respuesta,
      tipo,
      fuente,
      timestamp: new Date()
    };
    
    if (!snapshot.empty) {
      // Actualizar existente
      const doc = snapshot.docs[0];
      const data = doc.data();
      
      const nuevosPositivos = data.feedback_positivo + (tipo === 'positivo' ? 1 : 0);
      const nuevosNegativos = data.feedback_negativo + (tipo === 'negativo' ? 1 : 0);
      const total = nuevosPositivos + nuevosNegativos;
      
      await doc.ref.update({
        feedback_positivo: nuevosPositivos,
        feedback_negativo: nuevosNegativos,
        confianza: nuevosPositivos / total,
        ultimo_feedback: new Date(),
        historial_feedback: admin.firestore.FieldValue.arrayUnion(feedbackData)
      });
      
    } else if (tipo === 'positivo') {
      // Solo crear nueva entrada si es feedback positivo
      await db.collection("frequent_queries").add({
        pregunta_normalizada: preguntaNormalizada,
        pregunta_original: pregunta,
        respuesta: respuesta,
        veces_consultada: 0,
        feedback_positivo: 1,
        feedback_negativo: 0,
        confianza: 1.0,
        primera_consulta: new Date(),
        ultima_consulta: new Date(),
        documentos_fuente: [],
        historial_feedback: [feedbackData]
      });
    }
    
    // Registrar evento individual
    await db.collection("feedback_events").add(feedbackData);
    
    return { success: true };
    
  } catch (error) {
    console.error("Error registrando feedback:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Registra preguntas que no tuvieron respuesta
 */
export async function registrarPreguntaSinRespuesta(pregunta, razon) {

     console.log("🎯 Entrando a registrarPreguntaSinRespuesta", { pregunta, razon });
  try {
    const preguntaNormalizada = normalizarTexto(pregunta);
    const preguntaHash = generarHash(preguntaNormalizada);

      console.log("Hash generado:", preguntaHash);
    console.log("Texto normalizado:", preguntaNormalizada);
    
    // Verificar si ya existe
    const existente = await db.collection("unanswered_questions")
      .where("pregunta_hash", "==", preguntaHash)
      .get();

          console.log("Documentos existentes encontrados:", existente.size);
    
    if (!existente.empty) {
              console.log("Actualizando documento existente");
      // Incrementar contador
      await existente.docs[0].ref.update({
        veces_preguntada: admin.firestore.FieldValue.increment(1),
        ultima_vez: new Date(),
        razones: admin.firestore.FieldValue.arrayUnion(razon)
      });
          console.log("Documento actualizado OK");
    } else {
         console.log("Creando nuevo documento");
      // Crear nueva
      await db.collection("unanswered_questions").add({
        pregunta_hash: preguntaHash,
        pregunta_original: pregunta,
        pregunta_normalizada: preguntaNormalizada,
        veces_preguntada: 1,
        primera_vez: new Date(),
        ultima_vez: new Date(),
        razon: razon,
        resuelta: false
      });
      console.log("Nuevo documento creado con ID:", newDoc.id);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error("Error registrando pregunta sin respuesta:", error);
    return { success: false };
  }
}

/**
 * Marca una pregunta como resuelta (cuando se sube documentación)
 */
export async function marcarPreguntaResuelta(preguntaId) {
  try {
    await db.collection("unanswered_questions").doc(preguntaId).update({
      resuelta: true,
      fecha_resuelta: new Date()
    });
    
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

/**
 * Obtiene preguntas sin respuesta para el admin
 */
export async function obtenerPreguntasSinRespuesta(limite = 50) {
  try {
    const snapshot = await db.collection("unanswered_questions")
      .where("resuelta", "==", false)
      .orderBy("veces_preguntada", "desc")
      .limit(limite)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error obteniendo preguntas:", error);
    return [];
  }
}