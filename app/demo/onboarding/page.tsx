"use client";

import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatInput } from "@/components/conversation/chat-input";
import { TypingIndicator } from "@/components/conversation/messages/typing-indicator";
import {
  FileText, CheckCircle2, Clock, AlertTriangle, RotateCcw,
  Bell, FastForward, Stethoscope, Zap, Building2, PanelRightClose, PanelRightOpen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type SceneId =
  | "idle"
  | "1" | "2" | "3" | "3wait"
  | "4" | "4sent"
  | "5" | "5gen"
  | "6" | "7" | "8" | "8b"
  | "9" | "10" | "10b" | "11" | "11b" | "done";

interface DemoMsg {
  id: string;
  ts: string;
  kind: "question" | "kalia" | "system";
  sceneId?: SceneId;
  text?: string;
}

interface DemoTicket {
  id: string;
  title: string;
  status: string;
  variant: "pending" | "progress" | "done";
  details?: string[];
}

const uid = () => Math.random().toString(36).slice(2, 9);
const nowStr = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const LS_MSGS    = "kalia_demo3_msgs";
const LS_SCENE   = "kalia_demo3_scene";
const LS_TICKETS = "kalia_demo3_tickets";

// ─── Primitives ───────────────────────────────────────────────────────────────

function FileCard({ name, meta }: { name: string; meta: string }) {
  return (
    <div className="flex items-center gap-3 border border-border rounded-xl p-3 bg-muted/30">
      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      <Button variant="outline" size="sm" className="text-xs shrink-0">Voir</Button>
    </div>
  );
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {ok
        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        : <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
      <span className={cn(!ok && "text-muted-foreground")}>{label}</span>
    </div>
  );
}

function CheckCard({ items }: { items: { ok: boolean; label: string }[] }) {
  return (
    <div className="border border-border rounded-xl px-4 py-3 space-y-2">
      {items.map((it, i) => <CheckRow key={i} {...it} />)}
    </div>
  );
}

function SourceBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 rounded-full px-2.5 py-0.5">
      <FileText className="w-3 h-3" />{label}
    </span>
  );
}

function OptionBtn({ label, sub, warn, onClick }: { label: string; sub?: string; warn?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left border rounded-xl px-4 py-3 text-sm transition-all hover:shadow-sm",
        warn
          ? "border-amber-400/50 bg-amber-50/50 dark:bg-amber-900/10 hover:border-amber-400"
          : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
      )}
    >
      <div className="font-medium">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </button>
  );
}

function SimBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 text-xs border-2 border-dashed border-amber-400/70 text-amber-600 dark:text-amber-400 rounded-lg px-3 py-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors font-medium"
    >
      <FastForward className="w-3.5 h-3.5" />{label}
    </button>
  );
}

function ProgressBar() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPct(p => (p >= 100 ? 100 : p + 5)), 80);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Génération en cours…</span><span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-violet-500 transition-all duration-75 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Scene renderers ──────────────────────────────────────────────────────────

// SCÈNE 1 — Récupération du CV
function Scene1({ onChoice }: { onChoice: (c: string) => void }) {
  return (
    <>
      <p>J'ai trouvé un mail de Thomas Durand reçu le 12 juin avec un CV en pièce jointe.</p>
      <FileCard name="thomas_durand_cv_2026.pdf" meta="Reçu le 12/06/2026 — t.durand@gmail.com" />
      <p>C'est bien celui-ci ?</p>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" className="gap-1.5" onClick={() => onChoice("oui")}>
          <CheckCircle2 className="w-3.5 h-3.5" /> Oui c'est lui
        </Button>
        <Button size="sm" variant="outline" onClick={() => onChoice("non")}>Non, cherche encore</Button>
      </div>
    </>
  );
}

