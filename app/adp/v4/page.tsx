"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  UserPlus, UserMinus, FileText, CalendarOff, FolderOpen,
  CheckCircle2, Clock, XCircle, Zap, ShieldCheck, Hand,
  RotateCcw, Bell, Pencil, AlertCircle, ChevronDown, Send,
  Sparkles, MessageSquare, X, ArrowUpRight, Globe,
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
type Health = "blocked" | "warning" | "ok" | "done";
type StatusFilter = "all" | "blocked" | "waiting" | "ok" | "done";

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
  demoLink?: string;
};

type ChatMessage = {
  id: string;
  role: "kalia" | "user" | "action";
  text: string;
  card?: "summary" | "blocker" | "case";
  caseId?: string;
  timestamp: Date;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const allCases: EmployeeCase[] = [
  {
    id: "ob-td", name: "Thomas Durand", initials: "TD", role: "Développeur Backend",
    workflowType: "onboarding", workflowLabel: "Onboarding administratif",
    mode: "full-auto", updatedAt: "en cours",
    demoLink: "/demo/onboarding",
    steps: [
      { id: "s1", label: "Dossier initialisé — CV et données Core HR récupérés", status: "ok", by: "kalia" },
      { id: "s2", label: "Convention collective vérifiée (Syntec)", status: "ok", by: "kalia" },
      { id: "s3", label: "Proposition de poste envoyée", status: "ok", by: "kalia" },
      { id: "s4", label: "Acceptation Thomas reçue", status: "ok", by: "kalia" },
      { id: "s5", label: "Contrat CDI généré + contrôles (6/6 OK)", status: "ok", by: "kalia" },
      { id: "s6", label: "Circuit Yousign lancé", status: "waiting", detail: "En attente de signature de Thomas Durand" },
      { id: "s7", label: "DPAE + collecte des documents", status: "pending" },
      { id: "s8", label: "Intégration Lucca + Silae", status: "pending" },
    ],
  },
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
  {
    id: "ab-2", name: "Hélène Martin", initials: "HM", role: "Juriste",
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
];

// ─── Config ───────────────────────────────────────────────────────────────────

const typeConfig: Record<WorkflowType, {
  icon: React.ElementType; label: string;
  color: string; bg: string; ringColor: string; trackColor: string;
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

function getHealth(c: EmployeeCase): Health {
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

// ─── Radial Ring ──────────────────────────────────────────────────────────────

function RadialRing({ pct, color, track, size = 40 }: { pct: number; color: string; track: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.5s ease" }} />
    </svg>
  );
}

// ─── Pulse Dot ────────────────────────────────────────────────────────────────

function PulseDot({ health }: { health: Health }) {
  const cls = {
    blocked: "bg-red-500",
    warning: "bg-amber-400",
    ok: "bg-blue-500",
    done: "bg-emerald-500",
  }[health];
  const speed = health === "blocked" ? "animate-[pulse_0.8s_ease-in-out_infinite]"
    : health === "warning" ? "animate-[pulse_1.4s_ease-in-out_infinite]"
    : "animate-[pulse_2.5s_ease-in-out_infinite]";
  return (
    <span className="relative flex h-2 w-2">
      <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", cls, speed)} />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", cls)} />
    </span>
  );
}

// ─── Workflow Card ────────────────────────────────────────────────────────────

function WorkflowCard({ type, cases, isActive, onClick }: {
  type: WorkflowType; cases: EmployeeCase[]; isActive: boolean; onClick: () => void;
}) {
  const cfg = typeConfig[type];
  const Icon = cfg.icon;
  const blocked = cases.filter(c => getHealth(c) === "blocked").length;
  const warning = cases.filter(c => getHealth(c) === "warning").length;
  const done = cases.filter(c => getHealth(c) === "done").length;
  const avgProgress = cases.length ? Math.round(cases.reduce((s, c) => s + calcProgress(c), 0) / cases.length) : 0;
  const health: Health = blocked > 0 ? "blocked" : warning > 0 ? "warning" : done === cases.length ? "done" : "ok";
  const stacks = cases.slice(0, 4);
  const overflow = cases.length - stacks.length;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-xl border p-3.5 text-left transition-all duration-200 hover:shadow-sm",
        isActive ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card hover:border-border/80"
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", cfg.bg)}>
          <Icon size={14} className={cfg.color} />
        </div>
        <div className="flex items-center gap-2">
          <PulseDot health={health} />
          <RadialRing pct={avgProgress} color={cfg.ringColor} track={cfg.trackColor} size={36} />
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-foreground">{cfg.label}</div>
        <div className="text-[11px] text-muted-foreground">{cases.length} dossier{cases.length > 1 ? "s" : ""}</div>
      </div>
      <div className="flex flex-wrap gap-1">
        {blocked > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-400">
            <XCircle size={7} /> {blocked}
          </span>
        )}
        {warning > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            <Clock size={7} /> {warning}
          </span>
        )}
        {done > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckCircle2 size={7} /> {done}
          </span>
        )}
      </div>
      <div className="flex items-center gap-0">
        {stacks.map((c, i) => {
          const h = getHealth(c);
          const ringCls = { blocked: "ring-red-400", warning: "ring-amber-400", done: "ring-emerald-400", ok: "ring-blue-400" }[h];
          return (
            <div key={c.id} title={c.name}
              style={{ marginLeft: i === 0 ? 0 : -5, zIndex: stacks.length - i }}
              className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[8px] font-semibold text-muted-foreground ring-1 ring-background", ringCls)}
            >{c.initials}</div>
          );
        })}
        {overflow > 0 && (
          <div style={{ marginLeft: -5 }} className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[8px] font-semibold text-muted-foreground ring-1 ring-background">
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
    <div className="space-y-1.5 border-t border-border/40 pt-2">
      {steps.map(s => {
        const Icon = iconMap[s.status];
        return (
          <div key={s.id} className="flex items-start gap-2 text-xs">
            <Icon size={11} className={cn("mt-0.5 shrink-0", colorMap[s.status])} />
            <span className={cn(s.status === "pending" || s.status === "skipped" ? "text-muted-foreground/40" : "text-foreground/80")}>
              {s.label}
              {s.detail && <span className="ml-1 text-muted-foreground opacity-60">— {s.detail}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Case Row ─────────────────────────────────────────────────────────────────

function CaseRow({ c, selected, onToggle, expanded, onToggleExpand, onSelect, highlighted }: {
  c: EmployeeCase; selected: boolean; onToggle: () => void;
  expanded: boolean; onToggleExpand: () => void;
  onSelect: () => void; highlighted: boolean;
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
    <div className={cn(
      "transition-all duration-300 border-b border-border/40 last:border-b-0",
      selected && "bg-muted/30",
      highlighted && "bg-primary/5 ring-1 ring-inset ring-primary/20",
    )}>
      <div className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/10">
        {/* Checkbox */}
        <div onClick={e => { e.stopPropagation(); onToggle(); }} className="shrink-0">
          <Checkbox checked={selected} />
        </div>

        {/* Avatar — click loads chat context */}
        <button
          onClick={onSelect}
          title={`Voir ${c.name} dans Kalia`}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-2 transition-shadow hover:ring-primary/50",
            {
              blocked: "bg-red-50 ring-red-200 text-red-700 dark:bg-red-500/10 dark:ring-red-500/30 dark:text-red-400",
              warning: "bg-amber-50 ring-amber-200 text-amber-700 dark:bg-amber-500/10 dark:ring-amber-500/30 dark:text-amber-400",
              done:    "bg-emerald-50 ring-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:ring-emerald-500/30 dark:text-emerald-400",
              ok:      "bg-blue-50 ring-blue-200 text-blue-700 dark:bg-blue-500/10 dark:ring-blue-500/30 dark:text-blue-400",
            }[health]
          )}
        >{c.initials}</button>

        {/* Identity — click loads chat context */}
        <button onClick={onSelect} className="min-w-0 text-left hover:underline underline-offset-2 decoration-muted-foreground/40">
          <div className="text-xs font-medium text-foreground leading-tight">{c.name}</div>
          <div className="text-[10px] text-muted-foreground leading-tight">{c.role}</div>
        </button>

        {/* Health badge */}
        <span className={cn("shrink-0 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide", healthConfig.cls)}>
          <HealthIcon size={8} />
          {healthConfig.label}
        </span>

        {/* Progress + blocker */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <ProgressDots steps={c.steps} />
          {blocker && (
            <p className="truncate text-[10px] text-muted-foreground">
              {blocker.detail && <span className="opacity-60">{blocker.detail}</span>}
            </p>
          )}
        </div>

        {/* Mode + time + expand */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
          <ModeIcon size={10} />
          <span className="hidden lg:inline">{c.updatedAt}</span>
          <button onClick={onToggleExpand} className="rounded p-0.5 hover:bg-muted transition-colors">
            <ChevronDown size={13} className={cn("transition-transform duration-200", expanded && "rotate-180")} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-12 pb-3">
          <StepList steps={c.steps} />
          {c.demoLink && (
            <Link href={c.demoLink}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-dashed border-amber-400/50 bg-amber-50/50 px-2 py-1 text-[10px] font-medium text-amber-700 hover:bg-amber-100/60 transition-colors dark:border-amber-400/30 dark:bg-amber-400/5 dark:text-amber-300"
            >
              <Zap size={10} />
              Voir la démo Kalia en direct
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Chat Message Bubble ──────────────────────────────────────────────────────

function ChatBubble({ msg, cases, onHighlight }: {
  msg: ChatMessage;
  cases: EmployeeCase[];
  onHighlight: (id: string) => void;
}) {
  const isKalia = msg.role === "kalia";
  const isAction = msg.role === "action";

  if (isAction) {
    return (
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
          <CheckCircle2 size={11} />
          {msg.text}
        </span>
      </div>
    );
  }

  const caseData = msg.caseId ? cases.find(c => c.id === msg.caseId) : null;

  return (
    <div className={cn("flex items-end gap-2", isKalia ? "flex-row" : "flex-row-reverse")}>
      {isKalia && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles size={11} />
        </div>
      )}
      <div className={cn(
        "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
        isKalia ? "rounded-bl-sm bg-card border border-border text-foreground"
                : "rounded-br-sm bg-primary text-primary-foreground"
      )}>
        <p className="whitespace-pre-wrap">{msg.text}</p>

        {/* Summary card */}
        {msg.card === "summary" && (
          <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-xl border border-border/60 bg-muted/40 p-2.5">
            {(["onboarding","offboarding","absence","document","completude"] as WorkflowType[]).slice(0,3).map(t => {
              const tc = typeConfig[t];
              const Icon = tc.icon;
              const count = cases.filter(c => c.workflowType === t).length;
              const blocked = cases.filter(c => c.workflowType === t && getHealth(c) === "blocked").length;
              return (
                <div key={t} className="flex flex-col gap-0.5 rounded-lg bg-background p-2">
                  <div className="flex items-center gap-1">
                    <Icon size={10} className={tc.color} />
                    <span className="text-[10px] font-medium text-foreground">{tc.label}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-foreground">{count}</span>
                  {blocked > 0 && <span className="text-[9px] text-red-500">{blocked} bloqué{blocked > 1 ? "s" : ""}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Blocker card */}
        {msg.card === "blocker" && (
          <div className="mt-2 space-y-1.5 rounded-xl border border-red-200/60 bg-red-50/40 p-2.5 dark:border-red-500/20 dark:bg-red-500/5">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-red-700 dark:text-red-400">
              <XCircle size={10} />
              Blocants actifs
            </div>
            {cases.filter(c => getHealth(c) === "blocked").map(c => {
              const step = getBlockingStep(c);
              return (
                <button key={c.id} onClick={() => onHighlight(c.id)}
                  className="flex w-full items-start gap-1.5 rounded-lg bg-background p-1.5 text-left hover:bg-muted/50 transition-colors">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-100 text-[8px] font-bold text-red-700 dark:bg-red-500/15 dark:text-red-400">{c.initials}</span>
                  <div>
                    <div className="text-[10px] font-medium text-foreground">{c.name}</div>
                    {step?.detail && <div className="text-[9px] text-muted-foreground">{step.detail}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Case detail card */}
        {msg.card === "case" && caseData && (
          <div className="mt-2 rounded-xl border border-border/60 bg-muted/30 p-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-foreground">{caseData.workflowLabel}</span>
              <Badge variant="secondary" className="text-[9px] py-0 px-1">{calcProgress(caseData)}%</Badge>
            </div>
            <StepList steps={caseData.steps} />
            {caseData.demoLink && (
              <Link href={caseData.demoLink}
                className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                <ArrowUpRight size={10} /> Voir la démo complète
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Quick Replies ────────────────────────────────────────────────────────────

function QuickReplies({ context, onSend }: { context: EmployeeCase | null; onSend: (t: string) => void }) {
  const replies = context
    ? ["Relancer", "Corriger le blocant", "Escalader au manager", "Voir la conversation complète"]
    : ["Voir les blocants", "Relancer tout", "Notifier les managers", "Résumé du jour"];
  return (
    <div className="flex flex-wrap gap-1.5 px-3 pb-2 pt-1">
      {replies.map(r => (
        <button key={r} onClick={() => onSend(r)}
          className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground transition-colors">
          {r}
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ADPv4Page() {
  const [activeType, setActiveType] = useState<WorkflowType | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedCase, setSelectedCase] = useState<EmployeeCase | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const totalBlocked = allCases.filter(c => getHealth(c) === "blocked").length;
  const totalWarning = allCases.filter(c => getHealth(c) === "warning").length;

  // Init chat with day summary
  useEffect(() => {
    const initMsgs: ChatMessage[] = [
      {
        id: "init-1", role: "kalia", timestamp: new Date(),
        text: `Bonjour ! Voici un résumé de l'activité ADP en cours sur ${allCases.length} dossiers actifs.`,
        card: "summary",
      },
      {
        id: "init-2", role: "kalia", timestamp: new Date(),
        text: `${totalBlocked} dossier${totalBlocked > 1 ? "s sont bloqués" : " est bloqué"} et nécessite${totalBlocked > 1 ? "nt" : ""} votre attention. Voici les points blocants :`,
        card: "blocker",
      },
    ];
    setMessages(initMsgs);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // When a case is selected, load its context in chat
  function handleSelectCase(c: EmployeeCase) {
    setSelectedCase(c);
    const health = getHealth(c);
    const blocker = getBlockingStep(c);
    const statusLabel = { blocked: "bloqué", warning: "en attente", ok: "en cours", done: "terminé" }[health];

    const msg: ChatMessage = {
      id: `case-${c.id}-${Date.now()}`, role: "kalia", timestamp: new Date(),
      text: `Dossier **${c.name}** (${c.role}) — statut : ${statusLabel}.${blocker ? `\nPoint bloquant : ${blocker.label}${blocker.detail ? " — " + blocker.detail : ""}.` : " Aucun point bloquant."}`,
      card: "case",
      caseId: c.id,
    };
    setMessages(prev => [...prev, msg]);
  }

  function handleHighlight(id: string) {
    setHighlighted(id);
    // Expand that row
    setExpanded(prev => new Set([...prev, id]));
    setTimeout(() => setHighlighted(null), 2000);
  }

  function handleSend(text?: string) {
    const content = (text || input).trim();
    if (!content) return;
    setInput("");

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    // Contextual Kalia reply
    setTimeout(() => {
      let replyText = "";
      let card: ChatMessage["card"] = undefined;
      let caseId: string | undefined;

      if (selectedCase) {
        if (/relancer/i.test(content)) {
          replyText = `Relance envoyée à ${selectedCase.name}. Je vous notifie dès qu'une réponse est reçue.`;
          setMessages(prev => [...prev, { id: `k-${Date.now()}`, role: "kalia", text: replyText, timestamp: new Date() }]);
          setTimeout(() => {
            setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: "action", text: `Relance envoyée — ${selectedCase.name}`, timestamp: new Date() }]);
            handleHighlight(selectedCase.id);
          }, 600);
          return;
        } else if (/escalader/i.test(content)) {
          replyText = `Escalade créée pour ${selectedCase.name}. Le manager RH a été notifié.`;
        } else if (/corriger/i.test(content)) {
          replyText = `Je prépare une correction pour le dossier de ${selectedCase.name}. Quelle information souhaitez-vous corriger ?`;
        } else {
          replyText = `Sur le dossier de ${selectedCase.name} : que souhaitez-vous faire ? Relancer, corriger ou escalader ?`;
        }
      } else {
        if (/blocant|bloqu/i.test(content)) {
          replyText = `Voici les ${totalBlocked} dossiers bloqués actuellement :`;
          card = "blocker";
        } else if (/relancer tout/i.test(content)) {
          replyText = `Lancement des relances pour les ${totalBlocked} dossiers bloqués…`;
          setMessages(prev => [...prev, { id: `k-${Date.now()}`, role: "kalia", text: replyText, timestamp: new Date() }]);
          setTimeout(() => {
            setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: "action", text: `${totalBlocked} relances envoyées`, timestamp: new Date() }]);
          }, 800);
          return;
        } else if (/résumé|resume/i.test(content)) {
          replyText = `${allCases.length} dossiers actifs — ${totalBlocked} bloqués, ${totalWarning} en attente.`;
          card = "summary";
        } else {
          replyText = `Compris. Je traite votre demande sur l'ensemble des workflows. Souhaitez-vous que je filtre sur un type de dossier spécifique ?`;
        }
      }

      setMessages(prev => [...prev, { id: `k-${Date.now()}`, role: "kalia", text: replyText, card, caseId, timestamp: new Date() }]);
    }, 400);
  }

  // Filtered cases
  const filteredCases = useMemo(() => {
    let list = activeType ? allCases.filter(c => c.workflowType === activeType) : allCases;
    if (statusFilter === "blocked") list = list.filter(c => getHealth(c) === "blocked");
    else if (statusFilter === "waiting") list = list.filter(c => getHealth(c) === "warning");
    else if (statusFilter === "ok") list = list.filter(c => getHealth(c) === "ok");
    else if (statusFilter === "done") list = list.filter(c => getHealth(c) === "done");
    return list;
  }, [activeType, statusFilter]);

  const workflowTypes: WorkflowType[] = ["onboarding", "offboarding", "absence", "document", "completude"];

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "blocked", label: "Bloqués" },
    { key: "waiting", label: "En attente" },
    { key: "ok", label: "En cours" },
    { key: "done", label: "Terminés" },
  ];

  const allSelected = filteredCases.length > 0 && filteredCases.every(c => selected.has(c.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(prev => { const n = new Set(prev); filteredCases.forEach(c => n.delete(c.id)); return n; });
    } else {
      setSelected(prev => { const n = new Set(prev); filteredCases.forEach(c => n.add(c.id)); return n; });
    }
  }

  const selectedList = filteredCases.filter(c => selected.has(c.id));

  // When cases are selected, Kalia proposes bulk action
  useEffect(() => {
    if (selectedList.length >= 2) {
      const blockedSel = selectedList.filter(c => getHealth(c) === "blocked").length;
      const text = blockedSel > 0
        ? `Vous avez sélectionné ${selectedList.length} dossiers dont ${blockedSel} bloqué${blockedSel > 1 ? "s" : ""}. Voulez-vous que je les relance ?`
        : `Vous avez sélectionné ${selectedList.length} dossiers. Que souhaitez-vous faire avec eux ?`;
      setMessages(prev => {
        if (prev[prev.length - 1]?.text === text) return prev;
        return [...prev, { id: `sel-${Date.now()}`, role: "kalia", text, timestamp: new Date() }];
      });
    }
  }, [selectedList.length]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">

      {/* ── Left panel: supervision ── */}
      <div className={cn(
        "flex flex-col border-r border-border overflow-hidden transition-all duration-300",
        chatOpen ? "w-full md:w-[58%] lg:w-[60%]" : "w-full"
      )}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h1 className="text-sm font-semibold text-foreground">Workflows ADP</h1>
            <p className="text-[11px] text-muted-foreground">
              {allCases.length} dossiers actifs
              {totalBlocked > 0 && <> · <span className="text-red-500 font-medium">{totalBlocked} bloqués</span></>}
              {totalWarning > 0 && <> · <span className="text-amber-500 font-medium">{allCases.filter(c => getHealth(c) === "warning").length} en attente</span></>}
            </p>
          </div>
          <button
            onClick={() => setChatOpen(p => !p)}
            className="hidden md:flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <MessageSquare size={12} />
            {chatOpen ? "Masquer Kalia" : "Afficher Kalia"}
          </button>
        </div>

        {/* Workflow cards grid */}
        <div className="shrink-0 grid grid-cols-5 gap-2 p-3 border-b border-border/60">
          {workflowTypes.map(t => (
            <WorkflowCard
              key={t}
              type={t}
              cases={allCases.filter(c => c.workflowType === t)}
              isActive={activeType === t}
              onClick={() => setActiveType(prev => prev === t ? null : t)}
            />
          ))}
        </div>

        {/* Bulk actions */}
        {selectedList.length > 0 && (
          <div className="shrink-0 flex items-center gap-2 border-b border-border/60 bg-muted/30 px-3 py-2">
            <span className="text-[11px] font-medium text-foreground">{selectedList.length} sélectionné{selectedList.length > 1 ? "s" : ""}</span>
            <div className="flex items-center gap-1.5 ml-2">
              {[
                { icon: RotateCcw, label: "Relancer", action: () => {
                  handleSend(`Relancer les ${selectedList.length} dossiers sélectionnés`);
                  setSelected(new Set());
                }},
                { icon: Bell, label: "Notifier", action: () => {
                  handleSend(`Notifier les managers pour les ${selectedList.length} dossiers sélectionnés`);
                  setSelected(new Set());
                }},
                { icon: Pencil, label: "Corriger", action: () => {
                  handleSend(`Corriger les ${selectedList.length} dossiers sélectionnés`);
                  setSelected(new Set());
                }},
                { icon: AlertCircle, label: "Escalader", action: () => {
                  handleSend(`Escalader les ${selectedList.length} dossiers sélectionnés`);
                  setSelected(new Set());
                }},
              ].map(({ icon: Icon, label, action }) => (
                <Button key={label} size="sm" variant="outline" onClick={action}
                  className="h-6 gap-1 px-2 text-[10px]">
                  <Icon size={10} /> {label}
                </Button>
              ))}
            </div>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-muted-foreground hover:text-foreground">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Status tabs */}
        <div className="shrink-0 flex items-center gap-0 border-b border-border/60 px-3">
          {statusTabs.map(tab => {
            const count = tab.key === "all" ? filteredCases.length
              : tab.key === "blocked" ? filteredCases.filter(c => getHealth(c) === "blocked").length
              : tab.key === "waiting" ? filteredCases.filter(c => getHealth(c) === "warning").length
              : tab.key === "ok" ? filteredCases.filter(c => getHealth(c) === "ok").length
              : filteredCases.filter(c => getHealth(c) === "done").length;
            return (
              <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  "flex items-center gap-1 border-b-2 px-3 py-2.5 text-[11px] font-medium transition-colors",
                  statusFilter === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}>
                {tab.label}
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px]",
                  statusFilter === tab.key ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                )}>{count}</span>
              </button>
            );
          })}

          {/* Select all checkbox */}
          <div className="ml-auto flex items-center gap-1.5 pr-1">
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} className="h-3.5 w-3.5" />
            <span className="text-[10px] text-muted-foreground">Tout</span>
          </div>
        </div>

        {/* Case list */}
        <div className="flex-1 overflow-y-auto">
          {filteredCases.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-xs gap-1">
              <CheckCircle2 size={20} className="opacity-30" />
              Aucun dossier dans cette catégorie
            </div>
          )}
          {filteredCases.map(c => (
            <CaseRow
              key={c.id}
              c={c}
              selected={selected.has(c.id)}
              onToggle={() => setSelected(prev => { const n = new Set(prev); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })}
              expanded={expanded.has(c.id)}
              onToggleExpand={() => setExpanded(prev => { const n = new Set(prev); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })}
              onSelect={() => handleSelectCase(c)}
              highlighted={highlighted === c.id}
            />
          ))}
        </div>
      </div>

      {/* ── Right panel: Kalia chat ── */}
      {chatOpen && (
        <div className="hidden md:flex flex-col flex-1 overflow-hidden border-l border-border">
          {/* Chat header */}
          <div className="shrink-0 flex items-center gap-2.5 border-b border-border px-4 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">Kalia</span>
                <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  En ligne
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">
                {selectedCase ? `Dossier : ${selectedCase.name}` : "Vue globale — tous les workflows"}
              </p>
            </div>
            {selectedCase && (
              <button
                onClick={() => setSelectedCase(null)}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-muted/50 transition-colors"
              >
                <Globe size={10} />
                Vue globale
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 px-3 py-4">
            {messages.map(msg => (
              <ChatBubble
                key={msg.id}
                msg={msg}
                cases={allCases}
                onHighlight={handleHighlight}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          <QuickReplies context={selectedCase} onSend={handleSend} />

          {/* Input */}
          <div className="shrink-0 border-t border-border p-3">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder={selectedCase ? `Question sur ${selectedCase.name}…` : "Commandez Kalia…"}
                className="min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
                rows={1}
              />
              <Button size="icon" onClick={() => handleSend()} disabled={!input.trim()}
                className="h-7 w-7 shrink-0 rounded-lg">
                <Send size={12} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile chat FAB */}
      <button
        onClick={() => setChatOpen(p => !p)}
        className="fixed bottom-4 right-4 flex md:hidden items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg"
      >
        <Sparkles size={14} />
        Kalia
      </button>
    </div>
  );
}
