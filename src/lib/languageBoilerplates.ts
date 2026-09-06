/**
 * AlgoArena Language-Appropriate Boilerplate Generator
 * Injects structured boilerplate (standard imports, class structures,
 * fast I/O optimization, problem docstrings, and entry point wrappers)
 * across all 8 supported programming languages.
 */

export type BoilerplateStyle = 'full' | 'competitive' | 'minimal';

export interface ProblemContext {
  title?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  description?: string;
  constraints?: string[];
  examples?: Array<{ input: string; output: string; explanation?: string }>;
}

export interface LanguageBoilerplateMeta {
  id: string;
  name: string;
  version: string;
  imports: string[];
  classStructure: string;
  entryPoint: string;
  features: string[];
}

export const AUTO_BOILERPLATE_STORAGE_KEY = 'algoarena_auto_boilerplate_enabled';
export const BOILERPLATE_STYLE_STORAGE_KEY = 'algoarena_boilerplate_style_pref';

export function getAutoBoilerplatePreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem(AUTO_BOILERPLATE_STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  } catch {
    return true;
  }
}

export function setAutoBoilerplatePreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTO_BOILERPLATE_STORAGE_KEY, String(enabled));
  } catch {
    // ignore
  }
}

export function getBoilerplateStylePreference(): BoilerplateStyle {
  if (typeof window === 'undefined') return 'full';
  try {
    const saved = localStorage.getItem(BOILERPLATE_STYLE_STORAGE_KEY) as BoilerplateStyle;
    if (saved === 'full' || saved === 'competitive' || saved === 'minimal') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'full';
}

export function setBoilerplateStylePreference(style: BoilerplateStyle): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BOILERPLATE_STYLE_STORAGE_KEY, style);
  } catch {
    // ignore
  }
}

/**
 * Metadata for all 8 supported languages highlighting their standard imports and class structures
 */
export const LANGUAGE_BOILERPLATE_METAS: Record<string, LanguageBoilerplateMeta> = {
  python: {
    id: 'python',
    name: 'Python',
    version: '3.11',
    imports: [
      'from typing import List, Dict, Tuple, Optional, Set, Any',
      'from collections import defaultdict, deque, Counter',
      'import heapq',
      'import math',
      'import sys',
    ],
    classStructure: 'class Solution: def solution(self, input_data)',
    entryPoint: 'def solution(input_data) -> Solution().solution(...)',
    features: ['Typing Annotations', 'Class-based Solver', 'ListNode & TreeNode stubs', 'Standard Collections'],
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    version: 'Node 18 (ES2022)',
    imports: ['Standard ES2022 Globals (Math, Map, Set, Array)'],
    classStructure: 'class Solution { solve(input) }',
    entryPoint: 'function solution(input) -> new Solution().solve(...)',
    features: ['Class Solver', 'JSDoc Annotations', 'Data Structure Stubs', 'Functional & Imperative Ready'],
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    version: '5.4',
    imports: ['interface ListNode', 'interface TreeNode', 'Generics & Return Annotations'],
    classStructure: 'export class Solution { public solve(input: any): any }',
    entryPoint: 'export function solution(input: any): any',
    features: ['Strict Type Safety', 'Interfaces & Type Aliases', 'Class Solver Pattern', 'Explicit Signatures'],
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    version: 'C++20 (GCC 13)',
    imports: [
      '#include <iostream>',
      '#include <vector>',
      '#include <string>',
      '#include <algorithm>',
      '#include <unordered_map>',
      '#include <unordered_set>',
      '#include <queue>',
      '#include <stack>',
      '#include <cmath>',
      '#include <climits>',
    ],
    classStructure: 'class Solution { public: int solution(int input) }',
    entryPoint: 'int solution(int input) -> Solution solver',
    features: ['STL Containers Suite', 'Fast I/O (cin.tie)', 'Namespace std', 'ListNode / TreeNode definitions'],
  },
  java: {
    id: 'java',
    name: 'Java',
    version: 'OpenJDK 21',
    imports: [
      'import java.util.*;',
      'import java.io.*;',
      'import java.math.*;',
    ],
    classStructure: 'public class Solution { public static int solution(int input) }',
    entryPoint: 'Solution.solution(input)',
    features: ['java.util Collections', 'Class Structure with Overloads', 'BigInteger & Math', 'ListNode / TreeNode stubs'],
  },
  c: {
    id: 'c',
    name: 'C',
    version: 'C17 (GCC 13)',
    imports: [
      '#include <stdio.h>',
      '#include <stdlib.h>',
      '#include <string.h>',
      '#include <stdbool.h>',
      '#include <limits.h>',
      '#include <math.h>',
    ],
    classStructure: 'Direct procedural functions and memory management',
    entryPoint: 'int solution(int input)',
    features: ['Standard C Library', 'stdbool & limits', 'Pointer & Memory Safety', 'Bare-Metal Execution'],
  },
  go: {
    id: 'go',
    name: 'Go',
    version: '1.22',
    imports: ['"fmt"', '"math"', '"sort"', '"strings"'],
    classStructure: 'type Solution struct {} / func (s *Solution) Solve(input int) int',
    entryPoint: 'func solution(input int) int',
    features: ['Idiomatic Struct Receiver', 'Package main Standard Imports', 'Clean Type Signatures', 'Built-in Slices/Maps'],
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    version: '2021 Edition',
    imports: [
      'use std::collections::{HashMap, HashSet, VecDeque, BinaryHeap};',
      'use std::cmp::{max, min};',
    ],
    classStructure: 'pub struct Solution; impl Solution { pub fn solve(...) }',
    entryPoint: 'pub fn solution(input: i32) -> i32',
    features: ['Standard Collections', 'Struct & Impl Block', 'Zero-Cost Abstractions', 'Safe Memory Models'],
  },
};

