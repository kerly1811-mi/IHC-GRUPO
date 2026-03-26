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
    product: '', module: '', objective: '', 
    user_profile: '', method: '', duration: '', test_date: '', location_channel: '',
    moderator: '', observer: '',
    tools: '', link: '', moderator_notes: '',
    closing_questions: [
      { question: "¿Qué fue lo más fácil?", answer: "" },
      { question: "¿Qué fue lo más confuso?", answer: "" },
      { question: "¿Qué cambiarías primero?", answer: "" }
    ]
  };

  const [testPlan, setTestPlanState] = useState<TestPlan>(initialPlanState);
  const [tasks, setTasksState] = useState<TestTask[]>([]);
  const [observations, setObservationsState] = useState<Observation[]>([]);
  const [findings, setFindingsState] = useState<Finding[]>([]);

  // Estado para rastrear cambios sin guardar en la DB
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const setTestPlan = (val: TestPlan) => {
    setTestPlanState(val);
    setHasUnsavedChanges(true);
  };
  const setTasks = (val: TestTask[]) => {
    setTasksState(val);
    setHasUnsavedChanges(true);
  };
  const setObservations = (val: Observation[]) => {
    setObservationsState(val);
    setHasUnsavedChanges(true);
  };
  const setFindings = (val: Finding[]) => {
    setFindingsState(val);
    setHasUnsavedChanges(true);
  };

  // ── Inicialización Unificada (Optimización de Carga) ───────────────────
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const savedPlanId = localStorage.getItem('selectedPlanId');
        
        // Peticiones paralelas de datos iniciales
        const fetchPromises: any[] = [
          supabase.from('test_plans').select('*').order('created_at', { ascending: false }),
        ];

        // Si hay un plan guardado, lo cargamos todo en paralelo con el listado inicial
        if (savedPlanId) {
          fetchPromises.push(supabase.from('tasks').select('*').eq('test_plan_id', savedPlanId).order('task_index', { ascending: true }));
          fetchPromises.push(supabase.from('observations').select('*').eq('test_plan_id', savedPlanId).order('created_at', { ascending: true }));
          fetchPromises.push(supabase.from('findings').select('*').eq('test_plan_id', savedPlanId).order('created_at', { ascending: true }));
        }

        const results = await Promise.all(fetchPromises);
        
        const plans: TestPlan[] = (results[0].data as TestPlan[]) || [];
        setAllPlans(plans);

        if (savedPlanId && results.length > 1) {
          const plan = plans.find(p => p.id === savedPlanId);
          if (plan) {
            setSelectedPlan(plan);
            setTestPlanState(plan);
            setTasksState(results[1].data || []);
            setObservationsState(results[2].data || []);
            setFindingsState(results[3].data || []);
          }
        }

        // Cargar datos globales para el dashboard en segundo plano para no bloquear el inicio
        // Esto permite que el dashboard aparezca rápido aunque los gráficos tarden un pelín más
        const [obsRes, findRes] = await Promise.all([
          supabase.from('observations').select('*'),
          supabase.from('findings').select('*'),
        ]);

        setAllObservations(obsRes.data || []);
        setAllFindings(findRes.data || []);
        
        // Asegurar que no hay cambios marcados al iniciar
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Error durante la inicialización:", error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // ── Seleccionar un plan y cargar sus datos (para navegación manual) ────
  const loadFullPlan = useCallback(async (plan: TestPlan, keepTab = false) => {
    setLoading(true);
    try {
      setSelectedPlan(plan);
      setTestPlanState(plan);
      if (plan.id) localStorage.setItem('selectedPlanId', plan.id);
      if (!keepTab) setActiveTab('plan');

      const [t, o, f] = await Promise.all([
        supabase.from('tasks').select('*').eq('test_plan_id', plan.id).order('task_index', { ascending: true }),
        supabase.from('observations').select('*').eq('test_plan_id', plan.id).order('created_at', { ascending: true }),
        supabase.from('findings').select('*').eq('test_plan_id', plan.id).order('created_at', { ascending: true }),
      ]);

      setTasksState(t.data || []);
      setObservationsState(o.data || []);
      setFindingsState(f.data || []);
      
      // Limpiar flag al cargar plan
      setHasUnsavedChanges(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Volver al dashboard global ─────────────────────────────────────────
  const handleGoHome = () => {
    setSelectedPlan(null);
    setTestPlan(initialPlanState);
    setTasks([]);
    setObservations([]);
    setFindings([]);
    localStorage.removeItem('selectedPlanId');
    localStorage.removeItem('activeTab');
    
    // Limpiar flag al volver al home
    setHasUnsavedChanges(false);
  };

  // ── Crear nuevo plan ───────────────────────────────────────────────────
  const handleCreateNewPlan = () => {
    setSelectedPlan({ ...initialPlanState }); // entra al detalle con plan vacío
    setTestPlan(initialPlanState);
    setTasks([]);
    setObservations([]);
    setFindings([]);
    setActiveTab('plan');
    
    // Limpiar flag para nuevo plan
    setHasUnsavedChanges(false);
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
        setTestPlanState(data);
        setSelectedPlan(data);
        setAllPlans(prev => [data, ...prev]);
        if (data.id) localStorage.setItem('selectedPlanId', data.id);
        setHasUnsavedChanges(false);
      }
    } else {
      const { error } = await supabase.from('test_plans').update(fullPlan).eq('id', fullPlan.id);
      if (!error) {
        setTestPlanState(fullPlan);
        setSelectedPlan(fullPlan);
        setAllPlans(prev => prev.map(p => p.id === fullPlan.id ? fullPlan : p));
        setHasUnsavedChanges(false);
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
    if (!error && data) {
      setTasksState(prev => [...prev, data]);
      setHasUnsavedChanges(false);
    }
  };

  const handleSaveTask = async (id: string, updates: Partial<TestTask>) => {
    await supabase.from('tasks').update(updates).eq('id', id);
    setTasksState(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    setHasUnsavedChanges(false);
  };

  const handleDeleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    setTasksState(prev => prev.filter(t => t.id !== id));
    setHasUnsavedChanges(false);
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
      setObservationsState(prev => [...prev, data]);
      setAllObservations(prev => [...prev, data]);
      setHasUnsavedChanges(false);
    }
  };

  const handleSaveObservation = async (id: string, updates: Partial<Observation>) => {
    await supabase.from('observations').update(updates).eq('id', id);
    setObservationsState(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    setAllObservations(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    setHasUnsavedChanges(false);
  };

  const handleDeleteObservation = async (id: string) => {
    await supabase.from('observations').delete().eq('id', id);
    setObservationsState(prev => prev.filter(o => o.id !== id));
    setAllObservations(prev => prev.filter(o => o.id !== id));
    setHasUnsavedChanges(false);
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
      setFindingsState(prev => [...prev, data]);
      setAllFindings(prev => [...prev, data]);
      setHasUnsavedChanges(false);
    }
  };

  const handleSaveFinding = async (id: string, updates: Partial<Finding>) => {
    await supabase.from('findings').update(updates).eq('id', id);
    setFindingsState(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    setAllFindings(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    setHasUnsavedChanges(false);
  };

  const handleDeleteFinding = async (id: string) => {
    await supabase.from('findings').delete().eq('id', id);
    setFindingsState(prev => prev.filter(f => f.id !== id));
    setAllFindings(prev => prev.filter(f => f.id !== id));
    setHasUnsavedChanges(false);
  };

  return {
    // navegación
    activeTab, setActiveTab,
    selectedPlan,             // null = mostrar dashboard global
    handleGoHome,
    hasUnsavedChanges,        // nuevo: indica si hay cambios sin persistir
    // estado de carga
    loading,
    // datos globales
    allPlans, allObservations, allFindings,
    // datos del plan seleccionado
    testPlan, setTestPlan, handleSavePlan, handleCreateNewPlan, loadFullPlan, handleDeletePlan,
    tasks, setTasks, handleAddTask, handleSaveTask, handleDeleteTask,
    observations, setObservations, handleAddObservation, handleSaveObservation, handleDeleteObservation,
    findings, setFindings, handleAddFinding, handleSaveFinding, handleDeleteFinding,
  };
};