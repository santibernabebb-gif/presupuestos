import { GoogleGenAI, Type } from "@google/genai";
import { BudgetData } from "../types";

const budgetSchema = {
  type: Type.OBJECT,
  properties: {
    client: { type: Type.STRING, description: "Nombre del cliente (extraído de cualquiera de las fotos)" },
    date: { type: Type.STRING, description: "Fecha (extraída de cualquiera de las fotos)" },
    lines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: "Descripción del trabajo" },
          units: { type: Type.NUMBER, description: "Cantidad numérica" },
          unitPrice: { type: Type.NUMBER, description: "Precio unitario" },
        },
        required: ["description"]
      }
    }
  },
  required: ["client", "date", "lines"]
};

export const extractBudgetData = async (base64Images: string[]): Promise<BudgetData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    Analiza estas ${base64Images.length} imágenes que corresponden a un mismo presupuesto.
    REQUISITOS:
    - Combina toda la información en un único JSON.
    - Extrae el cliente y la fecha (hoy si no hay).
    - Crea una lista de partidas unificada con descripción, unidades y precio de TODAS las páginas.
    - Si no hay unidades o precio, usa 0.
    - Evita duplicar líneas si aparecen en varias fotos por solapamiento.
    - RESPONDE SOLO CON EL JSON.
  `;

  try {
    const imageParts = base64Images.map(base64 => ({
      inlineData: { mimeType: "image/jpeg", data: base64.split(',')[1] }
    }));

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { text: prompt },
          ...imageParts
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: budgetSchema,
        temperature: 0.1
      }
    });

    if (!response || !response.text) {
      throw new Error("La IA no devolvió contenido.");
    }

    let cleanJson = response.text.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
    }

    const rawData = JSON.parse(cleanJson);
    
    let subtotal = 0;
    const processedLines = rawData.lines
      .filter((l: any) => l.description && l.description.trim() !== "")
      .map((line: any) => {
        const units = parseFloat(line.units) || 0;
        const unitPrice = parseFloat(line.unitPrice) || 0;
        const totalPrice = units * unitPrice;
        subtotal += totalPrice;
        return {
          description: line.description.toUpperCase(),
          units: units > 0 ? units : undefined,
          unitPrice: unitPrice > 0 ? unitPrice : undefined,
          totalPrice: totalPrice > 0 ? totalPrice : undefined
        };
      });

    const iva = subtotal * 0.21;
    const total = subtotal + iva;
    const budgetNumber = `LQ-${Date.now().toString().slice(-6)}`;

    return {
      budgetNumber,
      client: (rawData.client || "CLIENTE").toUpperCase(),
      date: rawData.date || new Date().toLocaleDateString('es-ES'),
      lines: processedLines,
      subtotal,
      iva,
      total
    };
  } catch (error: any) {
    console.error("DEBUG IA:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Error de formato: La IA no pudo combinar los datos correctamente. Reintenta con mejores fotos.");
    }
    throw new Error(error.message || "Error de conexión con la IA.");
  }
};
