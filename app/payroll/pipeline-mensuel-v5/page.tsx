"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";

type MilestoneStatus = "Validé" | "Sous vigilance" | "En cours" | "En attente" | "À venir";
type ItemStatus = "Validé" | "En cours" | "Erreur" | "En attente";

type MilestoneItem = {
  label: string;
  status: ItemStatus;
};

type Milestone = {
  name: string;
  status: MilestoneStatus;
  targetDate: string;
  compactHint?: string;
  summary: {
    items: number;
    validated: number;
    inProgress: number;
    errors: number;
    waiting: number;
  };
  items: MilestoneItem[];
};

const milestones: Milestone[] = [
  {
    name: "Ouverture du cycle",
    status: "Validé",
    targetDate: "01/03/2026",
    compactHint: "3/3 validés",
    summary: { items: 3, validated: 3, inProgress: 0, errors: 0, waiting: 0 },
    items: [
      { label: "Validation du calendrier de paie", status: "Validé" },
      { label: "Ouverture des flux d’alimentation", status: "Validé" },
      { label: "Contrôle de disponibilité des connecteurs", status: "Validé" },
    ],
  },
  {
    name: "Consolidation des données d’entrée",
    status: "Validé",
    targetDate: "06/03/2026",
    compactHint: "6/6 validés",
    summary: { items: 6, validated: 6, inProgress: 0, errors: 0, waiting: 0 },
    items: [
      { label: "Collecte Core HR consolidée", status: "Validé" },
      { label: "Import GTA consolidé", status: "Validé" },
      { label: "Imports avantages et primes consolidés", status: "Validé" },
      { label: "Normalisation des formats de données", status: "Validé" },
      { label: "Contrôle de complétude inter-systèmes", status: "Validé" },
      { label: "Archivage de l’instantané d’entrée", status: "Validé" },
    ],
  },
  {
    name: "Qualification des écarts",
    status: "Sous vigilance",
    targetDate: "10/03/2026",
    compactHint: "2 erreurs",
    summary: { items: 7, validated: 3, inProgress: 2, errors: 2, waiting: 0 },
    items: [
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
    targetDate: "13/03/2026",
    compactHint: "1 erreur",
    summary: { items: 5, validated: 2, inProgress: 1, errors: 1, waiting: 1 },
    items: [
      { label: "Contrôle des variables de paie", status: "En cours" },
      { label: "Variable de paie incohérente vs M-1", status: "Erreur" },
      { label: "Validation des changements sensibles", status: "En attente" },
      { label: "Relance des éléments manquants", status: "Validé" },
      { label: "Contrôle multi-source", status: "Validé" },
    ],
  },
  {
    name: "Préparation de la production",
    status: "En cours",
    targetDate: "16/03/2026",
    compactHint: "2 en cours",
    summary: { items: 4, validated: 1, inProgress: 2, errors: 0, waiting: 1 },
    items: [
      { label: "Scoring de préparation du lot", status: "En cours" },
      { label: "Préparation du lot de production", status: "En cours" },
      { label: "Contrôle de complétude du lot", status: "En attente" },
      { label: "Pré-validation du lot", status: "Validé" },
    ],
  },
  {
    name: "Contrôle automatisé Kalia",
    status: "En cours",
    targetDate: "18/03/2026",
    compactHint: "3/4 contrôles lancés",
    summary: { items: 4, validated: 1, inProgress: 3, errors: 0, waiting: 0 },
    items: [
      { label: "Contrôle multi-source consolidé", status: "En cours" },
      { label: "Contrôle des variables de paie", status: "En cours" },
      { label: "Comparatif global M-1 vs M", status: "En cours" },
      { label: "Analyse des variations d’effectifs", status: "Validé" },
    ],
  },
  {
    name: "Contrôle expert GP",
    status: "En attente",
    targetDate: "19/03/2026",
    compactHint: "1 en attente",
    summary: { items: 2, validated: 0, inProgress: 0, errors: 0, waiting: 2 },
    items: [
      { label: "Contrôle des cotisations (GP)", status: "En attente" },
      { label: "Validation des assiettes et plafonds", status: "En attente" },
    ],
  },
  {
    name: "Post-paie",
    status: "À venir",
    targetDate: "23/03/2026",
    compactHint: "3 tâches prévues",
    summary: { items: 3, validated: 0, inProgress: 0, errors: 0, waiting: 3 },
    items: [
      { label: "Contrôle du journal de paie", status: "En attente" },
      { label: "Préparation des écritures comptables", status: "En attente" },
      { label: "Préparation des exports finance", status: "En attente" },
    ],
  },
  {
    name: "Clôture du cycle",
    status: "À venir",
    targetDate: "28/03/2026",
    compactHint: "2 étapes finales",
    summary: { items: 2, validated: 0, inProgress: 0, errors: 0, waiting: 2 },
    items: [
      { label: "Validation finale du cycle", status: "En attente" },
      { label: "Archivage et publication du bilan", status: "En attente" },
    ],
  },
];

const milestoneStatusClass: Record<MilestoneStatus, string> = {
  Validé: "border-emerald-300 bg-emerald-50 text-emerald-800",
  "Sous vigilance": "border-amber-300 bg-amber-50 text-amber-900",
  "En cours": "border-blue-300 bg-blue-50 text-blue-800",
  "En attente": "border-violet-300 bg-violet-50 text-violet-900",
  "À venir": "border-slate-300 bg-slate-100 text-slate-700",
};

const itemStatusClass: Record<ItemStatus, string> = {
  Validé: "border-emerald-300 bg-emerald-50 text-emerald-800",
  "En cours": "border-blue-300 bg-blue-50 text-blue-800",
  Erreur: "border-red-400 bg-red-50 text-red-900",
  "En attente": "border-violet-300 bg-violet-50 text-violet-900",
};

export default function PayrollPipelineMensuelV5Page() {
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
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Début de cycle</span>
            <span>Fin de cycle</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-3">
            <div className="flex min-w-[1380px] items-stretch">
              {milestones.map((milestone, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={milestone.name}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`relative min-h-[96px] border px-6 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                      isActive
                        ? "z-20 flex-[1.9] shadow-md"
                        : "z-10 flex-1 opacity-90 hover:opacity-100"
                    } ${index > 0 ? "-ml-3" : ""} ${milestoneStatusClass[milestone.status]}`}
                    style={{
                      clipPath:
                        index === 0
                          ? "polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%)"
                          : "polygon(18px 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 18px 100%, 0 50%)",
                    }}
                    aria-pressed={isActive}
                  >
                    <div className="flex h-full flex-col justify-between gap-1">
                      <p
                        className={`leading-tight ${
                          isActive ? "text-sm font-semibold" : "text-xs font-semibold"
                        }`}
                      >
                        {milestone.name}
                      </p>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-medium opacity-95">{milestone.status}</p>
                        {!isActive && milestone.compactHint ? (
                          <p className="text-[10px] opacity-80">{milestone.compactHint}</p>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <header className="grid grid-cols-1 gap-3 border-b border-slate-100 pb-4 md:grid-cols-[2fr_auto_auto_1.8fr] md:items-center">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{activeMilestone.name}</h2>
              <p className="text-xs text-slate-500">Date cible : {activeMilestone.targetDate}</p>
            </div>

            <Badge variant="outline" className={milestoneStatusClass[activeMilestone.status]}>
              {activeMilestone.status}
            </Badge>

            <p className="text-xs text-slate-600">{activeMilestone.summary.items} items</p>

            <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
              <span>{activeMilestone.summary.validated} validés</span>
              <span>•</span>
              <span>{activeMilestone.summary.inProgress} en cours</span>
              <span>•</span>
              <span className={activeMilestone.summary.errors > 0 ? "font-semibold text-red-700" : ""}>
                {activeMilestone.summary.errors} erreurs
              </span>
              <span>•</span>
              <span className={activeMilestone.summary.waiting > 0 ? "font-semibold text-violet-700" : ""}>
                {activeMilestone.summary.waiting} en attente
              </span>
            </div>
          </header>

          <ul className="mt-4 space-y-2">
            {activeMilestone.items.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2"
              >
                <span className="text-sm text-slate-800">{item.label}</span>
                <Badge variant="outline" className={itemStatusClass[item.status]}>
                  {item.status}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
