
import React from 'react';
import { HistoryItem } from '../types';

interface Props {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

const HistoryList: React.FC<Props> = ({ items, onSelect }) => {
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
            className="p-4 border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition flex justify-between items-center group"
          >
            <div>
              <p className="font-bold text-gray-900 group-hover:text-blue-600">{item.client}</p>
              <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString('es-ES')}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-800">{item.total.toFixed(2)}€</p>
              <p className="text-xs text-blue-500 font-medium">Ver / Descargar</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
