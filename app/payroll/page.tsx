"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Card } from "@/components/ui/card";

const changes = [
  {
    employee: "Camille Martin",
    changeType: "Changement d’adresse",
    sourceSystem: "Lucca Core HR",
    targetSystem: "Silae",
    effectiveDate: "04/03/2026",
    criticality: "Faible",
    status: "À analyser",
    action: "Voir",
  },
  {
    employee: "Nicolas Bernard",
    changeType: "Changement de RIB",
    sourceSystem: "Workday Core HR",
    targetSystem: "ADP Decidium",
    effectiveDate: "06/03/2026",
    criticality: "Haute",
    status: "En attente de validation",
    action: "Transmettre",
  },
  {
    employee: "Sarah Dubois",
    changeType: "Changement de temps de travail",
    sourceSystem: "Lucca Core HR",
    targetSystem: "Nibelis",
    effectiveDate: "08/03/2026",
    criticality: "Moyenne",
    status: "Prêt à transmettre",
    action: "Transmettre",
  },
  {
    employee: "Thomas Leroy",
    changeType: "Changement d’adresse",
    sourceSystem: "Workday Core HR",
    targetSystem: "Silae",
    effectiveDate: "10/03/2026",
    criticality: "Faible",
    status: "Transmis",
    action: "Voir",
  },
  {
    employee: "Julie Moreau",
    changeType: "Changement de RIB",
    sourceSystem: "Lucca Core HR",
    targetSystem: "ADP Decidium",
    effectiveDate: "11/03/2026",
    criticality: "Haute",
    status: "En erreur",
    action: "Voir",
  },
  {
    employee: "Antoine Petit",
    changeType: "Changement de temps de travail",
    sourceSystem: "Workday Core HR",
    targetSystem: "Nibelis",
    effectiveDate: "13/03/2026",
    criticality: "Moyenne",
    status: "À analyser",
    action: "Voir",
  },
];

const criticalityClasses: Record<string, string> = {
  Faible: "bg-slate-100 text-slate-700 border-slate-200",
  Moyenne: "bg-amber-100 text-amber-800 border-amber-200",
  Haute: "bg-red-100 text-red-700 border-red-200",
};

const statusClasses: Record<string, string> = {
  "À analyser": "bg-slate-100 text-slate-700 border-slate-200",
  "Prêt à transmettre": "bg-blue-100 text-blue-700 border-blue-200",
  "En attente de validation": "bg-amber-100 text-amber-800 border-amber-200",
  Transmis: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "En erreur": "bg-red-100 text-red-700 border-red-200",
};

export default function PayrollPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Changements à répercuter"
        subtitle="Suivez les changements salariés détectés dans le Core HR et leur répercussion vers la paie."
      >
        <Button variant="outline">Exporter</Button>
        <Button>Nouvelle analyse</Button>
      </PageHeader>

      <div className="px-8 pb-8 space-y-4">
        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Type de changement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adresse">Changement d’adresse</SelectItem>
                <SelectItem value="rib">Changement de RIB</SelectItem>
                <SelectItem value="temps">Changement de temps de travail</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="analyser">À analyser</SelectItem>
                <SelectItem value="pret">Prêt à transmettre</SelectItem>
                <SelectItem value="validation">En attente de validation</SelectItem>
                <SelectItem value="transmis">Transmis</SelectItem>
                <SelectItem value="erreur">En erreur</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Système source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lucca">Lucca Core HR</SelectItem>
                <SelectItem value="workday">Workday Core HR</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Système cible" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="silae">Silae</SelectItem>
                <SelectItem value="nibelis">Nibelis</SelectItem>
                <SelectItem value="adp">ADP Decidium</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Criticité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="faible">Faible</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salarié</TableHead>
                <TableHead>Type de changement</TableHead>
                <TableHead>Système source</TableHead>
                <TableHead>Système cible</TableHead>
                <TableHead>Date d’effet</TableHead>
                <TableHead>Criticité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {changes.map((item) => (
                <TableRow key={`${item.employee}-${item.effectiveDate}`}>
                  <TableCell className="font-medium">{item.employee}</TableCell>
                  <TableCell>{item.changeType}</TableCell>
                  <TableCell>{item.sourceSystem}</TableCell>
                  <TableCell>{item.targetSystem}</TableCell>
                  <TableCell>{item.effectiveDate}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={criticalityClasses[item.criticality]}>
                      {item.criticality}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusClasses[item.status]}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-primary">
                      {item.action}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
