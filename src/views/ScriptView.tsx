import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, RefreshCcw, ClipboardList } from 'lucide-react';
import { TestPlan, TestTask, ClosingQuestion } from '../models/types';

interface ScriptViewProps {
  testPlan: TestPlan;
  tasks: TestTask[];
  onUpdatePlan: (updates: TestPlan) => void;
  onSaveTask: (id: string, updates: Partial<TestTask>) => void;
  onAddTask: () => void;
  onDeleteTask: (id: string) => void;
  onGoToPlan: () => void;
}

export const ScriptView: React.FC<ScriptViewProps> = ({
  testPlan,
  tasks,
  onSaveTask,
  onAddTask,
  onDeleteTask,
  onUpdatePlan,
  onGoToPlan,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const isProductEmpty = !testPlan.product || testPlan.product.trim() === '';

  const handleActionWithStatus = (action: () => void) => {
    setIsSaving(true);
    action();
    setTimeout(() => setIsSaving(false), 800);
  };

  const openingSteps = [
    'Agradece la participación.',
    'Explica que se evalúa la interfaz, no a la persona.',
    'Pide que piense en voz alta.',
    'Lee una tarea a la vez.',
    'Evita ayudar salvo bloqueo total.',
  ];

  const handleUpdateClosingAnswer = (index: number, answer: string) => {
    const newQuestions = [...(testPlan.closing_questions || [])];
    newQuestions[index] = { ...newQuestions[index], answer };
    handleActionWithStatus(() =>
      onUpdatePlan({ ...testPlan, closing_questions: newQuestions })
    );
  };

  return (
    <div className="dashboard-view">
      {/* ── Encabezado ── */}
      <header
        className="view-header"
        style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <h2>Guion de moderación y tareas</h2>
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
          <section className="card" aria-labelledby="script-empty-heading">
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
              <h3 id="script-empty-heading" style={{ color: '#1e293b', marginBottom: '0.5rem' }}>
                ¡Falta el nombre del producto!
              </h3>
              <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                Para redactar el guion y las tareas, primero debes asignar un nombre al
                producto en la pestaña de Plan.
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
            {/* ── 1. Inicio de la sesión ── */}
            <section className="card" aria-labelledby="script-inicio-heading">
              <h3 className="card-title" id="script-inicio-heading">
                Inicio de la sesión
              </h3>
              <div className="card-content">
                <ol
                  style={{
                    paddingLeft: 0, listStyle: 'none', margin: 0,
                    display: 'flex', flexDirection: 'column', gap: '0.8rem',
                  }}
                >
                  {openingSteps.map((step, index) => (
                    <li
                      key={index}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '0.75rem 1rem', backgroundColor: '#f8fafc',
                        borderRadius: '6px', borderLeft: '4px solid var(--primary)',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{ fontWeight: 700, color: 'var(--primary)', minWidth: '24px' }}
                      >
                        {index + 1}.
                      </span>
                      <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 500 }}>
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* ── 2. Tareas a leer durante el test ── */}
            <section className="card" aria-labelledby="script-tareas-heading">
              <h3 className="card-title" id="script-tareas-heading">
                Tareas a leer durante el test
              </h3>
              <div className="data-table-container">
                <table className="data-table">
                  <caption className="sr-only">Tareas a leer durante el test de usabilidad</caption>
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: '60px' }}>ID</th>
                      <th scope="col" style={{ width: '35%' }}>Texto de la tarea</th>
                      <th scope="col" style={{ width: '30%' }}>Pregunta de seguimiento</th>
                      <th scope="col">Éxito esperado</th>
                      <th scope="col" style={{ width: '70px' }}>Acción</th>
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
                            <label htmlFor={`script-text-${task.id}`} className="sr-only">
                              Texto de la tarea {task.task_index}
                            </label>
                            <textarea
                              id={`script-text-${task.id}`}
                              defaultValue={task.script_task_text || ''}
                              onBlur={(e) =>
                                handleActionWithStatus(() =>
                                  onSaveTask(task.id!, { script_task_text: e.target.value })
                                )
                              }
                              placeholder="Ej. Imagina que quieres..."
                              rows={3}
                            />
                          </td>

                          <td>
                            <label htmlFor={`script-followup-${task.id}`} className="sr-only">
                              Pregunta de seguimiento {task.task_index}
                            </label>
                            <textarea
                              id={`script-followup-${task.id}`}
                              defaultValue={task.script_follow_up || ''}
                              onBlur={(e) =>
                                handleActionWithStatus(() =>
                                  onSaveTask(task.id!, { script_follow_up: e.target.value })
                                )
                              }
                              placeholder="Ej. ¿Qué esperabas...?"
                              rows={3}
                            />
                          </td>

                          <td>
                            <label htmlFor={`script-success-${task.id}`} className="sr-only">
                              Éxito esperado {task.task_index}
                            </label>
                            <textarea
                              id={`script-success-${task.id}`}
                              defaultValue={task.script_expected_success || ''}
                              onBlur={(e) =>
                                handleActionWithStatus(() =>
                                  onSaveTask(task.id!, { script_expected_success: e.target.value })
                                )
                              }
                              placeholder="Ej. Encuentra la nota..."
                              rows={3}
                            />
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn-delete"
                              onClick={() => onDeleteTask(task.id!)}
                              aria-label={`Eliminar tarea ${task.task_index}`}
                            >
                              <Trash2 size={18} aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}
                        >
                          No hay tareas en el guion. Haz clic en el botón de abajo para empezar.
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
                  onClick={onAddTask}
                  disabled={!testPlan.id}
                  aria-label="Añadir tarea al guion"
                >
                  <Plus size={18} aria-hidden="true" />
                  Añadir Tarea al Guion
                </button>
              </div>
            </section>

            {/* ── 3. Cierre ── */}
            <section className="card" aria-labelledby="script-cierre-heading">
              <h3 className="card-title" id="script-cierre-heading">
                Cierre
              </h3>
              <div className="card-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {(testPlan.closing_questions || []).map((q: ClosingQuestion, index: number) => (
                    <div key={index} className="form-group">
                      <label
                        htmlFor={`closing-q-${index}`}
                        style={{ color: '#854d0e', fontSize: '1.05rem', fontWeight: 'bold' }}
                      >
                        {index + 1}. {q.question}
                      </label>
                      <textarea
                        id={`closing-q-${index}`}
                        defaultValue={q.answer}
                        onBlur={(e) => handleUpdateClosingAnswer(index, e.target.value)}
                        placeholder="Escribe la respuesta..."
                        rows={3}
                        style={{
                          backgroundColor: '#fef9c3',
                          border: '1px solid #fde047',
                          color: '#1a1a1a',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};