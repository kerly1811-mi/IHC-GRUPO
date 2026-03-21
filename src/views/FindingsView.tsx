import React, { useState, useEffect } from 'react';
import { Finding, Severity, Priority, TaskStatus } from '../models/types';
import { Trash2, Plus, CheckCircle, RefreshCcw, AlertTriangle } from 'lucide-react';

// ─── Hook para detectar ancho de ventana ─────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    // Forzar lectura correcta al montar (por si cambió mientras estaba desmontado)
    handler();
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

// ─── Colores accesibles (contraste ≥ 4.5:1) ─────────────────────────────────
const SEVERITY_STYLES: Record<Severity, { bg: string; color: string; border: string }> = {
  Baja:    { bg: '#dcfce7', color: '#14532d', border: '#86efac' },
  Media:   { bg: '#fef9c3', color: '#713f12', border: '#fde047' },
  Alta:    { bg: '#ffedd5', color: '#7c2d12', border: '#fdba74' },
  Crítica: { bg: '#fee2e2', color: '#7f1d1d', border: '#fca5a5' },
};

const PRIORITY_STYLES: Record<Priority, { bg: string; color: string }> = {
  Baja:  { bg: '#e0f2fe', color: '#0c4a6e' },
  Media: { bg: '#fef9c3', color: '#78350f' },
  Alta:  { bg: '#fce7f3', color: '#701a75' },
};

const STATUS_STYLES: Record<TaskStatus, { bg: string; color: string; icon: string }> = {
  Pendiente:     { bg: '#f1f5f9', color: '#334155', icon: '⏳' },
  'En progreso': { bg: '#eff6ff', color: '#1e3a5f', icon: '🔄' },
  Resuelto:      { bg: '#f0fdf4', color: '#14532d', icon: '✅' },
};

// ─── Props ───────────────────────────────────────────────────────────────────
interface FindingsViewProps {
  data: Finding[];
  onAdd: () => void;
  onSave: (id: string, updates: Partial<Finding>) => void;
  onDelete: (id: string) => void;
  planId?: string;
  productName?: string;
  onGoToPlan: () => void;
}

