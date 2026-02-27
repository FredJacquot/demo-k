import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const kpis = [
  {
    label: "Statut global du cycle",
    value: "Sous contrôle",
    helper: "2 jalons terminés sur 6",
  },
  {
    label: "Progression",
    value: "58%",
    helper: "18 tâches clôturées / 31",
  },
  {
    label: "Blocages",
    value: "3",
    helper: "1 critique ; 2 modérés",
  },
  {
    label: "Tâches ouvertes",
    value: "13",
    helper: "5 à traiter aujourd'hui",
  },
];

const milestones = [
  {
    name: "Collecte changements salariés",
    targetDate: "04/03/2026",
    owner: "M. Garnier",
    status: "Terminé",
    linkedItems: 42,
    blockers: 0,
  },
  {
    name: "Collecte EVP",
    targetDate: "08/03/2026",
    owner: "S. Armand",
    status: "En cours",
    linkedItems: 19,
    blockers: 1,
  },
  {
    name: "Contrôle absences",
    targetDate: "11/03/2026",
    owner: "C. Lemoine",
    status: "Bloqué",
    linkedItems: 14,
    blockers: 2,
  },
  {
    name: "Pré-contrôle paie",
    targetDate: "15/03/2026",
    owner: "A. Rivière",
    status: "Prêt",
    linkedItems: 9,
    blockers: 0,
  },
  {
    name: "Transmission au moteur de paie",
    targetDate: "18/03/2026",
    owner: "P. Bernard",
    status: "À faire",
    linkedItems: 6,
    blockers: 0,
  },
  {
    name: "Corrections post-contrôle",
    targetDate: "22/03/2026",
    owner: "L. Perret",
    status: "À faire",
    linkedItems: 11,
    blockers: 0,
  },
];

const vigilanceItems = [
  "Changement salarié non transmis (population CDD Marseille)",
  "Absence non synchronisée depuis GTA sur 2 dossiers",
  "RIB manquant pour un nouvel entrant (paie de mars)",
];

const openTasks = [
  {
    name: "Vérifier écarts d'EVP variables",
    owner: "S. Armand",
    dueDate: "09/03/2026",
    priority: "Haute",
  },
  {
    name: "Relancer justificatifs absences longues",
    owner: "C. Lemoine",
    dueDate: "10/03/2026",
    priority: "Moyenne",
  },
  {
    name: "Contrôler les comptes bancaires modifiés",
    owner: "M. Garnier",
    dueDate: "12/03/2026",
    priority: "Haute",
  },
  {
    name: "Préparer lot de transmission moteur paie",
    owner: "P. Bernard",
    dueDate: "16/03/2026",
    priority: "Normale",
  },
];

const statusClasses: Record<string, string> = {
  "À faire": "bg-slate-100 text-slate-700 border-slate-200",
  "En cours": "bg-blue-100 text-blue-700 border-blue-200",
  Bloqué: "bg-red-100 text-red-700 border-red-200",
  Prêt: "bg-amber-100 text-amber-800 border-amber-200",
  Terminé: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const priorityClasses: Record<string, string> = {
  Normale: "bg-slate-100 text-slate-700 border-slate-200",
  Moyenne: "bg-amber-100 text-amber-800 border-amber-200",
  Haute: "bg-red-100 text-red-700 border-red-200",
};

export default function PayrollCalendarPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendrier de paie"
        subtitle="Pilotez le cycle mensuel de paie, ses jalons, ses blocages et ses priorités."
      >
        <Select defaultValue="mars-2026">
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mars-2026">Mars 2026</SelectItem>
          </SelectContent>
        </Select>
        <Button>Ouvrir le cycle</Button>
      </PageHeader>

      <div className="space-y-6 px-8 pb-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardHeader className="gap-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{kpi.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{kpi.helper}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Jalons du cycle</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jalon</TableHead>
                  <TableHead>Date cible</TableHead>
                  <TableHead>Propriétaire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Items liés</TableHead>
                  <TableHead>Blocages</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milestones.map((milestone) => (
                  <TableRow key={milestone.name}>
                    <TableCell className="font-medium">{milestone.name}</TableCell>
                    <TableCell>{milestone.targetDate}</TableCell>
                    <TableCell>{milestone.owner}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusClasses[milestone.status]}>
                        {milestone.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{milestone.linkedItems}</TableCell>
                    <TableCell>{milestone.blockers}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Points de vigilance</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {vigilanceItems.map((item) => (
                  <li key={item} className="rounded-lg border bg-muted/30 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tâches ouvertes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {openTasks.map((task) => (
                <div
                  key={task.name}
                  className="rounded-lg border bg-muted/20 px-3 py-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{task.name}</p>
                    <Badge variant="outline" className={priorityClasses[task.priority]}>
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">Propriétaire : {task.owner}</p>
                  <p className="text-muted-foreground">Échéance : {task.dueDate}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}