/**
 * Cleanly format problem docstrings for inclusion in the boilerplate header
 */
function buildDocstring(
  lang: string,
  problem?: ProblemContext | null
): string {
  const title = problem?.title ? problem.title : 'Competitive Algorithmic Duel';
  const diff = problem?.difficulty ? problem.difficulty.toUpperCase() : 'MEDIUM';

  if (lang === 'python') {
    let doc = `"""\nAlgoArena Solution: ${title} [${diff}]\n`;
    if (problem?.constraints && problem.constraints.length > 0) {
      doc += `\nConstraints:\n` + problem.constraints.slice(0, 3).map(c => `  - ${c}`).join('\n') + `\n`;
    }
    doc += `"""\n`;
    return doc;
  }

  if (lang === 'rust') {
    return `//! AlgoArena Solution: ${title} [${diff}]\n`;
  }

  // C-family (JS, TS, C, C++, Java, Go)
  let doc = `/**\n * AlgoArena Solution: ${title} [${diff}]\n`;
  if (problem?.constraints && problem.constraints.length > 0) {
    doc += ` * Constraints:\n` + problem.constraints.slice(0, 3).map(c => ` *   - ${c}`).join('\n') + `\n`;
  }
  doc += ` */\n`;
  return doc;
}

/**
 * Generate full language-appropriate boilerplate code
 */
