import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    const snapshot = await db.collection("knowledge_docs")
      .orderBy("uploadDate", "desc")
      .limit(limit)
      .get();
    
    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      url: doc.data().storageUrl,
      date: doc.data().uploadDate?.toDate?.()?.toLocaleDateString() || 'Reciente',
      chunks: doc.data().chunks || 0,
      status: doc.data().status
    }));
    
    return NextResponse.json(docs);
    
  } catch (error) {
    console.error("Error obteniendo documentos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }
    
    await db.collection("knowledge_docs").doc(id).delete();
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error eliminando documento:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}