// SCÈNE 2 — Incohérence salariale Syntec
function Scene2({ onChoice }: { onChoice: (c: string) => void }) {
  return (
    <>
      <p>Avant de préparer la proposition de poste, je détecte une <strong>incohérence avec la grille Syntec en vigueur</strong>.</p>
      <p>Pour la position 3.1, coefficient 170, le <strong>salaire minimum conventionnel est de 3 650 € brut mensuel</strong>. Le salaire demandé de 3 500 € est en dessous de ce plancher.</p>
      <SourceBadge label="Grille Syntec — mise à jour janvier 2026" />
      <div className="space-y-2 pt-1">
        <OptionBtn
          label="Option A — Ajuster le salaire au minimum"
          sub="3 650 € — Position 3.1, Coefficient 170"
          onClick={() => onChoice("A")}
        />
        <OptionBtn
          label="Option B — Ajuster la classification"
          sub="Position 2.3, Coefficient 150 — salaire 3 500 € conforme (plancher 3 275 €)"
          onClick={() => onChoice("B")}
        />
        <OptionBtn
          label="⚠️ Option C — Maintenir 3 500 € en position 3.1"
          sub="Non-conformité conventionnelle — risque en cas de contrôle"
          warn
          onClick={() => onChoice("C")}
        />
      </div>
      <div className="bg-muted/40 border border-border/50 rounded-xl px-4 py-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Cohérence interne :</span> 3 cadres en position 2.3, salaire moyen 3 420 €. Un salaire de 3 500 € en 2.3 serait cohérent.{" "}
        <span className="opacity-60">Source : Lucca Poplee Socle RH</span>
      </div>
    </>
  );
}

// SCÈNE 3 — Proposition de poste
function Scene3({ onChoice }: { onChoice: (c: string) => void }) {
  return (
    <>
      <p>C'est noté. Je prépare la proposition de poste avec les éléments suivants :</p>
      <ul className="text-sm text-muted-foreground space-y-0.5 ml-1">
        <li>— Thomas Durand — CDI cadre</li>
        <li>— CCN Syntec — Position 2.3 — Coefficient 150</li>
        <li>— Salaire brut mensuel : 3 500 €</li>
        <li>— Date d'entrée prévue : 1er septembre 2026</li>
        <li>— Lieu de travail : Paris, 15 rue des Lilas</li>
      </ul>
      <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl px-4 py-2.5 text-sm text-violet-700 dark:text-violet-300">
        Pour préparer le contrat dès que Thomas accepte, j'aurai besoin de son <strong>numéro de sécurité sociale</strong>. Vous l'avez, ou je le lui demande en même temps que l'envoi de la proposition ?
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" className="gap-1.5" onClick={() => onChoice("demande")}>
          Demande-lui avec la proposition
        </Button>
        <Button size="sm" variant="outline" onClick={() => onChoice("jai")}>Je l'ai, le voici</Button>
      </div>
    </>
  );
}

// SCÈNE 4 — Envoi de la proposition
function Scene4({ onChoice }: { onChoice: (c: string) => void }) {
  return (
    <>
      <p>La proposition de poste est prête.</p>
      <FileCard name="Proposition de poste — Thomas Durand — Syntec 2.3.pdf" meta="Générée à l'instant" />
      <CheckCard items={[
        { ok: true, label: "Classification conforme grille Syntec (plancher 3 275 €, salaire proposé 3 500 €)" },
        { ok: true, label: "Cohérence avec les salaires internes position 2.3" },
        { ok: true, label: "Mentions obligatoires présentes" },
        { ok: true, label: "Avantages inclus : mutuelle, prévoyance, RTT (selon template entreprise)" },
      ]} />
      <p className="text-sm text-muted-foreground">À l'envoi, je demanderai aussi à Thomas son numéro de sécurité sociale pour préparer le contrat.</p>
      <p>Je l'envoie à Thomas ?</p>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" className="gap-1.5" onClick={() => onChoice("envoie")}>
          Envoie la proposition
        </Button>
        <Button size="sm" variant="outline" onClick={() => onChoice("modif")}>✏️ Modifier</Button>
      </div>
    </>
  );
}

// SCÈNE 4 envoyée — confirmation
function Scene4Sent({ onSim }: { onSim: () => void }) {
  return (
    <>
      <p>Proposition envoyée à Thomas Durand (t.durand@gmail.com) avec demande de numéro de sécurité sociale.</p>
      <p className="text-sm text-muted-foreground">Je vous notifie dès qu'il répond. Si pas de réponse sous 48h, je le relance automatiquement.</p>
      <SimBtn label="Simuler : Thomas accepte la proposition" onClick={onSim} />
    </>
  );
}

