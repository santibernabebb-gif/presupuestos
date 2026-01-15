
import { GoogleGenAI, Type } from "@google/genai";
import { BudgetData } from "../types";

const budgetSchema = {
  type: Type.OBJECT,
  properties: {
    client: { type: Type.STRING, description: "Nombre del cliente" },
    date: { type: Type.STRING, description: "Fecha (DD/MM/AAAA)" },
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

export const extractBudgetData = async (base64Image: string): Promise<BudgetData> => {
  // Inicialización fresca en cada llamada para evitar estados corruptos
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    Analiza este presupuesto manuscrito y devuelve un JSON puro.
    REQUISITOS:
    - Extrae el cliente y la fecha (hoy si no hay).
    - Crea una lista de partidas con descripción, unidades y precio.
    - Si no hay unidades o precio, usa 0.
    - No inventes filas vacías.
    - RESPONDE SOLO CON EL JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: budgetSchema,
        temperature: 0.1
      }
    });

    if (!response || !response.text) {
      throw new Error("La IA no devolvió contenido.");
    }

    // Limpieza de emergencia por si la IA devuelve markdown
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
      throw new Error("Error de formato: La IA no pudo generar un JSON válido. Reintenta con otra foto.");
    }
    throw new Error(error.message || "Error de conexión con la IA.");
  }
};
