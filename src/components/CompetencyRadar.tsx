import { useState, useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Activity, Zap, TrendingUp, Info, BarChart2, ShieldCheck, Layers } from 'lucide-react';

export interface CompetencyTopic {
  subject: string;
  score: number;
  fullMark: number;
  tier?: string;
  solvedCount: number;
  winRate: number;
  benchmark?: number;
}

const DEFAULT_TOPICS: CompetencyTopic[] = [
  { subject: 'Arrays', score: 128, fullMark: 150, tier: '85%', solvedCount: 42, winRate: 78, benchmark: 95 },
  { subject: 'Graphs', score: 94, fullMark: 150, tier: '63%', solvedCount: 26, winRate: 65, benchmark: 85 },
  { subject: 'Dynamic Prog.', score: 112, fullMark: 150, tier: '75%', solvedCount: 35, winRate: 71, benchmark: 90 },
  { subject: 'Trees', score: 104, fullMark: 150, tier: '69%', solvedCount: 30, winRate: 69, benchmark: 88 },
  { subject: 'Bit Manip.', score: 82, fullMark: 150, tier: '55%', solvedCount: 18, winRate: 58, benchmark: 75 },
  { subject: 'Math & Logic', score: 76, fullMark: 150, tier: '51%', solvedCount: 15, winRate: 54, benchmark: 80 },
];

// Topic specific advice mapping
const TOPIC_INTEL: Record<string, string> = {
  'Arrays': 'Two-pointer technique, Sliding Window, and Monotonic Queue mastery.',
  'Graphs': 'Dijkstra, BFS/DFS cycles, Topological sorting, and Disjoint Set Union (DSU).',
  'Dynamic Prog.': 'State transitions, space optimization, Knapsack 0/1, and interval DP.',
  'Dynamic Programming': 'State transitions, space optimization, Knapsack 0/1, and interval DP.',
  'Trees': 'Lowest Common Ancestor, Tree DP, Binary Lifting, and Segment Trees.',
  'Bit Manip.': 'XOR tricks, Bitmask dynamic programming, and bit shifting arithmetic.',
  'Math & Logic': 'Modular inverse, Fermat little theorem, and combinatorics.',
};

interface CompetencyRadarProps {
  username?: string;
  data?: CompetencyTopic[];
  accentColor?: string;
}

