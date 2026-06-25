'use client';

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

const TEAL = '#2fe0cf';
const TEAL_SOFT = '#34dbcf';
const WORD_FONT = "'Manrope', system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const NAVY_BG = 'radial-gradient(125% 120% at 18% 10%, #18203f 0%, #0e142e 46%, #090d22 100%)';
const WIDTH = 1920;
const HEIGHT = 1080;
const DURATION = 8;

type EasingFn = (t: number) => number;

const Easing = {
  linear: (t: number) => t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInCubic: (t: number) => t * t * t,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

function animate({
  from = 0,
  to = 1,
  start = 0,
  end = 1,
  ease = Easing.easeInOutCubic,
}: {
  from?: number;
  to?: number;
  start?: number;
  end?: number;
  ease?: EasingFn;
}) {
  return (t: number) => {
    if (t <= start) return from;
    if (t >= end) return to;
    const local = (t - start) / (end - start);
    return from + (to - from) * ease(local);
  };
}

function svgNumber(value: number) {
  return value.toFixed(4);
}

type TimelineContextValue = {
  time: number;
  duration: number;
  complete: boolean;
  scale: number;
};

const TimelineContext = createContext<TimelineContextValue>({
  time: 0,
  duration: DURATION,
  complete: false,
  scale: 1,
});

function useTimeline() {
  return useContext(TimelineContext);
}

function useLoopingTime(duration: number, loop: boolean) {
  const [time, setTime] = useState(0);
  const [complete, setComplete] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const completeRef = useRef(false);

  useEffect(() => {
    completeRef.current = false;
    lastTsRef.current = null;

    const step = (ts: number) => {
      if (completeRef.current) return;
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      let shouldContinue = true;
      setTime((current) => {
        const next = current + dt;
        if (next < duration) return next;
        if (loop) return next % duration;
        completeRef.current = true;
        shouldContinue = false;
        setComplete(true);
        return duration;
      });

      if (shouldContinue) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [duration, loop]);

  return { time, complete };
}

function Stage({ children, loop = true }: { children: ReactNode; loop?: boolean }) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(WIDTH);
  const { time, complete } = useLoopingTime(DURATION, loop);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      setContainerWidth(w);
      setScale(Math.max(0.05, Math.min(w / WIDTH, el.clientHeight / HEIGHT)));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // On narrow screens, use a taller (more square) aspect ratio so the
  // animation occupies more vertical space and feels larger.
  const isMobile = containerWidth < 768;
  const aspectRatio = isMobile ? '4 / 3' : `${WIDTH} / ${HEIGHT}`;

  const value = useMemo(() => ({ time, duration: DURATION, complete, scale }), [complete, time, scale]);

  return (
    <div
      ref={stageRef}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio,
        minHeight: 240,
        overflow: 'hidden',
        background: '#090d22',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: WIDTH,
          height: HEIGHT,
          overflow: 'hidden',
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>
      </div>
    </div>
  );
}

type EGIconProps = {
  size: number;
  time: number;
  originY?: number;
};

function EGIcon({ size, time, originY = 0 }: EGIconProps) {
  const panelP = animate({ start: 3.3, end: 3.95, ease: Easing.easeOutBack })(time);
  const spineP = animate({ start: 3.5, end: 3.95, ease: Easing.easeOutCubic })(time);
  const barsP = [0, 1, 2].map((i) =>
    animate({ start: 3.62 + i * 0.12, end: 3.62 + i * 0.12 + 0.46, ease: Easing.easeOutCubic })(
      time,
    ),
  );
  const dotsP = [0, 1, 2, 3, 4, 5].map((j) =>
    animate({ start: 4.02 + j * 0.07, end: 4.02 + j * 0.07 + 0.4, ease: Easing.easeOutBack })(
      time,
    ),
  );
  const glowAppear = animate({ start: 4.3, end: 5, ease: Easing.easeOutCubic })(time);
  const glowPulse = glowAppear * (0.55 + 0.45 * Math.max(0, Math.sin((time - 4.6) * 1.6)));
  const breathe = time > 4.6 ? 1 + 0.012 * Math.sin((time - 4.6) * 1.7) : 1;

  const f = (x: number) => x * size;
  const bars = [
    { top: 0.27, width: 0.36 },
    { top: 0.445, width: 0.28 },
    { top: 0.62, width: 0.36 },
  ];
  const barCenters = bars.map((bar) => bar.top + 0.055);
  const dotXs = [0.45, 0.515];

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        transform: `translateY(${originY}px) scale(${(0.62 + 0.38 * panelP) * breathe})`,
        transformOrigin: 'center',
        opacity: panelP,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -f(0.13),
          borderRadius: f(0.34),
          background: `radial-gradient(circle at 50% 50%, ${TEAL_SOFT}, transparent 62%)`,
          opacity: 0.22 * glowPulse,
          filter: `blur(${f(0.05)}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: f(0.23),
          background: 'linear-gradient(158deg,#1d2750 0%,#10162e 100%)',
          boxShadow: `0 ${f(0.05)}px ${f(0.16)}px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: f(0.29),
            top: f(0.24),
            width: f(0.11),
            height: f(0.46),
            borderRadius: f(0.045),
            background: '#A6B3CE',
            transform: `scaleY(${spineP})`,
            transformOrigin: 'top center',
          }}
        />
        {bars.map((bar, index) => (
          <div
            key={`bar-${bar.top}`}
            style={{
              position: 'absolute',
              left: f(0.37),
              top: f(bar.top),
              width: f(bar.width),
              height: f(0.11),
              borderRadius: f(0.04),
              background: '#EAEFFF',
              boxShadow: '0 1px 2px rgba(0,0,0,0.16)',
              transform: `scaleX(${barsP[index]})`,
              transformOrigin: 'left center',
            }}
          />
        ))}
        {barCenters.flatMap((cy, rowIndex) =>
          dotXs.map((cx, dotIndex) => {
            const index = rowIndex * 2 + dotIndex;
            return (
              <div
                key={`dot-${index}`}
                style={{
                  position: 'absolute',
                  left: f(cx) - f(0.018),
                  top: f(cy) - f(0.018),
                  width: f(0.036),
                  height: f(0.036),
                  borderRadius: '50%',
                  background: TEAL_SOFT,
                  transform: `scale(${dotsP[index]})`,
                  transformOrigin: 'center',
                  boxShadow: `0 0 ${f(0.05) * glowPulse}px ${TEAL_SOFT}`,
                }}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}

function BgWatermark({ time }: { time: number }) {
  const ap = animate({ start: 1, end: 2.6, ease: Easing.easeOutCubic })(time);
  const drift = Math.sin(time * 0.3) * 16;
  const size = 660;
  const color = '#cfd6ec';

  return (
    <div
      style={{
        position: 'absolute',
        right: -70 + drift,
        top: '50%',
        marginTop: -size / 2,
        width: size,
        height: size,
        opacity: 0.05 * ap,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: size * 0.29,
          top: size * 0.24,
          width: size * 0.11,
          height: size * 0.46,
          borderRadius: size * 0.045,
          background: color,
        }}
      />
      {[
        { top: 0.27, width: 0.36 },
        { top: 0.445, width: 0.28 },
        { top: 0.62, width: 0.36 },
      ].map((bar) => (
        <div
          key={`watermark-${bar.top}`}
          style={{
            position: 'absolute',
            left: size * 0.37,
            top: size * bar.top,
            width: size * bar.width,
            height: size * 0.11,
            borderRadius: size * 0.04,
            background: color,
          }}
        />
      ))}
    </div>
  );
}

/* ── Constellation: agents converging toward central AI hub ── */

const HUB_X = WIDTH / 2;
const HUB_Y = HEIGHT / 2;

type AgentStar = {
  x: number;
  y: number;
  r: number;
  delay: number;
  service: string;
  group: number; // cluster index
};

const constellationStars: AgentStar[] = [
  // Group 0 — Finance & Business (top-left) — chain with a fork
  { x: 148, y: 218, r: 2.8, delay: 0, service: 'Finance Hub', group: 0 },    // 0
  { x: 272, y: 142, r: 2.0, delay: 0.1, service: 'My DB', group: 0 },        // 1
  { x: 400, y: 178, r: 2.4, delay: 0.18, service: 'Hosting', group: 0 },     // 2
  { x: 340, y: 286, r: 1.8, delay: 0.24, service: 'Backup', group: 0 },      // 3
  // Group 1 — Web & SEO (top-right) — hub-spoke off SEO-Analyzer
  { x: 1540, y: 156, r: 2.6, delay: 0.06, service: 'SSL-Checker', group: 1 },      // 4
  { x: 1670, y: 252, r: 2.5, delay: 0.16, service: 'SEO-Analyzer', group: 1 },     // 5  (hub)
  { x: 1800, y: 176, r: 2.2, delay: 0.26, service: 'Company Research', group: 1 }, // 6
  { x: 1730, y: 370, r: 2.0, delay: 0.36, service: 'Business Identity', group: 1 },// 7
  { x: 1560, y: 340, r: 1.7, delay: 0.42, service: 'Domain Monitor', group: 1 },   // 8
  // Group 2 — Content & Marketing (bottom-left) — zigzag chain
  { x: 168, y: 842, r: 2.4, delay: 0.2, service: 'Blogging', group: 2 },       // 9
  { x: 310, y: 762, r: 2.1, delay: 0.3, service: 'Social Media', group: 2 },   // 10
  { x: 456, y: 838, r: 2.7, delay: 0.42, service: 'Kakao Channel', group: 2 }, // 11
  { x: 546, y: 748, r: 1.8, delay: 0.48, service: 'Newsletter', group: 2 },    // 12
  // Group 3 — Recording & Tools (bottom-right) — L-shape
  { x: 1420, y: 794, r: 2.3, delay: 0.24, service: 'Browser Recorder', group: 3 }, // 13
  { x: 1580, y: 740, r: 2.0, delay: 0.34, service: 'Desktop Recorder', group: 3 }, // 14
  { x: 1740, y: 800, r: 2.6, delay: 0.44, service: 'Rookie', group: 3 },           // 15
  { x: 1760, y: 906, r: 1.7, delay: 0.5, service: 'Screenshot', group: 3 },        // 16
  // Group 4 — AI Core (top-center) — V-shape from AI Center
  { x: 1020, y: 152, r: 2.0, delay: 0.12, service: 'MCP Server', group: 4 },  // 17
  { x: 1190, y: 240, r: 2.8, delay: 0.22, service: 'AI Center', group: 4 },   // 18 (hub)
  { x: 1350, y: 156, r: 2.0, delay: 0.32, service: 'Ollama', group: 4 },      // 19
  // Group 5 — Dev & API (left) — vertical chain with branch
  { x: 130, y: 396, r: 1.9, delay: 0.38, service: 'Coding', group: 5 },            // 20
  { x: 96, y: 520, r: 2.1, delay: 0.44, service: 'PageIndex', group: 5 },          // 21
  { x: 220, y: 610, r: 1.8, delay: 0.5, service: 'API Key Management', group: 5 }, // 22
  // Group 6 — Infrastructure (right) — chain
  { x: 1840, y: 498, r: 2.0, delay: 0.4, service: 'Gmail', group: 6 },           // 23
  { x: 1710, y: 578, r: 1.9, delay: 0.48, service: 'Docker', group: 6 },         // 24
  { x: 1560, y: 530, r: 2.3, delay: 0.52, service: 'Desktop Control', group: 6 },// 25
  { x: 1810, y: 640, r: 1.6, delay: 0.56, service: 'Scheduler', group: 6 },      // 26
];

// Varied topologies per cluster + cross-cluster bridges
const constellationLines: { from: number; to: number; kind: 'cluster' | 'bridge' }[] = [
  // Group 0 — chain with fork: 0→1→2, 1→3
  { from: 0, to: 1, kind: 'cluster' },
  { from: 1, to: 2, kind: 'cluster' },
  { from: 1, to: 3, kind: 'cluster' },
  // Group 1 — hub-spoke: 5 is hub → 4, 6, 7, 8
  { from: 5, to: 4, kind: 'cluster' },
  { from: 5, to: 6, kind: 'cluster' },
  { from: 5, to: 7, kind: 'cluster' },
  { from: 5, to: 8, kind: 'cluster' },
  // Group 2 — zigzag chain: 9→10→11→12
  { from: 9, to: 10, kind: 'cluster' },
  { from: 10, to: 11, kind: 'cluster' },
  { from: 11, to: 12, kind: 'cluster' },
  // Group 3 — L-shape: 13→14→15, 15→16
  { from: 13, to: 14, kind: 'cluster' },
  { from: 14, to: 15, kind: 'cluster' },
  { from: 15, to: 16, kind: 'cluster' },
  // Group 4 — V from hub: 18→17, 18→19
  { from: 18, to: 17, kind: 'cluster' },
  { from: 18, to: 19, kind: 'cluster' },
  // Group 5 — vertical chain with branch: 20→21→22
  { from: 20, to: 21, kind: 'cluster' },
  { from: 21, to: 22, kind: 'cluster' },
  // Group 6 — chain with spur: 25→24→23, 24→26
  { from: 25, to: 24, kind: 'cluster' },
  { from: 24, to: 23, kind: 'cluster' },
  { from: 24, to: 26, kind: 'cluster' },
  // Cross-cluster bridges (dashed, fainter)
  { from: 2, to: 4, kind: 'bridge' },   // Finance → Web
  { from: 3, to: 20, kind: 'bridge' },  // Finance → Dev
  { from: 8, to: 25, kind: 'bridge' },  // Web → Infra
  { from: 22, to: 9, kind: 'bridge' },  // Dev → Content
  { from: 12, to: 13, kind: 'bridge' }, // Content → Recording
  { from: 16, to: 26, kind: 'bridge' }, // Recording → Infra
  { from: 19, to: 4, kind: 'bridge' },  // AI Core → Web
  { from: 17, to: 2, kind: 'bridge' },  // AI Core → Finance
];

type ClusterInfo = {
  cx: number;
  cy: number;
  label: string;
  labelOffset: { dx: number; dy: number };
};

const constellationClusters: ClusterInfo[] = [
  { cx: 290, cy: 200, label: 'FINANCE', labelOffset: { dx: 0, dy: -50 } },
  { cx: 1660, cy: 260, label: 'WEB & SEO', labelOffset: { dx: 0, dy: -58 } },
  { cx: 370, cy: 800, label: 'CONTENT', labelOffset: { dx: 0, dy: 54 } },
  { cx: 1620, cy: 810, label: 'RECORDING', labelOffset: { dx: 0, dy: 54 } },
  { cx: 1190, cy: 186, label: 'AI CORE', labelOffset: { dx: 0, dy: -48 } },
  { cx: 150, cy: 508, label: 'DEV & API', labelOffset: { dx: -52, dy: 0 } },
  { cx: 1730, cy: 560, label: 'INFRA', labelOffset: { dx: 56, dy: 0 } },
];

// Pick the innermost star per cluster to draw the radial line to the hub
const clusterAnchors = [3, 8, 12, 13, 18, 22, 25];

function ConstellationField({ time, complete, scale }: { time: number; complete: boolean; scale: number }) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const reveal = complete
    ? 1
    : animate({ start: 5.85, end: 7.2, ease: Easing.easeOutCubic })(time);
  const twinkleTime = complete ? DURATION : time;
  const hoverEnabled = reveal > 0.85;
  const activeStar = hoveredStar == null ? null : constellationStars[hoveredStar];
  const hubPulse = reveal * (0.6 + 0.4 * Math.sin(twinkleTime * 1.4));
  const hubReveal = complete
    ? 1
    : animate({ start: 6.4, end: 7.4, ease: Easing.easeOutCubic })(time);
  // Flowing dash offset for radial lines
  const flowOffset = twinkleTime * 28;

  // Responsive boost: when canvas is scaled down (mobile), enlarge elements
  // so they remain visible. At scale=1 (desktop), boost=1. At scale=0.2 (phone), boost≈2.5
  const boost = Math.max(1, Math.min(3, 1 / Math.sqrt(scale)));

  return (
    <div
      onTouchStart={(e) => {
        // Dismiss tooltip when tapping the background (not a star button)
        if ((e.target as HTMLElement).tagName !== 'BUTTON') {
          setHoveredStar(null);
        }
      }}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 6,
        opacity: reveal,
        pointerEvents: 'none',
      }}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <radialGradient id="egdesk-star-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="45%" stopColor={TEAL_SOFT} stopOpacity="0.72" />
            <stop offset="100%" stopColor={TEAL_SOFT} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="egdesk-hub-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={TEAL_SOFT} stopOpacity="0.18" />
            <stop offset="60%" stopColor={TEAL_SOFT} stopOpacity="0.06" />
            <stop offset="100%" stopColor={TEAL_SOFT} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="egdesk-agent-ring" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={TEAL_SOFT} stopOpacity="0" />
            <stop offset="65%" stopColor={TEAL_SOFT} stopOpacity="0.12" />
            <stop offset="100%" stopColor={TEAL_SOFT} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── Central hub glow ── */}
        <circle
          cx={HUB_X}
          cy={HUB_Y}
          r={140 * hubReveal}
          fill="url(#egdesk-hub-glow)"
          opacity={hubPulse * 0.7}
        />
        {/* Hub outer ring */}
        <circle
          cx={HUB_X}
          cy={HUB_Y}
          r={120}
          fill="none"
          stroke={TEAL_SOFT}
          strokeWidth={1.2 * boost}
          strokeOpacity={0.12 * hubReveal}
          strokeDasharray={`${6 * boost} ${10 * boost}`}
          strokeDashoffset={-flowOffset * 0.3}
        />
        {/* Hub inner ring */}
        <circle
          cx={HUB_X}
          cy={HUB_Y}
          r={80}
          fill="none"
          stroke={TEAL_SOFT}
          strokeWidth={0.8 * boost}
          strokeOpacity={0.08 * hubReveal}
          strokeDasharray={`${3 * boost} ${8 * boost}`}
          strokeDashoffset={flowOffset * 0.2}
        />

        {/* ── Radial lines from cluster anchors to hub ── */}
        {clusterAnchors.map((starIdx, i) => {
          const star = constellationStars[starIdx];
          const radialReveal = complete
            ? 1
            : animate({
                start: 6.3 + i * 0.08,
                end: 7.1 + i * 0.08,
                ease: Easing.easeOutCubic,
              })(time);
          // Shorten line: stop at hub ring edge
          const dx = HUB_X - star.x;
          const dy = HUB_Y - star.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const endX = star.x + dx * ((dist - 120) / dist);
          const endY = star.y + dy * ((dist - 120) / dist);
          const isGroupHovered =
            hoveredStar != null && constellationStars[hoveredStar].group === constellationStars[starIdx].group;

          return (
            <line
              key={`radial-${starIdx}`}
              x1={star.x}
              y1={star.y}
              x2={endX}
              y2={endY}
              stroke={TEAL_SOFT}
              strokeWidth={(isGroupHovered ? 1.8 : 1) * boost}
              strokeLinecap="round"
              strokeDasharray={`${4 * boost} ${14 * boost}`}
              strokeDashoffset={-flowOffset}
              strokeOpacity={(isGroupHovered ? 0.32 : 0.1) * radialReveal}
            />
          );
        })}

        {/* ── Cluster label text ── */}
        {constellationClusters.map((cluster, index) => {
          const labelReveal = complete
            ? 1
            : animate({
                start: 6.6 + index * 0.06,
                end: 7.2 + index * 0.06,
                ease: Easing.easeOutCubic,
              })(time);
          const isGroupHovered =
            hoveredStar != null && constellationStars[hoveredStar].group === index;

          return (
            <text
              key={`label-${index}`}
              x={cluster.cx + cluster.labelOffset.dx * boost}
              y={cluster.cy + cluster.labelOffset.dy * boost}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={TEAL_SOFT}
              fontFamily={MONO}
              fontSize={11 * boost}
              fontWeight="600"
              letterSpacing={2.5 * boost}
              opacity={(isGroupHovered ? 0.55 : 0.2) * labelReveal}
            >
              {cluster.label}
            </text>
          );
        })}

        {/* ── Network edges ── */}
        {constellationLines.map((edge, index) => {
          const s = constellationStars[edge.from];
          const e = constellationStars[edge.to];
          const isBridge = edge.kind === 'bridge';
          const lineReveal = complete
            ? 1
            : Math.max(
                0,
                Math.min(
                  1,
                  animate({
                    start: (isBridge ? 6.4 : 6) + index * 0.03,
                    end: (isBridge ? 7.0 : 6.5) + index * 0.03,
                  })(time),
                ),
              );
          const isActive = hoveredStar === edge.from || hoveredStar === edge.to;

          return (
            <line
              key={`edge-${edge.from}-${edge.to}`}
              x1={s.x}
              y1={s.y}
              x2={e.x}
              y2={e.y}
              stroke={TEAL_SOFT}
              strokeWidth={(isActive ? 2.2 : isBridge ? 0.8 : 1.4) * boost}
              strokeLinecap="round"
              strokeDasharray={isBridge ? `${6 * boost} ${14 * boost}` : undefined}
              strokeDashoffset={isBridge ? -flowOffset * 0.6 : undefined}
              strokeOpacity={(isActive ? 0.48 : isBridge ? 0.1 : 0.22) * lineReveal}
            />
          );
        })}

        {/* ── Agent nodes (ring + core + outer pulse) ── */}
        {constellationStars.map((star, index) => {
          const starReveal = complete
            ? 1
            : animate({
                start: 5.72 + star.delay,
                end: 6.38 + star.delay,
                ease: Easing.easeOutBack,
              })(time);
          const pulse = 0.74 + 0.26 * Math.sin(twinkleTime * 2.3 + index * 1.7);
          const radius = star.r * (0.7 + 0.3 * starReveal) * pulse * boost;
          const isHovered = hoveredStar === index;
          const ringRadius = (isHovered ? 16 : 10) * boost;
          const outerPulseRadius = ringRadius + 6 * boost + 4 * boost * Math.sin(twinkleTime * 1.6 + index * 2.1);

          return (
            <g key={`agent-${index}`}>
              {/* Ambient outer pulse ring */}
              <circle
                cx={star.x}
                cy={star.y}
                r={svgNumber(outerPulseRadius * starReveal)}
                fill="none"
                stroke={TEAL_SOFT}
                strokeWidth={0.6 * boost}
                opacity={0.12 * starReveal * pulse}
              />
              {/* Agent ring */}
              <circle
                cx={star.x}
                cy={star.y}
                r={svgNumber(ringRadius * starReveal)}
                fill="url(#egdesk-agent-ring)"
                stroke={TEAL_SOFT}
                strokeWidth={(isHovered ? 1.6 : 0.9) * boost}
                opacity={(isHovered ? 0.6 : 0.32) * starReveal}
              />
              {/* Core glow */}
              <circle
                cx={star.x}
                cy={star.y}
                r={svgNumber(isHovered ? radius * 10 : radius * 6)}
                fill="url(#egdesk-star-glow)"
                opacity={(isHovered ? 0.3 : 0.14) * starReveal}
              />
              {/* Core dot */}
              <circle
                cx={star.x}
                cy={star.y}
                r={svgNumber(isHovered ? radius * 1.6 : radius)}
                fill="#f7fbff"
                opacity={0.94 * starReveal}
              />
            </g>
          );
        })}
      </svg>

      {/* ── Hotspot buttons ── */}
      {constellationStars.map((star, index) => (
        <button
          key={`star-hotspot-${star.service}`}
          type="button"
          aria-label={star.service}
          onFocus={() => setHoveredStar(index)}
          onBlur={() => setHoveredStar(null)}
          onMouseEnter={() => setHoveredStar(index)}
          onMouseLeave={() => setHoveredStar(null)}
          onTouchStart={(e) => {
            e.preventDefault();
            setHoveredStar((prev) => (prev === index ? null : index));
          }}
          style={{
            position: 'absolute',
            left: star.x - 45,
            top: star.y - 45,
            width: 90,
            height: 90,
            border: 0,
            borderRadius: '50%',
            background: 'transparent',
            cursor: hoverEnabled ? 'help' : 'default',
            opacity: hoverEnabled ? 1 : 0,
            pointerEvents: hoverEnabled ? 'auto' : 'none',
            zIndex: 7,
          }}
        />
      ))}

      {/* ── Tooltip ── */}
      {activeStar ? (
        <div
          style={{
            position: 'absolute',
            left: activeStar.x,
            top: activeStar.y - 58 * boost,
            minWidth: 150 * boost,
            maxWidth: 300 * boost,
            padding: `${10 * boost}px ${16 * boost}px`,
            border: `${boost}px solid rgba(79, 227, 227, 0.36)`,
            borderRadius: 10 * boost,
            background: 'rgba(8, 13, 34, 0.9)',
            boxShadow: '0 12px 34px rgba(0, 0, 0, 0.42), 0 0 28px rgba(47, 224, 207, 0.14)',
            color: '#eef2fa',
            fontFamily: WORD_FONT,
            fontSize: 17 * boost,
            fontWeight: 800,
            lineHeight: 1.2,
            textAlign: 'center',
            transform: `translateX(${activeStar.x > WIDTH - 260 ? '-100%' : '-50%'})`,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 8,
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: 9 * boost,
              fontFamily: MONO,
              fontWeight: 600,
              letterSpacing: `${1.8 * boost}px`,
              color: TEAL_SOFT,
              marginBottom: 3 * boost,
              textTransform: 'uppercase',
            }}
          >
            {constellationClusters[activeStar.group]?.label ?? 'AGENT'}
          </span>
          {activeStar.service}
          <span
            style={{
              position: 'absolute',
              left: activeStar.x > WIDTH - 260 ? 'calc(100% - 18px)' : '50%',
              bottom: -6 * boost,
              width: 12 * boost,
              height: 12 * boost,
              background: 'rgba(8, 13, 34, 0.9)',
              borderRight: `${boost}px solid rgba(79, 227, 227, 0.36)`,
              borderBottom: `${boost}px solid rgba(79, 227, 227, 0.36)`,
              transform: 'translateX(-50%) rotate(45deg)',
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
type LetterMeasurement = {
  centers: number[];
  width: number;
};

const letters = [
  { character: 'E', teal: true },
  { character: 'G', teal: true },
  { character: 'D', teal: false },
  { character: 'e', teal: false },
  { character: 's', teal: false },
  { character: 'k', teal: false },
];

function EGDeskScene({ holdFinal = false }: { holdFinal?: boolean }) {
  const { time, complete, scale } = useTimeline();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [measurement, setMeasurement] = useState<LetterMeasurement | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const wrapper = wrapRef.current;
      if (!wrapper) return;

      const spans = Array.from(wrapper.querySelectorAll<HTMLElement>('[data-letter]'));
      if (!spans.length) return;

      setMeasurement({
        centers: spans.map((span) => span.offsetLeft + span.offsetWidth / 2),
        width: wrapper.offsetWidth,
      });
    };

    measure();
    document.fonts?.ready.then(measure);
    const id = window.setTimeout(measure, 350);
    window.addEventListener('resize', measure);

    return () => {
      window.clearTimeout(id);
      window.removeEventListener('resize', measure);
    };
  }, []);

  const stageOpacity =
    animate({ start: 0, end: 0.4 })(time) *
    (holdFinal ? 1 : animate({ from: 1, to: 0, start: 7.65, end: 8 })(time));
  const wmIntro = animate({ start: 0.2, end: 1.1, ease: Easing.easeOutCubic })(time);
  const gp = animate({ start: 2, end: 3.4, ease: Easing.easeInOutCubic })(time);
  const eop = animate({ from: 1, to: 0, start: 3.5, end: 4, ease: Easing.easeInCubic })(time);
  const egrow = animate({ start: 3.3, end: 3.95, ease: Easing.easeOutCubic })(time);
  const ebIntro = animate({ start: 0.1, end: 0.9, ease: Easing.easeOutCubic })(time);
  const ebOut = animate({ from: 1, to: 0, start: 2, end: 2.7, ease: Easing.easeInCubic })(time);
  const eyebrowOp = ebIntro * ebOut;
  const lockupP = animate({ start: 4.95, end: 5.7, ease: Easing.easeOutCubic })(time);

  const groupShift = measurement ? (measurement.width / 2 - measurement.centers[0]) * gp : 0;
  const introY = (1 - wmIntro) * 24;
  const cy = 540;
  const iconSize = 300;

  return (
    <div
      data-screen-label={`EGDesk ${Math.floor(time)}s`}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: NAVY_BG,
        opacity: stageOpacity,
        fontFamily: WORD_FONT,
      }}
    >
      <ConstellationField time={time} complete={complete} scale={scale} />
      <BgWatermark time={time} />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: cy - 132,
          transform: `translate(-50%, ${introY}px)`,
          color: TEAL,
          fontFamily: MONO,
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: '0.42em',
          textTransform: 'uppercase',
          paddingLeft: '0.42em',
          whiteSpace: 'nowrap',
          opacity: eyebrowOp,
        }}
      >
        Local AI Server
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          ref={wrapRef}
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'baseline',
            fontFamily: WORD_FONT,
            fontSize: 152,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            whiteSpace: 'pre',
            transform: `translate(${groupShift}px, ${introY}px)`,
          }}
        >
          {letters.map((letter, index) => {
            let tx = 0;
            let scale = 1;
            let opacity = 1;

            if (measurement && index > 0) {
              const reverseIndex = letters.length - 1 - index;
              const start = 2 + reverseIndex * 0.1;
              const collapseP = animate({
                start,
                end: start + 0.55,
                ease: Easing.easeInOutCubic,
              })(time);

              tx = (measurement.centers[0] - measurement.centers[index]) * collapseP;
              scale = 1 - 0.82 * collapseP;
              opacity = 1 - collapseP;
            }

            if (index === 0) scale = 1 + 0.62 * egrow;

            const finalOpacity = index === 0 ? wmIntro * eop : wmIntro * opacity;

            return (
              <span
                key={`${letter.character}-${index}`}
                data-letter
                style={{
                  display: 'inline-block',
                  color: letter.teal ? TEAL : '#eef2fa',
                  transform: `translateX(${tx}px) scale(${scale})`,
                  transformOrigin: 'center',
                  opacity: finalOpacity,
                  willChange: 'transform, opacity',
                }}
              >
                {letter.character}
              </span>
            );
          })}
        </div>
      </div>

      <EGIcon size={iconSize} time={time} originY={-52 * lockupP} />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: cy + 100,
          transform: `translate(-50%, ${(1 - lockupP) * 14}px)`,
          opacity: lockupP,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: WORD_FONT,
            fontWeight: 800,
            fontSize: 44,
            letterSpacing: '-0.02em',
          }}
        >
          <span style={{ color: TEAL }}>EG</span>
          <span style={{ color: '#eef2fa' }}>Desk</span>
        </div>
        <div
          style={{
            marginTop: 11,
            color: '#8b93ad',
            fontFamily: WORD_FONT,
            fontWeight: 500,
            fontSize: 19,
          }}
        >
          Turn any PC into a self-hosted AI server.
        </div>
      </div>
    </div>
  );
}

