import { bucket, db, admin } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        console.log(`Procesando archivo: ${file.name}`);
        
        // Convertir File a Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Generar nombre único
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        
        // Verificar que bucket existe
        if (!bucket) {
          throw new Error("Storage bucket no está inicializado");
        }
        
        // Referencia al archivo en Storage
        const fileRef = bucket.file(`documents/${fileName}`);
        
        console.log(`Subiendo a: documents/${fileName}`);
        
        // Subir archivo
        await fileRef.save(buffer, {
          metadata: {
            contentType: file.type,
            metadata: {
              originalName: file.name,
              uploadTime: new Date().toISOString()
            }
          }
        });

        // Hacer público (opcional - quitar si no quieres archivos públicos)
        await fileRef.makePublic();
        
        // Obtener URL pública
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/documents/${fileName}`;
        
        console.log(`Archivo subido: ${publicUrl}`);

        // Guardar referencia en Firestore
        const docRef = await db.collection("knowledge_docs").add({
          title: file.name,
          fileName: fileName,
          storageUrl: publicUrl,
          contentType: file.type,
          uploadDate: admin.firestore.FieldValue.serverTimestamp(),
          status: "pendiente", // Cambiar a "procesando" si tienes Cloud Function
          size: file.size,
          userId: "admin" // Opcional: agregar usuario
        });

        results.push({
          id: docRef.id,
          name: file.name,
          url: publicUrl,
          status: "subido"
        });

        // Intentar crear log (opcional - no detener si falla)
        try {
          await db.collection("logs").add({
            tipo: "upload",
            mensaje: `Documento subido: ${file.name}`,
            timestamp: new Date(),
            metadata: {
              id: docRef.id,
              tamaño: file.size
            }
          });
        } catch (logError) {
          console.log("Error creando log (no crítico):", logError.message);
        }

      } catch (fileError) {
        console.error(`Error con archivo ${file.name}:`, fileError);
        errors.push({
          name: file.name,
          error: fileError.message
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      files: results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Error uploading:", error);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}