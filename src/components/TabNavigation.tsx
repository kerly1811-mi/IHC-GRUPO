// src/components/TabNavigation.tsx
import React from 'react';
import { DashboardTab } from '../models/types';
import { ClipboardList, FileText, Search, BarChart, BarChart2, Save, Check, Loader2 } from 'lucide-react';

interface TabNavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onSave?: () => void;
  saveStatus?: 'idle' | 'saving' | 'success';
  hasUnsavedChanges?: boolean;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  onSave, 
  saveStatus = 'idle',
  hasUnsavedChanges = false 
}) => {
  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'plan',         label: 'Plan de Prueba',       icon: <ClipboardList size={18} aria-hidden="true" /> },
    { id: 'script',       label: 'Guion y Tareas',        icon: <FileText      size={18} aria-hidden="true" /> },
    { id: 'observations', label: 'Registro Observación',  icon: <Search        size={18} aria-hidden="true" /> },
    { id: 'findings',     label: 'Hallazgos y Mejoras',   icon: <BarChart      size={18} aria-hidden="true" /> },
    { id: 'reports',      label: 'Reportes',              icon: <BarChart2     size={18} aria-hidden="true" /> },
  ];

  return (
    <nav className="tabs-nav-wrapper" role="navigation" aria-label="Navegación del plan">
      <div className="tabs-container" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            id={`${tab.id}-tab`}
            className="tab-button"
            onMouseDown={(e) => {
              e.preventDefault(); // Evita interferencias con onBlur de inputs
              onTabChange(tab.id);
            }}
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {tab.icon}
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {onSave && (
        <div className="tab-actions">
          <button
            onClick={onSave}
            disabled={saveStatus !== 'idle'}
            className={`btn-save-sticky ${saveStatus} ${hasUnsavedChanges ? 'unsaved' : ''}`}
            title={hasUnsavedChanges ? "Tienes cambios sin guardar" : "Guardar cambios"}
          >
            {saveStatus === 'saving' ? (
              <Loader2 size={18} className="spin" aria-hidden="true" />
            ) : saveStatus === 'success' ? (
              <Check size={18} aria-hidden="true" />
            ) : (
              <Save size={18} aria-hidden="true" />
            )}
            
            <span className="save-text">
              {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'success' ? '¡Guardado!' : 'Guardar'}
            </span>

            {hasUnsavedChanges && saveStatus === 'idle' && (
              <span className="unsaved-dot" aria-hidden="true" />
            )}
          </button>
        </div>
      )}
    </nav>
  );
};