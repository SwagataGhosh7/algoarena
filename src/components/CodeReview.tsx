import { AlertTriangle, CheckCircle2, Code2, Lightbulb } from 'lucide-react';
import { CodeReviewData } from '../types';
import { SubmissionCodeViewer } from './SubmissionCodeViewer';

interface CodeReviewProps {
  review: CodeReviewData;
  submittedCode?: string;
  language?: string;
}

export function CodeReview({ review, submittedCode, language }: CodeReviewProps) {
  return (
    <section className="border border-[#F27D26]/50 bg-[#0a0a0a] font-mono text-left">
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#121212] px-4 py-3">
        <Code2 className="h-4 w-4 text-[#F27D26]" />
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-white">POST-MATCH CODE REVIEW</h3>
          <p className="text-[10px] uppercase text-zinc-500">Reference solution // line-by-line fault analysis</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="border border-[#00FF00]/30 bg-[#00FF00]/5 p-3">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase text-[#00FF00]">
            <Lightbulb className="h-3.5 w-3.5" /> REVIEW SUMMARY
          </div>
          <p className="text-xs leading-relaxed text-zinc-300">{review.summary}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="border border-white/10 bg-black/40 p-3">
            <div className="mb-2 text-[10px] font-black uppercase text-[#F27D26]">IMPROVEMENT PLAN</div>
            <ul className="space-y-1.5 text-[10px] leading-relaxed text-zinc-300">
              {review.improvementTips.map((tip, index) => <li key={index}>- {tip}</li>)}
            </ul>
          </div>
          <div className="border border-white/10 bg-black/40 p-3">
            <div className="mb-2 text-[10px] font-black uppercase text-[#00FF00]">CODING ADVICE</div>
            <ul className="space-y-1.5 text-[10px] leading-relaxed text-zinc-300">
              {review.codingAdvice.map((tip, index) => <li key={index}>- {tip}</li>)}
            </ul>
          </div>
        </div>

        {submittedCode && (
          <div className="border border-white/10 bg-black/40">
            <div className="px-3 py-2 text-[10px] font-bold uppercase text-zinc-300 border-b border-white/10 flex items-center justify-between">
              <span>Your Submitted Solution // {language || 'TypeScript'}</span>
              <span className="text-[#00FF00] text-[9px] font-mono">MONACO / PRISM HIGHLIGHTED</span>
            </div>
            <SubmissionCodeViewer
              code={submittedCode}
              language={language}
              height="220px"
              compact
              showEngineToggle
              defaultEngine="monaco"
            />
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400">
            <AlertTriangle className="h-3.5 w-3.5 text-[#F27D26]" /> LINE-BY-LINE ANALYSIS
          </div>
          <div className="max-h-64 overflow-y-auto border border-white/10">
            {review.lineAnalysis.map((line) => {
              const matches = line.issue.toLowerCase().includes('matches');
              return (
                <div key={line.lineNumber} className="grid grid-cols-[2.5rem_1fr] border-b border-white/5 last:border-b-0">
                  <div className="bg-[#101010] px-2 py-2 text-right text-[10px] text-zinc-600">{line.lineNumber}</div>
                  <div className="space-y-1 px-3 py-2">
                    <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] text-zinc-300">{line.submitted || ' '}</pre>
                    <p className={`flex items-start gap-1.5 text-[10px] leading-relaxed ${matches ? 'text-[#00FF00]' : 'text-[#F27D26]'}`}>
                      {matches ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />}
                      {line.issue}
                    </p>
                    {!matches && <pre className="overflow-x-auto whitespace-pre-wrap border-l border-[#00FF00]/40 pl-2 text-[10px] text-[#00FF00]/80">Reference: {line.expected}</pre>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {review.expectedSolution && (
          <div className="border border-[#00FF00]/30 bg-black/40">
            <div className="px-3 py-2 text-[10px] font-bold uppercase text-[#00FF00] border-b border-white/10 flex items-center justify-between">
              <span>Optimal Reference Solution</span>
              <span className="text-zinc-500 text-[9px]">CANONICAL ALGORITHM</span>
            </div>
            <SubmissionCodeViewer
              code={review.expectedSolution}
              language={language}
              height="240px"
              compact
              showEngineToggle
              defaultEngine="monaco"
            />
          </div>
        )}
      </div>
    </section>
  );
}

