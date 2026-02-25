import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Obtener total de documentos
    const docsSnapshot = await db.collection("knowledge_docs").count().get();
    const total_docs = docsSnapshot.data().count;
    
    // Obtener total de chunks (requiere query más compleja)
    let total_chunks = 0;
    const docs = await db.collection("knowledge_docs").get();
    for (const doc of docs.docs) {
      const chunksSnap = await db.collection(`knowledge_docs/${doc.id}/chunks`).count().get();
      total_chunks += chunksSnap.data().count;
    }
    
    // Obtener total de consultas (métricas)
    const metricsSnap = await db.collection("metrics").count().get();
    const total_queries = metricsSnap.data().count;
    
    // Obtener feedback
    const feedbackSnap = await db.collection("feedback_events").get();
    let feedback_positivo = 0;
    let feedback_negativo = 0;
    
    feedbackSnap.docs.forEach(doc => {
      if (doc.data().tipo === 'positivo') feedback_positivo++;
      else feedback_negativo++;
    });
    
    return NextResponse.json({
      total_docs,
      total_chunks,
      total_queries,
      feedback_positivo,
      feedback_negativo
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}