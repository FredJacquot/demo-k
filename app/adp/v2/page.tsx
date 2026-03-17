"use client";

import { useState, useMemo } from "react";
import {
  UserPlus, UserMinus, FileText, CalendarOff, FolderOpen,
  CheckCircle2, Clock, XCircle, Zap, ShieldCheck, Hand,
  RotateCcw, Bell, Pencil, ChevronDown, AlertCircle,
  Sparkles, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExecutionMode = "full-auto" | "auto-validation" | "assisted";
type StepStatus = "ok" | "pending" | "blocked" | "waiting" | "skipped";
type WorkflowType = "onboarding" | "offboarding" | "document" | "absence" | "completude";

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
      { id: "s2", label: "Données Core HR récupérées", status: "blocked", detail: "Date de naissance incohérente entre 2 sources" },
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
    id: "of-2", name: "Pierre Faure", initials: "PF", role: "Commercial",
    workflowType: "offboarding", workflowLabel: "Offboarding administratif",
    mode: "full-auto", updatedAt: "il y a 1j",
    steps: [
      { id: "s1", label: "Départ confirmé dans le SIRH", status: "ok", by: "kalia" },
      { id: "s2", label: "Checklist de sortie générée", status: "ok", by: "kalia" },
      { id: "s3", label: "Désactivation des accès", status: "blocked", detail: "Accès Salesforce non révoqué — droits insuffisants" },
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
  {
    id: "ab-3", name: "Hélène Martin", initials: "HM", role: "Juriste",
    workflowType: "absence", workflowLabel: "Gestion des absences",
    mode: "auto-validation", updatedAt: "il y a 5h",
    steps: [
      { id: "s1", label: "Absence détectée (5 jours)", status: "ok", by: "kalia" },
      { id: "s2", label: "Qualification du cas", status: "ok", by: "kalia" },
      { id: "s3", label: "Demande de justificatif", status: "ok", by: "kalia" },
      { id: "s4", label: "Justificatif reçu", status: "blocked", detail: "Document illisible — re-demande nécessaire" },
      { id: "s5", label: "Intégration dans la paie", status: "pending" },
    ],
  },
  {
    id: "ab-1", name: "Léa Fontaine", initials: "LF", role: "Analyste data",
    workflowType: "absence", workflowLabel: "Gestion des absences",
    mode: "full-auto", updatedAt: "hier",
    steps: [
      { id: "s1", label: "Absence détectée (3 jours)", status: "ok", by: "kalia" },
      { id: "s2", label: "Qualification du cas", status: "ok", by: "kalia" },
      { id: "s3", label: "Demande de justificatif", status: "ok", by: "kalia" },
      { id: "s4", label: "Justificatif reçu", status: "waiting", detail: "2e relance envoyée — J+1" },
      { id: "s5", label: "Intégration dans la paie", status: "pending" },
    ],
  },
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
];

// ─── Config ───────────────────────────────────────────────────────────────────

const typeConfig: Record<WorkflowType, {
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
  ringColor: string;
  trackColor: string;
}> = {
  onboarding:  { icon: UserPlus,    label: "Onboarding",   color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-500/10",    ringColor: "#3b82f6", trackColor: "#3b82f620" },
  offboarding: { icon: UserMinus,   label: "Offboarding",  color: "text-orange-600 dark:text-orange-400",bg: "bg-orange-50 dark:bg-orange-500/10",ringColor: "#f97316", trackColor: "#f9731620" },
  document:    { icon: FileText,    label: "Documents RH", color: "text-violet-600 dark:text-violet-400",bg: "bg-violet-50 dark:bg-violet-500/10",ringColor: "#8b5cf6", trackColor: "#8b5cf620" },
  absence:     { icon: CalendarOff, label: "Absences",     color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-500/10",  ringColor: "#f59e0b", trackColor: "#f59e0b20" },
  completude:  { icon: FolderOpen,  label: "Complétude",   color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-50 dark:bg-rose-500/10",    ringColor: "#f43f5e", trackColor: "#f43f5e20" },
};

const modeConfig: Record<ExecutionMode, { icon: React.ElementType; label: string }> = {
  "full-auto":       { icon: Zap,        label: "Auto" },
  "auto-validation": { icon: ShieldCheck, label: "Validation" },
  "assisted":        { icon: Hand,        label: "Assisté" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHealth(c: EmployeeCase): "blocked" | "warning" | "ok" | "done" {
  if (c.steps.every(s => s.status === "ok" || s.status === "skipped")) return "done";
  if (c.steps.some(s => s.status === "blocked")) return "blocked";
  if (c.steps.some(s => s.status === "waiting")) return "warning";
  return "ok";
}

function getBlockingStep(c: EmployeeCase): ProcessStep | undefined {
  return c.steps.find(s => s.status === "blocked") || c.steps.find(s => s.status === "waiting");
}

function calcProgress(c: EmployeeCase): number {
  const done = c.steps.filter(s => s.status === "ok" || s.status === "skipped").length;
  return Math.round((done / c.steps.length) * 100);
}

// ─── Radial Ring SVG ──────────────────────────────────────────────────────────

function RadialRing({ pct, color, track, size = 48 }: { pct: number; color: string; track: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
}

// ─── Workflow Summary Card ────────────────────────────────────────────────────

function WorkflowCard({
  type,
  cases,
  isActive,
  onClick,
}: {
  type: WorkflowType;
  cases: EmployeeCase[];
  isActive: boolean;
  onClick: () => void;
}) {
  const cfg = typeConfig[type];
  const Icon = cfg.icon;
  const blocked = cases.filter(c => getHealth(c) === "blocked").length;
  const warning = cases.filter(c => getHealth(c) === "warning").length;
  const done = cases.filter(c => getHealth(c) === "done").length;
  const avgProgress = cases.length
    ? Math.round(cases.reduce((sum, c) => sum + calcProgress(c), 0) / cases.length)
    : 0;

  const stacks = cases.slice(0, 4);
  const overflow = cases.length - stacks.length;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
        "hover:shadow-md",
        isActive
          ? "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20"
          : "border-border bg-card hover:border-border/80"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", cfg.bg)}>
          <Icon size={16} className={cfg.color} />
        </div>
        <RadialRing pct={avgProgress} color={cfg.ringColor} track={cfg.trackColor} size={40} />
      </div>

      {/* Label + count */}
      <div>
        <div className="text-sm font-semibold text-foreground">{cfg.label}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{cases.length} dossier{cases.length > 1 ? "s" : ""}</div>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-1">
        {blocked > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-400">
            <XCircle size={9} /> {blocked} bloqué{blocked > 1 ? "s" : ""}
          </span>
        )}
        {warning > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            <Clock size={9} /> {warning} en attente
          </span>
        )}
        {done > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckCircle2 size={9} /> {done} terminé{done > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Avatar stack */}
      <div className="flex items-center gap-0">
        {stacks.map((c, i) => {
          const h = getHealth(c);
          const ringCls = { blocked: "ring-red-400", warning: "ring-amber-400", done: "ring-emerald-400", ok: "ring-blue-400" }[h];
          return (
            <div
              key={c.id}
              title={c.name}
              style={{ marginLeft: i === 0 ? 0 : -6, zIndex: stacks.length - i }}
              className={cn(
                "relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground ring-1.5 ring-background",
                ringCls
              )}
            >
              {c.initials}
            </div>
          );
        })}
        {overflow > 0 && (
          <div
            style={{ marginLeft: -6 }}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground ring-1.5 ring-background"
          >
            +{overflow}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Progress Dots ────────────────────────────────────────────────────────────

function ProgressDots({ steps }: { steps: ProcessStep[] }) {
  const dot: Record<StepStatus, string> = {
    ok: "bg-emerald-500", blocked: "bg-red-500 animate-pulse",
    waiting: "bg-amber-400", pending: "bg-muted-foreground/20", skipped: "bg-muted-foreground/15",
  };
  return (
    <div className="flex items-center gap-0.5">
      {steps.map(s => <span key={s.id} className={cn("h-1.5 w-1.5 rounded-full", dot[s.status])} />)}
    </div>
  );
}

// ─── Step List (expanded) ─────────────────────────────────────────────────────

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
        const StepIcon = iconMap[s.status];
        return (
          <div key={s.id} className="flex items-start gap-2 text-xs">
            <StepIcon size={12} className={cn("mt-0.5 shrink-0", colorMap[s.status])} />
            <span className={cn(s.status === "pending" || s.status === "skipped" ? "text-muted-foreground/40" : "text-foreground/80")}>
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
  c,
  selected,
  onToggle,
  expanded,
  onToggleExpand,
}: {
  c: EmployeeCase;
  selected: boolean;
  onToggle: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const health = getHealth(c);
  const blocker = getBlockingStep(c);
  const TypeIcon = typeConfig[c.workflowType].icon;
  const ModeIcon = modeConfig[c.mode].icon;

  const healthConfig = {
    blocked: { cls: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400", label: "Bloqué", icon: XCircle },
    warning: { cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400", label: "En attente", icon: Clock },
    done:    { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400", label: "Terminé", icon: CheckCircle2 },
    ok:      { cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400", label: "En cours", icon: Zap },
  }[health];
  const HealthIcon = healthConfig.icon;

  return (
    <div className={cn("transition-colors", selected && "bg-muted/30")}>
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/20"
        onClick={onToggleExpand}
      >
        <div onClick={e => { e.stopPropagation(); onToggle(); }}>
          <Checkbox checked={selected} className="shrink-0" />
        </div>

        {/* Avatar */}
        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-muted-foreground ring-2",
          { blocked: "bg-red-50 ring-red-200 dark:bg-red-500/10 dark:ring-red-500/30", warning: "bg-amber-50 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30", done: "bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30", ok: "bg-blue-50 ring-blue-200 dark:bg-blue-500/10 dark:ring-blue-500/30" }[health]
        )}>
          {c.initials}
        </div>

        {/* Identity */}
        <div className="min-w-[140px]">
          <div className="text-sm font-medium text-foreground">{c.name}</div>
          <div className="text-[11px] text-muted-foreground">{c.role}</div>
        </div>

        {/* Workflow type */}
        <span className={cn(
          "hidden items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium sm:inline-flex",
          typeConfig[c.workflowType].bg, typeConfig[c.workflowType].color
        )}>
          <TypeIcon size={10} />
          {typeConfig[c.workflowType].label}
        </span>

        {/* Health */}
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", healthConfig.cls)}>
          <HealthIcon size={9} />
          {healthConfig.label}
        </span>

        {/* Progress + blocker — takes remaining space */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <ProgressDots steps={c.steps} />
          {blocker && (
            <p className="truncate text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground/70">{blocker.label}</span>
              {blocker.detail && <span className="opacity-60"> — {blocker.detail}</span>}
            </p>
          )}
        </div>

        {/* Mode + time + chevron */}
        <div className="ml-auto flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground">
          <ModeIcon size={11} />
          <span className="hidden md:inline">{c.updatedAt}</span>
          <ChevronDown size={14} className={cn("transition-transform duration-200", expanded && "rotate-180")} />
        </div>
      </div>

      {expanded && (
        <div className="px-14 pb-3">
          <StepList steps={c.steps} />
        </div>
      )}
    </div>
  );
}

// ─── Kalia Banner ─────────────────────────────────────────────────────────────

function KaliaBanner({ blocked, warning, total }: { blocked: number; warning: number; total: number }) {
  const [input, setInput] = useState("");
  const [replied, setReplied] = useState(false);

  function handleSend() {
    if (!input.trim()) return;
    setReplied(true);
    setInput("");
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        {/* Kalia icon */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles size={14} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Bonjour — voici votre point du jour.
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {total} dossiers actifs sur l'ensemble des workflows.
            {blocked > 0 && (
              <> <span className="font-semibold text-red-600 dark:text-red-400">{blocked} sont bloqués</span> et nécessitent votre attention.</>
            )}
            {warning > 0 && (
              <> <span className="font-semibold text-amber-600 dark:text-amber-400">{warning} sont en attente</span> de réponse.</>
            )}
            {!replied && " Que souhaitez-vous traiter en priorité ?"}
          </p>

          {!replied && (
            <div className="mt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Commandez Kalia... ex: relancer tous les bloquants onboarding"
                  className="min-h-0 resize-none py-2 pr-10 text-sm"
                  rows={1}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                />
                <button
                  onClick={handleSend}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ADPv2Page() {
  const [activeType, setActiveType] = useState<WorkflowType | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "blocked" | "warning" | "ok" | "done">("all");

  const workflowTypes: WorkflowType[] = ["onboarding", "offboarding", "absence", "document", "completude"];

  const casesByType = useMemo(() =>
    Object.fromEntries(workflowTypes.map(t => [t, allCases.filter(c => c.workflowType === t)])),
    []
  );

  const filteredCases = useMemo(() => {
    let cases = activeType ? casesByType[activeType] : allCases;
    if (statusFilter !== "all") cases = cases.filter(c => getHealth(c) === statusFilter);
    return cases;
  }, [activeType, statusFilter, casesByType]);

  const blockedCount = allCases.filter(c => getHealth(c) === "blocked").length;
  const warningCount = allCases.filter(c => getHealth(c) === "warning").length;

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (filteredCases.every(c => selected.has(c.id))) {
      setSelected(prev => { const next = new Set(prev); filteredCases.forEach(c => next.delete(c.id)); return next; });
    } else {
      setSelected(prev => { const next = new Set(prev); filteredCases.forEach(c => next.add(c.id)); return next; });
    }
  }

  const selectedItems = filteredCases.filter(c => selected.has(c.id));
  const allFilteredSelected = filteredCases.length > 0 && filteredCases.every(c => selected.has(c.id));
  const someFilteredSelected = filteredCases.some(c => selected.has(c.id));

  const statusTabs = [
    { key: "all",     label: "Tous",        count: activeType ? (casesByType[activeType]?.length ?? 0) : allCases.length },
    { key: "blocked", label: "Bloqués",     count: (activeType ? casesByType[activeType] : allCases).filter(c => getHealth(c) === "blocked").length },
    { key: "warning", label: "En attente",  count: (activeType ? casesByType[activeType] : allCases).filter(c => getHealth(c) === "warning").length },
    { key: "ok",      label: "En cours",    count: (activeType ? casesByType[activeType] : allCases).filter(c => getHealth(c) === "ok").length },
    { key: "done",    label: "Terminés",    count: (activeType ? casesByType[activeType] : allCases).filter(c => getHealth(c) === "done").length },
  ] as const;

  return (
    <div className="flex h-full flex-col gap-5 p-6">

      {/* Kalia banner */}
      <KaliaBanner blocked={blockedCount} warning={warningCount} total={allCases.length} />

      {/* Workflow macro grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vue par workflow</h2>
          {activeType && (
            <button onClick={() => setActiveType(null)} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
              Voir tout
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {workflowTypes.map(type => (
            <WorkflowCard
              key={type}
              type={type}
              cases={casesByType[type] ?? []}
              isActive={activeType === type}
              onClick={() => setActiveType(prev => prev === type ? null : type)}
            />
          ))}
        </div>
      </div>

      {/* Case list */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
        {/* List header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
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

          {/* Bulk action toolbar */}
          {someFilteredSelected && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{selectedItems.length} sélectionné{selectedItems.length > 1 ? "s" : ""}</span>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-xs">
                <RotateCcw size={11} /> Relancer
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-xs">
                <Bell size={11} /> Notifier
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-xs">
                <Pencil size={11} /> Corriger
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-xs text-red-600 hover:text-red-700 dark:text-red-400">
                <AlertCircle size={11} /> Escalader
              </Button>
            </div>
          )}
        </div>

        {/* Column header */}
        <div className="flex items-center gap-3 border-b border-border/50 bg-muted/30 px-4 py-2">
          <Checkbox
            checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
            onCheckedChange={toggleAll}
          />
          <span className="w-8 shrink-0" />
          <span className="min-w-[140px] text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Salarié</span>
          <span className="hidden text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:block" style={{ width: 110 }}>Workflow</span>
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground" style={{ width: 90 }}>Statut</span>
          <span className="flex-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Point bloquant</span>
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

        {/* Footer count */}
        <div className="border-t border-border/50 px-4 py-2 text-[11px] text-muted-foreground">
          {filteredCases.length} dossier{filteredCases.length > 1 ? "s" : ""}
          {activeType && ` dans ${typeConfig[activeType].label}`}
          {statusFilter !== "all" && ` · filtre: ${statusTabs.find(t => t.key === statusFilter)?.label}`}
        </div>
      </div>
    </div>
  );
}
