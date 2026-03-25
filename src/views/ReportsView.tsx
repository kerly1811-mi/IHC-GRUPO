import React, { useMemo, useEffect, useState } from 'react';
import { TestPlan, TestTask, Observation, Finding, Severity, Priority } from '../models/types';
import {
  AlertTriangle, BarChart2, Download, Target, Users,
  CheckCircle2, XCircle, Clock, TrendingUp, TrendingDown,
  Minus, Shield, Zap, FileText, Activity
} from 'lucide-react';

/* ─── Hook ancho ─────────────────────────────────────────────────────────── */
function useWindowWidth() {
  const [width, setWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return width;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const pct = (n: number, total: number) => (total === 0 ? 0 : Math.round((n / total) * 100));
const avg = (arr: number[]) => (arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length));
const fmtTime = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

/* ─── Colores semánticos WCAG AA (contraste >= 4.5:1 sobre blanco) ──────── */
const SEV_MAP: Record<string, { bg: string; text: string; border: string; solid: string }> = {
  Baja:    { bg: '#dcfce7', text: '#14532d', border: '#16a34a', solid: '#15803d' },
  Media:   { bg: '#fef3c7', text: '#92400e', border: '#d97706', solid: '#b45309' },
  Alta:    { bg: '#ffedd5', text: '#7c2d12', border: '#ea580c', solid: '#c2410c' },
  'Crítica': { bg: '#fee2e2', text: '#7f1d1d', border: '#dc2626', solid: '#b91c1c' },
};

const PRI_MAP: Record<string, { bg: string; text: string; solid: string }> = {
  Baja:  { bg: '#eff6ff', text: '#1e3a8a', solid: '#1d4ed8' },
  Media: { bg: '#fef3c7', text: '#92400e', solid: '#b45309' },
  Alta:  { bg: '#fdf4ff', text: '#6b21a8', solid: '#7e22ce' },
};

const STATUS_MAP: Record<string, { bg: string; text: string; icon: string; border: string }> = {
  'Resuelto':    { bg: '#dcfce7', text: '#14532d', icon: '✅', border: '#16a34a' },
  'En progreso': { bg: '#dbeafe', text: '#1e3a8a', icon: '🔄', border: '#2563eb' },
  'Pendiente':   { bg: '#fef3c7', text: '#92400e', icon: '⏳', border: '#d97706' },
};

/* ─── Gráfico de dona SVG ────────────────────────────────────────────────── */
interface DonutSlice { value: number; color: string; label: string }
const DonutChart: React.FC<{
  slices: DonutSlice[]; size?: number;
  centerLabel?: string; centerSub?: string;
  svgTitle: string; svgTitleId: string;
}> = ({ slices, size = 180, centerLabel, centerSub, svgTitle, svgTitleId }) => {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return null;
  const cx = size / 2, cy = size / 2, R = size / 2 - 12, r = R * 0.58;
  let cum = 0;
  const paths = slices.map((sl, i) => {
    if (sl.value === 0) return null;
    const a0 = (cum / total) * 2 * Math.PI - Math.PI / 2;
    cum += sl.value;
    const a1 = (cum / total) * 2 * Math.PI - Math.PI / 2;
    if (sl.value === total) {
      return (
        <g key={i}>
          <circle cx={cx} cy={cy} r={R} fill={sl.color} />
          <circle cx={cx} cy={cy} r={r} fill="#fff" />
        </g>
      );
    }
    const x1o = cx + R * Math.cos(a0), y1o = cy + R * Math.sin(a0);
    const x2o = cx + R * Math.cos(a1), y2o = cy + R * Math.sin(a1);
    const x1i = cx + r * Math.cos(a1), y1i = cy + r * Math.sin(a1);
    const x2i = cx + r * Math.cos(a0), y2i = cy + r * Math.sin(a0);
    const la = sl.value / total > 0.5 ? 1 : 0;
    return (
      <path key={i}
        d={`M${x1o},${y1o} A${R},${R} 0 ${la},1 ${x2o},${y2o} L${x1i},${y1i} A${r},${r} 0 ${la},0 ${x2i},${y2i}Z`}
        fill={sl.color} stroke="#fff" strokeWidth={2}
      />
    );
  });
  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-labelledby={svgTitleId}
    >
      <title id={svgTitleId}>{svgTitle}</title>
      {paths}
      {centerLabel && (
        <>
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="800" fill="#1e293b">{centerLabel}</text>
          {centerSub && <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="600">{centerSub}</text>}
        </>
      )}
    </svg>
  );
};

/* ─── Barra horizontal ───────────────────────────────────────────────────── */
const HBar: React.FC<{ value: number; max: number; color: string; bg?: string; barLabel: string; h?: number }> = ({
  value, max, color, bg = '#e2e8f0', barLabel, h = 10,
}) => {
  const p = pct(value, max);
  return (
    <div
      role="progressbar"
      aria-valuenow={p}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${barLabel}: ${p} por ciento`}
      style={{ height: h, backgroundColor: bg, borderRadius: 99, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)' }}
    >
      <div style={{ height: '100%', width: `${p}%`, backgroundColor: color, borderRadius: 99, transition: 'width 0.5s ease', minWidth: p > 0 ? 4 : 0 }} />
    </div>
  );
};

/* ─── KPI Card ───────────────────────────────────────────────────────────── */
const KpiCard: React.FC<{
  value: string | number; label: string; sub?: string;
  icon: React.ReactNode; accent: string; bg: string; iconBg: string;
  trend?: 'up' | 'down' | 'neutral'; trendLabel?: string;
}> = ({ value, label, sub, icon, accent, bg, iconBg, trend, trendLabel }) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#14532d' : trend === 'down' ? '#7f1d1d' : '#374151';
  const trendBg    = trend === 'up' ? '#dcfce7'  : trend === 'down' ? '#fee2e2'  : '#f1f5f9';
  return (
    <article style={{ backgroundColor: bg, borderRadius: 12, padding: '1.1rem', border: `1px solid ${accent}44`, borderTop: `4px solid ${accent}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span aria-hidden="true" style={{ width: 40, height: 40, backgroundColor: iconBg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>{icon}</span>
        {trend && trendLabel && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: trendColor, fontWeight: 700, backgroundColor: trendBg, padding: '3px 8px', borderRadius: 99, border: `1px solid ${trendColor}55` }}>
            <TrendIcon size={12} aria-hidden="true" /> {trendLabel}
          </span>
        )}
      </div>
      <div>
        <div aria-hidden="true" style={{ fontSize: '2.2rem', fontWeight: 800, color: accent, lineHeight: 1, letterSpacing: '-1px' }}>{value}</div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.73rem', color: '#475569', marginTop: 2 }}>{sub}</div>}
      </div>
    </article>
  );
};

/* ─── Section header ─────────────────────────────────────────────────────── */
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; sub?: string; headingId: string }> = ({ icon, title, sub, headingId }) => (
  <div style={{ marginBottom: '1rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
      <span aria-hidden="true" style={{ color: '#003366', display: 'flex', alignItems: 'center' }}>{icon}</span>
      <h3 id={headingId} style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#003366', letterSpacing: '-0.3px' }}>{title}</h3>
    </div>
    {sub && <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', paddingLeft: 34 }}>{sub}</p>}
    <div style={{ height: 2, background: 'linear-gradient(90deg, #003366, transparent)', marginTop: 8, borderRadius: 99 }} />
  </div>
);

/* ─── Panel ──────────────────────────────────────────────────────────────── */
const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', ...style }}>
    {children}
  </div>
);

/* ─── Badges ─────────────────────────────────────────────────────────────── */
const SevBadge: React.FC<{ sev: Severity }> = ({ sev }) => {
  const c = SEV_MAP[sev] ?? SEV_MAP['Baja'];
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`, fontWeight: 700, fontSize: '0.73rem', whiteSpace: 'nowrap' }}>S: {sev}</span>;
};
const PriBadge: React.FC<{ pri: Priority }> = ({ pri }) => {
  const c = PRI_MAP[pri] ?? PRI_MAP['Baja'];
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, backgroundColor: c.bg, color: c.text, border: `1px solid ${c.solid}66`, fontWeight: 700, fontSize: '0.73rem', whiteSpace: 'nowrap' }}>P: {pri}</span>;
};
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const c = STATUS_MAP[status] ?? STATUS_MAP['Pendiente'];
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`, fontWeight: 700, fontSize: '0.73rem', whiteSpace: 'nowrap' }}>{c.icon} {status}</span>;
};

