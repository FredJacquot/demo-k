"use client";

import { useState } from "react";
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
  ArrowLeft,
  Bot,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  steps: ProcessStep[];
  mode: ExecutionMode;
  updatedAt: string;
};

type WorkflowGroup = {
  type: WorkflowType;
  label: string;
  description: string;
  cases: EmployeeCase[];
};

// ─── Mock data ───────────────────────────────────────────────────────────────────

const workflowGroups: WorkflowGroup[] = [
  {
    type: "onboarding",
    label: "Onboarding administratif",
    description: "Création des dossiers et intégration dans le SIRH",
    cases: [
      {
        id: "ob-1", name: "Sophie Marchand", initials: "SM", role: "Chargée de projet", mode: "auto-validation", updatedAt: "Il y a 2h",
        steps: [
          { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia", time: "09:14" },
          { id: "s2", label: "Données Core HR récupérées", status: "ok", by: "kalia", time: "09:15", detail: "6/8 champs remplis" },
          { id: "s3", label: "Pièces d'identité reçues", status: "blocked", by: "kalia", detail: "Relance envoyée x2 — sans réponse" },
          { id: "s4", label: "Création dans le SIRH", status: "pending" },
          { id: "s5", label: "Envoi des accès et contrat", status: "pending" },
        ],
      },
      {
        id: "ob-2", name: "Nathan Leroy", initials: "NL", role: "Développeur", mode: "full-auto", updatedAt: "Il y a 1h",
        steps: [
          { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia", time: "10:00" },
          { id: "s2", label: "Données Core HR récupérées", status: "ok", by: "kalia", time: "10:01" },
          { id: "s3", label: "Pièces d'identité reçues", status: "ok", by: "kalia", time: "10:45" },
          { id: "s4", label: "Création dans le SIRH", status: "ok", by: "kalia", time: "10:46" },
          { id: "s5", label: "Envoi des accès et contrat", status: "waiting", detail: "En attente signature électronique" },
        ],
      },
      {
        id: "ob-3", name: "Camille Dubois", initials: "CD", role: "Designer UX", mode: "auto-validation", updatedAt: "Hier",
        steps: [
          { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia" },
          { id: "s2", label: "Données Core HR récupérées", status: "ok", by: "kalia" },
          { id: "s3", label: "Pièces d'identité reçues", status: "ok", by: "kalia" },
          { id: "s4", label: "Création dans le SIRH", status: "waiting", detail: "En attente de validation GP" },
          { id: "s5", label: "Envoi des accès et contrat", status: "pending" },
        ],
      },
      {
        id: "ob-4", name: "Pauline Girard", initials: "PG", role: "Responsable marketing", mode: "full-auto", updatedAt: "Il y a 30 min",
        steps: [
          { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia" },
          { id: "s2", label: "Données Core HR récupérées", status: "blocked", detail: "Date de naissance incohérente entre 2 sources" },
          { id: "s3", label: "Pièces d'identité reçues", status: "pending" },
          { id: "s4", label: "Création dans le SIRH", status: "pending" },
          { id: "s5", label: "Envoi des accès et contrat", status: "pending" },
        ],
      },
      {
        id: "ob-5", name: "Romain Bernard", initials: "RB", role: "Ingénieur DevOps", mode: "assisted", updatedAt: "Il y a 3h",
        steps: [
          { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia" },
          { id: "s2", label: "Données Core HR récupérées", status: "ok", by: "kalia" },
          { id: "s3", label: "Pièces d'identité reçues", status: "ok", by: "kalia" },
          { id: "s4", label: "Création dans le SIRH", status: "ok", by: "human" },
          { id: "s5", label: "Envoi des accès et contrat", status: "ok", by: "kalia" },
        ],
      },
    ],
  },
  {
    type: "offboarding",
    label: "Offboarding administratif",
    description: "Clôture des dossiers et gestion des sorties",
    cases: [
      {
        id: "of-1", name: "Julie Moreau", initials: "JM", role: "Assistante RH", mode: "auto-validation", updatedAt: "Il y a 4h",
        steps: [
          { id: "s1", label: "Départ confirmé dans le SIRH", status: "ok", by: "kalia" },
          { id: "s2", label: "Checklist de sortie générée", status: "ok", by: "kalia", detail: "8 actions identifiées" },
          { id: "s3", label: "Désactivation des accès", status: "ok", by: "kalia" },
          { id: "s4", label: "Solde de tout compte préparé", status: "waiting", detail: "En attente de validation GP" },
          { id: "s5", label: "Attestation employeur générée", status: "pending" },
          { id: "s6", label: "Archivage du dossier", status: "pending" },
        ],
      },
      {
        id: "of-2", name: "Pierre Faure", initials: "PF", role: "Commercial", mode: "full-auto", updatedAt: "Il y a 1j",
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
        id: "of-3", name: "Amandine Petit", initials: "AP", role: "Comptable", mode: "auto-validation", updatedAt: "Il y a 2j",
        steps: [
          { id: "s1", label: "Départ confirmé dans le SIRH", status: "ok", by: "kalia" },
          { id: "s2", label: "Checklist de sortie générée", status: "ok", by: "kalia" },
          { id: "s3", label: "Désactivation des accès", status: "ok", by: "kalia" },
          { id: "s4", label: "Solde de tout compte préparé", status: "ok", by: "human" },
          { id: "s5", label: "Attestation employeur générée", status: "ok", by: "kalia" },
          { id: "s6", label: "Archivage du dossier", status: "ok", by: "kalia" },
        ],
      },
    ],
  },
  {
    type: "absence",
    label: "Gestion des absences",
    description: "Qualification et suivi des absences non justifiées",
    cases: [
      {
        id: "ab-1", name: "Léa Fontaine", initials: "LF", role: "Analyste data", mode: "full-auto", updatedAt: "Hier",
        steps: [
          { id: "s1", label: "Absence détectée (3 jours)", status: "ok", by: "kalia" },
          { id: "s2", label: "Qualification du cas", status: "ok", by: "kalia", detail: "Maladie probable" },
          { id: "s3", label: "Demande de justificatif", status: "ok", by: "kalia" },
          { id: "s4", label: "Justificatif reçu", status: "waiting", detail: "2e relance envoyée — J+1" },
          { id: "s5", label: "Intégration dans la paie", status: "pending" },
        ],
      },
      {
        id: "ab-2", name: "Sébastien Roy", initials: "SR", role: "Chef de projet", mode: "full-auto", updatedAt: "Il y a 3h",
        steps: [
          { id: "s1", label: "Absence détectée (1 jour)", status: "ok", by: "kalia" },
          { id: "s2", label: "Qualification du cas", status: "ok", by: "kalia", detail: "Congé non saisi probable" },
          { id: "s3", label: "Demande de justificatif", status: "ok", by: "kalia" },
          { id: "s4", label: "Justificatif reçu", status: "ok", by: "kalia", detail: "RTT validé" },
          { id: "s5", label: "Intégration dans la paie", status: "ok", by: "kalia" },
        ],
      },
      {
        id: "ab-3", name: "Hélène Martin", initials: "HM", role: "Juriste", mode: "auto-validation", updatedAt: "Il y a 5h",
        steps: [
          { id: "s1", label: "Absence détectée (5 jours)", status: "ok", by: "kalia" },
          { id: "s2", label: "Qualification du cas", status: "ok", by: "kalia", detail: "Longue maladie" },
          { id: "s3", label: "Demande de justificatif", status: "ok", by: "kalia" },
          { id: "s4", label: "Justificatif reçu", status: "blocked", detail: "Document illisible — re-demande nécessaire" },
          { id: "s5", label: "Intégration dans la paie", status: "pending" },
        ],
      },
    ],
  },
  {
    type: "document",
    label: "Documents RH",
    description: "Génération et envoi de documents administratifs",
    cases: [
      {
        id: "doc-1", name: "Marc Dupont", initials: "MD", role: "Ingénieur", mode: "full-auto", updatedAt: "Il y a 45 min",
        steps: [
          { id: "s1", label: "Demande reçue", status: "ok", by: "kalia" },
          { id: "s2", label: "Contexte salarié chargé", status: "ok", by: "kalia" },
          { id: "s3", label: "Génération du document", status: "waiting", detail: "Attestation employeur en cours" },
          { id: "s4", label: "Envoi au salarié", status: "pending" },
        ],
      },
      {
        id: "doc-2", name: "Karim Benali", initials: "KB", role: "Responsable IT", mode: "full-auto", updatedAt: "Hier",
        steps: [
          { id: "s1", label: "Demande reçue", status: "ok", by: "kalia" },
          { id: "s2", label: "Contrôle IBAN", status: "ok", by: "kalia" },
          { id: "s3", label: "Mise à jour dans le SIRH", status: "ok", by: "kalia" },
          { id: "s4", label: "Confirmation envoyée", status: "ok", by: "kalia" },
        ],
      },
      {
        id: "doc-3", name: "Isabelle Morel", initials: "IM", role: "DRH Adjointe", mode: "auto-validation", updatedAt: "Il y a 2h",
        steps: [
          { id: "s1", label: "Demande reçue", status: "ok", by: "kalia" },
          { id: "s2", label: "Contexte salarié chargé", status: "ok", by: "kalia" },
          { id: "s3", label: "Génération du document", status: "ok", by: "kalia" },
          { id: "s4", label: "Envoi au salarié", status: "waiting", detail: "En attente de validation GP" },
        ],
      },
      {
        id: "doc-4", name: "Antoine Blanc", initials: "AB", role: "Technicien", mode: "full-auto", updatedAt: "Il y a 1h",
        steps: [
          { id: "s1", label: "Demande reçue", status: "ok", by: "kalia" },
          { id: "s2", label: "Contexte salarié chargé", status: "blocked", detail: "Salarié introuvable dans le SIRH" },
          { id: "s3", label: "Génération du document", status: "pending" },
          { id: "s4", label: "Envoi au salarié", status: "pending" },
        ],
      },
    ],
  },
  {
    type: "completude",
    label: "Complétude des dossiers",
    description: "Contrôle et correction des données manquantes",
    cases: [
      {
        id: "co-1", name: "Thomas Renard", initials: "TR", role: "Technicien terrain", mode: "full-auto", updatedAt: "Il y a 1j",
        steps: [
          { id: "s1", label: "Contrôle de complétude", status: "ok", by: "kalia", detail: "3 anomalies détectées" },
          { id: "s2", label: "Relances envoyées", status: "ok", by: "kalia" },
          { id: "s3", label: "Champs reçus (2/3)", status: "ok", by: "kalia" },
          { id: "s4", label: "Résolution incohérence", status: "blocked", detail: "Date de naissance contradictoire — escalade GP" },
          { id: "s5", label: "Mise à jour SIRH", status: "pending" },
        ],
      },
      {
        id: "co-2", name: "Diane Chevalier", initials: "DC", role: "Assistante ADV", mode: "full-auto", updatedAt: "Il y a 6h",
        steps: [
          { id: "s1", label: "Contrôle de complétude", status: "ok", by: "kalia", detail: "1 anomalie détectée" },
          { id: "s2", label: "Relances envoyées", status: "ok", by: "kalia" },
          { id: "s3", label: "Champs reçus (1/1)", status: "ok", by: "kalia" },
          { id: "s4", label: "Résolution incohérence", status: "skipped" },
          { id: "s5", label: "Mise à jour SIRH", status: "ok", by: "kalia" },
        ],
      },
    ],
  },
];

// ─── Config ──────────────────────────────────────────────────────────────────────

const typeConfig: Record<WorkflowType, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  onboarding:  { icon: UserPlus,    color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-500/10",   border: "border-blue-200 dark:border-blue-500/20" },
  offboarding: { icon: UserMinus,   color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-500/20" },
  document:    { icon: FileText,    color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/20" },
  absence:     { icon: CalendarOff, color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-500/10",  border: "border-amber-200 dark:border-amber-500/20" },
  completude:  { icon: FolderOpen,  color: "text-rose-600 dark:text-rose-400",   bg: "bg-rose-50 dark:bg-rose-500/10",   border: "border-rose-200 dark:border-rose-500/20" },
};

const stepConfig: Record<StepStatus, { icon: React.ElementType; color: string; dot: string; label: string }> = {
  ok:      { icon: CheckCircle2,  color: "text-emerald-500",                            dot: "bg-emerald-500", label: "Validé" },
  pending: { icon: Clock,         color: "text-muted-foreground/40",                    dot: "bg-muted-foreground/30", label: "En attente" },
  blocked: { icon: XCircle,       color: "text-red-500",                                dot: "bg-red-500", label: "Bloqué" },
  waiting: { icon: Clock,         color: "text-amber-500",                              dot: "bg-amber-500", label: "En cours" },
  skipped: { icon: CheckCircle2,  color: "text-muted-foreground/30",                    dot: "bg-muted-foreground/20", label: "Non applicable" },
};

const modeConfig: Record<ExecutionMode, { icon: React.ElementType; label: string; classes: string }> = {
  "full-auto":       { icon: Zap,         label: "Full auto",        classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
  "auto-validation": { icon: ShieldCheck, label: "Auto + validation", classes: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300" },
  "assisted":        { icon: Hand,        label: "Assisté",           classes: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function getCaseHealth(c: EmployeeCase): "ok" | "warning" | "blocked" | "done" {
  if (c.steps.every(s => s.status === "ok" || s.status === "skipped")) return "done";
  if (c.steps.some(s => s.status === "blocked")) return "blocked";
  if (c.steps.some(s => s.status === "waiting")) return "warning";
  return "ok";
}

const healthDot: Record<string, string> = {
  ok:      "bg-blue-400",
  warning: "bg-amber-400",
  blocked: "bg-red-500",
  done:    "bg-emerald-500",
};

const healthRing: Record<string, string> = {
  ok:      "ring-blue-400/30",
  warning: "ring-amber-400/30",
  blocked: "ring-red-500/30",
  done:    "ring-emerald-500/30",
};

// ─── Avatar ───────────────────────────────────────────────────────────────────────

function Avatar({ initials, health, size = "md" }: { initials: string; health: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  return (
    <div className={cn("relative shrink-0", sz)}>
      <div className={cn(
        "flex h-full w-full items-center justify-center rounded-full font-semibold ring-2",
        "bg-muted text-muted-foreground",
        healthRing[health],
      )}>
        {initials}
      </div>
      <span className={cn(
        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background",
        healthDot[health],
      )} />
    </div>
  );
}

// ─── Progress bar for a case ─────────────────────────────────────────────────────

function CaseProgress({ steps }: { steps: ProcessStep[] }) {
  return (
    <div className="flex items-center gap-0.5">
      {steps.map((s) => (
        <div
          key={s.id}
          className={cn("h-1 flex-1 rounded-full", stepConfig[s.status].dot)}
        />
      ))}
    </div>
  );
}

// ─── Workflow card (overview grid) ────────────────────────────────────────────────

function WorkflowCard({ group, onClick }: { group: WorkflowGroup; onClick: () => void }) {
  const { icon: Icon, color, bg, border } = typeConfig[group.type];
  const blocked  = group.cases.filter(c => getCaseHealth(c) === "blocked").length;
  const warning  = group.cases.filter(c => getCaseHealth(c) === "warning").length;
  const done     = group.cases.filter(c => getCaseHealth(c) === "done").length;
  const total    = group.cases.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl border border-border bg-card p-5 text-left transition-all duration-150 hover:border-border hover:shadow-sm hover:shadow-black/5 active:scale-[0.99]"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", bg, border, color)}>
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{group.description}</p>
        </div>
      </div>

      {/* Status chips */}
      <div className="mt-4 flex items-center gap-1.5">
        <span className="text-xs font-semibold text-foreground">{total}</span>
        <span className="text-xs text-muted-foreground">en cours</span>
        <span className="ml-auto flex items-center gap-1.5">
          {blocked > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <AlertTriangle size={9} />
              {blocked} bloqué{blocked > 1 ? "s" : ""}
            </span>
          )}
          {warning > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Clock size={9} />
              {warning}
            </span>
          )}
          {done > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 size={9} />
              {done}
            </span>
          )}
        </span>
      </div>

      {/* Avatars strip */}
      <div className="mt-4 flex items-center gap-1.5">
        <div className="flex -space-x-1.5">
          {group.cases.slice(0, 6).map((c) => (
            <Avatar key={c.id} initials={c.initials} health={getCaseHealth(c)} size="sm" />
          ))}
          {group.cases.length > 6 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted ring-2 ring-background text-[10px] font-medium text-muted-foreground">
              +{group.cases.length - 6}
            </div>
          )}
        </div>
        <span className="ml-2 text-[11px] text-muted-foreground">
          {group.cases.map(c => c.name.split(" ")[0]).slice(0, 3).join(", ")}
          {group.cases.length > 3 && ` +${group.cases.length - 3}`}
        </span>
      </div>
    </button>
  );
}

// ─── Employee row in detail view ─────────────────────────────────────────────────

function EmployeeRow({ ec, isExpanded, onToggle }: { ec: EmployeeCase; isExpanded: boolean; onToggle: () => void }) {
  const health = getCaseHealth(ec);
  const mode = modeConfig[ec.mode];
  const ModeIcon = mode.icon;
  const blockedSteps = ec.steps.filter(s => s.status === "blocked");
  const waitingSteps = ec.steps.filter(s => s.status === "waiting");

  return (
    <div className={cn(
      "rounded-lg border transition-all duration-150",
      isExpanded ? "border-border bg-muted/30" : "border-border bg-card hover:bg-muted/20",
    )}>
      {/* Row header */}
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left">
        <Avatar initials={ec.initials} health={health} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">{ec.name}</span>
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", mode.classes)}>
              <ModeIcon size={9} />
              {mode.label}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{ec.role}</p>
        </div>

        {/* Blocker / warning summary */}
        <div className="flex shrink-0 items-center gap-2">
          {blockedSteps.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <XCircle size={9} />
              {blockedSteps.length} blocage{blockedSteps.length > 1 ? "s" : ""}
            </span>
          )}
          {waitingSteps.length > 0 && blockedSteps.length === 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Clock size={9} />
              En cours
            </span>
          )}
          {health === "done" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 size={9} />
              Terminé
            </span>
          )}
          {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>

      {/* Progress bar (always visible) */}
      <div className="px-4 pb-3">
        <CaseProgress steps={ec.steps} />
      </div>

      {/* Expanded steps */}
      {isExpanded && (
        <div className="border-t border-border px-4 pb-4 pt-4">
          <ol className="space-y-2.5">
            {ec.steps.map((step, i) => {
              const { icon: StepIcon, color: stepColor } = stepConfig[step.status];
              return (
                <li key={step.id} className="flex items-start gap-3">
                  {/* Connector */}
                  <div className="flex flex-col items-center gap-0.5">
                    <StepIcon size={15} className={stepColor} />
                    {i < ec.steps.length - 1 && (
                      <div className="h-full w-px bg-border" style={{ minHeight: "12px" }} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs font-medium",
                        step.status === "pending" || step.status === "skipped"
                          ? "text-muted-foreground"
                          : "text-foreground",
                      )}>
                        {step.label}
                      </span>
                      {step.time && (
                        <span className="text-[10px] text-muted-foreground/60">{step.time}</span>
                      )}
                      {step.by && (
                        <span className={cn(
                          "text-[10px]",
                          step.by === "kalia" ? "text-primary/70" : "text-emerald-600 dark:text-emerald-400",
                        )}>
                          · {step.by === "kalia" ? "Kalia" : "Gestionnaire"}
                        </span>
                      )}
                    </div>
                    {step.detail && (
                      <p className={cn(
                        "mt-0.5 text-[11px]",
                        step.status === "blocked" ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
                      )}>
                        {step.detail}
                      </p>
                    )}
                  </div>

                  {/* Quick action on blocked */}
                  {step.status === "blocked" && (
                    <Button size="sm" variant="outline" className="h-6 shrink-0 gap-1 px-2 text-[10px]">
                      <Play size={9} />
                      Corriger
                    </Button>
                  )}
                  {step.status === "waiting" && ec.mode === "auto-validation" && (
                    <Button size="sm" className="h-6 shrink-0 gap-1 px-2 text-[10px]">
                      <CheckCircle2 size={9} />
                      Valider
                    </Button>
                  )}
                </li>
              );
            })}
          </ol>

          {/* Footer actions */}
          <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
            <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
              <RotateCcw size={11} />
              Relancer
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
              <Bot size={11} />
              Voir le journal
            </Button>
            <span className="ml-auto text-[10px] text-muted-foreground">Mis à jour {ec.updatedAt}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Detail view ─────────────────────────────────────────────────────────────────

function WorkflowDetail({ group, onBack }: { group: WorkflowGroup; onBack: () => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(
    group.cases.find(c => getCaseHealth(c) === "blocked")?.id ?? group.cases[0]?.id ?? null,
  );
  const [filter, setFilter] = useState<"all" | "blocked" | "warning" | "done">("all");
  const { icon: Icon, color, bg, border } = typeConfig[group.type];

  const blocked = group.cases.filter(c => getCaseHealth(c) === "blocked").length;
  const warning = group.cases.filter(c => getCaseHealth(c) === "warning").length;
  const done    = group.cases.filter(c => getCaseHealth(c) === "done").length;

  const filtered = group.cases.filter(c => {
    if (filter === "all") return true;
    return getCaseHealth(c) === filter;
  });

  const FILTER_TABS: { key: typeof filter; label: string; count: number }[] = [
    { key: "all",     label: "Tous",      count: group.cases.length },
    { key: "blocked", label: "Bloqués",   count: blocked },
    { key: "warning", label: "En cours",  count: warning },
    { key: "done",    label: "Terminés",  count: done },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-background px-6 py-5">
        <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={13} />
          Tous les workflows
        </button>

        <div className="flex items-center gap-4">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", bg, border, color)}>
            <Icon size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{group.label}</h2>
            <p className="text-xs text-muted-foreground">{group.description}</p>
          </div>
        </div>

        {/* Summary chips */}
        <div className="mt-4 flex items-center gap-2">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
                filter === tab.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                filter === tab.key ? "bg-background/20 text-background" : "bg-background text-foreground",
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Cases list */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">Aucun dossier dans cette catégorie.</div>
          )}
          {filtered.map(ec => (
            <EmployeeRow
              key={ec.id}
              ec={ec}
              isExpanded={expandedId === ec.id}
              onToggle={() => setExpandedId(expandedId === ec.id ? null : ec.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────────

export default function AdpPage() {
  const [selectedGroup, setSelectedGroup] = useState<WorkflowGroup | null>(null);

  const totalBlocked = workflowGroups.flatMap(g => g.cases).filter(c => getCaseHealth(c) === "blocked").length;
  const totalActive  = workflowGroups.flatMap(g => g.cases).filter(c => getCaseHealth(c) !== "done").length;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">

      {/* Page header */}
      <header className="shrink-0 border-b border-border bg-background px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Workflows administratifs</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {totalActive} dossiers actifs · {totalBlocked > 0 ? `${totalBlocked} blocage${totalBlocked > 1 ? "s" : ""} en attente` : "Aucun blocage"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {totalBlocked > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 dark:bg-red-500/10">
                <AlertTriangle size={13} className="text-red-500" />
                <span className="text-xs font-semibold text-red-700 dark:text-red-300">{totalBlocked} blocage{totalBlocked > 1 ? "s" : ""}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
              <Bot size={13} className="text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Kalia actif</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedGroup ? (
          <WorkflowDetail group={selectedGroup} onBack={() => setSelectedGroup(null)} />
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workflowGroups.map(group => (
                <WorkflowCard key={group.type} group={group} onClick={() => setSelectedGroup(group)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
