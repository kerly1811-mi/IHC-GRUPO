// src/components/TabNavigation.tsx
import React from 'react';
import { DashboardTab } from '../controllers/useUsabilityApp';
import { ClipboardList, FileText, Search, BarChart } from 'lucide-react';

interface TabNavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'plan', label: 'Plan de Prueba', icon: <ClipboardList size={18} aria-hidden="true" /> },
    { id: 'script', label: 'Guion y Tareas', icon: <FileText size={18} aria-hidden="true" /> },
    { id: 'observations', label: 'Registro Observación', icon: <Search size={18} aria-hidden="true" /> },
    { id: 'findings', label: 'Hallazgos y Mejoras', icon: <BarChart size={18} aria-hidden="true" /> },
  ];

  return (
    <nav className="tabs-container" role="tablist" aria-label="Dashboards de usabilidad">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`${tab.id}-panel`}
          id={`${tab.id}-tab`}
          className="tab-button"
          onClick={() => onTabChange(tab.id)}
          tabIndex={activeTab === tab.id ? 0 : -1}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {tab.icon}
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
};
