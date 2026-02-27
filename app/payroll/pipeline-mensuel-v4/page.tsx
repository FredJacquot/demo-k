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
  summary: {
    items: number;
    validated: number;
    inProgress: number;
    errors: number;
    waiting: number;
  };
  isOpen: boolean;
  items?: MilestoneItem[];
};

const milestones: Milestone[] = [
  {
    name: "Ouverture du cycle",
    status: "Validé",
    targetDate: "01/03/2026",
    summary: { items: 3, validated: 3, inProgress: 0, errors: 0, waiting: 0 },
    isOpen: false,
  },
  {
    name: "Consolidation des données d’entrée",
    status: "Validé",
    targetDate: "06/03/2026",
    summary: { items: 6, validated: 6, inProgress: 0, errors: 0, waiting: 0 },
    isOpen: false,
  },
  {
    name: "Qualification des écarts",
    status: "Sous vigilance",
    targetDate: "10/03/2026",
    summary: { items: 7, validated: 3, inProgress: 2, errors: 2, waiting: 0 },
    isOpen: true,
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
    summary: { items: 5, validated: 2, inProgress: 1, errors: 1, waiting: 1 },
    isOpen: true,
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
    summary: { items: 4, validated: 1, inProgress: 2, errors: 0, waiting: 1 },
    isOpen: true,
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
    summary: { items: 4, validated: 1, inProgress: 3, errors: 0, waiting: 0 },
    isOpen: true,
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
    summary: { items: 1, validated: 0, inProgress: 0, errors: 0, waiting: 1 },
    isOpen: true,
    items: [{ label: "Contrôle des cotisations (GP)", status: "En attente" }],
  },
  {
    name: "Post-paie",
    status: "À venir",
    targetDate: "23/03/2026",
    summary: { items: 3, validated: 0, inProgress: 0, errors: 0, waiting: 3 },
    isOpen: false,
  },
  {
    name: "Clôture du cycle",
    status: "À venir",
    targetDate: "28/03/2026",
    summary: { items: 2, validated: 0, inProgress: 0, errors: 0, waiting: 2 },
    isOpen: false,
  },
];

const cycleBlockers = [
  "Changement salarié non transmis",
  "Absence GTA non synchronisée",
  "Variable de paie incohérente vs M-1",
  "Contrôle des cotisations en attente",
] as const;

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

export default function PayrollPipelineMensuelV4Page() {
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
            <div className="flex min-w-[1280px] items-stretch gap-1">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.name}
                  className={`relative flex min-h-[78px] flex-1 items-center rounded-lg border px-3 py-2 ${milestoneStatusClass[milestone.status]}`}
                >
                  <div>
                    <p className="text-xs font-semibold leading-tight">{milestone.name}</p>
                    <p className="mt-1 text-[11px] font-medium opacity-90">{milestone.status}</p>
                  </div>

                  {index < milestones.length - 1 ? (
                    <div className="pointer-events-none absolute -right-3 top-1/2 z-10 h-0 w-0 -translate-y-1/2 border-y-[12px] border-l-[12px] border-y-transparent border-l-slate-300" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          {milestones.map((milestone) => (
            <article
              key={milestone.name}
              className={`rounded-xl border bg-white ${
                milestone.isOpen
                  ? "border-slate-300 shadow-sm"
                  : "border-slate-200"
              } ${
                milestone.status === "Sous vigilance"
                  ? "ring-1 ring-amber-200"
                  : milestone.status === "En attente"
                    ? "ring-1 ring-violet-200"
                    : ""
              }`}
            >
              <header className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-[2fr_auto_auto_1.6fr_auto] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{milestone.name}</p>
                  <p className="text-xs text-slate-500">Date cible : {milestone.targetDate}</p>
                </div>

                <Badge variant="outline" className={milestoneStatusClass[milestone.status]}>
                  {milestone.status}
                </Badge>

                <p className="text-xs text-slate-600">{milestone.summary.items} items</p>

                <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                  <span>{milestone.summary.validated} validés</span>
                  <span>•</span>
                  <span>{milestone.summary.inProgress} en cours</span>
                  <span>•</span>
                  <span className={milestone.summary.errors > 0 ? "font-semibold text-red-700" : ""}>
                    {milestone.summary.errors} erreurs
                  </span>
                  <span>•</span>
                  <span className={milestone.summary.waiting > 0 ? "font-semibold text-violet-700" : ""}>
                    {milestone.summary.waiting} en attente
                  </span>
                </div>

                <span className="justify-self-end text-slate-500">{milestone.isOpen ? "▾" : "▸"}</span>
              </header>

              {milestone.isOpen && milestone.items ? (
                <div className="border-t border-slate-100 px-4 py-3">
                  <ul className="space-y-2">
                    {milestone.items.map((item) => (
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
                </div>
              ) : null}
            </article>
          ))}
        </section>

        <section className="max-w-xl rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Points de blocage du cycle</h3>
          <ul className="mt-2 space-y-1.5">
            {cycleBlockers.map((item) => (
              <li key={item} className="rounded-md bg-white px-3 py-2 text-sm text-slate-700">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}