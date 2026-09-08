import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Swords, 
  Users, 
  Zap, 
  Clock, 
  RefreshCw, 
  Radio, 
  ShieldAlert, 
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { socket } from '../socket';
import { apiUrl } from '../api';
import { useStore } from '../store';
import { 
  SkillBracketAvailability, 
  SkillBracketId, 
  MatchmakingAvailabilityData,
  DuelistInQueue
} from '../types';

interface MatchmakingAvailabilityChartProps {
  onQuickMatch?: () => void;
  className?: string;
}

const DEFAULT_BRACKETS: SkillBracketAvailability[] = [
  {
    id: 'novice',
    name: 'Novice Division',
    badge: 'TIER IV',
    eloRange: '< 1200 ELO',
    minElo: 0,
    maxElo: 1199,
    count: 0,
    totalOnline: 0,
    avgWaitSeconds: 0,
    accentColor: '#10B981', // emerald
    duelists: [],
  },
  {
    id: 'intermediate',
    name: 'Intermediate Division',
    badge: 'TIER III',
    eloRange: '1200 - 1599 ELO',
    minElo: 1200,
    maxElo: 1599,
    count: 0,
    totalOnline: 0,
    avgWaitSeconds: 0,
    accentColor: '#06B6D4', // cyan
    duelists: [],
  },
  {
    id: 'advanced',
    name: 'Advanced Division',
    badge: 'TIER II',
    eloRange: '1600 - 1999 ELO',
    minElo: 1600,
    maxElo: 1999,
    count: 0,
    totalOnline: 0,
    avgWaitSeconds: 0,
    accentColor: '#A855F7', // violet
    duelists: [],
  },
  {
    id: 'elite',
    name: 'Elite',
    badge: 'TIER I',
    eloRange: '2000+ ELO',
    minElo: 2000,
    maxElo: 3000,
    count: 0,
    totalOnline: 0,
    avgWaitSeconds: 0,
    accentColor: '#00FF00', // matrix green
    duelists: [],
  },
];

