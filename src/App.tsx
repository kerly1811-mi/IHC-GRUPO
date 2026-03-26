import React, { useState, Suspense, lazy } from 'react';
import './App.css';
import { useUsabilityApp } from './controllers/useUsabilityApp';
import { TabNavigation } from './components/TabNavigation';
import { Trash2, AlertTriangle, ArrowLeft, Save } from 'lucide-react';

// Lazy loading de vistas para mejorar el Performance inicial
const GlobalDashboard = lazy(() => import('./views/GlobalDashboard').then(module => ({ default: module.GlobalDashboard })));
const PlanView = lazy(() => import('./views/PlanView').then(module => ({ default: module.PlanView })));
const ScriptView = lazy(() => import('./views/ScriptView').then(module => ({ default: module.ScriptView })));
const ObservationsView = lazy(() => import('./views/ObservationsView').then(module => ({ default: module.ObservationsView })));
const FindingsView = lazy(() => import('./views/FindingsView').then(module => ({ default: module.FindingsView })));
const ReportsView = lazy(() => import('./views/ReportsView').then(module => ({ default: module.ReportsView })));

// Spinner pequeño para la carga de componentes lazy
const LazyLoader = () => (
  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
    Cargando sección...
  </div>
);

const App: React.FC = () => {
  const {
    activeTab, setActiveTab,
    selectedPlan, handleGoHome,
    loading, allPlans, allObservations, allFindings,
    testPlan, setTestPlan, handleSavePlan, handleCreateNewPlan, loadFullPlan, handleDeletePlan,
    tasks, setTasks, handleAddTask, handleSaveTask, handleDeleteTask,
    observations, setObservations, handleAddObservation, handleSaveObservation, handleDeleteObservation,
    findings, setFindings, handleAddFinding, handleSaveFinding, handleDeleteFinding,
    hasUnsavedChanges,
  } = useUsabilityApp();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  // Advertencia nativa para cerrar/recargar pestaña
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Requerido por Chrome
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const onManualSave = async () => {
    setSaveStatus('saving');
    await handleSavePlan(testPlan);
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleTryGoHome = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      handleGoHome();
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', height: '100vh', gap: '1rem',
        fontFamily: "'Sora', sans-serif", background: '#f0f4f8',
      }}>
        <div style={{
          width: 48, height: 48, border: '4px solid #e2e8f0',
          borderTopColor: '#003366', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#374151', fontWeight: 600, margin: 0 }}>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="container">

      {/* ══ CABECERA PRINCIPAL ══ */}
      <header className="main-header">
        <h1>Plan de Test de Usabilidad</h1>
        <p>Registra, analiza y mejora la experiencia de tus usuarios.</p>
      </header>

      {/* ══ VISTA: DASHBOARD GLOBAL ════════════════════════════════════════ */}
      {!selectedPlan && (
        <div className="view-transition">
          <Suspense fallback={<LazyLoader />}>
            <GlobalDashboard
              allPlans={allPlans}
              allObservations={allObservations}
              allFindings={allFindings}
              onSelectPlan={loadFullPlan}
              onCreatePlan={handleCreateNewPlan}
              onDeletePlan={handleDeletePlan}
            />
          </Suspense>
        </div>
      )}

      {/* ══ VISTA: DETALLE DE PLAN ═════════════════════════════════════════ */}
      {selectedPlan !== null && (
        <div className="view-transition">
          {/* ... barra de contexto ... */}
          <div
            role="region"
            aria-label="Plan activo"
            className="plan-context-bar"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '1rem 1.25rem',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            {/* Botón volver y nombre del plan */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 300px', minWidth: 0 }}>
              <button
                onMouseDown={(e) => {
                  e.preventDefault(); // Evita que el foco se pierda inmediatamente
                  handleTryGoHome();
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'transparent', color: '#64748b',
                  border: '1px solid #e2e8f0', borderRadius: '8px',
                  padding: '6px 12px', fontWeight: 600, cursor: 'pointer',
                  fontSize: '.8rem', fontFamily: 'inherit', flexShrink: 0,
                  transition: 'all .2s',
                }}
                aria-label="Volver al dashboard principal"
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#003366';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                <ArrowLeft size={14} aria-hidden="true" />
                Volver
              </button>

              {/* Nombre del plan activo */}
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <div style={{
                  fontWeight: 800, color: '#1e293b', fontSize: '1.1rem',
                  wordWrap: 'break-word', overflowWrap: 'break-word',
                  letterSpacing: '-0.02em'
                }}>
                  {testPlan.product || 'Sin nombre de producto'}
                </div>
                {testPlan.module && (
                  <div style={{ fontSize: '.8rem', color: '#64748b', marginTop: 1, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    Módulo: {testPlan.module}
                  </div>
                )}
              </div>

              {/* Borrar plan */}
              {testPlan.id && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  style={{
                    background: 'transparent', border: '1px solid transparent',
                    color: '#94a3b8', cursor: 'pointer', padding: '6px',
                    display: 'flex', alignItems: 'center', borderRadius: '6px',
                    flexShrink: 0, transition: 'all .2s',
                  }}
                  title="Eliminar este plan"
                  aria-label="Eliminar plan actual"
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#dc2626';
                    e.currentTarget.style.background = '#fee2e2';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Pestañas de sección */}
          <main id="main-content" style={{ minHeight: '50vh' }}>
            <TabNavigation 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
              onSave={onManualSave}
              saveStatus={saveStatus}
              hasUnsavedChanges={hasUnsavedChanges}
            />

            <Suspense fallback={<LazyLoader />}>
              {activeTab === 'plan' && (
                <div id="plan-panel" role="tabpanel" aria-labelledby="plan-tab">
                  <PlanView
                    data={testPlan}
                    tasks={tasks}
                    onUpdate={handleSavePlan}
                    onSyncPlan={setTestPlan}
                    onSyncTasks={setTasks}
                    onAddTask={handleAddTask}
                    onSaveTask={handleSaveTask}
                    onDeleteTask={handleDeleteTask}
                  />
                </div>
              )}

              {activeTab === 'script' && (
                <div id="script-panel" role="tabpanel" aria-labelledby="script-tab">
                  <ScriptView
                    testPlan={testPlan}
                    tasks={tasks}
                    onUpdatePlan={handleSavePlan}
                    onSyncPlan={setTestPlan}
                    onSyncTasks={setTasks}
                    onSaveTask={handleSaveTask}
                    onAddTask={handleAddTask}
                    onDeleteTask={handleDeleteTask}
                    onGoToPlan={() => setActiveTab('plan')}
                  />
                </div>
              )}

              {activeTab === 'observations' && (
                <div id="observations-panel" role="tabpanel" aria-labelledby="observations-tab">
                  <ObservationsView
                    data={observations}
                    onSync={setObservations}
                    planId={testPlan.id}
                    productName={testPlan.product}
                    onAdd={handleAddObservation}
                    onSave={handleSaveObservation}
                    onDelete={handleDeleteObservation}
                    onGoToPlan={() => setActiveTab('plan')}
                  />
                </div>
              )}

              {activeTab === 'findings' && (
                <FindingsView
                  data={findings}
                  onSync={setFindings}
                  planId={testPlan.id}
                  productName={testPlan.product}
                  onAdd={handleAddFinding}
                  onSave={handleSaveFinding}
                  onDelete={handleDeleteFinding}
                  onGoToPlan={() => setActiveTab('plan')}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  testPlan={testPlan}
                  tasks={tasks}
                  observations={observations}
                  findings={findings}
                  onGoToPlan={() => setActiveTab('plan')}
                />
              )}
            </Suspense>
          </main>
        </div>
      )}

      {/* ══ MODAL ELIMINAR ══════════════════════════════════════════════════ */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <AlertTriangle size={48} color="#dc2626" style={{ marginBottom: '1rem' }} />
            <h3 className="modal-title">¿Eliminar Plan de Prueba?</h3>
            <p>
              Estás a punto de borrar el plan{' '}
              <strong>"{testPlan.product}"</strong> y todos sus datos asociados
              (tareas, observaciones y hallazgos).
            </p>
            <p style={{ fontWeight: 'bold' }}>Esta acción no se puede deshacer.</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
              <button
                className="btn-confirm-delete"
                onClick={() => {
                  handleDeletePlan(testPlan.id!);
                  setShowDeleteModal(false);
                }}
              >
                Sí, eliminar permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL CAMBIOS SIN GUARDAR ════════════════════════════════════════ */}
      {showUnsavedModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <Save size={48} color="#003366" style={{ marginBottom: '1rem' }} />
            <h3 className="modal-title">Cambios sin guardar</h3>
            <p>
              Tienes cambios pendientes en el plan <strong>"{testPlan.product}"</strong>. 
              Si sales ahora, podrías perder la información que acabas de escribir.
            </p>
            <p style={{ fontWeight: 'bold' }}>¿Deseas salir de todas formas o quedarte a guardar?</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowUnsavedModal(false)}>
                Quedarme aquí
              </button>
              <button
                style={{
                  backgroundColor: '#003366', color: 'white', padding: '12px 24px',
                  borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer'
                }}
                onClick={() => {
                  handleGoHome();
                  setShowUnsavedModal(false);
                }}
              >
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <footer style={{
        marginTop: '3rem', padding: '1rem 0',
        borderTop: '1px solid var(--border)',
        fontSize: '.8rem', textAlign: 'center', color: 'var(--text-muted)',
      }}>
        Grupo 3: Mateo Auz, Kerly Chicaiza, Bryan Quitto, Pedro Supe
      </footer>
    </div>
  );
};

export default App;