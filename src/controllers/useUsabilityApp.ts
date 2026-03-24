import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TestPlan, TestTask, Observation, Finding, DashboardTab } from '../models/types';

export const useUsabilityApp = () => {
  const [activeTab, setActiveTabState] = useState<DashboardTab>(() => {
    const saved = localStorage.getItem('activeTab');
    return (saved as DashboardTab) || 'plan';
  });

  const setActiveTab = (tab: DashboardTab) => {
    setActiveTabState(tab);
    localStorage.setItem('activeTab', tab);
  };

  // ── Vista activa: null = dashboard global, plan = detalle de ese plan ──
  const [selectedPlan, setSelectedPlan] = useState<TestPlan | null>(null);

  const [loading, setLoading] = useState(true);
  const [allPlans, setAllPlans] = useState<TestPlan[]>([]);

  // Datos globales (todos los planes)
  const [allObservations, setAllObservations] = useState<Observation[]>([]);
  const [allFindings, setAllFindings] = useState<Finding[]>([]);

  // Datos del plan seleccionado
  const initialPlanState: TestPlan = {
    product: '', module: '', objective: '', moderator: '', observer: '',
    tools: '', link: '', moderator_notes: '',
    closing_questions: [
      { question: "¿Qué fue lo más fácil?", answer: "" },
      { question: "¿Qué fue lo más confuso?", answer: "" },
      { question: "¿Qué cambiarías primero?", answer: "" }
    ]
  };

  const [testPlan, setTestPlan] = useState<TestPlan>(initialPlanState);
  const [tasks, setTasks] = useState<TestTask[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);

  // ── Cargar datos globales (todos los planes + obs + hallazgos) ──────────
  const fetchGlobalData = useCallback(async () => {
    setLoading(true);
    const [plansRes, obsRes, findRes] = await Promise.all([
      supabase.from('test_plans').select('*').order('created_at', { ascending: false }),
      supabase.from('observations').select('*'),
      supabase.from('findings').select('*'),
    ]);

    setAllPlans(plansRes.data || []);
    setAllObservations(obsRes.data || []);
    setAllFindings(findRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  // ── Seleccionar un plan y cargar sus datos ─────────────────────────────
  const loadFullPlan = useCallback(async (plan: TestPlan, keepTab = false) => {
    setLoading(true);
    setSelectedPlan(plan);
    setTestPlan(plan);
    if (plan.id) localStorage.setItem('selectedPlanId', plan.id);
    if (!keepTab) setActiveTab('plan');

    const [t, o, f] = await Promise.all([
      supabase.from('tasks').select('*').eq('test_plan_id', plan.id).order('task_index', { ascending: true }),
      supabase.from('observations').select('*').eq('test_plan_id', plan.id).order('created_at', { ascending: true }),
      supabase.from('findings').select('*').eq('test_plan_id', plan.id).order('created_at', { ascending: true }),
    ]);

    setTasks(t.data || []);
    setObservations(o.data || []);
    setFindings(f.data || []);
    setLoading(false);
  }, []);

  // ── Restaurar sesión al cargar ─────────────────────────────────────────
  useEffect(() => {
    if (!loading && allPlans.length > 0 && !selectedPlan) {
      const savedPlanId = localStorage.getItem('selectedPlanId');
      if (savedPlanId) {
        const plan = allPlans.find(p => p.id === savedPlanId);
        if (plan) {
          loadFullPlan(plan, true);
        }
      }
    }
  }, [loading, allPlans, selectedPlan, loadFullPlan]);

  // ── Volver al dashboard global ─────────────────────────────────────────
  const handleGoHome = () => {
    setSelectedPlan(null);
    setTestPlan(initialPlanState);
    setTasks([]);
    setObservations([]);
    setFindings([]);
    localStorage.removeItem('selectedPlanId');
    localStorage.removeItem('activeTab');
  };

  // ── Crear nuevo plan ───────────────────────────────────────────────────
  const handleCreateNewPlan = () => {
    setSelectedPlan({ ...initialPlanState }); // entra al detalle con plan vacío
    setTestPlan(initialPlanState);
    setTasks([]);
    setObservations([]);
    setFindings([]);
    setActiveTab('plan');
  };

  // ── Eliminar plan ──────────────────────────────────────────────────────
  const handleDeletePlan = async (id: string) => {
    await supabase.from('test_plans').delete().eq('id', id);
    const remaining = allPlans.filter(p => p.id !== id);
    setAllPlans(remaining);
    setAllObservations(prev => prev.filter(o => o.test_plan_id !== id));
    setAllFindings(prev => prev.filter(f => f.test_plan_id !== id));
    handleGoHome();
  };

  // ── Guardar plan ───────────────────────────────────────────────────────
  const handleSavePlan = async (fullPlan: TestPlan) => {
    if (!fullPlan.id) {
      const { data, error } = await supabase.from('test_plans').insert([fullPlan]).select().single();
      if (!error && data) {
        setTestPlan(data);
        setSelectedPlan(data);
        setAllPlans(prev => [data, ...prev]);
        if (data.id) localStorage.setItem('selectedPlanId', data.id);
      }
    } else {
      const { error } = await supabase.from('test_plans').update(fullPlan).eq('id', fullPlan.id);
      if (!error) {
        setTestPlan(fullPlan);
        setSelectedPlan(fullPlan);
        setAllPlans(prev => prev.map(p => p.id === fullPlan.id ? fullPlan : p));
      }
    }
  };

  // ── Tareas ─────────────────────────────────────────────────────────────
  const handleAddTask = async () => {
    if (!testPlan.id) return;
    const newTask = {
      test_plan_id: testPlan.id,
      task_index: `T${tasks.length + 1}`,
      scenario: '', expected_result: '', main_metric: '', success_criteria: ''
    };
    const { data, error } = await supabase.from('tasks').insert([newTask]).select().single();
    if (!error && data) setTasks(prev => [...prev, data]);
  };

  const handleSaveTask = async (id: string, updates: Partial<TestTask>) => {
    await supabase.from('tasks').update(updates).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleDeleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // ── Observaciones ──────────────────────────────────────────────────────
  const handleAddObservation = async () => {
    if (!testPlan.id) return;
    const newObs = {
      test_plan_id: testPlan.id, participant: '', profile: '', task_ref: '',
      success_level: 'Sí', time_seconds: 0, errors: 0, comments: '',
      problem: '', severity: 'Baja', proposal: ''
    };
    const { data, error } = await supabase.from('observations').insert([newObs]).select().single();
    if (!error && data) {
      setObservations(prev => [...prev, data]);
      setAllObservations(prev => [...prev, data]);
    }
  };

  const handleSaveObservation = async (id: string, updates: Partial<Observation>) => {
    await supabase.from('observations').update(updates).eq('id', id);
    setObservations(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    setAllObservations(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const handleDeleteObservation = async (id: string) => {
    await supabase.from('observations').delete().eq('id', id);
    setObservations(prev => prev.filter(o => o.id !== id));
    setAllObservations(prev => prev.filter(o => o.id !== id));
  };

  // ── Hallazgos ──────────────────────────────────────────────────────────
  const handleAddFinding = async () => {
    if (!testPlan.id) return;
    const newFinding = {
      test_plan_id: testPlan.id, problem: '', evidence: '', frequency: '',
      severity: 'Baja', recommendation: '', priority: 'Baja', status: 'Pendiente'
    };
    const { data, error } = await supabase.from('findings').insert([newFinding]).select().single();
    if (!error && data) {
      setFindings(prev => [...prev, data]);
      setAllFindings(prev => [...prev, data]);
    }
  };

  const handleSaveFinding = async (id: string, updates: Partial<Finding>) => {
    await supabase.from('findings').update(updates).eq('id', id);
    setFindings(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    setAllFindings(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleDeleteFinding = async (id: string) => {
    await supabase.from('findings').delete().eq('id', id);
    setFindings(prev => prev.filter(f => f.id !== id));
    setAllFindings(prev => prev.filter(f => f.id !== id));
  };

  return {
    // navegación
    activeTab, setActiveTab,
    selectedPlan,             // null = mostrar dashboard global
    handleGoHome,
    // estado de carga
    loading,
    // datos globales
    allPlans, allObservations, allFindings,
    // datos del plan seleccionado
    testPlan, handleSavePlan, handleCreateNewPlan, loadFullPlan, handleDeletePlan,
    tasks, handleAddTask, handleSaveTask, handleDeleteTask,
    observations, handleAddObservation, handleSaveObservation, handleDeleteObservation,
    findings, handleAddFinding, handleSaveFinding, handleDeleteFinding,
  };
};