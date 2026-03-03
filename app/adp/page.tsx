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
  Circle,
  Zap,
  ShieldCheck,
  Hand,
  ChevronRight,
  RotateCcw,
  Play,
  Eye,
  ArrowRight,
  Bot,
  Paperclip,
  RefreshCw,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ExecutionMode = "full-auto" | "auto-validation" | "assisted";
type WorkflowStatus = "todo" | "waiting" | "blocked" | "done" | "in-progress";
type CaseType = "onboarding" | "offboarding" | "document" | "absence" | "completude";

type ActionLog = {
  time: string;
  label: string;
  by: "kalia" | "human";
};

type MissingItem = {
  label: string;
  from: string;
};

type Workflow = {
  id: string;
  type: CaseType;
  subject: string;
  employee: string;
  status: WorkflowStatus;
  mode: ExecutionMode;
  priority: "high" | "medium" | "low";
  nextAction: string;
  blocker?: string;
  missing?: MissingItem[];
  logs: ActionLog[];
  updatedAt: string;
};

// ─── Mock data ─────────────────────────────────────────────────────────────────

const workflows: Workflow[] = [
  {
    id: "wf-001",
    type: "onboarding",
    subject: "Onboarding administratif",
    employee: "Sophie Marchand",
    status: "blocked",
    mode: "auto-validation",
    priority: "high",
    nextAction: "Valider la création dans le SIRH",
    blocker: "Justificatif d'identité manquant",
    missing: [
      { label: "Pièce d'identité", from: "Salarié" },
      { label: "RIB", from: "Salarié" },
    ],
    logs: [
      { time: "Aujourd'hui 09:14", label: "Dossier initialisé depuis l'embauche confirmée", by: "kalia" },
      { time: "Aujourd'hui 09:15", label: "Données Core HR récupérées (6/8 champs remplis)", by: "kalia" },
      { time: "Aujourd'hui 09:16", label: "Relance envoyée à Sophie Marchand pour les pièces manquantes", by: "kalia" },
      { time: "Aujourd'hui 10:32", label: "Aucune réponse — 2e relance programmée à 14h00", by: "kalia" },
    ],
    updatedAt: "Il y a 2h",
  },
  {
    id: "wf-002",
    type: "document",
    subject: "Attestation employeur",
    employee: "Marc Dupont",
    status: "in-progress",
    mode: "full-auto",
    priority: "low",
    nextAction: "Génération du document en cours",
    logs: [
      { time: "Aujourd'hui 11:00", label: "Demande reçue via Kalia Base", by: "kalia" },
      { time: "Aujourd'hui 11:01", label: "Contexte salarié chargé depuis le SIRH", by: "kalia" },
      { time: "Aujourd'hui 11:02", label: "Génération de l'attestation en cours", by: "kalia" },
    ],
    updatedAt: "Il y a 45 min",
  },
  {
    id: "wf-003",
    type: "absence",
    subject: "Justificatif d'absence",
    employee: "Léa Fontaine",
    status: "waiting",
    mode: "full-auto",
    priority: "medium",
    nextAction: "En attente du justificatif médical",
    missing: [{ label: "Arrêt de travail signé", from: "Salarié" }],
    logs: [
      { time: "Hier 16:22", label: "Absence détectée dans la GTA (3 jours non justifiés)", by: "kalia" },
      { time: "Hier 16:23", label: "Qualification du cas : maladie probable", by: "kalia" },
      { time: "Hier 16:24", label: "Demande de justificatif envoyée à Léa Fontaine", by: "kalia" },
      { time: "Aujourd'hui 08:00", label: "Relance automatique J+1 envoyée", by: "kalia" },
    ],
    updatedAt: "Hier",
  },
  {
    id: "wf-004",
    type: "completude",
    subject: "Complétude du dossier",
    employee: "Thomas Renard",
    status: "blocked",
    mode: "full-auto",
    priority: "high",
    nextAction: "Corriger l'incohérence de date avant relance",
    blocker: "Date de naissance incohérente entre 2 sources",
    logs: [
      { time: "Il y a 3j", label: "Contrôle de complétude déclenché automatiquement", by: "kalia" },
      { time: "Il y a 3j", label: "3 champs manquants détectés — relances envoyées", by: "kalia" },
      { time: "Il y a 2j", label: "2 champs reçus et mis à jour dans le SIRH", by: "kalia" },
      { time: "Il y a 1j", label: "Incohérence détectée : date de naissance contradictoire", by: "kalia" },
      { time: "Il y a 1j", label: "Traitement suspendu — escalade vers gestionnaire ADP", by: "kalia" },
    ],
    updatedAt: "Il y a 1j",
  },
  {
    id: "wf-005",
    type: "offboarding",
    subject: "Offboarding administratif",
    employee: "Julie Moreau",
    status: "in-progress",
    mode: "auto-validation",
    priority: "high",
    nextAction: "Valider la mise à jour dans le SIRH",
    logs: [
      { time: "Il y a 2j", label: "Départ confirmé pour le 31/03/2026", by: "kalia" },
      { time: "Il y a 2j", label: "Checklist de sortie générée (8 actions)", by: "kalia" },
      { time: "Il y a 1j", label: "Accès RH et Badge désactivés via Kalia Connect", by: "kalia" },
      { time: "Aujourd'hui 08:45", label: "Solde de tout compte préparé — en attente de validation GP", by: "kalia" },
    ],
    updatedAt: "Il y a 4h",
  },
  {
    id: "wf-006",
    type: "document",
    subject: "Changement de RIB",
    employee: "Karim Benali",
    status: "done",
    mode: "full-auto",
    priority: "low",
    nextAction: "Traitement terminé",
    logs: [
      { time: "Hier 14:10", label: "Nouveau RIB reçu via Kalia Base", by: "kalia" },
      { time: "Hier 14:11", label: "Contrôle de validité IBAN — OK", by: "kalia" },
      { time: "Hier 14:12", label: "RIB mis à jour dans le SIRH via Kalia Connect", by: "kalia" },
      { time: "Hier 14:12", label: "Confirmation envoyée à Karim Benali", by: "kalia" },
    ],
    updatedAt: "Hier",
  },
];

