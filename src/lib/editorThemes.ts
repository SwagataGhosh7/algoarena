// Monaco Editor Theme Definitions and Registration for AlgoArena

export interface EditorThemeOption {
  id: string;
  name: string;
  badge?: string;
  bg: string;
  accent: string;
  swatch: string[];
}

export const EDITOR_THEMES: EditorThemeOption[] = [
  {
    id: 'monokai',
    name: 'Monokai',
    badge: 'Popular',
    bg: '#272822',
    accent: '#A6E22E',
    swatch: ['#272822', '#F92672', '#A6E22E', '#66D9EF', '#E6DB74'],
  },
  {
    id: 'solarized',
    name: 'Solarized Dark',
    badge: 'Solarized',
    bg: '#002B36',
    accent: '#2AA198',
    swatch: ['#002B36', '#2AA198', '#859900', '#268BD2', '#B58900'],
  },
  {
    id: 'nord',
    name: 'Nord',
    badge: 'Arctic',
    bg: '#2E3440',
    accent: '#88C0D0',
    swatch: ['#2E3440', '#88C0D0', '#81A1C1', '#A3BE8C', '#B48EAD'],
  },
  {
    id: 'dracula',
    name: 'Dracula',
    badge: 'Popular',
    bg: '#282A36',
    accent: '#BD93F9',
    swatch: ['#282A36', '#BD93F9', '#FF79C6', '#50FA7B', '#8BE9FD'],
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    badge: 'Clean',
    bg: '#0D1117',
    accent: '#58A6FF',
    swatch: ['#0D1117', '#58A6FF', '#7EE787', '#FF7B72', '#D2A8FF'],
  },
  {
    id: 'algoarena-cyber',
    name: 'AlgoArena Cyber',
    badge: 'Matrix',
    bg: '#080808',
    accent: '#00FF00',
    swatch: ['#080808', '#00FF00', '#00E5FF', '#FF007F', '#FFE600'],
  },
  {
    id: 'vs-dark',
    name: 'VS Dark',
    badge: 'Default',
    bg: '#1E1E1E',
    accent: '#569CD6',
    swatch: ['#1E1E1E', '#569CD6', '#4EC9B0', '#CE9178', '#DCDCAA'],
  },
];

export const THEME_STORAGE_KEY = 'algoarena_editor_theme';

export function getStoredTheme(): string {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) {
      if (saved === 'solarized-dark') return 'solarized';
      if (EDITOR_THEMES.some(t => t.id === saved)) {
        return saved;
      }
    }
  } catch (e) {
    // Ignore storage errors
  }
  return 'monokai'; // Default to Monokai as requested
}

export function saveStoredTheme(themeId: string): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Registers custom syntax highlighting themes with the Monaco editor instance
 */