type EGDeskCollapseAnimationProps = {
  className?: string;
  style?: CSSProperties;
  loop?: boolean;
  showActions?: boolean;
  downloadHref?: string;
  loginHref?: string;
};

export default function EGDeskCollapseAnimation({
  className,
  style,
  loop = true,
  showActions = false,
  downloadHref = '/download/latest',
  loginHref = '/login',
}: EGDeskCollapseAnimationProps) {
  const holdFinal = !loop;

  return (
    <div
      className={className}
      aria-label="EGDesk wordmark collapsing into the app icon"
      style={{
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        ...style,
      }}
    >
      <Stage loop={loop}>
        <EGDeskScene holdFinal={holdFinal} />
        {showActions ? (
          <TimelineContext.Consumer>
            {({ complete }) => (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 770,
                  display: 'flex',
                  gap: 18,
                  transform: `translate(-50%, ${complete ? 0 : 18}px)`,
                  opacity: complete ? 1 : 0,
                  pointerEvents: complete ? 'auto' : 'none',
                  transition: 'opacity 420ms ease, transform 420ms ease',
                  zIndex: 10,
                }}
              >
                <a
                  href={downloadHref}
                  style={{
                    minWidth: 220,
                    minHeight: 58,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                    color: '#000',
                    fontFamily: WORD_FONT,
                    fontSize: 21,
                    fontWeight: 800,
                    textDecoration: 'none',
                    boxShadow: '0 0 28px rgba(0, 242, 254, 0.36)',
                  }}
                >
                  EGDesk 다운로드
                </a>
                <a
                  href={loginHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    minWidth: 190,
                    minHeight: 58,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    border: '1px solid rgba(255, 255, 255, 0.24)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#eef2fa',
                    fontFamily: WORD_FONT,
                    fontSize: 21,
                    fontWeight: 800,
                    textDecoration: 'none',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  웹 로그인
                </a>
              </div>
            )}
          </TimelineContext.Consumer>
        ) : null}
      </Stage>
    </div>
  );
}
