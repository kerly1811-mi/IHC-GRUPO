import React, { useMemo, useEffect, useState } from 'react';
import { TestPlan, TestTask, Observation, Finding, Severity, Priority } from '../models/types';
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, Target,
  BarChart2, Users, ClipboardCheck, Zap, Info, PieChart
} from 'lucide-react';

// ─── Hook ancho ──────────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    handler();
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pct = (n: number, total: number) =>
  total === 0 ? 0 : Math.round((n / total) * 100);
const avg = (arr: number[]) =>
  arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

// ─── Colores semánticos WCAG AA ──────────────────────────────────────────────
const SEV_COLORS: Record<Severity, { bg: string; text: string; border: string; solid: string; label: string }> = {
  Baja:    { bg: '#dcfce7', text: '#14532d', border: '#16a34a', solid: '#16a34a', label: 'Severidad baja' },
  Media:   { bg: '#fef3c7', text: '#78350f', border: '#d97706', solid: '#d97706', label: 'Severidad media' },
  Alta:    { bg: '#ffedd5', text: '#7c2d12', border: '#ea580c', solid: '#ea580c', label: 'Severidad alta' },
  Crítica: { bg: '#fee2e2', text: '#7f1d1d', border: '#dc2626', solid: '#dc2626', label: 'Severidad crítica' },
};
const PRI_COLORS: Record<Priority, { bg: string; text: string; border: string; solid: string }> = {
  Baja:  { bg: '#eff6ff', text: '#1e40af', border: '#3b82f6', solid: '#3b82f6' },
  Media: { bg: '#fef3c7', text: '#78350f', border: '#d97706', solid: '#d97706' },
  Alta:  { bg: '#fdf2f8', text: '#701a75', border: '#a21caf', solid: '#a21caf' },
};
const SUCCESS_CONFIG = {
  'Sí':        { bg: '#f0fdf4', text: '#14532d', border: '#16a34a', solid: '#16a34a', icon: '✅', label: 'Exitosa' },
  'Con ayuda': { bg: '#fffbeb', text: '#78350f', border: '#d97706', solid: '#f59e0b', icon: '🤝', label: 'Con ayuda' },
  'No':        { bg: '#fef2f2', text: '#7f1d1d', border: '#dc2626', solid: '#ef4444', icon: '❌', label: 'Fallida' },
};

// ─── Gráfico de pastel SVG accesible (sin librerías) ─────────────────────────
interface PieSlice { value: number; color: string; label: string }

const DonutChart: React.FC<{ slices: PieSlice[]; size?: number; title: string }> = ({
  slices, size = 160, title,
}) => {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return null;

  const cx = size / 2, cy = size / 2;
  const outerR = size / 2 - 8;
  const innerR = outerR * 0.55; // dona
  let cumulative = 0;

  const paths = slices.map((sl, i) => {
    if (sl.value === 0) return null;
    const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    cumulative += sl.value;
    const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;

    if (sl.value === total) {
      // Círculo completo
      return (
        <g key={i}>
          <circle cx={cx} cy={cy} r={outerR} fill={sl.color} />
          <circle cx={cx} cy={cy} r={innerR} fill="#fff" />
        </g>
      );
    }

    const x1o = cx + outerR * Math.cos(startAngle);
    const y1o = cy + outerR * Math.sin(startAngle);
    const x2o = cx + outerR * Math.cos(endAngle);
    const y2o = cy + outerR * Math.sin(endAngle);
    const x1i = cx + innerR * Math.cos(endAngle);
    const y1i = cy + innerR * Math.sin(endAngle);
    const x2i = cx + innerR * Math.cos(startAngle);
    const y2i = cy + innerR * Math.sin(startAngle);
    const largeArc = sl.value / total > 0.5 ? 1 : 0;

    return (
      <path
        key={i}
        d={`M ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i} Z`}
        fill={sl.color}
        stroke="#fff"
        strokeWidth={2}
        aria-label={`${sl.label}: ${Math.round((sl.value / total) * 100)}%`}
      />
    );
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={title}
      style={{ flexShrink: 0 }}
    >
      <title>{title}</title>
      {paths}
    </svg>
  );
};

// ─── Barra de progreso accesible ─────────────────────────────────────────────
const ProgressBar: React.FC<{
  value: number; max: number; color: string;
  bgColor?: string; label: string; showPct?: boolean; height?: number;
}> = ({ value, max, color, bgColor = '#e2e8f0', label, showPct = true, height = 12 }) => {
  const p = pct(value, max);
  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}
        aria-label={`${label}: ${p}%`}
        style={{ height, backgroundColor: bgColor, borderRadius: 99, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div style={{ height: '100%', width: `${p}%`, backgroundColor: color, borderRadius: 99, transition: 'width 0.6s ease', minWidth: p > 0 ? 4 : 0 }} />
      </div>
      {showPct && (
        <span aria-hidden="true" style={{ fontSize: '0.7rem', color: '#475569', display: 'block', textAlign: 'right', marginTop: 3, fontWeight: 600 }}>
          {p}% ({value}/{max})
        </span>
      )}
    </div>
  );
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  value: string | number; label: string; detail?: string;
  icon: React.ReactNode; accentColor: string; bgColor: string;
  iconBg: string; interpretation?: string;
}> = ({ value, label, detail, icon, accentColor, bgColor, iconBg, interpretation }) => (
  <article
    style={{ backgroundColor: bgColor, border: `2px solid ${accentColor}22`, borderLeft: `4px solid ${accentColor}`, borderRadius: 10, padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: 4 }}
    aria-label={`${label}: ${value}${detail ? '. ' + detail : ''}${interpretation ? '. ' + interpretation : ''}`}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, backgroundColor: iconBg, borderRadius: 8, color: accentColor, flexShrink: 0 }}>{icon}</span>
      <span aria-hidden="true" style={{ fontSize: '2rem', fontWeight: 800, color: accentColor, lineHeight: 1 }}>{value}</span>
    </div>
    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>{label}</p>
    {detail && <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>{detail}</p>}
    {interpretation && (
      <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: accentColor, fontWeight: 600, backgroundColor: iconBg, padding: '2px 6px', borderRadius: 4, display: 'inline-block', alignSelf: 'flex-start' }}>
        {interpretation}
      </p>
    )}
  </article>
);

