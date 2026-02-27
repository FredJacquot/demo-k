"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Clock, Circle, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

type MilestoneStatus = "Validé" | "Sous vigilance" | "En cours" | "En attente" | "À venir";
type StepStatus = "Validé" | "En cours" | "Erreur" | "En attente";

type Step = {
  label: string;
  status: StepStatus;
};

type Milestone = {
  name: string;
  status: MilestoneStatus;
  compactSummary: string;
  targetDate?: string;
  summary?: {
    items: number;
    validated: number;
    inProgress: number;
    errors: number;
    waiting: number;
  };
  steps?: Step[];
};

const milestones: Milestone[] = [
  {
    name: "Ouverture du cycle",
    status: "Validé",
    compactSummary: "3/3 validés",
    targetDate: "01/03/2026",
    summary: { items: 3, validated: 3, inProgress: 0, errors: 0, waiting: 0 },
    steps: [
      { label: "Initialisation du cycle", status: "Validé" },
      { label: "Paramétrage des règles paie", status: "Validé" },
      { label: "Ouverture des accès GP", status: "Validé" },
    ],
  },
  {
    name: "Consolidation des données d'entrée",
    status: "Validé",
    compactSummary: "6/6 validés",
    targetDate: "05/03/2026",
    summary: { items: 6, validated: 6, inProgress: 0, errors: 0, waiting: 0 },
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
    name: "Qualification des écarts",
    status: "Sous vigilance",
    compactSummary: "2 erreurs",
    targetDate: "10/03/2026",
    summary: { items: 7, validated: 3, inProgress: 2, errors: 2, waiting: 0 },
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
    name: "Sécurisation des éléments de paie",
    status: "Sous vigilance",
    compactSummary: "1 erreur",
    targetDate: "13/03/2026",
    summary: { items: 4, validated: 2, inProgress: 1, errors: 1, waiting: 0 },
    steps: [
      { label: "Contrôle des entrées/sorties", status: "Validé" },
      { label: "Vérification des avenants", status: "Erreur" },
      { label: "Contrôle des absences longue durée", status: "En cours" },
      { label: "Validation des taux horaires", status: "Validé" },
    ],
  },
  {
    name: "Préparation de la production",
    status: "En cours",
    compactSummary: "2 en cours",
    targetDate: "17/03/2026",
    summary: { items: 4, validated: 1, inProgress: 2, errors: 0, waiting: 1 },
    steps: [
      { label: "Gel des données d'entrée", status: "Validé" },
      { label: "Lancement calcul brut", status: "En cours" },
      { label: "Génération des bulletins test", status: "En cours" },
      { label: "Validation responsable paie", status: "En attente" },
    ],
  },
  {
    name: "Contrôle automatisé Kalia",
    status: "En cours",
    compactSummary: "3/4 contrôles lancés",
    targetDate: "19/03/2026",
    summary: { items: 4, validated: 0, inProgress: 3, errors: 0, waiting: 1 },
    steps: [
      { label: "Contrôle cohérence masse salariale", status: "En cours" },
      { label: "Détection anomalies cotisations", status: "En cours" },
      { label: "Vérification des seuils légaux", status: "En cours" },
      { label: "Rapport de contrôle final", status: "En attente" },
    ],
  },
  {
    name: "Contrôle expert GP",
    status: "En attente",
    compactSummary: "1 en attente",
    targetDate: "21/03/2026",
    summary: { items: 3, validated: 0, inProgress: 0, errors: 0, waiting: 3 },
    steps: [
      { label: "Revue GP sur cas complexes", status: "En attente" },
      { label: "Validation DRH", status: "En attente" },
      { label: "Signature bon à payer", status: "En attente" },
    ],
  },
  {
    name: "Post-paie",
    status: "À venir",
    compactSummary: "3 tâches prévues",
    targetDate: "28/03/2026",
    summary: { items: 3, validated: 0, inProgress: 0, errors: 0, waiting: 0 },
    steps: [
      { label: "Envoi DSN mensuelle", status: "En attente" },
      { label: "Virements salariaux", status: "En attente" },
      { label: "Distribution bulletins dématérialisés", status: "En attente" },
    ],
  },
  {
    name: "Clôture du cycle",
    status: "À venir",
    compactSummary: "2 étapes finales",
    targetDate: "31/03/2026",
    summary: { items: 2, validated: 0, inProgress: 0, errors: 0, waiting: 0 },
    steps: [
      { label: "Archivage du cycle", status: "En attente" },
      { label: "Bilan & reporting DRH", status: "En attente" },
    ],
  },
];