/* ─── Gráfico de barras verticales SVG ──────────────────────────────────── */
const BarChartV: React.FC<{
  data: { label: string; value: number; color: string; sublabel?: string }[];
  maxValue?: number; height?: number; svgTitle: string; svgTitleId: string;
}> = ({ data, maxValue, height = 140, svgTitle, svgTitleId }) => {
  const max = maxValue ?? Math.max(...data.map(d => d.value), 1);
  const barW = Math.min(60, Math.floor(500 / data.length) - 12);
  const svgW = data.length * (barW + 16) + 32;
  return (
    <svg
      width={svgW} height={height + 50}
      viewBox={`0 0 ${svgW} ${height + 50}`}
      style={{ display: 'block', margin: '0 auto' }}
      role="img"
      aria-labelledby={svgTitleId}
    >
      <title id={svgTitleId}>{svgTitle}</title>
      {data.map((d, i) => {
        const bh = max === 0 ? 0 : Math.round((d.value / max) * height);
        const x = 16 + i * (barW + 16);
        const y = height - bh + 10;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx={6} fill={d.color} />
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="12" fontWeight="800" fill={d.color}>{d.value}</text>
            <text x={x + barW / 2} y={height + 26} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">{d.label}</text>
            {d.sublabel && <text x={x + barW / 2} y={height + 40} textAnchor="middle" fontSize="10" fill="#475569">{d.sublabel}</text>}
          </g>
        );
      })}
      <line x1={12} y1={10} x2={12} y2={height + 10} stroke="#e2e8f0" strokeWidth={1} />
      <line x1={12} y1={height + 10} x2={svgW - 8} y2={height + 10} stroke="#e2e8f0" strokeWidth={1} />
    </svg>
  );
};

/* ─── Props ──────────────────────────────────────────────────────────────── */
interface ReportsViewProps {
  testPlan: TestPlan;
  tasks: TestTask[];
  observations: Observation[];
  findings: Finding[];
  onGoToPlan: () => void;
}

