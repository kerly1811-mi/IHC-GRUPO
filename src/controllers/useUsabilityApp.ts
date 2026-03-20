// src/controllers/useUsabilityApp.ts
import { useState } from 'react';
import { TestPlan, ModerationScript, Observation, Finding, TestTask } from '../models/types';

export type DashboardTab = 'plan' | 'script' | 'observations' | 'findings';

export const useUsabilityApp = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('plan');

  const [testPlan, setTestPlan] = useState<TestPlan>({
    product: '', module: '', objective: '', userProfile: '',
    method: '', duration: '', date: '', location: '',
    tasks: [{ id: 'T1', scenario: '', expectedResult: '', mainMetric: '', successCriteria: '' }],
    moderator: '', observer: '', tools: '', link: '', moderatorNotes: ''
  });

  const [script, setScript] = useState<ModerationScript>({
    openingSteps: [
      'Agradece la participación.',
      'Explica que se evalúa la interfaz, no a la persona.',
      'Pide que pense en voz alta.',
      'Lee una tarea a la vez.',
      'Evita ayudar salvo bloqueo total.'
    ],
    tasks: [{ id: 'T1', taskText: 'Imagina que quieres revisar tu nota...', followUpQuestion: '¿Qué esperabas encontrar?', expectedSuccess: 'Encuentra la nota sin ayuda' }],
    closingQuestions: ['¿Qué fue lo más fácil?', '¿Qué fue lo más confuso?', '¿Qué cambiarías primero?']
  });

  const [observations, setObservations] = useState<Observation[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);

  const handleUpdatePlan = (updates: Partial<TestPlan>) => {
    setTestPlan(prev => ({ ...prev, ...updates }));
  };

  const handleUpdateTask = (id: string, updates: Partial<TestTask>) => {
    setTestPlan(prev => {
      const newTasks = prev.tasks.map(t => 
        t.id === id ? { ...t, ...updates } : t
      );
      return { ...prev, tasks: newTasks };
    });
  };

  const handleAddTask = () => {
    setTestPlan(prev => {
      const newId = `T${prev.tasks.length + 1}`;
      const newTask: TestTask = { 
        id: newId, 
        scenario: '', 
        expectedResult: '', 
        mainMetric: '', 
        successCriteria: '' 
      };
      return { ...prev, tasks: [...prev.tasks, newTask] };
    });
  };

  const handleDeleteTask = (id: string) => {
    setTestPlan(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id)
    }));
  };

  const handleAddObservation = (observation: Observation) => {
    setObservations(prev => [...prev, observation]);
  };

  const handleAddFinding = (finding: Finding) => {
    setFindings(prev => [...prev, finding]);
  };

  return {
    activeTab,
    setActiveTab,
    testPlan,
    handleUpdatePlan,
    handleUpdateTask,
    handleAddTask,
    handleDeleteTask,
    script,
    observations,
    handleAddObservation,
    findings,
    handleAddFinding
  };
};
