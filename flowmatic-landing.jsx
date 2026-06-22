import { useState, useEffect, useRef } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:         "#080810",
  bgDeep:     "#050508",
  surface:    "#0F1117",
  card:       "#12141C",
  cardHover:  "#161921",
  border:     "#1E2235",
  borderHi:   "#0EA5E9",
  accent:     "#0EA5E9",
  accentSoft: "#38BDF8",
  accentGlow: "rgba(14,165,233,0.15)",
  accentDim:  "rgba(14,165,233,0.08)",
  text:       "#F1F5F9",
  muted:      "#64748B",
  subtle:     "#334155",
  success:    "#10B981",
};

const ease = [0.22, 1, 0.36, 1];

// ─── Utility: Scroll-triggered fade ──────────────────────────────────────────
function Reveal({ children, delay = 0, y = 24, style = {}, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      style={style}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── Noise Texture ────────────────────────────────────────────────────────────
function Noise() {
  return (
    <svg style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:100, opacity:0.03 }}>
      <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
      <rect width="100%" height="100%" filter="url(#n)"/>
    </svg>
  );
}

// ─── Animated Pipeline (Hero Signature) ──────────────────────────────────────
const PIPELINE_NODES = [
  { id:"trigger", label:"Webhook", icon:"⚡", x:10, y:42, color:"#7C3AED" },
  { id:"parse",   label:"Parse",   icon:"⚙", x:35, y:18, color:T.accent },
  { id:"enrich",  label:"Enrich",  icon:"✦", x:35, y:66, color:T.accentSoft },
  { id:"route",   label:"Route",   icon:"⬡", x:62, y:42, color:"#F59E0B" },
  { id:"email",   label:"Email",   icon:"✉", x:85, y:22, color:T.success },
  { id:"slack",   label:"Slack",   icon:"#", x:85, y:62, color:"#818CF8" },
];

const PIPELINE_EDGES = [
  ["trigger","parse"], ["trigger","enrich"],
  ["parse","route"], ["enrich","route"],
  ["route","email"], ["route","slack"],
];

