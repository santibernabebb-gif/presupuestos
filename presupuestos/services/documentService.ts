
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, BorderStyle, HeadingLevel, VerticalAlign } from 'docx';
import { BudgetData } from '../types';

export const generateDocx = async (data: BudgetData): Promise<Blob> => {
  const formatCurrency = (val: number) => `${val.toFixed(2)}€`;

  const borderStyle = { style: BorderStyle.SINGLE, size: 2, color: "000000" };

  const tableHeader = new TableRow({
    children: [
      new TableCell({ 
        shading: { fill: "334155" }, // Slate 700
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "DESCRIPCION", bold: true, color: "FFFFFF", size: 16 })] })] 
      }),
      new TableCell({ 
        shading: { fill: "334155" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "UNIDADES", bold: true, color: "FFFFFF", size: 16 })] })] 
      }),
      new TableCell({ 
        shading: { fill: "334155" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Precio Unit. (€)", bold: true, color: "FFFFFF", size: 16 })] })] 
      }),
      new TableCell({ 
        shading: { fill: "334155" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Precio (€)", bold: true, color: "FFFFFF", size: 16 })] })] 
      }),
    ],
  });

  const dataRows = data.lines.map(line => new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: line.description, bold: true, size: 18 })] })] }),
      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: line.units?.toString() || "", bold: true, size: 18 })] })] }),
      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: line.unitPrice ? formatCurrency(line.unitPrice) : "", bold: true, size: 18 })] })] }),
      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: line.totalPrice ? formatCurrency(line.totalPrice) : "", bold: true, size: 18 })] })] }),
    ],
  }));

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 720, // ~1.27 cm
            right: 720,
            bottom: 720,
            left: 720,
          },
        },
      },
      children: [
        // Top Label
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "PRESUPUESTO", bold: true, size: 48, color: "E0F2FE", italics: true })],
        }),

        // Branding
        new Paragraph({ children: [new TextRun({ text: "Eduardo Quilis Llorens", bold: true, size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: "C/ Cervantes 41 • Onil • 03430 | 620-944-229 • NIF: 21667776-M", size: 14 })] }),

        new Paragraph({ spacing: { before: 200 } }),

        // Client & Date
        new Paragraph({ children: [new TextRun({ text: "Cliente: ", bold: true }), new TextRun({ text: data.client, bold: true, underline: {} })] }),
        new Paragraph({ children: [new TextRun({ text: "Fecha: ", bold: true }), new TextRun({ text: data.date, bold: true, underline: {} })] }),

        new Paragraph({ spacing: { before: 300 } }),

        // Main Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: borderStyle,
            bottom: borderStyle,
            left: borderStyle,
            right: borderStyle,
            insideHorizontal: borderStyle,
            insideVertical: borderStyle,
          },
          rows: [tableHeader, ...dataRows],
        }),

        new Paragraph({ spacing: { before: 300 } }),

        // Totals
        new Table({
          alignment: AlignmentType.RIGHT,
          width: { size: 45, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL €", bold: true, size: 16 })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(data.subtotal), bold: true, size: 16 })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "IVA 21%", bold: true, size: 16 })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(data.iva), bold: true, size: 16 })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ shading: { fill: "F1F5F9" }, children: [new Paragraph({ children: [new TextRun({ text: "TOTAL FINAL", bold: true, size: 18 })] })] }),
                new TableCell({ shading: { fill: "F1F5F9" }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(data.total), bold: true, size: 20 })] })] }),
              ]
            }),
          ]
        }),

        new Paragraph({ spacing: { before: 400 } }),

        // Terms
        new Paragraph({ children: [new TextRun({ text: "IMPORTANTE:", bold: true, italics: true, underline: {} })] }),
        new Paragraph({
          spacing: { before: 100 },
          children: [new TextRun({ text: "• Cualquier imprevisto o problema surgido durante la realización de la obra se facturará aparte.", size: 14, bold: true })],
        }),
        new Paragraph({
          children: [new TextRun({ text: "• Los cambios necesarios debido al estado de las superficies se presupuestarán y cobrarán por separado.", size: 14, bold: true })],
        }),
        new Paragraph({
          children: [new TextRun({ text: "• El 50% del valor del presupuesto se abonará antes de iniciar la obra.", size: 14, bold: true })],
        }),

        // Bottom Watermark representation
        new Paragraph({
          spacing: { before: 800 },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "PRESUPUESTO", bold: true, size: 36, color: "E0F2FE", italics: true }),
            new TextRun({ text: "\nSantiSystems", bold: true, size: 12, color: "D1D5DB" })
          ],
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
