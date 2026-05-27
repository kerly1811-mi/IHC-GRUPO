import React, { useState, useRef, useEffect } from 'react';
import { History, Calendar, Trash2, Check, X, Search, MoreVertical, FileText, FileDown } from 'lucide-react';
import type { AnalysisHistoryItem } from '../models/usabilityModels';
import { exportToMarkdown, exportToPDF } from '../utils/exportUtils';

interface AnalysisHistoryPanelProps {
  history: AnalysisHistoryItem[];
  onSelect: (item: AnalysisHistoryItem) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

/* ── Sub-componente para cada ítem del historial ── */
const HistoryItemCard: React.FC<{
  item: AnalysisHistoryItem;
  onSelect: (item: AnalysisHistoryItem) => void;
  onDelete: (id: string) => void;
}> = ({ item, onSelect, onDelete }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setIsDeleting(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  return (
    <article 
      className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:border-navy hover:shadow-md transition-all cursor-pointer"
      onClick={() => onSelect(item)}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Calendar size={12} />
            <span className="text-[0.7rem] font-bold">
              {new Date(item.created_at).toLocaleString()}
            </span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm leading-tight break-words">
            {item.title || item.project_name}
          </h4>
          {item.title && (
            <p className="text-[0.6rem] text-slate-400 font-semibold mt-0.5 truncate">
              {item.project_name}
            </p>
          )}
          <div className="flex gap-2 mt-2">
            <span className="text-[0.65rem] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-red-50 text-red-700 rounded border border-red-100">
              {item.result_data.criticalIssues.length} Problemas
            </span>
            <span className="text-[0.65rem] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-100">
              Puntuación: {item.result_data.priorityScore.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Menú de Acciones */}
        <div className="relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
            aria-label="Más opciones"
          >
            <MoreVertical size={16} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-2 border-b border-slate-100 bg-slate-50">
                <p className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest px-2">Exportar</p>
              </div>
              <button
                onClick={() => { exportToMarkdown(item); setShowDropdown(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
                <FileText size={14} className="text-slate-400" /> Markdown (.md)
              </button>
              <button
                onClick={() => { exportToPDF(item); setShowDropdown(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
                <FileDown size={14} className="text-slate-400" /> PDF (.pdf)
              </button>
              
              <div className="p-2 border-t border-slate-100 bg-slate-50">
                <p className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest px-2">Peligro</p>
              </div>
              
              {isDeleting ? (
                <div className="flex items-center justify-between px-2 py-1 bg-red-50">
                   <button
                    onClick={() => setIsDeleting(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded transition-all"
                  >
                    <X size={14} />
                  </button>
                  <button
                    onClick={() => { onDelete(item.id); setShowDropdown(false); }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded text-[0.65rem] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-sm"
                  >
                    <Check size={14} /> Confirmar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsDeleting(true)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export const AnalysisHistoryPanel: React.FC<AnalysisHistoryPanelProps> = ({
  history,
  onSelect,
  onDelete,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-navy/20 border-t-navy animate-spin" />
        <p className="text-slate-500 text-sm">Cargando historial...</p>
      </div>
    );
  }

  const normalize = (str: string) => 
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredHistory = history.filter(item => {
    const searchStr = normalize(`${item.title || ''} ${item.project_name} ${new Date(item.created_at).toLocaleString()}`);
    const normalizedTerm = normalize(searchTerm);
    return searchStr.includes(normalizedTerm);
  });

  if (history.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        <History size={32} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium text-sm">
          No hay análisis previos para este plan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <h3 className="text-[0.7rem] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <History size={14} /> Historial de análisis
        </h3>

        {/* Search Bar */}
        <div className="relative group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy transition-colors" />
          <input
            type="text"
            placeholder="Buscar en el historial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
        {filteredHistory.length === 0 ? (
          <p className="text-center py-4 text-slate-400 text-xs font-bold uppercase tracking-wider">
            Sin resultados
          </p>
        ) : (
          filteredHistory.map((item) => (
            <HistoryItemCard 
              key={item.id} 
              item={item} 
              onSelect={onSelect} 
              onDelete={onDelete} 
            />
          )))}
      </div>
    </div>
  );
};

export default AnalysisHistoryPanel;