function Pipeline() {
  const [tick, setTick] = useState(0);
  const [activeEdge, setActiveEdge] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
      setActiveEdge(e => (e + 1) % PIPELINE_EDGES.length);
    }, 900);
    return () => clearInterval(id);
  }, []);

  const W = 320, H = 220;
  const nx = pct => (pct / 100) * W;
  const ny = pct => (pct / 100) * H;

  return (
    <div style={{ position:"relative", width:W, height:H, userSelect:"none" }}>
      <svg width={W} height={H} style={{ position:"absolute", inset:0 }}>
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={T.border} />
          </marker>
          <marker id="arrow-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={T.accent} />
          </marker>
        </defs>
        {PIPELINE_EDGES.map(([from, to], i) => {
          const s = PIPELINE_NODES.find(n => n.id === from);
          const e = PIPELINE_NODES.find(n => n.id === to);
          const isActive = i === activeEdge;
          const x1 = nx(s.x), y1 = ny(s.y), x2 = nx(e.x), y2 = ny(e.y);
          const mx = (x1 + x2) / 2;
          return (
            <g key={i}>
              <path
                d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                fill="none" stroke={T.border} strokeWidth="1.5"
                markerEnd="url(#arrow)"
              />
              {isActive && (
                <motion.path
                  d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                  fill="none" stroke={T.accent} strokeWidth="2"
                  strokeDasharray="80" strokeDashoffset="80"
                  animate={{ strokeDashoffset: [80, 0] }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                  markerEnd="url(#arrow-active)"
                />
              )}
              {isActive && (
                <motion.circle r="4" fill={T.accent}
                  style={{ filter:`drop-shadow(0 0 6px ${T.accent})` }}
                  animate={{ offsetDistance:["0%","100%"] }}
                  style={{ offsetPath:`path('M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}')` }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                />
              )}
            </g>
          );
        })}
      </svg>
      {PIPELINE_NODES.map(node => {
        const isActive = PIPELINE_EDGES[activeEdge]?.includes(node.id);
        return (
          <motion.div
            key={node.id}
            animate={{ boxShadow: isActive ? `0 0 20px ${node.color}55, 0 0 0 1px ${node.color}` : `0 0 0 1px ${T.border}` }}
            transition={{ duration: 0.3 }}
            style={{
              position:"absolute",
              left: `${node.x}%`, top: `${node.y}%`,
              transform:"translate(-50%,-50%)",
              background: T.card,
              border:`1px solid ${isActive ? node.color : T.border}`,
              borderRadius:12,
              padding:"8px 12px",
              display:"flex", alignItems:"center", gap:6,
              minWidth:80,
              transition:"border-color 0.3s",
            }}
          >
            <span style={{ fontSize:13 }}>{node.icon}</span>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11.5, fontWeight:600, color: isActive ? T.text : T.muted, whiteSpace:"nowrap" }}>
              {node.label}
            </span>
            {isActive && (
              <motion.div
                initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}
                style={{ width:6, height:6, borderRadius:"50%", background:node.color, marginLeft:2,
                  boxShadow:`0 0 8px ${node.color}` }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.nav
      initial={{ opacity:0, y:-16 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.6, ease }}
      style={{
        position:"fixed", top:0, left:0, right:0, zIndex:50,
        height:60,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 max(20px, calc((100vw - 1200px)/2))",
        background: scrolled ? "rgba(8,8,16,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        borderBottom: `1px solid ${scrolled ? T.border : "transparent"}`,
        transition:"all 0.35s ease",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{
          width:30, height:30, borderRadius:8,
          background:`linear-gradient(135deg, ${T.accent}, #0284C7)`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="white" fillOpacity="0.95"/>
            <path d="M7 4L10 5.75V9.25L7 11L4 9.25V5.75L7 4Z" fill="white" fillOpacity="0.35"/>
          </svg>
        </div>
        <span style={{ fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:15, color:T.text, letterSpacing:"-0.025em" }}>
          Flow<span style={{ color:T.accentSoft }}>matic</span>
        </span>
      </div>

      <div style={{ display:"flex", gap:28, alignItems:"center" }} className="nav-links">
        {["Product","Docs","Pricing","Blog"].map(l => (
          <a key={l} href="#" style={{ fontFamily:"'Inter',sans-serif", fontSize:13.5, color:T.muted, textDecoration:"none", fontWeight:450, transition:"color 0.2s" }}
            onMouseEnter={e=>e.target.style.color=T.text}
            onMouseLeave={e=>e.target.style.color=T.muted}>{l}</a>
        ))}
      </div>

      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        <a href="#" style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:T.muted, textDecoration:"none" }}>Log in</a>
        <Btn small>Start free →</Btn>
      </div>
    </motion.nav>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
function Btn({ children, small=false, ghost=false, onClick }) {
  const [h, setH] = useState(false);
  return (
    <motion.button whileTap={{ scale:0.97 }}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} onClick={onClick}
      style={{
        fontFamily:"'Inter',sans-serif", fontWeight:600,
        fontSize: small ? 13 : 14.5,
        padding: small ? "8px 16px" : "12px 26px",
        borderRadius:8,
        border: ghost ? `1px solid ${h ? T.accentSoft : T.border}` : "none",
        background: ghost
          ? (h ? "rgba(14,165,233,0.08)" : "transparent")
          : (h ? `linear-gradient(135deg, #38BDF8, #0284C7)` : `linear-gradient(135deg, ${T.accent}, #0369A1)`),
        color: T.text,
        cursor:"pointer",
        letterSpacing:"-0.01em",
        transition:"all 0.2s ease",
        whiteSpace:"nowrap",
        boxShadow: (!ghost && h) ? `0 0 28px rgba(14,165,233,0.4)` : "none",
      }}>
      {children}
    </motion.button>
  );
}

// ─── Chip / Eyebrow ───────────────────────────────────────────────────────────
function Chip({ children }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:7,
      fontFamily:"'Inter',sans-serif", fontSize:11.5, fontWeight:700,
      letterSpacing:"0.07em", textTransform:"uppercase",
      color:T.accentSoft,
      padding:"5px 13px", borderRadius:100,
      background:"rgba(14,165,233,0.1)",
      border:`1px solid rgba(56,189,248,0.22)`,
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:T.accentSoft }}/>
      {children}
    </span>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target:ref, offset:["start start","end start"] });
  const yText = useTransform(scrollYProgress, [0,1], [0, 80]);
  const opText = useTransform(scrollYProgress, [0,0.6], [1, 0]);

  return (
    <section ref={ref} style={{
      position:"relative", minHeight:"100vh",
      display:"flex", alignItems:"center",
      padding:"100px max(20px, calc((100vw - 1200px)/2)) 60px",
      overflow:"hidden",
    }}>
      {/* Background beams */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <motion.div
          animate={{ opacity:[0.6,1,0.6] }}
          transition={{ duration:6, repeat:Infinity }}
          style={{
            position:"absolute", top:"-20%", left:"30%",
            width:800, height:800, borderRadius:"50%",
            background:`radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 65%)`,
            filter:"blur(40px)",
          }}
        />
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`linear-gradient(${T.border}28 1px, transparent 1px), linear-gradient(90deg, ${T.border}28 1px, transparent 1px)`,
          backgroundSize:"48px 48px",
          maskImage:"radial-gradient(ellipse 70% 70% at 50% 40%, black 20%, transparent 100%)",
        }}/>
      </div>

      <motion.div style={{ y:yText, opacity:opText, position:"relative", zIndex:1, width:"100%",
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:40, flexWrap:"wrap" }}>

        {/* Left: Copy */}
        <div style={{ flex:"1 1 480px", maxWidth:580 }}>
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, ease, delay:0.05 }}
            style={{ marginBottom:24 }}>
            <Chip>Automation Infrastructure</Chip>
          </motion.div>

          <motion.h1
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, ease, delay:0.12 }}
            style={{
              fontFamily:"'Inter',sans-serif", fontWeight:900,
              fontSize:"clamp(36px, 5.5vw, 68px)",
              lineHeight:1.04, letterSpacing:"-0.045em",
              color:T.text, margin:"0 0 20px",
            }}>
            Automate every<br/>
            <span style={{ background:`linear-gradient(105deg, ${T.accentSoft} 0%, #7DD3FC 45%, ${T.text} 100%)`,
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              workflow
            </span>{" "}in minutes.
          </motion.h1>

          <motion.p
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, ease, delay:0.2 }}
            style={{
              fontFamily:"'Inter',sans-serif", fontSize:"clamp(15px, 1.8vw, 18px)",
              color:T.muted, lineHeight:1.7, maxWidth:480, marginBottom:36,
            }}>
            Connect any app, trigger any action, and run intelligent AI workflows—without writing a single line of code.
          </motion.p>

          <motion.div
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, ease, delay:0.3 }}
            style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:40 }}>
            <Btn>Start free — no card needed</Btn>
            <Btn ghost>See a live demo</Btn>
          </motion.div>

          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.8, delay:0.45 }}
            style={{ display:"flex", alignItems:"center", gap:24, flexWrap:"wrap" }}>
            {[["12,000+","workflows automated today"],["99.97%","uptime SLA"],["< 50ms","median latency"]].map(([v,l]) => (
              <div key={l} style={{ borderLeft:`2px solid ${T.border}`, paddingLeft:14 }}>
                <div style={{ fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:18, color:T.text, letterSpacing:"-0.03em" }}>{v}</div>
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:T.muted }}>{l}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: Live Pipeline */}
        <motion.div
          initial={{ opacity:0, scale:0.94 }} animate={{ opacity:1, scale:1 }}
          transition={{ duration:0.9, ease, delay:0.35 }}
          style={{ flex:"1 1 320px", display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
          <div style={{
            background:T.card,
            border:`1px solid ${T.border}`,
            borderRadius:20,
            padding:"28px 24px",
            boxShadow:`0 0 80px rgba(14,165,233,0.08), inset 0 1px 0 rgba(255,255,255,0.04)`,
            position:"relative", overflow:"hidden",
          }}>
            <div style={{
              position:"absolute", top:0, left:0, right:0,
              background:`linear-gradient(90deg, transparent, ${T.accentGlow}, transparent)`,
              height:1,
            }}/>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:700, color:T.muted,
              letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:20 }}>
              Live workflow · 3 runs/sec
            </div>
            <Pipeline />
            <div style={{ marginTop:20, display:"flex", gap:8, alignItems:"center" }}>
              <motion.div animate={{ opacity:[1,0.4,1] }} transition={{ duration:1.2, repeat:Infinity }}
                style={{ width:8, height:8, borderRadius:"50%", background:T.success }}/>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:T.muted }}>Running · Last triggered 0.8s ago</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:160,
        background:`linear-gradient(to bottom, transparent, ${T.bg})`, pointerEvents:"none", zIndex:2 }}/>
    </section>
  );
}

