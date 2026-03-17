"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEMO_USERS = [
  { id: "user-001", email: "sophie.leclerc@entreprise.fr", name: "Sophie Leclerc", role: "Employé" },
  { id: "user-004", email: "jean.dupont@entreprise.fr", name: "Jean Dupont", role: "RH" },
  { id: "user-006", email: "claire.rousseau@entreprise.fr", name: "Claire Rousseau", role: "DRH" },
  { id: "user-007", email: "luc.moreau@entreprise.fr", name: "Luc Moreau", role: "Paie" },
];

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setIsLoading(true);
    localStorage.setItem("demo_user_id", userId);
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Kalia - Assistant Paie & RH
          </CardTitle>
          <CardDescription className="text-center">
            Sélectionnez un utilisateur pour accéder à l&apos;application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user">Utilisateur</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Sélectionnez un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_USERS.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !userId}>
              {isLoading ? "Connexion..." : "Accéder à l'application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