/* ════════════════════════════════════════════════════════════════════════════ */
export const ReportsView: React.FC<ReportsViewProps> = ({
  testPlan, tasks, observations, findings, onGoToPlan,
}) => {
  const width = useWindowWidth();
  const isMobile = width < 900;
  const isProductEmpty = !testPlan.product || testPlan.product.trim() === '';

  const handleDownloadPDF = () => {
    const pw = window.open('', 'Reporte', 'width=1,height=1');
    if (!pw) { alert('Permite ventanas emergentes para exportar el PDF.'); return; }

    const bar = (p: number, color: string, bg: string, h = 10) =>
      `<div style="height:${h}px;background:${bg};border-radius:99px;overflow:hidden;border:1px solid rgba(0,0,0,0.06)"><div style="height:100%;width:${p}%;background:${color};border-radius:99px;min-width:${p>0?4:0}px"></div></div>`;

    const badge = (text: string, color: string, bg: string) =>
      `<span style="display:inline-block;padding:3px 9px;border-radius:99px;background:${bg};color:${color};border:1px solid ${color};font-weight:700;font-size:10px;white-space:nowrap">${text}</span>`;

    const sec = (icon: string, title: string, sub: string) =>
      `<div style="margin:22px 0 12px"><div style="display:flex;align-items:center;gap:8px"><span>${icon}</span><h3 style="margin:0;font-size:15px;font-weight:800;color:#003366">${title}</h3></div><p style="margin:2px 0 0;font-size:11px;color:#475569;padding-left:26px">${sub}</p><div style="height:2px;background:linear-gradient(90deg,#003366,transparent);margin-top:5px;border-radius:2px"></div></div>`;

    const SC = SEV_MAP;
    const PC = PRI_MAP;

    const successColor = m.usabilityScore === 'Aceptable' ? '#14532d' : m.usabilityScore === 'Mejorable' ? '#92400e' : m.usabilityScore === 'Deficiente' ? '#7c2d12' : '#7f1d1d';
    const successBg    = m.usabilityScore === 'Aceptable' ? '#dcfce7' : m.usabilityScore === 'Mejorable' ? '#fef3c7' : m.usabilityScore === 'Deficiente' ? '#ffedd5' : '#fee2e2';
    const rd = new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });

    const kpiList = [
      { value: `${m.successRate}%`, label: 'Tasa de éxito',       sub: `${m.ok} de ${m.total} sesiones`,         color: '#14532d', bg: '#f0fdf4', trend: m.successRate >= 80 ? '✅ Óptimo' : m.successRate >= 50 ? '⚠ Aceptable' : '❌ Revisar', tc: m.successRate >= 80 ? '#14532d' : m.successRate >= 50 ? '#92400e' : '#7f1d1d', tb: m.successRate >= 80 ? '#dcfce7' : m.successRate >= 50 ? '#fef3c7' : '#fee2e2' },
      { value: fmtTime(m.avgTime),  label: 'Tiempo promedio',     sub: `Máx: ${fmtTime(m.maxTime)}`,              color: '#1e3a8a', bg: '#eff6ff', trend: '', tc: '', tb: '' },
      { value: String(m.errors),    label: 'Total de errores',    sub: `${m.avgErr} errores/sesión`,               color: '#7f1d1d', bg: '#fff7ed', trend: parseFloat(m.avgErr) <= 1 ? '✅ Pocos' : parseFloat(m.avgErr) <= 3 ? '⚠ Moderado' : '❌ Alto', tc: parseFloat(m.avgErr) <= 1 ? '#14532d' : parseFloat(m.avgErr) <= 3 ? '#92400e' : '#7f1d1d', tb: parseFloat(m.avgErr) <= 1 ? '#dcfce7' : parseFloat(m.avgErr) <= 3 ? '#fef3c7' : '#fee2e2' },
      { value: String(m.totalF),    label: 'Hallazgos',           sub: `${m.criticalCount} de alta/crítica`,       color: '#6b21a8', bg: '#fdf4ff', trend: m.criticalCount === 0 ? '✅ Sin críticos' : `⚠ ${m.criticalCount} críticos`, tc: m.criticalCount === 0 ? '#14532d' : '#7f1d1d', tb: m.criticalCount === 0 ? '#dcfce7' : '#fee2e2' },
      { value: `${m.resolvedRate}%`,label: 'Hallazgos resueltos', sub: `${m.resolvedCount} de ${m.totalF} correg.`, color: '#1e293b', bg: '#f8fafc', trend: m.resolvedRate >= 66 ? '✅ Buen avance' : '⚠ Pendientes', tc: m.resolvedRate >= 66 ? '#14532d' : '#92400e', tb: m.resolvedRate >= 66 ? '#dcfce7' : '#fef3c7' },
    ];

    const sortedFindings = [...findings].sort((a, b) => {
      const so: Record<string,number> = { 'Crítica':0, Alta:1, Media:2, Baja:3 };
      const po: Record<string,number> = { Alta:0, Media:1, Baja:2 };
      return (so[a.severity]-so[b.severity]) || (po[a.priority]-po[b.priority]);
    });

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Reporte</title>
<style>
*,*::before,*::after{box-sizing:border-box}
body{margin:0;padding:18px 20px;font-family:'Segoe UI',system-ui,sans-serif;background:#fff;color:#1e293b;font-size:12px;line-height:1.5}
table{border-collapse:collapse;width:100%}
th{background:#003366!important;color:#fff!important;padding:7px 9px;font-size:10.5px;font-weight:700;text-align:left;border:1px solid #1e4d99}
td{padding:6px 9px;border:1px solid #94a3b8;font-size:11px;vertical-align:top}
tr:nth-child(even) td{background:#f8fafc}
h1,h2,h3,h4,p{margin:0}
@media print{
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  body{padding:0}
  .pb{page-break-before:always}
  .nopb{page-break-inside:avoid;break-inside:avoid}
  @page{size:A4;margin:10mm 10mm}
}
</style></head><body>

<div class="nopb" style="background:#003366;color:#fff;border-radius:10px;padding:24px 28px;margin-bottom:18px">
  <p style="margin:0 0 2px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.72);text-transform:uppercase;letter-spacing:1.5px">Informe de Prueba de Usabilidad</p>
  <h1 style="margin:2px 0 0;font-size:24px;font-weight:900;color:#fff">${testPlan.product}</h1>
  ${testPlan.module ? `<p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.82)">Módulo: ${testPlan.module}</p>` : ''}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;margin-top:10px;font-size:10px;color:rgba(255,255,255,0.9)">
    ${testPlan.user_profile ? `<div><strong>Perfil:</strong> ${testPlan.user_profile}</div>` : ''}
    ${testPlan.method ? `<div><strong>Método:</strong> ${testPlan.method}</div>` : ''}
    ${testPlan.duration ? `<div><strong>Duración:</strong> ${testPlan.duration}</div>` : ''}
    ${testPlan.test_date ? `<div><strong>Fecha:</strong> ${testPlan.test_date}</div>` : ''}
    ${testPlan.location_channel ? `<div><strong>Lugar:</strong> ${testPlan.location_channel}</div>` : ''}
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px">
    ${[
      { label: 'Participantes',    value: m.participants.length > 0 ? String(m.participants.length) : '0' },
      { label: 'Tareas evaluadas', value: String(tasks.length) },
      { label: 'Observaciones',    value: String(m.total) },
      { label: 'Hallazgos',        value: String(m.totalF) },
    ].map(c => `<div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:10px 12px"><div style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:3px">${c.label}</div><div style="font-size:20px;font-weight:800;color:#fff">${c.value}</div></div>`).join('')}
  </div>
  <div style="border-top:1px solid rgba(255,255,255,0.22);margin-top:14px;padding-top:8px;display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.68)">
    <span>${testPlan.moderator ? `Moderador: ${testPlan.moderator}` : ''}${testPlan.observer ? ` · Observador: ${testPlan.observer}` : ''}</span>
    <span>Generado el ${rd}</span>
  </div>
</div>

${sec('⚡','Veredicto de Usabilidad','Evaluación global del sistema basada en observaciones y hallazgos registrados')}
<div class="nopb" style="display:grid;grid-template-columns:200px 1fr;gap:12px;margin-bottom:18px">
  <div style="background:${successBg};border:2px solid ${successColor};border-radius:10px;padding:16px;text-align:center">
    <p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#475569;margin-bottom:6px">Nivel de usabilidad</p>
    <div style="font-size:40px;font-weight:900;color:${successColor};line-height:1">${m.successRate}%</div>
    <span style="display:inline-block;margin-top:8px;padding:4px 16px;border-radius:99px;border:2px solid ${successColor};color:${successColor};font-weight:700;font-size:12px;background:#fff">${m.usabilityScore}</span>
    <p style="margin-top:8px;font-size:10px;color:#475569">Tasa de éxito global</p>
    ${bar(m.successRate, successColor, '#e2e8f0', 10)}
  </div>
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px">
    <h4 style="font-size:12px;font-weight:700;margin-bottom:12px">Desglose de resultados de sesión</h4>
    ${[
      { label: 'Tareas completadas exitosamente', val: m.ok,   c: '#14532d', s: '#16a34a', bg: '#dcfce7', icon: '✅', desc: 'Sin intervención del moderador' },
      { label: 'Completadas con ayuda',           val: m.help, c: '#92400e', s: '#d97706', bg: '#fef3c7', icon: '🤝', desc: 'Requirieron orientación adicional' },
      { label: 'No completadas',                  val: m.fail, c: '#7f1d1d', s: '#dc2626', bg: '#fee2e2', icon: '❌', desc: 'El usuario no logró terminar la tarea' },
    ].map(r => `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px">
        <span style="font-size:11px;font-weight:700">${r.icon} ${r.label}</span>
        <span style="font-weight:800;color:${r.c};font-size:11px">${r.val} / ${m.total} <span style="font-size:9px;color:#64748b">(${pct(r.val,m.total)}%)</span></span>
      </div>
      ${bar(pct(r.val,m.total), r.s, r.bg, 10)}
      <p style="margin:2px 0 0;font-size:9px;color:#64748b;font-style:italic">${r.desc}</p>
    </div>`).join('')}
  </div>
</div>

${sec('📊','Indicadores Clave de Desempeño','Métricas cuantitativas del proceso de evaluación')}
<div class="nopb" style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:18px">
  ${kpiList.map(k => `<div style="background:${k.bg};border-radius:9px;padding:12px;border-top:4px solid ${k.color}">
    ${k.trend ? `<div style="text-align:right;margin-bottom:6px"><span style="font-size:9px;font-weight:700;color:${k.tc};background:${k.tb};padding:2px 6px;border-radius:99px">${k.trend}</span></div>` : '<div style="height:20px;margin-bottom:6px"></div>'}
    <div style="font-size:24px;font-weight:900;color:${k.color};line-height:1">${k.value}</div>
    <div style="font-size:10.5px;font-weight:700;color:#1e293b;margin-top:4px">${k.label}</div>
    ${k.sub ? `<div style="font-size:9px;color:#475569;margin-top:2px">${k.sub}</div>` : ''}
  </div>`).join('')}
</div>

${m.taskRates.length > 0 ? `
${sec('🎯','Resultados por Tarea','Comparativa de eficacia y tiempo por cada tarea evaluada')}
<div class="nopb" style="margin-bottom:18px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
<table><thead><tr>
  <th style="width:55px">Tarea</th>
  <th>Progreso de éxito</th>
  <th style="width:90px;text-align:center">Tiempo prom.</th>
  <th style="width:65px;text-align:center">Errores</th>
  <th style="width:100px">Estado</th>
</tr></thead><tbody>
${m.taskRates.map(t => {
  const c = t.rate>=80?'#14532d':t.rate>=50?'#92400e':'#7f1d1d';
  const s = t.rate>=80?'#16a34a':t.rate>=50?'#d97706':'#dc2626';
  const bg = t.rate>=80?'#dcfce7':t.rate>=50?'#fef3c7':'#fee2e2';
  const st = t.rate>=80?'✅ Óptimo':t.rate>=50?'⚠ Mejorar':'❌ Crítico';
  return `<tr><td style="text-align:center"><span style="background:#003366;color:#fff;padding:2px 7px;border-radius:4px;font-weight:700;font-size:10px">${t.label}</span></td>
    <td>${bar(t.rate,s,bg,9)}<span style="font-size:9px;color:${c};font-weight:700">${t.rate}% (${t.ok}/${t.total})</span></td>
    <td style="text-align:center;font-weight:600">${t.avgTime>0?fmtTime(t.avgTime):'—'}</td>
    <td style="text-align:center;font-weight:700;color:${t.totalErrors>2?'#7f1d1d':'#1e293b'}">${t.totalErrors}</td>
    <td><span style="display:inline-block;padding:2px 7px;border-radius:4px;background:${bg};color:${c};font-weight:700;font-size:9px;border:1px solid ${s}44">${st}</span></td>
  </tr>`;
}).join('')}
</tbody></table></div>` : ''}

${sortedFindings.length > 0 ? `
<div class="pb"></div>
${sec('⚠️','Análisis de Hallazgos','Distribución por severidad, prioridad y estado de resolución')}
<div style="margin-bottom:18px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
  <div style="background:#f8fafc;padding:9px 13px;border-bottom:1px solid #e2e8f0"><strong style="font-size:11px">Hallazgos priorizados — ordenados de mayor a menor severidad</strong></div>
  <table><thead><tr>
    <th style="width:28px">#</th>
    <th style="width:17%">Problema</th>
    <th style="width:17%">Evidencia</th>
    <th style="width:8%;text-align:center">Freq.</th>
    <th style="width:10%;text-align:center">Severidad</th>
    <th>Recomendación</th>
    <th style="width:10%;text-align:center">Prioridad</th>
    <th style="width:11%;text-align:center">Estado</th>
  </tr></thead><tbody>
  ${sortedFindings.map((f,i) => {
    const sc = SC[f.severity] ?? SC['Baja'];
    const pc = PC[f.priority] ?? PC['Baja'];
    const stc = STATUS_MAP[f.status] ?? STATUS_MAP['Pendiente'];
    return `<tr style="border-left:4px solid ${sc.solid}">
      <td style="text-align:center"><span style="background:#003366;color:#fff;padding:2px 6px;border-radius:4px;font-weight:700;font-size:10px">${i+1}</span></td>
      <td>${f.problem||'—'}</td>
      <td style="font-style:italic;color:#475569">${f.evidence||'—'}</td>
      <td style="text-align:center;font-weight:600">${f.frequency||'—'}</td>
      <td style="text-align:center">${badge(f.severity, sc.text, sc.bg)}</td>
      <td>${f.recommendation||'—'}</td>
      <td style="text-align:center">${badge(f.priority, pc.text, pc.bg)}</td>
      <td style="text-align:center">${badge(stc.icon+' '+f.status, stc.text, stc.bg)}</td>
    </tr>`;
  }).join('')}
  </tbody></table>
</div>` : ''}

${observations.length > 0 ? `
<div class="pb"></div>
${sec('👥','Detalle de Observaciones','Registro completo de las sesiones de prueba con cada participante')}
<div style="margin-bottom:18px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
<table><thead><tr>
  <th style="width:28px">#</th>
  <th style="width:10%">Participante</th>
  <th style="width:8%;text-align:center">Tarea</th>
  <th style="width:12%;text-align:center">Resultado</th>
  <th style="width:9%;text-align:center">Tiempo</th>
  <th style="width:7%;text-align:center">Errores</th>
  <th>Comentarios / Problema</th>
  <th style="width:10%;text-align:center">Severidad</th>
</tr></thead><tbody>
${observations.map((o,i) => {
  const OK: Record<string,{bg:string;color:string;border:string;icon:string}> = {
    'Sí':        {bg:'#dcfce7',color:'#14532d',border:'#16a34a',icon:'✅'},
    'Con ayuda': {bg:'#fef3c7',color:'#92400e',border:'#d97706',icon:'🤝'},
    'No':        {bg:'#fee2e2',color:'#7f1d1d',border:'#dc2626',icon:'❌'},
  };
  const ok = OK[o.success_level] ?? {bg:'#f8fafc',color:'#374151',border:'#e2e8f0',icon:'—'};
  const sc = SC[o.severity] ?? SC['Baja'];
  const comments = [o.comments, o.problem ? `<em style="color:#7c2d12">Problema: ${o.problem}</em>` : ''].filter(Boolean).join('<br/>');
  return `<tr>
    <td style="text-align:center"><span style="background:#003366;color:#fff;padding:2px 6px;border-radius:4px;font-weight:700;font-size:10px">${i+1}</span></td>
    <td style="font-weight:600">${o.participant||'—'}</td>
    <td style="text-align:center"><span style="background:#003366;color:#fff;padding:2px 5px;border-radius:4px;font-weight:700;font-size:10px">${o.task_ref||'—'}</span></td>
    <td style="text-align:center"><span style="display:inline-block;padding:2px 7px;border-radius:99px;background:${ok.bg};color:${ok.color};border:1px solid ${ok.border};font-weight:700;font-size:10px">${ok.icon} ${o.success_level}</span></td>
    <td style="text-align:center;font-weight:600">${fmtTime(o.time_seconds||0)}</td>
    <td style="text-align:center;font-weight:700;color:${(o.errors||0)>2?'#7f1d1d':'#1e293b'}">${o.errors??0}</td>
    <td>${comments||'—'}</td>
    <td style="text-align:center">${badge(o.severity, sc.text, sc.bg)}</td>
  </tr>`;
}).join('')}
</tbody></table></div>` : ''}

${sec('📋','Conclusiones y Recomendaciones','Síntesis ejecutiva de los hallazgos y pasos de mejora sugeridos')}
<div class="nopb" style="margin-bottom:18px">
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px">
    <h4 style="font-size:12px;font-weight:700;margin-bottom:10px">Síntesis ejecutiva</h4>
    ${[
      { icon: m.successRate>=80?'✅':m.successRate>=50?'⚠️':'❌', text: `La tasa de éxito global es <strong style="color:${successColor}">${m.successRate}%</strong>, clasificando la usabilidad como <strong style="color:${successColor}">${m.usabilityScore}</strong>.` },
      m.totalF > 0 ? { icon: m.criticalCount>0?'🔴':'🟢', text: m.criticalCount>0 ? `<strong style="color:#7f1d1d">${m.criticalCount} hallazgos</strong> de severidad Alta o Crítica requieren atención inmediata.` : 'No se detectaron hallazgos de severidad Alta o Crítica.' } : null,
      m.totalF > 0 ? { icon: '🔧', text: `<strong style="color:#14532d">${m.resolvedCount} de ${m.totalF} hallazgos</strong> han sido corregidos (${m.resolvedRate}%). Quedan <strong>${m.sta['Pendiente']||0}</strong> pendientes.` } : null,
      m.avgTime > 0 ? { icon: '⏱', text: `Tiempo promedio por sesión: <strong>${fmtTime(m.avgTime)}</strong>. Máximo registrado: <strong>${fmtTime(m.maxTime)}</strong>.` } : null,
    ].filter(Boolean).map(ci => `<div style="display:flex;gap:10px;align-items:flex-start;padding:9px;background:#fff;border-radius:7px;border:1px solid #e2e8f0;margin-bottom:7px">
      <span style="font-size:14px;flex-shrink:0">${ci!.icon}</span>
      <span style="font-size:11px">${ci!.text}</span>
    </div>`).join('')}
  </div>
</div>

<div style="background:#003366;color:rgba(255,255,255,0.85);border-radius:8px;padding:10px 16px;display:flex;justify-content:space-between;font-size:10px">
  <span>Usability Test Dashboard Web — Informe generado automáticamente</span>
  <span>${rd}</span>
</div>

<script>window.onload=function(){setTimeout(function(){window.print();window.close();},700);};</script>
</body></html>`;

    pw.document.open();
    pw.document.write(html);
    pw.document.close();
  };

  /* Métricas */
  const m = useMemo(() => {
    const total  = observations.length;
    const ok     = observations.filter(o => o.success_level === 'Sí').length;
    const help   = observations.filter(o => o.success_level === 'Con ayuda').length;
    const fail   = observations.filter(o => o.success_level === 'No').length;
    const errors = observations.reduce((s, o) => s + (o.errors || 0), 0);
    const avgErr = total > 0 ? (errors / total).toFixed(1) : '0';
    const times  = observations.map(o => o.time_seconds || 0);
    const avgTime = avg(times);
    const maxTime = times.length ? Math.max(...times) : 0;
    const minTime = times.length ? Math.min(...times) : 0;

    const sev: Record<string, number> = { Baja: 0, Media: 0, Alta: 0, 'Crítica': 0 };
    const pri: Record<string, number> = { Baja: 0, Media: 0, Alta: 0 };
    const sta: Record<string, number> = { Pendiente: 0, 'En progreso': 0, Resuelto: 0 };
    findings.forEach(f => {
      sev[f.severity] = (sev[f.severity] || 0) + 1;
      pri[f.priority] = (pri[f.priority] || 0) + 1;
      sta[f.status]   = (sta[f.status]   || 0) + 1;
    });

    const participants = [...new Set(observations.map(o => o.participant).filter(Boolean))];
    const taskRates = tasks.map(t => {
      const obs     = observations.filter(o => o.task_ref === t.task_index);
      const obsOk   = obs.filter(o => o.success_level === 'Sí').length;
      const obsHelp = obs.filter(o => o.success_level === 'Con ayuda').length;
      const obsFail = obs.filter(o => o.success_level === 'No').length;
      const avgT    = avg(obs.map(o => o.time_seconds || 0));
      const totErr  = obs.reduce((s, o) => s + (o.errors || 0), 0);
      return { label: t.task_index, scenario: t.scenario, total: obs.length, ok: obsOk, help: obsHelp, fail: obsFail, avgTime: avgT, totalErrors: totErr, rate: pct(obsOk, obs.length) };
    }).filter(t => t.total > 0);

    const successRate   = pct(ok, total);
    const criticalCount = (sev['Crítica'] || 0) + (sev['Alta'] || 0);
    const resolvedCount = sta['Resuelto'] || 0;
    const resolvedRate  = pct(resolvedCount, findings.length);
    const usabilityScore =
      successRate >= 80 ? 'Aceptable' :
      successRate >= 60 ? 'Mejorable' :
      successRate >= 40 ? 'Deficiente' : 'Crítica';

    return { total, ok, help, fail, errors, avgErr, avgTime, maxTime, minTime, sev, pri, sta, participants, taskRates, totalF: findings.length, resolvedCount, resolvedRate, successRate, criticalCount, usabilityScore };
  }, [observations, findings, tasks]);

  const usabilityColor =
    m.usabilityScore === 'Aceptable' ? '#14532d' :
    m.usabilityScore === 'Mejorable' ? '#92400e' :
    m.usabilityScore === 'Deficiente' ? '#7c2d12' : '#7f1d1d';
  const usabilityBg =
    m.usabilityScore === 'Aceptable' ? '#dcfce7' :
    m.usabilityScore === 'Mejorable' ? '#fef3c7' :
    m.usabilityScore === 'Deficiente' ? '#ffedd5' : '#fee2e2';
  const usabilityBorder =
    m.usabilityScore === 'Aceptable' ? '#16a34a' :
    m.usabilityScore === 'Mejorable' ? '#d97706' :
    m.usabilityScore === 'Deficiente' ? '#ea580c' : '#dc2626';

  const reportDate = new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });

  /* ── Sin producto ── */
  if (isProductEmpty) return (
    <div role="tabpanel" aria-labelledby="reports-tab" className="dashboard-view">
      <header className="view-header" style={{ display: 'flex', justifyContent: 'center' }}><h2>Reporte de Resultados</h2></header>
      <Panel style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <AlertTriangle size={48} color="#92400e" style={{ margin: '0 auto 1rem', display: 'block' }} aria-hidden="true" />
        <h3 style={{ color: '#1e293b' }}>Falta el nombre del producto</h3>
        <p style={{ color: '#475569', maxWidth: 440, margin: '0 auto 1.5rem' }}>
          Define un producto en la pestaña <strong>Plan</strong> para generar el reporte de resultados.
        </p>
        <button onClick={onGoToPlan} style={{ backgroundColor: '#003366', color: '#fff', padding: '12px 28px', borderRadius: 8, border: '2px solid transparent', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
          Ir a definir Producto
        </button>
      </Panel>
    </div>
  );

  if (observations.length === 0 && findings.length === 0) return (
    <div role="tabpanel" aria-labelledby="reports-tab" className="dashboard-view">
      <header className="view-header" style={{ display: 'flex', justifyContent: 'center' }}><h2>Reporte de Resultados</h2></header>
      <Panel style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <BarChart2 size={56} color="#64748b" style={{ margin: '0 auto 1rem', display: 'block' }} aria-hidden="true" />
        <h3 style={{ color: '#1e293b' }}>Aún no hay datos para reportar</h3>
        <p style={{ color: '#475569', maxWidth: 440, margin: '0 auto' }}>
          Registra observaciones y hallazgos en las pestañas anteriores para generar el reporte automáticamente.
        </p>
      </Panel>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div role="tabpanel" aria-labelledby="reports-tab" className="dashboard-view">

      {/* Cabecera de pantalla */}
      <header className="view-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '1rem 1.5rem' }}>
        <h2 style={{ margin: 0, flex: 1, textAlign: 'center', fontSize: '1.3rem' }}>
          Reporte de Resultados — Prueba de Usabilidad
        </h2>
        <button
          onClick={handleDownloadPDF}
          style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#fff', color: '#003366', border: '2px solid #003366', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0 }}
          aria-label="Exportar reporte como PDF"
        >
          <Download size={18} aria-hidden="true" />
          Exportar PDF
        </button>
      </header>

      {/* ================================================================
          CONTENIDO IMPRIMIBLE
      ================================================================ */}
      <div id="report-printable">

        {/* PORTADA */}
        <section
          id="print-cover"
          aria-labelledby="report-cover-title"
          style={{
            background: 'linear-gradient(135deg, #003366 0%, #004080 60%, #005599 100%)',
            borderRadius: 16, padding: isMobile ? '2rem 1.25rem' : '2.5rem 3rem',
            marginBottom: '2rem', color: '#fff', position: 'relative', overflow: 'hidden',
          }}
        >
          <div aria-hidden="true" style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

          {/* Encabezado portada */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: '1.75rem' }}>
            <div aria-hidden="true" style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '12px', display: 'flex', flexShrink: 0 }}>
              <FileText size={32} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                Informe de Prueba de Usabilidad
              </p>
              <h2 id="report-cover-title" style={{ margin: '6px 0 0', fontSize: isMobile ? '1.5rem' : '2.2rem', fontWeight: 800, lineHeight: 1.15, color: '#fff' }}>
                {testPlan.product}
              </h2>
              {testPlan.module && (
                <p style={{ margin: '8px 0 0', fontSize: '1rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                  Módulo: {testPlan.module}
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px 16px', marginTop: '12px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.9)' }}>
                {testPlan.user_profile && <span><strong>Perfil:</strong> {testPlan.user_profile}</span>}
                {testPlan.method && <span><strong>Método:</strong> {testPlan.method}</span>}
                {testPlan.duration && <span><strong>Duración:</strong> {testPlan.duration}</span>}
                {testPlan.test_date && <span><strong>Fecha:</strong> {testPlan.test_date}</span>}
                {testPlan.location_channel && <span><strong>Lugar:</strong> {testPlan.location_channel}</span>}
              </div>
            </div>
          </div>

          {/* Tarjetas de metadatos */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: '1rem' }}>
            {[
              { label: 'Participantes',    value: m.participants.length > 0 ? String(m.participants.length) : '—' },
              { label: 'Tareas evaluadas', value: tasks.length > 0 ? String(tasks.length) : '—' },
              { label: 'Observaciones',    value: String(m.total) },
              { label: 'Hallazgos',        value: String(m.totalF) },
            ].map(meta => (
              <div key={meta.label} className="cover-card" style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '1rem' }}>
                <div className="cover-card-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
                  {meta.label}
                </div>
                <div className="cover-card-value" style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{meta.value}</div>
              </div>
            ))}
          </div>

          {/* Pie portada */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.25)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>
            <span>
              {testPlan.moderator ? `Moderador: ${testPlan.moderator}` : ''}
              {testPlan.observer  ? ` · Observador: ${testPlan.observer}` : ''}
            </span>
            <time dateTime={new Date().toISOString().slice(0, 10)}>Generado el {reportDate}</time>
          </div>
        </section>

        {/* ── VEREDICTO ── */}
        <section aria-labelledby="veredicto-h" style={{ marginBottom: '2rem' }}>
          <SectionHeader headingId="veredicto-h" icon={<Zap size={20} />} title="Veredicto de Usabilidad" sub="Evaluación global del sistema basada en observaciones y hallazgos registrados" />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: '1rem' }}>

            {/* Score principal */}
            <div className="report-panel" style={{ backgroundColor: usabilityBg, border: `2px solid ${usabilityBorder}`, borderRadius: 12, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#475569' }}>Nivel de usabilidad</p>
              <h4 aria-label={`Tasa de éxito global: ${m.successRate} por ciento`} style={{ margin: 0, fontSize: '3.5rem', fontWeight: 900, color: usabilityColor, lineHeight: 1, letterSpacing: '-2px', display: 'block' }}>
                {m.successRate}%
              </h4>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: usabilityColor, backgroundColor: '#fff', padding: '6px 20px', borderRadius: 99, border: `2px solid ${usabilityBorder}` }}>
                {m.usabilityScore}
              </span>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569' }}>Tasa de éxito global</p>
              <HBar value={m.successRate} max={100} color={usabilityBorder} bg="#e2e8f0" barLabel="Tasa de éxito global" h={14} />
            </div>

            {/* Desglose */}
            <div className="report-panel" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1.1rem', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Desglose de resultados de sesión</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'Tareas completadas exitosamente', val: m.ok,   color: '#14532d', solid: '#16a34a', bg: '#dcfce7', icon: '✅', desc: 'Sin intervención del moderador' },
                  { label: 'Completadas con ayuda',           val: m.help, color: '#92400e', solid: '#d97706', bg: '#fef3c7', icon: '🤝', desc: 'Requirieron orientación adicional' },
                  { label: 'No completadas',                  val: m.fail, color: '#7f1d1d', solid: '#dc2626', bg: '#fee2e2', icon: '❌', desc: 'El usuario no logró terminar la tarea' },
                ].map(row => (
                  <div key={row.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                        <span aria-hidden="true">{row.icon}</span>{' '}{row.label}
                      </span>
                      <span style={{ fontWeight: 800, color: row.color, fontSize: '0.92rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {row.val} / {m.total}{' '}
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>({pct(row.val, m.total)}%)</span>
                      </span>
                    </div>
                    <HBar value={row.val} max={m.total} color={row.solid} bg={row.bg} barLabel={row.label} h={14} />
                    <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>{row.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── KPIs ── */}
        <section aria-labelledby="kpis-h" style={{ marginBottom: '2rem' }}>
          <SectionHeader headingId="kpis-h" icon={<Activity size={20} />} title="Indicadores Clave de Desempeño" sub="Métricas cuantitativas del proceso de evaluación" />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap: '0.875rem' }}>
            <KpiCard value={`${m.successRate}%`} label="Tasa de éxito" sub={`${m.ok} de ${m.total} sesiones`} icon={<CheckCircle2 size={20} />} accent="#14532d" bg="#f0fdf4" iconBg="#dcfce7" trend={m.successRate >= 80 ? 'up' : m.successRate >= 50 ? 'neutral' : 'down'} trendLabel={m.successRate >= 80 ? 'Óptimo' : m.successRate >= 50 ? 'Aceptable' : 'Revisar'} />
            <KpiCard value={fmtTime(m.avgTime)} label="Tiempo promedio" sub={`Máx: ${fmtTime(m.maxTime)}`} icon={<Clock size={20} />} accent="#1e3a8a" bg="#eff6ff" iconBg="#dbeafe" />
            <KpiCard value={m.errors} label="Total de errores" sub={`${m.avgErr} errores por sesión`} icon={<XCircle size={20} />} accent="#7f1d1d" bg="#fff7ed" iconBg="#ffedd5" trend={parseFloat(m.avgErr) <= 1 ? 'up' : parseFloat(m.avgErr) <= 3 ? 'neutral' : 'down'} trendLabel={parseFloat(m.avgErr) <= 1 ? 'Pocos' : parseFloat(m.avgErr) <= 3 ? 'Moderado' : 'Alto'} />
            <KpiCard value={m.totalF} label="Hallazgos" sub={`${m.criticalCount} de alta/crítica prioridad`} icon={<AlertTriangle size={20} />} accent="#6b21a8" bg="#fdf4ff" iconBg="#f3e8ff" trend={m.criticalCount === 0 ? 'up' : m.criticalCount <= 2 ? 'neutral' : 'down'} trendLabel={m.criticalCount === 0 ? 'Sin críticos' : `${m.criticalCount} críticos`} />
            <KpiCard value={`${m.resolvedRate}%`} label="Hallazgos resueltos" sub={`${m.resolvedCount} de ${m.totalF} corregidos`} icon={<Shield size={20} />} accent="#1e293b" bg="#f8fafc" iconBg="#e2e8f0" trend={m.resolvedRate >= 66 ? 'up' : m.resolvedRate >= 33 ? 'neutral' : 'down'} trendLabel={m.resolvedRate >= 66 ? 'Buen avance' : 'Pendientes'} />
          </div>
        </section>

        {/* ── RESULTADOS POR TAREA ── */}
        {m.taskRates.length > 0 && (
          <section aria-labelledby="tasks-h" style={{ marginBottom: '2rem' }}>
            <SectionHeader headingId="tasks-h" icon={<Target size={20} />} title="Resultados por Tarea" sub="Comparativa de eficacia y tiempo por cada tarea evaluada" />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>

              <Panel>
                <h4 style={{ margin: '0 0 1rem', fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>Tasa de éxito por tarea (%)</h4>
                <BarChartV
                  svgTitleId="barchart-tasks"
                  svgTitle={`Tasa de éxito: ${m.taskRates.map(t => `Tarea ${t.label} ${t.rate}%`).join(', ')}`}
                  data={m.taskRates.map(t => ({ label: t.label, value: t.rate, color: t.rate >= 80 ? '#16a34a' : t.rate >= 50 ? '#d97706' : '#dc2626', sublabel: `${t.ok}/${t.total}` }))}
                  maxValue={100} height={130}
                />
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  {[{ color: '#16a34a', label: '≥ 80% Óptimo' }, { color: '#d97706', label: '50–79% Mejorar' }, { color: '#dc2626', label: '< 50% Crítico' }].map(l => (
                    <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.73rem', color: '#475569' }}>
                      <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: l.color, display: 'inline-block' }} /> {l.label}
                    </span>
                  ))}
                </div>
              </Panel>

              <Panel style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" aria-label="Resultados detallados por tarea">
                    <caption className="sr-only">Tasa de éxito, tiempo promedio y errores por tarea evaluada</caption>
                    <thead>
                      <tr>
                        <th scope="col" style={{ width: 55 }}>Tarea</th>
                        <th scope="col">Éxito</th>
                        <th scope="col" style={{ width: 80 }}>Tiempo</th>
                        <th scope="col" style={{ width: 70 }}>Errores</th>
                        <th scope="col">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.taskRates.map(t => {
                        const col  = t.rate >= 80 ? '#14532d' : t.rate >= 50 ? '#92400e' : '#7f1d1d';
                        const solid = t.rate >= 80 ? '#16a34a' : t.rate >= 50 ? '#d97706' : '#dc2626';
                        const bgC  = t.rate >= 80 ? '#dcfce7' : t.rate >= 50 ? '#fef3c7' : '#fee2e2';
                        return (
                          <tr key={t.label}>
                            <td style={{ textAlign: 'center' }}><span className="id-badge">{t.label}</span></td>
                            <td>
                              <HBar value={t.ok} max={t.total} color={solid} bg={bgC} barLabel={`Exito tarea ${t.label}`} h={10} />
                              <span style={{ fontSize: '0.73rem', color: col, fontWeight: 700 }}>{t.rate}% ({t.ok}/{t.total})</span>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>{t.avgTime > 0 ? fmtTime(t.avgTime) : '—'}</td>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: t.totalErrors > 2 ? '#7f1d1d' : '#1e293b', fontSize: '0.85rem' }}>{t.totalErrors}</td>
                            <td>
                              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, backgroundColor: bgC, color: col, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${solid}55` }}>
                                {t.rate >= 80 ? '✅ Óptimo' : t.rate >= 50 ? '⚠ Mejorar' : '❌ Crítico'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          </section>
        )}

        {/* ── HALLAZGOS ── */}
        {m.totalF > 0 && (
          <section aria-labelledby="findings-h" style={{ marginBottom: '2rem' }} className="print-break">
            <SectionHeader headingId="findings-h" icon={<AlertTriangle size={20} />} title="Análisis de Hallazgos" sub="Distribución de problemas detectados según severidad, prioridad y estado de resolución" />

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: '1rem', marginBottom: '1rem' }}>

              {/* Severidad */}
              <Panel style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>Por severidad</h4>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <DonutChart
                    svgTitleId="donut-sev"
                    svgTitle={`Distribución por severidad: Critica ${m.sev['Crítica'] || 0}, Alta ${m.sev['Alta'] || 0}, Media ${m.sev['Media'] || 0}, Baja ${m.sev['Baja'] || 0}, total ${m.totalF}`}
                    size={150} centerLabel={String(m.totalF)} centerSub="hallazgos"
                    slices={[
                      { value: m.sev['Crítica'] || 0, color: '#dc2626', label: 'Critica' },
                      { value: m.sev['Alta']    || 0, color: '#ea580c', label: 'Alta' },
                      { value: m.sev['Media']   || 0, color: '#d97706', label: 'Media' },
                      { value: m.sev['Baja']    || 0, color: '#16a34a', label: 'Baja' },
                    ]}
                  />
                </div>
                <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(['Crítica', 'Alta', 'Media', 'Baja'] as Severity[]).map(s => (
                    <div key={s} style={{ display: 'grid', gridTemplateColumns: '68px 1fr 24px', alignItems: 'center', gap: 8 }}>
                      <dt style={{ margin: 0 }}><SevBadge sev={s} /></dt>
                      <dd style={{ margin: 0 }}><HBar value={m.sev[s] || 0} max={m.totalF} color={SEV_MAP[s].solid} bg={SEV_MAP[s].bg} barLabel={`Severidad ${s}`} h={8} /></dd>
                      <span style={{ textAlign: 'right', fontWeight: 800, color: SEV_MAP[s].text, fontSize: '0.88rem' }}>{m.sev[s] || 0}</span>
                    </div>
                  ))}
                </dl>
              </Panel>

              {/* Estado */}
              <Panel style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>Estado de resolución</h4>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <DonutChart
                    svgTitleId="donut-status"
                    svgTitle={`Estado: ${m.resolvedCount} resueltos, ${m.sta['En progreso'] || 0} en progreso, ${m.sta['Pendiente'] || 0} pendientes`}
                    size={150} centerLabel={`${m.resolvedRate}%`} centerSub="resueltos"
                    slices={[
                      { value: m.resolvedCount,            color: '#16a34a', label: 'Resuelto' },
                      { value: m.sta['En progreso'] || 0,  color: '#2563eb', label: 'En progreso' },
                      { value: m.sta['Pendiente']   || 0,  color: '#d97706', label: 'Pendiente' },
                    ]}
                  />
                </div>
                <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { k: 'Resuelto',    c: '#14532d', s: '#16a34a', b: '#dcfce7', i: '✅' },
                    { k: 'En progreso', c: '#1e3a8a', s: '#2563eb', b: '#dbeafe', i: '🔄' },
                    { k: 'Pendiente',   c: '#92400e', s: '#d97706', b: '#fef3c7', i: '⏳' },
                  ].map(row => (
                    <div key={row.k} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 24px', alignItems: 'center', gap: 8 }}>
                      <dt style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: row.c }}>{row.i} {row.k}</dt>
                      <dd style={{ margin: 0 }}><HBar value={m.sta[row.k] || 0} max={m.totalF} color={row.s} bg={row.b} barLabel={`Estado ${row.k}`} h={8} /></dd>
                      <span style={{ textAlign: 'right', fontWeight: 800, color: row.c, fontSize: '0.88rem' }}>{m.sta[row.k] || 0}</span>
                    </div>
                  ))}
                </dl>
              </Panel>

              {/* Prioridad */}
              <Panel style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>Por prioridad</h4>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <BarChartV
                    svgTitleId="barchart-priority"
                    svgTitle={`Prioridad: Alta ${m.pri['Alta'] || 0}, Media ${m.pri['Media'] || 0}, Baja ${m.pri['Baja'] || 0}`}
                    data={[
                      { label: 'Alta',  value: m.pri['Alta']  || 0, color: '#9333ea' },
                      { label: 'Media', value: m.pri['Media'] || 0, color: '#d97706' },
                      { label: 'Baja',  value: m.pri['Baja']  || 0, color: '#2563eb' },
                    ]}
                    height={110}
                  />
                </div>
                <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(['Alta', 'Media', 'Baja'] as Priority[]).map(p => (
                    <div key={p} style={{ display: 'grid', gridTemplateColumns: '62px 1fr 24px', alignItems: 'center', gap: 8 }}>
                      <dt style={{ margin: 0 }}><PriBadge pri={p} /></dt>
                      <dd style={{ margin: 0 }}><HBar value={m.pri[p] || 0} max={m.totalF} color={PRI_MAP[p].solid} bg={PRI_MAP[p].bg} barLabel={`Prioridad ${p}`} h={8} /></dd>
                      <span style={{ textAlign: 'right', fontWeight: 800, color: PRI_MAP[p].text, fontSize: '0.88rem' }}>{m.pri[p] || 0}</span>
                    </div>
                  ))}
                </dl>
              </Panel>
            </div>

            {/* Tabla hallazgos */}
            <Panel style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '0.875rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                  Hallazgos priorizados — ordenados de mayor a menor severidad
                </h4>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" aria-label="Lista completa de hallazgos ordenados por severidad y prioridad">
                  <caption className="sr-only">Hallazgos detectados en la prueba de usabilidad, con problema, evidencia, severidad, recomendación, prioridad y estado</caption>
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: 36 }}>#</th>
                      <th scope="col">Problema</th>
                      <th scope="col">Evidencia</th>
                      <th scope="col" style={{ width: 85 }}>Frecuencia</th>
                      <th scope="col" style={{ width: 90 }}>Severidad</th>
                      <th scope="col">Recomendación</th>
                      <th scope="col" style={{ width: 80 }}>Prioridad</th>
                      <th scope="col" style={{ width: 115 }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...findings].sort((a, b) => {
                      const so: Record<string, number> = { 'Crítica': 0, Alta: 1, Media: 2, Baja: 3 };
                      const po: Record<string, number> = { Alta: 0, Media: 1, Baja: 2 };
                      return (so[a.severity] - so[b.severity]) || (po[a.priority] - po[b.priority]);
                    }).map((f, i) => {
                      const sc = SEV_MAP[f.severity] ?? SEV_MAP['Baja'];
                      return (
                        <tr key={f.id} style={{ borderLeft: `4px solid ${sc.solid}` }}>
                          <td style={{ textAlign: 'center' }}><span className="id-badge">{i + 1}</span></td>
                          <td style={{ fontSize: '0.85rem', color: '#1e293b' }}>{f.problem || <em style={{ color: '#64748b' }}>Sin descripción</em>}</td>
                          <td style={{ fontSize: '0.82rem', color: '#475569', fontStyle: 'italic' }}>{f.evidence || '—'}</td>
                          <td style={{ textAlign: 'center', fontSize: '0.82rem', fontWeight: 600 }}>{f.frequency || '—'}</td>
                          <td style={{ textAlign: 'center' }}><SevBadge sev={f.severity} /></td>
                          <td style={{ fontSize: '0.85rem', color: '#1e293b' }}>{f.recommendation || <em style={{ color: '#64748b' }}>Sin recomendación</em>}</td>
                          <td style={{ textAlign: 'center' }}><PriBadge pri={f.priority} /></td>
                          <td style={{ textAlign: 'center' }}><StatusBadge status={f.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>
        )}

        {/* ── OBSERVACIONES ── */}
        {observations.length > 0 && (
          <section aria-labelledby="obs-h" style={{ marginBottom: '2rem' }} className="print-break">
            <SectionHeader headingId="obs-h" icon={<Users size={20} />} title="Detalle de Observaciones" sub="Registro completo de las sesiones de prueba con cada participante" />

            {m.participants.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span className="sr-only">Participantes:</span>
                {m.participants.map(p => (
                  <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe', padding: '4px 12px', borderRadius: 99, fontSize: '0.82rem', fontWeight: 700 }}>
                    <Users size={12} aria-hidden="true" /> {p}
                  </span>
                ))}
              </div>
            )}

            <Panel style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" aria-label="Registro detallado de observaciones por participante y tarea">
                  <caption className="sr-only">Sesiones registradas con participante, tarea, resultado, tiempo, errores y observaciones</caption>
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: 36 }}>#</th>
                      <th scope="col" style={{ width: 90 }}>Participante</th>
                      <th scope="col" style={{ width: 70 }}>Tarea</th>
                      <th scope="col" style={{ width: 115 }}>Resultado</th>
                      <th scope="col" style={{ width: 90 }}>Tiempo</th>
                      <th scope="col" style={{ width: 75 }}>Errores</th>
                      <th scope="col">Comentarios / Problema</th>
                      <th scope="col" style={{ width: 90 }}>Severidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {observations.map((o, i) => {
                      const OK_MAP: Record<string, { bg: string; color: string; border: string; icon: string }> = {
                        'Sí':        { bg: '#dcfce7', color: '#14532d', border: '#16a34a', icon: '✅' },
                        'Con ayuda': { bg: '#fef3c7', color: '#92400e', border: '#d97706', icon: '🤝' },
                        'No':        { bg: '#fee2e2', color: '#7f1d1d', border: '#dc2626', icon: '❌' },
                      };
                      const OK = OK_MAP[o.success_level] ?? { bg: '#f8fafc', color: '#374151', border: '#e2e8f0', icon: '—' };
                      return (
                        <tr key={o.id}>
                          <td style={{ textAlign: 'center' }}><span className="id-badge">{i + 1}</span></td>
                          <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{o.participant || '—'}</td>
                          <td style={{ textAlign: 'center' }}>{o.task_ref ? <span className="id-badge">{o.task_ref}</span> : <span style={{ color: '#94a3b8' }}>—</span>}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 99, backgroundColor: OK.bg, color: OK.color, border: `1px solid ${OK.border}`, fontWeight: 700, fontSize: '0.75rem' }}>
                              {OK.icon} {o.success_level}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>{fmtTime(o.time_seconds || 0)}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: (o.errors || 0) > 2 ? '#7f1d1d' : '#1e293b', fontSize: '0.88rem' }}>{o.errors ?? 0}</td>
                          <td style={{ fontSize: '0.82rem', color: '#1e293b' }}>
                            {o.comments && <span>{o.comments}</span>}
                            {o.problem  && <span style={{ display: 'block', marginTop: 4, color: '#7c2d12', fontStyle: 'italic', fontSize: '0.78rem' }}>Problema: {o.problem}</span>}
                            {!o.comments && !o.problem && <em style={{ color: '#94a3b8' }}>Sin observaciones</em>}
                          </td>
                          <td style={{ textAlign: 'center' }}><SevBadge sev={o.severity} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>
        )}

        {/* ── CONCLUSIONES ── */}
        <section aria-labelledby="conclusions-h" style={{ marginBottom: '2rem' }}>
          <SectionHeader headingId="conclusions-h" icon={<TrendingUp size={20} />} title="Conclusiones y Recomendaciones" sub="Síntesis ejecutiva de los hallazgos y pasos de mejora sugeridos" />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>

            <Panel style={{ backgroundColor: '#f8fafc' }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Síntesis ejecutiva</h4>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { icon: m.successRate >= 80 ? '✅' : m.successRate >= 50 ? '⚠️' : '❌', text: <>La tasa de éxito global es <strong style={{ color: usabilityColor }}>{m.successRate}%</strong>, clasificando la usabilidad como <strong style={{ color: usabilityColor }}>{m.usabilityScore}</strong>.</> },
                  m.totalF > 0 ? { icon: m.criticalCount > 0 ? '🔴' : '🟢', text: m.criticalCount > 0 ? <><strong style={{ color: '#7f1d1d' }}>{m.criticalCount} hallazgos</strong> de severidad Alta o Crítica requieren atención inmediata.</> : <>No se detectaron hallazgos de severidad Alta o Crítica.</> } : null,
                  m.totalF > 0 ? { icon: '🔧', text: <><strong style={{ color: '#14532d' }}>{m.resolvedCount} de {m.totalF} hallazgos</strong> han sido corregidos ({m.resolvedRate}%). Quedan <strong>{m.sta['Pendiente'] || 0}</strong> pendientes.</> } : null,
                  m.avgTime > 0 ? { icon: '⏱', text: <>Tiempo promedio por sesión: <strong>{fmtTime(m.avgTime)}</strong>. Máximo registrado: <strong>{fmtTime(m.maxTime)}</strong>.</> } : null,
                ].filter(Boolean).map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '0.75rem', backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <span aria-hidden="true" style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item!.icon}</span>
                    <span style={{ fontSize: '0.84rem', color: '#1e293b' }}>{item!.text}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel>
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Principales acciones de mejora pendientes</h4>
              {findings.filter(f => f.status !== 'Resuelto').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#14532d' }}>
                  <CheckCircle2 size={32} style={{ margin: '0 auto 8px', display: 'block' }} aria-hidden="true" />
                  <p style={{ margin: 0, fontWeight: 700 }}>Todos los hallazgos han sido resueltos.</p>
                </div>
              ) : (
                findings
                  .filter(f => f.status !== 'Resuelto')
                  .sort((a, b) => ({ 'Crítica': 0, Alta: 1, Media: 2, Baja: 3 } as Record<string, number>)[a.severity] - ({ 'Crítica': 0, Alta: 1, Media: 2, Baja: 3 } as Record<string, number>)[b.severity])
                  .slice(0, 5)
                  .map((f, i) => {
                    const c = SEV_MAP[f.severity] ?? SEV_MAP['Baja'];
                    return (
                      <div key={f.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '0.75rem', backgroundColor: c.bg, borderRadius: 8, border: `1px solid ${c.border}`, marginBottom: i < 4 ? '0.5rem' : 0 }}>
                        <span aria-hidden="true" style={{ width: 26, height: 26, backgroundColor: c.solid, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                        <div>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                            <SevBadge sev={f.severity} /><PriBadge pri={f.priority} />
                          </div>
                          <p style={{ margin: 0, fontSize: '0.82rem', color: '#1e293b', fontWeight: 600 }}>{f.problem || 'Sin descripción'}</p>
                          {f.recommendation && <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#475569' }}>Acción: {f.recommendation}</p>}
                        </div>
                      </div>
                    );
                  })
              )}
            </Panel>
          </div>
        </section>

        {/* PIE */}
        <footer
          role="contentinfo"
          style={{ backgroundColor: '#003366', color: 'rgba(255,255,255,0.85)', borderRadius: 10, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: '0.78rem' }}
        >
          <span>Usability Test Dashboard Web — Informe generado automáticamente</span>
          <time dateTime={new Date().toISOString().slice(0, 10)}>{reportDate}</time>
        </footer>
      </div>
    </div>
  );
};