// ─── Logo Ticker ──────────────────────────────────────────────────────────────
const LOGOS = ["Notion","Linear","Vercel","Supabase","Stripe","GitHub","Figma","Resend","Loom","Clerk"];

function Logos() {
  return (
    <section style={{ padding:"0 0 80px", overflow:"hidden" }}>
      <Reveal style={{ textAlign:"center", marginBottom:28 }}>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:700, color:T.subtle,
          letterSpacing:"0.1em", textTransform:"uppercase" }}>Connects with your entire stack</p>
      </Reveal>
      <div style={{ position:"relative" }}>
        <motion.div
          animate={{ x:["0%","-50%"] }}
          transition={{ duration:28, repeat:Infinity, ease:"linear" }}
          style={{ display:"flex", gap:56, width:"max-content" }}>
          {[...LOGOS,...LOGOS].map((l,i)=>(
            <span key={i} style={{ fontFamily:"'Inter',sans-serif", fontSize:16, fontWeight:700,
              color:T.subtle, letterSpacing:"-0.02em", opacity:0.5, whiteSpace:"nowrap" }}>{l}</span>
          ))}
        </motion.div>
        <div style={{ position:"absolute", inset:0,
          background:`linear-gradient(90deg, ${T.bg}, transparent 12%, transparent 88%, ${T.bg})`,
          pointerEvents:"none" }}/>
      </div>
    </section>
  );
}

