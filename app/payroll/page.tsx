"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, TrendingUp, Users } from "lucide-react";

export default function PayrollPage() {
  const { currentUser, isLoading: userLoading } = useUser();
  const router = useRouter();

  // Redirect if not authorized
  useEffect(() => {
    if (!userLoading && currentUser && currentUser.role !== "payroll") {
      router.push("/");
    }
  }, [currentUser, userLoading, router]);

  // Don't render content if not authorized
  if (!currentUser || currentUser.role !== "payroll") {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestion de la paie"
        subtitle="Gérez les salaires, bulletins de paie et avantages des employés"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Salaires
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245 680 €</div>
            <p className="text-xs text-muted-foreground">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bulletins générés
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">
              Sur 50 employés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Augmentations
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              En attente de validation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Employés actifs
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">50</div>
            <p className="text-xs text-muted-foreground">
              Dans l'entreprise
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Gérez rapidement vos tâches de paie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Générer les bulletins</p>
                  <p className="text-sm text-muted-foreground">Créer les bulletins de paie du mois</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Traiter les salaires</p>
                  <p className="text-sm text-muted-foreground">Valider et envoyer les paiements</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Gérer les augmentations</p>
                  <p className="text-sm text-muted-foreground">Examiner les demandes d'augmentation</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Gérer les avantages</p>
                  <p className="text-sm text-muted-foreground">Configuration des avantages sociaux</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tâches en attente</CardTitle>
            <CardDescription>
              Actions requises ce mois-ci
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="h-2 w-2 bg-red-500 rounded-full" />
              <div className="flex-1">
                <p className="font-medium text-sm">3 bulletins manquants</p>
                <p className="text-xs text-muted-foreground">À compléter avant le 05/08</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="h-2 w-2 bg-orange-500 rounded-full" />
              <div className="flex-1">
                <p className="font-medium text-sm">12 augmentations à valider</p>
                <p className="text-xs text-muted-foreground">Revue mensuelle</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="h-2 w-2 bg-blue-500 rounded-full" />
              <div className="flex-1">
                <p className="font-medium text-sm">Virement collectif</p>
                <p className="text-xs text-muted-foreground">Prévu le 30/08</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <div className="flex-1">
                <p className="font-medium text-sm">Rapport mensuel</p>
                <p className="text-xs text-muted-foreground">À envoyer à la direction</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