// SCÈNE 5 — Thomas accepte + numéro de sécu
function Scene5({ onChoice }: { onChoice: (c: string) => void }) {
  return (
    <>
      <p>Thomas Durand a <strong>accepté la proposition</strong> et transmis son numéro de sécurité sociale.</p>
      <p>J'ai tout ce qu'il faut pour générer le contrat de travail :</p>
      <CheckCard items={[
        { ok: true, label: "Informations du CV (état civil, adresse, date de naissance)" },
        { ok: true, label: "Classification validée : Position 2.3, Coefficient 150, 3 500 € brut" },
        { ok: true, label: "Numéro de sécurité sociale : reçu" },
      ]} />
      <p>Je génère le contrat ?</p>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" className="gap-1.5" onClick={() => onChoice("genere")}>
          Génère le contrat
        </Button>
        <Button size="sm" variant="outline" onClick={() => onChoice("attends")}>Attends</Button>
      </div>
    </>
  );
}

// SCÈNE 5 — Génération en cours (animation)
function Scene5Gen() {
  return (
    <>
      <p>Génération du contrat en cours…</p>
      <ProgressBar />
    </>
  );
}

// SCÈNE 6 — Contrat prêt
function Scene6({ onChoice }: { onChoice: (c: string) => void }) {
  return (
    <>
      <p>Le contrat est prêt.</p>
      <FileCard name="Contrat CDI — Thomas Durand — Syntec 2.3.pdf" meta="Généré à l'instant" />
      <CheckCard items={[
        { ok: true, label: "Période d'essai : 4 mois renouvelable — conforme cadre Syntec" },
        { ok: true, label: "Clause de non-concurrence : conforme template entreprise" },
        { ok: true, label: "Lieu de travail : Paris, 15 rue des Lilas" },
        { ok: true, label: "Mentions obligatoires : toutes présentes" },
        { ok: true, label: "Salaire vs grille Syntec 2.3 : conforme (plancher 3 275 €)" },
        { ok: true, label: "Cohérence interne : dans la fourchette position 2.3" },
        { ok: true, label: "Numéro de sécurité sociale : intégré" },
      ]} />
      <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl px-4 py-2.5 text-xs text-violet-700 dark:text-violet-300">
        J'ai programmé un rappel pour réévaluer la classification de Thomas à la fin de sa période d'essai (31 décembre 2026), comme vous l'avez mentionné.
      </div>
      <p>Souhaitez-vous modifier quelque chose ou lancer la signature ?</p>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" className="gap-1.5" onClick={() => onChoice("sign")}>
          ✍️ Lancer la signature
        </Button>
        <Button size="sm" variant="outline" onClick={() => onChoice("edit")}>✏️ Modifier le contrat</Button>
      </div>
    </>
  );
}

// SCÈNE 7 — Signature lancée
function Scene7({ onSim }: { onSim: () => void }) {
  return (
    <>
      <p>Signature électronique lancée via Yousign.</p>
      <p>Circuit de signature :</p>
      <div className="space-y-2">
        <div className="flex items-center gap-3 text-sm">
          <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
          <span><strong>Thomas Durand</strong> — mail envoyé à t.durand@gmail.com</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="w-6 h-6 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
          <span><strong>Vous</strong> — après la signature du candidat</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Si Thomas n'a pas signé sous 48h, je le relance automatiquement. Je vous alerte au bout de 5 jours sans réponse.</p>
      <SimBtn label="Simuler : 24h plus tard" onClick={onSim} />
    </>
  );
}

// SCÈNE 8 — Relance proactive 24h plus tard
function Scene8({ onSim }: { onSim: () => void }) {
  return (
    <>
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm">
        <Bell className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-200">Point de suivi — Thomas Durand</p>
          <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">Thomas Durand n'a pas encore signé son contrat (envoyé hier 14h12). Pas d'action requise. Relance automatique prévue demain matin.</p>
        </div>
      </div>
      <SimBtn label="Simuler : Thomas a signé" onClick={onSim} />
    </>
  );
}

// SCÈNE 8b — Thomas a signé, à votre tour
function Scene8b({ onSign }: { onSign: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
        <CheckCircle2 className="w-4 h-4" /> Thomas Durand a signé son contrat à l'instant.
      </div>
      <p>C'est à votre tour. Le contrat signé est dans votre boîte mail connectée.</p>
      <FileCard name="Contrat signé — Thomas Durand.pdf" meta="En attente de votre contre-signature" />
      <p className="text-sm text-muted-foreground">En parallèle, j'ai déjà préparé :</p>
      <ul className="text-sm text-muted-foreground space-y-0.5 ml-1">
        <li>— Mail de collecte onboarding : <strong className="text-foreground">prêt à partir</strong> dès votre signature</li>
        <li>— DPAE : <strong className="text-foreground">pré-remplie</strong> (grâce au numéro de sécurité sociale déjà récupéré)</li>
      </ul>
      <Button size="sm" className="gap-1.5" onClick={onSign}>✍️ Je signe</Button>
    </>
  );
}