export function getLanguageBoilerplate(
  language: string,
  problem?: ProblemContext | null,
  style: BoilerplateStyle = 'full'
): string {
  const langKey = (language || 'javascript').toLowerCase();
  const doc = buildDocstring(langKey, problem);

  switch (langKey) {
    case 'python': {
      if (style === 'minimal') {
        return `${doc}from typing import List, Dict, Optional, Any
import sys

def solution(input_data: Any) -> Any:
    # Write your algorithmic logic here
    return input_data
`;
      }

      if (style === 'competitive') {
        return `${doc}import sys
import math
from collections import defaultdict, deque, Counter
import heapq
from typing import List, Dict, Tuple, Optional, Set, Any

# Fast I/O configuration
input = sys.stdin.read

class Solution:
    def solution(self, input_data: Any) -> Any:
        # Competitive algorithmic logic
        return input_data

def solution(input_data):
    return Solution().solution(input_data)
`;
      }

      // Default: 'full'
      return `${doc}import sys
import math
from collections import defaultdict, deque, Counter
import heapq
from typing import List, Dict, Tuple, Optional, Set, Any

# Definition for singly-linked list (uncomment if problem uses lists)
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

# Definition for a binary tree node (uncomment if problem uses trees)
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

class Solution:
    """
    Core Solution Class
    Time Complexity Target: O(...)
    Space Complexity Target: O(...)
    """
    def solution(self, input_data: Any) -> Any:
        # Write your algorithmic solution logic here
        return input_data

# AlgoArena Test Harness Entry Point
def solution(input_data):
    return Solution().solution(input_data)
`;
    }

    case 'cpp': {
      if (style === 'minimal') {
        return `${doc}#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

int solution(int input) {
    // Write your algorithmic logic here
    return input;
}
`;
      }

      if (style === 'competitive') {
        return `${doc}#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <stack>
#include <cmath>
#include <numeric>
#include <climits>

using namespace std;

#define ll long long
#define pb push_back
#define all(x) (x).begin(), (x).end()

class Solution {
public:
    int solution(int input) {
        // Fast competitive I/O
        ios_base::sync_with_stdio(false);
        cin.tie(NULL);

        return input;
    }
};

int solution(int input) {
    Solution solver;
    return solver.solution(input);
}
`;
      }

      // Default: 'full'
      return `${doc}#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <stack>
#include <cmath>
#include <numeric>
#include <climits>

using namespace std;

// Definition for singly-linked list node (uncomment if applicable)
// struct ListNode {
//     int val;
//     ListNode *next;
//     ListNode(int x) : val(x), next(nullptr) {}
// };

// Definition for a binary tree node (uncomment if applicable)
// struct TreeNode {
//     int val;
//     TreeNode *left;
//     TreeNode *right;
//     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
// };

class Solution {
public:
    int solution(int input) {
        // Fast I/O optimization
        ios_base::sync_with_stdio(false);
        cin.tie(NULL);

        // Write your algorithmic logic here
        return input;
    }
};

// AlgoArena Test Harness Entry Point
int solution(int input) {
    Solution solver;
    return solver.solution(input);
}
`;
    }

    case 'java': {
      if (style === 'minimal') {
        return `${doc}import java.util.*;

public class Solution {
    public static int solution(int input) {
        // Write your algorithmic logic here
        return input;
    }
}
`;
      }

      if (style === 'competitive') {
        return `${doc}import java.util.*;
import java.io.*;
import java.math.*;

public class Solution {
    public static int solution(int input) {
        // Fast algorithmic logic
        return input;
    }

    public static String solution(String input) {
        return input;
    }
}
`;
      }

      // Default: 'full'
      return `${doc}import java.util.*;
import java.io.*;
import java.math.*;

// Definition for singly-linked list (uncomment if applicable)
// class ListNode {
//     int val;
//     ListNode next;
//     ListNode(int x) { val = x; }
// }

// Definition for a binary tree node (uncomment if applicable)
// class TreeNode {
//     int val;
//     TreeNode left;
//     TreeNode right;
//     TreeNode(int x) { val = x; }
// }

public class Solution {
    /**
     * Solves the algorithmic challenge
     * @param input parsed test case input
     * @return solution output
     */
    public static int solution(int input) {
        // Write your algorithmic logic here
        return input;
    }

    // Overloaded variant for non-integer inputs
    public static Object solution(Object input) {
        return input;
    }
}
`;
    }

    case 'typescript': {
      if (style === 'minimal') {
        return `${doc}export function solution(input: any): any {
  // Write your algorithmic logic here
  return input;
}
`;
      }

      // Default & competitive: 'full'
      return `${doc}// Helper data structures (uncomment if applicable)
// interface ListNode { val: number; next: ListNode | null; }
// interface TreeNode { val: number; left: TreeNode | null; right: TreeNode | null; }

export class Solution {
  /**
   * Solves the algorithmic challenge
   * @param input Raw or parsed test input
   * @returns Computed result
   */
  public solve(input: any): any {
    // Write your algorithmic logic here
    return input;
  }
}

// AlgoArena Test Harness Entry Point
export function solution(input: any): any {
  const solver = new Solution();
  return solver.solve(input);
}
`;
    }

    case 'javascript': {
      if (style === 'minimal') {
        return `${doc}function solution(input) {
  // Write your algorithmic logic here
  return input;
}
`;
      }

      return `${doc}/**
 * Solution Class Architecture
 */
class Solution {
  /**
   * Execute algorithmic solver
   * @param {*} input Test input
   * @returns {*}
   */
  solve(input) {
    // Write your algorithmic logic here
    return input;
  }
}

/**
 * AlgoArena Test Harness Entry Point
 * @param {*} input
 */
function solution(input) {
  return new Solution().solve(input);
}
`;
    }

    case 'c': {
      if (style === 'minimal') {
        return `${doc}#include <stdio.h>
#include <stdlib.h>

int solution(int input) {
    // Write your algorithmic logic here
    return input;
}
`;
      }

      return `${doc}#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <limits.h>
#include <math.h>

// Definition for singly-linked list (uncomment if applicable)
// struct ListNode { int val; struct ListNode *next; };

int solution(int input) {
    // Write your algorithmic logic here
    return input;
}
`;
    }

    case 'go': {
      if (style === 'minimal') {
        return `${doc}package main

import "fmt"

func solution(input int) int {
	// Write your algorithmic logic here
	return input
}
`;
      }

      return `${doc}package main

import (
	"fmt"
	"math"
	"sort"
	"strings"
)

// Solution encapsulates algorithmic state and methods
type Solution struct{}

// Solve executes the primary algorithmic logic
func (s *Solution) Solve(input int) int {
	// Write your algorithmic logic here
	return input
}

// AlgoArena Test Harness Entry Point
func solution(input int) int {
	solver := &Solution{}
	return solver.Solve(input)
}
`;
    }

    case 'rust': {
      if (style === 'minimal') {
        return `${doc}pub fn solution(input: i32) -> i32 {
    // Write your algorithmic logic here
    input
}
`;
      }

      return `${doc}use std::collections::{HashMap, HashSet, VecDeque, BinaryHeap};
use std::cmp::{max, min};

pub struct Solution;

impl Solution {
    /// Solves the algorithmic problem
    pub fn solve(input: i32) -> i32 {
        // Write your algorithmic logic here
        input
    }
}

/// AlgoArena Test Harness Entry Point
pub fn solution(input: i32) -> i32 {
    Solution::solve(input)
}
`;
    }

    default:
      return `${doc}function solution(input) {\n  // Write your algorithmic logic here\n  return input;\n}\n`;
  }
}

