import { onObjectFinalized } from "firebase-functions/v2/storage";
import admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const XLSX = require("xlsx");

admin.initializeApp();
const db = admin.firestore();

export const procesarDocumentoQA = onObjectFinalized(
  {
    memory: "2GiB",
    timeoutSeconds: 540,
  },
  async (event) => {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const fileBucket = event.data.bucket;
    const filePath = event.data.name;
    const contentType = event.data.contentType;

    console.log(`Procesando archivo: ${filePath}`);

    const bucket = admin.storage().bucket(fileBucket);
    const [fileBuffer] = await bucket.file(filePath).download();

    // Crear documento en Firestore
    const docRef = await db.collection("knowledge_docs").add({
      title: filePath.split("/").pop(),
      storageUrl: `gs://${fileBucket}/${filePath}`,
      uploadDate: admin.firestore.FieldValue.serverTimestamp(),
      status: "procesando",
      contentType: contentType || "unknown",
    });

    try {
      // Extraer texto según tipo
      const textoCompleto = await extraerTexto(fileBuffer, contentType);

      if (!textoCompleto || textoCompleto.trim().length < 20) {
        await docRef.update({ status: "sin_texto" });
        console.log("El documento no contiene texto utilizable.");
        return;
      }

      // Dividir texto
      const chunks = dividirTextoEnChunks(textoCompleto, 1000);
      console.log(`Se generaron ${chunks.length} chunks.`);

      let operaciones = 0;
      let batch = db.batch();

      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i].trim();

        if (!chunkText) continue;

        // Generar embedding
        const response = await ai.models.embedContent({
          model: "gemini-embedding-001",
          contents: chunkText,
        });

        const embedding = response.embeddings[0].values;

        const chunkRef = docRef.collection("chunks").doc();

        batch.set(chunkRef, {
          chunk_id: chunkRef.id,
          text: chunkText,
          embedding: embedding,
          orden: i,
        });

        operaciones++;

        // Firestore límite 500
        if (operaciones === 400) {
          await batch.commit();
          batch = db.batch();
          operaciones = 0;
        }
      }

      if (operaciones > 0) {
        await batch.commit();
      }

      await docRef.update({ status: "completado" });
      console.log("Documento procesado correctamente.");
    } catch (error) {
      console.error("Error procesando documento:", error);
      await docRef.update({
        status: "error_procesamiento",
        errorMessage: error.message,
      });
    }
  }
);

// ===========================
// 🔹 EXTRAER TEXTO UNIVERSAL
// ===========================

async function extraerTexto(fileBuffer, contentType) {
  if (!contentType) return null;

  // PDF
  if (contentType.includes("pdf")) {
    try {
      const pdfData = await pdfParse(fileBuffer);
      return pdfData.text;
    } catch (error) {
      console.error("PDF inválido o no soportado.");
      return null;
    }
  }

  // Word (.docx)
  if (contentType.includes("wordprocessingml")) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  }

  // Excel (.xlsx)
  if (contentType.includes("spreadsheetml")) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    let texto = "";

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      texto += XLSX.utils.sheet_to_csv(sheet);
    });

    return texto;
  }

  console.log("Formato no soportado:", contentType);
  return null;
}

// ===========================
// 🔹 DIVISIÓN DE TEXTO
// ===========================

function dividirTextoEnChunks(texto, tamanoMaximo) {
  const textoLimpio = texto.replace(/\n\s*\n/g, "\n\n").trim();
  const parrafos = textoLimpio.split("\n\n");

  let chunks = [];
  let chunkActual = "";

  for (const parrafo of parrafos) {
    if (chunkActual.length + parrafo.length > tamanoMaximo) {
      chunks.push(chunkActual.trim());
      chunkActual = parrafo;
    } else {
      chunkActual += "\n\n" + parrafo;
    }
  }

  if (chunkActual) {
    chunks.push(chunkActual.trim());
  }

  return chunks;
}
