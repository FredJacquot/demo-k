"use client";

import { useState, useMemo } from "react";
import {
  UserPlus,
  UserMinus,
  FileText,
  CalendarOff,
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Zap,
  ShieldCheck,
  Hand,
  RotateCcw,
  Play,
  Send,
  Pencil,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

// ─── Types ──────────────────────────────────────────────────────────────────────

type ExecutionMode = "full-auto" | "auto-validation" | "assisted";
type StepStatus = "ok" | "pending" | "blocked" | "waiting" | "skipped";
type WorkflowType = "onboarding" | "offboarding" | "document" | "absence" | "completude";

type ProcessStep = {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
  by?: "kalia" | "human";
  time?: string;
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

// ─── Mock data ───────────────────────────────────────────────────────────────────

const allCases: EmployeeCase[] = [
  // Onboarding
  {
    id: "ob-1", name: "Sophie Marchand", initials: "SM", role: "Chargée de projet",
    workflowType: "onboarding", workflowLabel: "Onboarding administratif",
    mode: "auto-validation", updatedAt: "Il y a 2h",
    steps: [
      { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia", time: "09:14" },
      { id: "s2", label: "Données Core HR récupérées", status: "ok", by: "kalia", time: "09:15" },
      { id: "s3", label: "Pièces d'identité reçues", status: "blocked", by: "kalia", detail: "Relance envoyée x2 — sans réponse" },
      { id: "s4", label: "Création dans le SIRH", status: "pending" },
      { id: "s5", label: "Envoi des accès et contrat", status: "pending" },
    ],
  },
  {
    id: "ob-2", name: "Nathan Leroy", initials: "NL", role: "Développeur",
    workflowType: "onboarding", workflowLabel: "Onboarding administratif",
    mode: "full-auto", updatedAt: "Il y a 1h",
    steps: [
      { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia" },
      { id: "s2", label: "Données Core HR récupérées", status: "ok", by: "kalia" },
      { id: "s3", label: "Pièces d'identité reçues", status: "ok", by: "kalia" },
      { id: "s4", label: "Création dans le SIRH", status: "ok", by: "kalia" },
      { id: "s5", label: "Envoi des accès et contrat", status: "waiting", detail: "En attente signature électronique" },
    ],
  },
  {
    id: "ob-3", name: "Camille Dubois", initials: "CD", role: "Designer UX",
    workflowType: "onboarding", workflowLabel: "Onboarding administratif",
    mode: "auto-validation", updatedAt: "Hier",
    steps: [
      { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia" },
      { id: "s2", label: "Données Core HR récupérées", status: "ok", by: "kalia" },
      { id: "s3", label: "Pièces d'identité reçues", status: "ok", by: "kalia" },
      { id: "s4", label: "Création dans le SIRH", status: "waiting", detail: "En attente de validation GP" },
      { id: "s5", label: "Envoi des accès et contrat", status: "pending" },
    ],
  },
  {
    id: "ob-4", name: "Pauline Girard", initials: "PG", role: "Responsable marketing",
    workflowType: "onboarding", workflowLabel: "Onboarding administratif",
    mode: "full-auto", updatedAt: "Il y a 30 min",
    steps: [
      { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia" },
      { id: "s2", label: "Données Core HR récupérées", status: "blocked", detail: "Date de naissance incohérente entre 2 sources" },
      { id: "s3", label: "Pièces d'identité reçues", status: "pending" },
      { id: "s4", label: "Création dans le SIRH", status: "pending" },
      { id: "s5", label: "Envoi des accès et contrat", status: "pending" },
    ],
  },
  {
    id: "ob-5", name: "Romain Bernard", initials: "RB", role: "Ingénieur DevOps",
    workflowType: "onboarding", workflowLabel: "Onboarding administratif",
    mode: "assisted", updatedAt: "Il y a 3h",
    steps: [
      { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia" },
      { id: "s2", label: "Données Core HR récupérées", status: "ok", by: "kalia" },
      { id: "s3", label: "Pièces d'identité reçues", status: "ok", by: "kalia" },
      { id: "s4", label: "Création dans le SIRH", status: "ok", by: "human" },
      { id: "s5", label: "Envoi des accès et contrat", status: "ok", by: "kalia" },
    ],
  },
  // Offboarding
  {
    id: "of-1", name: "Julie Moreau", initials: "JM", role: "Assistante RH",
    workflowType: "offboarding", workflowLabel: "Offboarding administratif",
    mode: "auto-validation", updatedAt: "Il y a 4h",
    steps: [
      { id: "s1", label: "Départ confirmé dans le SIRH", status: "ok", by: "kalia" },
      { id: "s2", label: "Checklist de sortie générée", status: "ok", by: "kalia" },
      { id: "s3", label: "Désactivation des accès", status: "ok", by: "kalia" },
      { id: "s4", label: "Solde de tout compte préparé", status: "waiting", detail: "En attente de validation GP" },
      { id: "s5", label: "Attestation employeur générée", status: "pending" },
      { id: "s6", label: "Archivage du dossier", status: "pending" },
    ],
  },
  {
    id: "of-2", name: "Pierre Faure", initials: "PF", role: "Commercial",
    workflowType: "offboarding", workflowLabel: "Offboarding administratif",
    mode: "full-auto", updatedAt: "Il y a 1j",
    steps: [
      { id: "s1", label: "Départ confirmé dans le SIRH", status: "ok", by: "kalia" },
      { id: "s2", label: "Checklist de sortie générée", status: "ok", by: "kalia" },
      { id: "s3", label: "Désactivation des accès", status: "blocked", detail: "Accès Salesforce non révoqué — droits insuffisants" },
      { id: "s4", label: "Solde de tout compte préparé", status: "pending" },
      { id: "s5", label: "Attestation employeur générée", status: "pending" },
      { id: "s6", label: "Archivage du dossier", status: "pending" },
    ],
  },
  {
    id: "of-3", name: "Amandine Petit", initials: "AP", role: "Comptable",
    workflowType: "offboarding", workflowLabel: "Offboarding administratif",
    mode: "auto-validation", updatedAt: "Il y a 2j",
    steps: [
      { id: "s1", label: "Départ confirmé dans le SIRH", status: "ok", by: "kalia" },
      { id: "s2", label: "Checklist de sortie générée", status: "ok", by: "kalia" },
      { id: "s3", label: "Désactivation des accès", status: "ok", by: "kalia" },
      { id: "s4", label: "Solde de tout compte préparé", status: "ok", by: "human" },
      { id: "s5", label: "Attestation employeur générée", status: "ok", by: "kalia" },
      { id: "s6", label: "Archivage du dossier", status: "ok", by: "kalia" },
    ],
  },
  // Absence
  {
    id: "ab-1", name: "Léa Fontaine", initials: "LF", role: "Analyste data",
    workflowType: "absence", workflowLabel: "Gestion des absences",
    mode: "full-auto", updatedAt: "Hier",
    steps: [
      { id: "s1", label: "Absence détectée (3 jours)", status: "ok", by: "kalia" },
      { id: "s2", label: "Qualification du cas", status: "ok", by: "kalia" },
      { id: "s3", label: "Demande de justificatif", status: "ok", by: "kalia" },
      { id: "s4", label: "Justificatif reçu", status: "waiting", detail: "2e relance envoyée — J+1" },
      { id: "s5", label: "Intégration dans la paie", status: "pending" },
    ],
  },
  {
    id: "ab-2", name: "Sébastien Roy", initials: "SR", role: "Chef de projet",
    workflowType: "absence", workflowLabel: "Gestion des absences",
    mode: "full-auto", updatedAt: "Il y a 3h",
    steps: [
      { id: "s1", label: "Absence détectée (1 jour)", status: "ok", by: "kalia" },
      { id: "s2", label: "Qualification du cas", status: "ok", by: "kalia" },
      { id: "s3", label: "Demande de justificatif", status: "ok", by: "kalia" },
      { id: "s4", label: "Justificatif reçu", status: "ok", by: "kalia", detail: "RTT validé" },
      { id: "s5", label: "Intégration dans la paie", status: "ok", by: "kalia" },
    ],
  },
  {
    id: "ab-3", name: "Hélène Martin", initials: "HM", role: "Juriste",
    workflowType: "absence", workflowLabel: "Gestion des absences",
    mode: "auto-validation", updatedAt: "Il y a 5h",
    steps: [
      { id: "s1", label: "Absence détectée (5 jours)", status: "ok", by: "kalia" },
      { id: "s2", label: "Qualification du cas", status: "ok", by: "kalia" },
      { id: "s3", label: "Demande de justificatif", status: "ok", by: "kalia" },
      { id: "s4", label: "Justificatif reçu", status: "blocked", detail: "Document illisible — re-demande nécessaire" },
      { id: "s5", label: "Intégration dans la paie", status: "pending" },
    ],
  },
  // Documents
  {
    id: "doc-1", name: "Marc Dupont", initials: "MD", role: "Ingénieur",
    workflowType: "document", workflowLabel: "Documents RH",
    mode: "full-auto", updatedAt: "Il y a 45 min",
    steps: [
      { id: "s1", label: "Demande reçue", status: "ok", by: "kalia" },
      { id: "s2", label: "Contexte salarié chargé", status: "ok", by: "kalia" },
      { id: "s3", label: "Génération du document", status: "waiting", detail: "Attestation employeur en cours" },
      { id: "s4", label: "Envoi au salarié", status: "pending" },
    ],
  },
  {
    id: "doc-2", name: "Karim Benali", initials: "KB", role: "Responsable IT",
    workflowType: "document", workflowLabel: "Documents RH",
    mode: "full-auto", updatedAt: "Hier",
    steps: [
      { id: "s1", label: "Demande reçue", status: "ok", by: "kalia" },
      { id: "s2", label: "Contrôle IBAN", status: "ok", by: "kalia" },
      { id: "s3", label: "Mise à jour dans le SIRH", status: "ok", by: "kalia" },
      { id: "s4", label: "Confirmation envoyée", status: "ok", by: "kalia" },
    ],
  },
  {
    id: "doc-3", name: "Isabelle Morel", initials: "IM", role: "DRH Adjointe",
    workflowType: "document", workflowLabel: "Documents RH",
    mode: "auto-validation", updatedAt: "Il y a 2h",
    steps: [
      { id: "s1", label: "Demande reçue", status: "ok", by: "kalia" },
      { id: "s2", label: "Contexte salarié chargé", status: "ok", by: "kalia" },
      { id: "s3", label: "Génération du document", status: "ok", by: "kalia" },
      { id: "s4", label: "Envoi au salarié", status: "waiting", detail: "En attente de validation GP" },
    ],
  },
  {
    id: "doc-4", name: "Antoine Blanc", initials: "AB", role: "Technicien",
    workflowType: "document", workflowLabel: "Documents RH",
    mode: "full-auto", updatedAt: "Il y a 1h",
    steps: [
      { id: "s1", label: "Demande reçue", status: "ok", by: "kalia" },
      { id: "s2", label: "Contexte salarié chargé", status: "blocked", detail: "Salarié introuvable dans le SIRH" },
      { id: "s3", label: "Génération du document", status: "pending" },
      { id: "s4", label: "Envoi au salarié", status: "pending" },
    ],
  },
  // Complétude
  {
    id: "co-1", name: "Thomas Renard", initials: "TR", role: "Technicien terrain",
    workflowType: "completude", workflowLabel: "Complétude des dossiers",
    mode: "full-auto", updatedAt: "Il y a 1j",
    steps: [
      { id: "s1", label: "Contrôle de complétude", status: "ok", by: "kalia", detail: "3 anomalies détectées" },
      { id: "s2", label: "Relances envoyées", status: "ok", by: "kalia" },
      { id: "s3", label: "Champs reçus (2/3)", status: "ok", by: "kalia" },
      { id: "s4", label: "Résolution incohérence", status: "blocked", detail: "Date de naissance contradictoire — escalade GP" },
      { id: "s5", label: "Mise à jour SIRH", status: "pending" },
    ],
  },
  {
    id: "co-2", name: "Diane Chevalier", initials: "DC", role: "Assistante ADV",
    workflowType: "completude", workflowLabel: "Complétude des dossiers",
    mode: "full-auto", updatedAt: "Il y a 6h",
    steps: [
      { id: "s1", label: "Contrôle de complétude", status: "ok", by: "kalia" },
      { id: "s2", label: "Relances envoyées", status: "ok", by: "kalia" },
      { id: "s3", label: "Champs reçus (1/1)", status: "ok", by: "kalia" },
      { id: "s4", label: "Résolution incohérence", status: "skipped" },
      { id: "s5", label: "Mise à jour SIRH", status: "ok", by: "kalia" },
    ],
  },
];

// ─── Config ──────────────────────────────────────────────────────────────────────

const typeConfig: Record<WorkflowType, { icon: React.ElementType; color: string; dot: string }> = {
  onboarding:  { icon: UserPlus,    color: "text-blue-500",   dot: "bg-blue-500" },
  offboarding: { icon: UserMinus,   color: "text-orange-500", dot: "bg-orange-500" },
  document:    { icon: FileText,    color: "text-violet-500", dot: "bg-violet-500" },
  absence:     { icon: CalendarOff, color: "text-amber-500",  dot: "bg-amber-500" },
  completude:  { icon: FolderOpen,  color: "text-rose-500",   dot: "bg-rose-500" },
};

const modeConfig: Record<ExecutionMode, { icon: React.ElementType; label: string }> = {
  "full-auto":       { icon: Zap,         label: "Full auto" },
  "auto-validation": { icon: ShieldCheck, label: "Auto + validation" },
  "assisted":        { icon: Hand,        label: "Assisté" },
};

const workflowNavItems: { type: WorkflowType | "all"; label: string; icon: React.ElementType }[] = [
  { type: "all",        label: "Tous les workflows", icon: FolderOpen },
  { type: "onboarding", label: "Onboarding",          icon: UserPlus },
  { type: "offboarding",label: "Offboarding",          icon: UserMinus },
  { type: "absence",    label: "Absences",             icon: CalendarOff },
  { type: "document",   label: "Documents RH",         icon: FileText },
  { type: "completude", label: "Complétude",           icon: FolderOpen },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function getCaseHealth(c: EmployeeCase): "ok" | "warning" | "blocked" | "done" {
  if (c.steps.every(s => s.status === "ok" || s.status === "skipped")) return "done";
  if (c.steps.some(s => s.status === "blocked")) return "blocked";
  if (c.steps.some(s => s.status === "waiting")) return "warning";
  return "ok";
}

function getBlockingStep(c: EmployeeCase): ProcessStep | undefined {
  return (
    c.steps.find(s => s.status === "blocked") ||
    c.steps.find(s => s.status === "waiting")
  );
}

function getActiveStep(c: EmployeeCase): ProcessStep | undefined {
  return c.steps.find(s => s.status !== "ok" && s.status !== "skipped");
}

// ─── Sub-components ───────────────────────────────────────────────────────────────

function InitialsAvatar({ initials, health, size = "md" }: { initials: string; health: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-[11px]";
  const ringColor: Record<string, string> = {
    blocked: "ring-red-500/40",
    warning: "ring-amber-400/40",
    done: "ring-emerald-500/40",
    ok: "ring-blue-400/30",
  };
  return (
    <div className={cn(
      "flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 bg-muted text-muted-foreground",
      sz,
      ringColor[health] ?? "ring-border",
    )}>
      {initials}
    </div>
  );
}

function StatusDot({ health }: { health: string }) {
  const color: Record<string, string> = {
    blocked: "bg-red-500",
    warning: "bg-amber-400",
    done: "bg-emerald-500",
    ok: "bg-blue-400",
  };
  return <span className={cn("inline-block h-2 w-2 rounded-full shrink-0", color[health] ?? "bg-muted")} />;
}

function StepPill({ step }: { step: ProcessStep }) {
  if (step.status === "blocked") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
        <XCircle size={10} />
        {step.label}
        {step.detail && <span className="font-normal opacity-75">— {step.detail}</span>}
      </span>
    );
  }
  if (step.status === "waiting") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
        <Clock size={10} />
        {step.label}
        {step.detail && <span className="font-normal opacity-75">— {step.detail}</span>}
      </span>
    );
  }
  return null;
}

function ProgressDots({ steps }: { steps: ProcessStep[] }) {
  const colors: Record<StepStatus, string> = {
    ok:      "bg-emerald-500",
    blocked: "bg-red-500",
    waiting: "bg-amber-400",
    pending: "bg-muted-foreground/20",
    skipped: "bg-muted-foreground/15",
  };
  return (
    <div className="flex items-center gap-0.5">
      {steps.map(s => (
        <span key={s.id} className={cn("h-1.5 w-1.5 rounded-full", colors[s.status])} />
      ))}
    </div>
  );
}

function ExpandedSteps({ steps }: { steps: ProcessStep[] }) {
  return (
    <div className="mt-3 space-y-1 border-t border-border pt-3">
      {steps.map((step) => {
        const colors: Record<StepStatus, { icon: React.ElementType; text: string }> = {
          ok:      { icon: CheckCircle2, text: "text-emerald-500" },
          blocked: { icon: XCircle,      text: "text-red-500" },
          waiting: { icon: Clock,        text: "text-amber-500" },
          pending: { icon: Clock,        text: "text-muted-foreground/30" },
          skipped: { icon: CheckCircle2, text: "text-muted-foreground/20" },
        };
        const { icon: Icon, text } = colors[step.status];
        return (
          <div key={step.id} className="flex items-start gap-2 text-[12px]">
            <Icon size={13} className={cn("mt-0.5 shrink-0", text)} />
            <span className={cn(
              step.status === "pending" || step.status === "skipped"
                ? "text-muted-foreground/50"
                : "text-foreground"
            )}>
              {step.label}
              {step.detail && (
                <span className="ml-1 text-muted-foreground">— {step.detail}</span>
              )}
            </span>
            {step.time && (
              <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{step.time}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────────

export default function ADPPage() {
  const [activeFilter, setActiveFilter] = useState<WorkflowType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "blocked" | "warning" | "done">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return allCases.filter(c => {
      const matchType = activeFilter === "all" || c.workflowType === activeFilter;
      const health = getCaseHealth(c);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "blocked" && health === "blocked") ||
        (statusFilter === "warning" && health === "warning") ||
        (statusFilter === "done" && health === "done");
      return matchType && matchStatus;
    });
  }, [activeFilter, statusFilter]);

  const counts = useMemo(() => {
    const byType = (type: WorkflowType | "all") =>
      type === "all" ? allCases.length : allCases.filter(c => c.workflowType === type).length;
    const blocked = allCases.filter(c => getCaseHealth(c) === "blocked").length;
    const warning = allCases.filter(c => getCaseHealth(c) === "warning").length;
    const done    = allCases.filter(c => getCaseHealth(c) === "done").length;
    return { byType, blocked, warning, done };
  }, []);

  const allSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id));
  const someSelected = filtered.some(c => selected.has(c.id));
  const selectedCount = filtered.filter(c => selected.has(c.id)).length;

  function toggleAll() {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(c => next.delete(c.id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(c => next.add(c.id));
        return next;
      });
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  return (
    <div className="flex h-full min-h-screen bg-background">

      {/* ── Left nav ─────────────────────────────────────────────────────── */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card py-6 lg:flex">
        <div className="px-4 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Workflows</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-2">
          {workflowNavItems.map(({ type, label, icon: Icon }) => {
            const isActive = activeFilter === type;
            const count = counts.byType(type === "all" ? "all" : type as WorkflowType);
            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveFilter(type as WorkflowType | "all")}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors",
                  isActive
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon size={14} className="shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                <span className={cn(
                  "ml-auto rounded-full px-1.5 py-0 text-[10px] font-semibold",
                  isActive ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Blocker summary */}
        <div className="mx-2 mt-6 rounded-lg border border-border bg-background p-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Alertes</p>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "blocked" ? "all" : "blocked")}
            className={cn(
              "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] transition-colors",
              statusFilter === "blocked" ? "bg-red-500/10" : "hover:bg-accent/50"
            )}
          >
            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
            <span className="text-foreground">{counts.blocked} bloqué{counts.blocked > 1 ? "s" : ""}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "warning" ? "all" : "warning")}
            className={cn(
              "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] transition-colors",
              statusFilter === "warning" ? "bg-amber-500/10" : "hover:bg-accent/50"
            )}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
            <span className="text-foreground">{counts.warning} en attente</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "done" ? "all" : "done")}
            className={cn(
              "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] transition-colors",
              statusFilter === "done" ? "bg-emerald-500/10" : "hover:bg-accent/50"
            )}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-foreground">{counts.done} terminé{counts.done > 1 ? "s" : ""}</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-base font-semibold text-foreground">Workflows administratifs</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {filtered.length} salarié{filtered.length > 1 ? "s" : ""} en cours de traitement
          </p>
        </div>

        {/* Bulk action toolbar */}
        {someSelected && (
          <div className="flex items-center gap-2 border-b border-border bg-accent/50 px-6 py-2.5 text-[13px]">
            <span className="font-medium text-foreground">{selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}</span>
            <div className="ml-4 flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[12px]">
                <RotateCcw size={12} />
                Relancer
              </Button>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[12px]">
                <Send size={12} />
                Notifier
              </Button>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[12px]">
                <Play size={12} />
                Débloquer
              </Button>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[12px]">
                <Pencil size={12} />
                Corriger
              </Button>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="ml-auto rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Table header */}
        <div className="flex items-center gap-4 border-b border-border bg-card/50 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="flex w-4 shrink-0 items-center">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              aria-label="Tout sélectionner"
              className="h-3.5 w-3.5"
            />
          </div>
          <div className="w-5 shrink-0" />
          <div className="w-44 shrink-0">Salarié</div>
          <div className="w-40 shrink-0 hidden sm:block">Workflow</div>
          <div className="flex-1">Etape bloquante</div>
          <div className="w-28 shrink-0 hidden md:block">Progression</div>
          <div className="w-24 shrink-0 hidden lg:block">Mode</div>
          <div className="w-24 shrink-0 hidden lg:block text-right">Modifié</div>
          <div className="w-5 shrink-0" />
        </div>

        {/* Rows */}
        <div className="flex-1 divide-y divide-border overflow-auto">
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              Aucun résultat pour ce filtre.
            </div>
          )}
          {filtered.map((c) => {
            const health = getCaseHealth(c);
            const blocker = getBlockingStep(c);
            const activeStep = getActiveStep(c);
            const isExpanded = expanded.has(c.id);
            const isSelected = selected.has(c.id);
            const ModeIcon = modeConfig[c.mode].icon;
            const TypeIcon = typeConfig[c.workflowType].icon;

            return (
              <div
                key={c.id}
                className={cn(
                  "transition-colors",
                  isSelected ? "bg-accent/40" : "hover:bg-accent/20",
                )}
              >
                {/* Main row */}
                <div className="flex items-center gap-4 px-6 py-3">
                  {/* Checkbox */}
                  <div className="flex w-4 shrink-0 items-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleOne(c.id)}
                      aria-label={`Sélectionner ${c.name}`}
                      className="h-3.5 w-3.5"
                    />
                  </div>

                  {/* Status dot */}
                  <StatusDot health={health} />

                  {/* Employee */}
                  <div className="flex w-44 shrink-0 items-center gap-2.5 min-w-0">
                    <InitialsAvatar initials={c.initials} health={health} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-foreground">{c.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{c.role}</p>
                    </div>
                  </div>

                  {/* Workflow type */}
                  <div className="hidden w-40 shrink-0 items-center gap-1.5 sm:flex">
                    <TypeIcon size={12} className={typeConfig[c.workflowType].color} />
                    <span className="truncate text-[12px] text-muted-foreground">{c.workflowLabel}</span>
                  </div>

                  {/* Blocking step */}
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    {blocker ? (
                      <StepPill step={blocker} />
                    ) : health === "done" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={11} />
                        Terminé
                      </span>
                    ) : activeStep ? (
                      <span className="text-[12px] text-muted-foreground truncate">{activeStep.label}</span>
                    ) : null}
                  </div>

                  {/* Progress dots */}
                  <div className="hidden w-28 shrink-0 md:block">
                    <ProgressDots steps={c.steps} />
                  </div>

                  {/* Mode */}
                  <div className="hidden w-24 shrink-0 items-center gap-1 lg:flex">
                    <ModeIcon size={11} className="text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">{modeConfig[c.mode].label}</span>
                  </div>

                  {/* Updated */}
                  <div className="hidden w-24 shrink-0 text-right lg:block">
                    <span className="text-[11px] text-muted-foreground">{c.updatedAt}</span>
                  </div>

                  {/* Expand toggle */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(c.id)}
                    className="flex w-5 shrink-0 items-center justify-center rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Voir les étapes"
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mx-6 mb-4 rounded-lg border border-border bg-card/60 px-4 py-3">
                    <ExpandedSteps steps={c.steps} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
