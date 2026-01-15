
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

  // Load history from local storage on mount
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
      
      // Save to history
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        client: data.client,
        total: data.total,
        data: data
      };
      
      const newHistory = [newItem, ...history].slice(0, 20); // Keep last 20
      setHistory(newHistory);
      localStorage.setItem('lalo_budget_history', JSON.stringify(newHistory));
      
      setCapturedImage(null);
      setAutoDownloadRequested(false);
    } catch (err) {
      console.error(err);
      setError("Error al procesar la imagen con IA. Inténtalo de nuevo.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    setResult(null);
    setError(null);
    setAutoDownloadRequested(false);
  };

  const handleDeleteFromHistory = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem('lalo_budget_history', JSON.stringify(newHistory));
    
    if (result && history.find(h => h.id === id)?.data.budgetNumber === result.budgetNumber) {
        setResult(null);
    }
  };

  const handleSelectFromHistory = (item: HistoryItem, autoDownload: boolean = false) => {
    setResult(item.data);
    setCapturedImage(null);
    setAutoDownloadRequested(autoDownload);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 mb-8 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">SantiSystems-Presupuestos</h1>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-tighter">Budget AI Engine</p>
            </div>
          </div>
          {result && (
            <button 
              onClick={handleReset}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition"
            >
              Nuevo
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4">
        {!result && !capturedImage && !processing && (
          <div className="text-center py-12">
            <div className="mb-6 inline-block p-4 bg-blue-50 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Captura un presupuesto</h2>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">Toma una foto clara del papel manuscrito para extraer los datos automáticamente.</p>
            <CameraCapture onCapture={handleCapture} />
          </div>
        )}

        {capturedImage && !processing && (
          <div className="flex flex-col items-center space-y-6 py-8">
            <div className="w-full max-w-md bg-white p-2 rounded-2xl shadow-xl overflow-hidden">
              <img src={capturedImage} alt="Capture preview" className="w-full h-auto rounded-xl" />
            </div>
            <div className="flex space-x-4 w-full max-w-md">
              <button
                onClick={() => setCapturedImage(null)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-50 transition"
              >
                Reintentar
              </button>
              <button
                onClick={handleProcess}
                className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition transform active:scale-95"
              >
                Procesar con IA
              </button>
            </div>
          </div>
        )}

        {processing && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-lg font-bold text-gray-800 animate-pulse">Analizando presupuesto...</p>
            <p className="text-gray-500 text-sm mt-2">Estamos leyendo la letra y calculando totales</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 my-6 rounded shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
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

      {/* Footer info */}
      <footer className="mt-20 border-t border-gray-200 pt-8 text-center text-gray-400 text-xs">
        <p>© {new Date().getFullYear()} SantiSystems-Presupuestos - Motor de Visión Gemini Pro</p>
      </footer>
    </div>
  );
};

export default App;
