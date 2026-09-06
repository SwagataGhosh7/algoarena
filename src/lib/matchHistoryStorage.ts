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
      opponentRank: '2400 ELO',
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
      optimalSolution: `// Optimal Canonical Solution (Linear O(M*N) BFS with queue boundary tracking)
function numIslands(grid: string[][]): number {
  if (!grid || grid.length === 0 || grid[0].length === 0) return 0;
  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;
        grid[r][c] = '0';
        const queue: [number, number][] = [[r, c]];
        let head = 0;
        while (head < queue.length) {
          const [cr, cc] = queue[head++];
          for (const [dr, dc] of dirs) {
            const nr = cr + dr;
            const nc = cc + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === '1') {
              grid[nr][nc] = '0';
              queue.push([nr, nc]);
            }
          }
        }
      }
    }
  }
  return count;
}`,
      opponentCode: `// AlgoArena Bot [DSA Mentor Solution]
function numIslands(grid: string[][]): number {
  if (!grid || !grid.length) return 0;
  let total = 0;
  const visit = (r: number, c: number): void => {
    if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length && grid[r][c] === '1') {
      grid[r][c] = '#'; // in-place sentinel flag
      visit(r + 1, c);
      visit(r - 1, c);
      visit(r, c + 1);
      visit(r, c - 1);
    }
  };
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      if (grid[i][j] === '1') {
        total++;
        visit(i, j);
      }
    }
  }
  return total;
}`,
    },
    {
      id: 'MT-7215',
      opponent: 'CyberRonin',
      opponentRank: '1950 ELO',
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
      optimalSolution: `# Optimal Canonical Solution: Kahn's Algorithm (O(V + E) Time & Space)
from collections import deque

def canFinish(numCourses: int, prerequisites: list[list[int]]) -> bool:
    indegree = [0] * numCourses
    graph = [[] for _ in range(numCourses)]
    
    for course, prereq in prerequisites:
        graph[prereq].append(course)
        indegree[course] += 1
        
    queue = deque([u for u in range(numCourses) if indegree[u] == 0])
    processed = 0
    
    while queue:
        curr = queue.popleft()
        processed += 1
        for neighbor in graph[curr]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)
                
    return processed == numCourses`,
      opponentCode: `# CyberRonin's DFS 3-State Cycle Detection Solution
def canFinish(numCourses: int, prerequisites: list[list[int]]) -> bool:
    graph = [[] for _ in range(numCourses)]
    for dest, src in prerequisites:
        graph[src].append(dest)
        
    # State: 0 = unvisited, 1 = visiting (in recursion stack), 2 = visited
    state = [0] * numCourses
    
    def has_cycle(u: int) -> bool:
        if state[u] == 1:
            return True
        if state[u] == 2:
            return False
        state[u] = 1
        for v in graph[u]:
            if has_cycle(v):
                return True
        state[u] = 2
        return False
        
    for i in range(numCourses):
        if state[i] == 0 and has_cycle(i):
            return False
    return True`,
    },
    {
      id: 'MT-6104',
      opponent: 'QuantumCoder',
      opponentRank: '2240 ELO',
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
      optimalSolution: `// Canonical Optimal Invert Tree (Iterative Queue-based BFS to guard call stack)
class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (!root) return nullptr;
        std::queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            TreeNode* curr = q.front();
            q.pop();
            std::swap(curr->left, curr->right);
            if (curr->left) q.push(curr->left);
            if (curr->right) q.push(curr->right);
        }
        return root;
    }
};`,
      opponentCode: `// QuantumCoder's Pointer Swapping
class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (root == nullptr) return nullptr;
        std::swap(root->left, root->right);
        invertTree(root->left);
        invertTree(root->right);
        return root;
    }
};`,
    },
    {
      id: 'MT-5531',
      opponent: 'ByteHacker',
      opponentRank: '1680 ELO',
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
      optimalSolution: `// Canonical Hash Map Solution: O(N) Time, O(N) Space
func twoSum(nums []int, target int) []int {
    m := make(map[int]int, len(nums))
    for i, x := range nums {
        if j, ok := m[target-x]; ok {
            return []int{j, i}
        }
        m[x] = i
    }
    return []int{}
}`,
      opponentCode: `// ByteHacker's Implementation
func twoSum(nums []int, target int) []int {
    indices := make(map[int]int)
    for index, val := range nums {
        diff := target - val
        if prevIndex, exists := indices[diff]; exists {
            return []int{prevIndex, index}
        }
        indices[val] = index
    }
    return []int{0, 0}
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
          opponentCode: record.opponentCode,
          optimalSolution: record.optimalSolution,
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