// ─── Feature Cards (Interactive) ──────────────────────────────────────────────
const FEATURES = [
  {
    icon:"⚡",
    title:"Event-Driven Triggers",
    body:"Webhooks, schedules, email inboxes, database changes—any signal becomes the start of a workflow.",
    color:"#F59E0B",
    wide:true,
    demo:(
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:4 }}>
        {[["Webhook received","2ms ago","#10B981"],["Schedule fired","1m ago","#0EA5E9"],["DB row inserted","4m ago","#F59E0B"]].map(([label,time,c])=>(
          <div key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 12px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:c, boxShadow:`0 0 6px ${c}` }}/>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:T.text }}>{label}</span>
            </div>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:T.muted }}>{time}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon:"🤖",
    title:"AI-Powered Steps",
    body:"Call GPT-4o, Claude, or Gemini mid-workflow. Extract, classify, generate, and decide—all in the flow.",
    color:"#A78BFA",
    demo:(
      <div style={{ background:"rgba(167,139,250,0.06)", border:`1px solid rgba(167,139,250,0.2)`,
        borderRadius:10, padding:"12px 14px", marginTop:4,
        fontFamily:"'Inter',sans-serif", fontSize:12, color:T.muted, lineHeight:1.6 }}>
        <span style={{ color:"#A78BFA", fontWeight:700 }}>AI Step</span> · Classify intent{"\n"}
        <span style={{ display:"block", marginTop:4, color:T.text }}>→ "Support request" (94% confidence)</span>
        <span style={{ display:"block", marginTop:2, color:T.text }}>→ Routed to <span style={{ color:"#A78BFA" }}>support--queue</span></span>
      </div>
    ),
  },
  {
    icon:"🔀",
    title:"Branching & Logic",
    body:"If/else, loops, merge, delay—build complex control flow visually without a single if statement.",
    color:T.accent,
    demo:(
      <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:T.muted, marginTop:4 }}>
        {["IF value > 1000","  → High-value path","ELSE","  → Standard path","MERGE","  → Notify team"].map((line,i)=>(
          <div key={i} style={{ padding:"3px 0",
            color: line.startsWith("IF") || line.startsWith("ELSE") || line.startsWith("MERGE") ? T.accentSoft : T.muted,
            fontFamily:"'Courier New',monospace", fontSize:11.5 }}>{line}</div>
        ))}
      </div>
    ),
  },
  {
    icon:"📊",
    title:"Observability Built In",
    body:"Every run logged. Every step inspectable. Trace failures, replay runs, and debug in seconds.",
    color:T.success,
    wide:true,
    demo:(
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:4 }}>
        {[["Runs today","14,832","↑ 12%",T.success],["Errors","3","↓ 80%",T.success],["P99 latency","148ms","stable",T.accentSoft],["Queue depth","0","healthy",T.success]].map(([k,v,d,c])=>(
          <div key={k} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`,
            borderRadius:8, padding:"10px 12px" }}>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:T.muted, marginBottom:4 }}>{k}</div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:18, fontWeight:800, color:T.text, letterSpacing:"-0.03em" }}>{v}</div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:c }}>{d}</div>
          </div>
        ))}
      </div>
    ),
  },
];

function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once:true, margin:"-60px" });
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x:0, y:0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity:0, y:28 }}
      animate={inView ? { opacity:1, y:0 } : {}}
      transition={{ duration:0.65, ease, delay: index * 0.08 }}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      onMouseMove={handleMouseMove}
      style={{
        gridColumn: feature.wide ? "span 2" : "span 1",
        position:"relative", overflow:"hidden",
        background: hovered ? T.cardHover : T.card,
        border:`1px solid ${hovered ? feature.color+"55" : T.border}`,
        borderRadius:20,
        padding:"28px 28px 32px",
        transition:"all 0.3s ease",
        cursor:"default",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? `0 12px 48px rgba(0,0,0,0.4), 0 0 0 1px ${feature.color}22` : "none",
      }}
      className="feature-card"
    >
      {/* Spotlight */}
      {hovered && (
        <div style={{
          position:"absolute", pointerEvents:"none",
          width:300, height:300, borderRadius:"50%",
          background:`radial-gradient(circle, ${feature.color}18 0%, transparent 70%)`,
          left: mousePos.x - 150, top: mousePos.y - 150,
          transition:"none",
        }}/>
      )}
      <div style={{ position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14, gap:12 }}>
          <div style={{
            width:40, height:40, borderRadius:10,
            background:`${feature.color}18`,
            border:`1px solid ${feature.color}33`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:20, flexShrink:0,
          }}>{feature.icon}</div>
          <div style={{
            fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:700,
            color:feature.color, letterSpacing:"0.06em", textTransform:"uppercase",
            marginTop:4,
          }}>Feature</div>
        </div>
        <h3 style={{ fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:19, color:T.text,
          letterSpacing:"-0.025em", marginBottom:8 }}>{feature.title}</h3>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:14, color:T.muted, lineHeight:1.65, marginBottom:16 }}>{feature.body}</p>
        {feature.demo}
      </div>
    </motion.div>
  );
}

function Features() {
  return (
    <section style={{ padding:"80px max(20px, calc((100vw - 1200px)/2))" }}>
      <Reveal style={{ textAlign:"center", marginBottom:56 }}>
        <div style={{ marginBottom:16 }}><Chip>Platform</Chip></div>
        <h2 style={{ fontFamily:"'Inter',sans-serif", fontWeight:900, fontSize:"clamp(28px, 4vw, 48px)",
          color:T.text, letterSpacing:"-0.04em", marginBottom:14 }}>
          Everything your workflows need.
        </h2>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:17, color:T.muted, maxWidth:480, margin:"0 auto" }}>
          Built for teams that move fast and need reliability at every step.
        </p>
      </Reveal>
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(2, 1fr)",
        gap:16,
      }} className="feature-grid">
        {FEATURES.map((f,i)=><FeatureCard key={f.title} feature={f} index={i}/>)}
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name:"Starter", price:{ monthly:"$0", yearly:"$0" }, tag:"Free forever",
    desc:"For individuals and side projects exploring automation.",
    feats:["500 workflow runs/mo","5 active workflows","Community support","Basic triggers","7-day log retention"],
    cta:"Get started free", hi:false,
  },
  {
    name:"Pro", price:{ monthly:"$49", yearly:"$39" }, tag:"per month",
    desc:"For teams shipping real products that depend on automation.",
    feats:["50,000 workflow runs/mo","Unlimited workflows","AI steps included","Priority support","90-day log retention","Custom webhooks"],
    cta:"Start 14-day trial →", hi:true,
  },
  {
    name:"Scale", price:{ monthly:"$199", yearly:"$159" }, tag:"per month",
    desc:"For companies where automation is critical infrastructure.",
    feats:["Unlimited runs","Dedicated infra","SSO & audit logs","SLA guarantee","Custom AI models","White-glove onboarding"],
    cta:"Talk to sales", hi:false,
  },
];

function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section style={{ padding:"80px max(20px, calc((100vw - 1200px)/2))" }}>
      <Reveal style={{ textAlign:"center", marginBottom:48 }}>
        <div style={{ marginBottom:16 }}><Chip>Pricing</Chip></div>
        <h2 style={{ fontFamily:"'Inter',sans-serif", fontWeight:900, fontSize:"clamp(28px, 4vw, 48px)",
          color:T.text, letterSpacing:"-0.04em", marginBottom:16 }}>
          Pay for what you use.
        </h2>
        {/* Toggle */}
        <div style={{ display:"inline-flex", alignItems:"center", gap:12,
          background:T.card, border:`1px solid ${T.border}`, borderRadius:100, padding:"6px 8px" }}>
          {["Monthly","Yearly"].map(opt=>(
            <button key={opt} onClick={()=>setYearly(opt==="Yearly")}
              style={{
                fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:600,
                padding:"7px 18px", borderRadius:100, border:"none", cursor:"pointer",
                background: (yearly===(opt==="Yearly")) ? `linear-gradient(135deg,${T.accent},#0284C7)` : "transparent",
                color: (yearly===(opt==="Yearly")) ? T.text : T.muted,
                transition:"all 0.25s",
              }}>
              {opt} {opt==="Yearly" && <span style={{ color: yearly ? "#BAE6FD" : T.subtle, fontSize:11 }}>save 20%</span>}
            </button>
          ))}
        </div>
      </Reveal>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:20, alignItems:"start" }}>
        {PLANS.map((plan,i)=>(
          <Reveal key={plan.name} delay={i*0.08}>
            <div style={{
              background: plan.hi ? `linear-gradient(160deg, #0C1628 0%, #0F1117 100%)` : T.card,
              border:`1px solid ${plan.hi ? T.accent : T.border}`,
              borderRadius:22,
              padding:"32px 28px",
              position:"relative", overflow:"hidden",
              boxShadow: plan.hi ? `0 0 60px rgba(14,165,233,0.12)` : "none",
            }}>
              {plan.hi && <div style={{
                position:"absolute", top:0, left:0, right:0, height:1,
                background:`linear-gradient(90deg, transparent, ${T.accent}, transparent)`,
              }}/>}
              {plan.hi && <div style={{
                position:"absolute", top:-1, left:"50%", transform:"translateX(-50%)",
                fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:700,
                letterSpacing:"0.07em", textTransform:"uppercase",
                background:`linear-gradient(90deg, ${T.accent}, ${T.accentSoft})`,
                color:"#fff", padding:"4px 16px", borderRadius:"0 0 10px 10px",
              }}>MOST POPULAR</div>}

              <div style={{ fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:15,
                color: plan.hi ? T.accentSoft : T.muted, marginBottom:8 }}>{plan.name}</div>
              <AnimatePresence mode="wait">
                <motion.div key={yearly?"y":"m"}
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                  transition={{ duration:0.2 }}
                  style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:8 }}>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontWeight:900, fontSize:42,
                    color:T.text, letterSpacing:"-0.05em" }}>
                    {yearly ? plan.price.yearly : plan.price.monthly}
                  </span>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:T.muted }}>{plan.tag}</span>
                </motion.div>
              </AnimatePresence>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13.5, color:T.muted, lineHeight:1.6, marginBottom:24 }}>{plan.desc}</p>
              <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:22, marginBottom:24 }}>
                {plan.feats.map(f=>(
                  <div key={f} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:12 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, marginTop:1 }}>
                      <circle cx="8" cy="8" r="7" fill={`${T.accent}20`}/>
                      <path d="M5 8L7 10L11 6" stroke={T.accentSoft} strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontFamily:"'Inter',sans-serif", fontSize:13.5, color:T.text }}>{f}</span>
                  </div>
                ))}
              </div>
              <Btn ghost={!plan.hi}>{plan.cta}</Btn>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  { q:"How does the free plan work?", a:"The Starter plan is free forever—no credit card required. You get 500 workflow runs per month, 5 active workflows, and access to all core triggers. Upgrade any time." },
  { q:"What counts as a workflow run?", a:"A single end-to-end execution of any workflow counts as one run. If a workflow has 10 steps and runs once, that's 1 run. Branching logic that's not taken doesn't count." },
  { q:"Can I use my own AI API keys?", a:"Yes. On Pro and Scale plans you can bring your own OpenAI, Anthropic, or Google API key. We also provide bundled AI credits so you don't have to manage keys at all." },
  { q:"How does billing work?", a:"Starter is always free. Pro and Scale are billed monthly or yearly. Yearly billing saves 20%. We prorate upgrades and downgrades automatically." },
  { q:"Is there a self-hosted option?", a:"Yes—Scale customers can request a private cloud deployment. Full self-hosted (on your own infra) is available for enterprise contracts. Contact sales for details." },
  { q:"What's your uptime SLA?", a:"We guarantee 99.97% uptime for Pro and Scale. Starter is best-effort. We publish our live status and incident history at status.flowmatic.io." },
];

