
import React, { useState, useEffect, useRef } from 'react';
import { BudgetData } from '../types';
import { generateDocx, downloadBlob } from '../services/documentService';

interface Props {
  data: BudgetData;
  onReset: () => void;
  autoDownload?: boolean;
  onAutoDownloadComplete?: () => void;
}

const ResultView: React.FC<Props> = ({ data, onReset, autoDownload, onAutoDownloadComplete }) => {
  const [showModal, setShowModal] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const padding = window.innerWidth < 768 ? 20 : 48;
        const availableWidth = containerRef.current.offsetWidth - padding;
        const a4WidthPx = 794; 
        
        if (availableWidth < a4WidthPx) {
          setScale(availableWidth / a4WidthPx);
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [data]);

  useEffect(() => {
    if (autoDownload) {
      const timer = setTimeout(() => {
        handleDownloadPdf(true);
        if (onAutoDownloadComplete) onAutoDownloadComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, data]);

  const handleDownloadDocx = async () => {
    try {
      const blob = await generateDocx(data);
      downloadBlob(blob, `Presupuesto_${data.client.replace(/\s/g, '_')}.docx`);
      setShowModal(true);
    } catch (e) {
      console.error("Error al generar Word", e);
    }
  };

  const handleDownloadPdf = (isAuto = false) => {
    const element = document.getElementById('template-preview');
    if (!element) return;
    
    const opt = {
      margin: 0,
      filename: `Presupuesto_${data.client.replace(/\s/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        scrollY: 0,
        windowWidth: 794,
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: { mode: 'avoid-all' }
    };
    
    // @ts-ignore
    window.html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf) => {
      const totalPages = pdf.internal.getNumberOfPages();
      if (totalPages > 1) {
        for (let i = totalPages; i > 1; i--) {
          pdf.deletePage(i);
        }
      }
    }).save().then(() => {
      if (!isAuto) setShowModal(true);
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 bg-white rounded-3xl shadow-2xl mt-6 border border-gray-100 relative overflow-hidden">
      {/* Modal Success */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">DOCUMENTO LISTO</h3>
            <p className="text-gray-500 mb-8 font-medium">El archivo se ha descargado correctamente.</p>
            <button 
              onClick={() => setShowModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95"
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">Vista Previa Profesional</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Plantilla: Lalo Quilis Oficial (v2)</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={onReset}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-black transition flex items-center space-x-2 text-xs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>NUEVA CAPTURA</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <button
          onClick={handleDownloadDocx}
          className="group flex items-center justify-center space-x-3 bg-slate-800 text-white py-4 px-6 rounded-2xl hover:bg-slate-900 transition-all shadow-xl active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-black text-sm uppercase">DESCARGAR WORD (.DOCX)</span>
        </button>
        <button
          onClick={() => handleDownloadPdf(false)}
          className="flex items-center justify-center space-x-3 bg-blue-600 text-white py-4 px-6 rounded-2xl hover:bg-blue-700 transition-all shadow-xl active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="font-black text-sm uppercase">DESCARGAR PDF</span>
        </button>
      </div>

      <div 
        ref={containerRef}
        className="bg-zinc-200 p-2 sm:p-6 md:p-10 rounded-3xl shadow-inner flex justify-center items-start overflow-hidden border border-gray-300"
        style={{ minHeight: `${scale * 1122}px` }} 
      >
        <div 
          style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'top center',
            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          <div 
            id="template-preview" 
            ref={previewRef}
            className="bg-white shadow-2xl p-10 md:p-14 w-[210mm] h-[297mm] min-w-[210mm] min-h-[297mm] text-[13px] text-black font-sans relative flex flex-col box-border overflow-hidden"
            style={{ lineHeight: '1.2' }}
          >
            {/* Header Lalo Quilis */}
            <div className="flex justify-between items-start mb-10">
              <div className="flex flex-col">
                <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900 mb-1">Eduardo Quilis Llorens</h2>
                <div className="text-[11px] font-bold text-gray-700 space-y-0.5">
                  <p>C/ Cervantes 41 • Onil • 03430</p>
                  <p>quilislalo@gmail.com</p>
                  <p className="text-gray-900 font-black pt-1">Tel: 620-944-229 • NIF: 21667776-M</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="bg-slate-900 text-white p-2.5 rounded-xl flex flex-col items-center w-40 shadow-xl">
                  <div className="flex items-center space-x-2 w-full justify-center">
                    <div className="text-lg font-black leading-tight tracking-tighter text-center">LALO<br/>QUILIS</div>
                    <div className="h-8 w-1.5 flex flex-col justify-between">
                        <div className="h-1/3 bg-sky-400"></div>
                        <div className="h-1/3 bg-rose-500"></div>
                        <div className="h-1/3 bg-amber-400"></div>
                    </div>
                  </div>
                  <div className="text-[7px] mt-1.5 border-t border-white/20 pt-1 tracking-[0.2em] uppercase font-black text-blue-300">Pinturas y Decoración</div>
                </div>
              </div>
            </div>
            
            <div className="text-center mb-6">
               <h1 className="text-4xl font-black text-slate-800 tracking-[0.1em] uppercase border-b-2 border-slate-800 pb-1 inline-block">PRESUPUESTO</h1>
            </div>

            <div className="mb-8 bg-slate-50 p-4 border-2 border-slate-200 rounded-xl flex justify-between items-center shadow-sm">
              <div className="flex-1">
                <p className="text-[9px] uppercase font-black text-slate-400 mb-0.5">PARA EL CLIENTE:</p>
                <p className="text-[16px] font-black uppercase text-slate-900 underline decoration-slate-400 decoration-2 underline-offset-4">{data.client}</p>
              </div>
              <div className="text-right pl-6 border-l-2 border-slate-200">
                <p className="text-[9px] uppercase font-black text-slate-400 mb-0.5">FECHA DE EMISIÓN:</p>
                <p className="text-[14px] font-black text-slate-900">{data.date}</p>
              </div>
            </div>

            {/* Tabla Principal - DINÁMICA: SIN FILAS VACÍAS */}
            <div className="flex-grow mb-6">
              <table className="w-full border-collapse border-2 border-slate-900 text-[11px]">
                <thead>
                  <tr className="bg-slate-800 text-white uppercase text-[10px] font-black tracking-wider">
                    <th className="border-2 border-slate-900 p-3 text-left w-[55%]">CONCEPTO / DESCRIPCIÓN</th>
                    <th className="border-2 border-slate-900 p-3 text-center w-[12%]">UDS.</th>
                    <th className="border-2 border-slate-900 p-3 text-center w-[15%]">PRECIO U. (€)</th>
                    <th className="border-2 border-slate-900 p-3 text-center w-[18%] bg-slate-700">TOTAL (€)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lines.map((line, i) => (
                    <tr key={i} className={`leading-tight ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <td className="border-2 border-slate-900 p-3 font-bold uppercase text-slate-800">{line.description}</td>
                      <td className="border-2 border-slate-900 p-3 text-center font-black">{line.units || ''}</td>
                      <td className="border-2 border-slate-900 p-3 text-right font-black">{line.unitPrice ? `${line.unitPrice.toFixed(2)}€` : ''}</td>
                      <td className="border-2 border-slate-900 p-3 text-right font-black bg-slate-100/30">{line.totalPrice ? `${line.totalPrice.toFixed(2)}€` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bloque Totales */}
            <div className="flex justify-end mb-10">
              <div className="w-64 space-y-0">
                <div className="flex border-2 border-slate-900 border-b-0">
                  <div className="w-1/2 p-2 font-black bg-slate-50 text-[10px] uppercase">Base Imponible</div>
                  <div className="w-1/2 p-2 font-black text-right border-l-2 border-slate-900 text-[13px]">{data.subtotal.toFixed(2)}€</div>
                </div>
                
                <div className="flex border-2 border-slate-900 border-b-0">
                  <div className="w-1/2 p-2 font-black bg-slate-50 text-[10px] uppercase text-slate-500">I.V.A. (21%)</div>
                  <div className="w-1/2 p-2 font-black text-right border-l-2 border-slate-900 text-[13px] text-slate-500">{data.iva.toFixed(2)}€</div>
                </div>
                
                <div className="flex border-2 border-slate-900 bg-slate-900 text-white transform scale-105 shadow-2xl">
                  <div className="w-1/2 p-3 font-black uppercase text-[12px] tracking-widest flex items-center">TOTAL NETO</div>
                  <div className="w-1/2 p-3 font-black text-right border-l-2 border-white/20 text-[18px]">{data.total.toFixed(2)}€</div>
                </div>
              </div>
            </div>

            {/* Clausulas */}
            <div className="mt-auto border-t-2 border-slate-900 pt-6">
              <h3 className="font-black italic underline mb-2 text-[12px] text-slate-900 uppercase">NOTAS IMPORTANTES:</h3>
              <ul className="space-y-1 text-[10px] font-bold text-slate-700">
                <li className="flex items-start">
                  <span className="mr-2 text-slate-900 font-black">1.</span>
                  <span>Cualquier imprevisto o defecto oculto detectado durante la ejecución se facturará de forma independiente.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-slate-900 font-black">2.</span>
                  <span>Tratamientos especiales por mal estado de paramentos no incluidos en este presupuesto inicial.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-slate-900 font-black">3.</span>
                  <span>Forma de pago: 50% a la aceptación/inicio de trabajos y 50% a la finalización de los mismos.</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 text-center mt-4">
              <p className="text-[8px] text-slate-300 uppercase tracking-[0.5em] font-black">Powered by SantiSystems</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
