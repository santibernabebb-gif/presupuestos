
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, BorderStyle, VerticalAlign } from 'docx';
import { BudgetData } from '../types';

export const generateDocx = async (data: BudgetData): Promise<Blob> => {
  const formatCurrency = (val: number) => `${val.toFixed(2)}€`;
  const borderStyle = { style: BorderStyle.SINGLE, size: 2, color: "000000" };

  const tableHeader = new TableRow({
    children: [
      new TableCell({ 
        shading: { fill: "1e293b" }, // Slate 800
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CONCEPTO / DESCRIPCION", bold: true, color: "FFFFFF", size: 18 })] })] 
      }),
      new TableCell({ 
        shading: { fill: "1e293b" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "UDS.", bold: true, color: "FFFFFF", size: 18 })] })] 
      }),
      new TableCell({ 
        shading: { fill: "1e293b" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "P. UNIT (€)", bold: true, color: "FFFFFF", size: 18 })] })] 
      }),
      new TableCell({ 
        shading: { fill: "334155" }, // Slate 700 para la columna total
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TOTAL (€)", bold: true, color: "FFFFFF", size: 18 })] })] 
      }),
    ],
  });

  const dataRows = data.lines.map(line => new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: line.description.toUpperCase(), bold: true, size: 20 })] })] }),
      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: line.units?.toString() || "", bold: true, size: 20 })] })] }),
      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: line.unitPrice ? formatCurrency(line.unitPrice) : "", bold: true, size: 20 })] })] }),
      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: line.totalPrice ? formatCurrency(line.totalPrice) : "", bold: true, size: 20 })] })] }),
    ],
  }));

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children: [
        // Branding Header
        new Paragraph({ children: [new TextRun({ text: "EDUARDO QUILIS LLORENS", bold: true, size: 32 })] }),
        new Paragraph({ children: [new TextRun({ text: "C/ Cervantes 41 • Onil • 03430 | quilislalo@gmail.com", size: 16 })] }),
        new Paragraph({ children: [new TextRun({ text: "Tel: 620-944-229 • NIF: 21667776-M", bold: true, size: 16 })] }),

        new Paragraph({ spacing: { before: 400 } }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "PRESUPUESTO", bold: true, size: 44, underline: {} })],
        }),

        new Paragraph({ spacing: { before: 400 } }),

        // Client info block
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: "f8fafc" },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "PARA EL CLIENTE:", size: 14, bold: true, color: "64748b" })] }),
                    new Paragraph({ children: [new TextRun({ text: data.client.toUpperCase(), bold: true, size: 28 })] })
                  ]
                }),
                new TableCell({
                  shading: { fill: "f8fafc" },
                  children: [
                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "FECHA:", size: 14, bold: true, color: "64748b" })] }),
                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: data.date, bold: true, size: 24 })] })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 400 } }),

        // Concept Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle,
            insideHorizontal: borderStyle, insideVertical: borderStyle,
          },
          rows: [tableHeader, ...dataRows],
        }),

        new Paragraph({ spacing: { before: 400 } }),

        // Totals Table
        new Table({
          alignment: AlignmentType.RIGHT,
          width: { size: 45, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ shading: { fill: "f8fafc" }, children: [new Paragraph({ children: [new TextRun({ text: "BASE IMPONIBLE", bold: true, size: 16 })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(data.subtotal), bold: true, size: 20 })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ shading: { fill: "f8fafc" }, children: [new Paragraph({ children: [new TextRun({ text: "I.V.A. (21%)", bold: true, size: 16 })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(data.iva), bold: true, size: 20 })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ shading: { fill: "0f172a" }, children: [new Paragraph({ children: [new TextRun({ text: "TOTAL NETO", bold: true, size: 18, color: "FFFFFF" })] })] }),
                new TableCell({ shading: { fill: "0f172a" }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(data.total), bold: true, size: 24, color: "FFFFFF" })] })] }),
              ]
            }),
          ]
        }),

        new Paragraph({ spacing: { before: 600 } }),

        // Terms
        new Paragraph({ children: [new TextRun({ text: "NOTAS Y CONDICIONES:", bold: true, size: 18, underline: {} })] }),
        new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "1. Cualquier imprevisto surgido durante la obra se facturará aparte.", size: 14, bold: true })] }),
        new Paragraph({ children: [new TextRun({ text: "2. Los tratamientos especiales de paramentos se presupuestarán por separado.", size: 14, bold: true })] }),
        new Paragraph({ children: [new TextRun({ text: "3. Forma de pago: 50% al inicio y 50% a la finalización.", size: 14, bold: true })] }),

        new Paragraph({
          spacing: { before: 1000 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "SantiSystems - Digital Budgeting Engine", size: 12, color: "cbd5e1" })],
        }),
      ],
    }],
  });

  return await Packer.toBlob(doc);
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
