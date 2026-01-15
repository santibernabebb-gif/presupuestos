
import { GoogleGenAI, Type } from "@google/genai";
import { BudgetData } from "../types";

const budgetSchema = {
  type: Type.OBJECT,
  properties: {
    client: { 
      type: Type.STRING, 
      description: "Nombre del cliente extraído de la foto" 
    },
    date: { 
      type: Type.STRING, 
      description: "Fecha del presupuesto (DD/MM/AAAA)" 
    },
    lines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { 
            type: Type.STRING,
            description: "Descripción de la partida de trabajo"
          },
          units: { 
            type: Type.NUMBER,
            description: "Cantidad o unidades (si existen)"
          },
          unitPrice: { 
            type: Type.NUMBER,
            description: "Precio por unidad (si existe)"
          },
        },
        required: ["description"]
      }
    }
  },
  required: ["client", "date", "lines"]
};

export const extractBudgetData = async (base64Image: string): Promise<BudgetData> => {
  // Inicializamos dentro de la función para asegurar que toma la API_KEY más reciente
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Usamos Gemini 3 Pro Preview para máxima precisión en caligrafía difícil
  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    Eres un experto administrativo especializado en leer presupuestos manuscritos de pintores.
    Analiza la imagen adjunta y extrae la información para rellenar la plantilla oficial de Lalo Quilis.
    
    INSTRUCCIONES CRÍTICAS:
    1. CLIENTE Y FECHA: Identifica claramente el nombre del cliente. Si no ves fecha, usa la de hoy: ${new Date().toLocaleDateString('es-ES')}.
    2. PARTIDAS: Extrae cada concepto de trabajo. Si una línea describe un trabajo pero no tiene precio, déjala con unidades 0 y precio 0.
    3. CORRECCIÓN: Corrige términos técnicos de pintura si están mal escritos (ej: 'estucado', 'alisado', 'imprimación').
    4. ORDEN SAGRADO:
       - Primero las líneas que son SOLO descripción (sin precios).
       - Al final las líneas que TIENEN unidades y precios calculables.
    5. No incluyas comentarios personales ni avisos sobre la legibilidad.
    
    Responde estrictamente en formato JSON siguiendo el esquema proporcionado.
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
        // Activamos el pensamiento para que la IA razone sobre la escritura difícil antes de responder
        thinkingConfig: { thinkingBudget: 4000 } 
      }
    });

    if (!response.text) {
      throw new Error("La IA devolvió una respuesta vacía.");
    }

    const rawData = JSON.parse(response.text);
    console.log("Datos extraídos por IA:", rawData);
    
    // Ordenar: items sin precio arriba, con precio abajo
    const sortedLines = [...rawData.lines].sort((a, b) => {
      const aHasPrice = (a.unitPrice && a.unitPrice > 0);
      const bHasPrice = (b.unitPrice && b.unitPrice > 0);
      if (!aHasPrice && bHasPrice) return -1;
      if (aHasPrice && !bHasPrice) return 1;
      return 0;
    });

    // Cálculos de totales
    let subtotal = 0;
    const processedLines = sortedLines.map((line: any) => {
      const units = Number(line.units) || 0;
      const unitPrice = Number(line.unitPrice) || 0;
      const totalPrice = units * unitPrice;
      subtotal += totalPrice;
      return {
        description: line.description || "Sin descripción",
        units: units > 0 ? units : undefined,
        unitPrice: unitPrice > 0 ? unitPrice : undefined,
        totalPrice: totalPrice > 0 ? totalPrice : undefined
      };
    });

    const iva = subtotal * 0.21;
    const total = subtotal + iva;
    const budgetNumber = `LALO-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    return {
      budgetNumber,
      client: rawData.client || "Cliente no detectado",
      date: rawData.date || new Date().toLocaleDateString('es-ES'),
      lines: processedLines,
      subtotal,
      iva,
      total
    };
  } catch (error) {
    console.error("Error detallado en Gemini Service:", error);
    throw error;
  }
};
