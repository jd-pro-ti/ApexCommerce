'use client';
import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

export default function SpecificationsInput({ value = {}, onChange, onPendingChange, label = 'Especificaciones' }) {
  const [specs, setSpecs] = useState(value || {});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const addSpec = () => {
    if (newKey.trim() && newValue.trim()) {
      const updated = { ...specs, [newKey.trim()]: newValue.trim() };
      setSpecs(updated);
      onChange(updated);
      onPendingChange?.({ key: '', value: '' });
      setNewKey('');
      setNewValue('');
    }
  };

  const removeSpec = (key) => {
    const updated = { ...specs };
    delete updated[key];
    setSpecs(updated);
    onChange(updated);
  };

  const updateSpec = (oldKey, newKey, newValue) => {
    const updated = { ...specs };
    delete updated[oldKey];
    updated[newKey.trim()] = newValue.trim();
    setSpecs(updated);
    onChange(updated);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSpec();
    }
  };

  return (
    <div className="space-y-4 w-full overflow-hidden">
      <label className="block text-xs font-bold text-[#010f20] uppercase tracking-wider mb-2">
        {label}
      </label>
      <p className="mb-3 text-xs text-slate-500">Agrega al menos 2 características o detalles del producto.</p>

      {/* Lista de especificaciones existentes */}
      {Object.keys(specs).length > 0 && (
        <div className="space-y-2">
          {Object.entries(specs).map(([key, value]) => (
            <div key={key} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
              <input
                type="text"
                value={key}
                onChange={(e) => {
                  const newKey = e.target.value;
                  if (newKey !== key) {
                    updateSpec(key, newKey, value);
                  }
                }}
                className="w-full sm:flex-1 bg-transparent border-0 focus:ring-0 text-sm font-medium text-slate-800 p-0"
                placeholder="Propiedad"
              />
              <span className="hidden sm:inline text-gray-400">:</span>
              <input
                type="text"
                value={value}
                onChange={(e) => updateSpec(key, key, e.target.value)}
                className="w-full sm:flex-1 bg-transparent border-0 focus:ring-0 text-sm text-slate-600 p-0"
                placeholder="Valor"
              />
              <button
                type="button"
                onClick={() => removeSpec(key)}
                className="text-red-500 hover:text-red-700 p-1 self-end sm:self-center cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Agregar nueva especificación (Adaptado para móviles) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
        <input
          type="text"
          value={newKey}
          onChange={(e) => {
            const key = e.target.value;
            setNewKey(key);
            onPendingChange?.({ key, value: newValue });
          }}
          onKeyPress={handleKeyPress}
          placeholder="Ej: Marca"
          className="w-full sm:flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-1 focus:ring-slate-800 focus:border-slate-800 bg-white text-sm text-slate-800"
        />
        <span className="hidden sm:inline text-gray-400 flex items-center">:</span>
        <input
          type="text"
          value={newValue}
          onChange={(e) => {
            const value = e.target.value;
            setNewValue(value);
            onPendingChange?.({ key: newKey, value });
          }}
          onKeyPress={handleKeyPress}
          placeholder="Ej: Samsung"
          className="w-full sm:flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-1 focus:ring-slate-800 focus:border-slate-800 bg-white text-sm text-slate-800"
        />
        <button
          type="button"
          onClick={addSpec}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center justify-center gap-1 text-sm font-medium cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="sm:hidden text-xs">Agregar característica</span>
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Presiona Enter para agregar rápidamente
      </p>
    </div>
  );
}