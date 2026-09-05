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
  isAi?: boolean;
}

export interface RoomState {
  id: string;
  users: Record<string, User>;
  status: 'waiting' | 'active' | 'finished';
  problem: Problem | null;
  winner?: string;
  startTime?: number;
  mode?: 'duel' | 'practice';
  topic?: string;
}

export interface ChatMessage {
  user?: string;
  system?: boolean;
  isHint?: boolean;
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

export interface CompetencyTopic {
  subject: string;
  score: number;
  fullMark: number;
  tier: string;
  solvedCount: number;
  winRate: number;
}

export interface CodeSnapshotFrame {
  timestampMs: number;
  timeDisplay: string;
  code: string;
  activeLine: number;
  totalLines: number;
  wpm: number;
  cpm: number;
  action: 'insert' | 'delete' | 'milestone' | 'test_run' | 'final';
  milestoneDescription?: string;
  testsPassed?: number;
  totalTests?: number;
}

export interface CodePlaybackData {
  matchId: string;
  problemTitle: string;
  language: string;
  durationSeconds: number;
  initialCode: string;
  finalCode: string;
  totalKeystrokes: number;
  averageWpm: number;
  peakWpm: number;
  cyclomaticComplexity: number;
  memoryEstimateKb: number;
  timeComplexityNotation: string;
  efficiencyScore: number;
  frames: CodeSnapshotFrame[];
  milestones: {
    timestampMs: number;
    timeDisplay: string;
    title: string;
    description: string;
    type: 'setup' | 'algorithm' | 'optimization' | 'test' | 'complete';
  }[];
}

export interface MatchRecord {
  id: string;
  opponent: string;
  opponentRank: string;
  opponentAvatar?: string;
  outcome: 'Victory' | 'Defeat';
  problem: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration: string;
  language: string;
  eloChange: number;
  testScore: string;
  date: string;
  timestamp: string;
  playback?: CodePlaybackData;
}

export interface UserProfileData {
  uid?: string;
  name?: string;
  username: string;
  email?: string;
  nationality?: string;
  region?: string;
  photoURL?: string;
  friends?: string[];
  incomingFriendRequests?: string[];
  outgoingFriendRequests?: string[];
  elo: number;
  rankTitle: string;
  peakElo: number;
  wins: number;
  losses: number;
  streak: number;
  testAccuracy: number;
  totalDuels: number;
  preferredLanguages: { language: string; percentage: number; color: string }[];
  honors: string[];
  competencies: CompetencyTopic[];
  matches: MatchRecord[];
  aiAssessment?: {
    tacticalCritique: string;
    focusRecommendation: string;
    lastAudited: string;
  };
}

export interface LeaderboardUser {
  rank: number;
  username: string;
  name?: string;
  nationality?: string;
  region?: string;
  photoURL?: string;
  elo: number;
  rankTitle: string;
  wins: number;
  losses: number;
  winRate: number;
  streak: number;
  testAccuracy: number;
  primaryLanguage: string;
  recentDelta: string;
  status: 'IN DUEL' | 'ONLINE' | 'IDLE';
  isCurrentUser?: boolean;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardUser[];
  meta: {
    totalRanked: number;
    scope?: 'global' | 'friends';
    minimumGames?: number;
    currentUserGames?: number;
    isEligible?: boolean;
    friendCount?: number;
    season: string;
    seasonEndsIn: string;
    currentUserStats?: LeaderboardUser;
    lastUpdated: string;
    tierThresholds: {
      grandmaster: number;
      master: number;
      diamond: number;
      gold: number;
      silver: number;
    };
  };
}
