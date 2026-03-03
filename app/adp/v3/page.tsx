"use client";

import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import {
  UserPlus, UserMinus, FileText, CalendarOff, FolderOpen,
  CheckCircle2, Clock, XCircle, Zap, ShieldCheck, Hand,
  RotateCcw, Bell, Pencil, AlertCircle, ChevronDown, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExecutionMode = "full-auto" | "auto-validation" | "assisted";
type StepStatus = "ok" | "pending" | "blocked" | "waiting" | "skipped";
type WorkflowType = "onboarding" | "offboarding" | "document" | "absence" | "completude";
type Health = "blocked" | "warning" | "ok" | "done";

type ProcessStep = {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
  by?: "kalia" | "human";
};

type EmployeeCase = {
  id: string;
  name: string;
  initials: string;
  role: string;
  workflowType: WorkflowType;
  workflowLabel: string;
  steps: ProcessStep[];
  mode: ExecutionMode;
  updatedAt: string;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const allCases: EmployeeCase[] = [
  {
    id: "ob-1", name: "Sophie Marchand", initials: "SM", role: "Chargée de projet",
    workflowType: "onboarding", workflowLabel: "Onboarding administratif",
    mode: "auto-validation", updatedAt: "il y a 2h",
    steps: [
      { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia" },
      { id: "s2", label: "Données Core HR récupérées", status: "ok", by: "kalia" },
      { id: "s3", label: "Pièces d'identité reçues", status: "blocked", detail: "Relance envoyée ×2 — sans réponse" },
      { id: "s4", label: "Création dans le SIRH", status: "pending" },
      { id: "s5", label: "Envoi des accès et contrat", status: "pending" },
    ],
  },
  {
    id: "ob-4", name: "Pauline Girard", initials: "PG", role: "Responsable marketing",
    workflowType: "onboarding", workflowLabel: "Onboarding administratif",
    mode: "full-auto", updatedAt: "il y a 30 min",
    steps: [
      { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia" },
      { id: "s2", label: "Données Core HR récupérées", status: "blocked", detail: "Date de naissance incohérente" },
      { id: "s3", label: "Pièces d'identité reçues", status: "pending" },
      { id: "s4", label: "Création dans le SIRH", status: "pending" },
      { id: "s5", label: "Envoi des accès et contrat", status: "pending" },
    ],
  },
  {
    id: "ob-2", name: "Nathan Leroy", initials: "NL", role: "Développeur",
    workflowType: "onboarding", workflowLabel: "Onboarding administratif",
    mode: "full-auto", updatedAt: "il y a 1h",
    steps: [
      { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia" },
      { id: "s2", label: "Données Core HR récupérées", status: "ok", by: "kalia" },
      { id: "s3", label: "Pièces d'identité reçues", status: "ok", by: "kalia" },
      { id: "s4", label: "Création dans le SIRH", status: "ok", by: "kalia" },
      { id: "s5", label: "Envoi des accès et contrat", status: "waiting", detail: "En attente signature électronique" },
    ],
  },
  {
    id: "ob-5", name: "Clémence Aubert", initials: "CA", role: "Comptable",
    workflowType: "onboarding", workflowLabel: "Onboarding administratif",
    mode: "auto-validation", updatedAt: "il y a 3h",
    steps: [
      { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia" },
      { id: "s2", label: "Données Core HR récupérées", status: "ok", by: "kalia" },
      { id: "s3", label: "Pièces d'identité reçues", status: "ok", by: "kalia" },
      { id: "s4", label: "Création dans le SIRH", status: "ok", by: "kalia" },
      { id: "s5", label: "Envoi des accès et contrat", status: "ok", by: "kalia" },
    ],
  },
  {
    id: "ob-3", name: "Camille Dubois", initials: "CD", role: "Designer UX",
    workflowType: "onboarding", workflowLabel: "Onboarding administratif",
    mode: "auto-validation", updatedAt: "hier",
    steps: [
      { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia" },
      { id: "s2", label: "Données Core HR récupérées", status: "ok", by: "kalia" },
      { id: "s3", label: "Pièces d'identité reçues", status: "ok", by: "kalia" },
      { id: "s4", label: "Création dans le SIRH", status: "waiting", detail: "En attente de validation GP" },
      { id: "s5", label: "Envoi des accès et contrat", status: "pending" },
    ],
  },
  {
    id: "of-2", name: "Pierre Faure", initials: "PF", role: "Commercial",
    workflowType: "offboarding", workflowLabel: "Offboarding administratif",
    mode: "full-auto", updatedAt: "il y a 1j",
    steps: [
      { id: "s1", label: "Départ confirmé dans le SIRH", status: "ok", by: "kalia" },
      { id: "s2", label: "Checklist de sortie générée", status: "ok", by: "kalia" },
      { id: "s3", label: "Désactivation des accès", status: "blocked", detail: "Accès Salesforce non révoqué" },
      { id: "s4", label: "Solde de tout compte préparé", status: "pending" },
      { id: "s5", label: "Attestation employeur générée", status: "pending" },
    ],
  },
  {
    id: "of-1", name: "Julie Moreau", initials: "JM", role: "Assistante RH",
    workflowType: "offboarding", workflowLabel: "Offboarding administratif",
    mode: "auto-validation", updatedAt: "il y a 4h",
    steps: [
      { id: "s1", label: "Départ confirmé dans le SIRH", status: "ok", by: "kalia" },
      { id: "s2", label: "Checklist de sortie générée", status: "ok", by: "kalia" },
      { id: "s3", label: "Désactivation des accès", status: "ok", by: "kalia" },
      { id: "s4", label: "Solde de tout compte préparé", status: "waiting", detail: "En attente de validation GP" },
      { id: "s5", label: "Attestation employeur générée", status: "pending" },
    ],
  },
  // Absences — tous terminés
  {
    id: "ab-1", name: "Léa Fontaine", initials: "LF", role: "Analyste data",
    workflowType: "absence", workflowLabel: "Gestion des absences",
    mode: "full-auto", updatedAt: "hier",
    steps: [
      { id: "s1", label: "Absence détectée (3 jours)", status: "ok", by: "kalia" },
      { id: "s2", label: "Qualification du cas", status: "ok", by: "kalia" },
      { id: "s3", label: "Demande de justificatif", status: "ok", by: "kalia" },
      { id: "s4", label: "Justificatif reçu", status: "ok", by: "kalia" },
      { id: "s5", label: "Intégration dans la paie", status: "ok", by: "kalia" },
    ],
  },
  {
    id: "ab-2", name: "Hélène Martin", initials: "HM", role: "Juriste",
    workflowType: "absence", workflowLabel: "Gestion des absences",
    mode: "auto-validation", updatedAt: "il y a 5h",
    steps: [
      { id: "s1", label: "Absence détectée (5 jours)", status: "ok", by: "kalia" },
      { id: "s2", label: "Qualification du cas", status: "ok", by: "kalia" },
      { id: "s3", label: "Demande de justificatif", status: "ok", by: "kalia" },
      { id: "s4", label: "Justificatif reçu", status: "ok", by: "kalia" },
      { id: "s5", label: "Intégration dans la paie", status: "ok", by: "kalia" },
    ],
  },
  // Documents RH — 1 seul dossier bloqué
  {
    id: "doc-4", name: "Antoine Blanc", initials: "AB", role: "Technicien",
    workflowType: "document", workflowLabel: "Documents RH",
    mode: "full-auto", updatedAt: "il y a 1h",
    steps: [
      { id: "s1", label: "Demande reçue", status: "ok", by: "kalia" },
      { id: "s2", label: "Contexte salarié chargé", status: "blocked", detail: "Salarié introuvable dans le SIRH" },
      { id: "s3", label: "Génération du document", status: "pending" },
      { id: "s4", label: "Envoi au salarié", status: "pending" },
    ],
  },
  {
    id: "co-1", name: "Thomas Renard", initials: "TR", role: "Technicien terrain",
    workflowType: "completude", workflowLabel: "Complétude des dossiers",
    mode: "full-auto", updatedAt: "il y a 1j",
    steps: [
      { id: "s1", label: "Contrôle de complétude", status: "ok", by: "kalia", detail: "3 anomalies détectées" },
      { id: "s2", label: "Relances envoyées", status: "ok", by: "kalia" },
      { id: "s3", label: "Champs reçus (2/3)", status: "ok", by: "kalia" },
      { id: "s4", label: "Résolution incohérence", status: "blocked", detail: "Date de naissance contradictoire — escalade GP" },
      { id: "s5", label: "Mise à jour SIRH", status: "pending" },
    ],
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const typeConfig: Record<WorkflowType, {
  icon: React.ElementType;
  label: string;
  baseColor: string; // hex for canvas
}> = {
  onboarding:  { icon: UserPlus,    label: "Onboarding",   baseColor: "#3b82f6" },
  offboarding: { icon: UserMinus,   label: "Offboarding",  baseColor: "#f97316" },
  document:    { icon: FileText,    label: "Documents RH", baseColor: "#8b5cf6" },
  absence:     { icon: CalendarOff, label: "Absences",     baseColor: "#f59e0b" },
  completude:  { icon: FolderOpen,  label: "Complétude",   baseColor: "#f43f5e" },
};

const healthColor: Record<Health, string> = {
  blocked: "#ef4444",
  warning: "#fbbf24",
  ok:      "#3b82f6",
  done:    "#22c55e",
};

const modeConfig: Record<ExecutionMode, { icon: React.ElementType; label: string }> = {
  "full-auto":       { icon: Zap,        label: "Auto" },
  "auto-validation": { icon: ShieldCheck, label: "Validation" },
  "assisted":        { icon: Hand,        label: "Assisté" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHealth(c: EmployeeCase): Health {
  if (c.steps.every(s => s.status === "ok" || s.status === "skipped")) return "done";
  if (c.steps.some(s => s.status === "blocked")) return "blocked";
  if (c.steps.some(s => s.status === "waiting")) return "warning";
  return "ok";
}

function getGlobalHealth(cases: EmployeeCase[]): Health {
  if (cases.some(c => getHealth(c) === "blocked")) return "blocked";
  if (cases.some(c => getHealth(c) === "warning")) return "warning";
  if (cases.every(c => getHealth(c) === "done")) return "done";
  return "ok";
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

// ─── Canvas Orb ───────────────────────────────────────────────────────────────

type Particle = {
  theta: number;
  phi: number;
  r: number;
  speed: number;
  offset: number;
  size: number;
  isEmployee: boolean;
  health: Health;
  chaosAmp: number;
};

function WorkflowOrb({
  cases,
  workflowType,
  isSelected,
  isAnySelected,
  onClick,
  width,
  height,
}: {
  cases: EmployeeCase[];
  workflowType: WorkflowType;
  isSelected: boolean;
  isAnySelected: boolean;
  onClick: () => void;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTime = useRef(performance.now());
  const cfg = typeConfig[workflowType];
  const globalHealth = getGlobalHealth(cases);
  const blockedCount = cases.filter(c => getHealth(c) === "blocked").length;

  const particles = useMemo<Particle[]>(() => {
    const result: Particle[] = [];
    cases.forEach((c) => {
      const h = getHealth(c);
      result.push({
        theta: Math.random() * Math.PI * 2,
        phi: Math.acos(2 * Math.random() - 1),
        r: 0.62 + Math.random() * 0.12,
        speed: 0.25 + Math.random() * 0.35,
        offset: Math.random() * Math.PI * 2,
        size: 2.8,
        isEmployee: true,
        health: h,
        chaosAmp: h === "blocked" ? 0.22 : h === "warning" ? 0.1 : 0.02,
      });
    });
    // Background particles distributed proportionally by case health
    const total = cases.length || 1;
    const healthCounts: Record<Health, number> = { blocked: 0, warning: 0, ok: 0, done: 0 };
    cases.forEach(c => { healthCounts[getHealth(c)]++; });
    const bgTotal = 80;
    for (let i = 0; i < bgTotal; i++) {
      // pick health proportionally
      const rand = (i / bgTotal) * total;
      let acc = 0;
      let pickedHealth: Health = globalHealth;
      for (const h of ["blocked", "warning", "ok", "done"] as Health[]) {
        acc += healthCounts[h];
        if (rand < acc) { pickedHealth = h; break; }
      }
      result.push({
        theta: Math.random() * Math.PI * 2,
        phi: Math.acos(2 * Math.random() - 1),
        r: 0.4 + Math.random() * 0.38,
        speed: 0.08 + Math.random() * 0.18,
        offset: Math.random() * Math.PI * 2,
        size: 1.2 + Math.random() * 1.0,
        isEmployee: false,
        health: pickedHealth,
        chaosAmp: pickedHealth === "blocked" ? 0.07 : 0.015,
      });
    }
    return result;
  }, [cases, globalHealth]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const t = (performance.now() - startTime.current) / 1000;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(cx, cy) * 0.92;

    const dimmed = isAnySelected && !isSelected;
    const scale = dimmed ? 0.75 : isSelected ? 1.05 : 1.0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.globalAlpha = dimmed ? 0.35 : 1;

    // Blended core color based on health proportions
    const total = cases.length || 1;
    const blockedN = cases.filter(c => getHealth(c) === "blocked").length;
    const warningN = cases.filter(c => getHealth(c) === "warning").length;
    const doneN   = cases.filter(c => getHealth(c) === "done").length;
    const okN     = total - blockedN - warningN - doneN;
    const [rr, rg, rb] = hexToRgb("#ef4444");
    const [ar, ag, ab] = hexToRgb("#f59e0b");
    const [dr, dg, db] = hexToRgb("#22c55e");
    const [or2, og2, ob2] = hexToRgb(typeConfig[workflowType].baseColor);
    const mixR = (rr * blockedN + ar * warningN + dr * doneN + or2 * okN) / total;
    const mixG = (rg * blockedN + ag * warningN + dg * doneN + og2 * okN) / total;
    const mixB = (rb * blockedN + ab * warningN + db * doneN + ob2 * okN) / total;

    // Rotation
    const rotY = t * 0.14;
    const rotX = Math.sin(t * 0.07) * 0.15;

    // Particles
    const sorted: Array<{ z: number; x2d: number; y2d: number; color: string; size: number }> = [];
    particles.forEach((p) => {
      const wobble = p.chaosAmp * Math.sin(t * p.speed * 4 + p.offset);
      const r = (p.r + wobble) * radius;
      const theta = p.theta + t * p.speed * 0.4;
      const phi = p.phi + Math.sin(t * 0.3 + p.offset) * 0.1;

      // Sphere coords
      let x = r * Math.sin(phi) * Math.cos(theta);
      let y = r * Math.cos(phi);
      let z = r * Math.sin(phi) * Math.sin(theta);

      // Apply rotations
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const nx = x * cosY + z * sinY;
      const nz = -x * sinY + z * cosY;
      x = nx; z = nz;

      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const ny = y * cosX - z * sinX;
      const nz2 = y * sinX + z * cosX;
      y = ny; z = nz2;

      const depthFactor = (z / radius + 1) / 2; // 0 = back, 1 = front
      const col = p.isEmployee ? healthColor[p.health] : `rgb(${Math.round(mixR)},${Math.round(mixG)},${Math.round(mixB)})`;
      const [pr, pg, pb] = hexToRgb(col);
      const alpha = 0.2 + depthFactor * 0.75;

      sorted.push({
        z,
        x2d: x,
        y2d: y,
        color: `rgba(${pr},${pg},${pb},${alpha.toFixed(2)})`,
        size: p.size * (0.5 + depthFactor * 0.8) * (p.isEmployee ? 1.4 : 1),
      });
    });

    // Paint back-to-front
    sorted.sort((a, b) => a.z - b.z);
    sorted.forEach(({ x2d, y2d, color, size }) => {
      ctx.beginPath();
      ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    ctx.restore();
    animRef.current = requestAnimationFrame(draw);
  }, [particles, globalHealth, isSelected, isAnySelected]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const isDimmed = isAnySelected && !isSelected;
  const Icon = cfg.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1 transition-all duration-300 focus:outline-none group",
        isDimmed && "opacity-40",
      )}
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height - 36}
        className="cursor-pointer"
      />
      <div className={cn(
        "flex flex-col items-center gap-0.5 transition-all duration-300",
        isSelected ? "opacity-100" : "opacity-70 group-hover:opacity-100"
      )}>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
          <Icon size={10} />
          {cfg.label}
        </div>
        <div className="text-[9px] text-muted-foreground tabular-nums">
          {cases.length} dossier{cases.length > 1 ? "s" : ""}
          {blockedCount > 0 && (
            <span className="ml-1 text-red-500 font-semibold">· {blockedCount} bloqué{blockedCount > 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </button>
  );
}

// Extract dimmed logic outside component to use in JSX
function OrbWrapper(props: Parameters<typeof WorkflowOrb>[0]) {
  return <WorkflowOrb {...props} />;
}

// ─── Progress Dots ────────────────────────────────────────────────────────────

function ProgressDots({ steps }: { steps: ProcessStep[] }) {
  const dot: Record<StepStatus, string> = {
    ok: "bg-emerald-500", blocked: "bg-red-500 animate-pulse",
    waiting: "bg-amber-400", pending: "bg-muted-foreground/20", skipped: "bg-muted-foreground/10",
  };
  return (
    <div className="flex items-center gap-0.5">
      {steps.map(s => <span key={s.id} className={cn("h-1.5 w-1.5 rounded-full", dot[s.status])} />)}
    </div>
  );
}

// ─── Step List ────────────────────────────────────────────────────────────────

function StepList({ steps }: { steps: ProcessStep[] }) {
  const iconMap: Record<StepStatus, React.ElementType> = {
    ok: CheckCircle2, blocked: XCircle, waiting: Clock, pending: Clock, skipped: CheckCircle2,
  };
  const colorMap: Record<StepStatus, string> = {
    ok: "text-emerald-500", blocked: "text-red-500", waiting: "text-amber-500",
    pending: "text-muted-foreground/25", skipped: "text-muted-foreground/20",
  };
  return (
    <div className="mt-2 space-y-1.5 border-t border-border/50 pt-2">
      {steps.map(s => {
        const Icon = iconMap[s.status];
        return (
          <div key={s.id} className="flex items-start gap-2 text-xs">
            <Icon size={12} className={cn("mt-0.5 shrink-0", colorMap[s.status])} />
            <span className={cn(s.status === "pending" ? "text-muted-foreground/40" : "text-foreground/80")}>
              {s.label}
              {s.detail && <span className="ml-1 text-muted-foreground opacity-70">— {s.detail}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Case Row ─────────────────────────────────────────────────────────────────

function CaseRow({
  c, selected, onToggle, expanded, onToggleExpand,
}: {
  c: EmployeeCase; selected: boolean; onToggle: () => void; expanded: boolean; onToggleExpand: () => void;
}) {
  const health = getHealth(c);
  const blocker = c.steps.find(s => s.status === "blocked") || c.steps.find(s => s.status === "waiting");
  const ModeIcon = modeConfig[c.mode].icon;

  const healthConfig = {
    blocked: { cls: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400", label: "Bloqué",     icon: XCircle },
    warning: { cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400", label: "Attente",  icon: Clock },
    done:    { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400", label: "Terminé", icon: CheckCircle2 },
    ok:      { cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400", label: "En cours",  icon: Zap },
  }[health];
  const HealthIcon = healthConfig.icon;

  return (
    <div className={cn("transition-colors", selected && "bg-muted/30")}>
      <div className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-muted/20" onClick={onToggleExpand}>
        <div onClick={e => { e.stopPropagation(); onToggle(); }}>
          <Checkbox checked={selected} className="shrink-0" />
        </div>
        <div className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-2",
          {
            blocked: "bg-red-50 ring-red-200 dark:bg-red-500/10 dark:ring-red-500/30",
            warning: "bg-amber-50 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30",
            done:    "bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30",
            ok:      "bg-blue-50 ring-blue-200 dark:bg-blue-500/10 dark:ring-blue-500/30",
          }[health]
        )}>
          {c.initials}
        </div>
        <div className="min-w-[130px]">
          <div className="text-sm font-medium text-foreground leading-tight">{c.name}</div>
          <div className="text-[10px] text-muted-foreground">{c.role}</div>
        </div>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0", healthConfig.cls)}>
          <HealthIcon size={9} />{healthConfig.label}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <ProgressDots steps={c.steps} />
          {blocker && (
            <p className="truncate text-[10px] text-muted-foreground">
              <span className="font-medium text-foreground/70">{blocker.label}</span>
              {blocker.detail && <span className="opacity-60"> — {blocker.detail}</span>}
            </p>
          )}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
          <ModeIcon size={10} />
          <span className="hidden md:inline">{c.updatedAt}</span>
          <ChevronDown size={13} className={cn("transition-transform duration-200", expanded && "rotate-180")} />
        </div>
      </div>
      {expanded && <div className="px-14 pb-3"><StepList steps={c.steps} /></div>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const WORKFLOW_TYPES: WorkflowType[] = ["onboarding", "offboarding", "document", "absence", "completude"];

export default function ADPv3Page() {
  const [activeType, setActiveType] = useState<WorkflowType | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "blocked" | "warning" | "ok" | "done">("all");

  const casesByType = useMemo(() =>
    Object.fromEntries(WORKFLOW_TYPES.map(t => [t, allCases.filter(c => c.workflowType === t)])),
    []
  );

  const filteredCases = useMemo(() => {
    let cases = activeType ? (casesByType[activeType] ?? []) : allCases;
    if (statusFilter !== "all") cases = cases.filter(c => getHealth(c) === statusFilter);
    return cases;
  }, [activeType, statusFilter, casesByType]);

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    const allSel = filteredCases.every(c => selected.has(c.id));
    setSelected(prev => {
      const n = new Set(prev);
      filteredCases.forEach(c => allSel ? n.delete(c.id) : n.add(c.id));
      return n;
    });
  }

  const selectedItems = filteredCases.filter(c => selected.has(c.id));
  const allSel = filteredCases.length > 0 && filteredCases.every(c => selected.has(c.id));
  const someSel = filteredCases.some(c => selected.has(c.id));

  const statusTabs = [
    { key: "all",     label: "Tous",       count: activeType ? (casesByType[activeType]?.length ?? 0) : allCases.length },
    { key: "blocked", label: "Bloqués",    count: (activeType ? (casesByType[activeType] ?? []) : allCases).filter(c => getHealth(c) === "blocked").length },
    { key: "warning", label: "En attente", count: (activeType ? (casesByType[activeType] ?? []) : allCases).filter(c => getHealth(c) === "warning").length },
    { key: "ok",      label: "En cours",   count: (activeType ? (casesByType[activeType] ?? []) : allCases).filter(c => getHealth(c) === "ok").length },
    { key: "done",    label: "Terminés",   count: (activeType ? (casesByType[activeType] ?? []) : allCases).filter(c => getHealth(c) === "done").length },
  ] as const;

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* Orb macro view */}
      <div className="relative shrink-0 border-b border-border bg-background overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-2 flex flex-col items-center gap-0.5 z-10">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {activeType ? "Cliquez à nouveau pour voir tout" : "Cliquez sur une sphère pour filtrer"}
          </span>
        </div>

        <div className="flex items-end justify-center gap-1 px-4 pt-6">
          {WORKFLOW_TYPES.map((type) => (
            <OrbWrapper
              key={type}
              cases={casesByType[type] ?? []}
              workflowType={type}
              isSelected={activeType === type}
              isAnySelected={activeType !== null}
              onClick={() => setActiveType(prev => prev === type ? null : type)}
              width={220}
              height={220}
            />
          ))}
        </div>

        {activeType && (
          <div className="flex justify-center pb-2">
            <button
              onClick={() => setActiveType(null)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1 text-xs font-medium text-foreground shadow hover:bg-muted transition-colors"
            >
              <ArrowLeft size={11} />
              Voir tous les workflows
            </button>
          </div>
        )}
      </div>

      {/* Case list — visible only when a workflow is selected */}
      {activeType === null ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/30">
            <ArrowLeft size={20} className="rotate-[135deg]" />
          </div>
          <p className="text-sm font-medium">Cliquez sur une sphère pour voir les dossiers</p>
          <p className="text-xs opacity-60">Chaque sphère représente un workflow actif</p>
        </div>
      ) : (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2 flex-wrap">
          <div className="flex items-center gap-1">
            {statusTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  statusFilter === tab.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                    statusFilter === tab.key ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {someSel && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground">{selectedItems.length} sél.</span>
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs"><RotateCcw size={10} /> Relancer</Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs"><Bell size={10} /> Notifier</Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs"><Pencil size={10} /> Corriger</Button>
              <Button size="sm" variant="destructive" className="h-7 gap-1 px-2 text-xs">
                <AlertCircle size={10} /> Escalader
              </Button>
            </div>
          )}
        </div>

        {/* Column header */}
        <div className="flex items-center gap-3 border-b border-border/40 bg-muted/20 px-4 py-1.5">
          <Checkbox checked={allSel ? true : someSel ? "indeterminate" : false} onCheckedChange={toggleAll} />
          <span className="w-7 shrink-0" />
          <span className="min-w-[130px] text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Salarié</span>
          <span className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Statut</span>
          <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Point bloquant</span>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40">
          {filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <CheckCircle2 size={28} className="text-emerald-500" />
              <p className="text-sm font-medium">Aucun dossier dans cette catégorie</p>
            </div>
          ) : (
            filteredCases.map(c => (
              <CaseRow
                key={c.id}
                c={c}
                selected={selected.has(c.id)}
                onToggle={() => toggleSelect(c.id)}
                expanded={expandedId === c.id}
                onToggleExpand={() => setExpandedId(prev => prev === c.id ? null : c.id)}
              />
            ))
          )}
        </div>

        <div className="border-t border-border/40 px-4 py-1.5 text-[10px] text-muted-foreground">
          {filteredCases.length} dossier{filteredCases.length > 1 ? "s" : ""}
          {activeType && ` · ${typeConfig[activeType].label}`}
          {statusFilter !== "all" && ` · ${statusTabs.find(t => t.key === statusFilter)?.label}`}
        </div>
      </div>
      )}
    </div>
  );
}
