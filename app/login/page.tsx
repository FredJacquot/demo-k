"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("Email ou mot de passe incorrect");
        } else {
          setError("Erreur de configuration/authentification serveur. Contactez l'administrateur.");
        }
        setIsLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
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
            Connectez-vous pour accéder à l&apos;application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez le mot de passe"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 text-center">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>

            <div className="text-xs text-muted-foreground text-center mt-4 space-y-1">
              <p className="font-semibold">Pour la démo :</p>
              <p>Mot de passe : <code className="bg-muted px-2 py-1 rounded">demo123</code></p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