// SCÈNE 9 — Contre-signature + DPAE + collecte
function Scene9({ onSim }: { onSim: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
        <CheckCircle2 className="w-4 h-4" /> Contrat signé par les deux parties. Archivé dans Lucca (dossier Thomas Durand).
      </div>
      <p>J'enchaîne automatiquement :</p>
      <CheckCard items={[
        { ok: true, label: "DPAE transmise à l'URSSAF" },
        { ok: true, label: "Mail de collecte envoyé à Thomas — lien sécurisé pour déposer ses documents (RIB, pièce d'identité, justificatif de domicile, attestation sécu, photo, certificats de travail)" },
      ]} />
      <SimBtn label="Simuler : 3 jours plus tard" onClick={onSim} />
    </>
  );
}

// SCÈNE 10 — Suivi documents 4/6
function Scene10({ onSim }: { onSim: () => void }) {
  return (
    <>
      <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm">
        <Bell className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="font-medium text-blue-800 dark:text-blue-200">Point de suivi onboarding — Thomas Durand</p>
      </div>
      <CheckCard items={[
        { ok: true,  label: "RIB — format IBAN vérifié" },
        { ok: true,  label: "Pièce d'identité — reçue" },
        { ok: true,  label: "Attestation sécu — reçue" },
        { ok: true,  label: "Photo — reçue" },
        { ok: false, label: "Justificatif de domicile — manquant" },
        { ok: false, label: "Certificats de travail — manquants" },
      ]} />
      <p className="text-sm text-muted-foreground">J'ai relancé Thomas ce matin pour les pièces manquantes.</p>
      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-4 h-4 shrink-0" /> DPAE — accusé de réception URSSAF reçu. Pas d'action de votre part.
      </div>
      <SimBtn label="Simuler : Thomas complète son dossier" onClick={onSim} />
    </>
  );
}

// SCÈNE 11 — Dossier complet + Lucca + Silae
function Scene11({ onChoice }: { onChoice: (c: string) => void }) {
  return (
    <>
      <p>Thomas Durand a déposé les pièces restantes. <strong>Dossier complet.</strong></p>
      <CheckCard items={[
        { ok: true, label: "RIB — vérifié" },
        { ok: true, label: "Pièce d'identité" },
        { ok: true, label: "Justificatif de domicile" },
        { ok: true, label: "Attestation sécu" },
        { ok: true, label: "Photo" },
        { ok: true, label: "Certificats de travail" },
        { ok: true, label: "DPAE — accusé reçu" },
      ]} />
      <p>J'ai automatiquement :</p>
      <ul className="text-sm text-muted-foreground space-y-0.5 ml-1">
        <li>— Créé la <strong className="text-foreground">fiche salarié dans Lucca Poplee Socle RH</strong></li>
        <li>— Initialisé le <strong className="text-foreground">dossier paie dans Silae</strong></li>
        <li>— Archivé les documents dans le dossier salarié Lucca</li>
      </ul>
      <div className="border border-border/60 rounded-xl px-4 py-3 space-y-2">
        <p className="text-sm font-medium flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" /> Reste à planifier :
        </p>
        <ul className="text-sm text-muted-foreground space-y-0.5 ml-1">
          <li>— Visite médicale d'embauche</li>
          <li>— Affiliation mutuelle et prévoyance</li>
        </ul>
      </div>
      <div className="border border-border/60 rounded-xl px-4 py-3 space-y-1.5">
        <p className="text-sm font-medium">Rappels programmés :</p>
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 shrink-0" /> 28/12/2026 : fin de période d'essai — renouvellement ou confirmation</div>
          <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 shrink-0" /> 28/12/2026 : réévaluation classification 2.3 → 3.1</div>
        </div>
      </div>
      <p>Voulez-vous que j'envoie la demande de visite médicale au SPST ?</p>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" className="gap-1.5" onClick={() => onChoice("spst")}>
          <Stethoscope className="w-3.5 h-3.5" /> Oui, envoie au SPST
        </Button>
        <Button size="sm" variant="outline" onClick={() => onChoice("later")}>Plus tard</Button>
      </div>
    </>
  );
}

