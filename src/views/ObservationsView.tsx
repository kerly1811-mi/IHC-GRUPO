// src/views/ObservationsView.tsx
// Grupo 3 – Módulo de Observación | IHC Usability Test Dashboard
// Accesibilidad: WCAG 2.1 AA · WAVE · Lighthouse >= 90

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Observation, SuccessStatus, Severity } from '../models/types';
import {
  Trash2, Plus, CheckCircle, RefreshCcw, ClipboardList,
  Check, X, ChevronDown, Info, Pencil,
} from 'lucide-react';
import AutoGrowTextarea from '../components/AutoGrowTextarea';
import CustomSelect from '../components/CustomSelect';
import { FieldWarning } from '../components/FieldWarning';
import { CharCounter } from '../components/CharCounter';
import { fieldClass } from '../components/validation';
import type { ObservationSeverity } from "../models/usabilityModels";


const SEVERITY_OPTIONS = [
  { value: 'Baja', label: '🟢 Baja' },
  { value: 'Media', label: '🟡 Media' },
  { value: 'Alta', label: '🟠 Alta' },
  { value: 'Crítica', label: '🔴 Crítica' }
];

const SUCCESS_OPTIONS = [
  { value: 'Sí', label: '✅ Sí' },
  { value: 'No', label: '❌ No' },
  { value: 'Con ayuda', label: '🤝 Con ayuda' }
];
import { MAX_CHARS, clamp } from '../components/validation';
import {
  suggestSeverity,
  PROBLEM_SUGGESTIONS,
  PROPOSAL_SUGGESTIONS,
} from '../utils/observationsAnalysis';
import { SeveritySuggestion } from '../components/SeveritySuggestion';
import { SuggestionsInput } from '../components/SuggestionsInput';
import { Tooltip } from '../components/Tooltip';
import { useAIAnalysisContext } from "../controllers/AIAnalysisContext";
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

interface ObservationsViewProps {
  data: Observation[];
  onSync: (data: Observation[]) => void;
  onAdd: () => void;
  onSave: (id: string, updates: Partial<Observation>) => void;
  onDelete: (id: string) => void;
  planId?: string;
  productName?: string;
  onGoToPlan: () => void;
  tasks?: { task_index: string; scenario: string }[];
}

// ── Opciones de perfil educativo ──────────────────────────────────────────────
const PROFILE_OPTIONS = [
  'Primaria/Básica',
  'Bachiller',
  'Profesional',
  'Especialista',
  'Adulto Mayor',
] as const;

const severityStyles: Record<string, { bg: string; text: string; border: string }> = {
  Baja: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300' },
  Media: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
  Alta: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300' },
  'Crítica': { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300' },
};

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  'Crítica': 4, Alta: 3, Media: 2, Baja: 1,
};

