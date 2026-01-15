
import React from 'react';
import { BudgetData } from '../types';
import { generateDocx, downloadBlob } from '../services/documentService';

interface Props {
  data: BudgetData;
  onReset: () => void;
}

const ResultView: React.FC<Props> = ({ data, onReset }) => {
  
  const handleDownloadDocx = async () => {
    const blob = await generateDocx(data);
    downloadBlob(blob, `Presupuesto_${data.budgetNumber}_${data.client.replace(/\s/g, '_')}.docx`);
  };

  const handleDownloadPdf = () => {
    const element = document.getElementById('template-preview');
    if (!element) return;
    
    const opt = {
      margin: 0,
      filename: `Presupuesto_${data.budgetNumber}_${data.client.replace(/\s/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // @ts-ignore
    window.html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-2xl mt-6 border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Presupuesto Generado</h2>
          <p className="text-gray-500 text-sm italic">Siguiendo estrictamente la Plantilla Sagrada de Lalo Quilis.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={onReset}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-bold transition"
          >
            Nueva Captura
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <button
          onClick={handleDownloadDocx}
          className="group relative flex items-center justify-center space-x-3 bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-black text-lg uppercase">Generar Plantilla Lalo (.docx)</span>
        </button>
        <button
          onClick={handleDownloadPdf}
          className="flex items-center justify-center space-x-3 bg-red-500 text-white py-4 px-6 rounded-xl hover:bg-red-600 transition-all shadow-lg hover:shadow-red-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="font-black text-lg uppercase">Descargar PDF</span>
        </button>
      </div>

      {/* SACRED TEMPLATE PREVIEW - REPLICATING THE IMAGE PRECISELY */}
      <div className="bg-gray-300 p-2 md:p-8 rounded-xl overflow-hidden shadow-inner flex justify-center">
        <div 
          id="template-preview" 
          className="bg-white shadow-2xl p-12 md:p-16 w-full max-w-[210mm] min-h-[297mm] text-[14px] text-black font-sans relative"
          style={{ lineHeight: '1.4' }}
        >
          {/* Top Watermark */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold opacity-20 text-blue-400 tracking-[0.2em] uppercase italic">PRESUPUESTO</h1>
          </div>

          <div className="flex justify-between items-start mb-16">
            {/* Header Text */}
            <div className="flex flex-col space-y-1">
              <h2 className="text-xl font-bold">Eduardo Quilis Llorens</h2>
              <p className="text-sm">C/ Cervantes 41 • Onil • 03430</p>
              <p className="text-sm">quilislalo@gmail.com</p>
              <p className="text-sm font-semibold">620-944-229 • NIF: 21667776-M</p>
            </div>
            
            {/* Logo area */}
            <div className="flex flex-col items-center">
              <div className="bg-slate-800 text-white p-2 rounded flex flex-col items-center w-48">
                <div className="flex items-center space-x-2 w-full justify-center">
                   <div className="text-xl font-bold leading-tight">LALO<br/>QUILIS</div>
                   <div className="h-10 w-1 flex flex-col justify-between">
                      <div className="h-1/3 bg-blue-400"></div>
                      <div className="h-1/3 bg-pink-500"></div>
                      <div className="h-1/3 bg-yellow-400"></div>
                   </div>
                </div>
                <div className="text-[9px] mt-1 border-t border-white/30 pt-1 tracking-widest uppercase">Pinturas y Decoración</div>
              </div>
            </div>
          </div>
          
          {/* Client & Date Info (Sacred Rule: After text) */}
          <div className="mb-12 space-y-2">
            <p><strong>Cliente:</strong> <span className="font-bold underline ml-2">{data.client}</span></p>
            <p><strong>Fecha:</strong> <span className="font-bold underline ml-2">{data.date}</span></p>
          </div>

          {/* Table (Sacred Columns) */}
          <table className="w-full border-collapse mb-6 border-[1.5px] border-black text-xs">
            <thead>
              <tr className="bg-slate-700 text-white uppercase text-[11px] font-bold">
                <th className="border border-black p-2 text-left w-2/3">DESCRIPCION</th>
                <th className="border border-black p-2 text-center w-20">UNIDADES</th>
                <th className="border border-black p-2 text-center">Precio Unitario (€)</th>
                <th className="border border-black p-2 text-center">Precio (€)</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line, i) => (
                <tr key={i}>
                  <td className="border border-black p-2 font-bold">{line.description}</td>
                  <td className="border border-black p-2 text-center font-bold">{line.units || ''}</td>
                  <td className="border border-black p-2 text-right font-bold">{line.unitPrice ? `${line.unitPrice.toFixed(2)}€` : ''}</td>
                  <td className="border border-black p-2 text-right font-bold">{line.totalPrice ? `${line.totalPrice.toFixed(2)}€` : ''}</td>
                </tr>
              ))}
              {/* Sacred Rule: Remove empty lines if possible, or add fixed rows like the template if many */}
            </tbody>
          </table>

          {/* Summary Section - EXACT Layout from image */}
          <div className="flex justify-end mb-16">
            <div className="w-64 space-y-4">
              <div className="flex border-[1.5px] border-black">
                <div className="w-1/2 p-1 font-bold bg-gray-50">TOTAL €</div>
                <div className="w-1/2 p-1 font-bold text-right border-l border-black">{data.subtotal.toFixed(2)}€</div>
              </div>
              
              <div className="space-y-0">
                <div className="flex border-[1.5px] border-black border-b-0">
                  <div className="w-1/2 p-1 font-bold">IVA 21%</div>
                  <div className="w-1/2 p-1 font-bold text-right border-l border-black">{data.iva.toFixed(2)}€</div>
                </div>
                <div className="flex border-[1.5px] border-black">
                  <div className="w-1/2 p-1 font-bold uppercase">TOTAL</div>
                  <div className="w-1/2 p-1 font-bold text-right border-l border-black">{data.total.toFixed(2)}€</div>
                </div>
              </div>
            </div>
          </div>

          {/* IMPORTANTE Section - EXACT Content from image */}
          <div className="mt-12">
            <h3 className="font-bold italic underline mb-4">IMPORTANTE:</h3>
            <ul className="list-disc pl-8 space-y-2 text-xs font-bold">
              <li>Cualquier imprevisto o problema surgido durante la realización de la obra se facturará aparte.</li>
              <li>Los cambios necesarios debido al estado de las superficies se presupuestarán y cobrarán por separado.</li>
              <li>El 50% del valor del presupuesto se abonará antes de iniciar la obra.</li>
            </ul>
          </div>

          {/* Notes area if illegible */}
          {data.notes && (
            <div className="mt-12 p-2 border-t border-dashed border-gray-400">
              <p className="text-[10px] text-red-600 font-bold italic">{data.notes}</p>
            </div>
          )}

          {/* Bottom Watermark */}
          <div className="absolute bottom-12 left-0 right-0 text-center">
            <h1 className="text-6xl font-bold opacity-15 text-blue-400 tracking-[0.2em] uppercase italic">PRESUPUESTO</h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
