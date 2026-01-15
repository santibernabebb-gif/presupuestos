
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, BorderStyle, HeadingLevel, VerticalAlign } from 'docx';
import { BudgetData } from '../types';

export const generateDocx = async (data: BudgetData): Promise<Blob> => {
  const formatCurrency = (val: number) => `${val.toFixed(2)}€`;

  const borderStyle = { style: BorderStyle.SINGLE, size: 2, color: "000000" };

  const tableHeader = new TableRow({
    children: [
      new TableCell({ 
        shading: { fill: "334155" }, // Slate 700
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "DESCRIPCION", bold: true, color: "FFFFFF", size: 18 })] })] 
      }),
      new TableCell({ 
        shading: { fill: "334155" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "UNIDADES", bold: true, color: "FFFFFF", size: 18 })] })] 
      }),
      new TableCell({ 
        shading: { fill: "334155" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Precio Unitario (€)", bold: true, color: "FFFFFF", size: 18 })] })] 
      }),
      new TableCell({ 
        shading: { fill: "334155" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Precio (€)", bold: true, color: "FFFFFF", size: 18 })] })] 
      }),
    ],
  });

  const dataRows = data.lines.map(line => new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: line.description, bold: true, size: 20 })] })] }),
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: line.units?.toString() || "", bold: true, size: 20 })] })] }),
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: line.unitPrice ? formatCurrency(line.unitPrice) : "", bold: true, size: 20 })] })] }),
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: line.totalPrice ? formatCurrency(line.totalPrice) : "", bold: true, size: 20 })] })] }),
    ],
  }));

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Watermark top (simplified representation in Word)
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "PRESUPUESTO", bold: true, size: 72, color: "A5F3FC", italics: true })],
        }),

        // Branding Header
        new Paragraph({ children: [new TextRun({ text: "Eduardo Quilis Llorens", bold: true, size: 28 })] }),
        new Paragraph({ children: [new TextRun({ text: "C/ Cervantes 41 • Onil • 03430", size: 18 })] }),
        new Paragraph({ children: [new TextRun({ text: "quilislalo@gmail.com", size: 18 })] }),
        new Paragraph({ children: [new TextRun({ text: "620-944-229 • NIF: 21667776-M", bold: true, size: 18 })] }),

        new Paragraph({ spacing: { before: 400 } }),

        // Client & Date
        new Paragraph({ children: [new TextRun({ text: "Cliente: ", bold: true }), new TextRun({ text: data.client, bold: true, underline: {} })] }),
        new Paragraph({ children: [new TextRun({ text: "Fecha: ", bold: true }), new TextRun({ text: data.date, bold: true, underline: {} })] }),

        new Paragraph({ spacing: { before: 400 } }),

        // Main Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [tableHeader, ...dataRows],
        }),

        new Paragraph({ spacing: { before: 400 } }),

        // Totals Section
        new Table({
          alignment: AlignmentType.RIGHT,
          width: { size: 40, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL €", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(data.subtotal), bold: true })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "IVA 21%", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(data.iva), bold: true })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(data.total), bold: true })] })] }),
              ]
            }),
          ]
        }),

        new Paragraph({ spacing: { before: 600 } }),

        // Importante
        new Paragraph({ children: [new TextRun({ text: "IMPORTANTE:", bold: true, italics: true, underline: {} })] }),
        new Paragraph({
          children: [new TextRun({ text: "• Cualquier imprevisto o problema surgido durante la realización de la obra se facturará aparte.", size: 18, bold: true })],
        }),
        new Paragraph({
          children: [new TextRun({ text: "• Los cambios necesarios debido al estado de las superficies se presupuestarán y cobrarán por separado.", size: 18, bold: true })],
        }),
        new Paragraph({
          children: [new TextRun({ text: "• El 50% del valor del presupuesto se abonará antes de iniciar la obra.", size: 18, bold: true })],
        }),

        ...(data.notes ? [
          new Paragraph({ spacing: { before: 400 } }),
          new Paragraph({ children: [new TextRun({ text: data.notes, bold: true, italics: true, color: "FF0000", size: 18 })] })
        ] : []),

        // Watermark bottom
        new Paragraph({
          spacing: { before: 800 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "PRESUPUESTO", bold: true, size: 72, color: "A5F3FC", italics: true })],
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