// ─── Status helpers ────────────────────────────────────────────────────────────

const statusDot: Record<MilestoneStatus, string> = {
  "Validé": "bg-emerald-500",
  "Sous vigilance": "bg-amber-500",
  "En cours": "bg-blue-500",
  "En attente": "bg-violet-500",
  "À venir": "bg-muted-foreground/40",
};

const statusIcon = (status: MilestoneStatus, size = 14) => {
  if (status === "Validé")       return <CheckCircle2 size={size} className="shrink-0 text-emerald-500" />;
  if (status === "Sous vigilance") return <AlertTriangle size={size} className="shrink-0 text-amber-500" />;
  if (status === "En cours")     return <Clock size={size} className="shrink-0 text-blue-500" />;
  if (status === "En attente")   return <Circle size={size} className="shrink-0 text-violet-500" />;
  return <Circle size={size} className="shrink-0 text-muted-foreground/40" />;
};

// Node ring colour per status
const nodeRing: Record<MilestoneStatus, string> = {
  "Validé":          "ring-emerald-500/40",
  "Sous vigilance":  "ring-amber-500/40",
  "En cours":        "ring-blue-500/40",
  "En attente":      "ring-violet-500/30",
  "À venir":         "ring-border",
};

// Active card glow per status (light subtle / dark pronounced)
const activeGlow: Record<MilestoneStatus, string> = {
  "Validé":          "shadow-[0_0_40px_-8px_rgba(16,185,129,0.15)] dark:shadow-[0_0_40px_-8px_rgba(52,211,153,0.25)]",
  "Sous vigilance":  "shadow-[0_0_40px_-8px_rgba(245,158,11,0.15)] dark:shadow-[0_0_40px_-8px_rgba(251,191,36,0.25)]",
  "En cours":        "shadow-[0_0_40px_-8px_rgba(59,130,246,0.15)] dark:shadow-[0_0_40px_-8px_rgba(96,165,250,0.25)]",
  "En attente":      "shadow-[0_0_40px_-8px_rgba(139,92,246,0.12)] dark:shadow-[0_0_40px_-8px_rgba(167,139,250,0.20)]",
  "À venir":         "shadow-none",
};

// Step row badge
const stepBadge: Record<StepStatus, string> = {
  "Validé":    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
  "En cours":  "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/25",
  "Erreur":    "bg-red-50 text-red-700 ring-1 ring-red-200 font-semibold dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/30",
  "En attente":"bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20",
};

const stepDot: Record<StepStatus, string> = {
  "Validé":    "bg-emerald-500",
  "En cours":  "bg-blue-500 animate-pulse",
  "Erreur":    "bg-red-500",
  "En attente":"bg-violet-400/50",
};

// Collapsed status pill
const collapsedPill: Record<MilestoneStatus, string> = {
  "Validé":          "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  "Sous vigilance":  "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  "En cours":        "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300",
  "En attente":      "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
  "À venir":         "bg-muted text-muted-foreground",
};

// ─── Progress bar ──────────────────────────────────────────────────────────────

