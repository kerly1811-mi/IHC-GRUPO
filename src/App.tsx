import React, { useState } from 'react';
import './App.css';
import { useUsabilityApp } from './controllers/useUsabilityApp';
import { TabNavigation } from './components/TabNavigation';
import { PlanView } from './views/PlanView';
import { ScriptView } from './views/ScriptView';
import { ObservationsView } from './views/ObservationsView';
import { FindingsView } from './views/FindingsView';
import { Trash2, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const { 
    activeTab, setActiveTab, loading, allPlans,
    testPlan, handleSavePlan, handleCreateNewPlan, loadFullPlan, handleDeletePlan,
    tasks, handleAddTask, handleSaveTask, handleDeleteTask,
    observations, handleAddObservation, handleSaveObservation, handleDeleteObservation,
    findings, handleAddFinding, handleSaveFinding, handleDeleteFinding
  } = useUsabilityApp();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <p>Cargando datos desde Supabase...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="main-header">
        <h1>Gestión de planes de usabilidad</h1>
        <p>Plataforma para la gestión de pruebas de usabilidad.</p>
      </header>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.2rem', 
        backgroundColor: '#f8fafc', 
        borderRadius: '10px', 
        marginBottom: '1.5rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <label htmlFor="plan-selector" style={{ fontWeight: 'bold', color: '#1e293b' }}>Plan Actual:</label>
          <select 
            id="plan-selector"
            value={testPlan.id || ''} 
            onChange={(e) => {
              const selected = allPlans.find(p => p.id === e.target.value);
              if (selected) loadFullPlan(selected);
            }}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '300px', backgroundColor: 'white' }}
          >
            <option value="" disabled>-- Selecciona un plan --</option>
            {allPlans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.product || 'Sin nombre'} ({new Date(plan.created_at!).toLocaleDateString()})
              </option>
            ))}
          </select>
          
          {testPlan.id && (
            <button 
              onClick={() => setShowDeleteModal(true)}
              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '5px' }}
              title="Eliminar este plan"
            >
              <Trash2 size={22} />
            </button>
          )}
        </div>
        
        <button 
          onClick={handleCreateNewPlan}
          style={{ backgroundColor: '#0f172a', color: 'white', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', border: 'none' }}
        >
          + Crear Nuevo Plan
        </button>
      </div>

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main style={{ minHeight: '60vh' }}>
        {activeTab === 'plan' && (
          <PlanView 
            data={testPlan} 
            tasks={tasks}
            onUpdate={handleSavePlan} 
            onAddTask={handleAddTask}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
        
        {activeTab === 'script' && (
          <ScriptView 
            testPlan={testPlan}
            tasks={tasks}
            onUpdatePlan={handleSavePlan}
            onSaveTask={handleSaveTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {activeTab === 'observations' && (
          <ObservationsView 
            data={observations}
            planId={testPlan.id}
            onAdd={handleAddObservation}
            onSave={handleSaveObservation}
            onDelete={handleDeleteObservation}
          />
        )}

        {activeTab === 'findings' && (
          <FindingsView 
            data={findings}
            planId={testPlan.id}
            onAdd={handleAddFinding}
            onSave={handleSaveFinding}
            onDelete={handleDeleteFinding}
          />
        )}
      </main>

      {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <AlertTriangle size={48} color="#dc2626" style={{ marginBottom: '1rem' }} />
            <h3 className="modal-title">¿Eliminar Plan de Prueba?</h3>
            <p>Estás a punto de borrar el plan <strong>"{testPlan.product}"</strong> y todos sus datos asociados (tareas, observaciones y hallazgos).</p>
            <p style={{ fontWeight: 'bold' }}>Esta acción no se puede deshacer.</p>
            
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
              <button className="btn-confirm-delete" onClick={() => {
                handleDeletePlan(testPlan.id!);
                setShowDeleteModal(false);
              }}>
                Sí, eliminar permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
      
      <footer style={{ marginTop: '3rem', padding: '1rem 0', borderTop: '1px solid var(--border)', fontSize: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Grupo 3: Mateo Auz, Kerly Chicaiza, Bryan Quitto, Pedro Supe
      </footer>
    </div>
  );
};

export default App;