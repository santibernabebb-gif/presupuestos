
import { GoogleGenAI, Type } from "@google/genai";
import { BudgetData } from "../types";

const budgetSchema = {
  type: Type.OBJECT,
  properties: {
    client: { 
      type: Type.STRING, 
      description: "Nombre completo del cliente" 
    },
    date: { 
      type: Type.STRING, 
      description: "Fecha detectada o fecha actual (DD/MM/AAAA)" 
    },
    lines: {
      type: Type.ARRAY,
      description: "Lista de partidas del presupuesto. No incluir líneas vacías.",
      items: {
        type: Type.OBJECT,
        properties: {
          description: { 
            type: Type.STRING,
            description: "Descripción detallada del trabajo"
          },
          units: { 
            type: Type.NUMBER,
            description: "Cantidad numérica. Omitir o poner 0 si no existe."
          },
          unitPrice: { 
            type: Type.NUMBER,
            description: "Precio unitario. Omitir o poner 0 si no existe."
          },
        },
        required: ["description"]
      }
    }
  },
  required: ["client", "date", "lines"]
};

export const extractBudgetData = async (base64Image: string): Promise<BudgetData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Usamos Gemini 3 Flash para una respuesta más rápida y estable en OCR
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    Analiza esta foto de un presupuesto manuscrito.
    Extrae los datos para un documento oficial.
    
    REGLAS ESTRICTAS:
    1. NO INVENTES LÍNEAS: Solo extrae lo que esté escrito. Si una línea está vacía en el papel, ignórala.
    2. DINAMISMO: El número de líneas debe coincidir exactamente con los conceptos de trabajo detectados.
    3. CLIENTE: Busca el nombre tras 'Sr/Sra', 'Cliente' o en la parte superior.
    4. PRECIOS: Si ves un total al final de una línea, pero no el precio unitario, asume unidades 1 y ese precio como unitario.
    
    Responde ÚNICAMENTE con el objeto JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1]
            }
          }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: budgetSchema,
        temperature: 0.1 // Mayor precisión, menos creatividad
      }
    });

    let textResponse = response.text || "";
    
    // Limpiar posibles etiquetas de markdown si la IA las incluye a pesar del responseMimeType
    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

    const rawData = JSON.parse(textResponse);
    
    // Cálculos y normalización
    let subtotal = 0;
    const processedLines = rawData.lines
      .filter((l: any) => l.description && l.description.trim().length > 0) // Doble check de líneas vacías
      .map((line: any) => {
        const units = Number(line.units) || 0;
        const unitPrice = Number(line.unitPrice) || 0;
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
    const budgetNumber = `LQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    return {
      budgetNumber,
      client: (rawData.client || "CLIENTE NO DETECTADO").toUpperCase(),
      date: rawData.date || new Date().toLocaleDateString('es-ES'),
      lines: processedLines,
      subtotal,
      iva,
      total
    };
  } catch (error) {
    console.error("Error crítico en extracción IA:", error);
    throw new Error("No se pudo procesar la imagen. Asegúrate de que el texto sea legible y haya buena luz.");
  }
};
