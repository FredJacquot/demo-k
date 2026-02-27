"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";

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
  },
  {
    name: "Consolidation des données d’entrée",
    status: "Validé",
    compactSummary: "6/6 validés",
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
      { label: "Analyse des variations d’effectifs", status: "Validé" },
    ],
  },
  {
    name: "Sécurisation des éléments de paie",
    status: "Sous vigilance",
    compactSummary: "1 erreur",
  },
  {
    name: "Préparation de la production",
    status: "En cours",
    compactSummary: "2 en cours",
  },
  {
    name: "Contrôle automatisé Kalia",
    status: "En cours",
    compactSummary: "3/4 contrôles lancés",
  },
  {
    name: "Contrôle expert GP",
    status: "En attente",
    compactSummary: "1 en attente",
  },
  {
    name: "Post-paie",
    status: "À venir",
    compactSummary: "3 tâches prévues",
  },
  {
    name: "Clôture du cycle",
    status: "À venir",
    compactSummary: "2 étapes finales",
  },
];

const milestoneStatusClass: Record<MilestoneStatus, string> = {
  Validé: "border-emerald-300 bg-emerald-50 text-emerald-800",
  "Sous vigilance": "border-amber-300 bg-amber-50 text-amber-900",
  "En cours": "border-blue-300 bg-blue-50 text-blue-800",
  "En attente": "border-violet-300 bg-violet-50 text-violet-900",
  "À venir": "border-slate-300 bg-slate-100 text-slate-700",
};

const milestoneCompactPillClass: Record<MilestoneStatus, string> = {
  Validé: "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/30",
  "Sous vigilance": "bg-amber-300/20 text-amber-100 ring-1 ring-amber-200/30",
  "En cours": "bg-blue-300/20 text-blue-100 ring-1 ring-blue-200/30",
  "En attente": "bg-violet-300/20 text-violet-100 ring-1 ring-violet-200/30",
  "À venir": "bg-slate-300/20 text-slate-100 ring-1 ring-slate-200/30",
};

const stepStatusClass: Record<StepStatus, string> = {
  Validé: "border-emerald-300 bg-emerald-50 text-emerald-800",
  "En cours": "border-blue-300 bg-blue-50 text-blue-800",
  Erreur: "border-red-400 bg-red-50 text-red-900",
  "En attente": "border-violet-300 bg-violet-50 text-violet-900",
};

export default function PayrollPipelineMensuelV6Page() {
  const [activeIndex, setActiveIndex] = useState(2);
  const activeMilestone = useMemo(() => milestones[activeIndex], [activeIndex]);

  return (
    <div className="w-full px-8 py-8">
      <div className="flex w-full flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Cycle de paie — Mars 2026</h1>
          <p className="text-sm text-muted-foreground">
            Pilotage opérationnel du cycle de paie piloté par Kalia
          </p>
          <p className="text-sm font-medium text-amber-700">
            Sous vigilance — 3 jalons nécessitent une attention avant clôture
          </p>
        </header>

        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span>Début du cycle</span>
            <span>Fin du cycle</span>
          </div>

          <div className="relative overflow-x-auto rounded-[28px] border border-slate-800 bg-slate-950 p-4 shadow-[0_28px_70px_-28px_rgba(15,23,42,0.75)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(59,130,246,0.22),transparent_42%),radial-gradient(circle_at_78%_78%,rgba(16,185,129,0.18),transparent_36%)]" />

            <div className="relative mb-3 flex items-center justify-between px-1 text-[10px] uppercase tracking-[0.24em] text-slate-400">
              <span>Progression du cycle</span>
              <span>{activeMilestone.name}</span>
            </div>

            <div className="relative flex min-h-[500px] min-w-[1500px] items-stretch gap-3">
              {milestones.map((milestone, index) => {
                const isActive = index === activeIndex;
                const hasDetail = Boolean(milestone.steps && milestone.summary && milestone.targetDate);

                return (
                  <button
                    key={milestone.name}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                      isActive
                        ? "z-20 flex-[6.2] bg-white p-5 text-slate-900 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.6)]"
                        : "z-10 w-[118px] shrink-0 border-white/15 bg-white/10 px-2.5 py-3 text-white/95 backdrop-blur-sm hover:bg-white/15"
                    }`}
                    aria-pressed={isActive}
                  >
                    {isActive && hasDetail ? (
                      <div className="flex h-full flex-col gap-4 text-left">
                        <div className="grid gap-3 border-b border-slate-200 pb-3 md:grid-cols-[2fr_auto_auto_2fr] md:items-start">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Jalon actif</p>
                            <h2 className="text-[22px] font-semibold leading-tight text-slate-900">{milestone.name}</h2>
                            <p className="mt-1 text-xs text-slate-500">Date cible : {milestone.targetDate}</p>
                          </div>

                          <Badge variant="outline" className={milestoneStatusClass[milestone.status]}>
                            {milestone.status}
                          </Badge>

                          <p className="text-sm font-medium text-slate-700">{milestone.summary!.items} items</p>

                          <div className="flex flex-wrap gap-1.5 text-[11px]">
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 ring-1 ring-emerald-100">
                              {milestone.summary!.validated} validés
                            </span>
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 ring-1 ring-blue-100">
                              {milestone.summary!.inProgress} en cours
                            </span>
                            <span className="rounded-full bg-red-50 px-2 py-1 font-semibold text-red-700 ring-1 ring-red-100">
                              {milestone.summary!.errors} erreurs
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700 ring-1 ring-slate-200">
                              {milestone.summary!.waiting} en attente
                            </span>
                          </div>
                        </div>

                        <ul className="grid gap-2 lg:grid-cols-2">
                          {milestone.steps!.map((step) => (
                            <li
                              key={step.label}
                              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                            >
                              <span className="pr-3 text-sm text-slate-800">{step.label}</span>
                              <Badge variant="outline" className={stepStatusClass[step.status]}>
                                {step.status}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : isActive ? (
                      <div className="flex h-full flex-col justify-between text-left">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Jalon actif</p>
                          <h2 className="mt-2 text-xl font-semibold text-slate-900">{milestone.name}</h2>
                        </div>

                        <div className="space-y-2">
                          <Badge variant="outline" className={milestoneStatusClass[milestone.status]}>
                            {milestone.status}
                          </Badge>
                          <p className="text-sm text-slate-600">{milestone.compactSummary}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full min-h-[220px] flex-col justify-between text-left">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/65">Étape {index + 1}</p>
                          <p className="mt-2 text-xs font-semibold leading-tight text-white">{milestone.name}</p>
                        </div>

                        <div className="space-y-1.5">
                          <span
                            className={`inline-flex w-fit rounded-full px-2 py-1 text-[10px] font-medium ${milestoneCompactPillClass[milestone.status]}`}
                          >
                            {milestone.status}
                          </span>
                          <p className="text-[10px] text-white/75">{milestone.compactSummary}</p>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Cliquez sur un jalon compact pour l’ouvrir dans le hero horizontal.
          </p>
        </section>

        <p className="text-xs text-slate-400">
          Vue active : {activeMilestone.name} — {activeMilestone.status}
        </p>
      </div>
    </div>
  );
}
