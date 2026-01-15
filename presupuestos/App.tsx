
import React, { useState, useEffect } from 'react';
import CameraCapture from './components/CameraCapture';
import ResultView from './components/ResultView';
import HistoryList from './components/HistoryList';
import { extractBudgetData } from './services/geminiService';
import { BudgetData, HistoryItem } from './types';

const App: React.FC = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BudgetData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [autoDownloadRequested, setAutoDownloadRequested] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('lalo_budget_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing history", e);
      }
    }
  }, []);

  const handleCapture = (base64: string) => {
    setCapturedImage(base64);
    setError(null);
  };

  const handleProcess = async () => {
    if (!capturedImage) return;
    
    setProcessing(true);
    setError(null);
    try {
      const data = await extractBudgetData(capturedImage);
      setResult(data);
      
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        client: data.client,
        total: data.total,
        data: data
      };
      
      const newHistory = [newItem, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem('lalo_budget_history', JSON.stringify(newHistory));
      
      setCapturedImage(null);
    } catch (err: any) {
      setError(err.message || "Error desconocido al procesar.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    setResult(null);
    setError(null);
  };

  const handleDeleteFromHistory = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem('lalo_budget_history', JSON.stringify(newHistory));
  };

  const handleSelectFromHistory = (item: HistoryItem, autoDownload: boolean = false) => {
    setResult(item.data);
    setCapturedImage(null);
    setAutoDownloadRequested(autoDownload);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow-sm border-b border-gray-200 mb-8 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none tracking-tight">Lalo Quilis App</h1>
              <p className="text-[10px] text-gray-500 mt-1 uppercase font-black tracking-widest">Power by SantiSystems</p>
            </div>
          </div>
          { (result || capturedImage) && (
            <button 
              onClick={handleReset}
              className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl text-xs font-black transition uppercase tracking-widest"
            >
              Cancelar
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4">
        {error && (
          <div className="bg-red-600 text-white p-6 rounded-3xl mb-8 shadow-2xl animate-bounce">
            <div className="flex items-center space-x-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-black text-lg">HUBO UN PROBLEMA</p>
                <p className="font-medium opacity-90">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!result && !capturedImage && !processing && (
          <div className="text-center py-12">
            <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase italic">¿Nuevo presupuesto?</h2>
            <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">Enfoca bien el papel y asegúrate de que haya luz suficiente.</p>
            <CameraCapture onCapture={handleCapture} />
          </div>
        )}

        {capturedImage && !processing && (
          <div className="flex flex-col items-center space-y-6 py-8">
            <div className="w-full max-w-md bg-white p-3 rounded-[2rem] shadow-2xl overflow-hidden border-4 border-white">
              <img src={capturedImage} alt="Preview" className="w-full h-auto rounded-2xl" />
            </div>
            <div className="flex space-x-4 w-full max-w-md">
              <button
                onClick={() => setCapturedImage(null)}
                className="flex-1 bg-white text-gray-900 font-black py-5 rounded-2xl border-2 border-gray-200 hover:bg-gray-50 transition uppercase text-sm"
              >
                Repetir
              </button>
              <button
                onClick={handleProcess}
                className="flex-1 bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-700 transition transform active:scale-95 uppercase text-sm tracking-widest"
              >
                Enviar a IA
              </button>
            </div>
          </div>
        )}

        {processing && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="animate-spin rounded-full h-24 w-24 border-8 border-gray-100 border-t-blue-600 mb-8"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="h-4 w-4 bg-blue-600 rounded-full animate-ping"></div>
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 animate-pulse uppercase italic tracking-tighter">Leyendo presupuesto...</p>
            <p className="text-gray-400 font-bold mt-2 uppercase text-[10px] tracking-[0.3em]">No cierres la aplicación</p>
          </div>
        )}

        {result && !processing && (
          <ResultView 
            data={result} 
            onReset={handleReset} 
            autoDownload={autoDownloadRequested}
            onAutoDownloadComplete={() => setAutoDownloadRequested(false)}
          />
        )}

        {!processing && !capturedImage && (
          <HistoryList 
            items={history} 
            onSelect={handleSelectFromHistory} 
            onDelete={handleDeleteFromHistory}
          />
        )}
      </main>
    </div>
  );
};

export default App;
