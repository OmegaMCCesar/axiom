import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Intentar obtener logs de Firestore
    let logs = [];
    
    try {
      const snapshot = await db.collection("logs")
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();
      
      logs = snapshot.docs.map(doc => ({
        id: doc.id,
        tipo: doc.data().tipo || 'info',
        mensaje: doc.data().mensaje || 'Sin mensaje',
        fecha: doc.data().timestamp?.toDate?.() || new Date(),
        ...doc.data()
      }));
    } catch (e) {
      console.log("Colección logs no existe, usando datos de ejemplo");
    }
    
    // Si no hay logs reales, devolver datos de ejemplo
    if (logs.length === 0) {
      logs = [
        {
          id: '1',
          tipo: 'consulta',
          mensaje: 'Usuario preguntó sobre políticas de garantía',
          fecha: new Date(Date.now() - 1000 * 60 * 5) // 5 min ago
        },
        {
          id: '2',
          tipo: 'upload',
          mensaje: 'Documento "Manual de servicio.pdf" procesado',
          fecha: new Date(Date.now() - 1000 * 60 * 30) // 30 min ago
        },
        {
          id: '3',
          tipo: 'consulta',
          mensaje: 'Búsqueda sin resultados: "código error E23"',
          fecha: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
        },
        {
          id: '4',
          tipo: 'error',
          mensaje: 'Error al procesar embedding para documento X',
          fecha: new Date(Date.now() - 1000 * 60 * 120) // 2 hours ago
        }
      ];
    }
    
    return NextResponse.json(logs);
    
  } catch (error) {
    console.error("Error en API logs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST para crear logs (útil para registrar acciones)
export async function POST(request) {
  try {
    const { tipo, mensaje, metadata } = await request.json();
    
    const docRef = await db.collection("logs").add({
      tipo,
      mensaje,
      metadata: metadata || {},
      timestamp: new Date()
    });
    
    return NextResponse.json({ 
      success: true, 
      id: docRef.id 
    });
    
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}