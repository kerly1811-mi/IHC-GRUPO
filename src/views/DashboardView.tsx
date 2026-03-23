import React, { useMemo } from 'react';
import { TestPlan, TestTask, Observation, Finding, DashboardTab } from '../models/types';
import {
  ClipboardList, FileText, Search, BarChart2, TrendingUp,
  CheckCircle2, Clock, AlertTriangle, Users,
  ArrowRight, Activity, Zap, Target, Shield
} from 'lucide-react';
import './DashboardView.css';

interface DashboardViewProps {
  allPlans: TestPlan[];
  testPlan: TestPlan;
  tasks: TestTask[];
  observations: Observation[];
  findings: Finding[];
  onTabChange: (tab: DashboardTab) => void;
  onLoadPlan: (plan: TestPlan) => void;
}

const fmtTime = (s: number) =>
  s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

const pct = (n: number, total: number) =>
  total === 0 ? 0 : Math.round((n / total) * 100);

export const DashboardView: React.FC<DashboardViewProps> = ({
  allPlans, testPlan, tasks, observations, findings, onTabChange, onLoadPlan,
}) => {
  const metrics = useMemo(() => {
    const total = observations.length;
    const ok    = observations.filter(o => o.success_level === 'Sí').length;
    const help  = observations.filter(o => o.success_level === 'Con ayuda').length;
    const fail  = observations.filter(o => o.success_level === 'No').length;
    const errors = observations.reduce((s, o) => s + (o.errors || 0), 0);
    const times  = observations.map(o => o.time_seconds || 0);
    const avgTime = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

    const sevCount: Record<string, number> = { Baja: 0, Media: 0, Alta: 0, 'Crítica': 0 };
    const staCount: Record<string, number> = { Pendiente: 0, 'En progreso': 0, Resuelto: 0 };
    findings.forEach(f => {
      sevCount[f.severity] = (sevCount[f.severity] || 0) + 1;
      staCount[f.status]   = (staCount[f.status]   || 0) + 1;
    });

    const successRate   = pct(ok, total);
    const criticalCount = (sevCount['Crítica'] || 0) + (sevCount['Alta'] || 0);
    const resolvedRate  = pct(staCount['Resuelto'] || 0, findings.length);

    const usabilityScore =
      successRate >= 80 ? 'Aceptable' :
      successRate >= 60 ? 'Mejorable' :
      successRate >= 40 ? 'Deficiente' : 'Crítica';

    // Colores WCAG AA: texto oscuro sobre fondo blanco/claro
    // ratio mínimo 4.5:1 para texto normal
    const usabilityColor =
      successRate >= 80 ? '#14532d' :  // verde oscuro — 7.2:1 sobre blanco
      successRate >= 60 ? '#78350f' :  // ámbar oscuro — 7.5:1 sobre blanco
      successRate >= 40 ? '#7c2d12' :  // naranja oscuro — 7.1:1 sobre blanco
                          '#7f1d1d';   // rojo oscuro — 7.4:1 sobre blanco

    const usabilityBg =
      successRate >= 80 ? '#f0fdf4' :
      successRate >= 60 ? '#fffbeb' :
      successRate >= 40 ? '#fff7ed' : '#fef2f2';

    return {
      total, ok, help, fail, errors, avgTime,
      sevCount, staCount, successRate, criticalCount,
      resolvedRate, usabilityScore, usabilityColor, usabilityBg,
      totalFindings: findings.length,
      resolvedCount: staCount['Resuelto'] || 0,
    };
  }, [observations, findings]);

  const recentPlans = allPlans.slice(0, 5);

  // Colores de acciones rápidas: todos con contraste >= 4.5:1 sobre su bg
  const quickActions = [
    { icon: <ClipboardList size={22} />, label: 'Plan de Prueba',   tab: 'plan'         as DashboardTab, desc: 'Define contexto y tareas',   color: '#003366', bg: '#e8eef7' },
    { icon: <FileText      size={22} />, label: 'Guion y Tareas',    tab: 'script'       as DashboardTab, desc: 'Redacta el guion de sesión', color: '#1e3a8a', bg: '#dbeafe' },
    { icon: <Search        size={22} />, label: 'Observaciones',     tab: 'observations' as DashboardTab, desc: 'Registra lo observado',      color: '#134e4a', bg: '#ccfbf1' },
    { icon: <BarChart2     size={22} />, label: 'Hallazgos',         tab: 'findings'     as DashboardTab, desc: 'Documenta mejoras',          color: '#4c1d95', bg: '#ede9fe' },
    { icon: <Activity      size={22} />, label: 'Reportes',          tab: 'reports'      as DashboardTab, desc: 'Genera el informe final',    color: '#78350f', bg: '#fef3c7' },
  ];

  const hasData = observations.length > 0 || findings.length > 0;

  // KPI: iconBg claro + accent OSCURO para garantizar contraste icono/bg y texto/bg
  const kpiCards = [
    {
      value: observations.length,
      label: 'Observaciones',
      sub: `${metrics.ok} exitosas`,
      icon: <CheckCircle2 size={20} aria-hidden="true" />,
      accent: '#003366',   // ratio ~10:1 sobre blanco
      iconBg: '#dbeafe',   // azul claro
    },
    {
      value: `${metrics.successRate}%`,
      label: 'Tasa de éxito',
      sub: metrics.usabilityScore,
      icon: <TrendingUp size={20} aria-hidden="true" />,
      accent: metrics.usabilityColor,  // ya es oscuro (ver usabilityColor arriba)
      iconBg: metrics.usabilityBg,
    },
    {
      value: fmtTime(metrics.avgTime),
      label: 'Tiempo promedio',
      sub: 'por sesión',
      icon: <Clock size={20} aria-hidden="true" />,
      accent: '#1e3a8a',   // azul muy oscuro ~9:1
      iconBg: '#dbeafe',
    },
    {
      value: findings.length,
      label: 'Hallazgos',
      sub: `${metrics.criticalCount} críticos`,
      icon: <AlertTriangle size={20} aria-hidden="true" />,
      accent: '#4c1d95',   // violeta oscuro ~8:1
      iconBg: '#ede9fe',
    },
    {
      value: `${metrics.resolvedRate}%`,
      label: 'Resueltos',
      sub: `${metrics.resolvedCount} de ${findings.length}`,
      icon: <Shield size={20} aria-hidden="true" />,
      accent: '#134e4a',   // verde azulado oscuro ~8.5:1
      iconBg: '#ccfbf1',
    },
  ];

  // Distribución: colores oscuros sobre fondo blanco (no sobre pastel)
  const distRows = [
    { label: 'Completadas', val: metrics.ok,   textColor: '#14532d', barColor: '#16a34a', icon: '✅' },
    { label: 'Con ayuda',   val: metrics.help, textColor: '#78350f', barColor: '#d97706', icon: '🤝' },
    { label: 'Fallidas',    val: metrics.fail, textColor: '#7f1d1d', barColor: '#dc2626', icon: '❌' },
  ];

  // Severidad: fondo sólido OSCURO + texto blanco — contraste garantizado
  const sevCards = [
    { sev: 'Crítica', bg: '#991b1b', text: '#ffffff', border: '#7f1d1d' },
    { sev: 'Alta',    bg: '#9a3412', text: '#ffffff', border: '#7c2d12' },
    { sev: 'Media',   bg: '#92400e', text: '#ffffff', border: '#78350f' },
    { sev: 'Baja',    bg: '#14532d', text: '#ffffff', border: '#166534' },
  ];

  return (
    <div className="db-root">

      {/* ══ HERO ══ */}
      <section className="db-hero" aria-labelledby="db-hero-title">
        <div className="db-hero-bg" aria-hidden="true">
          <div className="db-hero-orb db-hero-orb-1" />
          <div className="db-hero-orb db-hero-orb-2" />
          <div className="db-hero-grid" />
        </div>
        <div className="db-hero-content">
          <div className="db-hero-badge">
            <Zap size={13} aria-hidden="true" />
            <span>Panel de Control</span>
          </div>
          <h2 id="db-hero-title" className="db-hero-title">
            {testPlan.product
              ? <>Bienvenido al plan de <em>{testPlan.product}</em></>
              : 'Gestión de Pruebas de Usabilidad'
            }
          </h2>
          {testPlan.module && (
            <p className="db-hero-sub">Módulo: <strong>{testPlan.module}</strong></p>
          )}
          <div className="db-hero-meta">
            {testPlan.moderator && (
              <span className="db-chip">
                <Users size={12} aria-hidden="true" /> {testPlan.moderator}
              </span>
            )}
            <span className="db-chip">
              <ClipboardList size={12} aria-hidden="true" /> {allPlans.length} plan{allPlans.length !== 1 ? 'es' : ''}
            </span>
            <span className="db-chip">
              <Target size={12} aria-hidden="true" /> {tasks.length} tarea{tasks.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </section>

      {/* ══ KPI STRIP ══ */}
      <section className="db-kpi-strip" aria-label="Métricas principales">
        {kpiCards.map((kpi, i) => (
          <article
            key={i}
            className="db-kpi-card"
            style={{ '--accent': kpi.accent } as React.CSSProperties}
          >
            <div
              className="db-kpi-icon"
              style={{ background: kpi.iconBg, color: kpi.accent }}
              aria-hidden="true"
            >
              {kpi.icon}
            </div>
            <div className="db-kpi-body">
              {/* valor: color oscuro sobre fondo blanco de la card */}
              <span className="db-kpi-value" style={{ color: kpi.accent }}>
                {kpi.value}
              </span>
              {/* label y sub: color de texto estándar oscuro */}
              <span className="db-kpi-label">{kpi.label}</span>
              <span className="db-kpi-sub">{kpi.sub}</span>
            </div>
          </article>
        ))}
      </section>

      {/* ══ MAIN GRID ══ */}
      <div className="db-main-grid">

        {/* ── Acciones rápidas ── */}
        <section className="db-panel db-panel-actions" aria-labelledby="db-actions-heading">
          <header className="db-panel-header">
            <h3 id="db-actions-heading" className="db-panel-title">
              <Zap size={16} aria-hidden="true" /> Acceso rápido
            </h3>
          </header>
          <div className="db-actions-grid">
            {quickActions.map((action) => (
              <button
                key={action.tab}
                className="db-action-btn"
                onClick={() => onTabChange(action.tab)}
                style={{ '--btn-color': action.color, '--btn-bg': action.bg } as React.CSSProperties}
                aria-label={`Ir a ${action.label}: ${action.desc}`}
              >
                <span
                  className="db-action-icon"
                  style={{ background: action.bg, color: action.color }}
                  aria-hidden="true"
                >
                  {action.icon}
                </span>
                <div className="db-action-text">
                  {/* strong: color oscuro #0f172a sobre fondo blanco */}
                  <strong>{action.label}</strong>
                  {/* desc: --db-muted #475569 — ratio 4.6:1 sobre blanco ✓ */}
                  <span>{action.desc}</span>
                </div>
                <ArrowRight size={16} className="db-action-arrow" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        {/* ── Columna derecha ── */}
        <div className="db-right-col">

          {/* Distribución por estado */}
          {hasData && (
            <section className="db-panel" aria-labelledby="db-dist-heading">
              <header className="db-panel-header">
                <h3 id="db-dist-heading" className="db-panel-title">
                  <Activity size={16} aria-hidden="true" /> Distribución por estado
                </h3>
              </header>
              <div className="db-dist-body">
                {distRows.map(row => (
                  <div key={row.label} className="db-dist-row">
                    <div className="db-dist-label">
                      <span aria-hidden="true">{row.icon}</span>
                      {/* texto sobre fondo blanco: color oscuro garantiza ratio */}
                      <span style={{ color: row.textColor }}>{row.label}</span>
                    </div>
                    <div
                      className="db-dist-bar-wrap"
                      role="progressbar"
                      aria-valuenow={pct(row.val, metrics.total)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${row.label}: ${pct(row.val, metrics.total)}%`}
                    >
                      <div className="db-dist-bar">
                        <div
                          className="db-dist-fill"
                          style={{ width: `${pct(row.val, metrics.total)}%`, background: row.barColor }}
                        />
                      </div>
                    </div>
                    {/* valor numérico: color oscuro sobre blanco */}
                    <span className="db-dist-val" style={{ color: row.textColor }}>
                      {row.val}
                      <span className="db-dist-pct"> ({pct(row.val, metrics.total)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Hallazgos por severidad — fondo sólido oscuro + texto blanco */}
          {findings.length > 0 && (
            <section className="db-panel" aria-labelledby="db-sev-heading">
              <header className="db-panel-header">
                <h3 id="db-sev-heading" className="db-panel-title">
                  <AlertTriangle size={16} aria-hidden="true" /> Hallazgos por severidad
                </h3>
                <button
                  className="db-link-btn"
                  onClick={() => onTabChange('findings')}
                  aria-label="Ver todos los hallazgos"
                >
                  Ver todos <ArrowRight size={13} aria-hidden="true" />
                </button>
              </header>
              <div className="db-sev-grid">
                {sevCards.map(s => (
                  <div
                    key={s.sev}
                    className="db-sev-card"
                    style={{ background: s.bg, border: `1px solid ${s.border}` }}
                  >
                    {/* blanco sobre fondo oscuro: ratio > 7:1 ✓ */}
                    <span className="db-sev-count" style={{ color: s.text }}>
                      {metrics.sevCount[s.sev] || 0}
                    </span>
                    <span className="db-sev-label" style={{ color: s.text }}>
                      {s.sev}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Planes recientes */}
          <section className="db-panel" aria-labelledby="db-recent-heading">
            <header className="db-panel-header">
              <h3 id="db-recent-heading" className="db-panel-title">
                <ClipboardList size={16} aria-hidden="true" /> Planes recientes
              </h3>
            </header>
            {recentPlans.length === 0 ? (
              <p className="db-empty-msg">No hay planes aún. ¡Crea el primero!</p>
            ) : (
              <ul className="db-recent-list">
                {recentPlans.map((plan) => (
                  <li key={plan.id}>
                    <button
                      className="db-recent-item"
                      onClick={() => onLoadPlan(plan)}
                      aria-label={`Cargar plan: ${plan.product || 'Sin nombre'}`}
                    >
                      <span className="db-recent-dot" aria-hidden="true">📋</span>
                      <div className="db-recent-text">
                        {/* strong: #0f172a sobre blanco ~18:1 ✓ */}
                        <strong>{plan.product || 'Sin nombre'}</strong>
                        {/* span: #475569 sobre blanco ~4.6:1 ✓ */}
                        <span>{plan.module || 'Módulo no especificado'}</span>
                      </div>
                      <span className="db-recent-date">
                        {plan.created_at
                          ? new Date(plan.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
                          : '—'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>
      </div>

      {/* ══ ESTADO VACÍO ══ */}
      {!hasData && !testPlan.product && (
        <section className="db-empty-state" aria-labelledby="db-empty-heading">
          <div className="db-empty-icon" aria-hidden="true">
            <ClipboardList size={48} />
          </div>
          <h3 id="db-empty-heading">Empieza tu primera prueba</h3>
          <p>Crea un plan de prueba de usabilidad y comienza a registrar observaciones y hallazgos.</p>
          <button className="db-cta-btn" onClick={() => onTabChange('plan')}>
            Crear mi primer plan <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>
      )}

    </div>
  );
};