const successStyles: Record<string, { bg: string; text: string; border: string }> = {
  'Sí': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300' },
  'No': { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300' },
  'Con ayuda': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
};

function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

interface ReadEditCellProps {
  value: string;
  placeholder?: string;
  rows?: number;
  colorClass?: string;
  focusBorderClass?: string;
  onCommit: (val: string) => void;
  onBlurSave: (val: string) => void;
  maxLength?: number;
  className?: string;
  isTextarea?: boolean;
  ariaLabel?: string;
  autoFocus?: boolean;
  onAutoFocused?: () => void;
}

const ReadEditCell: React.FC<ReadEditCellProps> = ({
  value, placeholder = '', rows = 2,
  colorClass = 'text-slate-800',
  focusBorderClass = 'focus-visible:border-navy focus-visible:ring-4 focus-visible:ring-navy/80',
  onCommit, onBlurSave,
  maxLength = MAX_CHARS, className = '',
  isTextarea = true, ariaLabel,
  autoFocus = false, onAutoFocused,
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocus) return;
    setEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      onAutoFocused?.();
    }, 0);
  }, [autoFocus, onAutoFocused]);

  const startEdit = () => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 0); };
  const handleBlur = () => { setEditing(false); onBlurSave(inputRef.current?.value ?? value); };

  const inputCls = [
    'w-full px-2.5 py-2 border border-navy/30 bg-white rounded-lg text-[0.82rem] font-medium',
    'resize-none focus-visible:outline-none focus-visible:ring-4 focus-visible:border-2',
    focusBorderClass,
  ].join(' ');

  return (
    <div className={`group relative ${className}`}>
      {!editing ? (
        <button
          type="button"
          onClick={startEdit}
          aria-label={ariaLabel ? `Editar ${ariaLabel}` : `Editar: ${placeholder}`}
          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-100/70
                     focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80
                     focus-visible:bg-slate-50 flex items-start gap-1.5 transition-colors"
        >
          <span className={`flex-1 text-sm leading-relaxed font-medium break-words whitespace-pre-wrap min-h-[1.4rem] ${value ? colorClass : 'text-slate-400 italic'}`}>
            {value || placeholder}
          </span>
          <Pencil size={16} className="mt-0.5 shrink-0 text-slate-300 group-hover:text-slate-500 transition-colors" aria-hidden="true" />
        </button>
      ) : isTextarea ? (
        <AutoGrowTextarea
          ref={inputRef as React.Ref<HTMLTextAreaElement>}
          className={inputCls}
          value={value}
          onChange={e => onCommit(e.target.value)}
          onBlur={handleBlur}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
        />
      ) : (
        <input
          ref={inputRef as React.Ref<HTMLInputElement>}
          type="text"
          className={inputCls}
          value={value}
          onChange={e => onCommit(e.target.value)}
          onBlur={handleBlur}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
        />
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// TARJETA MÓVIL
// ══════════════════════════════════════════════════════════════════════════════
const ObservationCard: React.FC<{
  obs: Observation; idx: number;
  onLocalChange: (id: string, u: Partial<Observation>) => void;
  onSave: (id: string, u: Partial<Observation>) => void;
  onDelete: (id: string) => void;
  onAction: (fn: () => void, rowId?: string) => void;
  tasks?: { task_index: string; scenario: string }[];
  shouldAutoFocus?: boolean;
  onAutoFocused?: () => void;
  saveStatus?: 'pending' | 'success';
}> = ({ obs, idx, onLocalChange, onSave, onDelete, onAction, tasks = [], shouldAutoFocus = false, onAutoFocused, saveStatus }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const saveMessage = saveStatus === 'pending' ? 'Guardando…' : saveStatus === 'success' ? 'Guardado' : undefined;
  const [dismissedSugg, setDismissedSugg] = useState(false);
  const touch = (f: string) => setTouched(p => ({ ...p, [f]: true }));

  const sStyle = severityStyles[obs.severity] ?? severityStyles['Baja'];
  const okStyle = successStyles[obs.success_level] ?? successStyles['Sí'];

  const isProblemRequired = obs.success_level === 'No';
  const warnParticipant = touched.participant && !obs.participant?.trim();
  const warnTaskRef = touched.task_ref && !obs.task_ref?.trim();
  const warnComments = touched.comments && !obs.comments?.trim();
  const warnProblem = touched.problem && isProblemRequired && !obs.problem?.trim();

  const suggestedSev = suggestSeverity(obs);
  const showSuggestion = !dismissedSugg && suggestedSev !== obs.severity && (
    obs.success_level === 'No' || (obs.errors || 0) >= 2 || (obs.comments || '').length > 10
  );

  const handleAcceptSeverity = () => {
    onLocalChange(obs.id!, { severity: suggestedSev });
    onAction(() => onSave(obs.id!, { severity: suggestedSev }), obs.id);
    setDismissedSugg(true);
  };

  const handleChange = (field: keyof Observation, value: string) => {
    onLocalChange(obs.id!, { [field]: clamp(value) } as Partial<Observation>);
    setDismissedSugg(false);
  };

  return (
    <article
      className={`relative bg-white border-2 ${sStyle.border} rounded-2xl mb-4 overflow-hidden shadow-sm`}
      aria-label={`Observación ${idx + 1}${obs.participant ? `, participante ${obs.participant}` : ''}`}
    >
      {saveMessage && (
        <div className="absolute top-4 right-4 z-10">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.18em] ${saveStatus === 'pending' ? 'bg-slate-900 text-white' : 'bg-emerald-700 text-white'}`}>
            {saveStatus === 'pending' ? <RefreshCcw size={12} className="animate-spin" aria-hidden="true" /> : <Check size={12} aria-hidden="true" />}
            {saveMessage}
          </span>
        </div>
      )}
      <div className={`${sStyle.bg} p-4 flex justify-between items-center flex-wrap gap-2`}>
        <span className={`font-black ${sStyle.text} text-sm uppercase tracking-tight`}>
          Observación #{idx + 1}
        </span>
        <div className="flex gap-2 items-center flex-wrap" aria-label="Estado actual de la observación">
          {/* ── Éxito badge con color dinámico ─────────────────────────────── */}
          <span className={`px-2.5 py-0.5 rounded-full ${okStyle.bg} ${okStyle.text} font-bold text-xs border ${okStyle.border}`}>
            {obs.success_level || 'Sí'}
          </span>
          {/* ── Severidad badge con color dinámico ─────────────────────────── */}
          <span className={`px-2.5 py-0.5 rounded-md ${sStyle.bg} ${sStyle.text} font-bold text-xs border ${sStyle.border}`}>
            {obs.severity || 'Baja'}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* ── Fila superior: Participante / Perfil / Tarea ─────────────────── */}
        <div className="grid grid-cols-[1fr_1fr_90px] gap-3">
          {/* Participante */}
          <div className="flex flex-col gap-1">
            <label htmlFor={`m-participant-${obs.id}`} className="font-black text-xs text-slate-600 uppercase tracking-widest">
              Participante&nbsp;<span aria-hidden="true">*</span><span className="sr-only">(requerido)</span>
            </label>
            <input id={`m-participant-${obs.id}`} type="text" maxLength={MAX_CHARS}
              autoFocus={shouldAutoFocus}
              aria-required="true" aria-invalid={warnParticipant || undefined}
              className={fieldClass(warnParticipant, 'w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus-visible:bg-white focus-visible:border-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 transition-all', 'error')}
              value={obs.participant || ''}
              onChange={e => handleChange('participant', e.target.value)}
              onBlur={e => { touch('participant'); onAction(() => onSave(obs.id!, { participant: e.target.value }), obs.id); }}
              placeholder="P1"
            />
            <CharCounter value={obs.participant} />
            <FieldWarning show={warnParticipant} message="Ingrese el nombre o código del participante." variant="error" />
          </div>

          {/* ── PERFIL: combobox con opciones predefinidas ────────────────── */}
          <div className="flex flex-col gap-1">
            <label htmlFor={`m-profile-${obs.id}`} className="font-black text-[0.7rem] text-slate-600 uppercase tracking-widest">
              Perfil
            </label>
            <CustomSelect
              id={`m-profile-${obs.id}`}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus-visible:bg-white focus-visible:border-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 transition-all font-medium"
              value={obs.profile || ''}
              options={[{ value: '', label: '— Perfil —' }, ...PROFILE_OPTIONS.map(opt => ({ value: opt, label: opt }))]}
              onChange={e => {
                onLocalChange(obs.id!, { profile: e.target.value });
                onAction(() => onSave(obs.id!, { profile: e.target.value }), obs.id);
              }}
            />
          </div>

          {/* Tarea */}
          <div className="flex flex-col gap-1">
            <label htmlFor={`m-task-${obs.id}`} className="font-black text-[0.7rem] text-slate-600 uppercase tracking-widest">
              Tarea&nbsp;<span aria-hidden="true">*</span><span className="sr-only">(requerido)</span>
            </label>
            {tasks.length > 0 ? (
              <CustomSelect id={`m-task-${obs.id}`} aria-required="true" aria-invalid={warnTaskRef || undefined}
                className={fieldClass(warnTaskRef, 'w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus-visible:bg-white focus-visible:border-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 transition-all font-medium', 'error')}
                value={obs.task_ref || ''}
                options={[{ value: '', label: '— Tarea —' }, ...tasks.map(t => ({ value: t.task_index, label: `${t.task_index} – ${t.scenario || '(sin nombre)'}` }))]}
                onChange={e => { touch('task_ref'); onLocalChange(obs.id!, { task_ref: e.target.value }); onAction(() => onSave(obs.id!, { task_ref: e.target.value }), obs.id); }}
              />
            ) : (
              <input id={`m-task-${obs.id}`} type="text" maxLength={20} aria-required="true"
                className={fieldClass(warnTaskRef, 'w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus-visible:bg-white focus-visible:border-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 transition-all', 'error')}
                value={obs.task_ref || ''}
                onChange={e => onLocalChange(obs.id!, { task_ref: e.target.value })}
                onBlur={e => { touch('task_ref'); onAction(() => onSave(obs.id!, { task_ref: e.target.value }), obs.id); }}
                placeholder="T1"
              />
            )}
            <FieldWarning show={warnTaskRef} message="Seleccione la tarea asociada." variant="error" />
          </div>
        </div>

        {/* ── Éxito / Tiempo / Errores ─────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Éxito — select con color dinámico (igual que desktop) */}
          <div className="flex flex-col gap-1">
            <label htmlFor={`m-success-${obs.id}`} className="font-black text-[0.7rem] text-slate-600 uppercase tracking-widest">Éxito</label>
            <CustomSelect id={`m-success-${obs.id}`}
              className={`w-full p-2 border ${okStyle.border} rounded-lg text-sm ${okStyle.bg} ${okStyle.text} font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 cursor-pointer`}
              value={obs.success_level}
              options={SUCCESS_OPTIONS}
              onChange={e => {
                const val = e.target.value as SuccessStatus;
                onLocalChange(obs.id!, { success_level: val });
                onAction(() => onSave(obs.id!, { success_level: val }), obs.id);
                setDismissedSugg(false);
              }}
            />
          </div>

          {/* Tiempo */}
          <div className="flex flex-col gap-1">
            <label htmlFor={`m-time-${obs.id}`} className="font-black text-[0.7rem] text-slate-600 uppercase tracking-widest">Tiempo (s)</label>
            <input id={`m-time-${obs.id}`} type="number" min="0"
              className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus-visible:bg-white focus-visible:border-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 transition-all font-mono font-bold"
              value={obs.time_seconds}
              onChange={e => onLocalChange(obs.id!, { time_seconds: parseInt(e.target.value) || 0 })}
              onBlur={e => onAction(() => onSave(obs.id!, { time_seconds: parseInt(e.target.value) || 0 }), obs.id)}
              placeholder="0"
            />
          </div>

          {/* Errores — alerta visual igual que desktop */}
          <div className="flex flex-col gap-1">
            <label htmlFor={`m-errors-${obs.id}`} className="font-black text-[0.7rem] text-slate-600 uppercase tracking-widest">Errores</label>
            <input id={`m-errors-${obs.id}`} type="number" min="0"
              aria-describedby={obs.errors > 2 ? `m-err-warn-${obs.id}` : undefined}
              className={`w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus-visible:bg-white focus-visible:border-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 transition-all font-mono font-bold ${obs.errors > 2 ? 'text-red-700' : 'text-slate-800'}`}
              value={obs.errors}
              onChange={e => { onLocalChange(obs.id!, { errors: parseInt(e.target.value) || 0 }); setDismissedSugg(false); }}
              onBlur={e => onAction(() => onSave(obs.id!, { errors: parseInt(e.target.value) || 0 }), obs.id)}
              placeholder="0"
            />
            {obs.errors > 2 && (
              <span id={`m-err-warn-${obs.id}`} role="alert" className="text-sm text-red-700 font-bold">
                Alto
              </span>
            )}
          </div>
        </div>

        {/* Comentarios */}
        <div className="flex flex-col gap-1">
          <label htmlFor={`m-comments-${obs.id}`} className="font-black text-[0.7rem] text-slate-600 uppercase tracking-widest">
            Comentarios clave&nbsp;<span aria-hidden="true">*</span><span className="sr-only">(requerido)</span>
          </label>
          <AutoGrowTextarea id={`m-comments-${obs.id}`}
            aria-required="true" aria-invalid={warnComments || undefined}
            className={fieldClass(warnComments, 'w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus-visible:bg-white focus-visible:border-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 transition-all font-medium', 'error')}
            value={obs.comments || ''}
            onChange={e => { handleChange('comments', e.target.value); }}
            onBlur={e => { touch('comments'); onAction(() => onSave(obs.id!, { comments: e.target.value }), obs.id); }}
            placeholder="Ej. Dudó al pulsar el botón..." rows={2}
          />
          <CharCounter value={obs.comments} />
          <FieldWarning show={warnComments} message="Ingrese al menos un comentario clave." variant="error" />
        </div>

        {/* Problema */}
        <div className="flex flex-col gap-1">
          <label htmlFor={`m-problem-${obs.id}`} className="font-black text-[0.7rem] text-red-700 uppercase tracking-widest">
            Problema detectado
            {isProblemRequired && (
              <><span aria-hidden="true">&nbsp;*</span><span className="sr-only">(requerido cuando el éxito es No)</span></>
            )}
          </label>
          <SuggestionsInput id={`m-problem-${obs.id}`}
            value={obs.problem || ''} suggestions={PROBLEM_SUGGESTIONS} maxLength={MAX_CHARS}
            className={fieldClass(warnProblem, 'w-full p-2.5 border border-red-200 rounded-lg text-sm bg-red-50/40 focus-visible:bg-white focus-visible:border-red-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300 transition-all font-medium', 'error')}
            placeholder="Ej. El usuario no encontró el botón principal..." rows={2}
            aria-label="Problema detectado"
            onChange={val => { onLocalChange(obs.id!, { problem: val }); setDismissedSugg(false); }}
            onBlur={val => { touch('problem'); onAction(() => onSave(obs.id!, { problem: val }), obs.id); }}
          />
          <CharCounter value={obs.problem} />
          <FieldWarning show={warnProblem} message="Describe el problema (obligatorio cuando la tarea falló)." variant="error" />
        </div>

        {/* ── Severidad — select con color dinámico (igual que desktop) ────── */}
        <div className="flex flex-col gap-1">
          <label htmlFor={`m-severity-${obs.id}`} className="font-black text-[0.7rem] text-slate-600 uppercase tracking-widest">Severidad</label>
          <CustomSelect id={`m-severity-${obs.id}`}
            className={`w-full p-2 border ${sStyle.border} rounded-lg text-sm ${sStyle.bg} ${sStyle.text} font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 cursor-pointer`}
            value={obs.severity}
            options={SEVERITY_OPTIONS}
            onChange={e => {
              const val = e.target.value as Severity;
              onLocalChange(obs.id!, { severity: val });
              onAction(() => onSave(obs.id!, { severity: val }), obs.id);
              setDismissedSugg(true);
            }}
          />
          {showSuggestion && (
            <SeveritySuggestion suggested={suggestedSev} current={obs.severity}
              onAccept={handleAcceptSeverity} onDismiss={() => setDismissedSugg(true)} />
          )}
        </div>

        {/* Mejora propuesta */}
        <div className="flex flex-col gap-1">
          <label htmlFor={`m-proposal-${obs.id}`} className="font-black text-[0.7rem] text-green-700 uppercase tracking-widest">
            Mejora propuesta
          </label>
          <SuggestionsInput id={`m-proposal-${obs.id}`}
            value={obs.proposal || ''} suggestions={PROPOSAL_SUGGESTIONS} maxLength={MAX_CHARS}
            className="w-full p-2.5 border border-green-200 rounded-lg text-sm bg-green-50/40 focus-visible:bg-white focus-visible:border-green-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300 transition-all font-medium"
            placeholder="Ej. Cambiar la etiqueta por una más descriptiva..." rows={2}
            aria-label="Mejora propuesta"
            onChange={val => onLocalChange(obs.id!, { proposal: val })}
            onBlur={val => onAction(() => onSave(obs.id!, { proposal: val }), obs.id)}
          />
          <CharCounter value={obs.proposal} />
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          {confirmDelete ? (
            <div className="flex gap-2 items-center" role="group" aria-label="Confirmar eliminación de la observación">
              <span className="text-[0.72rem] text-red-700 font-black uppercase tracking-widest">¿Eliminar?</span>
              <button type="button" aria-label="Confirmar eliminación"
                onClick={() => { onDelete(obs.id!); setConfirmDelete(false); }}
                className="inline-flex items-center justify-center w-8 h-8 bg-red-600 text-white border-none rounded-lg cursor-pointer hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-400 shadow-md"
              >
                <Check size={16} strokeWidth={3} aria-hidden="true" />
              </button>
              <button type="button" aria-label="Cancelar eliminación"
                onClick={() => setConfirmDelete(false)}
                className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-700 border-none rounded-lg cursor-pointer hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-400"
              >
                <X size={16} strokeWidth={3} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button type="button" aria-label={`Eliminar observación ${idx + 1}`}
              className="inline-flex items-center gap-1.5 bg-transparent border-none text-slate-500 cursor-pointer p-2 rounded-lg hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300 transition-all"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={18} aria-hidden="true" />
              <span className="text-[0.82rem] font-bold">Eliminar</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// FILA DE TABLA DESKTOP
// ══════════════════════════════════════════════════════════════════════════════
const ObservationRow: React.FC<{
  obs: Observation;
  rowIndex: number;
  handleLocalChange: (id: string, u: Partial<Observation>) => void;
  handleActionWithStatus: (fn: () => void, rowId?: string) => void;
  onSave: (id: string, u: Partial<Observation>) => void;
  onDelete: (id: string) => void;
  tasks?: { task_index: string; scenario: string }[];
  shouldAutoFocus?: boolean;
  onAutoFocused?: () => void;
  saveStatus?: 'pending' | 'success';
}> = ({ obs, rowIndex, handleLocalChange, handleActionWithStatus, onSave, onDelete, tasks = [], shouldAutoFocus = false, onAutoFocused, saveStatus }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [dismissedSugg, setDismissedSugg] = useState(false);
  const touch = (f: string) => setTouched(p => ({ ...p, [f]: true }));

  const sStyle = severityStyles[obs.severity] ?? severityStyles['Baja'];
  const okStyle = successStyles[obs.success_level] ?? successStyles['Sí'];

  const isProblemRequired = obs.success_level === 'No';
  const warnParticipant = touched.participant && !obs.participant?.trim();
  const warnTaskRef = touched.task_ref && !obs.task_ref?.trim();
  const warnComments = touched.comments && !obs.comments?.trim();
  const warnProblem = touched.problem && isProblemRequired && !obs.problem?.trim();

  const suggestedSev = suggestSeverity(obs);
  const showSuggestion = !dismissedSugg && suggestedSev !== obs.severity && (
    obs.success_level === 'No' || (obs.errors || 0) >= 2 || (obs.comments || '').length > 10
  );

  const handleAcceptSeverity = () => {
    handleLocalChange(obs.id!, { severity: suggestedSev });
    handleActionWithStatus(() => onSave(obs.id!, { severity: suggestedSev }), obs.id);
    setDismissedSugg(true);
  };

  const commit = (field: keyof Observation) => (value: string) => {
    handleLocalChange(obs.id!, { [field]: clamp(value) } as Partial<Observation>);
    setDismissedSugg(false);
  };

  return (
    <tr
      className={`transition-colors border-b border-slate-200 last:border-0 ${saveStatus === 'success' ? 'bg-emerald-50/40' : ''} ${saveStatus === 'pending' ? 'bg-slate-100/70' : ''}`}
      aria-label={`Fila ${rowIndex + 1}: ${obs.participant || 'sin participante'}, tarea ${obs.task_ref || 'sin tarea'}`}
    >
      {/* # */}
      <td className="p-2 border-r border-slate-200 text-center align-middle">
        <span className="text-xs font-black text-slate-400">{rowIndex + 1}</span>
      </td>

      {/* Participante */}
      <td className="p-2 border-r border-slate-200 align-top min-w-[100px]">
        <ReadEditCell value={obs.participant || ''} placeholder="P1" colorClass="text-slate-900 font-bold"
          isTextarea={false} ariaLabel="Participante"
          autoFocus={shouldAutoFocus}
          onAutoFocused={onAutoFocused}
          onCommit={commit('participant')}
          onBlurSave={v => { touch('participant'); handleActionWithStatus(() => onSave(obs.id!, { participant: v }), obs.id); }}
        />
        <FieldWarning show={warnParticipant} message="Ingrese el participante." variant="error" />
      </td>

      {/* ── PERFIL: combobox (desktop) ───────────────────────────────────── */}
      <td className="p-2 border-r border-slate-200 align-top min-w-[140px]">
        <CustomSelect
          aria-label={`Perfil, fila ${rowIndex + 1}`}
          className="w-full p-2 border border-slate-200 bg-slate-50 rounded-lg text-[0.82rem] font-medium focus-visible:bg-white focus-visible:border-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 cursor-pointer transition-all"
          value={obs.profile || ''}
          options={[{ value: '', label: '— Perfil —' }, ...PROFILE_OPTIONS.map(opt => ({ value: opt, label: opt }))]}
          onChange={e => {
            handleLocalChange(obs.id!, { profile: e.target.value });
            handleActionWithStatus(() => onSave(obs.id!, { profile: e.target.value }), obs.id);
          }}
        />
      </td>

      {/* Tarea */}
      <td className="p-2 border-r border-slate-200 align-top w-[140px]">
        {tasks.length > 0 ? (
          <CustomSelect
            aria-label={`Tarea, fila ${rowIndex + 1}`} aria-required="true"
            className={fieldClass(warnTaskRef, 'w-full p-2 border border-slate-200 bg-slate-50 rounded-lg text-sm focus-visible:bg-white focus-visible:border-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 font-mono font-bold', 'error')}
            value={obs.task_ref || ''}
            options={[{ value: '', label: '—' }, ...tasks.map(t => ({ value: t.task_index, label: `${t.task_index} – ${t.scenario || '(sin nombre)'}` }))]}
            onChange={e => { touch('task_ref'); handleLocalChange(obs.id!, { task_ref: e.target.value }); handleActionWithStatus(() => onSave(obs.id!, { task_ref: e.target.value }), obs.id); }}
          />
        ) : (
          <ReadEditCell value={obs.task_ref || ''} placeholder="T1" colorClass="text-slate-800 font-mono"
            isTextarea={false} maxLength={20} ariaLabel="Referencia de tarea"
            onCommit={v => handleLocalChange(obs.id!, { task_ref: v })}
            onBlurSave={v => { touch('task_ref'); handleActionWithStatus(() => onSave(obs.id!, { task_ref: v }), obs.id); }}
          />
        )}
        <FieldWarning show={warnTaskRef} message="Seleccione la tarea." variant="error" />
      </td>

      {/* Éxito */}
      <td className="p-2 border-r border-slate-200 align-top min-w-[155px]">
        <CustomSelect
          aria-label={`Éxito de la tarea, fila ${rowIndex + 1}`}
          className={`w-full p-2 border ${okStyle.border} rounded-lg text-[0.82rem] ${okStyle.bg} ${okStyle.text} font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 cursor-pointer shadow-sm`}
          value={obs.success_level}
          options={SUCCESS_OPTIONS}
          onChange={e => {
            const val = e.target.value as SuccessStatus;
            handleLocalChange(obs.id!, { success_level: val });
            handleActionWithStatus(() => onSave(obs.id!, { success_level: val }), obs.id);
            setDismissedSugg(false);
          }}
        />
      </td>

      {/* Tiempo */}
      <td className="p-2 text-center border-r border-slate-200 align-top w-[90px]">
        <input aria-label={`Tiempo en segundos, fila ${rowIndex + 1}`} type="number" min="0"
          className="w-full px-2 py-2 border border-transparent bg-transparent rounded-lg text-[0.82rem] text-slate-800 font-mono font-bold text-center hover:bg-slate-50 hover:border-slate-200 focus-visible:bg-white focus-visible:border-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 transition-all"
          value={obs.time_seconds}
          onChange={e => handleLocalChange(obs.id!, { time_seconds: parseInt(e.target.value) || 0 })}
          onBlur={() => handleActionWithStatus(() => onSave(obs.id!, { time_seconds: obs.time_seconds }), obs.id)}
          placeholder="0"
        />
      </td>

      {/* Errores */}
      <td className="p-2 text-center border-r border-slate-200 align-top w-[90px]">
        <input aria-label={`Errores, fila ${rowIndex + 1}`} type="number" min="0"
          aria-describedby={obs.errors > 2 ? `err-high-${obs.id}` : undefined}
          className={`w-full px-2 py-2 border border-transparent bg-transparent rounded-lg text-[0.82rem] font-mono font-bold text-center hover:bg-slate-50 hover:border-slate-200 focus-visible:bg-white focus-visible:border-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 transition-all ${obs.errors > 2 ? 'text-red-700' : 'text-slate-800'}`}
          value={obs.errors}
          onChange={e => { handleLocalChange(obs.id!, { errors: parseInt(e.target.value) || 0 }); setDismissedSugg(false); }}
          onBlur={() => handleActionWithStatus(() => onSave(obs.id!, { errors: obs.errors }), obs.id)}
          placeholder="0"
        />
        {obs.errors > 2 && (
          <span id={`err-high-${obs.id}`} role="alert" className="text-sm text-red-700 font-bold mt-0.5 block">Alto</span>
        )}
      </td>

      {/* Comentarios */}
      <td className="p-2 border-r border-slate-200 align-top min-w-[220px]">
        <ReadEditCell value={obs.comments || ''} placeholder="Comentarios..." colorClass="text-slate-800"
          ariaLabel="Comentarios clave" rows={3}
          onCommit={commit('comments')}
          onBlurSave={v => { touch('comments'); handleActionWithStatus(() => onSave(obs.id!, { comments: v }), obs.id); }}
        />
        <FieldWarning show={warnComments} message="Campo requerido." variant="error" />
      </td>

      {/* Problema */}
      <td className="p-2 border-r border-slate-200 align-top min-w-[220px]">
        <ReadEditCell
          value={obs.problem || ''}
          placeholder={isProblemRequired ? 'Obligatorio…' : 'Problema detectado...'}
          colorClass="text-red-800"
          focusBorderClass="focus-visible:border-red-400 focus-visible:ring-4 focus-visible:ring-red-300"
          ariaLabel="Problema detectado"
          rows={3}
          className={obs.problem ? 'bg-red-50/20 rounded-lg' : ''}
          onCommit={v => commit('problem')(v)}
          onBlurSave={v => { touch('problem'); handleActionWithStatus(() => onSave(obs.id!, { problem: v }), obs.id); }}
        />
        {isProblemRequired && !obs.problem && (
          <span className="text-sm text-red-700 font-bold mt-0.5 block" role="note">
            Requerido (si el éxito es No)
          </span>
        )}
        <FieldWarning show={warnProblem} message="Obligatorio cuando Éxito es No." variant="error" />
      </td>

      {/* Severidad */}
      <td className="p-2 text-center border-r border-slate-200 align-top min-w-[150px]">
        <CustomSelect aria-label={`Severidad, fila ${rowIndex + 1}`}
          className={`w-full p-2 border ${sStyle.border} rounded-lg text-[0.78rem] ${sStyle.bg} ${sStyle.text} font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 cursor-pointer shadow-sm`}
          value={obs.severity}
          options={SEVERITY_OPTIONS}
          onChange={e => {
            const val = e.target.value as Severity;
            handleLocalChange(obs.id!, { severity: val });
            handleActionWithStatus(() => onSave(obs.id!, { severity: val }), obs.id);
            setDismissedSugg(true);
          }}
        />
        {showSuggestion && (
          <SeveritySuggestion suggested={suggestedSev} current={obs.severity}
            onAccept={handleAcceptSeverity} onDismiss={() => setDismissedSugg(true)} />
        )}
      </td>

      {/* Mejora propuesta */}
      <td className="p-2 border-r border-slate-200 align-top min-w-[220px]">
        <ReadEditCell
          value={obs.proposal || ''}
          placeholder="Mejora propuesta..."
          colorClass="text-green-800"
          focusBorderClass="focus-visible:border-green-400 focus-visible:ring-4 focus-visible:ring-green-300"
          ariaLabel="Mejora propuesta"
          rows={3}
          className={obs.proposal ? 'bg-green-50/20 rounded-lg' : ''}
          onCommit={v => handleLocalChange(obs.id!, { proposal: v })}
          onBlurSave={v => handleActionWithStatus(() => onSave(obs.id!, { proposal: v }), obs.id)}
        />
      </td>

      {/* Eliminar */}
      <td className="p-2 text-center align-top">
        {(saveStatus === 'pending' || saveStatus === 'success') && (
          <div className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.12em]">
            {saveStatus === 'pending' ? (
              <span className="text-slate-600">Guardando…</span>
            ) : (
              <span className="text-emerald-700">Guardado</span>
            )}
          </div>
        )}
        {confirmDelete ? (
          <div className="flex flex-col gap-1 items-center" role="group" aria-label="Confirmar eliminación">
            <button type="button" aria-label="Confirmar eliminación"
              onClick={() => { onDelete(obs.id!); setConfirmDelete(false); }}
              className="bg-red-600 text-white border-none rounded-md w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-400 shadow-sm"
            >
              <Check size={14} strokeWidth={3} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Cancelar eliminación"
              onClick={() => setConfirmDelete(false)}
              className="bg-slate-200 text-slate-700 border-none rounded-md w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-400 shadow-sm"
            >
              <X size={14} strokeWidth={3} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button type="button" aria-label={`Eliminar fila ${rowIndex + 1}`}
            className="bg-transparent border-none text-slate-400 p-2 cursor-pointer hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300 rounded-lg transition-all"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        )}
      </td>
    </tr>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VISTA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export const ObservationsView: React.FC<ObservationsViewProps> = ({
  data, onSync, onAdd, onSave, onDelete,
  planId, productName, onGoToPlan, tasks = [],
}) => {
  const width = useWindowWidth();
  const isMobile = width < 1024;
  const [isSaving, setIsSaving] = useState(false);
  const [sortMode, setSortMode] = useState<'desc' | 'asc' | 'default'>('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const isProductEmpty = !productName || productName.trim() === '';
  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);
  const [focusAfterAdd, setFocusAfterAdd] = useState(false);
  const prevObservationIds = useRef<string[]>([]);
  const [rowSaveStatus, setRowSaveStatus] = useState<Record<string, 'pending' | 'success'>>({});
  const hasPendingSave = Object.values(rowSaveStatus).includes('pending');

  const { analyzeFromRequest: analyze, status, error, retryCountdown } = useAIAnalysisContext();

  const isBlocked = status === 'loading' || status === 'queue' || retryCountdown > 0;
  const analyzeButtonLabel = status === 'queue'
    ? 'En cola...'
    : status === 'loading'
      ? 'Analizando...'
      : retryCountdown > 0
        ? `⏳ Reintentar en ${retryCountdown}s`
        : '🤖 Analizar con IA';

  const handleAddAndFocus = useCallback(() => {
    setFocusAfterAdd(true);
    onAdd();
  }, [onAdd]);

  useKeyboardShortcuts(handleAddAndFocus, !!planId);

  useEffect(() => {
    const currentIds = data.map(obs => obs.id || '').filter(Boolean);
    if (focusAfterAdd && currentIds.length > prevObservationIds.current.length) {
      const addedId = currentIds.find(id => !prevObservationIds.current.includes(id));
      if (addedId) setFocusTargetId(addedId);
      setFocusAfterAdd(false);
    }
    prevObservationIds.current = currentIds;
  }, [data, focusAfterAdd]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isSaving || hasPendingSave) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSaving, hasPendingSave]);

  const handleActionWithStatus = (fn: () => void, rowId?: string) => {
    setIsSaving(true);
    if (rowId) {
      setRowSaveStatus(prev => ({ ...prev, [rowId]: 'pending' }));
    }

    fn();

    setTimeout(() => {
      setIsSaving(false);
      if (rowId) {
        setRowSaveStatus(prev => ({ ...prev, [rowId]: 'success' }));
        setTimeout(() => {
          setRowSaveStatus(prev => {
            const next = { ...prev };
            if (next[rowId] === 'success') {
              delete next[rowId];
            }
            return next;
          });
        }, 1800);
      }
    }, 500);
  };

  const handleLocalChange = (id: string, updates: Partial<Observation>) => {
    onSync(data.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const [validationError, setValidationError] = useState<string | null>(null);

  // Valida que todas las observaciones tengan los campos requeridos llenos
  const validateObservations = (): string | null => {
    const REQUIRED: { field: keyof Observation; label: string }[] = [
      { field: 'participant', label: 'Participante' },
      { field: 'task_ref', label: 'Tarea' },
      { field: 'comments', label: 'Comentarios' },
    ];

    for (const obs of data) {
      const originalIndex = data.indexOf(obs) + 1;

      // Campos siempre requeridos
      for (const { field, label } of REQUIRED) {
        const val = obs[field];
        if (!val || (typeof val === 'string' && val.trim().length === 0)) {
          return `Falta completar el campo "${label}" en la Observación #${originalIndex}.`;
        }
      }

      // Problema es obligatorio si el éxito es 'No' o 'Con ayuda'
      if ((obs.success_level === 'No' || obs.success_level === 'Con ayuda') &&
          (!obs.problem || obs.problem.trim().length === 0)) {
        return `Falta completar el campo "Problema" en la Observación #${originalIndex} (el éxito fue "${obs.success_level}").`;
      }
    }
    return null;
  };

const handleAIAnalysis = async () => {
  const validErr = validateObservations();
  if (validErr) {
    setValidationError(validErr);
    return;
  }
  setValidationError(null);

  const analysisRequest = {
    projectName: productName || "Proyecto sin nombre",
    testPlan: {
      objective: "Evaluación de usabilidad",
      method: "Prueba de usabilidad",
    },
    observations: data.map((obs) => {
      const taskLabel = obs.task_ref
        ? tasks.find(t => t.task_index === obs.task_ref)
          ? `${obs.task_ref} - ${tasks.find(t => t.task_index === obs.task_ref)!.scenario}`
          : obs.task_ref.trim().length >= 3
            ? obs.task_ref
            : `Tarea ${obs.task_ref}`
        : "Tarea sin especificar";

      const issueText =
        (obs.problem && obs.problem.trim().length >= 3 ? obs.problem : null) ||
        (obs.comments && obs.comments.trim().length >= 3 ? obs.comments : null) ||
        "Observación registrada";

      return {
        participant: obs.participant,
        task: taskLabel,
        issue: issueText,
        severity: obs.severity as ObservationSeverity,
      };
    }),
    metrics: {
      taskSuccess:
        data.length > 0
          ? Math.round((data.filter(o => o.success_level === 'Sí').length / data.length) * 100)
          : 0,
      averageTime:
        data.length > 0
          ? Math.round(data.reduce((acc, o) => acc + (o.time_seconds || 0), 0) / data.length)
          : 0,
      satisfaction: 3.5,
    },
    context: planId ? `planId:${planId}` : undefined,
  };

  const aiResult = await analyze(analysisRequest, data);

  if (aiResult) {
    console.log("Análisis IA completado:", aiResult);
  }
};


  const displayData = useMemo(() => {
    if (sortMode === 'default') return data;
    return [...data].sort((a, b) => {
      const wA = SEVERITY_WEIGHTS[a.severity] || 0;
      const wB = SEVERITY_WEIGHTS[b.severity] || 0;
      return sortMode === 'desc' ? wB - wA : wA - wB;
    });
  }, [data, sortMode]);

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between bg-navy text-white p-4 md:px-6 rounded-xl mb-4 shadow-md min-h-[70px] gap-4">
        <div className="flex-1" aria-hidden="true" />
        <h1 className="text-xl md:text-2xl font-bold m-0 text-center flex-1 text-white">
          Bitácora de observaciones
        </h1>
        <div role="status" aria-live="polite" aria-atomic="true"
          className="flex-1 flex justify-end items-center gap-2 text-sm font-bold"
        >
          {isSaving
            ? <span className="flex items-center gap-1.5 text-white animate-pulse">
              <RefreshCcw size={16} className="animate-spin" aria-hidden="true" /> Guardando…
            </span>
            : <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <CheckCircle size={16} aria-hidden="true" /> Cambios guardados
            </span>
          }
        </div>
      </header>

      <div className="space-y-4">
        {isProductEmpty ? (
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" aria-labelledby="empty-heading">
            <div className="text-center p-12 md:p-16 flex flex-col items-center">
              <div aria-hidden="true" className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <ClipboardList size={40} className="text-amber-600" />
              </div>
              <h2 id="empty-heading" className="text-xl font-black text-slate-900 mb-2">
                ¡Falta el nombre del producto!
              </h2>
              <p className="text-slate-600 font-medium max-w-[400px] mb-8 leading-relaxed">
                Para registrar observaciones, primero define un nombre al producto en la pestaña Plan.
              </p>
              <button onClick={onGoToPlan}
                className="inline-flex items-center gap-2 bg-navy text-white border-none rounded-xl px-8 py-3.5 text-base font-black cursor-pointer hover:bg-navy-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 focus-visible:ring-offset-2 shadow-lg transition-all active:scale-[0.98]"
              >
                Ir a definir Producto
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* Vista MÓVIL */}
            {isMobile && (
              <section aria-labelledby="obs-cards-heading">
                <div className="flex items-center justify-between mb-4">
                  <h2 id="obs-cards-heading" className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2 m-0">
                    <span className="w-2 h-6 bg-navy rounded-full" aria-hidden="true" />
                    Observaciones
                  </h2>
                  <div className="relative">
                    <button type="button"
                      onClick={() => setShowSortMenu(!showSortMenu)}
                      aria-label="Ordenar observaciones por severidad"
                      aria-expanded={showSortMenu}
                      aria-haspopup="listbox"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 transition-all ${sortMode !== 'default' ? 'bg-navy text-white border-navy' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Severidad
                      <ChevronDown size={16} className={`transition-transform duration-300 ${showSortMenu ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                    {showSortMenu && (
                      <>
                        <div className="fixed inset-0 z-[90]" onClick={() => setShowSortMenu(false)} aria-hidden="true" />
                        <ul role="listbox" aria-label="Opciones de orden por severidad"
                          className="absolute top-full right-0 mt-2 w-36 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] overflow-hidden list-none p-0 m-0"
                        >
                          {(['desc', 'asc', 'default'] as const).map(m => (
                            <li key={m} role="option" aria-selected={sortMode === m}>
                              <button type="button"
                                onClick={() => { setSortMode(m); setShowSortMenu(false); }}
                                className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 focus-visible:outline-none focus-visible:bg-slate-100 transition-colors ${sortMode === m ? 'text-navy bg-slate-50' : 'text-slate-700'}`}
                              >
                                {m === 'desc' ? 'Descendente' : m === 'asc' ? 'Ascendente' : 'Sin orden'}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>

                {displayData.length === 0 ? (
                  <div role="status" className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-medium italic mb-6">
                    No hay observaciones todavía.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayData.map((obs, idx) => (
                      <ObservationCard key={obs.id} obs={obs} idx={idx}
                        onLocalChange={handleLocalChange} onSave={onSave}
                        onDelete={onDelete} onAction={handleActionWithStatus} tasks={tasks}
                        shouldAutoFocus={Boolean(obs.id && focusTargetId === obs.id)}
                        onAutoFocused={() => setFocusTargetId(null)}
                        saveStatus={obs.id ? rowSaveStatus[obs.id] : undefined}
                      />
                    ))}
                  </div>
                )}

                <div className="flex gap-3 flex-col">
                  <button type="button" onClick={handleAddAndFocus} disabled={!planId}
                    aria-label="Añadir nueva observación"
                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none p-4 rounded-2xl font-black text-sm uppercase tracking-widest cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed shadow-xl active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 transition-all"
                  >
                    <Plus size={20} aria-hidden="true" /> Añadir Observación
                  </button>

                  <button
                    type="button"
                    onClick={handleAIAnalysis}
                    disabled={isBlocked || data.length === 0}
                    className="inline-flex items-center justify-center gap-2 w-full bg-navy hover:bg-navy-dark text-white border-none p-4 rounded-2xl font-black text-sm uppercase tracking-widest cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed shadow-xl active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 focus-visible:ring-offset-2 transition-all"
                  >
                    {analyzeButtonLabel}
                  </button>

                  <button
                    type="button"
                    onClick={() => window.open(`/plan/${planId}/analysis-history`, '_blank')}
                    disabled={!planId}
                    className="inline-flex items-center justify-center gap-2 w-full bg-white hover:bg-slate-50 text-navy border-2 border-navy/20 p-3.5 rounded-2xl font-black text-sm uppercase tracking-widest cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed shadow-sm transition-all"
                  >
                    Ver Historial de Análisis
                  </button>

                  {error && (
                    <p className="text-red-600 font-semibold text-center">
                      {error.message}
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* Vista DESKTOP */}
            {!isMobile && (
              <section className="bg-white border border-slate-200 rounded-xl shadow-sm" aria-labelledby="obs-tabla-heading">
                <h2 id="obs-tabla-heading" className="bg-hierarchy-l1 text-white px-5 py-3 text-base font-bold uppercase tracking-wider m-0 rounded-t-xl">
                  Observaciones registradas
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <caption className="sr-only">
                      Tabla de observaciones del test de usabilidad. Haz clic en cualquier celda de texto para editarla. Usa Tab para navegar entre campos.
                    </caption>
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-[0.08em] border-b border-slate-200">
                        <th scope="col" className="p-3 text-center border-r border-slate-200 w-[40px]">
                          #
                        </th>
                        <th scope="col" className="p-3 text-left border-r border-slate-200 min-w-[100px]">
                          <Tooltip text="Código o nombre del participante en la sesión.">
                            <span className="flex items-center gap-1">
                              Participante <span aria-hidden="true">*</span>
                              <Info size={16} className="text-slate-400" aria-hidden="true" />
                            </span>
                          </Tooltip>
                        </th>
                        <th scope="col" className="p-3 text-left border-r border-slate-200 min-w-[140px]">
                          <Tooltip text="Nivel educativo o perfil del participante.">
                            <span className="flex items-center gap-1">
                              Perfil
                              <Info size={16} className="text-slate-400" aria-hidden="true" />
                            </span>
                          </Tooltip>
                        </th>
                        <th scope="col" className="p-3 text-center border-r border-slate-200 w-[140px]">
                          <Tooltip text="Tarea del plan que se evaluó en esta sesión.">
                            <span className="flex items-center justify-center gap-1">
                              Tarea <span aria-hidden="true">*</span>
                              <Info size={16} className="text-slate-400" aria-hidden="true" />
                            </span>
                          </Tooltip>
                        </th>
                        <th scope="col" className="p-3 text-center border-r border-slate-200 min-w-[155px]">
                          <Tooltip text="Si el participante completó la tarea: Sí, No, o Con ayuda del moderador.">
                            <span className="flex items-center justify-center gap-1">
                              Éxito
                              <Info size={16} className="text-slate-400" aria-hidden="true" />
                            </span>
                          </Tooltip>
                        </th>
                        <th scope="col" className="p-3 text-center border-r border-slate-200 w-[90px]">
                          <Tooltip text="Tiempo en segundos que tardó en completar o fallar la tarea.">
                            <span className="flex items-center justify-center gap-1">
                              Tiempo
                              <Info size={16} className="text-slate-400" aria-hidden="true" />
                            </span>
                          </Tooltip>
                        </th>
                        <th scope="col" className="p-3 text-center border-r border-slate-200 w-[90px]">
                          <Tooltip text="Número de errores o acciones incorrectas cometidas durante la tarea.">
                            <span className="flex items-center justify-center gap-1">
                              Errores
                              <Info size={16} className="text-slate-400" aria-hidden="true" />
                            </span>
                          </Tooltip>
                        </th>
                        <th scope="col" className="p-3 text-left border-r border-slate-200 min-w-[220px]">
                          <Tooltip text="Lo más relevante observado durante la sesión. Clic para editar.">
                            <span className="flex items-center gap-1">
                              Comentarios <span aria-hidden="true">*</span>
                              <Info size={16} className="text-slate-400" aria-hidden="true" />
                            </span>
                          </Tooltip>
                        </th>
                        <th scope="col" className="p-3 text-left border-r border-slate-200 min-w-[220px]">
                          <Tooltip text="Problema de usabilidad detectado. Obligatorio si el éxito es No. Clic para editar.">
                            <span className="flex items-center gap-1">
                              Problema
                              <Info size={16} className="text-slate-400" aria-hidden="true" />
                            </span>
                          </Tooltip>
                        </th>
                        <th scope="col" className="p-3 text-center border-r border-slate-200 min-w-[150px]">
                          <div className="flex items-center gap-1 justify-center">
                            <Tooltip text="Impacto del problema en la experiencia del usuario.">
                              <span className="flex items-center gap-1">
                                Severidad
                                <Info size={16} className="text-slate-400" aria-hidden="true" />
                              </span>
                            </Tooltip>
                            <div className="relative ml-1">
                              <button type="button"
                                onClick={() => setShowSortMenu(!showSortMenu)}
                                aria-label="Ordenar tabla por severidad"
                                aria-expanded={showSortMenu}
                                aria-haspopup="listbox"
                                className={`p-1 rounded-md hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 flex items-center transition-all ${sortMode !== 'default' ? 'text-navy bg-slate-100' : 'text-slate-400'}`}
                              >
                                <ChevronDown size={16} className={`transition-transform duration-300 ${showSortMenu ? 'rotate-180' : ''}`} aria-hidden="true" />
                              </button>
                              {showSortMenu && (
                                <>
                                  <div className="fixed inset-0 z-[90]" onClick={() => setShowSortMenu(false)} aria-hidden="true" />
                                  <ul role="listbox" aria-label="Ordenar por severidad"
                                    className="absolute top-full right-0 mt-2 w-36 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] overflow-hidden list-none p-0 m-0"
                                  >
                                    {(['desc', 'asc', 'default'] as const).map(m => (
                                      <li key={m} role="option" aria-selected={sortMode === m}>
                                        <button type="button"
                                          onClick={() => { setSortMode(m); setShowSortMenu(false); }}
                                          className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 focus-visible:outline-none focus-visible:bg-slate-100 transition-colors ${sortMode === m ? 'text-navy bg-slate-50' : 'text-slate-700'}`}
                                        >
                                          {m === 'desc' ? 'Descendente' : m === 'asc' ? 'Ascendente' : 'Sin orden'}
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="p-3 text-left border-r border-slate-200 min-w-[220px]">
                          <Tooltip text="Propuesta de mejora de diseño para el problema. Clic para editar.">
                            <span className="flex items-center gap-1">
                              Mejora propuesta
                              <Info size={16} className="text-slate-400" aria-hidden="true" />
                            </span>
                          </Tooltip>
                        </th>
                        <th scope="col" className="p-3 w-[50px]">
                          <span className="sr-only">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {displayData.length > 0 ? (
                        displayData.map((obs) => {
                          const originalIndex = data.indexOf(obs);
                          return (
                          <ObservationRow
                            key={obs.id}
                            obs={obs}
                            rowIndex={originalIndex}
                            handleLocalChange={handleLocalChange}
                            handleActionWithStatus={handleActionWithStatus}
                            onSave={onSave}
                            onDelete={onDelete}
                            tasks={tasks}
                            shouldAutoFocus={Boolean(obs.id && focusTargetId === obs.id)}
                            onAutoFocused={() => setFocusTargetId(null)}
                            saveStatus={obs.id ? rowSaveStatus[obs.id] : undefined}
                          />
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={12} className="p-12 text-center text-slate-500 italic font-medium">
                            No hay observaciones registradas. Usa el botón de abajo para comenzar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 rounded-b-xl flex gap-3 flex-col">
                  <button type="button" onClick={handleAddAndFocus} disabled={!planId}
                    aria-label="Añadir nueva observación a la tabla"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 transition-all"
                  >
                    <Plus size={20} aria-hidden="true" /> Añadir Observación
                  </button>

                  <button
                    type="button"
                    onClick={handleAIAnalysis}
                    disabled={isBlocked || data.length === 0}
                    className="inline-flex items-center justify-center gap-2 w-full bg-navy hover:bg-navy-dark text-white border-none p-4 rounded-2xl font-black text-sm uppercase tracking-widest cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed shadow-xl active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/80 focus-visible:ring-offset-2 transition-all"
                  >
                    {analyzeButtonLabel}
                  </button>

                  <button
                    type="button"
                    onClick={() => window.open(`/plan/${planId}/analysis-history`, '_blank')}
                    disabled={!planId}
                    className="inline-flex items-center justify-center gap-2 w-full bg-white hover:bg-slate-50 text-navy border-2 border-navy/20 p-3.5 rounded-2xl font-black text-sm uppercase tracking-widest cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed shadow-sm transition-all"
                  >
                    Ver Historial de Análisis
                  </button>

                  {(validationError || error) && (
                    <p className="text-red-600 font-semibold text-center text-sm">
                      {validationError || error?.message}
                    </p>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>

    </div>
  );
};