function CycleProgressBar({ total, activeIndex }: { total: number; activeIndex: number }) {
  const pct = (activeIndex / (total - 1)) * 100;
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Summary chips ─────────────────────────────────────────────────────────────

function SummaryChips({ summary }: { summary: NonNullable<Milestone["summary"]> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {summary.validated > 0 && (
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">
          {summary.validated} validé{summary.validated > 1 ? "s" : ""}
        </span>
      )}
      {summary.inProgress > 0 && (
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700 ring-1 ring-blue-200 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20">
          {summary.inProgress} en cours
        </span>
      )}
      {summary.errors > 0 && (
        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-red-200 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/25">
          {summary.errors} erreur{summary.errors > 1 ? "s" : ""}
        </span>
      )}
      {summary.waiting > 0 && (
        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] text-violet-700 ring-1 ring-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20">
          {summary.waiting} en attente
        </span>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function PayrollPipelineMensuelV7Page() {
  const [activeIndex, setActiveIndex] = useState(2);
  const active = useMemo(() => milestones[activeIndex], [activeIndex]);

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      {/* Page header */}
      <div className="border-b border-border px-8 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Gestion de la paie
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Cycle de paie — Mars 2026
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pilotage opérationnel du cycle piloté par Kalia
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-500/25 dark:bg-amber-500/10">
            <AlertTriangle size={14} className="text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Sous vigilance — 3 jalons nécessitent attention
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="uppercase tracking-[0.15em]">Début du cycle</span>
            <span className="font-medium text-foreground">
              Étape {activeIndex + 1} / {milestones.length} — {active.name}
            </span>
            <span className="uppercase tracking-[0.15em]">Fin du cycle</span>
          </div>
          <CycleProgressBar total={milestones.length} activeIndex={activeIndex} />
        </div>
      </div>

      {/* Horizontal accordion */}
      <div className="flex-1 overflow-x-auto px-8 py-8">
        <div className="relative flex min-w-[1100px] items-stretch gap-0" style={{ minHeight: 480 }}>

          {/* Timeline connector line */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-[52px] h-px bg-border"
            aria-hidden
          />

          {milestones.map((milestone, index) => {
            const isActive = index === activeIndex;
            const isCompleted = milestone.status === "Validé";
            const isPast = index < activeIndex;

            return (
              <div
                key={milestone.name}
                className={cn(
                  "relative flex flex-col transition-all duration-300 ease-out",
                  isActive ? "flex-[5]" : "w-[88px] shrink-0",
                )}
              >
                {/* Timeline node */}
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="group relative z-10 flex flex-col items-center focus-visible:outline-none"
                  aria-pressed={isActive}
                >
                  <div
                    className={cn(
                      "flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 bg-background transition-all duration-200",
                      isActive
                        ? cn("scale-110 ring-4 ring-offset-2 ring-offset-background border-transparent", nodeRing[milestone.status])
                        : "border-border group-hover:border-muted-foreground",
                      isCompleted && !isActive && "border-emerald-300 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-500/10",
                      isPast && !isCompleted && "border-border/60",
                    )}
                  >
                    <span className={cn("h-2.5 w-2.5 rounded-full", statusDot[milestone.status])} />
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-[10px] font-medium uppercase tracking-widest transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground/50 group-hover:text-muted-foreground",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </button>

                {/* Card panel */}
                <div
                  className={cn(
                    "mt-3 flex flex-1 cursor-pointer flex-col overflow-hidden rounded-xl border transition-all duration-300 ease-out",
                    isActive
                      ? cn("border-border bg-card p-5", activeGlow[milestone.status])
                      : "border-border bg-card/40 hover:border-border hover:bg-card/70",
                  )}
                  onClick={() => setActiveIndex(index)}
                  role="button"
                  tabIndex={-1}
                  aria-label={`Ouvrir le jalon ${milestone.name}`}
                >
                  {isActive ? (
                    /* ── Expanded panel ── */
                    <div className="flex h-full flex-col gap-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {statusIcon(milestone.status, 15)}
                            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                              Jalon actif
                            </span>
                          </div>
                          <h2 className="mt-1.5 text-lg font-semibold leading-tight text-card-foreground">
                            {milestone.name}
                          </h2>
                          {milestone.targetDate && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CalendarDays size={12} />
                              <span>Date cible : {milestone.targetDate}</span>
                            </div>
                          )}
                        </div>
                        {milestone.summary && <SummaryChips summary={milestone.summary} />}
                      </div>

                      {/* Steps grid */}
                      {milestone.steps && (
                        <ul className="grid flex-1 auto-rows-min gap-2 sm:grid-cols-2">
                          {milestone.steps.map((step) => (
                            <li
                              key={step.label}
                              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 dark:bg-muted/20"
                            >
                              <div className="flex min-w-0 items-center gap-2.5">
                                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", stepDot[step.status])} />
                                <span className="truncate text-sm text-foreground">{step.label}</span>
                              </div>
                              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", stepBadge[step.status])}>
                                {step.status}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    /* ── Collapsed panel ── */
                    <div className="flex h-full flex-col justify-between gap-3 p-3">
                      <p className="line-clamp-3 text-[11px] font-semibold leading-snug text-muted-foreground">
                        {milestone.name}
                      </p>
                      <div className="space-y-1">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                            collapsedPill[milestone.status],
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", statusDot[milestone.status])} />
                          {milestone.status}
                        </span>
                        <p className="text-[10px] text-muted-foreground/60">{milestone.compactSummary}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-muted-foreground/50">
          Cliquez sur un jalon pour afficher le détail des étapes.
        </p>
      </div>
    </div>
  );
}