// SCÈNE DONE — fin de démo
function SceneDone({ onReset }: { onReset: () => void }) {
  return (
    <>
      <p>Demande de visite médicale envoyée au SPST (Efficience Santé au Travail). Je vous notifie quand le créneau est confirmé.</p>
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
        <CheckCircle2 className="w-4 h-4" /> L'onboarding administratif de Thomas Durand est terminé.
      </div>
      <div className="border-t border-border/40 pt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Fin de la démo</span>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={onReset}>
          <RotateCcw className="w-3.5 h-3.5" /> Recommencer
        </Button>
      </div>
    </>
  );
}

// ─── Bubbles ──────────────────────────────────────────────────────────────────

function QBubble({ text, ts }: { text: string; ts: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[65%]">
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
          {text}
        </div>
        <p className="text-[11px] text-muted-foreground text-right mt-1">{ts}</p>
      </div>
    </div>
  );
}

function KBubble({ scene, ts }: { scene: SceneId; ts: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">K</div>
      <div className="flex-1 min-w-0">
        <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-5 py-4 text-sm leading-relaxed space-y-3">
          <SceneContent scene={scene} />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 ml-1">Kalia · {ts}</p>
      </div>
    </div>
  );
}

function SysBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-center">
      <div className="bg-muted/60 border border-border/50 rounded-full px-4 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
        <Bell className="w-3 h-3" />{text}
      </div>
    </div>
  );
}

// ─── SceneContent — dispatches to correct renderer ────────────────────────────

function SceneContent({ scene }: { scene: SceneId }) {
  // These are read-only renders — interactions are wired in the main component
  // via `onChoice` callbacks stored in state
  return null; // placeholder — see KBubbleDynamic below
}

// ─── Ticket sidebar ───────────────────────────────────────────────────────────