// ─── Config helpers ─────────────────────────────────────────────────────────────

const caseConfig: Record<CaseType, { icon: React.ElementType; label: string; color: string }> = {
  onboarding:  { icon: UserPlus,   label: "Onboarding",    color: "text-blue-500" },
  offboarding: { icon: UserMinus,  label: "Offboarding",   color: "text-orange-500" },
  document:    { icon: FileText,   label: "Document",      color: "text-violet-500" },
  absence:     { icon: CalendarOff,label: "Absence",       color: "text-amber-500" },
  completude:  { icon: FolderOpen, label: "Complétude",    color: "text-rose-500" },
};

const statusConfig: Record<WorkflowStatus, { icon: React.ElementType; label: string; classes: string }> = {
  todo:        { icon: Circle,        label: "À traiter",  classes: "bg-muted text-muted-foreground" },
  "in-progress":{ icon: Clock,        label: "En cours",   classes: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300" },
  waiting:     { icon: Clock,         label: "En attente", classes: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
  blocked:     { icon: AlertTriangle, label: "Bloqué",     classes: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300" },
  done:        { icon: CheckCircle2,  label: "Terminé",    classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
};

const modeConfig: Record<ExecutionMode, { icon: React.ElementType; label: string; classes: string }> = {
  "full-auto":       { icon: Zap,         label: "Full auto",       classes: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20" },
  "auto-validation": { icon: ShieldCheck, label: "Auto + validation",classes: "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20" },
  "assisted":        { icon: Hand,        label: "Assisté",          classes: "bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20" },
};

const priorityDot: Record<string, string> = {
  high:   "bg-red-500",
  medium: "bg-amber-500",
  low:    "bg-muted-foreground/30",
};

// ─── Stats bar ─────────────────────────────────────────────────────────────────

function StatsBar({ items }: { items: Workflow[] }) {
  const counts = {
    blocked:     items.filter(w => w.status === "blocked").length,
    inProgress:  items.filter(w => w.status === "in-progress").length,
    waiting:     items.filter(w => w.status === "waiting").length,
    done:        items.filter(w => w.status === "done").length,
  };
  return (
    <div className="flex flex-wrap gap-3">
      {counts.blocked > 0 && (
        <div className="flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1.5 dark:bg-red-500/10">
          <AlertTriangle size={12} className="text-red-500" />
          <span className="text-xs font-medium text-red-700 dark:text-red-300">{counts.blocked} bloqué{counts.blocked > 1 ? "s" : ""}</span>
        </div>
      )}
      {counts.inProgress > 0 && (
        <div className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1.5 dark:bg-blue-500/10">
          <Clock size={12} className="text-blue-500" />
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{counts.inProgress} en cours</span>
        </div>
      )}
      {counts.waiting > 0 && (
        <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 dark:bg-amber-500/10">
          <Clock size={12} className="text-amber-500" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">{counts.waiting} en attente</span>
        </div>
      )}
      {counts.done > 0 && (
        <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 dark:bg-emerald-500/10">
          <CheckCircle2 size={12} className="text-emerald-500" />
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{counts.done} terminé{counts.done > 1 ? "s" : ""}</span>
        </div>
      )}
    </div>
  );
}

// ─── Workflow row (list item) ───────────────────────────────────────────────────

function WorkflowRow({
  workflow,
  isSelected,
  onClick,
}: {
  workflow: Workflow;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { icon: CaseIcon, color } = caseConfig[workflow.type];
  const status = statusConfig[workflow.status];
  const StatusIcon = status.icon;
  const mode = modeConfig[workflow.mode];
  const ModeIcon = mode.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-lg border p-3.5 text-left transition-all duration-150",
        isSelected
          ? "border-primary/30 bg-primary/5 dark:border-primary/20 dark:bg-primary/10"
          : "border-border bg-card hover:border-border hover:bg-muted/40",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Priority dot + icon */}
        <div className="relative mt-0.5 shrink-0">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-muted", color)}>
            <CaseIcon size={15} />
          </div>
          <span className={cn("absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-background", priorityDot[workflow.priority])} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-medium text-foreground">{workflow.subject}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{workflow.employee}</p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", status.classes)}>
              <StatusIcon size={10} />
              {status.label}
            </span>
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", mode.classes)}>
              <ModeIcon size={10} />
              {mode.label}
            </span>
          </div>
        </div>

        <ChevronRight
          size={14}
          className={cn(
            "mt-1 shrink-0 text-muted-foreground/40 transition-all",
            isSelected ? "text-primary" : "group-hover:text-muted-foreground",
          )}
        />
      </div>

      {/* Next action */}
      <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1.5">
        <ArrowRight size={11} className="shrink-0 text-muted-foreground" />
        <span className="truncate text-[11px] text-muted-foreground">{workflow.nextAction}</span>
      </div>
    </button>
  );
}

// ─── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ workflow }: { workflow: Workflow }) {
  const { icon: CaseIcon, label: caseLabel, color } = caseConfig[workflow.type];
  const status = statusConfig[workflow.status];
  const StatusIcon = status.icon;
  const mode = modeConfig[workflow.mode];
  const ModeIcon = mode.icon;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-start gap-4">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted", color)}>
            <CaseIcon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">{workflow.subject}</h2>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", status.classes)}>
                <StatusIcon size={10} />
                {status.label}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{workflow.employee}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", mode.classes)}>
                <ModeIcon size={10} />
                {mode.label}
              </span>
              <span className="text-[11px] text-muted-foreground/60">Mis à jour {workflow.updatedAt}</span>
            </div>
          </div>
        </div>

        {/* Blocker banner */}
        {workflow.blocker && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="text-xs font-semibold text-red-700 dark:text-red-300">Blocage</p>
              <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{workflow.blocker}</p>
            </div>
          </div>
        )}

        {/* Next action */}
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2.5">
          <ArrowRight size={13} className="shrink-0 text-primary" />
          <span className="text-xs font-medium text-foreground">{workflow.nextAction}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Missing items */}
        {workflow.missing && workflow.missing.length > 0 && (
          <section>
            <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Paperclip size={11} />
              Pièces manquantes
            </h3>
            <ul className="space-y-2">
              {workflow.missing.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">Attendu de : {item.from}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Action log */}
        <section>
          <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Bot size={11} />
            Historique des actions
          </h3>
          <ol className="relative space-y-0 border-l border-border pl-4">
            {workflow.logs.map((log, i) => (
              <li key={i} className="relative pb-4 last:pb-0">
                <span className="absolute -left-[17px] top-1 flex h-3 w-3 items-center justify-center">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    log.by === "kalia" ? "bg-primary/60" : "bg-emerald-500"
                  )} />
                </span>
                <p className="text-xs text-foreground">{log.label}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground/60">
                  <span>{log.time}</span>
                  <span>·</span>
                  <span className={log.by === "kalia" ? "text-primary/70" : "text-emerald-600 dark:text-emerald-400"}>
                    {log.by === "kalia" ? "Kalia" : "Gestionnaire"}
                  </span>
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Actions footer */}
      <div className="border-t border-border p-4">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Actions rapides
        </p>
        <div className="flex flex-wrap gap-2">
          {workflow.status === "blocked" && (
            <Button size="sm" className="h-8 gap-1.5 text-xs">
              <Play size={12} />
              Corriger et relancer
            </Button>
          )}
          {(workflow.status === "in-progress" || workflow.status === "waiting") && workflow.mode === "auto-validation" && (
            <Button size="sm" className="h-8 gap-1.5 text-xs">
              <CheckCircle2 size={12} />
              Valider
            </Button>
          )}
          {workflow.status !== "done" && (
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
              <RotateCcw size={12} />
              Relancer
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
            <Eye size={12} />
            Voir le dossier
          </Button>
          {workflow.status !== "done" && (
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-muted-foreground">
              <Hand size={12} />
              Passer en manuel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Filter tabs ────────────────────────────────────────────────────────────────

const FILTER_TABS: { key: WorkflowStatus | "all"; label: string }[] = [
  { key: "all",         label: "Tous" },
  { key: "blocked",     label: "Bloqués" },
  { key: "in-progress", label: "En cours" },
  { key: "waiting",     label: "En attente" },
  { key: "done",        label: "Terminés" },
];

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function AdpPage() {
  const [selectedId, setSelectedId] = useState<string>(workflows[0].id);
  const [filter, setFilter] = useState<WorkflowStatus | "all">("all");

  const filtered = filter === "all" ? workflows : workflows.filter(w => w.status === filter);
  const selected = workflows.find(w => w.id === selectedId) ?? workflows[0];

  return (
    <div className="flex h-screen flex-col bg-background font-sans text-foreground overflow-hidden">

      {/* Page header */}
      <header className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Kalia ADP
            </p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">
              Workflows administratifs
            </h1>
          </div>
          <StatsBar items={workflows} />
        </div>

        {/* Filter tabs */}
        <div className="mt-4 flex items-center gap-1">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.key === "all"
                ? workflows.length
                : workflows.filter(w => w.status === tab.key).length;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === tab.key
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0 text-[10px] tabular-nums",
                    filter === tab.key
                      ? "bg-background/20 text-background"
                      : "bg-muted text-muted-foreground",
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
              <RefreshCw size={11} />
              Actualiser
            </Button>
          </div>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="flex min-h-0 flex-1">

        {/* List panel */}
        <aside className="w-[340px] shrink-0 overflow-y-auto border-r border-border p-3 space-y-1.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Ban size={24} className="text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Aucun traitement dans cette catégorie</p>
            </div>
          ) : (
            filtered.map((wf) => (
              <WorkflowRow
                key={wf.id}
                workflow={wf}
                isSelected={selectedId === wf.id}
                onClick={() => setSelectedId(wf.id)}
              />
            ))
          )}
        </aside>

        {/* Detail panel */}
        <main className="min-w-0 flex-1 overflow-hidden">
          <DetailPanel workflow={selected} />
        </main>
      </div>
    </div>
  );
}
