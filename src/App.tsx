// src/App.tsx
import React from 'react';
import './styles/theme.css';
import './styles/App.css';
import { useUsabilityApp } from './controllers/useUsabilityApp';
import { TabNavigation } from './components/TabNavigation';
import { PlanView } from './views/PlanView';

const App: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    testPlan, 
    handleUpdatePlan, 
    handleAddTask, 
    handleUpdateTask,
    handleDeleteTask
  } = useUsabilityApp();

  return (
    <div className="container">
      <header className="main-header">
        <h1>Usability Hub & Monitoring</h1>
        <p>Plataforma para la gestión de pruebas de usabilidad y seguimiento de mejoras bajo estándares WCAG.</p>
      </header>

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main>
        {activeTab === 'plan' && (
          <PlanView 
            data={testPlan} 
            onUpdate={handleUpdatePlan} 
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
        
        {activeTab === 'script' && (
          <section id="script-panel" role="tabpanel" aria-labelledby="script-tab">
            <h2>Guion de moderación y tareas</h2>
            <p>(Cargando contenido basado en Guion y tareas.jpg...)</p>
          </section>
        )}

        {activeTab === 'observations' && (
          <section id="observations-panel" role="tabpanel" aria-labelledby="observations-tab">
            <h2>Registro de observación</h2>
            <p>(Cargando contenido basado en Registro y observacion.jpg...)</p>
          </section>
        )}

        {activeTab === 'findings' && (
          <section id="findings-panel" role="tabpanel" aria-labelledby="findings-tab">
            <h2>Hallazgos y Mejoras</h2>
            <p>(Cargando contenido basado en Hallazgos y mejoras.jpg...)</p>
          </section>
        )}
      </main>
      
      <footer style={{ marginTop: '3rem', padding: '1rem 0', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', textAlign: 'center' }}>
        Diseñado bajo estándares WCAG 2.1 (AA) para accesibilidad web.
      </footer>
    </div>
  );
};

export default App;
