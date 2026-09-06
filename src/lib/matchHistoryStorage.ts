import { MatchRecord } from '../types';
import { apiUrl } from '../api';

const MATCH_STORAGE_PREFIX = 'algoarena_matches_';

/**
 * Format relative time (e.g., 'Just now', '5m ago', '2h ago', '3d ago')
 */
export function formatRelativeTime(dateInput: string | Date | number): string {
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return 'Recently';

    const now = Date.now();
    const diffMs = Math.max(0, now - d.getTime());
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 45) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

/**
 * Format full date & time string
 */
export function formatFullTimestamp(dateInput?: string | Date | number): string {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return new Date().toLocaleString();
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return new Date().toLocaleTimeString();
  }
}

/**
 * Get sample benchmark duel records for immediate inspection or initial profile state
 */
export function getSampleBenchmarkMatches(operatorName = 'Operator'): MatchRecord[] {
  const now = Date.now();
  return [
    {
      id: 'MT-8942',
      opponent: 'AlgoArena Bot [Mentor]',
      opponentRank: 'Grandmaster II',
      outcome: 'Victory',
      problem: 'Dynamic Island Count & Matrix Traversal',
      difficulty: 'Medium',
      duration: '09m 24s',
      language: 'TypeScript',
      eloChange: 28,
      testScore: '5/5 (100%)',
      date: 'Today',
      timestamp: '14:20:00',
      completedAt: new Date(now - 1000 * 60 * 45).toISOString(),
      code: `function numIslands(grid: string[][]): number {
  if (!grid || grid.length === 0) return 0;
  const rows = grid.length;
  const cols = grid[0].length;
  let islands = 0;

  function dfs(r: number, c: number) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === '0') return;
    grid[r][c] = '0'; // mark visited
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        islands++;
        dfs(r, c);
      }
    }
  }
  return islands;
}`,
    },
    {
      id: 'MT-7215',
      opponent: 'CyberRonin',
      opponentRank: 'Diamond I',
      outcome: 'Victory',
      problem: 'Topological Task Graph Scheduling',
      difficulty: 'Hard',
      duration: '14m 12s',
      language: 'Python',
      eloChange: 36,
      testScore: '5/5 (100%)',
      date: 'Yesterday',
      timestamp: '18:45:00',
      completedAt: new Date(now - 1000 * 60 * 60 * 22).toISOString(),
      code: `def canFinish(numCourses: int, prerequisites: list[list[int]]) -> bool:
    from collections import deque
    in_degree = [0] * numCourses
    adj = [[] for _ in range(numCourses)]
    
    for dest, src in prerequisites:
        adj[src].append(dest)
        in_degree[dest] += 1
        
    queue = deque([i for i in range(numCourses) if in_degree[i] == 0])
    completed = 0
    
    while queue:
        node = queue.popleft()
        completed += 1
        for neighbor in adj[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
                
    return completed == numCourses`,
    },
    {
      id: 'MT-6104',
      opponent: 'QuantumCoder',
      opponentRank: 'Master II',
      outcome: 'Defeat',
      problem: 'Invert Binary Subtree Matrix',
      difficulty: 'Medium',
      duration: '11m 05s',
      language: 'C++',
      eloChange: -18,
      testScore: '3/5 (60%)',
      date: '2d ago',
      timestamp: '11:10:00',
      completedAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
      code: `class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (!root) return nullptr;
        TreeNode* temp = root->left;
        root->left = invertTree(root->right);
        root->right = invertTree(temp);
        return root;
    }
};`,
    },
    {
      id: 'MT-5531',
      opponent: 'ByteHacker',
      opponentRank: 'Platinum I',
      outcome: 'Victory',
      problem: 'Two Sum Target Complement Hash',
      difficulty: 'Easy',
      duration: '04m 18s',
      language: 'Go',
      eloChange: 20,
      testScore: '5/5 (100%)',
      date: '3d ago',
      timestamp: '09:15:00',
      completedAt: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
      code: `func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if idx, found := seen[complement]; found {
            return []int{idx, i}
        }
        seen[num] = i
    }
    return nil
}`,
    }
  ];
}

/**
 * Get locally stored matches for a username
 */
export function getLocalMatches(username: string): MatchRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = `${MATCH_STORAGE_PREFIX}${username.trim().toLowerCase()}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to read local match history', err);
    return [];
  }
}

/**
 * Record a completed arena match session locally and sync to server
 */
export async function recordCompletedMatch(
  username: string,
  matchData: Omit<MatchRecord, 'id' | 'date' | 'timestamp'> & {
    id?: string;
    date?: string;
    timestamp?: string;
    completedAt?: string;
  }
): Promise<MatchRecord> {
  const now = new Date();
  const completedAt = matchData.completedAt || now.toISOString();
  const id = matchData.id || `MT-${Math.floor(1000 + Math.random() * 9000)}`;
  const date = matchData.date || now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timestamp = matchData.timestamp || now.toLocaleTimeString('en-US', { hour12: false });

  const record: MatchRecord = {
    ...matchData,
    id,
    date,
    timestamp,
    completedAt,
  };

  // 1. Save to local storage
  if (typeof window !== 'undefined') {
    try {
      const key = `${MATCH_STORAGE_PREFIX}${username.trim().toLowerCase()}`;
      const existing = getLocalMatches(username);
      // Avoid duplicate by ID
      const filtered = existing.filter(m => m.id !== record.id);
      const updated = [record, ...filtered].slice(0, 50);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save match to localStorage', err);
    }
  }

  // 2. Sync to server backend
  try {
    await fetch(apiUrl('/api/user-match'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        match: {
          opponent: record.opponent,
          opponentRank: record.opponentRank,
          outcome: record.outcome,
          problem: record.problem,
          difficulty: record.difficulty,
          duration: record.duration,
          language: record.language,
          passedCount: parseInt(record.testScore?.split('/')[0] || '5', 10),
          totalTests: parseInt(record.testScore?.split('/')[1] || '5', 10),
          code: (record as any).code,
          playback: record.playback,
          review: record.review,
        },
      }),
    });
  } catch (err) {
    console.warn('Background sync to /api/user-match failed (using local store):', err);
  }

  return record;
}