export function registerMonacoThemes(monaco: any): void {
  if (!monaco || !monaco.editor) return;

  // 1. Monokai Theme
  monaco.editor.defineTheme('monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'F8F8F2', background: '272822' },
      { token: 'comment', foreground: '75715E', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'F92672', fontStyle: 'bold' },
      { token: 'keyword.control', foreground: 'F92672' },
      { token: 'operator', foreground: 'F92672' },
      { token: 'string', foreground: 'E6DB74' },
      { token: 'string.escape', foreground: 'AE81FF' },
      { token: 'number', foreground: 'AE81FF' },
      { token: 'regexp', foreground: 'E6DB74' },
      { token: 'type', foreground: '66D9EF', fontStyle: 'italic' },
      { token: 'class', foreground: 'A6E22E' },
      { token: 'function', foreground: 'A6E22E' },
      { token: 'variable', foreground: 'F8F8F2' },
      { token: 'variable.predefined', foreground: 'AE81FF' },
      { token: 'variable.parameter', foreground: 'FD971F', fontStyle: 'italic' },
      { token: 'constant', foreground: 'AE81FF' },
      { token: 'delimiter', foreground: 'F8F8F2' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#F8F8F2',
      'editorCursor.foreground': '#F8F8F0',
      'editor.lineHighlightBackground': '#3E3D3280',
      'editorLineNumber.foreground': '#90908A',
      'editorLineNumber.activeForeground': '#C2C2BF',
      'editor.selectionBackground': '#49483E',
      'editor.inactiveSelectionBackground': '#49483E60',
      'editorIndentGuide.background': '#464741',
      'editorIndentGuide.activeBackground': '#767771',
      'editorGutter.background': '#272822',
      'editorOverviewRuler.border': '#272822',
    },
  });

  // 2. Solarized Dark Theme (Ethan Schoonover palette)
  const solarizedTheme = {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: '839496', background: '002B36' },
      { token: 'comment', foreground: '586E75', fontStyle: 'italic' },
      { token: 'keyword', foreground: '859900', fontStyle: 'bold' },
      { token: 'keyword.control', foreground: '859900' },
      { token: 'operator', foreground: '719E07' },
      { token: 'string', foreground: '2AA198' },
      { token: 'string.escape', foreground: 'DC322F' },
      { token: 'number', foreground: 'D33682' },
      { token: 'regexp', foreground: 'DC322F' },
      { token: 'type', foreground: 'B58900', fontStyle: 'italic' },
      { token: 'class', foreground: 'B58900' },
      { token: 'function', foreground: '268BD2' },
      { token: 'variable', foreground: '839496' },
      { token: 'variable.predefined', foreground: 'B58900' },
      { token: 'variable.parameter', foreground: 'CB4B16', fontStyle: 'italic' },
      { token: 'constant', foreground: 'CB4B16' },
      { token: 'delimiter', foreground: '93A1A1' },
    ],
    colors: {
      'editor.background': '#002B36',
      'editor.foreground': '#839496',
      'editorCursor.foreground': '#839496',
      'editor.lineHighlightBackground': '#07364270',
      'editorLineNumber.foreground': '#586E75',
      'editorLineNumber.activeForeground': '#93A1A1',
      'editor.selectionBackground': '#073642',
      'editor.inactiveSelectionBackground': '#07364290',
      'editorIndentGuide.background': '#073642',
      'editorIndentGuide.activeBackground': '#586E75',
      'editorGutter.background': '#002B36',
      'editorOverviewRuler.border': '#002B36',
    },
  };
  monaco.editor.defineTheme('solarized', solarizedTheme);
  monaco.editor.defineTheme('solarized-dark', solarizedTheme);

  // 3. Nord Theme (Arctic blue/frost palette)
  monaco.editor.defineTheme('nord', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'D8DEE9', background: '2E3440' },
      { token: 'comment', foreground: '616E88', fontStyle: 'italic' },
      { token: 'keyword', foreground: '81A1C1', fontStyle: 'bold' },
      { token: 'keyword.control', foreground: '81A1C1' },
      { token: 'operator', foreground: '81A1C1' },
      { token: 'string', foreground: 'A3BE8C' },
      { token: 'string.escape', foreground: 'EBCB8B' },
      { token: 'number', foreground: 'B48EAD' },
      { token: 'regexp', foreground: 'EBCB8B' },
      { token: 'type', foreground: '8FBCBB', fontStyle: 'italic' },
      { token: 'class', foreground: '8FBCBB' },
      { token: 'function', foreground: '88C0D0' },
      { token: 'variable', foreground: 'D8DEE9' },
      { token: 'variable.predefined', foreground: '81A1C1' },
      { token: 'variable.parameter', foreground: 'E5E9F0', fontStyle: 'italic' },
      { token: 'constant', foreground: 'D08770' },
      { token: 'delimiter', foreground: 'ECEFF4' },
    ],
    colors: {
      'editor.background': '#2E3440',
      'editor.foreground': '#D8DEE9',
      'editorCursor.foreground': '#88C0D0',
      'editor.lineHighlightBackground': '#3B425260',
      'editorLineNumber.foreground': '#4C566A',
      'editorLineNumber.activeForeground': '#D8DEE9',
      'editor.selectionBackground': '#434C5E',
      'editor.inactiveSelectionBackground': '#434C5E80',
      'editorIndentGuide.background': '#3B4252',
      'editorIndentGuide.activeBackground': '#4C566A',
      'editorGutter.background': '#2E3440',
      'editorOverviewRuler.border': '#2E3440',
    },
  });

  // 2. Dracula Theme (Dracular)
  monaco.editor.defineTheme('dracula', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'F8F8F2', background: '282A36' },
      { token: 'comment', foreground: '6272A4', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'FF79C6', fontStyle: 'bold' },
      { token: 'keyword.control', foreground: 'FF79C6' },
      { token: 'operator', foreground: 'FF79C6' },
      { token: 'string', foreground: 'F1FA8C' },
      { token: 'number', foreground: 'BD93F9' },
      { token: 'regexp', foreground: 'FFB86C' },
      { token: 'type', foreground: '8BE9FD', fontStyle: 'italic' },
      { token: 'class', foreground: '50FA7B' },
      { token: 'function', foreground: '50FA7B' },
      { token: 'variable', foreground: 'F8F8F2' },
      { token: 'variable.parameter', foreground: 'FFB86C', fontStyle: 'italic' },
      { token: 'constant', foreground: 'BD93F9' },
      { token: 'delimiter', foreground: 'F8F8F2' },
    ],
    colors: {
      'editor.background': '#282A36',
      'editor.foreground': '#F8F8F2',
      'editorCursor.foreground': '#AEAFAD',
      'editor.lineHighlightBackground': '#44475A70',
      'editorLineNumber.foreground': '#6272A4',
      'editorLineNumber.activeForeground': '#F8F8F2',
      'editor.selectionBackground': '#44475A',
      'editor.inactiveSelectionBackground': '#44475A60',
      'editorIndentGuide.background': '#424450',
      'editorIndentGuide.activeBackground': '#6272A4',
      'editorGutter.background': '#282A36',
    },
  });

  // 3. GitHub Dark Theme
  monaco.editor.defineTheme('github-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'C9D1D9', background: '0D1117' },
      { token: 'comment', foreground: '8B949E', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'FF7B72', fontStyle: 'bold' },
      { token: 'keyword.control', foreground: 'FF7B72' },
      { token: 'operator', foreground: '79C0FF' },
      { token: 'string', foreground: 'A5D6FF' },
      { token: 'number', foreground: '79C0FF' },
      { token: 'regexp', foreground: '7EE787' },
      { token: 'type', foreground: 'FFA657' },
      { token: 'class', foreground: 'FFA657' },
      { token: 'function', foreground: 'D2A8FF' },
      { token: 'variable', foreground: 'C9D1D9' },
      { token: 'variable.parameter', foreground: 'FFA657' },
      { token: 'constant', foreground: '79C0FF' },
      { token: 'delimiter', foreground: 'C9D1D9' },
    ],
    colors: {
      'editor.background': '#0D1117',
      'editor.foreground': '#C9D1D9',
      'editorCursor.foreground': '#58A6FF',
      'editor.lineHighlightBackground': '#161B22',
      'editorLineNumber.foreground': '#484F58',
      'editorLineNumber.activeForeground': '#C9D1D9',
      'editor.selectionBackground': '#1F6FEB40',
      'editor.inactiveSelectionBackground': '#1F6FEB20',
      'editorIndentGuide.background': '#21262D',
      'editorIndentGuide.activeBackground': '#30363D',
      'editorGutter.background': '#0D1117',
    },
  });

  // 4. AlgoArena Cyber (Matrix Aesthetic)
  monaco.editor.defineTheme('algoarena-cyber', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'E0FFE0', background: '080808' },
      { token: 'comment', foreground: '008800', fontStyle: 'italic' },
      { token: 'keyword', foreground: '00FF00', fontStyle: 'bold' },
      { token: 'keyword.control', foreground: '00FF00' },
      { token: 'operator', foreground: '39FF14' },
      { token: 'string', foreground: '00E5FF' },
      { token: 'number', foreground: 'FFE600' },
      { token: 'regexp', foreground: '00FFA3' },
      { token: 'type', foreground: 'FF007F' },
      { token: 'class', foreground: 'FF007F' },
      { token: 'function', foreground: '00FFA3' },
      { token: 'variable', foreground: 'E0FFE0' },
      { token: 'variable.parameter', foreground: '00FFFF' },
      { token: 'constant', foreground: 'FFE600' },
      { token: 'delimiter', foreground: 'A0FFA0' },
    ],
    colors: {
      'editor.background': '#080808',
      'editor.foreground': '#E0FFE0',
      'editorCursor.foreground': '#00FF00',
      'editor.lineHighlightBackground': '#00FF0014',
      'editorLineNumber.foreground': '#005500',
      'editorLineNumber.activeForeground': '#00FF00',
      'editor.selectionBackground': '#00FF0033',
      'editor.inactiveSelectionBackground': '#00FF0018',
      'editorIndentGuide.background': '#142214',
      'editorIndentGuide.activeBackground': '#00FF0044',
      'editorGutter.background': '#080808',
    },
  });
}
