// src/models/types.ts

export type Severity = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export type Priority = 'Baja' | 'Media' | 'Alta';
export type SuccessStatus = 'Sí' | 'No' | 'Con ayuda';
export type TaskStatus = 'Pendiente' | 'En progreso' | 'Resuelto';

export interface TestTask {
  id: string;
  scenario: string;
  expectedResult: string;
  mainMetric: string;
  successCriteria: string;
}

export interface TestPlan {
  product: string;
  module: string;
  objective: string;
  userProfile: string;
  method: string;
  duration: string;
  date: string;
  location: string;
  tasks: TestTask[];
  moderator: string;
  observer: string;
  tools: string;
  link: string;
  moderatorNotes: string;
}

export interface ScriptTask {
  id: string;
  taskText: string;
  followUpQuestion: string;
  expectedSuccess: string;
}

export interface ModerationScript {
  openingSteps: string[];
  tasks: ScriptTask[];
  closingQuestions: string[];
}

export interface Observation {
  participantId: string;
  profile: string;
  taskId: string;
  success: SuccessStatus;
  timeSeconds: number;
  errorsCount: number;
  keyComments: string;
  detectedProblem: string;
  severity: Severity;
  proposedImprovement: string;
}

export interface Finding {
  problem: string;
  evidence: string;
  frequency: string; // e.g., "4/5"
  severity: Severity;
  recommendation: string;
  priority: Priority;
  status: TaskStatus;
}