function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section style={{ padding:"80px max(20px, calc((100vw - 1200px)/2))" }}>
      <Reveal style={{ textAlign:"center", marginBottom:56 }}>
        <div style={{ marginBottom:16 }}><Chip>FAQ</Chip></div>
        <h2 style={{ fontFamily:"'Inter',sans-serif", fontWeight:900, fontSize:"clamp(28px, 4vw, 48px)",
          color:T.text, letterSpacing:"-0.04em" }}>
          Questions, answered.
        </h2>
      </Reveal>
      <div style={{ maxWidth:720, margin:"0 auto", display:"flex", flexDirection:"column", gap:0 }}>
        {FAQS.map((faq,i)=>(
          <Reveal key={faq.q} delay={i*0.05}>
            <div style={{
              borderBottom:`1px solid ${T.border}`,
              overflow:"hidden",
            }}>
              <button
                onClick={()=>setOpen(open===i ? null : i)}
                style={{
                  width:"100%", background:"none", border:"none", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"22px 0", gap:16, textAlign:"left",
                }}>
                <span style={{ fontFamily:"'Inter',sans-serif", fontWeight:650, fontSize:16,
                  color: open===i ? T.text : T.text, letterSpacing:"-0.01em" }}>{faq.q}</span>
                <motion.div
                  animate={{ rotate: open===i ? 45 : 0 }}
                  transition={{ duration:0.25, ease }}
                  style={{ flexShrink:0, width:22, height:22, borderRadius:6,
                    background: open===i ? `${T.accent}22` : T.card,
                    border:`1px solid ${open===i ? T.accent : T.border}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color: open===i ? T.accentSoft : T.muted,
                    fontSize:16, lineHeight:1, transition:"background 0.25s, border-color 0.25s",
                  }}>+</motion.div>
              </button>
              <AnimatePresence>
                {open===i && (
                  <motion.div
                    key="answer"
                    initial={{ height:0, opacity:0 }}
                    animate={{ height:"auto", opacity:1 }}
                    exit={{ height:0, opacity:0 }}
                    transition={{ duration:0.3, ease }}
                    style={{ overflow:"hidden" }}>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:15, color:T.muted,
                      lineHeight:1.7, paddingBottom:22, paddingRight:40 }}>{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─── Contact Form ─────────────────────────────────────────────────────────────
function Contact() {
  const [form, setForm] = useState({ name:"", email:"", company:"", message:"" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const set = k => e => setForm(f => ({...f, [k]:e.target.value}));

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1400);
  };

  const inputStyle = {
    width:"100%", fontFamily:"'Inter',sans-serif", fontSize:14,
    color:T.text, background:T.surface,
    border:`1px solid ${T.border}`, borderRadius:10,
    padding:"13px 16px", outline:"none",
    transition:"border-color 0.2s",
  };

  return (
    <section style={{ padding:"80px max(20px, calc((100vw - 1200px)/2)) 120px" }}>
      <div style={{
        display:"grid", gridTemplateColumns:"1fr 1fr", gap:60,
        alignItems:"center", flexWrap:"wrap",
      }} className="contact-grid">
        <Reveal>
          <div style={{ marginBottom:16 }}><Chip>Contact</Chip></div>
          <h2 style={{ fontFamily:"'Inter',sans-serif", fontWeight:900, fontSize:"clamp(28px, 3.5vw, 44px)",
            color:T.text, letterSpacing:"-0.04em", marginBottom:16 }}>
            Let's talk about<br/>your workflows.
          </h2>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:16, color:T.muted, lineHeight:1.7, marginBottom:32 }}>
            Whether you're exploring automation for the first time or migrating from another platform—we'll help you find the right path.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {[["🗓","30-min intro call","No obligation, just clarity"],["⚡","Same-day response","We reply to every message"],["🔐","Enterprise ready","SOC 2 Type II · SSO · Custom SLA"]].map(([icon,title,sub])=>(
              <div key={title} style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:`${T.accent}14`,
                  border:`1px solid ${T.border}`, display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:14, color:T.text }}>{title}</div>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12.5, color:T.muted }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div style={{
            background:T.card, border:`1px solid ${T.border}`,
            borderRadius:22, padding:"36px 32px",
            boxShadow:`0 0 60px rgba(0,0,0,0.3)`,
            position:"relative", overflow:"hidden",
          }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1,
              background:`linear-gradient(90deg, transparent, ${T.accentGlow}, transparent)` }}/>

            <AnimatePresence mode="wait">
              {!sent ? (
                <motion.div key="form" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                    {[["name","Name","Your name"],["email","Email","you@company.com"]].map(([k,l,ph])=>(
                      <div key={k}>
                        <label style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600,
                          color:T.muted, display:"block", marginBottom:6 }}>{l}</label>
                        <input placeholder={ph} value={form[k]} onChange={set(k)}
                          style={inputStyle}
                          onFocus={e=>e.target.style.borderColor=T.accent}
                          onBlur={e=>e.target.style.borderColor=T.border}/>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600,
                      color:T.muted, display:"block", marginBottom:6 }}>Company (optional)</label>
                    <input placeholder="Acme Corp" value={form.company} onChange={set("company")}
                      style={inputStyle}
                      onFocus={e=>e.target.style.borderColor=T.accent}
                      onBlur={e=>e.target.style.borderColor=T.border}/>
                  </div>
                  <motion.button
                    whileTap={{ scale:0.97 }}
                    onClick={handleSubmit}
                    style={{
                      width:"100%", fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:15,
                      padding:"14px", borderRadius:10, border:"none", cursor:"pointer",
                      background: sending ? T.surface : `linear-gradient(135deg, ${T.accent}, #0369A1)`,
                      color:T.text, transition:"all 0.3s",
                      boxShadow: sending ? "none" : `0 4px 24px rgba(14,165,233,0.3)`,
                      letterSpacing:"-0.01em",
                    }}>
                    {sending ? (
                      <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                        <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:"linear" }}
                          style={{ width:14, height:14, borderRadius:"50%",
                            border:`2px solid ${T.border}`, borderTopColor:T.accent }}/>
                        Sending…
                      </span>
                    ) : "Send message →"}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div key="thanks"
                  initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                  style={{ textAlign:"center", padding:"32px 0" }}>
                  <motion.div
                    initial={{ scale:0 }} animate={{ scale:1 }}
                    transition={{ type:"spring", stiffness:300, damping:20 }}
                    style={{ width:64, height:64, borderRadius:"50%",
                      background:`${T.success}20`, border:`2px solid ${T.success}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      margin:"0 auto 20px", fontSize:28 }}>✓</motion.div>
                  <h3 style={{ fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:22,
                    color:T.text, marginBottom:10 }}>Message sent!</h3>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:14, color:T.muted }}>
                    We'll get back to you within a few hours.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const cols = {
    Product:["Triggers","Workflows","AI Steps","Observability","Changelog"],
    Developers:["Docs","API Reference","SDKs","Status","GitHub"],
    Company:["About","Blog","Careers","Press","Security"],
  };
  return (
    <footer style={{ borderTop:`1px solid ${T.border}`, padding:"56px max(20px, calc((100vw - 1200px)/2)) 36px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1.4fr repeat(3, 1fr)", gap:40, marginBottom:56 }} className="footer-grid">
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <div style={{ width:28, height:28, borderRadius:7,
              background:`linear-gradient(135deg, ${T.accent}, #0284C7)`,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="white" fillOpacity="0.95"/>
              </svg>
            </div>
            <span style={{ fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:15, color:T.text, letterSpacing:"-0.025em" }}>
              Flow<span style={{ color:T.accentSoft }}>matic</span>
            </span>
          </div>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13.5, color:T.muted, lineHeight:1.65, maxWidth:220 }}>
            Automation infrastructure for teams that move fast.
          </p>
        </div>
        {Object.entries(cols).map(([section,links])=>(
          <div key={section}>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:700, color:T.text,
              letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:14 }}>{section}</div>
            {links.map(l=>(
              <a key={l} href="#" style={{ display:"block", fontFamily:"'Inter',sans-serif",
                fontSize:13.5, color:T.muted, textDecoration:"none", marginBottom:10,
                transition:"color 0.2s" }}
                onMouseEnter={e=>e.target.style.color=T.text}
                onMouseLeave={e=>e.target.style.color=T.muted}>{l}</a>
            ))}
          </div>
        ))}
      </div>
      <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:24,
        display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:T.subtle }}>
          © 2025 Flowmatic, Inc. All rights reserved.
        </span>
        <div style={{ display:"flex", gap:20 }}>
          {["Privacy","Terms","Security"].map(l=>(
            <a key={l} href="#" style={{ fontFamily:"'Inter',sans-serif", fontSize:13,
              color:T.subtle, textDecoration:"none", transition:"color 0.2s" }}
              onMouseEnter={e=>e.target.style.color=T.muted}
              onMouseLeave={e=>e.target.style.color=T.subtle}>{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div style={{ background:T.bg, minHeight:"100vh", color:T.text }}>
      <Noise />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600;700;800;900&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:${T.bg}; }
        ::selection { background:rgba(14,165,233,0.28); color:#fff; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:${T.bg}; }
        ::-webkit-scrollbar-thumb { background:${T.subtle}; border-radius:3px; }
        textarea { font-family:'Inter',sans-serif; }
        input::placeholder, textarea::placeholder { color:${T.subtle}; }

        @media (max-width: 900px) {
          .feature-grid { grid-template-columns: 1fr !important; }
          .feature-card { grid-column: span 1 !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .nav-links { display:none !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Nav />
      <Hero />
      <Logos />
      <Features />
      <Pricing />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}
