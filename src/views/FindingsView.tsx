import React from 'react';
import { Finding } from '../models/types';
import { Trash2, Plus } from 'lucide-react';

interface FindingsViewProps {
  data: Finding[];
  onAdd: () => void;
  onSave: (id: string, updates: Partial<Finding>) => void;
  onDelete: (id: string) => void;
  planId?: string;
}

export const FindingsView: React.FC<FindingsViewProps> = ({ data, onAdd, onSave, onDelete, planId }) => {
  return (
    <div id="findings-panel" className="dashboard-view">
      <header className="view-header">
        <h2>Síntesis de hallazgos y plan de mejora</h2>
      </header>
      <section className="card">
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Problema</th>
                <th>Evidencia observada</th>
                <th style={{ width: '100px' }}>Frecuencia</th>
                <th style={{ width: '120px' }}>Severidad</th>
                <th>Recomendación</th>
                <th style={{ width: '120px' }}>Prioridad</th>
                <th style={{ width: '130px' }}>Estado</th>
                <th style={{ width: '60px' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {data.map((f) => (
                <tr key={f.id}>
                  <td><textarea defaultValue={f.problem} onBlur={(e) => onSave(f.id!, { problem: e.target.value })} placeholder="Ej. Menú 'Rendimiento' no comunica que contiene notas" /></td>
                  <td><textarea defaultValue={f.evidence} onBlur={(e) => onSave(f.id!, { evidence: e.target.value })} placeholder="Ej. 4 de 5 usuarios dudaron o entraron al segundo intento" /></td>
                  <td><input defaultValue={f.frequency} onBlur={(e) => onSave(f.id!, { frequency: e.target.value })} placeholder="Ej. 4/5" /></td>
                  <td>
                    <select defaultValue={f.severity} onChange={(e) => onSave(f.id!, { severity: e.target.value as any })}>
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                      <option value="Crítica">Crítica</option>
                    </select>
                  </td>
                  <td><textarea defaultValue={f.recommendation} onBlur={(e) => onSave(f.id!, { recommendation: e.target.value })} placeholder="Ej. Cambiar etiqueta a 'Notas'" /></td>
                  <td>
                    <select defaultValue={f.priority} onChange={(e) => onSave(f.id!, { priority: e.target.value as any })}>
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                    </select>
                  </td>
                  <td>
                    <select defaultValue={f.status} onChange={(e) => onSave(f.id!, { status: e.target.value as any })}>
                      <option value="Pendiente">Pendiente</option>
                      <option value="En progreso">En progreso</option>
                      <option value="Resuelto">Resuelto</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-delete" onClick={() => onDelete(f.id!)} type="button">
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
            <Plus size={18} /> Añadir Hallazgo
          </button>
        </div>
      </section>
    </div>
  );
};