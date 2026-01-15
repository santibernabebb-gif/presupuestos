
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
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' } // Regla crítica para evitar saltos de página
    };
    
    // @ts-ignore
    window.html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-2xl mt-6 border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Presupuesto Generado</h2>
          <p className="text-gray-500 text-sm italic">Siguiendo estrictamente la Plantilla Sagrada (1 sola página).</p>
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
          <span className="font-black text-lg uppercase">Generar Word Lalo (.docx)</span>
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

      {/* SACRED TEMPLATE PREVIEW - FORCED SINGLE PAGE */}
      <div className="bg-gray-300 p-2 md:p-8 rounded-xl overflow-hidden shadow-inner flex justify-center">
        <div 
          id="template-preview" 
          className="bg-white shadow-2xl p-10 md:p-14 w-full max-w-[210mm] h-[297mm] text-[13px] text-black font-sans relative overflow-hidden"
          style={{ lineHeight: '1.3', pageBreakInside: 'avoid' }}
        >
          {/* Top Watermark */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold opacity-10 text-blue-400 tracking-[0.2em] uppercase italic">PRESUPUESTO</h1>
          </div>

          <div className="flex justify-between items-start mb-10">
            {/* Header Text */}
            <div className="flex flex-col space-y-0.5">
              <h2 className="text-lg font-extrabold uppercase tracking-tight">Eduardo Quilis Llorens</h2>
              <p className="text-xs">C/ Cervantes 41 • Onil • 03430</p>
              <p className="text-xs">quilislalo@gmail.com</p>
              <p className="text-xs font-bold">620-944-229 • NIF: 21667776-M</p>
            </div>
            
            {/* Logo area */}
            <div className="flex flex-col items-center">
              <div className="bg-slate-800 text-white p-1.5 rounded flex flex-col items-center w-40">
                <div className="flex items-center space-x-2 w-full justify-center">
                   <div className="text-lg font-black leading-tight">LALO<br/>QUILIS</div>
                   <div className="h-8 w-1 flex flex-col justify-between">
                      <div className="h-1/3 bg-blue-400"></div>
                      <div className="h-1/3 bg-pink-500"></div>
                      <div className="h-1/3 bg-yellow-400"></div>
                   </div>
                </div>
                <div className="text-[7px] mt-0.5 border-t border-white/20 pt-0.5 tracking-widest uppercase font-bold">Pinturas y Decoración</div>
              </div>
            </div>
          </div>
          
          {/* Client & Date Info */}
          <div className="mb-8 space-y-1 bg-gray-50 p-3 border border-gray-200 rounded">
            <p><strong>Cliente:</strong> <span className="font-bold underline ml-2">{data.client}</span></p>
            <p><strong>Fecha:</strong> <span className="font-bold underline ml-2">{data.date}</span></p>
          </div>

          {/* Table (Sacred Columns) */}
          <div className="min-h-[300px]">
            <table className="w-full border-collapse border-[1.5px] border-black text-xs">
              <thead>
                <tr className="bg-slate-700 text-white uppercase text-[10px] font-bold">
                  <th className="border border-black p-2 text-left w-3/5">DESCRIPCION</th>
                  <th className="border border-black p-2 text-center w-20">UNIDADES</th>
                  <th className="border border-black p-2 text-center">P. Unit. (€)</th>
                  <th className="border border-black p-2 text-center">Precio (€)</th>
                </tr>
              </thead>
              <tbody>
                {data.lines.map((line, i) => (
                  <tr key={i}>
                    <td className="border border-black p-2 font-bold whitespace-pre-wrap">{line.description}</td>
                    <td className="border border-black p-2 text-center font-bold">{line.units || ''}</td>
                    <td className="border border-black p-2 text-right font-bold">{line.unitPrice ? `${line.unitPrice.toFixed(2)}€` : ''}</td>
                    <td className="border border-black p-2 text-right font-bold">{line.totalPrice ? `${line.totalPrice.toFixed(2)}€` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Section */}
          <div className="flex justify-end mt-4 mb-8">
            <div className="w-56 space-y-1.5">
              <div className="flex border-[1.5px] border-black">
                <div className="w-1/2 p-1.5 font-bold bg-gray-50 text-[11px]">TOTAL €</div>
                <div className="w-1/2 p-1.5 font-bold text-right border-l border-black text-[11px]">{data.subtotal.toFixed(2)}€</div>
              </div>
              
              <div className="space-y-0">
                <div className="flex border-[1.5px] border-black border-b-0">
                  <div className="w-1/2 p-1.5 font-bold text-[11px]">IVA 21%</div>
                  <div className="w-1/2 p-1.5 font-bold text-right border-l border-black text-[11px]">{data.iva.toFixed(2)}€</div>
                </div>
                <div className="flex border-[1.5px] border-black bg-slate-100">
                  <div className="w-1/2 p-1.5 font-black uppercase text-[12px]">TOTAL FINAL</div>
                  <div className="w-1/2 p-1.5 font-black text-right border-l border-black text-[13px]">{data.total.toFixed(2)}€</div>
                </div>
              </div>
            </div>
          </div>

          {/* IMPORTANTE Section */}
          <div className="mt-6 border-t border-black pt-4">
            <h3 className="font-bold italic underline mb-2 text-xs">IMPORTANTE:</h3>
            <ul className="list-disc pl-6 space-y-1 text-[10px] font-bold">
              <li>Cualquier imprevisto o problema surgido durante la realización de la obra se facturará aparte.</li>
              <li>Los cambios necesarios debido al estado de las superficies se presupuestarán y cobrarán por separado.</li>
              <li>El 50% del valor del presupuesto se abonará antes de iniciar la obra.</li>
            </ul>
          </div>

          {data.notes && (
            <div className="mt-4 p-2 border border-red-200 bg-red-50 rounded">
              <p className="text-[9px] text-red-700 font-bold italic">{data.notes}</p>
            </div>
          )}

          {/* Bottom Watermark */}
          <div className="absolute bottom-10 left-0 right-0 text-center">
            <h1 className="text-5xl font-bold opacity-10 text-blue-400 tracking-[0.3em] uppercase italic">PRESUPUESTO</h1>
            <p className="text-[8px] text-gray-400 mt-2 uppercase tracking-widest">SantiSystems v2.0 - Solo rellenar datos indicados</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
