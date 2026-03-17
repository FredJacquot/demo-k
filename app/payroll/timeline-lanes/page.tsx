import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type BlockStatus = "Terminé" | "En cours" | "En attente" | "Bloqué" | "À venir";

type TimelineBlock = {
  label: string;
  status: BlockStatus;
  startDay: number;
  endDay: number;
  expertControl?: boolean;
};

type TimelineLane = {
  title: string;
  blocks: TimelineBlock[];
};

const monthStartLabel = "1 mars";
const monthEndLabel = "31 mars";

const milestones = [
  { label: "Ouverture du cycle", day: 1 },
  { label: "Consolidation des données d’entrée", day: 4 },
  { label: "Qualification des écarts", day: 8 },
  { label: "Sécurisation des éléments de paie", day: 11 },
  { label: "Préparation de la production", day: 15 },
  { label: "Contrôle automatisé Kalia", day: 19 },
  { label: "Contrôle expert GP", day: 23 },
  { label: "Post-paie", day: 27 },
  { label: "Clôture du cycle", day: 31 },
] as const;

const lanes: TimelineLane[] = [
  {
    title: "Données RH & mouvements salariés",
    blocks: [
      {
        label: "Détection des changements salariés",
        status: "Terminé",
        startDay: 1,
        endDay: 5,
      },
      {
        label: "Rapprochement Core HR / Paie",
        status: "En cours",
        startDay: 4,
        endDay: 11,
      },
      {
        label: "Validation des changements sensibles",
        status: "En attente",
        startDay: 10,
        endDay: 16,
      },
    ],
  },
  {
    title: "Absences, EVP & variables",
    blocks: [
      {
        label: "Collecte des EVP",
        status: "En cours",
        startDay: 5,
        endDay: 12,
      },
      {
        label: "Synchronisation des absences GTA",
        status: "Bloqué",
        startDay: 8,
        endDay: 15,
      },
      {
        label: "Consolidation des variables de paie",
        status: "En cours",
        startDay: 12,
        endDay: 19,
      },
    ],
  },
  {
    title: "Contrôles & préparation Kalia",
    blocks: [
      {
        label: "Contrôle multi-source",
        status: "En cours",
        startDay: 13,
        endDay: 18,
      },
      {
        label: "Qualification des anomalies paie",
        status: "Bloqué",
        startDay: 15,
        endDay: 20,
      },
      {
        label: "Contrôle des variables de paie",
        status: "En cours",
        startDay: 16,
        endDay: 21,
      },
      {
        label: "Comparatif M-1 vs M",
        status: "En cours",
        startDay: 17,
        endDay: 22,
      },
      {
        label: "Analyse des variations d’effectifs",
        status: "Terminé",
        startDay: 18,
        endDay: 22,
      },
      {
        label: "Scoring de préparation du lot",
        status: "À venir",
        startDay: 21,
        endDay: 25,
      },
      {
        label: "Préparation du lot de production",
        status: "À venir",
        startDay: 24,
        endDay: 29,
      },
    ],
  },
  {
    title: "Validation GP, post-paie & clôture",
    blocks: [
      {
        label: "Contrôle des cotisations (GP)",
        status: "En attente",
        startDay: 22,
        endDay: 27,
        expertControl: true,
      },
      {
        label: "Virements",
        status: "À venir",
        startDay: 25,
        endDay: 29,
      },
      {
        label: "DSN",
        status: "À venir",
        startDay: 27,
        endDay: 30,
      },
      {
        label: "Export comptable",
        status: "À venir",
        startDay: 28,
        endDay: 31,
      },
      {
        label: "Clôture du cycle",
        status: "À venir",
        startDay: 30,
        endDay: 31,
      },
    ],
  },
];

const activeBlockers = [
  "Changement salarié non transmis",
  "Absence GTA non synchronisée",
  "Variable de paie incohérente vs M-1",
  "Contrôle des cotisations en attente",
] as const;

const statusClasses: Record<BlockStatus, string> = {
  Terminé: "border-emerald-300 bg-emerald-50 text-emerald-800",
  "En cours": "border-blue-300 bg-blue-50 text-blue-800",
  "En attente": "border-amber-300 bg-amber-50 text-amber-900",
  Bloqué: "border-red-500 bg-red-50 text-red-900 ring-2 ring-red-300/70",
  "À venir": "border-slate-300 bg-slate-100 text-slate-700",
};

const dayToPercent = (day: number) => ((day - 1) / 30) * 100;

export default function PayrollTimelineLanesPage() {
  return (
    <div className="px-8 py-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Cycle de paie — Mars 2026</h1>
          <p className="text-sm text-muted-foreground">
            Timeline opérationnelle du cycle pilotée par Kalia
          </p>
          <p className="text-sm font-medium text-amber-700">
            Sous vigilance — pré-contrôles Kalia en cours, contrôle des cotisations en attente
          </p>
        </header>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-8 p-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span>{monthStartLabel}</span>
                <span>{monthEndLabel}</span>
              </div>

              <div className="relative h-28 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4">
                <div className="absolute left-4 right-4 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-slate-300" />

                {milestones.map((milestone) => (
                  <div
                    key={milestone.label}
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{ left: `calc(${dayToPercent(milestone.day)}% + 0rem)` }}
                  >
                    <div className="flex w-36 -translate-x-1/2 flex-col items-center gap-2 text-center">
                      <div className="h-4 w-4 rounded-full border-2 border-slate-700 bg-white shadow-sm" />
                      <p className="text-[11px] font-semibold leading-tight text-slate-700">
                        {milestone.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {lanes.map((lane) => (
                <section key={lane.title} className="space-y-2">
                  <h2 className="text-sm font-semibold text-slate-700">{lane.title}</h2>
                  <div className="relative h-20 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-100" />
                    {lane.blocks.map((block) => {
                      const left = dayToPercent(block.startDay);
                      const width = Math.max(((block.endDay - block.startDay) / 30) * 100, 9);

                      return (
                        <div
                          key={block.label}
                          className={`absolute top-3 rounded-lg border px-2.5 py-2 text-[11px] shadow-sm ${statusClasses[block.status]} ${
                            block.expertControl
                              ? "border-violet-400 bg-violet-50/90 text-violet-900 ring-1 ring-violet-200"
                              : ""
                          }`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                        >
                          <div className="line-clamp-2 font-medium leading-tight">{block.label}</div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="h-5 border-current bg-white/60 px-1.5 text-[10px] font-medium"
                            >
                              {block.status}
                            </Badge>
                            {block.expertControl ? (
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                                Contrôle humain
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-xl border-slate-200 bg-slate-50/60 shadow-none">
          <CardContent className="space-y-3 p-4">
            <h3 className="text-sm font-semibold text-slate-700">Blocages actifs</h3>
            <ul className="space-y-2">
              {activeBlockers.map((item) => (
                <li key={item} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
