"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Page de démo onboarding — redirige directement vers la conversation ?mock
 * avec un message qui matche le scénario "scenario-onboarding-salarie".
 * Tout le système mock (kalia-mock, messages, transmission) est réutilisé as-is.
 */
export default function DemoOnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams({
      prefill: "J'ai une nouvelle embauche à intégrer : Thomas Leclerc, développeur backend, prise de poste le 3 février. Peux-tu lancer le workflow d'onboarding administratif ?",
    });
    router.replace(`/conversation/new?mock&${params.toString()}`);
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-500 text-white font-bold text-lg animate-pulse">
          K
        </div>
        <p className="text-sm">Chargement de la démo…</p>
      </div>
    </div>
  );
}
