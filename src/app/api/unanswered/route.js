import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filtro = searchParams.get('filtro') || 'pendientes';
    
    let query = db.collection("unanswered_questions");
    
    // APLICAR FILTROS SEGÚN EL CASO
    if (filtro === 'pendientes') {
      query = query.where("resuelta", "==", false);
    } else if (filtro === 'resueltas') {
      query = query.where("resuelta", "==", true);
    }
    
    // IMPORTANTE: Ordenar SOLO si hay documentos
    // Nota: Firebase requiere un índice compuesto para where + orderBy
    try {
      const snapshot = await query
        .orderBy("veces_preguntada", "desc")
        .limit(50)
        .get();
      
      const preguntas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convertir timestamps a fechas serializables
        primera_vez: doc.data().primera_vez?.toDate?.() || doc.data().primera_vez,
        ultima_vez: doc.data().ultima_vez?.toDate?.() || doc.data().ultima_vez,
        fecha_resuelta: doc.data().fecha_resuelta?.toDate?.() || doc.data().fecha_resuelta
      }));
      
      return NextResponse.json(preguntas);
      
    } catch (orderError) {
      // Si falla por índice, hacemos la consulta SIN orderBy
      console.log("⚠️ Error con orderBy, consultando sin ordenar:", orderError.message);
      
      const snapshot = await query.limit(50).get();
      
      const preguntas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        primera_vez: doc.data().primera_vez?.toDate?.() || doc.data().primera_vez,
        ultima_vez: doc.data().ultima_vez?.toDate?.() || doc.data().ultima_vez,
        fecha_resuelta: doc.data().fecha_resuelta?.toDate?.() || doc.data().fecha_resuelta
      }));
      
      // Ordenar manualmente en JavaScript
      preguntas.sort((a, b) => (b.veces_preguntada || 0) - (a.veces_preguntada || 0));
      
      return NextResponse.json(preguntas);
    }
    
  } catch (error) {
    console.error("🔥 Error en API unanswered:", error);
    
    // Si la colección no existe, devolver array vacío
    if (error.code === 5 || error.message?.includes("not found")) {
      return NextResponse.json([]);
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, resuelta } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }
    
    const docRef = db.collection("unanswered_questions").doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }
    
    await docRef.update({
      resuelta,
      fecha_resuelta: resuelta ? new Date() : null
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en PATCH:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}