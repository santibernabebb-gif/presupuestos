
import React, { useState } from 'react';
import { BudgetData } from '../types';
import { generateDocx, downloadBlob } from '../services/documentService';

interface Props {
  data: BudgetData;
  onReset: () => void;
}

const ResultView: React.FC<Props> = ({ data, onReset }) => {
  const [showModal, setShowModal] = useState(false);

  const handleDownloadDocx = async () => {
    try {
      const blob = await generateDocx(data);
      downloadBlob(blob, `Presupuesto_${data.budgetNumber}_${data.client.replace(/\s/g, '_')}.docx`);
      setShowModal(true);
    } catch (e) {
      console.error("Error downloading Word", e);
    }
  };

  const handleDownloadPdf = () => {
    const element = document.getElementById('template-preview');
    if (!element) return;
    
    const opt = {
      margin: 0,
      filename: `Presupuesto_${data.budgetNumber}_${data.client.replace(/\s/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        scrollY: 0,
        windowWidth: 794, // Aproximado para 210mm a 96dpi
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' }
    };
    
    // @ts-ignore
    window.html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf) => {
      // Forzar que solo tenga una página si por alguna razón jsPDF crea dos
      const totalPages = pdf.internal.getNumberOfPages();
      if (totalPages > 1) {
        for (let i = totalPages; i > 1; i--) {
          pdf.deletePage(i);
        }
      }
    }).save().then(() => {
      setShowModal(true);
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-2xl mt-6 border border-gray-100 relative">
      {/* Modal de Confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Archivo Descargado</h3>
            <p className="text-gray-500 mb-8 font-medium">El presupuesto se ha guardado correctamente en tu dispositivo.</p>
            <button 
              onClick={() => setShowModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all shadow-lg active:scale-95"
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Presupuesto Finalizado</h2>
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

      {/* SACRED TEMPLATE PREVIEW - ESTRICTAMENTE 1 PÁGINA */}
      <div className="bg-gray-300 p-2 md:p-8 rounded-xl overflow-hidden shadow-inner flex justify-center overflow-x-auto">
        <div 
          id="template-preview" 
          className="bg-white shadow-2xl p-10 md:p-12 w-[210mm] h-[297mm] min-w-[210mm] min-h-[297mm] text-[13px] text-black font-sans relative overflow-hidden flex flex-col box-border"
          style={{ lineHeight: '1.2', pageBreakInside: 'avoid' }}
        >
          {/* Top Watermark */}
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold opacity-10 text-blue-400 tracking-[0.2em] uppercase italic">PRESUPUESTO</h1>
          </div>

          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col space-y-0.5">
              <h2 className="text-lg font-extrabold uppercase tracking-tight">Eduardo Quilis Llorens</h2>
              <p className="text-[11px]">C/ Cervantes 41 • Onil • 03430</p>
              <p className="text-[11px]">quilislalo@gmail.com</p>
              <p className="text-[11px] font-bold">620-944-229 • NIF: 21667776-M</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-slate-800 text-white p-1.5 rounded flex flex-col items-center w-36">
                <div className="flex items-center space-x-1.5 w-full justify-center">
                   <div className="text-base font-black leading-tight">LALO<br/>QUILIS</div>
                   <div className="h-6 w-0.5 flex flex-col justify-between">
                      <div className="h-1/3 bg-blue-400"></div>
                      <div className="h-1/3 bg-pink-500"></div>
                      <div className="h-1/3 bg-yellow-400"></div>
                   </div>
                </div>
                <div className="text-[6px] mt-0.5 border-t border-white/20 pt-0.5 tracking-widest uppercase font-bold">Pinturas y Decoración</div>
              </div>
            </div>
          </div>
          
          <div className="mb-4 space-y-0.5 bg-gray-50 p-2 border border-gray-200 rounded">
            <p className="text-[12px]"><strong>Cliente:</strong> <span className="font-bold underline ml-2 uppercase">{data.client}</span></p>
            <p className="text-[12px]"><strong>Fecha:</strong> <span className="font-bold underline ml-2">{data.date}</span></p>
          </div>

          {/* Tabla de Partidas */}
          <div className="flex-grow overflow-hidden mb-4">
            <table className="w-full border-collapse border-[1.5px] border-black text-[11px]">
              <thead>
                <tr className="bg-slate-700 text-white uppercase text-[9px] font-bold">
                  <th className="border border-black p-1.5 text-left w-[55%]">DESCRIPCION</th>
                  <th className="border border-black p-1.5 text-center w-[15%]">UNIDADES</th>
                  <th className="border border-black p-1.5 text-center w-[15%]">P. Unit. (€)</th>
                  <th className="border border-black p-1.5 text-center w-[15%]">Precio (€)</th>
                </tr>
              </thead>
              <tbody>
                {data.lines.map((line, i) => (
                  <tr key={i} className="leading-tight">
                    <td className="border border-black p-1.5 font-bold uppercase">{line.description}</td>
                    <td className="border border-black p-1.5 text-center font-bold">{line.units || ''}</td>
                    <td className="border border-black p-1.5 text-right font-bold">{line.unitPrice ? `${line.unitPrice.toFixed(2)}€` : ''}</td>
                    <td className="border border-black p-1.5 text-right font-bold">{line.totalPrice ? `${line.totalPrice.toFixed(2)}€` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="flex justify-end mb-4">
            <div className="w-48 space-y-1">
              <div className="flex border-[1.5px] border-black">
                <div className="w-1/2 p-1 font-bold bg-gray-50 text-[10px]">TOTAL €</div>
                <div className="w-1/2 p-1 font-bold text-right border-l border-black text-[10px]">{data.subtotal.toFixed(2)}€</div>
              </div>
              
              <div className="space-y-0">
                <div className="flex border-[1.5px] border-black border-b-0">
                  <div className="w-1/2 p-1 font-bold text-[10px]">IVA 21%</div>
                  <div className="w-1/2 p-1 font-bold text-right border-l border-black text-[10px]">{data.iva.toFixed(2)}€</div>
                </div>
                <div className="flex border-[1.5px] border-black bg-slate-100">
                  <div className="w-1/2 p-1 font-black uppercase text-[11px]">TOTAL</div>
                  <div className="w-1/2 p-1 font-black text-right border-l border-black text-[12px]">{data.total.toFixed(2)}€</div>
                </div>
              </div>
            </div>
          </div>

          {/* Importante */}
          <div className="mt-2 border-t border-black pt-3">
            <h3 className="font-bold italic underline mb-1.5 text-[11px]">IMPORTANTE:</h3>
            <ul className="list-disc pl-5 space-y-0.5 text-[9px] font-bold">
              <li>Cualquier imprevisto o problema surgido durante la realización de la obra se facturará aparte.</li>
              <li>Los cambios necesarios debido al estado de las superficies se presupuestarán y cobrarán por separado.</li>
              <li>El 50% del valor del presupuesto se abonará antes de iniciar la obra.</li>
            </ul>
          </div>

          {data.notes && (
            <div className="mt-2 p-1.5 border border-red-200 bg-red-50 rounded">
              <p className="text-[8px] text-red-700 font-bold italic uppercase">{data.notes}</p>
            </div>
          )}

          {/* Footer Watermark */}
          <div className="mt-auto pt-4 text-center pb-2">
            <h1 className="text-4xl font-bold opacity-10 text-blue-400 tracking-[0.2em] uppercase italic">PRESUPUESTO</h1>
            <p className="text-[7px] text-gray-400 mt-1 uppercase tracking-widest font-bold">SantiSystems v2.0 - Motor Gemini Vision</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
