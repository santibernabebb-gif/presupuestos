
import React from 'react';
import { HistoryItem } from '../types';

interface Props {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

const HistoryList: React.FC<Props> = ({ items, onSelect, onDelete }) => {
  if (items.length === 0) return null;

  return (
    <div className="mt-12 w-full max-w-2xl mx-auto px-4">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Historial de Presupuestos
      </h3>
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        {items.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelect(item)}
            className="p-4 border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition flex justify-between items-center group relative"
          >
            <div className="flex-grow">
              <p className="font-bold text-gray-900 group-hover:text-blue-600 uppercase">{item.client}</p>
              <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString('es-ES')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-bold text-gray-800">{item.total.toFixed(2)}€</p>
                <p className="text-xs text-blue-500 font-medium">Ver / Descargar</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('¿Estás seguro de que quieres borrar este presupuesto del historial?')) {
                    onDelete(item.id);
                  }
                }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Eliminar del historial"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
