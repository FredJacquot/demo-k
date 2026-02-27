import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type PipelineStatus = "Terminé" | "En cours" | "En attente" | "Bloqué" | "À venir";

type Phase = {
  label: string;
};

type Segment = {
  label: string;
  status: PipelineStatus;
  expertControl?: boolean;
};

type Lane = {
  title: string;
  segments: Segment[];
};

const phases: Phase[] = [
  { label: "Ouverture du cycle" },
  { label: "Consolidation des données d’entrée" },
  { label: "Qualification des écarts" },
  { label: "Sécurisation des éléments de paie" },
  { label: "Préparation de la production" },
  { label: "Contrôle automatisé Kalia" },
  { label: "Contrôle expert GP" },
  { label: "Post-paie" },
  { label: "Clôture du cycle" },
];

const lanes: Lane[] = [
  {
    title: "Données RH & mouvements salariés",
    segments: [
      { label: "Détection des changements salariés", status: "Terminé" },
      { label: "Rapprochement Core HR / Paie", status: "En cours" },
      { label: "Validation des changements sensibles", status: "En attente" },
    ],
  },
  {
    title: "Absences, EVP & variables",
    segments: [
      { label: "Collecte des EVP", status: "En cours" },
      { label: "Synchronisation des absences GTA", status: "Bloqué" },
      { label: "Consolidation des variables de paie", status: "En cours" },
    ],
  },
  {
    title: "Contrôles & préparation Kalia",
    segments: [
      { label: "Contrôle multi-source", status: "En cours" },
      { label: "Qualification des anomalies paie", status: "Bloqué" },
      { label: "Contrôle des variables de paie", status: "En cours" },
      { label: "Comparatif M-1 vs M", status: "En cours" },
      { label: "Analyse des variations d’effectifs", status: "Terminé" },
      { label: "Scoring de préparation du lot", status: "À venir" },
      { label: "Préparation du lot de production", status: "À venir" },
    ],
  },
  {
    title: "Validation GP, post-paie & clôture",
    segments: [
      {
        label: "Contrôle des cotisations (GP)",
        status: "En attente",
        expertControl: true,
      },
      { label: "Virements", status: "À venir" },
      { label: "DSN", status: "À venir" },
      { label: "Export comptable", status: "À venir" },
      { label: "Clôture du cycle", status: "À venir" },
    ],
  },
];

const breakpoints = [
  "Changement salarié non transmis",
  "Absence GTA non synchronisée",
  "Variable de paie incohérente vs M-1",
  "Contrôle des cotisations en attente",
] as const;

const statusStyles: Record<PipelineStatus, string> = {
  Terminé: "border-emerald-300 bg-emerald-50 text-emerald-800",
  "En cours": "border-blue-300 bg-blue-50 text-blue-800",
  "En attente": "border-amber-300 bg-amber-50 text-amber-900",
  Bloqué: "border-red-500 bg-red-50 text-red-900 ring-2 ring-red-300/70",
  "À venir": "border-slate-300 bg-slate-100 text-slate-700",
};

export default function PayrollPipelineMensuelV3Page() {
  return (
    <div className="px-8 py-8">
      <div className="mx-auto flex w-full max-w-[1550px] flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Cycle de paie — Mars 2026</h1>
          <p className="text-sm text-muted-foreground">
            Pipeline opérationnel du cycle de paie piloté par Kalia
          </p>
          <p className="text-sm font-medium text-amber-700">
            Sous vigilance — le pipeline progresse, 2 contrôles restent bloquants
          </p>
        </header>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-8 p-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Début de cycle</span>
                <span>Fin de cycle</span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-3">
                <div className="grid gap-2 md:grid-cols-9">
                  {phases.map((phase, index) => (
                    <div
                      key={phase.label}
                      className="relative rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-center shadow-sm"
                    >
                      {index < phases.length - 1 ? (
                        <div className="pointer-events-none absolute -right-2 top-1/2 hidden h-0 w-0 -translate-y-1/2 border-y-[7px] border-l-[10px] border-y-transparent border-l-slate-300 md:block" />
                      ) : null}
                      <p className="text-[11px] font-semibold leading-tight text-slate-700">{phase.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              {lanes.map((lane) => (
                <div key={lane.title} className="space-y-2">
                  <h2 className="text-sm font-semibold text-slate-700">{lane.title}</h2>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap items-stretch gap-2">
                      {lane.segments.map((segment, index) => (
                        <div key={segment.label} className="flex items-center gap-2">
                          <div
                            className={`min-w-[200px] rounded-lg border px-3 py-2 shadow-sm ${statusStyles[segment.status]} ${
                              segment.expertControl
                                ? "border-violet-400 bg-violet-50/90 text-violet-900 ring-1 ring-violet-200"
                                : ""
                            }`}
                          >
                            <p className="text-[12px] font-medium leading-snug">{segment.label}</p>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="h-5 border-current bg-white/70 px-1.5 text-[10px] font-medium"
                              >
                                {segment.status}
                              </Badge>
                              {segment.expertControl ? (
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                                  Contrôle humain
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {index < lane.segments.length - 1 ? (
                            <div
                              className={`h-[2px] w-5 rounded-full ${
                                segment.status === "Bloqué" ? "bg-red-400" : "bg-slate-300"
                              }`}
                            />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </CardContent>
        </Card>

        <Card className="max-w-xl border-slate-200 bg-slate-50/60 shadow-none">
          <CardContent className="space-y-3 p-4">
            <h3 className="text-sm font-semibold text-slate-700">Points de rupture du pipeline</h3>
            <ul className="space-y-2">
              {breakpoints.map((item) => (
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