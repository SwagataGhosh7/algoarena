import Prism from 'prismjs';
// Import language components
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';

export function normalizeLanguage(lang: string = ''): string {
  const l = lang.toLowerCase().trim();
  if (l === 'ts' || l === 'typescript') return 'typescript';
  if (l === 'js' || l === 'javascript') return 'javascript';
  if (l === 'py' || l === 'python') return 'python';
  if (l === 'cpp' || l === 'c++') return 'cpp';
  if (l === 'c') return 'c';
  if (l === 'java') return 'java';
  if (l === 'go' || l === 'golang') return 'go';
  if (l === 'rust' || l === 'rs') return 'rust';
  return 'javascript';
}

export function highlightCodeWithPrism(code: string, language: string): string {
  const normLang = normalizeLanguage(language);
  const grammar = Prism.languages[normLang] || Prism.languages.javascript;
  if (!grammar) {
    return escapeHtml(code);
  }
  try {
    return Prism.highlight(code, grammar, normLang);
  } catch (err) {
    console.warn('Prism highlight fallback:', err);
    return escapeHtml(code);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
