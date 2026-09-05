export interface Problem {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  hiddenTestCases: {
    input: string;
    expectedOutput: string;
  }[];
}

export interface User {
  id: string;
  name: string;
  ready: boolean;
  progress: number; // percentage or number of tests passed
}

export interface RoomState {
  id: string;
  users: Record<string, User>;
  status: 'waiting' | 'active' | 'finished';
  problem: Problem | null;
  winner?: string;
}

export interface ChatMessage {
  user?: string;
  system?: boolean;
  text: string;
}

export interface EvaluationResult {
  allPassed: boolean;
  feedback: string;
  testResults: {
    passed: boolean;
    input: string;
    expected: string;
    actual: string;
  }[];
}
