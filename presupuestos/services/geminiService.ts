
import { GoogleGenAI, Type } from "@google/genai";
import { BudgetData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const budgetSchema = {
  type: Type.OBJECT,
  properties: {
    client: { type: Type.STRING, description: "Nombre del cliente" },
    date: { type: Type.STRING, description: "Fecha del presupuesto (formato DD/MM/AAAA)" },
    lines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          units: { type: Type.NUMBER },
          unitPrice: { type: Type.NUMBER },
        },
        required: ["description"]
      }
    },
    notes: { type: Type.STRING, description: "Notas sobre datos ilegibles o discrepancias" }
  },
  required: ["client", "date", "lines"]
};

export const extractBudgetData = async (base64Image: string): Promise<BudgetData> => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    Analiza esta imagen de un presupuesto manuscrito. 
    Tu tarea es extraer la información para rellenar una PLANTILLA SAGRADA.
    
    REGLAS DE EXTRACCIÓN:
    1. Lee el Cliente y la Fecha. Si no hay fecha, usa la de hoy: ${new Date().toLocaleDateString('es-ES')}.
    2. Extrae cada partida de trabajo (Descripción, Unidades, Precio Unitario).
    3. Si una línea no tiene números, deja unidades y precio unitario vacíos.
    4. Si algo es ilegible, deja el espacio en blanco y añade una nota al final: "*Hay datos ilegibles en la foto en la línea X*".
    5. Corrige faltas de ortografía (ej. 'guita' -> 'gota').
    6. REGLA DE ORDEN: Las partidas que NO tengan números deben aparecer PRIMERO. Las que TENGAN números van ABAJO.
    
    Devuelve solo el JSON.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(',')[1]
          }
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: budgetSchema
    }
  });

  const rawData = JSON.parse(response.text || '{}');
  
  // Sacred Rule: items without numbers first, items with numbers last
  const sortedLines = [...rawData.lines].sort((a, b) => {
    const aHasNumbers = (a.units != null && a.units > 0) || (a.unitPrice != null && a.unitPrice > 0);
    const bHasNumbers = (b.units != null && b.units > 0) || (b.unitPrice != null && b.unitPrice > 0);
    if (!aHasNumbers && bHasNumbers) return -1;
    if (aHasNumbers && !bHasNumbers) return 1;
    return 0;
  });

  // Sacred Calculations
  let subtotal = 0;
  const processedLines = sortedLines.map((line: any) => {
    const units = line.units || 0;
    const unitPrice = line.unitPrice || 0;
    const totalPrice = units * unitPrice;
    subtotal += totalPrice;
    return { ...line, totalPrice };
  });

  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  const budgetNumber = `SANTI-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  return {
    budgetNumber,
    client: rawData.client,
    date: rawData.date,
    lines: processedLines,
    subtotal,
    iva,
    total,
    notes: rawData.notes
  };
};