// ─── Badges ──────────────────────────────────────────────────────────────────
const SevBadge: React.FC<{ sev: Severity }> = ({ sev }) => {
  const c = SEV_COLORS[sev];
  return <span role="img" aria-label={c.label} style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`, fontWeight: 700, fontSize: '0.75rem' }}>{sev}</span>;
};
const PriBadge: React.FC<{ pri: Priority }> = ({ pri }) => {
  const c = PRI_COLORS[pri];
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`, fontWeight: 700, fontSize: '0.75rem' }}>{pri}</span>;
};

// ─── Título de sección ────────────────────────────────────────────────────────
const SectionTitle: React.FC<{ id: string; icon: React.ReactNode; children: React.ReactNode }> = ({ id, icon, children }) => (
  <h3 id={id} style={{ fontSize: '1rem', fontWeight: 700, color: '#003366', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid #003366', paddingBottom: '0.5rem' }}>
    {icon}{children}
  </h3>
);

// ─── Panel con sombra ─────────────────────────────────────────────────────────
const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', ...style }}>
    {children}
  </div>
);

// ─── Props ───────────────────────────────────────────────────────────────────
interface ReportsViewProps {
  testPlan: TestPlan;
  tasks: TestTask[];
  observations: Observation[];
  findings: Finding[];
  onGoToPlan: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  testPlan, tasks, observations, findings, onGoToPlan,
}) => {
  const width = useWindowWidth();
  const isMobile = width < 900;
  const isProductEmpty = !testPlan.product || testPlan.product.trim() === '';

  // ── Métricas ──────────────────────────────────────────────────────────────
  const m = useMemo(() => {
    const total   = observations.length;
    const ok      = observations.filter(o => o.success_level === 'Sí').length;
    const help    = observations.filter(o => o.success_level === 'Con ayuda').length;
    const fail    = observations.filter(o => o.success_level === 'No').length;
    const errors  = observations.reduce((s, o) => s + (o.errors || 0), 0);
    const avgErr  = total > 0 ? (errors / total).toFixed(1) : '0';
    const avgTime = avg(observations.map(o => o.time_seconds || 0));
    const maxTime = total > 0 ? Math.max(...observations.map(o => o.time_seconds || 0)) : 0;

    const sev: Record<Severity, number>  = { Baja: 0, Media: 0, Alta: 0, Crítica: 0 };
    const pri: Record<Priority, number>  = { Baja: 0, Media: 0, Alta: 0 };
    const sta: Record<string, number>    = { Pendiente: 0, 'En progreso': 0, Resuelto: 0 };
    findings.forEach(f => { sev[f.severity]++; pri[f.priority]++; sta[f.status]++; });

    const participants    = [...new Set(observations.map(o => o.participant).filter(Boolean))];
    const taskRates = tasks.map(t => {
      const obs     = observations.filter(o => o.task_ref === t.task_index);
      const obsOk   = obs.filter(o => o.success_level === 'Sí').length;
      const obsHelp = obs.filter(o => o.success_level === 'Con ayuda').length;
      const obsFail = obs.filter(o => o.success_level === 'No').length;
      const avgT    = avg(obs.map(o => o.time_seconds || 0));
      const totalErr= obs.reduce((s, o) => s + (o.errors || 0), 0);
      return { label: t.task_index, scenario: t.scenario, total: obs.length, ok: obsOk, help: obsHelp, fail: obsFail, avgTime: avgT, totalErrors: totalErr };
    }).filter(t => t.total > 0);

    const successRate      = pct(ok, total);
    const criticalFindings = sev['Crítica'] + sev['Alta'];
    return { total, ok, help, fail, errors, avgErr, avgTime, maxTime, sev, pri, sta, participants, taskRates, totalF: findings.length, resolved: sta['Resuelto'] || 0, pending: sta['Pendiente'] || 0, successRate, criticalFindings };
  }, [observations, findings, tasks]);

  const successInterpretation = m.successRate >= 80 ? '✓ Buen nivel de éxito' : m.successRate >= 50 ? '⚠ Necesita mejoras' : '✗ Nivel crítico';
  const errorsInterpretation  = parseFloat(m.avgErr) <= 1 ? '✓ Pocos errores' : parseFloat(m.avgErr) <= 3 ? '⚠ Errores moderados' : '✗ Muchos errores';

  // ── Sin producto ─────────────────────────────────────────────────────────
  if (isProductEmpty) return (
    <div id="reports-panel" role="tabpanel" aria-labelledby="reports-tab" className="dashboard-view">
      <header className="view-header" style={{ display: 'flex', justifyContent: 'center' }}><h2>Reporte y resumen de resultados</h2></header>
      <section className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }} aria-live="polite">
        <AlertTriangle size={48} color="#d97706" style={{ margin: '0 auto 1rem', display: 'block' }} aria-hidden="true" />
        <h3 style={{ color: '#1e293b' }}>Falta el nombre del producto</h3>
        <p style={{ color: '#475569', maxWidth: 440, margin: '0 auto 1.5rem' }}>Define un producto en la pestaña <strong>Plan</strong> para ver el reporte de resultados.</p>
        <button onClick={onGoToPlan} style={{ backgroundColor: '#003366', color: 'white', padding: '12px 28px', borderRadius: 6, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
          Ir a definir Producto
        </button>
      </section>
    </div>
  );

  // ── Sin datos ────────────────────────────────────────────────────────────
  if (observations.length === 0 && findings.length === 0) return (
    <div id="reports-panel" role="tabpanel" aria-labelledby="reports-tab" className="dashboard-view">
      <header className="view-header" style={{ display: 'flex', justifyContent: 'center' }}><h2>Reporte y resumen de resultados</h2></header>
      <section className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }} aria-live="polite">
        <BarChart2 size={56} color="#94a3b8" style={{ margin: '0 auto 1rem', display: 'block' }} aria-hidden="true" />
        <h3 style={{ color: '#1e293b' }}>Aún no hay datos para reportar</h3>
        <p style={{ color: '#475569', maxWidth: 440, margin: '0 auto' }}>Registra observaciones y hallazgos para generar el reporte automáticamente.</p>
      </section>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div id="reports-panel" role="tabpanel" aria-labelledby="reports-tab" className="dashboard-view">

      {/* Encabezado */}
      <header className="view-header" style={{ display: 'flex', justifyContent: 'center' }}>
        <h2>Reporte y resumen de resultados</h2>
      </header>

      {/* Metadatos del plan */}
      <section aria-label="Información del plan de prueba" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.875rem 1.1rem', marginBottom: '1.75rem', display: 'flex', flexWrap: 'wrap', gap: '8px 20px', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '1rem' }}>📋 {testPlan.product}{testPlan.module ? ` — ${testPlan.module}` : ''}</span>
        {testPlan.moderator && <span style={{ fontSize: '0.85rem', color: '#1e40af' }}><strong>Moderador:</strong> {testPlan.moderator}</span>}
        {m.participants.length > 0 && <span style={{ fontSize: '0.85rem', color: '#1e40af' }}><strong>Participantes:</strong> {m.participants.length} ({m.participants.join(', ')})</span>}
        <span style={{ fontSize: '0.8rem', color: '#3b82f6', marginLeft: 'auto' }}>
          Generado: {new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </section>

      {/* ══════════════════════════════════════════════
          SECCIÓN 1 — KPIs
      ══════════════════════════════════════════════ */}
      <section aria-labelledby="kpi-title" style={{ marginBottom: '2rem' }}>
        <SectionTitle id="kpi-title" icon={<Zap size={18} aria-hidden="true" />}>
          Indicadores clave de usabilidad
        </SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fit,minmax(155px,1fr))', gap: '0.875rem' }}>
          <KpiCard value={`${m.successRate}%`} label="Tasa de éxito global" detail={`${m.ok} exitosas de ${m.total} sesiones`} icon={<CheckCircle2 size={20} />} accentColor="#16a34a" bgColor="#f0fdf4" iconBg="#dcfce7" interpretation={successInterpretation} />
          <KpiCard value={`${m.avgTime}s`} label="Tiempo promedio" detail={`Máximo registrado: ${m.maxTime}s`} icon={<Clock size={20} />} accentColor="#1d4ed8" bgColor="#eff6ff" iconBg="#dbeafe" />
          <KpiCard value={m.errors} label="Total de errores" detail={`Promedio: ${m.avgErr} errores/sesión`} icon={<XCircle size={20} />} accentColor="#dc2626" bgColor="#fff7ed" iconBg="#ffedd5" interpretation={errorsInterpretation} />
          <KpiCard value={m.totalF} label="Hallazgos registrados" detail={`${m.resolved} resueltos · ${m.pending} pendientes`} icon={<AlertTriangle size={20} />} accentColor="#7e22ce" bgColor="#fdf4ff" iconBg="#fae8ff" interpretation={m.criticalFindings > 0 ? `⚠ ${m.criticalFindings} de alta prioridad` : '✓ Sin críticos'} />
          <KpiCard value={tasks.length} label="Tareas evaluadas" detail={`Con ${m.participants.length} participante${m.participants.length !== 1 ? 's' : ''}`} icon={<Target size={20} />} accentColor="#0f172a" bgColor="#f8fafc" iconBg="#e2e8f0" />
        </div>
      </section>

      {m.total > 0 && (
        <section aria-labelledby="dist-title" style={{ marginBottom: '2rem' }}>
          <SectionTitle id="dist-title" icon={<Users size={18} aria-hidden="true" />}>
            Distribución de resultados por sesión
          </SectionTitle>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>

            {/* Panel: gráfico de dona + leyenda */}
            <Panel>
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <PieChart size={16} color="#003366" aria-hidden="true" /> Proporción de resultados
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <DonutChart
                  title={`Gráfico de dona: ${m.ok} sesiones exitosas, ${m.help} con ayuda, ${m.fail} fallidas, de un total de ${m.total}`}
                  size={160}
                  slices={[
                    { value: m.ok,   color: '#16a34a', label: 'Exitosas' },
                    { value: m.help, color: '#f59e0b', label: 'Con ayuda' },
                    { value: m.fail, color: '#ef4444', label: 'Fallidas' },
                  ]}
                />
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {[
                    { val: m.ok,   color: '#16a34a', label: 'Exitosas' },
                    { val: m.help, color: '#f59e0b', label: 'Con ayuda' },
                    { val: m.fail, color: '#ef4444', label: 'Fallidas' },
                  ].map(row => (
                    <li key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: row.color, flexShrink: 0, display: 'inline-block' }} aria-hidden="true" />
                      <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600, minWidth: 80 }}>{row.label}</span>
                      <span style={{ fontWeight: 800, color: row.color, fontSize: '1.05rem' }}>
                        {row.val} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b' }}>({pct(row.val, m.total)}%)</span>
                      </span>
                    </li>
                  ))}
                  <li style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                    <span>Total sesiones</span>
                    <span style={{ fontWeight: 800, color: '#003366' }}>{m.total}</span>
                  </li>
                </ul>
              </div>
            </Panel>

            {/* Panel: barras horizontales comparativas */}
            <Panel style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <BarChart2 size={16} color="#003366" aria-hidden="true" /> Comparativa visual
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { val: m.ok,   label: 'Sesiones exitosas',       color: '#16a34a', bg: '#dcfce7', icon: '✅', desc: 'El usuario completó la tarea sin intervención' },
                  { val: m.help, label: 'Necesitaron ayuda',       color: '#d97706', bg: '#fef3c7', icon: '🤝', desc: 'El moderador tuvo que intervenir para completarla' },
                  { val: m.fail, label: 'No completaron la tarea', color: '#dc2626', bg: '#fee2e2', icon: '❌', desc: 'La tarea no pudo completarse de ninguna forma' },
                ].map(row => (
                  <div key={row.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.83rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span aria-hidden="true">{row.icon}</span> {row.label}
                      </span>
                      <span style={{ fontWeight: 800, color: row.color, fontSize: '1.1rem' }}>
                        {row.val} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>/ {m.total} ({pct(row.val, m.total)}%)</span>
                      </span>
                    </div>
                    <ProgressBar value={row.val} max={m.total} color={row.color} bgColor={row.bg} label={row.label} showPct={false} height={20} />
                    <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>{row.desc}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'auto', padding: '0.6rem 0.875rem', backgroundColor: '#f8fafc', borderRadius: 8, borderLeft: '3px solid #003366', fontSize: '0.8rem', color: '#334155', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <Info size={14} style={{ flexShrink: 0, marginTop: 1, color: '#003366' }} aria-hidden="true" />
                <span>{m.successRate >= 80 ? 'El sistema presenta una usabilidad aceptable.' : m.successRate >= 50 ? 'Se recomienda revisar los flujos con mayor tasa de fallo.' : 'Se identifican problemas graves que requieren atención urgente.'}</span>
              </div>
            </Panel>
          </div>
        </section>
      )}


      {m.taskRates.length > 0 && (
        <section aria-labelledby="tasks-title" style={{ marginBottom: '2rem' }}>
          <SectionTitle id="tasks-title" icon={<Target size={18} aria-hidden="true" />}>
            Resultados por tarea
          </SectionTitle>

          <Panel>
            {/* Gráfico de barras verticales */}
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
              Tasa de éxito por tarea (%)
            </h4>
            <div
              role="img"
              aria-label={`Gráfico de barras de éxito por tarea: ${m.taskRates.map(t => `Tarea ${t.label} ${pct(t.ok, t.total)}%`).join(', ')}`}
              style={{ display: 'flex', alignItems: 'flex-end', gap: isMobile ? 6 : 16, height: 150, paddingBottom: 8, overflowX: 'auto', borderBottom: '2px solid #e2e8f0', marginBottom: '0.75rem' }}
            >
              {m.taskRates.map(t => {
                const rate = pct(t.ok, t.total);
                const barColor = rate >= 80 ? '#16a34a' : rate >= 50 ? '#d97706' : '#dc2626';
                const barBg    = rate >= 80 ? '#dcfce7' : rate >= 50 ? '#fef3c7' : '#fee2e2';
                const barHeight = Math.max((rate / 100) * 130, 4);
                return (
                  <div key={t.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 56, flex: 1 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: barColor }}>{rate}%</span>
                    <div
                      style={{ width: '100%', height: barHeight, backgroundColor: barColor, borderRadius: '6px 6px 0 0', border: `2px solid ${barBg}`, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'height 0.5s ease' }}
                      title={`Tarea ${t.label}: ${t.ok}/${t.total} exitosas`}
                    />
                    <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 700 }}>
                      <span className="id-badge" style={{ fontSize: '0.72rem' }}>{t.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {[{ color: '#16a34a', label: '≥ 80% — Aceptable' }, { color: '#d97706', label: '50–79% — Mejorar' }, { color: '#dc2626', label: '< 50% — Crítico' }].map(l => (
                <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#475569' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: l.color, display: 'inline-block' }} aria-hidden="true" /> {l.label}
                </span>
              ))}
            </div>


            {!isMobile ? (
              <div className="data-table-container">
                <table className="data-table" style={{ minWidth: 580 }} aria-label="Resultados detallados por tarea">
                  <caption className="sr-only">Tabla con tasa de éxito, sesiones exitosas, con ayuda, fallidas, tiempo y errores por tarea.</caption>
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: 70 }}>Tarea</th>
                      <th scope="col">Progreso de éxito</th>
                      <th scope="col" style={{ width: 90, textAlign: 'center' }}>Exitosas</th>
                      <th scope="col" style={{ width: 100, textAlign: 'center' }}>Con ayuda</th>
                      <th scope="col" style={{ width: 90, textAlign: 'center' }}>Fallidas</th>
                      <th scope="col" style={{ width: 110, textAlign: 'center' }}>Tiempo</th>
                      <th scope="col" style={{ width: 80, textAlign: 'center' }}>Errores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.taskRates.map(t => {
                      const rate = pct(t.ok, t.total);
                      const barColor = rate >= 80 ? '#16a34a' : rate >= 50 ? '#d97706' : '#dc2626';
                      return (
                        <tr key={t.label}>
                          <td style={{ textAlign: 'center' }}><span className="id-badge">{t.label}</span></td>
                          <td style={{ padding: '10px 12px' }}><ProgressBar value={t.ok} max={t.total} color={barColor} label={`Tarea ${t.label}`} height={16} /></td>
                          <td style={{ textAlign: 'center' }}><span style={{ display: 'inline-block', padding: '3px 10px', backgroundColor: '#dcfce7', color: '#14532d', borderRadius: 99, fontWeight: 700, fontSize: '0.85rem' }}>{t.ok}/{t.total}</span></td>
                          <td style={{ textAlign: 'center' }}><span style={{ display: 'inline-block', padding: '3px 10px', backgroundColor: '#fef3c7', color: '#78350f', borderRadius: 99, fontWeight: 700, fontSize: '0.85rem' }}>{t.help}</span></td>
                          <td style={{ textAlign: 'center' }}><span style={{ display: 'inline-block', padding: '3px 10px', backgroundColor: t.fail > 0 ? '#fee2e2' : '#f1f5f9', color: t.fail > 0 ? '#7f1d1d' : '#475569', borderRadius: 99, fontWeight: 700, fontSize: '0.85rem' }}>{t.fail}</span></td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: '#334155' }}>{t.avgTime > 0 ? `${t.avgTime}s` : '—'}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: t.totalErrors > 2 ? '#dc2626' : '#334155' }}>{t.totalErrors}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {m.taskRates.map(t => {
                  const rate = pct(t.ok, t.total);
                  const barColor = rate >= 80 ? '#16a34a' : rate >= 50 ? '#d97706' : '#dc2626';
                  return (
                    <div key={t.label} style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }} aria-label={`Tarea ${t.label}: ${t.ok} de ${t.total} exitosas (${rate}%)`}>
                      <div style={{ backgroundColor: '#003366', color: 'white', padding: '0.5rem 0.875rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700 }}>Tarea {t.label}</span>
                        <span style={{ fontSize: '0.85rem' }}>{rate}% éxito</span>
                      </div>
                      <div style={{ padding: '0.75rem' }}>
                        <ProgressBar value={t.ok} max={t.total} color={barColor} label={`Éxito tarea ${t.label}`} height={16} />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: '0.75rem' }}>
                          {[{ val: t.ok, label: 'Exitosas', color: '#14532d', bg: '#dcfce7' }, { val: t.help, label: 'Con ayuda', color: '#78350f', bg: '#fef3c7' }, { val: t.fail, label: 'Fallidas', color: '#7f1d1d', bg: '#fee2e2' }].map(s => (
                            <div key={s.label} style={{ textAlign: 'center', backgroundColor: s.bg, borderRadius: 6, padding: '0.4rem' }}>
                              <div style={{ fontWeight: 800, color: s.color, fontSize: '1.1rem' }}>{s.val}</div>
                              <div style={{ fontSize: '0.68rem', color: s.color, fontWeight: 600 }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </section>
      )}

      {m.totalF > 0 && (
        <section aria-labelledby="findings-charts-title" style={{ marginBottom: '2rem' }}>
          <SectionTitle id="findings-charts-title" icon={<AlertTriangle size={18} aria-hidden="true" />}>
            Análisis de hallazgos
          </SectionTitle>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

            {/* Dona de severidad */}
            <Panel>
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <PieChart size={16} color="#dc2626" aria-hidden="true" /> Hallazgos por severidad
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1rem' }}>
                <DonutChart
                  title={`Gráfico de hallazgos por severidad: Crítica ${m.sev['Crítica']}, Alta ${m.sev['Alta']}, Media ${m.sev['Media']}, Baja ${m.sev['Baja']}, de un total de ${m.totalF}`}
                  size={150}
                  slices={[
                    { value: m.sev['Crítica'], color: '#dc2626', label: 'Crítica' },
                    { value: m.sev['Alta'],    color: '#ea580c', label: 'Alta' },
                    { value: m.sev['Media'],   color: '#d97706', label: 'Media' },
                    { value: m.sev['Baja'],    color: '#16a34a', label: 'Baja' },
                  ]}
                />
                <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {(['Crítica', 'Alta', 'Media', 'Baja'] as Severity[]).map(s => {
                    const c = SEV_COLORS[s];
                    return (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: c.solid, flexShrink: 0, display: 'inline-block' }} aria-hidden="true" />
                        <dt style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', minWidth: 55 }}>{s}</dt>
                        <dd style={{ margin: 0, fontWeight: 800, color: c.text, fontSize: '1rem' }}>
                          {m.sev[s]} <span style={{ fontWeight: 400, fontSize: '0.72rem', color: '#64748b' }}>({pct(m.sev[s], m.totalF)}%)</span>
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
              {/* Barras de severidad */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(['Crítica', 'Alta', 'Media', 'Baja'] as Severity[]).map(s => (
                  <ProgressBar key={s} value={m.sev[s]} max={m.totalF} color={SEV_COLORS[s].solid} bgColor={SEV_COLORS[s].bg} label={`Severidad ${s}: ${m.sev[s]}`} showPct={false} height={12} />
                ))}
              </div>
            </Panel>

            {/* Estado + Prioridad */}
            <Panel style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Estado de resolución con dona */}
              <div>
                <h4 style={{ margin: '0 0 0.875rem', fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ClipboardCheck size={16} color="#003366" aria-hidden="true" /> Estado de resolución
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '0.875rem' }}>
                  <DonutChart
                    title={`Gráfico de estado de hallazgos: ${m.resolved} resueltos, ${m.sta['En progreso'] || 0} en progreso, ${m.pending} pendientes`}
                    size={120}
                    slices={[
                      { value: m.resolved,               color: '#16a34a', label: 'Resueltos' },
                      { value: m.sta['En progreso'] || 0, color: '#3b82f6', label: 'En progreso' },
                      { value: m.pending,                color: '#d97706', label: 'Pendientes' },
                    ]}
                  />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#14532d', lineHeight: 1 }}>{pct(m.resolved, m.totalF)}%</div>
                    <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginTop: 4 }}>hallazgos resueltos<br />({m.resolved} de {m.totalF})</div>
                  </div>
                </div>
                <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {[
                    { key: 'Resuelto',    icon: '✅', color: '#14532d', bg: '#f0fdf4', solid: '#16a34a' },
                    { key: 'En progreso', icon: '🔄', color: '#1e40af', bg: '#eff6ff', solid: '#3b82f6' },
                    { key: 'Pendiente',   icon: '⏳', color: '#78350f', bg: '#fffbeb', solid: '#d97706' },
                  ].map(s => (
                    <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '105px 1fr 30px', alignItems: 'center', gap: 8 }}>
                      <dt style={{ fontSize: '0.8rem', fontWeight: 700, color: s.color }}>{s.icon} {s.key}</dt>
                      <dd style={{ margin: 0 }}><ProgressBar value={m.sta[s.key] || 0} max={m.totalF} color={s.solid} bgColor={s.bg} label={`Estado ${s.key}: ${m.sta[s.key] || 0}`} showPct={false} height={12} /></dd>
                      <span style={{ textAlign: 'right', fontWeight: 800, color: s.color, fontSize: '0.9rem' }}>{m.sta[s.key] || 0}</span>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Prioridad */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.875rem' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
                  Por prioridad de corrección
                </h4>
                <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {(['Alta', 'Media', 'Baja'] as Priority[]).map(p => {
                    const c = PRI_COLORS[p];
                    return (
                      <div key={p} style={{ display: 'grid', gridTemplateColumns: '55px 1fr 30px', alignItems: 'center', gap: 8 }}>
                        <dt><PriBadge pri={p} /></dt>
                        <dd style={{ margin: 0 }}><ProgressBar value={m.pri[p]} max={m.totalF} color={c.solid} bgColor={c.bg} label={`Prioridad ${p}: ${m.pri[p]}`} showPct={false} height={12} /></dd>
                        <span style={{ textAlign: 'right', fontWeight: 800, color: c.text, fontSize: '0.9rem' }}>{m.pri[p]}</span>
                      </div>
                    );
                  })}
                </dl>
              </div>
            </Panel>
          </div>
        </section>
      )}

      {m.totalF > 0 && (
        <section aria-labelledby="findings-table-title" style={{ marginBottom: '2rem' }}>
          <SectionTitle id="findings-table-title" icon={<ClipboardCheck size={18} aria-hidden="true" />}>
            Hallazgos priorizados (ordenados por severidad)
          </SectionTitle>

          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[...findings].sort((a, b) => {
                const so: Record<Severity, number> = { Crítica: 0, Alta: 1, Media: 2, Baja: 3 };
                const po: Record<Priority, number>  = { Alta: 0, Media: 1, Baja: 2 };
                return (so[a.severity] - so[b.severity]) || (po[a.priority] - po[b.priority]);
              }).map((f, i) => {
                const sc = SEV_COLORS[f.severity];
                const stConf = { 'Resuelto': { bg: '#f0fdf4', color: '#14532d', icon: '✅' }, 'En progreso': { bg: '#eff6ff', color: '#1e40af', icon: '🔄' }, 'Pendiente': { bg: '#fffbeb', color: '#78350f', icon: '⏳' } }[f.status] ?? { bg: '#f8fafc', color: '#334155', icon: '⏳' };
                return (
                  <article key={f.id} style={{ border: `2px solid ${sc.border}`, borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }} aria-label={`Hallazgo ${i + 1}: severidad ${f.severity}, prioridad ${f.priority}, estado ${f.status}`}>
                    <div style={{ backgroundColor: sc.bg, padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontWeight: 700, color: sc.text, fontSize: '0.85rem' }}>#{i + 1} — {f.severity}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <PriBadge pri={f.priority} />
                        <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: '0.75rem', backgroundColor: stConf.bg, color: stConf.color, fontWeight: 600, border: `1px solid ${stConf.color}` }}>{stConf.icon} {f.status}</span>
                      </div>
                    </div>
                    <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {f.problem && <div><span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Problema</span><p style={{ margin: '3px 0 0', fontSize: '0.88rem', color: '#1e293b' }}>{f.problem}</p></div>}
                      {f.recommendation && <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8 }}><span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Recomendación</span><p style={{ margin: '3px 0 0', fontSize: '0.88rem', color: '#1e293b' }}>{f.recommendation}</p></div>}
                      {f.evidence && <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8 }}><span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Evidencia</span><p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: '#475569', fontStyle: 'italic' }}>{f.evidence}</p></div>}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <Panel style={{ padding: 0, overflow: 'hidden' }}>
              <div className="data-table-container">
                <table className="data-table" style={{ minWidth: 700 }} aria-label="Hallazgos priorizados">
                  <caption className="sr-only">Hallazgos ordenados por severidad de crítico a bajo, luego por prioridad.</caption>
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: 40 }}>#</th>
                      <th scope="col">Problema identificado</th>
                      <th scope="col" style={{ width: 105 }}>Severidad</th>
                      <th scope="col" style={{ width: 95 }}>Prioridad</th>
                      <th scope="col">Recomendación</th>
                      <th scope="col" style={{ width: 120 }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...findings].sort((a, b) => {
                      const so: Record<Severity, number> = { Crítica: 0, Alta: 1, Media: 2, Baja: 3 };
                      const po: Record<Priority, number>  = { Alta: 0, Media: 1, Baja: 2 };
                      return (so[a.severity] - so[b.severity]) || (po[a.priority] - po[b.priority]);
                    }).map((f, i) => {
                      const sc = SEV_COLORS[f.severity];
                      const stConf = { 'Resuelto': { bg: '#f0fdf4', color: '#14532d', icon: '✅' }, 'En progreso': { bg: '#eff6ff', color: '#1e40af', icon: '🔄' }, 'Pendiente': { bg: '#fffbeb', color: '#78350f', icon: '⏳' } }[f.status] ?? { bg: '#f8fafc', color: '#334155', icon: '⏳' };
                      return (
                        <tr key={f.id} style={{ borderLeft: `4px solid ${sc.border}` }}>
                          <td style={{ textAlign: 'center' }}><span className="id-badge">{i + 1}</span></td>
                          <td style={{ fontSize: '0.88rem', color: '#1e293b' }}>
                            {f.problem || <em style={{ color: '#94a3b8' }}>Sin descripción</em>}
                            {f.evidence && <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>📎 {f.evidence}</p>}
                          </td>
                          <td style={{ textAlign: 'center' }}><SevBadge sev={f.severity} /></td>
                          <td style={{ textAlign: 'center' }}><PriBadge pri={f.priority} /></td>
                          <td style={{ fontSize: '0.88rem', color: '#1e293b' }}>{f.recommendation || <em style={{ color: '#94a3b8' }}>Sin recomendación</em>}</td>
                          <td style={{ textAlign: 'center' }}><span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 4, fontSize: '0.78rem', backgroundColor: stConf.bg, color: stConf.color, fontWeight: 700, border: `1px solid ${stConf.color}` }}>{stConf.icon} {f.status}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </section>
      )}


      {observations.length > 0 && (
        <section aria-labelledby="obs-title" style={{ marginBottom: '2rem' }}>
          <SectionTitle id="obs-title" icon={<BarChart2 size={18} aria-hidden="true" />}>
            Detalle de observaciones por participante
          </SectionTitle>
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {observations.map((o, i) => {
                const rc = SUCCESS_CONFIG[o.success_level] ?? SUCCESS_CONFIG['No'];
                return (
                  <article key={o.id} style={{ border: `1px solid ${rc.border}`, borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' }} aria-label={`Observación ${i + 1}: ${o.participant || 'Sin nombre'}, resultado: ${o.success_level}`}>
                    <div style={{ backgroundColor: rc.bg, padding: '0.5rem 0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: rc.text, fontSize: '0.88rem' }}>{rc.icon} {o.participant || `Obs. ${i + 1}`}{o.task_ref && <span style={{ marginLeft: 8, fontSize: '0.78rem' }}>· <span className="id-badge" style={{ fontSize: '0.72rem' }}>{o.task_ref}</span></span>}</strong>
                      <span style={{ color: rc.text, fontWeight: 700, fontSize: '0.8rem' }}>{o.success_level}</span>
                    </div>
                    <div style={{ padding: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem' }}>
                      <div><span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tiempo</span><p style={{ margin: '2px 0 0', fontWeight: 700, color: '#1e293b' }}>{o.time_seconds ?? 0}s</p></div>
                      <div><span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Errores</span><p style={{ margin: '2px 0 0', fontWeight: 700, color: (o.errors || 0) > 2 ? '#dc2626' : '#1e293b' }}>{o.errors ?? 0}</p></div>
                      {o.profile  && <div style={{ gridColumn: '1/-1' }}><span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Perfil</span><p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#334155' }}>{o.profile}</p></div>}
                      {o.comments && <div style={{ gridColumn: '1/-1' }}><span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Comentarios</span><p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#334155' }}>{o.comments}</p></div>}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <Panel style={{ padding: 0, overflow: 'hidden' }}>
              <div className="data-table-container">
                <table className="data-table" style={{ minWidth: 620 }} aria-label="Detalle de observaciones por participante">
                  <caption className="sr-only">Registros de sesión con participante, tarea, resultado, tiempo, errores y comentarios.</caption>
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: 36 }}>#</th>
                      <th scope="col" style={{ width: 100 }}>Participante</th>
                      <th scope="col" style={{ width: 130 }}>Perfil</th>
                      <th scope="col" style={{ width: 70 }}>Tarea</th>
                      <th scope="col" style={{ width: 115 }}>Resultado</th>
                      <th scope="col" style={{ width: 95 }}>Tiempo (s)</th>
                      <th scope="col" style={{ width: 75 }}>Errores</th>
                      <th scope="col">Comentarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {observations.map((o, i) => {
                      const rc = SUCCESS_CONFIG[o.success_level] ?? SUCCESS_CONFIG['No'];
                      return (
                        <tr key={o.id}>
                          <td style={{ textAlign: 'center' }}><span className="id-badge">{i + 1}</span></td>
                          <td style={{ fontWeight: 600 }}>{o.participant || '—'}</td>
                          <td style={{ fontSize: '0.83rem' }}>{o.profile || '—'}</td>
                          <td style={{ textAlign: 'center' }}>{o.task_ref ? <span className="id-badge">{o.task_ref}</span> : <span style={{ color: '#94a3b8' }}>—</span>}</td>
                          <td style={{ textAlign: 'center' }}><span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 99, backgroundColor: rc.bg, color: rc.text, border: `1px solid ${rc.border}`, fontWeight: 700, fontSize: '0.78rem' }}>{rc.icon} {o.success_level}</span></td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{o.time_seconds ?? 0}s</td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: (o.errors || 0) > 2 ? '#dc2626' : '#334155' }}>{o.errors ?? 0}</td>
                          <td style={{ fontSize: '0.83rem', color: '#334155' }}>{o.comments || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </section>
      )}

      {/* Pie */}
      <footer role="contentinfo" aria-label="Pie de página del reporte" style={{ padding: '0.875rem 1.1rem', backgroundColor: '#003366', color: 'rgba(255,255,255,0.85)', borderRadius: 8, fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <span>📊 Reporte generado automáticamente · Usability Test Dashboard Web</span>
        <span>{new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </footer>
    </div>
  );
};