function TicketCard({ t }: { t: DemoTicket }) {
  return (
    <div className="border border-border/60 rounded-xl px-3 py-2.5 bg-card space-y-1.5">
      <div className="flex items-center gap-2">
        {t.variant === "done"
          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          : t.variant === "progress"
          ? <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          : <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
        <span className="text-xs font-medium truncate">{t.title}</span>
      </div>
      <Badge variant="secondary" className="text-[10px] h-4">{t.status}</Badge>
      {t.details?.map((d, i) => (
        <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />{d}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DemoOnboardingPage() {
  const [msgs, setMsgs] = useState<DemoMsg[]>([]);
  const [scene, setScene] = useState<SceneId>("idle");
  const [tickets, setTickets] = useState<DemoTicket[]>([]);
  const [typing, setTyping] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  // Persist
  useEffect(() => {
    try {
      const m = localStorage.getItem(LS_MSGS);
      const s = localStorage.getItem(LS_SCENE);
      const t = localStorage.getItem(LS_TICKETS);
      if (m) setMsgs(JSON.parse(m));
      if (s) setScene(JSON.parse(s));
      if (t) setTickets(JSON.parse(t));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { if (msgs.length) localStorage.setItem(LS_MSGS, JSON.stringify(msgs)); }, [msgs]);
  useEffect(() => { localStorage.setItem(LS_SCENE, JSON.stringify(scene)); }, [scene]);
  useEffect(() => { if (tickets.length) localStorage.setItem(LS_TICKETS, JSON.stringify(tickets)); }, [tickets]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  const addMsg = (msg: Omit<DemoMsg, "id" | "ts">) => {
    setMsgs(prev => [...prev, { ...msg, id: uid(), ts: nowStr() }]);
  };

  const kaliaReply = (sceneId: SceneId, delay = 900) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setScene(sceneId);
      addMsg({ kind: "kalia", sceneId });
    }, delay);
  };

  const updateTicket = (id: string, patch: Partial<DemoTicket>) => {
    setTickets(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx === -1) return [...prev, { id, title: "", status: "", variant: "pending", ...patch }];
      const updated = [...prev];
      updated[idx] = { ...updated[idx], ...patch };
      return updated;
    });
  };

  // ─── Input handler ─────────────────────────────────────────────────────────

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    addMsg({ kind: "question", text });

    const lower = text.toLowerCase();
    const isOnboarding = (lower.includes("embauche") || lower.includes("onboarding")) && lower.includes("thomas");

    if (scene === "idle") {
      if (isOnboarding) {
        kaliaReply("1");
      } else {
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          addMsg({ kind: "kalia", sceneId: "idle" });
        }, 700);
      }
    }
  };

  // ─── Choice handlers ───────────────────────────────────────────────────────

  const choice1 = (c: string) => {
    if (c === "oui") {
      addMsg({ kind: "question", text: "Oui c'est lui." });
      kaliaReply("2");
    } else {
      addMsg({ kind: "question", text: "Non, cherche encore." });
      kaliaReply("1", 1200);
    }
  };

  const choice2 = (c: string) => {
    const labels: Record<string, string> = {
      A: "Option A — 3 650 €, Position 3.1.",
      B: "Va pour l'option 2. Position 2.3, coefficient 150 à 3 500 €. On reverra sa classification à la fin de la période d'essai.",
      C: "Option C — on maintient.",
    };
    addMsg({ kind: "question", text: labels[c] });
    kaliaReply("3");
  };

  const choice3 = (c: string) => {
    if (c === "demande") {
      addMsg({ kind: "question", text: "Demande-lui directement." });
    } else {
      addMsg({ kind: "question", text: "Je l'ai, le voici." });
    }
    kaliaReply("4");
  };

  const choice4 = (c: string) => {
    if (c === "envoie") {
      addMsg({ kind: "question", text: "Envoie." });
      kaliaReply("4sent");
      updateTicket("ticket-onboarding", {
        title: "Onboarding Thomas Durand",
        status: "Proposition envoyée",
        variant: "progress",
      });
      toast("Ticket créé : Onboarding Thomas Durand — Proposition envoyée");
    }
  };

  const simThomasAccepte = () => {
    addMsg({ kind: "system", text: "Kalia — Thomas Durand a accepté la proposition de poste" });
    kaliaReply("5");
  };

  const choice5 = (c: string) => {
    if (c === "genere") {
      addMsg({ kind: "question", text: "Génère le contrat." });
      setScene("5gen");
      addMsg({ kind: "kalia", sceneId: "5gen" });
      setTyping(false);
      // After 2s show scene 6
      setTimeout(() => {
        setScene("6");
        addMsg({ kind: "kalia", sceneId: "6" });
      }, 2200);
    }
  };

  const choice6 = (c: string) => {
    if (c === "sign") {
      addMsg({ kind: "question", text: "C'est bon, envoie." });
      kaliaReply("7");
      updateTicket("ticket-onboarding", { status: "Signature en cours", variant: "progress" });
      toast("Ticket mis à jour : Onboarding Thomas Durand — Signature en cours");
    }
  };

  const sim24h = () => {
    addMsg({ kind: "system", text: "Kalia — Suivi signature · Thomas Durand n'a pas encore signé (envoyé hier 14h12). Relance automatique prévue demain 9h." });
    kaliaReply("8");
  };

  const simThomasAsigne = () => {
    addMsg({ kind: "system", text: "Kalia — Thomas Durand vient de signer son contrat" });
    kaliaReply("8b");
  };

  const handleSign = () => {
    addMsg({ kind: "question", text: "Je signe." });
    kaliaReply("9");
    updateTicket("ticket-onboarding", { status: "Collecte documents en cours (0/6)", variant: "progress" });
    updateTicket("ticket-dpae", {
      title: "DPAE Thomas Durand",
      status: "Transmise à l'URSSAF",
      variant: "progress",
    });
    toast("Ticket mis à jour : Collecte documents en cours (0/6)");
  };

  const sim3jours = () => {
    addMsg({ kind: "system", text: "Kalia — Suivi onboarding Thomas Durand · Documents reçus : 4/6" });
    kaliaReply("10");
    updateTicket("ticket-onboarding", { status: "Collecte documents (4/6)" });
    updateTicket("ticket-dpae", { status: "Accusé URSSAF reçu", variant: "done" });
    toast("DPAE Thomas Durand — Accusé URSSAF reçu");
  };

  const simDossierComplet = () => {
    kaliaReply("11");
    updateTicket("ticket-onboarding", { status: "Dossier complet", variant: "done" });
  };

  const choice11 = (c: string) => {
    if (c === "spst") {
      addMsg({ kind: "question", text: "Oui, envoie." });
      kaliaReply("done");
      updateTicket("ticket-onboarding", {
        status: "Complet",
        variant: "done",
        details: ["Lucca", "Silae", "DPAE", "Visite médicale demandée"],
      });
      toast("Onboarding Thomas Durand — Complet");
    } else {
      addMsg({ kind: "question", text: "Plus tard." });
      kaliaReply("done");
    }
  };

  const handleReset = () => {
    setMsgs([]);
    setScene("idle");
    setTickets([]);
    localStorage.removeItem(LS_MSGS);
    localStorage.removeItem(LS_SCENE);
    localStorage.removeItem(LS_TICKETS);
  };

  // ─── Render scene inside bubble ────────────────────────────────────────────

  const renderScene = (sceneId: SceneId) => {
    switch (sceneId) {
      case "idle":
        return <p>Je suis prêt à vous aider. Pour lancer la démo onboarding, mentionnez l'embauche de Thomas dans votre message.</p>;
      case "1":  return <Scene1 onChoice={choice1} />;
      case "2":  return <Scene2 onChoice={choice2} />;
      case "3":  return <Scene3 onChoice={choice3} />;
      case "4":  return <Scene4 onChoice={choice4} />;
      case "4sent": return <Scene4Sent onSim={simThomasAccepte} />;
      case "5":  return <Scene5 onChoice={choice5} />;
      case "5gen": return <Scene5Gen />;
      case "6":  return <Scene6 onChoice={choice6} />;
      case "7":  return <Scene7 onSim={sim24h} />;
      case "8":  return <Scene8 onSim={simThomasAsigne} />;
      case "8b": return <Scene8b onSign={handleSign} />;
      case "9":  return <Scene9 onSim={sim3jours} />;
      case "10": return <Scene10 onSim={simDossierComplet} />;
      case "11": return <Scene11 onChoice={choice11} />;
      case "done": return <SceneDone onReset={handleReset} />;
      default: return null;
    }
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">

      {/* ── Main chat area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-3 shrink-0">
          <div>
            <h1 className="text-sm font-semibold">Démo Kalia — Onboarding Thomas Durand</h1>
            <p className="text-xs text-muted-foreground">Scénario interactif</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">DÉMO</Badge>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSidebar(v => !v)}>
              {sidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-6 px-6 py-8 max-w-3xl mx-auto">

            {/* Intro prompt */}
            {msgs.length === 0 && (
              <div className="text-center space-y-3 py-12">
                <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-lg mx-auto">K</div>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Tapez le message suivant pour démarrer la démo :
                </p>
                <button
                  className="text-sm text-foreground font-medium bg-muted/60 border border-border rounded-xl px-4 py-2.5 hover:bg-muted transition-colors mx-auto block"
                  onClick={() => handleSend("Kalia, on embauche Thomas Durand. CDI cadre Syntec, position 3.1, coefficient 170, salaire brut 3 500 €. Entrée le 1er septembre. Son CV doit être dans mes mails.")}
                >
                  "Kalia, on embauche Thomas Durand. CDI cadre Syntec, position 3.1,<br />coefficient 170, salaire brut 3 500 €. Entrée le 1er septembre."
                </button>
              </div>
            )}

            {msgs.map(msg => {
              if (msg.kind === "question") {
                return <QBubble key={msg.id} text={msg.text ?? ""} ts={msg.ts} />;
              }
              if (msg.kind === "system") {
                return <SysBubble key={msg.id} text={msg.text ?? ""} />;
              }
              // kalia
              return (
                <div key={msg.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">K</div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-5 py-4 text-sm leading-relaxed space-y-3">
                      {renderScene(msg.sceneId ?? "idle")}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 ml-1">Kalia · {msg.ts}</p>
                  </div>
                </div>
              );
            })}

            {typing && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">K</div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-5 py-4">
                  <TypingIndicator />
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>
        </ScrollArea>

        {/* Chat input */}
        <div className="border-t border-border/50 px-6 py-4 shrink-0">
          <ChatInput onSend={handleSend} placeholder="Posez une question à Kalia…" />
        </div>
      </div>

      {/* ── Ticket sidebar ── */}
      {sidebar && (
        <div className="w-72 border-l border-border/50 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-border/50 shrink-0">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tickets</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {tickets.length === 0
                ? <p className="text-xs text-muted-foreground text-center py-8">Aucun ticket pour l'instant</p>
                : tickets.map(t => <TicketCard key={t.id} t={t} />)
              }
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