/**
 * Returns true if code is either empty, untouched starter code, or matches an automatic boilerplate template
 */
export function isDefaultOrBoilerplateCode(code: string, language?: string): boolean {
  if (!code) return true;
  const trimmed = code.trim();
  if (!trimmed) return true;

  // Generic comment or 3-line starter check
  const genericStarters = [
    '// Write your algorithmic logic here',
    '# Write your algorithmic logic here',
    '// AlgoArena JavaScript Solution',
    '# AlgoArena Python 3.11 Solution',
    '// AlgoArena C++ 20 Solution',
    '// AlgoArena Java (OpenJDK 21) Solution',
    '// AlgoArena TypeScript Solution',
    '// AlgoArena C (C17 / GCC) Solution',
    '// AlgoArena Go 1.22 Solution',
    '// AlgoArena Rust 2021 Solution',
    'AlgoArena Solution Class',
    'AlgoArena Test Harness Entry Point',
  ];

  // If user only has generic starter or hasn't written logic yet:
  const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length <= 10) {
    const hasOnlyGeneric = lines.every(line => 
      line.startsWith('//') ||
      line.startsWith('#') ||
      line.startsWith('/*') ||
      line.startsWith('*') ||
      line.startsWith('*/') ||
      line.startsWith('import ') ||
      line.startsWith('from ') ||
      line.startsWith('#include') ||
      line.startsWith('package ') ||
      line.startsWith('using namespace') ||
      line.includes('return input') ||
      line.includes('return input_data') ||
      line.includes('return input;') ||
      line.includes('input') ||
      line === '}' ||
      line === '};' ||
      line.includes('function solution') ||
      line.includes('def solution') ||
      line.includes('int solution') ||
      line.includes('public class Solution') ||
      line.includes('class Solution')
    );
    if (hasOnlyGeneric) return true;
  }

  // Check if it matches any boilerplate pattern without user modifications
  const isBoilerplatePattern = genericStarters.some(starter => trimmed.includes(starter));
  const hasUserCode = !trimmed.includes('return input') && 
                      !trimmed.includes('return input_data') &&
                      !trimmed.includes('return input;') &&
                      lines.length > 12;

  return isBoilerplatePattern && !hasUserCode;
}
