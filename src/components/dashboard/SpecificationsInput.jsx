'use client';
import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

export default function SpecificationsInput({ value = {}, onChange, label = 'Especificaciones' }) {
  const [specs, setSpecs] = useState(value || {});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const addSpec = () => {
    if (newKey.trim() && newValue.trim()) {
      const updated = { ...specs, [newKey.trim()]: newValue.trim() };
      setSpecs(updated);
      onChange(updated);
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
    <div className="space-y-4">
      <label className="block text-xs font-bold text-[#010f20] uppercase tracking-wider mb-2">
        {label}
      </label>

      {/* Lista de especificaciones existentes */}
      {Object.keys(specs).length > 0 && (
        <div className="space-y-2">
          {Object.entries(specs).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
              <input
                type="text"
                value={key}
                onChange={(e) => {
                  const newKey = e.target.value;
                  if (newKey !== key) {
                    updateSpec(key, newKey, value);
                  }
                }}
                className="flex-1 bg-transparent border-0 focus:ring-0 text-sm font-medium text-slate-800"
                placeholder="Propiedad"
              />
              <span className="text-gray-400">:</span>
              <input
                type="text"
                value={value}
                onChange={(e) => updateSpec(key, key, e.target.value)}
                className="flex-1 bg-transparent border-0 focus:ring-0 text-sm text-slate-600"
                placeholder="Valor"
              />
              <button
                type="button"
                onClick={() => removeSpec(key)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Agregar nueva especificación */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ej: Marca"
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-1 focus:ring-slate-800 focus:border-slate-800 bg-white text-sm text-slate-800"
        />
        <span className="text-gray-400 flex items-center">:</span>
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ej: Samsung"
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-1 focus:ring-slate-800 focus:border-slate-800 bg-white text-sm text-slate-800"
        />
        <button
          type="button"
          onClick={addSpec}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-1 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Presiona Enter para agregar rápidamente
      </p>
    </div>
  );
}