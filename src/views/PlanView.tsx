import React, { useState, useEffect } from 'react';
import { TestPlan, TestTask } from '../models/types';
import { Plus, Trash2, CheckCircle, RefreshCcw } from 'lucide-react';

interface PlanViewProps {
  data: TestPlan;
  tasks: TestTask[];
  onUpdate: (updates: TestPlan) => void;
  onAddTask: () => void;
  onSaveTask: (id: string, updates: Partial<TestTask>) => void;
  onDeleteTask: (id: string) => void;
}

export const PlanView: React.FC<PlanViewProps> = ({ data, tasks, onUpdate, onAddTask, onSaveTask, onDeleteTask }) => {
  const [localPlan, setLocalPlan] = useState<TestPlan>(data);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalPlan(data);
  }, [data]);

  const handleAutoSave = (fieldUpdates: Partial<TestPlan>) => {
    setIsSaving(true);
    const updatedPlan = { ...localPlan, ...fieldUpdates };
    onUpdate(updatedPlan);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleChange = (updates: Partial<TestPlan>) => {
    setLocalPlan(prev => ({ ...prev, ...updates }));
  };

  const isProductEmpty = !localPlan.product || localPlan.product.trim() === '';

  return (
    <div id="plan-panel" className="dashboard-view">
      <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', padding: '1rem' }}>
        <h2 style={{ margin: 0, flex: '1 1 300px', textAlign: 'center' }}>Panel del Plan de Pruebas de Usabilidad</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', flexShrink: 0, margin: '0 auto' }}>
          {isSaving ? (
            <span style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <RefreshCcw size={14} className="spin" /> Guardando...
            </span>
          ) : (
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle size={14} /> Cambios guardados
            </span>
          )}
        </div>
      </header>

      <div className="dashboard-content">
        <section className="card">
          <h3 className="card-title">1. Contexto general</h3>
          <div className="card-content">
            <div className="row-2">
              <div className="form-group">
                <label htmlFor="product-name">
                  Producto / servicio: 
                  {isProductEmpty && <span style={{ color: '#d97706', marginLeft: '5px', fontSize: '0.8rem' }}>(Obligatorio)</span>}
                </label>
                <input 
                  id="product-name"
                  type="text" 
                  value={localPlan.product} 
                  placeholder="Ej: App de Delivery 'Rápido', E-commerce, etc."
                  style={{ 
                    border: isProductEmpty ? '2px solid #fbbf24' : '1px solid var(--border)',
                    backgroundColor: isProductEmpty ? '#fffbeb' : 'white'
                  }}
                  onChange={(e) => handleChange({ product: e.target.value })} 
                  onBlur={(e) => handleAutoSave({ product: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="module-name">Pantalla / módulo:</label>
                <input 
                  id="module-name"
                  type="text" 
                  value={localPlan.module} 
                  placeholder="Ej: Proceso de checkout, Registro de usuario, etc."
                  onChange={(e) => handleChange({ module: e.target.value })} 
                  onBlur={(e) => handleAutoSave({ module: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="test-objective">Objetivo del test:</label>
              <textarea 
                id="test-objective"
                value={localPlan.objective} 
                placeholder="Ej: Evaluar la facilidad de navegación y el tiempo de completado del flujo de compra."
                onChange={(e) => handleChange({ objective: e.target.value })} 
                onBlur={(e) => handleAutoSave({ objective: e.target.value })}
                rows={2} 
              />
            </div>
            <div className="form-group">
              <label htmlFor="user-profile">Perfil de usuarios:</label>
              <input 
                id="user-profile"
                type="text" 
                value={localPlan.user_profile} 
                placeholder="Ej: Usuarios de 25-40 años, con experiencia en compras online."
                onChange={(e) => handleChange({ user_profile: e.target.value })} 
                onBlur={(e) => handleAutoSave({ user_profile: e.target.value })}
              />
            </div>
            <div className="row-2">
              <div className="form-group">
                <label htmlFor="test-method">Método:</label>
                <input 
                  id="test-method"
                  type="text" 
                  value={localPlan.method} 
                  placeholder="Ej: Moderado, remoto, presencial..."
                  onChange={(e) => handleChange({ method: e.target.value })} 
                  onBlur={(e) => handleAutoSave({ method: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="test-duration">Duración:</label>
                <input 
                  id="test-duration"
                  type="text" 
                  value={localPlan.duration} 
                  placeholder="Ej: 45 min por sesión."
                  onChange={(e) => handleChange({ duration: e.target.value })} 
                  onBlur={(e) => handleAutoSave({ duration: e.target.value })}
                />
              </div>
            </div>
            <div className="row-2">
              <div className="form-group">
                <label htmlFor="test-date">Fecha:</label>
                <input 
                  id="test-date"
                  type="text" 
                  value={localPlan.test_date} 
                  placeholder="Ej: 15 de Mayo, 2024"
                  onChange={(e) => handleChange({ test_date: e.target.value })} 
                  onBlur={(e) => handleAutoSave({ test_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="location-channel">Lugar / canal:</label>
                <input 
                  id="location-channel"
                  type="text" 
                  value={localPlan.location_channel} 
                  placeholder="Ej: Google Meet, Oficina 302..."
                  onChange={(e) => handleChange({ location_channel: e.target.value })} 
                  onBlur={(e) => handleAutoSave({ location_channel: e.target.value })}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <h3 className="card-title">2. Tareas del test</h3>
          <div className="data-table-container">
            <table className="data-table">
              <caption className="sr-only">Listado de tareas detalladas para la prueba de usabilidad</caption>
              <thead>
                <tr>
                  <th scope="col" style={{ width: '50px' }}>ID</th>
                  <th scope="col">Escenario / tarea</th>
                  <th scope="col">Resultado esperado</th>
                  <th scope="col">Métrica principal</th>
                  <th scope="col">Criterio de éxito</th>
                  <th scope="col" style={{ width: '80px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <tr key={task.id}>
                      <td style={{ textAlign: 'center' }}>
                        <span className="id-badge">{task.task_index}</span>
                      </td>
                      <td>
                        <input 
                          type="text" 
                          aria-label={`Escenario para ${task.task_index}`}
                          defaultValue={task.scenario} 
                          placeholder="Ej: Imagina que quieres comprar..."
                          onBlur={(e) => onSaveTask(task.id!, { scenario: e.target.value })} 
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          aria-label={`Resultado esperado para ${task.task_index}`}
                          defaultValue={task.expected_result} 
                          placeholder="Ej: El usuario llega a la confirmación."
                          onBlur={(e) => onSaveTask(task.id!, { expected_result: e.target.value })} 
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          aria-label={`Métrica para ${task.task_index}`}
                          defaultValue={task.main_metric} 
                          placeholder="Ej: Tiempo, Tasa de éxito..."
                          onBlur={(e) => onSaveTask(task.id!, { main_metric: e.target.value })} 
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          aria-label={`Criterio de éxito para ${task.task_index}`}
                          defaultValue={task.success_criteria} 
                          placeholder="Ej: Sin errores críticos..."
                          onBlur={(e) => onSaveTask(task.id!, { success_criteria: e.target.value })} 
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn-delete" 
                          onClick={() => onDeleteTask(task.id!)}
                          type="button"
                          aria-label={`Eliminar ${task.task_index}`}
                        >
                          <Trash2 size={20} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No hay tareas añadidas. Haz clic en el botón de abajo para empezar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              type="button"
              className="btn-add" 
              onClick={onAddTask}
              disabled={!localPlan.id || isProductEmpty}
            >
              <Plus size={18} aria-hidden="true" /> Añadir Tarea
            </button>
            {isProductEmpty && (
              <span style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>
                * Debes definir un nombre de producto para añadir tareas.
              </span>
            )}
          </div>
        </section>

        <section className="card">
          <h3 className="card-title">3. Roles y logística</h3>
          <div className="card-content">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="moderator-name">Moderador:</label>
                <input id="moderator-name" type="text" value={localPlan.moderator} placeholder="Nombre del facilitador" onChange={(e) => handleChange({ moderator: e.target.value })} onBlur={(e) => handleAutoSave({ moderator: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="observer-name">Observador:</label>
                <input id="observer-name" type="text" value={localPlan.observer} placeholder="Nombre del que toma notas" onChange={(e) => handleChange({ observer: e.target.value })} onBlur={(e) => handleAutoSave({ observer: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="tools-used">Herramientas:</label>
                <input id="tools-used" type="text" value={localPlan.tools} placeholder="Ej: Figma, Zoom, Maze..." onChange={(e) => handleChange({ tools: e.target.value })} onBlur={(e) => handleAutoSave({ tools: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="project-link">Enlace:</label>
                <input id="project-link" type="text" value={localPlan.link} placeholder="https://figma.com/proto/..." onChange={(e) => handleChange({ link: e.target.value })} onBlur={(e) => handleAutoSave({ link: e.target.value })} />
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <h3 className="card-title">4. Notas del moderador</h3>
          <div className="card-content">
            <label htmlFor="moderator-notes" className="sr-only">Notas adicionales del moderador</label>
            <textarea 
              id="moderator-notes"
              value={localPlan.moderator_notes} 
              onChange={(e) => handleChange({ moderator_notes: e.target.value })} 
              onBlur={(e) => handleAutoSave({ moderator_notes: e.target.value })}
              rows={3} 
              placeholder="Ej: Recordar pedir al usuario que piense en voz alta..."
            />
          </div>
        </section>
      </div>
    </div>
  );
};