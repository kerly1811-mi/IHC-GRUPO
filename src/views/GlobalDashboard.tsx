import React, { useMemo } from 'react';
import { TestPlan, Observation, Finding } from '../models/types';
import {
  ClipboardList, TrendingUp, Clock,
  AlertTriangle, Shield, Plus, ArrowRight, 
  BarChart2, Users, Zap, Search
} from 'lucide-react';
import './GlobalDashboard.css';

interface GlobalDashboardProps {
  allPlans: TestPlan[];
  allObservations: Observation[];
  allFindings: Finding[];
  onSelectPlan: (plan: TestPlan) => void;
  onCreatePlan: () => void;
}

const pct = (n: number, t: number) => (t === 0 ? 0 : Math.round((n / t) * 100));
const fmtTime = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

const SEV_COLORS: Record<string, { bg: string; text: string }> = {
  'Crítica': { bg: '#991b1b', text: '#fff' },
  'Alta':    { bg: '#9a3412', text: '#fff' },
  'Media':   { bg: '#92400e', text: '#fff' },
  'Baja':    { bg: '#14532d', text: '#fff' },
};

export const GlobalDashboard: React.FC<GlobalDashboardProps> = ({
  allPlans, allObservations, allFindings, onSelectPlan, onCreatePlan,
}) => {
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 10;

  const global = useMemo(() => {
    const total  = allObservations.length;
    const ok     = allObservations.filter(o => o.success_level === 'Sí').length;
    const times  = allObservations.map(o => o.time_seconds || 0);
    const avgTime = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    const errors  = allObservations.reduce((s, o) => s + (o.errors || 0), 0);
    const successRate = pct(ok, total);

    const sev: Record<string, number> = { Baja: 0, Media: 0, Alta: 0, 'Crítica': 0 };
    const resolved = allFindings.filter(f => f.status === 'Resuelto').length;
    allFindings.forEach(f => { sev[f.severity] = (sev[f.severity] || 0) + 1; });

    const usabilityScore =
      successRate >= 80 ? 'Aceptable' :
      successRate >= 60 ? 'Mejorable' :
      successRate >= 40 ? 'Deficiente' : total === 0 ? '—' : 'Crítica';

    const usabilityColor =
      successRate >= 80 ? '#14532d' :
      successRate >= 60 ? '#78350f' :
      successRate >= 40 ? '#7c2d12' :
      total === 0        ? '#374151' : '#7f1d1d';

    return {
      total, ok, avgTime, errors, successRate,
      sev, resolved, usabilityScore, usabilityColor,
      totalFindings: allFindings.length,
      resolvedRate: pct(resolved, allFindings.length),
    };
  }, [allObservations, allFindings]);

  // métricas por plan para las tarjetas
  const planMetrics = useMemo(() => {
    return allPlans.map(plan => {
      const obs = allObservations.filter(o => o.test_plan_id === plan.id);
      const fin = allFindings.filter(f => f.test_plan_id === plan.id);
      const ok  = obs.filter(o => o.success_level === 'Sí').length;
      const criticalF = fin.filter(f => f.severity === 'Crítica' || f.severity === 'Alta').length;
      const rate = pct(ok, obs.length);
      const score =
        rate >= 80 ? 'Aceptable' :
        rate >= 60 ? 'Mejorable' :
        rate >= 40 ? 'Deficiente' :
        obs.length === 0 ? 'Sin datos' : 'Crítica';
      const scoreColor =
        rate >= 80 ? '#14532d' :
        rate >= 60 ? '#78350f' :
        rate >= 40 ? '#7c2d12' :
        obs.length === 0 ? '#374151' : '#7f1d1d';
      const scoreBg =
        rate >= 80 ? '#dcfce7' :
        rate >= 60 ? '#fef3c7' :
        rate >= 40 ? '#ffedd5' :
        obs.length === 0 ? '#f1f5f9' : '#fee2e2';
      return { plan, obs: obs.length, fin: fin.length, ok, rate, criticalF, score, scoreColor, scoreBg };
    });
  }, [allPlans, allObservations, allFindings]);

  const filtered = planMetrics.filter(pm =>
    pm.plan.product?.toLowerCase().includes(search.toLowerCase()) ||
    pm.plan.module?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1); // reset al buscar
  };

  const kpis = [
    { value: allPlans.length,           label: 'Planes totales',    sub: 'registrados',              icon: <ClipboardList size={20} />, accent: '#003366', iconBg: '#dbeafe' },
    { value: allObservations.length,    label: 'Observaciones',     sub: 'en todos los planes',      icon: <Users         size={20} />, accent: '#1e3a8a', iconBg: '#e0e7ff' },
    { value: `${global.successRate}%`,  label: 'Tasa de éxito',     sub: global.usabilityScore,      icon: <TrendingUp    size={20} />, accent: global.usabilityColor, iconBg: '#f0fdf4' },
    { value: fmtTime(global.avgTime),   label: 'Tiempo promedio',   sub: 'por sesión global',        icon: <Clock         size={20} />, accent: '#134e4a', iconBg: '#ccfbf1' },
    { value: allFindings.length,        label: 'Hallazgos',         sub: `${global.sev['Crítica'] + global.sev['Alta']} críticos`, icon: <AlertTriangle size={20} />, accent: '#4c1d95', iconBg: '#ede9fe' },
    { value: `${global.resolvedRate}%`, label: 'Resueltos',         sub: `${global.resolved} de ${global.totalFindings}`, icon: <Shield size={20} />, accent: '#134e4a', iconBg: '#ccfbf1' },
  ];

  return (
    <div className="gd-root">

      {/* ══ HERO GLOBAL ══ */}
      <section className="gd-hero" aria-labelledby="gd-hero-title">
        <div className="gd-hero-bg" aria-hidden="true">
          <div className="gd-orb gd-orb-1" />
          <div className="gd-orb gd-orb-2" />
          <div className="gd-orb gd-orb-3" />
          <div className="gd-grid" />
        </div>
        <div className="gd-hero-inner">
          <div className="gd-hero-left">
            <span className="gd-badge"><Zap size={12} aria-hidden="true" /> Panel de Control Global</span>
            <h2 id="gd-hero-title" className="gd-hero-title">
              Gestión de Pruebas<br />
              <em>de Usabilidad</em>
            </h2>
            <p className="gd-hero-sub">
              Visión general de todos tus planes, observaciones y hallazgos en un solo lugar.
            </p>
          </div>
          <div className="gd-hero-score" aria-label={`Usabilidad global: ${global.usabilityScore}`}>
            <span className="gd-score-num" style={{ color: '#fff' }}>
              {global.total === 0 ? '—' : `${global.successRate}%`}
            </span>
            <span className="gd-score-label">Tasa de éxito global</span>
            <span className="gd-score-badge">{global.usabilityScore}</span>
          </div>
        </div>
      </section>

      {/* ══ KPIs GLOBALES ══ */}
      <section className="gd-kpi-row" aria-label="Indicadores globales">
        {kpis.map((k, i) => (
          <article key={i} className="gd-kpi" style={{ '--accent': k.accent } as React.CSSProperties}>
            <div className="gd-kpi-icon" style={{ background: k.iconBg, color: k.accent }} aria-hidden="true">
              {k.icon}
            </div>
            <div className="gd-kpi-body">
              <span className="gd-kpi-value" style={{ color: k.accent }}>{k.value}</span>
              <span className="gd-kpi-label">{k.label}</span>
              <span className="gd-kpi-sub">{k.sub}</span>
            </div>
          </article>
        ))}
      </section>

      {/* ══ LISTA DE PLANES ══ */}
      <section className="gd-plans-section" aria-labelledby="gd-plans-title">
        <div className="gd-plans-header">
          <div className="gd-plans-title-row">
            <h3 id="gd-plans-title" className="gd-section-title">
              <BarChart2 size={18} aria-hidden="true" /> Todos los planes
            </h3>
            <span className="gd-count-badge">{allPlans.length} plan{allPlans.length !== 1 ? 'es' : ''}</span>
          </div>
          <div className="gd-plans-controls">
            {/* Buscador */}
            <div className="gd-search-wrap">
              <Search size={16} aria-hidden="true" className="gd-search-icon" />
              <input
                type="search"
                placeholder="Buscar plan..."
                value={search}
                onChange={e => handleSearch(e.target.value)}
                className="gd-search-input"
                aria-label="Buscar plan por producto o módulo"
              />
            </div>
            <button className="gd-btn-new" onClick={onCreatePlan} aria-label="Crear nuevo plan de prueba">
              <Plus size={16} aria-hidden="true" /> Nuevo plan
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="gd-empty">
            <ClipboardList size={48} aria-hidden="true" />
            <h4>{search ? 'Sin resultados' : 'No hay planes todavía'}</h4>
            <p>{search ? 'Prueba con otra búsqueda.' : 'Crea tu primer plan de prueba de usabilidad.'}</p>
            {!search && (
              <button className="gd-btn-new gd-btn-new--lg" onClick={onCreatePlan}>
                <Plus size={18} aria-hidden="true" /> Crear primer plan
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Cabecera tabla */}
            <div className="gd-table-head" aria-hidden="true">
              <span>Plan / Módulo</span>
              <span>Observaciones</span>
              <span>Éxito</span>
              <span>Hallazgos</span>
              <span>Críticos</span>
              <span>Estado</span>
              <span></span>
            </div>

            <ul className="gd-plan-list">
              {paginated.map(({ plan, obs, fin, ok, rate, criticalF, score, scoreColor, scoreBg }) => (
                <li key={plan.id}>
                  <button
                    className="gd-plan-row"
                    onClick={() => onSelectPlan(plan)}
                    aria-label={`Abrir plan: ${plan.product || 'Sin nombre'} - ${plan.module || 'Sin módulo'}`}
                  >
                    {/* Nombre */}
                    <div className="gd-plan-name">
                      <strong>{plan.product || 'Sin nombre'}</strong>
                      <span>{plan.module || 'Módulo no especificado'}</span>
                      {plan.moderator && (
                        <span className="gd-plan-mod">
                          <Users size={11} aria-hidden="true" /> {plan.moderator}
                        </span>
                      )}
                    </div>

                    {/* Observaciones */}
                    <div className="gd-plan-cell">
                      <span className="gd-cell-num">{obs}</span>
                      <span className="gd-cell-sub">{ok} exitosas</span>
                    </div>

                    {/* Tasa éxito */}
                    <div className="gd-plan-cell">
                      <span className="gd-cell-num" style={{ color: scoreColor }}>
                        {obs === 0 ? '—' : `${rate}%`}
                      </span>
                      <div className="gd-mini-bar" role="presentation">
                        <div
                          className="gd-mini-fill"
                          style={{
                            width: obs === 0 ? '0%' : `${rate}%`,
                            background: rate >= 80 ? '#16a34a' : rate >= 60 ? '#d97706' : '#dc2626',
                          }}
                        />
                      </div>
                    </div>

                    {/* Hallazgos */}
                    <div className="gd-plan-cell">
                      <span className="gd-cell-num">{fin}</span>
                      <span className="gd-cell-sub">hallazgos</span>
                    </div>

                    {/* Críticos */}
                    <div className="gd-plan-cell">
                      <span
                        className="gd-cell-num"
                        style={{ color: criticalF > 0 ? '#991b1b' : '#14532d' }}
                      >
                        {criticalF}
                      </span>
                      <span className="gd-cell-sub">críticos</span>
                    </div>

                    {/* Estado de usabilidad */}
                    <div className="gd-plan-cell">
                      <span
                        className="gd-status-badge"
                        style={{ background: scoreBg, color: scoreColor, border: `1px solid ${scoreColor}44` }}
                      >
                        {score}
                      </span>
                    </div>

                    {/* Acción */}
                    <div className="gd-plan-arrow">
                      <ArrowRight size={18} aria-hidden="true" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {/* ── Paginación ── */}
            {totalPages > 1 && (
              <nav
                className="gd-pagination"
                aria-label="Paginación de planes"
              >
                <span className="gd-page-info" aria-live="polite">
                  {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length} planes
                </span>
                <div className="gd-page-controls">
                  <button
                    className="gd-page-btn"
                    onClick={() => setPage(1)}
                    disabled={currentPage === 1}
                    aria-label="Primera página"
                    title="Primera"
                  >«</button>
                  <button
                    className="gd-page-btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Página anterior"
                    title="Anterior"
                  >‹</button>

                  {/* Números de página */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(n =>
                      n === 1 ||
                      n === totalPages ||
                      Math.abs(n - currentPage) <= 1
                    )
                    .reduce<(number | 'ellipsis')[]>((acc, n, idx, arr) => {
                      if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === 'ellipsis' ? (
                        <span key={`e-${idx}`} className="gd-page-ellipsis">…</span>
                      ) : (
                        <button
                          key={item}
                          className={`gd-page-btn${currentPage === item ? ' gd-page-btn--active' : ''}`}
                          onClick={() => setPage(item as number)}
                          aria-label={`Página ${item}`}
                          aria-current={currentPage === item ? 'page' : undefined}
                        >
                          {item}
                        </button>
                      )
                    )
                  }

                  <button
                    className="gd-page-btn"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Página siguiente"
                    title="Siguiente"
                  >›</button>
                  <button
                    className="gd-page-btn"
                    onClick={() => setPage(totalPages)}
                    disabled={currentPage === totalPages}
                    aria-label="Última página"
                    title="Última"
                  >»</button>
                </div>
              </nav>
            )}
          </>
        )}
      </section>

      {/* ══ SEVERIDAD GLOBAL ══ */}
      {allFindings.length > 0 && (
        <section className="gd-sev-section" aria-labelledby="gd-sev-title">
          <h3 id="gd-sev-title" className="gd-section-title">
            <AlertTriangle size={18} aria-hidden="true" /> Hallazgos globales por severidad
          </h3>
          <div className="gd-sev-grid">
            {(['Crítica', 'Alta', 'Media', 'Baja'] as const).map(s => {
              const c = SEV_COLORS[s];
              return (
                <div key={s} className="gd-sev-card" style={{ background: c.bg }}>
                  <span className="gd-sev-num" style={{ color: c.text }}>{global.sev[s] || 0}</span>
                  <span className="gd-sev-lbl" style={{ color: c.text }}>{s}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
};