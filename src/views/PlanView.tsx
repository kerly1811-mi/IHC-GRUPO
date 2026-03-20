// src/views/PlanView.tsx
import React from 'react';
import { TestPlan, TestTask } from '../models/types';
import { Plus, Trash2 } from 'lucide-react';

interface PlanViewProps {
  data: TestPlan;
  onUpdate: (updates: Partial<TestPlan>) => void;
  onAddTask: () => void;
  onUpdateTask: (id: string, updates: Partial<TestTask>) => void;
  onDeleteTask: (id: string) => void;
}

export const PlanView: React.FC<PlanViewProps> = ({ data, onUpdate, onAddTask, onUpdateTask, onDeleteTask }) => {
  return (
    <div 
      id="plan-panel" 
      role="tabpanel" 
      aria-labelledby="plan-tab"
      className="dashboard-view"
    >
      <header className="view-header">
        <h2>Usability Test Plan Dashboard</h2>
      </header>

      <div className="dashboard-content">
        {/* 1. Contexto General */}
        <section className="card">
          <h3 className="card-title">1. Contexto general</h3>
          <div className="card-content">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="product">Producto / servicio:</label>
                <input 
                  id="product" 
                  type="text" 
                  value={data.product} 
                  onChange={(e) => onUpdate({ product: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label htmlFor="module">Pantalla / módulo:</label>
                <input 
                  id="module" 
                  type="text" 
                  value={data.module} 
                  onChange={(e) => onUpdate({ module: e.target.value })} 
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="objective">Objetivo del test:</label>
                <textarea 
                  id="objective" 
                  value={data.objective} 
                  onChange={(e) => onUpdate({ objective: e.target.value })} 
                  rows={3}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Tareas del Test */}
        <section className="card">
          <h3 className="card-title">2. Tareas del test</h3>
          <div className="data-table-container">
            <table className="data-table" aria-label="Listado de tareas del plan de prueba">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '40px' }}>ID</th>
                  <th scope="col">Escenario / tarea</th>
                  <th scope="col">Resultado esperado</th>
                  <th scope="col">Métrica principal</th>
                  <th scope="col">Criterio de éxito</th>
                  <th scope="col" style={{ width: '50px' }}>Borrar</th>
                </tr>
              </thead>
              <tbody>
                {data.tasks.map((task) => (
                  <tr key={task.id}>
                    <td style={{ textAlign: 'center' }}><strong>{task.id}</strong></td>
                    <td>
                      <input 
                        type="text" 
                        aria-label={`Escenario para tarea ${task.id}`} 
                        value={task.scenario || ''}
                        onChange={(e) => onUpdateTask(task.id, { scenario: e.target.value })}
                        placeholder="Escenario..."
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        aria-label={`Resultado esperado para tarea ${task.id}`} 
                        value={task.expectedResult || ''}
                        onChange={(e) => onUpdateTask(task.id, { expectedResult: e.target.value })}
                        placeholder="Resultado..."
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        aria-label={`Métrica principal para tarea ${task.id}`} 
                        value={task.mainMetric || ''}
                        onChange={(e) => onUpdateTask(task.id, { mainMetric: e.target.value })}
                        placeholder="Métrica..."
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        aria-label={`Criterio de éxito para tarea ${task.id}`} 
                        value={task.successCriteria || ''}
                        onChange={(e) => onUpdateTask(task.id, { successCriteria: e.target.value })}
                        placeholder="Criterio..."
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-delete" 
                        onClick={() => onDeleteTask(task.id)}
                        aria-label={`Eliminar tarea ${task.id}`}
                        type="button"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '1rem' }}>
            <button 
              type="button"
              className="btn-add" 
              onClick={onAddTask}
            >
              <Plus size={18} /> Añadir Tarea
            </button>
          </div>
        </section>

        {/* 3. Roles y Logística */}
        <section className="card">
          <h3 className="card-title">3. Roles y logística</h3>
          <div className="card-content">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="moderator">Moderador:</label>
                <input id="moderator" type="text" value={data.moderator} onChange={(e) => onUpdate({ moderator: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="observer">Observador / note taker:</label>
                <input id="observer" type="text" value={data.observer} onChange={(e) => onUpdate({ observer: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="tools">Herramienta / prototipo:</label>
                <input id="tools" type="text" value={data.tools} onChange={(e) => onUpdate({ tools: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="link">Enlace / archivo:</label>
                <input id="link" type="text" value={data.link} onChange={(e) => onUpdate({ link: e.target.value })} />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Notas del moderador */}
        <section className="card">
          <h3 className="card-title">4. Notas del moderador</h3>
          <div className="card-content">
            <div className="form-group">
              <label htmlFor="moderatorNotes">Instrucciones, riesgos o sesgos a evitar:</label>
              <textarea 
                id="moderatorNotes" 
                placeholder="Escribe aquí recordatorios..."
                value={data.moderatorNotes} 
                onChange={(e) => onUpdate({ moderatorNotes: e.target.value })} 
                rows={4}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
