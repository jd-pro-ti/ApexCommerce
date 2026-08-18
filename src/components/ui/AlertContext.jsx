'use client';
import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, X, AlertCircle, Info } from 'lucide-react';

// Valid alert types
const ALERT_TYPES = ['success', 'error', 'info'];

const AlertContext = createContext(undefined);

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type, visible: true });

    // Ocultar automáticamente después de 4 segundos
    setTimeout(() => {
      setAlert((prev) => (prev ? { ...prev, visible: false } : null));
    }, 4000);
  };

  const hideAlert = () => {
    setAlert((prev) => (prev ? { ...prev, visible: false } : null));
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      
{/* Contenedor flotante superior derecho */}
      {alert && alert.visible && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 animate-slide-in max-w-md w-full px-4 sm:px-0">
          {/* Mueve o ajusta estas líneas de condicionales ternarios */}
          <div className={`flex items-center justify-between p-4 rounded-2xl border shadow-lg backdrop-blur-md transition-all ${
            alert.type === 'success' ? 'bg-[#eefcf4] border-[#b8f2d6] text-[#0f5132]' :
            alert.type === 'error' || alert.type === 'info' ? 'bg-red-50 border-red-200 text-red-700' : /* <--- AQUÍ: Unificamos 'error' e 'info' para que usen rojo */
            'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <div className="flex items-center gap-3">
              {alert.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              {/* <--- AQUÍ: Hacemos que el icono también sea rojo para 'error' o 'info' */}
              {(alert.type === 'error' || alert.type === 'info') && <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />} 
              
              <span className="text-xs sm:text-sm font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {alert.message}
              </span>
            </div>
            <button 
              onClick={hideAlert}
              className="p-1 rounded-lg hover:bg-black/5 transition-colors text-gray-500 hover:text-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert debe usarse dentro de un AlertProvider');
  }
  return context;
};