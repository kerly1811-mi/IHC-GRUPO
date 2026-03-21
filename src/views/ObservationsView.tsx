import React, { useState } from 'react';
import { Observation, SuccessStatus, Severity } from '../models/types';
import { Trash2, Plus, CheckCircle, RefreshCcw, ClipboardList } from 'lucide-react';

interface ObservationsViewProps {
  data: Observation[];
  onAdd: () => void;
  onSave: (id: string, updates: Partial<Observation>) => void;
  onDelete: (id: string) => void;
  planId?: string;
  productName?: string;
  onGoToPlan: () => void;
}

const severityStyles: Record<string, { bg: string; color: string; border: string }> = {
  Baja: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  Media: { bg: '#fefce8', color: '#854d0e', border: '#fde68a' },
  Alta: { bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' },
  Crítica: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
};

const successStyles: Record<string, { bg: string; color: string; border: string }> = {
  'Sí': { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  'No': { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  'Con ayuda': { bg: '#fefce8', color: '#854d0e', border: '#fde68a' },
};

export const ObservationsView: React.FC<ObservationsViewProps> = ({
  data,
  onAdd,
  onSave,
  onDelete,
  planId,
  productName,
  onGoToPlan,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const isProductEmpty = !productName || productName.trim() === '';

  const handleActionWithStatus = (action: () => void) => {
    setIsSaving(true);
    action();
    setTimeout(() => setIsSaving(false), 800);
  };

  const totalObs = data.length;
  const totalOk = data.filter((o) => o.success_level === 'Sí').length;
  const totalErrors = data.reduce((acc, o) => acc + (o.errors || 0), 0);
  const avgTime = totalObs > 0
    ? Math.round(data.reduce((acc, o) => acc + (o.time_seconds || 0), 0) / totalObs)
    : 0;

  return (
    <div className="dashboard-view">
      {/* ── Encabezado ── */}
      <header
        className="view-header"
        style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <h2>Registro de observación — prueba de usabilidad</h2>
        <div
          aria-live="polite"
          aria-atomic="true"
          style={{ position: 'absolute', right: '1rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
        >
          {isSaving ? (
            <>
              <RefreshCcw size={14} className="spin" aria-hidden="true" />
              <span style={{ color: '#ffffff' }}>Guardando...</span>
            </>
          ) : (
            <>
              <CheckCircle size={14} aria-hidden="true" style={{ color: '#10b981' }} />
              <span style={{ color: '#10b981' }}>Cambios guardados</span>
            </>
          )}
        </div>
      </header>

      <div className="dashboard-content">
        {/* ── Estado vacío ── */}
        {isProductEmpty ? (
          <section className="card" aria-labelledby="obs-empty-heading">
            <div className="card-content" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div
                aria-hidden="true"
                style={{
                  width: '80px', height: '80px', backgroundColor: '#fffbeb',
                  borderRadius: '50%', display: 'flex', justifyContent: 'center',
                  alignItems: 'center', margin: '0 auto 1rem',
                }}
              >
                <ClipboardList size={40} color="#d97706" />
              </div>
              <h3 id="obs-empty-heading" style={{ color: '#1e293b', marginBottom: '0.5rem' }}>
                ¡Falta el nombre del producto!
              </h3>
              <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                Para registrar observaciones, primero debes asignar un nombre al producto
                en la pestaña de Plan.
              </p>
              <button
                type="button"
                onClick={onGoToPlan}
                style={{
                  backgroundColor: '#003366', color: 'white', padding: '12px 24px',
                  borderRadius: '6px', border: '2px solid transparent',
                  fontWeight: 'bold', cursor: 'pointer',
                }}
              >
                Ir a definir Producto
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* ── Tarjetas de resumen (solo si hay datos) ── */}
            {totalObs > 0 && (
              <section aria-labelledby="obs-stats-heading" style={{ marginBottom: '1.5rem' }}>
                <h3 id="obs-stats-heading" className="sr-only">Resumen de observaciones</h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {[
                    { label: 'Observaciones', value: totalObs, color: 'var(--primary)', suffix: '' },
                    { label: 'Tareas exitosas', value: totalOk, color: '#166534', suffix: '' },
                    { label: 'Total errores', value: totalErrors, color: '#dc2626', suffix: '' },
                    { label: 'Tiempo promedio', value: avgTime, color: '#d97706', suffix: 's' },
                  ].map(({ label, value, color, suffix }) => (
                    <div
                      key={label}
                      style={{
                        background: '#fff', border: '1px solid var(--border)',
                        borderRadius: '8px', padding: '1.25rem 1rem', textAlign: 'center',
                        borderTop: `4px solid ${color}`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {label}
                      </p>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '2rem', fontWeight: 800, color }}>
                        {value}{suffix}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Tabla principal ── */}
            <section className="card" aria-labelledby="obs-tabla-heading">
              <h3 className="card-title" id="obs-tabla-heading">
                Observaciones registradas
              </h3>

              <div className="data-table-container">
                <table
                  className="data-table"
                  style={{ minWidth: '1400px' }}
                >
                  <caption className="sr-only">Registro de observaciones de prueba de usabilidad</caption>
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: '90px' }}>Participante</th>
                      <th scope="col" style={{ width: '140px' }}>Perfil</th>
                      <th scope="col" style={{ width: '70px' }}>Tarea</th>
                      <th scope="col" style={{ width: '110px' }}>Éxito</th>
                      <th scope="col" style={{ width: '90px' }}>Tiempo (s)</th>
                      <th scope="col" style={{ width: '70px' }}>Errores</th>
                      <th scope="col">Comentarios clave</th>
                      <th scope="col">Problema detectado</th>
                      <th scope="col" style={{ width: '110px' }}>Severidad</th>
                      <th scope="col">Mejora propuesta</th>
                      <th scope="col" style={{ width: '60px' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length > 0 ? (
                      data.map((obs) => {
                        const sStyle = severityStyles[obs.severity] || severityStyles['Baja'];
                        const okStyle = successStyles[obs.success_level] || successStyles['Sí'];
                        return (
                          <tr key={obs.id}>
                            {/* Participante */}
                            <td>
                              <label htmlFor={`obs-participant-${obs.id}`} className="sr-only">
                                Participante
                              </label>
                              <input
                                id={`obs-participant-${obs.id}`}
                                type="text"
                                defaultValue={obs.participant}
                                onBlur={(e) =>
                                  handleActionWithStatus(() =>
                                    onSave(obs.id!, { participant: e.target.value })
                                  )
                                }
                                placeholder="Ej. P1"
                              />
                            </td>

                            {/* Perfil */}
                            <td>
                              <label htmlFor={`obs-profile-${obs.id}`} className="sr-only">
                                Perfil del participante
                              </label>
                              <input
                                id={`obs-profile-${obs.id}`}
                                type="text"
                                defaultValue={obs.profile}
                                onBlur={(e) =>
                                  handleActionWithStatus(() =>
                                    onSave(obs.id!, { profile: e.target.value })
                                  )
                                }
                                placeholder="Ej. Estudiante 3er nivel"
                              />
                            </td>

                            {/* Tarea */}
                            <td>
                              <label htmlFor={`obs-taskref-${obs.id}`} className="sr-only">
                                Referencia de tarea
                              </label>
                              <input
                                id={`obs-taskref-${obs.id}`}
                                type="text"
                                defaultValue={obs.task_ref}
                                onBlur={(e) =>
                                  handleActionWithStatus(() =>
                                    onSave(obs.id!, { task_ref: e.target.value })
                                  )
                                }
                                placeholder="T1"
                              />
                            </td>

                            {/* Éxito */}
                            <td>
                              <label htmlFor={`obs-success-${obs.id}`} className="sr-only">
                                Nivel de éxito
                              </label>
                              <select
                                id={`obs-success-${obs.id}`}
                                defaultValue={obs.success_level}
                                onChange={(e) =>
                                  handleActionWithStatus(() =>
                                    onSave(obs.id!, { success_level: e.target.value as SuccessStatus })
                                  )
                                }
                                style={{
                                  backgroundColor: okStyle.bg,
                                  color: okStyle.color,
                                  border: `1px solid ${okStyle.border}`,
                                  fontWeight: 600,
                                }}
                              >
                                <option value="Sí">Sí</option>
                                <option value="No">No</option>
                                <option value="Con ayuda">Con ayuda</option>
                              </select>
                            </td>

                            {/* Tiempo */}
                            <td>
                              <label htmlFor={`obs-time-${obs.id}`} className="sr-only">
                                Tiempo en segundos
                              </label>
                              <input
                                id={`obs-time-${obs.id}`}
                                type="number"
                                min="0"
                                defaultValue={obs.time_seconds}
                                onBlur={(e) =>
                                  handleActionWithStatus(() =>
                                    onSave(obs.id!, { time_seconds: parseInt(e.target.value) || 0 })
                                  )
                                }
                                placeholder="0"
                              />
                            </td>

                            {/* Errores */}
                            <td>
                              <label htmlFor={`obs-errors-${obs.id}`} className="sr-only">
                                Número de errores
                              </label>
                              <input
                                id={`obs-errors-${obs.id}`}
                                type="number"
                                min="0"
                                defaultValue={obs.errors}
                                onBlur={(e) =>
                                  handleActionWithStatus(() =>
                                    onSave(obs.id!, { errors: parseInt(e.target.value) || 0 })
                                  )
                                }
                                placeholder="0"
                              />
                            </td>

                            {/* Comentarios */}
                            <td>
                              <label htmlFor={`obs-comments-${obs.id}`} className="sr-only">
                                Comentarios clave
                              </label>
                              <textarea
                                id={`obs-comments-${obs.id}`}
                                defaultValue={obs.comments}
                                onBlur={(e) =>
                                  handleActionWithStatus(() =>
                                    onSave(obs.id!, { comments: e.target.value })
                                  )
                                }
                                placeholder="Ej. Dudó entre 'Notas' y 'Rendimiento'"
                                rows={3}
                              />
                            </td>

                            {/* Problema */}
                            <td>
                              <label htmlFor={`obs-problem-${obs.id}`} className="sr-only">
                                Problema detectado
                              </label>
                              <textarea
                                id={`obs-problem-${obs.id}`}
                                defaultValue={obs.problem}
                                onBlur={(e) =>
                                  handleActionWithStatus(() =>
                                    onSave(obs.id!, { problem: e.target.value })
                                  )
                                }
                                placeholder="Ej. Nombre del menú no es claro"
                                rows={3}
                              />
                            </td>

                            {/* Severidad */}
                            <td>
                              <label htmlFor={`obs-severity-${obs.id}`} className="sr-only">
                                Severidad del problema
                              </label>
                              <select
                                id={`obs-severity-${obs.id}`}
                                defaultValue={obs.severity}
                                onChange={(e) =>
                                  handleActionWithStatus(() =>
                                    onSave(obs.id!, { severity: e.target.value as Severity })
                                  )
                                }
                                style={{
                                  backgroundColor: sStyle.bg,
                                  color: sStyle.color,
                                  border: `1px solid ${sStyle.border}`,
                                  fontWeight: 600,
                                }}
                              >
                                <option value="Baja">Baja</option>
                                <option value="Media">Media</option>
                                <option value="Alta">Alta</option>
                                <option value="Crítica">Crítica</option>
                              </select>
                            </td>

                            {/* Mejora propuesta */}
                            <td>
                              <label htmlFor={`obs-proposal-${obs.id}`} className="sr-only">
                                Mejora propuesta
                              </label>
                              <textarea
                                id={`obs-proposal-${obs.id}`}
                                defaultValue={obs.proposal}
                                onBlur={(e) =>
                                  handleActionWithStatus(() =>
                                    onSave(obs.id!, { proposal: e.target.value })
                                  )
                                }
                                placeholder="Ej. Renombrar el menú a 'Notas'"
                                rows={3}
                              />
                            </td>

                            {/* Eliminar */}
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="btn-delete"
                                onClick={() => onDelete(obs.id!)}
                                aria-label={`Eliminar observación de ${obs.participant || 'participante'} en tarea ${obs.task_ref || ''}`}
                              >
                                <Trash2 size={18} aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={11}
                          style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}
                        >
                          No hay observaciones registradas. Haz clic en el botón de abajo para empezar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn-add"
                  onClick={onAdd}
                  disabled={!planId}
                  aria-label="Añadir nueva observación"
                >
                  <Plus size={18} aria-hidden="true" />
                  Añadir Observación
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};