export function MatchmakingAvailabilityChart({ onQuickMatch, className = '' }: MatchmakingAvailabilityChartProps) {
  const navigate = useNavigate();
  const { currentUser, accountProfile } = useStore();
  
  const [data, setData] = useState<MatchmakingAvailabilityData>({
    brackets: DEFAULT_BRACKETS,
    totalLooking: DEFAULT_BRACKETS.reduce((acc, b) => acc + b.count, 0),
    totalOnline: DEFAULT_BRACKETS.reduce((acc, b) => acc + b.totalOnline, 0),
    timestamp: Date.now(),
  });

  const [hoveredBracket, setHoveredBracket] = useState<SkillBracketAvailability | null>(null);
  const [isLookingForDuel, setIsLookingForDuel] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 600, height: 260 });

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const resizeDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // User's own bracket determination
  const userElo = accountProfile ? 1200 : 1200; // default baseline or profile elo
  const userBracketId: SkillBracketId = useMemo(() => {
    if (userElo >= 2000) return 'elite';
    if (userElo >= 1600) return 'advanced';
    if (userElo >= 1200) return 'intermediate';
    return 'novice';
  }, [userElo]);

  // Fetch from REST endpoint
  const fetchAvailability = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch(apiUrl('/api/matchmaking-availability'));
      if (res.ok) {
        const json = await res.json();
        if (json.brackets && Array.isArray(json.brackets)) {
          setData(json);
        }
      }
    } catch (err) {
      console.warn('Failed to load matchmaking availability:', err);
    } finally {
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, []);

  // Listen for real-time WebSocket events
  useEffect(() => {
    fetchAvailability();

    const handleUpdate = (updatedData: MatchmakingAvailabilityData) => {
      if (updatedData && Array.isArray(updatedData.brackets)) {
        setData(updatedData);
      }
    };

    socket.on('matchmaking_availability_update', handleUpdate);

    // Request fresh availability on mount
    socket.emit('get_matchmaking_availability', (res: MatchmakingAvailabilityData) => {
      if (res && Array.isArray(res.brackets)) {
        setData(res);
      }
    });

    // Periodic heartbeat poll every 15s to keep in sync
    const interval = setInterval(() => {
      fetchAvailability();
    }, 15000);

    return () => {
      socket.off('matchmaking_availability_update', handleUpdate);
      clearInterval(interval);
    };
  }, [fetchAvailability]);

  // Toggle looking for duel status
  const handleToggleLooking = () => {
    const nextStatus = !isLookingForDuel;
    setIsLookingForDuel(nextStatus);
    socket.emit('set_looking_for_duel', { looking: nextStatus });
    
    // Optimistically update current bracket count locally
    setData(prev => {
      const updatedBrackets = prev.brackets.map(b => {
        if (b.id === userBracketId) {
          const newCount = nextStatus ? b.count + 1 : Math.max(0, b.count - 1);
          return {
            ...b,
            count: newCount,
          };
        }
        return b;
      });
      return {
        ...prev,
        brackets: updatedBrackets,
        totalLooking: updatedBrackets.reduce((acc, b) => acc + b.count, 0),
      };
    });
  };

  // Launch quick match or bracket-specific match
  const handleLaunchMatch = (bracketId?: SkillBracketId) => {
    if (onQuickMatch) {
      onQuickMatch();
    } else {
      const roomId = uuidv4().substring(0, 8);
      const diff = bracketId === 'elite' ? 'hard' : bracketId === 'advanced' ? 'medium' : 'easy';
      navigate(`/room/${roomId}?diff=${diff}`);
    }
  };

  // ResizeObserver for responsive chart dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const width = entry.contentRect.width;
      
      if (resizeDebounceTimerRef.current) {
        clearTimeout(resizeDebounceTimerRef.current);
      }

      resizeDebounceTimerRef.current = setTimeout(() => {
        // Dynamic height based on container width
        const height = width < 480 ? 220 : 250;
        setDimensions({ width: Math.max(280, width), height });
      }, 100);
    });

    observer.observe(container);

    return () => {
      if (resizeDebounceTimerRef.current) {
        clearTimeout(resizeDebounceTimerRef.current);
      }
      observer.disconnect();
    };
  }, []);

  // Render D3 Real-Time Bar Chart
  useEffect(() => {
    if (!svgRef.current || !data.brackets || data.brackets.length === 0) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    const margin = {
      top: 36,
      right: 20,
      bottom: 48,
      left: 36,
    };

    const innerWidth = Math.max(10, width - margin.left - margin.right);
    const innerHeight = Math.max(10, height - margin.top - margin.bottom);

    // Clear previous elements
    svg.selectAll('*').remove();

    // Defs for Cyber Bar Gradients and Filters
    const defs = svg.append('defs');

    // Glow filter for active bars
    const filter = defs.append('filter')
      .attr('id', 'neon-glow')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Create gradient for each bracket
    data.brackets.forEach(b => {
      const grad = defs.append('linearGradient')
        .attr('id', `bar-grad-${b.id}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      grad.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', b.accentColor)
        .attr('stop-opacity', 0.85);

      grad.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', b.accentColor)
        .attr('stop-opacity', 0.15);
    });

    const g = svg.append('g')
      .attr('id', 'chart-inner-group')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(data.brackets.map(d => d.id))
      .range([0, innerWidth])
      .padding(0.32);

    const maxCount = d3.max(data.brackets, d => d.count) || 0;
    const yMax = Math.max(5, Math.ceil((maxCount + 1) / 2) * 2);

    const yScale = d3.scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([innerHeight, 0]);

    // Horizontal Grid Lines
    const yTicks = yScale.ticks(4);
    g.append('g')
      .attr('id', 'grid-lines')
      .selectAll('line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', 'rgba(255, 255, 255, 0.07)')
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-width', 1);

    // Y Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(4)
      .tickFormat(d => `${d}`);

    g.append('g')
      .attr('id', 'y-axis-group')
      .call(yAxis)
      .call(axisG => {
        axisG.select('.domain').attr('stroke', 'rgba(255, 255, 255, 0.15)');
        axisG.selectAll('.tick line').attr('stroke', 'rgba(255, 255, 255, 0.15)');
        axisG.selectAll('.tick text')
          .attr('fill', '#71717a')
          .attr('font-size', '10px')
          .attr('font-family', 'monospace');
      });

    // Bar Slots / Background Stems
    const barGroups = g.append('g')
      .attr('id', 'bars-layer')
      .selectAll('.bracket-bar-group')
      .data(data.brackets)
      .enter()
      .append('g')
      .attr('class', 'bracket-bar-group')
      .attr('id', d => `bracket-bar-${d.id}`)
      .style('cursor', 'pointer')
      .on('mouseenter', (_event, d) => {
        setHoveredBracket(d);
      })
      .on('mouseleave', () => {
        setHoveredBracket(null);
      })
      .on('click', (_event, d) => {
        setHoveredBracket(d);
      });

    // Subtle background track for each bar slot
    barGroups.append('rect')
      .attr('x', d => xScale(d.id) || 0)
      .attr('y', 0)
      .attr('width', xScale.bandwidth())
      .attr('height', innerHeight)
      .attr('fill', 'rgba(255, 255, 255, 0.02)')
      .attr('stroke', 'rgba(255, 255, 255, 0.05)')
      .attr('stroke-dasharray', '2 2')
      .attr('rx', 2);

    // Animated Real-Time Bar Rect
    const duration = 650;
    const t = d3.transition().duration(duration).ease(d3.easeCubicOut);

    barGroups.append('rect')
      .attr('class', 'main-bar-rect')
      .attr('x', d => xScale(d.id) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('fill', d => `url(#bar-grad-${d.id})`)
      .attr('stroke', d => d.accentColor)
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.6)
      .attr('rx', 2)
      .transition(t)
      .attr('y', d => yScale(d.count))
      .attr('height', d => Math.max(0, innerHeight - yScale(d.count)));

    // Neon Accent Cap on top of each bar
    barGroups.append('rect')
      .attr('class', 'bar-cap-glow')
      .attr('x', d => (xScale(d.id) || 0) - 1)
      .attr('width', xScale.bandwidth() + 2)
      .attr('height', 3)
      .attr('y', innerHeight)
      .attr('fill', d => d.accentColor)
      .attr('filter', 'url(#neon-glow)')
      .transition(t)
      .attr('y', d => yScale(d.count));

    // Value Label on top of each bar (e.g. "3 DUELISTS")
    barGroups.append('text')
      .attr('class', 'bar-value-label')
      .attr('x', d => (xScale(d.id) || 0) + xScale.bandwidth() / 2)
      .attr('y', innerHeight)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '900')
      .attr('font-family', 'monospace')
      .attr('fill', d => d.accentColor)
      .text(d => d.count)
      .transition(t)
      .attr('y', d => Math.max(14, yScale(d.count) - 7));

    // Secondary sub-label below number (e.g., "QUEUED")
    barGroups.append('text')
      .attr('class', 'bar-queued-tag')
      .attr('x', d => (xScale(d.id) || 0) + xScale.bandwidth() / 2)
      .attr('y', innerHeight)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8px')
      .attr('font-weight', '700')
      .attr('font-family', 'monospace')
      .attr('fill', '#a1a1aa')
      .text(d => d.count === 1 ? 'DUELIST' : 'DUELISTS')
      .transition(t)
      .attr('y', d => Math.max(24, yScale(d.count) - 18));

    // X Axis Labels (Bracket Badge + ELO Range)
    const xLabels = g.append('g')
      .attr('id', 'x-axis-labels')
      .attr('transform', `translate(0, ${innerHeight + 16})`);

    data.brackets.forEach(b => {
      const xPos = (xScale(b.id) || 0) + xScale.bandwidth() / 2;
      const isUserBracket = b.id === userBracketId;

      const group = xLabels.append('g')
        .attr('transform', `translate(${xPos}, 0)`)
        .style('cursor', 'pointer')
        .on('click', () => setHoveredBracket(b));

      // Bracket Badge / Name
      group.append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', '900')
        .attr('font-family', 'monospace')
        .attr('fill', isUserBracket ? '#00FF00' : '#e4e4e7')
        .text(b.badge);

      // ELO Range
      group.append('text')
        .attr('y', 14)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('fill', '#71717a')
        .text(b.eloRange);

      // Current user bracket indicator
      if (isUserBracket) {
        group.append('circle')
          .attr('cx', 0)
          .attr('cy', 22)
          .attr('r', 2)
          .attr('fill', '#00FF00');
      }
    });

  }, [data, dimensions, userBracketId]);

  return (
    <div 
      id="matchmaking-availability-widget"
      className={`w-full bg-[#0a0a0a] border border-white/10 hover:border-[#00FF00]/40 transition-colors p-4 sm:p-5 font-mono text-left relative overflow-hidden ${className}`}
    >
      {/* Background Cyber Grid Accent */}
      <div 
        id="cyber-grid-overlay"
        className="absolute inset-0 bg-[radial-gradient(#00FF00_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" 
      />

      {/* Header Bar */}
      <div id="availability-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#00FF00]/10 border border-[#00FF00]/50 flex items-center justify-center text-[#00FF00] shadow-[0_0_12px_rgba(0,255,0,0.2)]">
            <Radio className="w-4 h-4 text-[#00FF00] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider">
                MATCH-MAKING AVAILABILITY
              </h2>
              <span className="px-1.5 py-0.5 bg-[#00FF00]/20 text-[#00FF00] text-[9px] font-bold border border-[#00FF00]/40 animate-pulse">
                LIVE RADAR
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">
              Real-time online duelists looking for a 1v1 match across skill brackets
            </p>
          </div>
        </div>

        {/* Live Counters & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black border border-white/15 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-ping" />
            <span className="font-bold text-white">{data.totalLooking}</span>
            <span className="text-zinc-500 text-[10px]">SEEKING DUEL</span>
          </div>

          <button
            id="btn-refresh-availability"
            onClick={() => fetchAvailability(true)}
            disabled={isRefreshing}
            title="Synchronize Real-Time Availability"
            className="p-1.5 bg-black border border-white/15 hover:border-[#00FF00] text-zinc-400 hover:text-[#00FF00] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#00FF00]' : ''}`} />
          </button>

          <button
            id="btn-quick-match-radar"
            onClick={() => handleLaunchMatch()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00FF00] hover:bg-[#00dd00] text-black font-black text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(0,255,0,0.25)] cursor-pointer transition-all"
          >
            <Swords className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">FIND DUEL</span>
            <span className="sm:hidden">QUEUE</span>
          </button>
        </div>
      </div>

      {/* User's Presence & Queue Status Strip */}
      <div id="user-queue-status-strip" className="mt-3 p-2.5 bg-black/60 border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 text-[10px] uppercase">MY PROFILE:</span>
            <span className="font-bold text-white text-[11px]">
              {accountProfile?.username || currentUser.name}
            </span>
            <span className="px-1.5 py-0.2 text-[9px] bg-white/10 text-zinc-300 border border-white/10">
              {userElo} ELO
            </span>
          </div>
          <span className="text-zinc-600 hidden sm:inline">|</span>
          <div className="flex items-center gap-1 text-[10px] text-zinc-400">
            <span>BRACKET:</span>
            <span className="text-[#00FF00] font-bold uppercase">
              {data.brackets.find(b => b.id === userBracketId)?.name || 'Intermediate'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-zinc-400 uppercase">MY STATUS:</span>
          <button
            id="btn-toggle-looking-status"
            onClick={handleToggleLooking}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase transition-all cursor-pointer border ${
              isLookingForDuel
                ? 'bg-[#00FF00]/15 text-[#00FF00] border-[#00FF00] shadow-[0_0_10px_rgba(0,255,0,0.2)]'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLookingForDuel ? 'bg-[#00FF00] animate-pulse' : 'bg-zinc-500'}`} />
            <span>{isLookingForDuel ? 'LOOKING FOR DUEL (ACTIVE)' : 'MATCHMAKING PAUSED'}</span>
          </button>
        </div>
      </div>

      {/* D3 Chart Canvas Container */}
      <div 
        id="d3-matchmaking-chart-container" 
        ref={containerRef} 
        className="w-full relative mt-4 pt-1 pb-1"
      >
        <svg 
          id="d3-matchmaking-svg"
          ref={svgRef} 
          width={dimensions.width} 
          height={dimensions.height}
          className="overflow-visible select-none mx-auto block"
        />
      </div>

      {/* Interactive Tooltip & Bracket Detail Dossier */}
      <div id="bracket-inspection-panel" className="mt-2 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {data.brackets.map((b) => {
          const isSelected = hoveredBracket?.id === b.id;
          const isUserInThis = b.id === userBracketId;

          return (
            <div
              key={b.id}
              id={`bracket-card-${b.id}`}
              onMouseEnter={() => setHoveredBracket(b)}
              className={`p-2.5 bg-black/80 border transition-all cursor-pointer ${
                isSelected 
                  ? 'border-[#00FF00] shadow-[0_0_15px_rgba(0,255,0,0.15)] scale-[1.01]' 
                  : isUserInThis
                  ? 'border-white/25 hover:border-white/40'
                  : 'border-white/10 hover:border-white/25'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span 
                  className="text-[10px] font-black uppercase tracking-wider"
                  style={{ color: b.accentColor }}
                >
                  {b.badge} // {b.name.replace(' Division', '')}
                </span>
                {isUserInThis && (
                  <span className="text-[9px] px-1 bg-[#00FF00]/20 text-[#00FF00] font-bold border border-[#00FF00]/30">
                    YOU
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between gap-2 mt-1">
                <span className="text-base font-black text-white font-mono">
                  {b.count} <span className="text-[10px] font-normal text-zinc-400">seeking</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {b.eloRange}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-2 pt-1.5 border-t border-white/5 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span>Est: ~{b.avgWaitSeconds}s</span>
                </span>
                <span className="text-zinc-500">
                  {b.totalOnline} online
                </span>
              </div>

              {/* Roster preview if duelists are waiting */}
              {b.duelists && b.duelists.length > 0 && (
                <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center gap-1 overflow-x-auto no-scrollbar">
                  <span className="text-[9px] text-zinc-500 shrink-0">Queue:</span>
                  <div className="flex items-center gap-1">
                    {b.duelists.slice(0, 3).map((d, i) => (
                      <span 
                        key={i} 
                        title={`${d.username} (${d.elo} ELO)`}
                        className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] text-zinc-300 font-mono whitespace-nowrap truncate max-w-[80px]"
                      >
                        {d.username}
                      </span>
                    ))}
                    {b.duelists.length > 3 && (
                      <span className="text-[9px] text-zinc-500">+{b.duelists.length - 3}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button for this bracket */}
              <button
                id={`btn-queue-bracket-${b.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLaunchMatch(b.id);
                }}
                className="w-full mt-2 py-1 bg-white/5 hover:bg-[#00FF00] text-zinc-400 hover:text-black text-[10px] font-black uppercase transition-colors flex items-center justify-center gap-1 cursor-pointer border border-white/10 hover:border-[#00FF00]"
              >
                <span>Join Them</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