export function CompetencyRadar({ 
  username = 'OPERATOR', 
  data = DEFAULT_TOPICS,
  accentColor = '#00FF00'
}: CompetencyRadarProps) {
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('Arrays');

  // Normalize data with default benchmark ratings if missing
  const topicList = useMemo(() => {
    return (data && data.length > 0 ? data : DEFAULT_TOPICS).map(item => {
      // Normalizing subject label if needed
      const cleanSubject = item.subject === 'Math & Number' ? 'Math & Logic' : item.subject;
      const benchmarkScore = item.benchmark || (
        cleanSubject.includes('Array') ? 95 :
        cleanSubject.includes('Graph') ? 85 :
        cleanSubject.includes('Dynamic') ? 90 :
        cleanSubject.includes('Tree') ? 88 :
        cleanSubject.includes('Bit') ? 75 : 80
      );

      return {
        ...item,
        subject: cleanSubject,
        benchmark: benchmarkScore,
      };
    });
  }, [data]);

  // Active highlighted topic
  const activeTopic = useMemo(() => {
    return topicList.find(t => t.subject === selectedSubject) || topicList[0];
  }, [topicList, selectedSubject]);

  // Transform data for Recharts Radar
  const chartData = useMemo(() => {
    return topicList.map(item => ({
      subject: item.subject,
      userScore: item.score,
      benchmark: item.benchmark,
      fullMark: item.fullMark,
      tier: item.tier,
      solvedCount: item.solvedCount,
      winRate: item.winRate,
    }));
  }, [topicList]);

  // Total metrics
  const totalUserScore = topicList.reduce((acc, curr) => acc + curr.score, 0);
  const maxPossible = topicList.reduce((acc, curr) => acc + curr.fullMark, 0);
  const overallPercentage = Math.round((totalUserScore / maxPossible) * 100);

  return (
    <div className="flex flex-col h-full select-none">
      {/* Header with Title and Benchmark Toggle */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00FF00]" />
          <div>
            <h2 className="text-xs font-black text-zinc-100 uppercase tracking-widest font-mono">
              COMPETENCY RADAR // RECHARTS MATRIX
            </h2>
            <p className="text-[10px] font-mono text-zinc-500">
              ALGORITHMIC MASTERY SPECTRUM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowBenchmark(prev => !prev)}
            className={`px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border transition-colors cursor-pointer flex items-center gap-1.5 ${
              showBenchmark
                ? 'bg-[#F27D26]/15 border-[#F27D26]/50 text-[#F27D26]'
                : 'bg-black border-white/10 text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle Global 1800+ ELO Benchmark"
          >
            <Layers className="w-3 h-3" />
            <span>{showBenchmark ? 'BENCHMARK: ON' : 'BENCHMARK: OFF'}</span>
          </button>

          <div className="bg-[#00FF00]/10 text-[#00FF00] text-xs px-2.5 py-1 border border-[#00FF00]/30 font-mono font-black">
            {overallPercentage}% MASTERY
          </div>
        </div>
      </div>

      {/* Radar Chart Visual with Recharts */}
      <div className="relative w-full h-[270px] min-h-[270px] my-1">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={chartData}>
            <PolarGrid stroke="#27272a" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="subject"
              tick={({ payload, x, y, textAnchor }) => {
                const isSelected = activeTopic.subject === payload.value;
                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor={textAnchor}
                    fill={isSelected ? '#00FF00' : '#a1a1aa'}
                    fontSize={11}
                    fontWeight={isSelected ? 900 : 700}
                    fontFamily="JetBrains Mono, monospace"
                    className="cursor-pointer transition-colors"
                    onClick={() => setSelectedSubject(payload.value)}
                  >
                    {payload.value}
                  </text>
                );
              }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 150]}
              tick={false}
              axisLine={false}
            />
            
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pData = payload[0].payload;
                  return (
                    <div className="bg-black/95 border border-[#00FF00]/50 p-3 shadow-[0_0_20px_rgba(0,255,0,0.25)] font-mono text-xs">
                      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-1.5 mb-2">
                        <span className="font-black text-white uppercase text-xs">{pData.subject}</span>
                        <span className="text-[#00FF00] text-[10px] font-bold px-1.5 py-0.5 border border-[#00FF00]/30 bg-[#00FF00]/10 font-mono">
                          {Math.round((pData.userScore / pData.fullMark) * 100)}% MASTERY
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-zinc-400">OPERATOR SCORE:</span>
                          <span className="text-[#00FF00] font-black">{pData.userScore} / {pData.fullMark}</span>
                        </div>
                        {showBenchmark && (
                          <div className="flex justify-between gap-4">
                            <span className="text-zinc-500">GLOBAL BENCHMARK:</span>
                            <span className="text-[#F27D26] font-bold">{pData.benchmark} pts</span>
                          </div>
                        )}
                        <div className="flex justify-between gap-4 pt-1 border-t border-white/10 text-[10px]">
                          <span className="text-zinc-500">SOLVED / WIN RATE:</span>
                          <span className="text-zinc-300">{pData.solvedCount} challenges ({pData.winRate}%)</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Global Benchmark Series */}
            {showBenchmark && (
              <Radar
                name="Global 1800+ ELO Benchmark"
                dataKey="benchmark"
                stroke="#F27D26"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="#F27D26"
                fillOpacity={0.12}
                dot={false}
              />
            )}

            {/* Operator Competency Series */}
            <Radar
              name={`${username.toUpperCase()} (Operator)`}
              dataKey="userScore"
              stroke={accentColor}
              strokeWidth={2.2}
              fill={accentColor}
              fillOpacity={0.28}
              dot={{ r: 3.5, fill: accentColor, strokeWidth: 1.5, stroke: '#000000' }}
              activeDot={{ r: 6, fill: '#FFFFFF', stroke: accentColor, strokeWidth: 2.5 }}
            />

            <Legend
              wrapperStyle={{
                fontSize: '10px',
                fontFamily: 'JetBrains Mono, monospace',
                paddingTop: '8px',
              }}
              formatter={(value) => <span className="text-zinc-400 uppercase font-bold text-[10px]">{value}</span>}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Algorithmic Topic Grid */}
      <div className="mt-auto pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase font-bold mb-2">
          <span className="flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-[#00FF00]" />
            CORE ALGORITHMIC TOPICS
          </span>
          <span className="text-zinc-500 hidden sm:inline">
            CLICK TOPIC TO DRILL DOWN
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {topicList.map(topic => {
            const isSelected = activeTopic.subject === topic.subject;
            return (
              <button
                key={topic.subject}
                onClick={() => setSelectedSubject(topic.subject)}
                className={`text-left p-2 border font-mono text-[10px] transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#00FF00] bg-[#00FF00]/15 text-white shadow-[0_0_12px_rgba(0,255,0,0.25)]'
                    : 'border-white/10 bg-black/60 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="truncate font-bold uppercase text-[11px]">{topic.subject}</span>
                  <span className={`text-[9px] px-1 py-0.2 border ${
                    isSelected ? 'border-[#00FF00] text-[#00FF00]' : 'border-white/10 text-zinc-400'
                  }`}>
                    {Math.round((topic.score / topic.fullMark) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-zinc-500">
                  <span className={isSelected ? 'text-[#00FF00] font-bold' : ''}>
                    {topic.score} / {topic.fullMark}
                  </span>
                  <span className="text-zinc-400">{topic.winRate}% win</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-zinc-900 h-1 mt-1.5 border border-white/5 overflow-hidden">
                  <div
                    className={`h-full transition-all ${isSelected ? 'bg-[#00FF00]' : 'bg-zinc-600'}`}
                    style={{ width: `${Math.round((topic.score / topic.fullMark) * 100)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Topic Inspector & Tactical Intel */}
        <div className="bg-black border border-white/10 p-3 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00FF00]" />
              <span className="font-black text-white uppercase text-xs">
                {activeTopic.subject} SPECIALIZATION
              </span>
              <span className="text-[10px] bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/30 px-1.5 py-0.5 font-bold font-mono">
                {Math.round((activeTopic.score / activeTopic.fullMark) * 100)}% MASTERY
              </span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-zinc-400">
              <span>SOLVED: <strong className="text-white">{activeTopic.solvedCount}</strong></span>
              <span>WIN RATE: <strong className="text-[#00FF00]">{activeTopic.winRate}%</strong></span>
              <span>DELTA: <strong className={activeTopic.score >= (activeTopic.benchmark || 80) ? 'text-[#00FF00]' : 'text-[#F27D26]'}>
                {activeTopic.score >= (activeTopic.benchmark || 80) ? '+' : ''}{activeTopic.score - (activeTopic.benchmark || 80)} pts
              </strong></span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>{TOPIC_INTEL[activeTopic.subject] || 'Mastery involves rigorous practice on complex time-space constraints.'}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
