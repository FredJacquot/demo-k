"use client";

import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, AlertTriangle, Clock, Circle, Lock,
  Zap, ChevronDown, CalendarDays, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type MilestoneStatus = "Validé" | "Sous vigilance" | "En cours" | "En attente" | "À venir";
type StepStatus = "Validé" | "En cours" | "Erreur" | "En attente";
type OrbHealth = "done" | "error" | "active" | "waiting" | "upcoming";

type Step = { label: string; status: StepStatus };

type Milestone = {
  id: string;
  name: string;
  shortName: string;
  status: MilestoneStatus;
  targetDate: string;
  steps: Step[];
  baseColor: string;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const milestones: Milestone[] = [
  {
    id: "m1", name: "Ouverture du cycle", shortName: "Ouverture",
    status: "Validé", targetDate: "01/03", baseColor: "#22c55e",
    steps: [
      { label: "Initialisation du cycle", status: "Validé" },
      { label: "Paramétrage des règles paie", status: "Validé" },
      { label: "Ouverture des accès GP", status: "Validé" },
    ],
  },
  {
    id: "m2", name: "Consolidation des données", shortName: "Consolidation",
    status: "Validé", targetDate: "05/03", baseColor: "#22c55e",
    steps: [
      { label: "Import données Core HR", status: "Validé" },
      { label: "Import GTA absences", status: "Validé" },
      { label: "Collecte notes de frais", status: "Validé" },
      { label: "Import primes variables", status: "Validé" },
      { label: "Vérification intégrité des flux", status: "Validé" },
      { label: "Validation volumétrie", status: "Validé" },
    ],
  },
  {
    id: "m3", name: "Qualification des écarts", shortName: "Qualification",
    status: "Sous vigilance", targetDate: "10/03", baseColor: "#f59e0b",
    steps: [
      { label: "Rapprochement Core HR / Paie", status: "En cours" },
      { label: "Synchronisation des absences GTA", status: "Erreur" },
      { label: "Qualification des anomalies paie", status: "Erreur" },
      { label: "Comparatif M-1 vs M", status: "En cours" },
      { label: "Détection des changements salariés", status: "Validé" },
      { label: "Collecte des EVP", status: "Validé" },
      { label: "Analyse des variations d'effectifs", status: "Validé" },
    ],
  },
  {
    id: "m4", name: "Sécurisation des éléments", shortName: "Sécurisation",
    status: "Sous vigilance", targetDate: "13/03", baseColor: "#f59e0b",
    steps: [
      { label: "Contrôle des entrées/sorties", status: "Validé" },
      { label: "Vérification des avenants", status: "Erreur" },
      { label: "Contrôle des absences longue durée", status: "En cours" },
      { label: "Validation des taux horaires", status: "Validé" },
    ],
  },
  {
    id: "m5", name: "Préparation de la production", shortName: "Production",
    status: "En cours", targetDate: "17/03", baseColor: "#3b82f6",
    steps: [
      { label: "Gel des données d'entrée", status: "Validé" },
      { label: "Lancement calcul brut", status: "En cours" },
      { label: "Génération des bulletins test", status: "En cours" },
      { label: "Validation responsable paie", status: "En attente" },
    ],
  },
  {
    id: "m6", name: "Contrôle automatisé Kalia", shortName: "Contrôle IA",
    status: "En cours", targetDate: "19/03", baseColor: "#3b82f6",
    steps: [
      { label: "Contrôle cohérence masse salariale", status: "En cours" },
      { label: "Détection anomalies cotisations", status: "En cours" },
      { label: "Vérification des seuils légaux", status: "En cours" },
      { label: "Rapport de contrôle final", status: "En attente" },
    ],
  },
  {
    id: "m7", name: "Contrôle expert GP", shortName: "Expert GP",
    status: "En attente", targetDate: "21/03", baseColor: "#8b5cf6",
    steps: [
      { label: "Revue GP sur cas complexes", status: "En attente" },
      { label: "Validation DRH", status: "En attente" },
      { label: "Signature bon à payer", status: "En attente" },
    ],
  },
  {
    id: "m8", name: "Post-paie", shortName: "Post-paie",
    status: "À venir", targetDate: "28/03", baseColor: "#64748b",
    steps: [
      { label: "Envoi DSN mensuelle", status: "En attente" },
      { label: "Virements salariaux", status: "En attente" },
      { label: "Distribution bulletins dématérialisés", status: "En attente" },
    ],
  },
  {
    id: "m9", name: "Clôture du cycle", shortName: "Clôture",
    status: "À venir", targetDate: "31/03", baseColor: "#64748b",
    steps: [
      { label: "Archivage du cycle", status: "En attente" },
      { label: "Bilan & reporting DRH", status: "En attente" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function milestoneToOrbHealth(m: Milestone): OrbHealth {
  if (m.status === "Validé") return "done";
  if (m.status === "Sous vigilance") return "error";
  if (m.status === "En cours") return "active";
  if (m.status === "En attente") return "waiting";
  return "upcoming";
}

const orbHealthColor: Record<OrbHealth, string> = {
  done:     "#22c55e",
  error:    "#ef4444",
  active:   "#3b82f6",
  waiting:  "#8b5cf6",
  upcoming: "#475569",
};

const stepHealthFromMilestone = (m: Milestone): OrbHealth[] =>
  m.steps.map(s => {
    if (s.status === "Validé")    return "done";
    if (s.status === "Erreur")    return "error";
    if (s.status === "En cours")  return "active";
    return "waiting";
  });

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return [100, 100, 100];
  return [r, g, b];
}

// ─── Canvas Orb ───────────────────────────────────────────────────────────────

type Particle = {
  theta: number; phi: number; r: number;
  speed: number; offset: number; size: number;
  health: OrbHealth; chaosAmp: number;
};

function PayrollOrb({
  milestone, isSelected, isAnySelected, onClick, size,
}: {
  milestone: Milestone;
  isSelected: boolean;
  isAnySelected: boolean;
  onClick: () => void;
  size: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTime = useRef(performance.now());
  const health = milestoneToOrbHealth(milestone);
  const stepHealths = useMemo(() => stepHealthFromMilestone(milestone), [milestone]);

  const particles = useMemo<Particle[]>(() => {
    const result: Particle[] = [];
    const total = stepHealths.length || 1;
    const healthCounts: Record<OrbHealth, number> = { done: 0, error: 0, active: 0, waiting: 0, upcoming: 0 };
    stepHealths.forEach(h => { healthCounts[h]++; });

    // Step particles (larger, one per step)
    stepHealths.forEach((h) => {
      result.push({
        theta: Math.random() * Math.PI * 2,
        phi: Math.acos(2 * Math.random() - 1),
        r: 0.60 + Math.random() * 0.15,
        speed: 0.22 + Math.random() * 0.30,
        offset: Math.random() * Math.PI * 2,
        size: 3.0,
        health: h,
        chaosAmp: h === "error" ? 0.20 : h === "active" ? 0.08 : 0.015,
      });
    });

    // Background particles distributed proportionally
    const bgTotal = 70;
    for (let i = 0; i < bgTotal; i++) {
      const rand = (i / bgTotal) * total;
      let acc = 0;
      let picked: OrbHealth = health;
      for (const h of ["error", "active", "waiting", "done", "upcoming"] as OrbHealth[]) {
        acc += healthCounts[h];
        if (rand < acc) { picked = h; break; }
      }
      result.push({
        theta: Math.random() * Math.PI * 2,
        phi: Math.acos(2 * Math.random() - 1),
        r: 0.38 + Math.random() * 0.36,
        speed: 0.07 + Math.random() * 0.16,
        offset: Math.random() * Math.PI * 2,
        size: 1.1 + Math.random() * 0.9,
        health: picked,
        chaosAmp: picked === "error" ? 0.06 : 0.012,
      });
    }
    return result;
  }, [stepHealths, health]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const t = (performance.now() - startTime.current) / 1000;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(cx, cy) * 0.90;

    const isDimmed = isAnySelected && !isSelected;
    const scale = isDimmed ? 0.78 : isSelected ? 1.06 : 1.0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.globalAlpha = isDimmed ? 0.32 : 1;

    const rotY = t * 0.13;
    const rotX = Math.sin(t * 0.065) * 0.14;

    const sorted: Array<{ z: number; x2d: number; y2d: number; color: string; sz: number }> = [];
    particles.forEach((p) => {
      const wobble = p.chaosAmp * Math.sin(t * p.speed * 4 + p.offset);
      const rr = (p.r + wobble) * radius;
      const theta = p.theta + t * p.speed * 0.4;
      const phi = p.phi + Math.sin(t * 0.28 + p.offset) * 0.09;

      let x = rr * Math.sin(phi) * Math.cos(theta);
      let y = rr * Math.cos(phi);
      let z = rr * Math.sin(phi) * Math.sin(theta);

      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const nx = x * cosY + z * sinY;
      const nz = -x * sinY + z * cosY;
      x = nx; z = nz;

      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const ny = y * cosX - z * sinX;
      const nz2 = y * sinX + z * cosX;
      y = ny; z = nz2;

      const depthFactor = (z / radius + 1) / 2;
      const col = orbHealthColor[p.health];
      const [pr, pg, pb] = hexToRgb(col);
      const alpha = 0.18 + depthFactor * 0.78;

      sorted.push({
        z, x2d: x, y2d: y,
        color: `rgba(${pr},${pg},${pb},${alpha.toFixed(2)})`,
        sz: p.size * (0.48 + depthFactor * 0.82),
      });
    });

    sorted.sort((a, b) => a.z - b.z);
    sorted.forEach(({ x2d, y2d, color, sz }) => {
      ctx.beginPath();
      ctx.arc(x2d, y2d, sz, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    ctx.restore();
    animRef.current = requestAnimationFrame(draw);
  }, [particles, isSelected, isAnySelected]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const errorCount = milestone.steps.filter(s => s.status === "Erreur").length;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1.5 focus:outline-none transition-all duration-300",
        isAnySelected && !isSelected && "opacity-35 scale-95",
      )}
    >
      <canvas ref={canvasRef} width={size} height={size} className="cursor-pointer" />
      <div className={cn(
        "flex flex-col items-center gap-0.5 transition-opacity duration-300",
        isSelected ? "opacity-100" : "opacity-60 group-hover:opacity-90"
      )}>
        <span className="text-[11px] font-semibold text-foreground leading-tight text-center max-w-[90px] text-balance">
          {milestone.shortName}
        </span>
        <span className="text-[9px] text-muted-foreground">{milestone.targetDate}</span>
        {errorCount > 0 && (
          <span className="text-[9px] font-semibold text-red-500">{errorCount} erreur{errorCount > 1 ? "s" : ""}</span>
        )}
      </div>
    </button>
  );
}

// ─── Step Badge ───────────────────────────────────────────────────────────────

const stepBadge: Record<StepStatus, string> = {
  "Validé":    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
  "En cours":  "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/25",
  "Erreur":    "bg-red-50 text-red-700 ring-1 ring-red-200 font-semibold dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/30",
  "En attente":"bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20",
};

const stepDot: Record<StepStatus, string> = {
  "Validé":    "bg-emerald-500",
  "En cours":  "bg-blue-500 animate-pulse",
  "Erreur":    "bg-red-500 animate-pulse",
  "En attente":"bg-violet-400/50",
};

const statusConfig: Record<MilestoneStatus, { label: string; color: string; icon: React.ElementType }> = {
  "Validé":          { label: "Validé",          color: "text-emerald-500", icon: CheckCircle2 },
  "Sous vigilance":  { label: "Sous vigilance",   color: "text-amber-500",  icon: AlertTriangle },
  "En cours":        { label: "En cours",          color: "text-blue-500",   icon: Clock },
  "En attente":      { label: "En attente",        color: "text-violet-500", icon: Circle },
  "À venir":         { label: "À venir",           color: "text-muted-foreground/50", icon: Lock },
};

// ─── Chevron connector between orbs ───────────────────────────────────────────

function LineConnector({ from }: { from: MilestoneStatus; to: MilestoneStatus }) {
  const done = from === "Validé";
  return (
    <div className="flex items-center self-center -mt-10 px-0.5" aria-hidden>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
        <polyline
          points="5,3 14,10 5,17"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "transition-colors duration-500",
            done ? "stroke-emerald-500/70" : "stroke-border"
          )}
        />
      </svg>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PipelineMensuelV8() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeMilestone = useMemo(
    () => milestones.find(m => m.id === activeId) ?? null,
    [activeId]
  );

  const completed = milestones.filter(m => m.status === "Validé").length;
  const total = milestones.length;
  const progress = Math.round((completed / total) * 100);
  const currentStep = milestones.find(m => m.status !== "Validé" && m.status !== "À venir") ?? null;

  const handleOrbClick = (id: string) => {
    setActiveId(prev => prev === id ? null : id);
  };

  return (
    <div className="flex h-full flex-col bg-background overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between border-b border-border px-6 py-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
            <CalendarDays size={12} />
            <span>Cycle de paie — Mars 2026</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Pipeline mensuel</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentStep ? (
              <>Étape en cours : <span className="text-foreground font-medium">{currentStep.name}</span></>
            ) : "Cycle terminé"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {(["Validé","Sous vigilance","En cours","En attente","À venir"] as MilestoneStatus[]).map(s => {
              const cfg = statusConfig[s];
              const Icon = cfg.icon;
              const count = milestones.filter(m => m.status === s).length;
              if (count === 0) return null;
              return (
                <span key={s} className={cn("flex items-center gap-1", cfg.color)}>
                  <Icon size={11} />
                  {count}
                </span>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-36 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-semibold tabular-nums text-foreground">{progress}%</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Zap size={9} className="text-blue-400" />
            Kalia surveille le cycle en temps réel
          </div>
        </div>
      </div>

      {/* Orb timeline */}
      <div className="relative flex items-end justify-between px-6 pt-6 pb-2 overflow-x-auto min-h-[230px]">
        {milestones.map((m, i) => (
          <div key={m.id} className="flex items-end gap-0">
            <PayrollOrb
              milestone={m}
              isSelected={activeId === m.id}
              isAnySelected={activeId !== null}
              onClick={() => handleOrbClick(m.id)}
              size={120}
            />
            {i < milestones.length - 1 && (
              <LineConnector from={m.status} to={milestones[i + 1].status} />
            )}
          </div>
        ))}
      </div>

      {/* Prompt */}
      {activeId === null && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <p className="text-sm">Cliquez sur une étape pour voir le détail</p>
        </div>
      )}

      {/* Detail panel */}
      {activeMilestone && (
        <div className="mx-6 mb-6 mt-2 rounded-xl border border-border bg-card overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-3">
              {(() => {
                const cfg = statusConfig[activeMilestone.status];
                const Icon = cfg.icon;
                return <Icon size={16} className={cfg.color} />;
              })()}
              <div>
                <p className="text-sm font-semibold text-foreground">{activeMilestone.name}</p>
                <p className="text-xs text-muted-foreground">Échéance : {activeMilestone.targetDate}/2026</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeMilestone.steps.filter(s => s.status === "Erreur").length > 0 && (
                <Button size="sm" variant="destructive" className="h-7 text-xs gap-1.5">
                  <XCircle size={12} />
                  Traiter les erreurs
                </Button>
              )}
              <button
                onClick={() => setActiveId(null)}
                className="text-muted-foreground hover:text-foreground transition-colors text-xs"
              >
                Fermer
              </button>
            </div>
          </div>

          {/* Steps grid */}
          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-4">
            {activeMilestone.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5 bg-card px-4 py-3">
                <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", stepDot[step.status])} />
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-xs text-foreground leading-snug">{step.label}</p>
                  <span className={cn("inline-flex w-fit rounded px-1.5 py-0.5 text-[10px]", stepBadge[step.status])}>
                    {step.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
