import React from 'react';
import { Observation } from '../models/types';
import { Trash2, Plus } from 'lucide-react';

interface ObservationsViewProps {
  data: Observation[];
  onAdd: () => void;
  onSave: (id: string, updates: Partial<Observation>) => void;
  onDelete: (id: string) => void;
  planId?: string;
}

export const ObservationsView: React.FC<ObservationsViewProps> = ({ data, onAdd, onSave, onDelete, planId }) => {
  return (
    <div id="observations-panel" className="dashboard-view">
      <header className="view-header">
        <h2>Registro de observación - prueba de usabilidad</h2>
      </header>
      <section className="card">
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Participante</th>
                <th style={{ width: '150px' }}>Perfil</th>
                <th style={{ width: '80px' }}>Tarea</th>
                <th style={{ width: '120px' }}>Éxito</th>
                <th style={{ width: '100px' }}>Tiempo (seg)</th>
                <th style={{ width: '80px' }}>Errores</th>
                <th>Comentarios clave</th>
                <th>Problema detectado</th>
                <th style={{ width: '120px' }}>Severidad</th>
                <th>Mejora propuesta</th>
                <th style={{ width: '60px' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {data.map((obs) => (
                <tr key={obs.id}>
                  <td><input defaultValue={obs.participant} onBlur={(e) => onSave(obs.id!, { participant: e.target.value })} placeholder="Ej. P1" /></td>
                  <td><input defaultValue={obs.profile} onBlur={(e) => onSave(obs.id!, { profile: e.target.value })} placeholder="Ej. Estudiante 3er nivel" /></td>
                  <td><input defaultValue={obs.task_ref} onBlur={(e) => onSave(obs.id!, { task_ref: e.target.value })} placeholder="Ej. T1" /></td>
                  <td>
                    <select defaultValue={obs.success_level} onChange={(e) => onSave(obs.id!, { success_level: e.target.value as any })}>
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                      <option value="Con ayuda">Con ayuda</option>
                    </select>
                  </td>
                  <td><input type="number" defaultValue={obs.time_seconds} onBlur={(e) => onSave(obs.id!, { time_seconds: parseInt(e.target.value) || 0 })} placeholder="12" /></td>
                  <td><input type="number" defaultValue={obs.errors} onBlur={(e) => onSave(obs.id!, { errors: parseInt(e.target.value) || 0 })} placeholder="1" /></td>
                  <td><textarea defaultValue={obs.comments} onBlur={(e) => onSave(obs.id!, { comments: e.target.value })} placeholder="Ej. Dudó entre 'Notas' y 'Rendimiento'" /></td>
                  <td><textarea defaultValue={obs.problem} onBlur={(e) => onSave(obs.id!, { problem: e.target.value })} placeholder="Ej. Nombre del menú no es claro" /></td>
                  <td>
                    <select defaultValue={obs.severity} onChange={(e) => onSave(obs.id!, { severity: e.target.value as any })}>
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                      <option value="Crítica">Crítica</option>
                    </select>
                  </td>
                  <td><textarea defaultValue={obs.proposal} onBlur={(e) => onSave(obs.id!, { proposal: e.target.value })} placeholder="Ej. Renombrar el menú a 'Notas'" /></td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-delete" onClick={() => onDelete(obs.id!)} type="button">
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '1rem' }}>
          <button className="btn-add" onClick={onAdd} disabled={!planId} type="button">
            <Plus size={18} /> Añadir Observación
          </button>
        </div>
      </section>
    </div>
  );
};