"use client";

import { useState } from "react";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEMO_USERS = [
  { email: "sophie.leclerc@entreprise.fr", name: "Sophie Leclerc", role: "Employé" },
  { email: "jean.dupont@entreprise.fr", name: "Jean Dupont", role: "RH" },
  { email: "claire.rousseau@entreprise.fr", name: "Claire Rousseau", role: "DRH" },
  { email: "luc.moreau@entreprise.fr", name: "Luc Moreau", role: "Paie" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Veuillez sélectionner un utilisateur");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const result = await loginAction(email);
      if (!result.success) {
        setError(result.error ?? "Une erreur s'est produite");
        setIsLoading(false);
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("Une erreur s'est produite");
      setIsLoading(false);
    }
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
              <Label htmlFor="email">Utilisateur</Label>
              <Select value={email} onValueChange={setEmail}>
                <SelectTrigger id="email">
                  <SelectValue placeholder="Sélectionnez un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_USERS.map((user) => (
                    <SelectItem key={user.email} value={user.email}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="text-sm text-red-500 text-center">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || !email}>
              {isLoading ? "Connexion..." : "Accéder à l'application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
