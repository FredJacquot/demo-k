import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ProcessStatus = "Terminé" | "En cours" | "En attente" | "Bloqué" | "À venir";

type ProcessCell = {
  label: string;
  status: ProcessStatus;
  isGpControl?: boolean;
};

type Lane = {
  label: string;
  milestones: Record<string, ProcessCell[]>;
};

const milestones = [
  "Ouverture du cycle",
  "Consolidation des données d’entrée",
  "Qualification des écarts",
  "Sécurisation des éléments de paie",
  "Préparation de la production",
  "Contrôle automatisé Kalia",
  "Contrôle expert GP",
  "Post-paie",
  "Clôture du cycle",
] as const;

const lanes: Lane[] = [
  {
    label: "Données RH & mouvements salariés",
    milestones: {
      "Ouverture du cycle": [
        { label: "Détection des changements salariés", status: "Terminé" },
      ],
      "Consolidation des données d’entrée": [
        { label: "Rapprochement Core HR / Paie", status: "En cours" },
      ],
      "Sécurisation des éléments de paie": [
        { label: "Validation des changements sensibles", status: "En attente" },
      ],
    },
  },
  {
    label: "Absences, EVP & variables",
    milestones: {
      "Consolidation des données d’entrée": [{ label: "Collecte des EVP", status: "En cours" }],
      "Qualification des écarts": [
        { label: "Synchronisation des absences GTA", status: "Bloqué" },
      ],
      "Sécurisation des éléments de paie": [
        { label: "Consolidation des variables de paie", status: "En cours" },
      ],
    },
  },
  {
    label: "Contrôles & préparation Kalia",
    milestones: {
      "Qualification des écarts": [{ label: "Contrôle multi-source", status: "En cours" }],
      "Sécurisation des éléments de paie": [
        { label: "Qualification des anomalies paie", status: "Bloqué" },
      ],
      "Préparation de la production": [
        { label: "Préparation du lot de production", status: "À venir" },
      ],
      "Contrôle automatisé Kalia": [
        { label: "Contrôle des variables de paie", status: "En cours" },
        { label: "Comparatif M-1 vs M", status: "En cours" },
        { label: "Analyse des variations d’effectifs", status: "Terminé" },
        { label: "Scoring de préparation du lot", status: "À venir" },
      ],
    },
  },
  {
    label: "Validation GP, post-paie & clôture",
    milestones: {
      "Contrôle expert GP": [
        { label: "Contrôle des cotisations (GP)", status: "En attente", isGpControl: true },
      ],
      "Post-paie": [
        { label: "Virements", status: "À venir" },
        { label: "DSN", status: "À venir" },
        { label: "Export comptable", status: "À venir" },
      ],
      "Clôture du cycle": [{ label: "Clôture du cycle", status: "À venir" }],
    },
  },
];

const blockers = [
  "Changement salarié non transmis",
  "Absence GTA non synchronisée",
  "Variable de paie incohérente vs M-1",
  "Contrôle des cotisations en attente",
] as const;

const statusStyles: Record<ProcessStatus, string> = {
  Terminé: "border-emerald-300 bg-emerald-50 text-emerald-800",
  "En cours": "border-blue-300 bg-blue-50 text-blue-800",
  "En attente": "border-amber-300 bg-amber-50 text-amber-900",
  Bloqué: "border-red-500 bg-red-50 text-red-900 ring-2 ring-red-300/70",
  "À venir": "border-slate-300 bg-slate-100 text-slate-700",
};

export default function PayrollRoadmapSwimlanesV2Page() {
  return (
    <div className="px-8 py-8">
      <div className="mx-auto flex w-full max-w-[1550px] flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Cycle de paie — Mars 2026</h1>
          <p className="text-sm text-muted-foreground">
            Vue matricielle des processus du cycle pilotés par Kalia
          </p>
          <p className="text-sm font-medium text-amber-700">
            Sous vigilance — 3 contrôles Kalia en cours, validation expert GP attendue
          </p>
        </header>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div
                className="grid min-w-[1400px]"
                style={{ gridTemplateColumns: "280px repeat(9, minmax(120px, 1fr))" }}
              >
                <div className="sticky left-0 z-10 border-b border-r bg-slate-100/95 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-700 backdrop-blur">
                  Domaines / process
                </div>
                {milestones.map((milestone) => (
                  <div
                    key={milestone}
                    className="border-b border-r bg-slate-50 px-3 py-3 text-center text-xs font-semibold leading-tight text-slate-700"
                  >
                    {milestone}
                  </div>
                ))}

                {lanes.map((lane) => (
                  <div key={`row-${lane.label}`} className="contents">
                    <div
                      key={`lane-${lane.label}`}
                      className="sticky left-0 z-10 border-b border-r bg-white/95 px-4 py-4 text-sm font-semibold text-slate-800 backdrop-blur"
                    >
                      {lane.label}
                    </div>

                    {milestones.map((milestone) => {
                      const items = lane.milestones[milestone] ?? [];

                      return (
                        <div
                          key={`${lane.label}-${milestone}`}
                          className="min-h-[130px] border-b border-r bg-white p-2.5"
                        >
                          <div className="flex h-full flex-col gap-2">
                            {items.map((item) => (
                              <div
                                key={item.label}
                                className={`rounded-md border p-2.5 shadow-sm ${statusStyles[item.status]} ${
                                  item.isGpControl
                                    ? "border-violet-400 bg-violet-50/90 text-violet-900 ring-1 ring-violet-200"
                                    : ""
                                }`}
                              >
                                <p className="text-[12px] font-medium leading-snug">{item.label}</p>
                                <div className="mt-1.5 flex items-center gap-1.5">
                                  <Badge
                                    variant="outline"
                                    className="h-5 border-current bg-white/70 px-1.5 text-[10px] font-medium"
                                  >
                                    {item.status}
                                  </Badge>
                                  {item.isGpControl ? (
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                                      Contrôle humain
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-xl border-slate-200 bg-slate-50/60 shadow-none">
          <CardContent className="space-y-3 p-4">
            <h2 className="text-sm font-semibold text-slate-700">Points de blocage du cycle</h2>
            <ul className="space-y-2">
              {blockers.map((item) => (
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
