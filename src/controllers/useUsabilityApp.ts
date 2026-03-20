import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TestPlan, TestTask, Observation, Finding, DashboardTab } from '../models/types';

export const useUsabilityApp = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('plan');
  const [loading, setLoading] = useState(true);
  const [allPlans, setAllPlans] = useState<TestPlan[]>([]);
  
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

  useEffect(() => {
    fetchAllPlans();
  }, []);

  const fetchAllPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('test_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      setAllPlans(data);
      await loadFullPlan(data[0]);
    } else {
      setLoading(false);
    }
  };

  const loadFullPlan = async (plan: TestPlan) => {
    setLoading(true);
    setTestPlan(plan);
    const planId = plan.id;

    const [t, o, f] = await Promise.all([
      supabase.from('tasks').select('*').eq('test_plan_id', planId).order('task_index', { ascending: true }),
      supabase.from('observations').select('*').eq('test_plan_id', planId).order('created_at', { ascending: true }),
      supabase.from('findings').select('*').eq('test_plan_id', planId).order('created_at', { ascending: true })
    ]);

    setTasks(t.data || []);
    setObservations(o.data || []);
    setFindings(f.data || []);
    setLoading(false);
  };

  const handleCreateNewPlan = () => {
    setTestPlan(initialPlanState);
    setTasks([]);
    setObservations([]);
    setFindings([]);
    setActiveTab('plan');
  };

  const handleDeletePlan = async (id: string) => {
    const { error } = await supabase.from('test_plans').delete().eq('id', id);
    if (!error) {
      const remainingPlans = allPlans.filter(p => p.id !== id);
      setAllPlans(remainingPlans);
      if (remainingPlans.length > 0) {
        await loadFullPlan(remainingPlans[0]);
      } else {
        handleCreateNewPlan();
      }
    }
  };

  const handleSavePlan = async (fullPlan: TestPlan) => {
    if (!fullPlan.id) {
      const { data, error } = await supabase.from('test_plans').insert([fullPlan]).select().single();
      if (!error && data) {
        setTestPlan(data);
        const { data: updatedPlans } = await supabase.from('test_plans').select('*').order('created_at', { ascending: false });
        if (updatedPlans) setAllPlans(updatedPlans);
      }
    } else {
      const { error } = await supabase.from('test_plans').update(fullPlan).eq('id', fullPlan.id);
      if (!error) {
        setTestPlan(fullPlan);
        setAllPlans(prev => prev.map(p => p.id === fullPlan.id ? fullPlan : p));
      }
    }
  };

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

  const handleAddObservation = async () => {
    if (!testPlan.id) return;
    const newObs = {
      test_plan_id: testPlan.id, participant: '', profile: '', task_ref: '',
      success_level: 'Sí', time_seconds: 0, errors: 0, comments: '',
      problem: '', severity: 'Baja', proposal: ''
    };
    const { data, error } = await supabase.from('observations').insert([newObs]).select().single();
    if (!error && data) setObservations(prev => [...prev, data]);
  };

  const handleSaveObservation = async (id: string, updates: Partial<Observation>) => {
    await supabase.from('observations').update(updates).eq('id', id);
    setObservations(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const handleDeleteObservation = async (id: string) => {
    await supabase.from('observations').delete().eq('id', id);
    setObservations(prev => prev.filter(o => o.id !== id));
  };

  const handleAddFinding = async () => {
    if (!testPlan.id) return;
    const newFinding = {
      test_plan_id: testPlan.id, problem: '', evidence: '', frequency: '',
      severity: 'Baja', recommendation: '', priority: 'Baja', status: 'Pendiente'
    };
    const { data, error } = await supabase.from('findings').insert([newFinding]).select().single();
    if (!error && data) setFindings(prev => [...prev, data]);
  };

  const handleSaveFinding = async (id: string, updates: Partial<Finding>) => {
    await supabase.from('findings').update(updates).eq('id', id);
    setFindings(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleDeleteFinding = async (id: string) => {
    await supabase.from('findings').delete().eq('id', id);
    setFindings(prev => prev.filter(f => f.id !== id));
  };

  return {
    activeTab, setActiveTab, loading, allPlans,
    testPlan, handleSavePlan, handleCreateNewPlan, loadFullPlan, handleDeletePlan,
    tasks, handleAddTask, handleSaveTask, handleDeleteTask,
    observations, handleAddObservation, handleSaveObservation, handleDeleteObservation,
    findings, handleAddFinding, handleSaveFinding, handleDeleteFinding
  };
};