// ─── Tarjeta individual para vista móvil ─────────────────────────────────────
const FindingCard: React.FC<{
  f: Finding;
  idx: number;
  onSave: (id: string, updates: Partial<Finding>) => void;
  onDelete: (id: string) => void;
  onAction: (fn: () => void) => void;
}> = ({ f, idx, onSave, onDelete, onAction }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const sev = SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.Baja;
  const pri = PRIORITY_STYLES[f.priority] ?? PRIORITY_STYLES.Baja;
  const sta = STATUS_STYLES[f.status]    ?? STATUS_STYLES.Pendiente;

  return (
    <article
      style={{
        background: '#fff',
        border: `2px solid ${sev.border}`,
        borderRadius: 10,
        marginBottom: '1rem',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
      aria-label={`Hallazgo ${idx + 1}`}
    >
      {/* Cabecera de la tarjeta */}
      <div style={{ background: sev.bg, padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, color: sev.color, fontSize: '0.85rem' }}>
          Hallazgo #{idx + 1} · Severidad: {f.severity}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, backgroundColor: pri.bg, color: pri.color, fontWeight: 700, fontSize: '0.75rem', border: `1px solid ${pri.color}` }}>
            {f.priority}
          </span>
          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, backgroundColor: sta.bg, color: sta.color, fontWeight: 600, fontSize: '0.75rem', border: `1px solid ${sta.color}` }}>
            {sta.icon} {f.status}
          </span>
        </div>
      </div>

      {/* Cuerpo de la tarjeta */}
      <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Problema */}
        <div className="form-group">
          <label htmlFor={`m-problem-${f.id}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Problema detectado
          </label>
          <textarea
            id={`m-problem-${f.id}`}
            defaultValue={f.problem}
            onBlur={e => onAction(() => onSave(f.id!, { problem: e.target.value }))}
            placeholder="Ej. Menú 'Rendimiento' no comunica que contiene notas"
            rows={2}
            style={{ fontSize: '0.9rem' }}
          />
        </div>

        {/* Evidencia */}
        <div className="form-group">
          <label htmlFor={`m-evidence-${f.id}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Evidencia observada
          </label>
          <textarea
            id={`m-evidence-${f.id}`}
            defaultValue={f.evidence}
            onBlur={e => onAction(() => onSave(f.id!, { evidence: e.target.value }))}
            placeholder="Ej. 4 de 5 usuarios dudaron al segundo intento"
            rows={2}
            style={{ fontSize: '0.9rem' }}
          />
        </div>

        {/* Fila: Frecuencia + Severidad */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label htmlFor={`m-freq-${f.id}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Frecuencia
            </label>
            <input
              id={`m-freq-${f.id}`}
              defaultValue={f.frequency}
              onBlur={e => onAction(() => onSave(f.id!, { frequency: e.target.value }))}
              placeholder="Ej. 4/5"
              style={{ fontSize: '0.9rem' }}
            />
          </div>
          <div className="form-group">
            <label htmlFor={`m-sev-${f.id}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Severidad
            </label>
            <select
              id={`m-sev-${f.id}`}
              defaultValue={f.severity}
              onChange={e => onAction(() => onSave(f.id!, { severity: e.target.value as Severity }))}
              style={{ backgroundColor: sev.bg, color: sev.color, fontWeight: 700, fontSize: '0.9rem' }}
            >
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>
        </div>

        {/* Recomendación */}
        <div className="form-group">
          <label htmlFor={`m-rec-${f.id}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Recomendación de mejora
          </label>
          <textarea
            id={`m-rec-${f.id}`}
            defaultValue={f.recommendation}
            onBlur={e => onAction(() => onSave(f.id!, { recommendation: e.target.value }))}
            placeholder="Ej. Cambiar etiqueta a 'Notas'"
            rows={2}
            style={{ fontSize: '0.9rem' }}
          />
        </div>

        {/* Fila: Prioridad + Estado */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label htmlFor={`m-pri-${f.id}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Prioridad
            </label>
            <select
              id={`m-pri-${f.id}`}
              defaultValue={f.priority}
              onChange={e => onAction(() => onSave(f.id!, { priority: e.target.value as Priority }))}
              style={{ backgroundColor: pri.bg, color: pri.color, fontWeight: 700, fontSize: '0.9rem' }}
            >
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor={`m-status-${f.id}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Estado
            </label>
            <select
              id={`m-status-${f.id}`}
              defaultValue={f.status}
              onChange={e => onAction(() => onSave(f.id!, { status: e.target.value as TaskStatus }))}
              style={{ backgroundColor: sta.bg, color: sta.color, fontWeight: 600, fontSize: '0.9rem' }}
            >
              <option value="Pendiente">⏳ Pendiente</option>
              <option value="En progreso">🔄 En progreso</option>
              <option value="Resuelto">✅ Resuelto</option>
            </select>
          </div>
        </div>

        {/* Botón eliminar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: 700 }}>¿Eliminar?</span>
              <button
                type="button"
                onClick={() => { onDelete(f.id!); setConfirmDelete(false); }}
                style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700 }}
                aria-label={`Confirmar eliminar hallazgo ${idx + 1}`}
              >Sí</button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                style={{ background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
              >No</button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-delete"
              onClick={() => setConfirmDelete(true)}
              aria-label={`Eliminar hallazgo ${idx + 1}`}
            >
              <Trash2 size={18} aria-hidden="true" /> <span style={{ fontSize: '0.82rem', marginLeft: 4 }}>Eliminar</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────
export const FindingsView: React.FC<FindingsViewProps> = ({
  data, onAdd, onSave, onDelete, planId, productName, onGoToPlan
}) => {
  const width = useWindowWidth();
  const isMobile = width < 1024;
  const [isSaving, setIsSaving] = useState(false);
  const isProductEmpty = !productName || productName.trim() === '';

  const handleActionWithStatus = (action: () => void) => {
    setIsSaving(true);
    action();
    setTimeout(() => setIsSaving(false), 800);
  };

  // Estadísticas rápidas
  {/*  
  const stats = {
    total:     data.length,
    criticas:  data.filter(f => f.severity === 'Crítica').length,
    altas:     data.filter(f => f.severity === 'Alta').length,
    resueltas: data.filter(f => f.status === 'Resuelto').length,
    pendientes:data.filter(f => f.status === 'Pendiente').length,
  };
    */}
  return (
    <div id="findings-panel" role="tabpanel" aria-labelledby="findings-tab" className="dashboard-view">

      {/* Encabezado */}
      <header className="view-header" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2>Síntesis de hallazgos y plan de mejora</h2>
        <div role="status" aria-live="polite" style={{ position: 'absolute', right: '1rem', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
          {isSaving
            ? <span style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 5 }}><RefreshCcw size={14} className="spin" aria-hidden="true" /> Guardando…</span>
            : <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle size={14} aria-hidden="true" /> Cambios guardados</span>
          }
        </div>
      </header>

      {/* Sin producto */}
      {isProductEmpty ? (
        <section className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ width: 80, height: 80, backgroundColor: '#fffbeb', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1rem' }} aria-hidden="true">
            <AlertTriangle size={40} color="#d97706" />
          </div>
          <h3 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>¡Falta el nombre del producto!</h3>
          <p style={{ color: '#64748b', maxWidth: 420, margin: '0 auto 1.5rem' }}>
            Para generar la síntesis de hallazgos, primero define un nombre al producto en la pestaña Plan.
          </p>
          <button onClick={onGoToPlan} style={{ backgroundColor: '#003366', color: 'white', padding: '12px 24px', borderRadius: 6, border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
            Ir a definir Producto
          </button>
        </section>
      ) : (
        <>
          {/* Tarjetas de resumen — siempre visibles
          {data.length > 0 && (
            <section aria-labelledby="findings-summary-heading" style={{ marginBottom: '1.5rem' }}>
              <h3 id="findings-summary-heading" className="sr-only">Resumen de hallazgos</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                {[
                  { label: 'Total',            value: stats.total,      bg: '#f8fafc', color: '#0f172a', border: '#e2e8f0' },
                  { label: 'Crítica',          value: stats.criticas,   bg: '#fee2e2', color: '#7f1d1d', border: '#fca5a5' },
                  { label: 'Alta',             value: stats.altas,      bg: '#ffedd5', color: '#7c2d12', border: '#fdba74' },
                  { label: 'Resueltos',        value: stats.resueltas,  bg: '#f0fdf4', color: '#14532d', border: '#86efac' },
                  { label: 'Pendientes',       value: stats.pendientes, bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' },
                ].map(c => (
                  <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '0.875rem', textAlign: 'center' }}
                    aria-label={`${c.value} ${c.label}`}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                    <div style={{ fontSize: '0.75rem', color: c.color, fontWeight: 600, marginTop: 2 }}>{c.label}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
           */}
          {/* ── DISEÑO DESKTOP: tabla ── */}
          {!isMobile && (
            <section className="card" aria-labelledby="findings-table-heading">
              <h3 id="findings-table-heading" className="card-title">Registro de hallazgos</h3>
              <div className="data-table-container" role="region" aria-label="Tabla de hallazgos">
                <table className="data-table" aria-describedby="findings-caption">
                  <caption id="findings-caption" className="sr-only">
                    Tabla editable de hallazgos con problema, evidencia, frecuencia, severidad, recomendación, prioridad y estado.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: 40 }}>#</th>
                      <th scope="col">Problema detectado</th>
                      <th scope="col">Evidencia observada</th>
                      <th scope="col" style={{ width: 100 }}>Frecuencia</th>
                      <th scope="col" style={{ width: 120 }}>Severidad</th>
                      <th scope="col">Recomendación de mejora</th>
                      <th scope="col" style={{ width: 110 }}>Prioridad</th>
                      <th scope="col" style={{ width: 130 }}>Estado</th>
                      <th scope="col" style={{ width: 60 }}><span className="sr-only">Acciones</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length > 0 ? data.map((f, idx) => {
                      const sev = SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.Baja;
                      const pri = PRIORITY_STYLES[f.priority] ?? PRIORITY_STYLES.Baja;
                      const sta = STATUS_STYLES[f.status]    ?? STATUS_STYLES.Pendiente;
                      return (
                        <tr key={f.id}>
                          <td style={{ textAlign: 'center' }}>
                            <span className="id-badge" aria-label={`Hallazgo ${idx + 1}`}>{idx + 1}</span>
                          </td>
                          <td>
                            <label htmlFor={`d-problem-${f.id}`} className="sr-only">Problema hallazgo {idx + 1}</label>
                            <textarea id={`d-problem-${f.id}`} defaultValue={f.problem} onBlur={e => handleActionWithStatus(() => onSave(f.id!, { problem: e.target.value }))} placeholder="Ej. Menú no es claro" />
                          </td>
                          <td>
                            <label htmlFor={`d-evidence-${f.id}`} className="sr-only">Evidencia hallazgo {idx + 1}</label>
                            <textarea id={`d-evidence-${f.id}`} defaultValue={f.evidence} onBlur={e => handleActionWithStatus(() => onSave(f.id!, { evidence: e.target.value }))} placeholder="Ej. 4/5 usuarios fallaron" />
                          </td>
                          <td>
                            <label htmlFor={`d-freq-${f.id}`} className="sr-only">Frecuencia hallazgo {idx + 1}</label>
                            <input type="text" id={`d-freq-${f.id}`} defaultValue={f.frequency} onBlur={e => handleActionWithStatus(() => onSave(f.id!, { frequency: e.target.value }))} placeholder="Ej. 4/5" />
                          </td>
                          <td>
                            <label htmlFor={`d-sev-${f.id}`} className="sr-only">Severidad hallazgo {idx + 1}</label>
                            <select id={`d-sev-${f.id}`} defaultValue={f.severity} onChange={e => handleActionWithStatus(() => onSave(f.id!, { severity: e.target.value as Severity }))} style={{ backgroundColor: sev.bg, color: sev.color, border: `1px solid ${sev.border}`, fontWeight: 700 }}>
                              <option value="Baja">Baja</option>
                              <option value="Media">Media</option>
                              <option value="Alta">Alta</option>
                              <option value="Crítica">Crítica</option>
                            </select>
                          </td>
                          <td>
                            <label htmlFor={`d-rec-${f.id}`} className="sr-only">Recomendación hallazgo {idx + 1}</label>
                            <textarea id={`d-rec-${f.id}`} defaultValue={f.recommendation} onBlur={e => handleActionWithStatus(() => onSave(f.id!, { recommendation: e.target.value }))} placeholder="Ej. Renombrar menú" />
                          </td>
                          <td>
                            <label htmlFor={`d-pri-${f.id}`} className="sr-only">Prioridad hallazgo {idx + 1}</label>
                            <select id={`d-pri-${f.id}`} defaultValue={f.priority} onChange={e => handleActionWithStatus(() => onSave(f.id!, { priority: e.target.value as Priority }))} style={{ backgroundColor: pri.bg, color: pri.color, fontWeight: 700 }}>
                              <option value="Baja">Baja</option>
                              <option value="Media">Media</option>
                              <option value="Alta">Alta</option>
                            </select>
                          </td>
                          <td>
                            <label htmlFor={`d-status-${f.id}`} className="sr-only">Estado hallazgo {idx + 1}</label>
                            <select id={`d-status-${f.id}`} defaultValue={f.status} onChange={e => handleActionWithStatus(() => onSave(f.id!, { status: e.target.value as TaskStatus }))} style={{ backgroundColor: sta.bg, color: sta.color, fontWeight: 600 }}>
                              <option value="Pendiente">⏳ Pendiente</option>
                              <option value="En progreso">🔄 En progreso</option>
                              <option value="Resuelto">✅ Resuelto</option>
                            </select>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn-delete" type="button" onClick={() => onDelete(f.id!)} aria-label={`Eliminar hallazgo ${idx + 1}`}>
                              <Trash2 size={20} aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay hallazgos. Haz clic en "Añadir Hallazgo".</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '1rem' }}>
                <button className="btn-add" onClick={onAdd} disabled={!planId} type="button" aria-label="Añadir nuevo hallazgo">
                  <Plus size={18} aria-hidden="true" /> Añadir Hallazgo
                </button>
              </div>
            </section>
          )}

          {/* ── DISEÑO MOBILE/TABLET: tarjetas ── */}
          {isMobile && (
            <section aria-labelledby="findings-cards-heading">
              <h3 id="findings-cards-heading" className="card-title" style={{ borderRadius: '8px 8px 0 0', marginBottom: '1rem' }}>
                Registro de hallazgos
              </h3>

              {data.length === 0 ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay hallazgos. Haz clic en "Añadir Hallazgo".
                </div>
              ) : (
                data.map((f, idx) => (
                  <FindingCard
                    key={f.id}
                    f={f}
                    idx={idx}
                    onSave={onSave}
                    onDelete={onDelete}
                    onAction={handleActionWithStatus}
                  />
                ))
              )}

              <button className="btn-add" onClick={onAdd} disabled={!planId} type="button" style={{ width: '100%', justifyContent: 'center' }} aria-label="Añadir nuevo hallazgo">
                <Plus size={18} aria-hidden="true" /> Añadir Hallazgo
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
};