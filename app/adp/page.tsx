"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  UserPlus, UserMinus, FileText, CalendarOff, FolderOpen,
  CheckCircle2, Clock, XCircle, Zap, ShieldCheck, Hand,
  Send, RotateCcw, Bell, Pencil, Sparkles, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExecutionMode = "full-auto" | "auto-validation" | "assisted";
type StepStatus = "ok" | "pending" | "blocked" | "waiting" | "skipped";
type WorkflowType = "onboarding" | "offboarding" | "document" | "absence" | "completude";
type MessageType = "kalia" | "user" | "action-feedback";

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

type ChatMessage = {
  id: string;
  type: MessageType;
  text: string;
  card?: "blockers" | "summary" | "done";
  timestamp: string;
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

const typeConfig: Record<WorkflowType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  onboarding:  { icon: UserPlus,    color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-100 dark:bg-blue-500/15",   label: "Onboarding" },
  offboarding: { icon: UserMinus,   color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/15", label: "Offboarding" },
  document:    { icon: FileText,    color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-500/15", label: "Documents RH" },
  absence:     { icon: CalendarOff, color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-100 dark:bg-amber-500/15",  label: "Absences" },
  completude:  { icon: FolderOpen,  color: "text-rose-600 dark:text-rose-400",   bg: "bg-rose-100 dark:bg-rose-500/15",   label: "Complétude" },
};

const modeIcon: Record<ExecutionMode, React.ElementType> = {
  "full-auto": Zap,
  "auto-validation": ShieldCheck,
  "assisted": Hand,
};

const QUICK_REPLIES = [
  { label: "Relancer tout", icon: RotateCcw },
  { label: "Voir les bloquants", icon: XCircle },
  { label: "Tout valider", icon: CheckCircle2 },
  { label: "Notifier les managers", icon: Bell },
];

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

function now(): string {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ initials, health, size = "md" }: { initials: string; health: string; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "h-6 w-6 text-[9px]", md: "h-8 w-8 text-[11px]", lg: "h-9 w-9 text-xs" }[size];
  const ring = { blocked: "ring-red-400/50", warning: "ring-amber-400/50", done: "ring-emerald-400/50", ok: "ring-blue-400/30" }[health] ?? "ring-border";
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 bg-muted text-muted-foreground select-none", sz, ring)}>
      {initials}
    </div>
  );
}

function HealthBadge({ health }: { health: string }) {
  const config = {
    blocked: { label: "Bloqué",    cls: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" },
    warning: { label: "En attente", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
    done:    { label: "Terminé",   cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
    ok:      { label: "En cours",  cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
  }[health] ?? { label: health, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", config.cls)}>
      {config.label}
    </span>
  );
}

function ProgressDots({ steps }: { steps: ProcessStep[] }) {
  const dot: Record<StepStatus, string> = {
    ok:      "bg-emerald-500",
    blocked: "bg-red-500 animate-pulse",
    waiting: "bg-amber-400",
    pending: "bg-muted-foreground/20",
    skipped: "bg-muted-foreground/15",
  };
  return (
    <div className="flex items-center gap-0.5">
      {steps.map(s => <span key={s.id} className={cn("h-1.5 w-1.5 rounded-full", dot[s.status])} />)}
    </div>
  );
}

function StepList({ steps }: { steps: ProcessStep[] }) {
  const icon: Record<StepStatus, React.ElementType> = {
    ok: CheckCircle2, blocked: XCircle, waiting: Clock, pending: Clock, skipped: CheckCircle2,
  };
  const color: Record<StepStatus, string> = {
    ok: "text-emerald-500", blocked: "text-red-500", waiting: "text-amber-500",
    pending: "text-muted-foreground/25", skipped: "text-muted-foreground/20",
  };
  return (
    <div className="mt-2 space-y-1.5 border-t border-border/60 pt-2">
      {steps.map(s => {
        const Icon = icon[s.status];
        return (
          <div key={s.id} className="flex items-start gap-2 text-xs">
            <Icon size={12} className={cn("mt-0.5 shrink-0", color[s.status])} />
            <span className={cn(s.status === "pending" || s.status === "skipped" ? "text-muted-foreground/40" : "text-foreground/80")}>
              {s.label}
              {s.detail && <span className="ml-1 text-muted-foreground">— {s.detail}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Blocker Card (embedded in chat bubble) ───────────────────────────────────

function BlockerCard({
  cases,
  selected,
  onToggle,
  onToggleAll,
  onBulkAction,
  expandedId,
  onToggleExpand,
}: {
  cases: EmployeeCase[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onBulkAction: (action: string) => void;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
}) {
  const allSel = cases.length > 0 && cases.every(c => selected.has(c.id));
  const someSel = cases.some(c => selected.has(c.id));
  const selectedCases = cases.filter(c => selected.has(c.id));

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-background/60 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
        <Checkbox
          checked={allSel ? true : someSel ? "indeterminate" : false}
          onCheckedChange={onToggleAll}
          className="shrink-0"
        />
        <span className="text-xs font-medium text-muted-foreground">
          {cases.length} dossier{cases.length > 1 ? "s" : ""} nécessitant une action
        </span>
        {someSel && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{selectedCases.length} sélectionné{selectedCases.length > 1 ? "s" : ""}</span>
            <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px]" onClick={() => onBulkAction("relancer")}>
              <RotateCcw size={10} /> Relancer
            </Button>
            <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px]" onClick={() => onBulkAction("notifier")}>
              <Bell size={10} /> Notifier
            </Button>
            <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px]" onClick={() => onBulkAction("corriger")}>
              <Pencil size={10} /> Corriger
            </Button>
          </div>
        )}
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/50">
        {cases.map((c) => {
          const health = getHealth(c);
          const blocker = getBlockingStep(c);
          const TypeIcon = typeConfig[c.workflowType].icon;
          const ModeIcon = modeIcon[c.mode];
          const isExpanded = expandedId === c.id;

          return (
            <div
              key={c.id}
              className={cn(
                "transition-colors",
                selected.has(c.id) && "bg-muted/40",
              )}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <Checkbox
                  checked={selected.has(c.id)}
                  onCheckedChange={() => onToggle(c.id)}
                  className="shrink-0"
                />
                <Avatar initials={c.initials} health={health} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                    <span className={cn("flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium", typeConfig[c.workflowType].bg, typeConfig[c.workflowType].color)}>
                      <TypeIcon size={9} />
                      {typeConfig[c.workflowType].label}
                    </span>
                    <HealthBadge health={health} />
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <ProgressDots steps={c.steps} />
                    {blocker && (
                      <span className="truncate text-[11px] text-muted-foreground">
                        {blocker.label}
                        {blocker.detail && <span className="opacity-70"> — {blocker.detail}</span>}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <ModeIcon size={12} className="text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{c.updatedAt}</span>
                  <button
                    onClick={() => onToggleExpand(c.id)}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronDown size={14} className={cn("transition-transform", isExpanded && "rotate-180")} />
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="px-12 pb-3">
                  <StepList steps={c.steps} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ cases }: { cases: EmployeeCase[] }) {
  const blocked = cases.filter(c => getHealth(c) === "blocked").length;
  const warning = cases.filter(c => getHealth(c) === "warning").length;
  const done    = cases.filter(c => getHealth(c) === "done").length;
  const inprog  = cases.filter(c => getHealth(c) === "ok").length;

  const byType = Object.entries(
    cases.reduce<Record<WorkflowType, number>>((acc, c) => {
      acc[c.workflowType] = (acc[c.workflowType] || 0) + 1;
      return acc;
    }, {} as Record<WorkflowType, number>)
  );

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-background/60 backdrop-blur-sm">
      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
        {[
          { label: "Bloqués", count: blocked, cls: "text-red-500" },
          { label: "En attente", count: warning, cls: "text-amber-500" },
          { label: "En cours", count: inprog, cls: "text-blue-500" },
          { label: "Terminés", count: done, cls: "text-emerald-500" },
        ].map(({ label, count, cls }) => (
          <div key={label} className="px-4 py-3 text-center">
            <div className={cn("text-2xl font-bold tabular-nums", cls)}>{count}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 px-4 py-3">
        {byType.map(([type, count]) => {
          const cfg = typeConfig[type as WorkflowType];
          const Icon = cfg.icon;
          return (
            <span key={type} className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", cfg.bg, cfg.color)}>
              <Icon size={11} />
              {cfg.label} <span className="font-bold">{count}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Kalia Avatar ─────────────────────────────────────────────────────────────

function KaliaAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background shadow-sm">
      <Sparkles size={14} />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const blockedCases = allCases.filter(c => getHealth(c) === "blocked");
const warnCases    = allCases.filter(c => getHealth(c) === "warning");
const actionCases  = [...blockedCases, ...warnCases];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m0",
    type: "kalia",
    text: `Bonjour ! Voici un résumé de l'activité ADP en cours sur ${allCases.length} dossiers actifs.`,
    card: "summary",
    timestamp: now(),
  },
  {
    id: "m1",
    type: "kalia",
    text: `J'ai identifié **${blockedCases.length} dossier${blockedCases.length > 1 ? "s bloqués" : " bloqué"}** et **${warnCases.length} en attente de validation**. Voici ce qui nécessite votre attention :`,
    card: "blockers",
    timestamp: now(),
  },
];

export default function ADPPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = useCallback((msg: Omit<ChatMessage, "id" | "timestamp">) => {
    setMessages(prev => [...prev, { ...msg, id: `m${Date.now()}`, timestamp: now() }]);
  }, []);

  const handleToggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelected(prev => {
      const allSelected = actionCases.every(c => prev.has(c.id));
      return allSelected ? new Set() : new Set(actionCases.map(c => c.id));
    });
  }, []);

  const handleBulkAction = useCallback((action: string) => {
    const count = selected.size;
    const labels: Record<string, string> = {
      relancer: `J'ai relancé les ${count} salarié${count > 1 ? "s" : ""} sélectionné${count > 1 ? "s" : ""}. Une confirmation vous sera envoyée par email.`,
      notifier: `Les managers des ${count} dossier${count > 1 ? "s" : ""} sélectionné${count > 1 ? "s" : ""} ont été notifiés.`,
      corriger: `J'ai ouvert un ticket de correction pour ${count} dossier${count > 1 ? "s" : ""}. Un gestionnaire paie va prendre en charge.`,
    };
    addMessage({ type: "action-feedback", text: labels[action] ?? `Action "${action}" exécutée sur ${count} dossier(s).` });
    setSelected(new Set());
  }, [selected, addMessage]);

  const handleQuickReply = useCallback((label: string) => {
    addMessage({ type: "user", text: label });
    setTimeout(() => {
      const responses: Record<string, Omit<ChatMessage, "id" | "timestamp">> = {
        "Voir les bloquants": {
          type: "kalia",
          text: `Voici les ${blockedCases.length} dossiers actuellement bloqués. Vous pouvez les sélectionner pour agir en masse.`,
          card: "blockers",
        },
        "Relancer tout": {
          type: "action-feedback",
          text: `J'ai envoyé une relance automatique à tous les ${actionCases.length} dossiers en attente. Vous recevrez un récapitulatif dans 30 minutes.`,
        },
        "Tout valider": {
          type: "action-feedback",
          text: `J'ai validé les ${warnCases.length} dossiers en attente de validation. Les workflows reprennent automatiquement.`,
        },
        "Notifier les managers": {
          type: "action-feedback",
          text: `Les managers des ${actionCases.length} dossiers concernés ont été notifiés par email avec un résumé de l'état de chaque workflow.`,
        },
      };
      addMessage(responses[label] ?? { type: "kalia", text: "Je traite votre demande..." });
    }, 600);
  }, [addMessage]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    addMessage({ type: "user", text: input.trim() });
    setInput("");
    setTimeout(() => {
      addMessage({
        type: "kalia",
        text: "Bien reçu. Je traite votre demande et vous reviens avec un résumé des actions effectuées.",
      });
    }, 800);
  }, [input, addMessage]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  function renderText(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <KaliaAvatar />
        <div>
          <h1 className="text-sm font-semibold text-foreground">Kalia — Workflows ADP</h1>
          <p className="text-xs text-muted-foreground">Administration du personnel · {allCases.length} dossiers actifs</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            En ligne
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg) => {
          if (msg.type === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-sm">
                  <div className="rounded-2xl rounded-tr-sm bg-foreground px-4 py-2.5 text-sm text-background">
                    {msg.text}
                  </div>
                  <p className="mt-1 text-right text-[10px] text-muted-foreground">{msg.timestamp}</p>
                </div>
              </div>
            );
          }

          if (msg.type === "action-feedback") {
            return (
              <div key={msg.id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                  <CheckCircle2 size={14} />
                </div>
                <div className="flex-1">
                  <div className="rounded-2xl rounded-tl-sm border border-emerald-200/60 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/15 dark:bg-emerald-500/8 dark:text-emerald-300">
                    {msg.text}
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{msg.timestamp}</p>
                </div>
              </div>
            );
          }

          // kalia message
          return (
            <div key={msg.id} className="flex items-start gap-3">
              <KaliaAvatar />
              <div className="flex-1 min-w-0">
                <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">
                  <p className="leading-relaxed">{renderText(msg.text)}</p>
                  {msg.card === "summary" && <SummaryCard cases={allCases} />}
                  {msg.card === "blockers" && (
                    <BlockerCard
                      cases={actionCases}
                      selected={selected}
                      onToggle={handleToggle}
                      onToggleAll={handleToggleAll}
                      onBulkAction={handleBulkAction}
                      expandedId={expandedId}
                      onToggleExpand={(id) => setExpandedId(prev => prev === id ? null : id)}
                    />
                  )}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">{msg.timestamp}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="border-t border-border/50 px-6 pt-3 pb-2 flex flex-wrap gap-2">
        {QUICK_REPLIES.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => handleQuickReply(label)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted hover:border-foreground/20"
          >
            <Icon size={11} className="text-muted-foreground" />
            {label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-6 pb-5 pt-2">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm focus-within:border-foreground/30 transition-colors">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Demandez à Kalia quelque chose… ex: « Montre-moi les onboardings bloqués cette semaine »"
            className="min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-8 w-8 shrink-0 rounded-xl"
          >
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
