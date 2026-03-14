"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatInput } from "@/components/conversation/chat-input";
import { TypingIndicator } from "@/components/conversation/messages/typing-indicator";
import { Eye, EyeOff, FileText, CheckCircle2, Clock, AlertTriangle, RotateCcw, Bell, FastForward, Stethoscope, Zap, Building2, Ticket } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type SceneId = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "7b" | "8" | "9" | "9b";

interface DemoMsg {
  id: string;
  ts: string;
  kind: "question" | "kalia" | "system";
  text?: string;
  scene?: SceneId;
}

interface DemoTicket {
  id: string;
  title: string;
  statusLabel: string;
  variant: "pending" | "progress" | "done";
  details?: string[];
}

const uid = () => Math.random().toString(36).slice(2, 9);
const nowStr = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const LS_MSGS    = "kalia_demo_v2_msgs";
const LS_SCENE   = "kalia_demo_v2_scene";
const LS_TICKETS = "kalia_demo_v2_tickets";

// ─── Shared card primitives ───────────────────────────────────────────────────

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

function CheckListCard({ items }: { items: { label: string; ok: boolean }[] }) {
  return (
    <div className="border border-border rounded-xl px-4 py-3 space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 text-sm">
          {item.ok
            ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            : <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
          <span className={item.ok ? "" : "text-muted-foreground"}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function SourceBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 rounded-full px-2.5 py-0.5 font-medium">
      <FileText className="w-3 h-3" />{label}
    </span>
  );
}

function OptionCard({ label, sub, warn, onClick }: { label: string; sub?: string; warn?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left border rounded-xl px-4 py-3 text-sm transition-all hover:shadow-sm active:scale-[0.99]",
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
    const t = setInterval(() => setPct(p => p >= 100 ? 100 : p + 6), 100);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Génération en cours…</span><span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-violet-500 transition-all duration-100 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Scene content ────────────────────────────────────────────────────────────

function S1({ onChoice }: { onChoice: (c: string) => void }) {
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

function S2({ onChoice }: { onChoice: (c: string) => void }) {
  return (
    <>
      <p>Avant de générer le contrat, je détecte une incohérence avec la grille Syntec en vigueur.</p>
      <p>Pour la position 3.1, coefficient 170, le salaire minimum conventionnel est de <strong>3 650 € brut mensuel</strong>. Le salaire demandé de 3 500 € est en dessous de ce plancher.</p>
      <SourceBadge label="Grille Syntec — mise à jour janvier 2026" />
      <div className="space-y-2">
        <OptionCard
          label="Option A — Ajuster le salaire au minimum"
          sub="3 650 € — Position 3.1, Coefficient 170"
          onClick={() => onChoice("A")}
        />
        <OptionCard
          label="Option B — Ajuster la classification"
          sub="Position 2.3, Coefficient 150 — salaire 3 500 € conforme (plancher 3 275 €)"
          onClick={() => onChoice("B")}
        />
        <OptionCard
          label="⚠️ Option C — Maintenir 3 500 € en position 3.1"
          sub="Non-conformité conventionnelle — risque en cas de contrôle"
          warn
          onClick={() => onChoice("C")}
        />
      </div>
      <div className="bg-muted/40 border border-border/50 rounded-xl px-4 py-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Cohérence interne :</span> 3 cadres en position 2.3, salaire moyen 3 420 €. Un salaire de 3 500 € en 2.3 serait cohérent.{" "}
        <span className="opacity-60">Source : Lucca Poplee Socle RH</span>
      </div>
    </>
  );
}

function S3() {
  return (
    <>
      <p>C'est noté. Je génère le contrat :</p>
      <ul className="text-sm text-muted-foreground space-y-0.5 ml-1">
        <li>— Thomas Durand — CDI cadre</li>
        <li>— CCN Syntec — Position 2.3 — Coefficient 150</li>
        <li>— Salaire brut mensuel : 3 500 €</li>
        <li>— Date d'entrée : 1er septembre 2026</li>
      </ul>
      <ProgressBar />
    </>
  );
}

function S4({ onChoice }: { onChoice: (c: string) => void }) {
  const today = new Date().toLocaleDateString("fr-FR");
  return (
    <>
      <p>Le contrat est prêt.</p>
      <FileCard name="Contrat CDI — Thomas Durand — Syntec 2.3.pdf" meta={`Généré le ${today}`} />
      <CheckListCard items={[
        { label: "Période d'essai : 4 mois renouvelable — conforme cadre Syntec", ok: true },
        { label: "Clause de non-concurrence : conforme template entreprise", ok: true },
        { label: "Lieu de travail : Paris, 15 rue des Lilas", ok: true },
        { label: "Mentions obligatoires : toutes présentes", ok: true },
        { label: "Salaire vs grille Syntec 2.3 : conforme (plancher 3 275 €)", ok: true },
        { label: "Cohérence interne : dans la fourchette position 2.3", ok: true },
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

function S5({ onSim }: { onSim: () => void }) {
  return (
    <>
      <p>Signature électronique lancée via Yousign.</p>
      <p>Circuit de signature :</p>
      <div className="space-y-2">
        <div className="flex items-center gap-3 text-sm">
          <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
          Thomas Durand — mail envoyé à <span className="text-muted-foreground">t.durand@gmail.com</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="w-6 h-6 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
          Vous — après la signature du candidat
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Si Thomas n'a pas signé sous 48h, je le relance automatiquement. Je vous alerte au bout de 5 jours sans réponse.</p>
      <SimBtn label="Simuler : 24h plus tard" onClick={onSim} />
    </>
  );
}

function S6({ onSim }: { onSim: () => void }) {
  return (
    <>
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm">
        <Bell className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-200">Point de suivi — Thomas Durand</p>
          <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">Thomas Durand n'a pas encore signé son contrat. Pas d'action requise. Relance automatique prévue demain matin.</p>
        </div>
      </div>
      <SimBtn label="Simuler : Thomas a signé" onClick={onSim} />
    </>
  );
}

function S7({ onSign }: { onSign: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
        <CheckCircle2 className="w-4 h-4" /> Thomas Durand a signé son contrat à l'instant.
      </div>
      <p>C'est à votre tour. Le contrat signé est dans votre boîte mail connectée.</p>
      <FileCard name="Contrat signé — Thomas Durand.pdf" meta="En attente de votre contre-signature" />
      <p className="text-sm text-muted-foreground">En parallèle, j'ai déjà préparé :</p>
      <ul className="text-sm text-muted-foreground space-y-0.5 ml-1">
        <li>— Mail de collecte onboarding : prêt à partir dès votre signature</li>
        <li>— DPAE : pré-remplie</li>
      </ul>
      <Button size="sm" className="gap-1.5" onClick={onSign}>✍️ Je signe</Button>
    </>
  );
}

function S7b() {
  return (
    <>
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
        <CheckCircle2 className="w-4 h-4" /> Contrat signé par les deux parties. Archivé dans Lucca (dossier Thomas Durand).
      </div>
      <p>J'enchaîne automatiquement :</p>
      <CheckListCard items={[
        { label: "DPAE transmise à l'URSSAF", ok: true },
        { label: "Mail de collecte envoyé à Thomas — lien sécurisé pour déposer ses documents (RIB, pièce d'identité, justificatif de domicile, attestation sécu, photo, certificats de travail)", ok: true },
      ]} />
    </>
  );
}

function S8({ onSim }: { onSim: () => void }) {
  return (
    <>
      <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm">
        <Bell className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="font-medium text-blue-800 dark:text-blue-200">Point de suivi onboarding — Thomas Durand</p>
      </div>
      <CheckListCard items={[
        { label: "RIB — format IBAN vérifié", ok: true },
        { label: "Pièce d'identité — reçue", ok: true },
        { label: "Attestation sécu — reçue", ok: true },
        { label: "Photo — reçue", ok: true },
        { label: "Justificatif de domicile — manquant", ok: false },
        { label: "Certificats de travail — manquants", ok: false },
      ]} />
      <p className="text-sm text-muted-foreground">J'ai relancé Thomas ce matin pour les pièces manquantes.</p>
      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-4 h-4" /> DPAE — accusé de réception URSSAF reçu. Pas d'action de votre part.
      </div>
      <SimBtn label="Simuler : Thomas complète son dossier" onClick={onSim} />
    </>
  );
}

function S9({ onChoice }: { onChoice: (c: string) => void }) {
  return (
    <>
      <p>Thomas Durand a déposé les pièces restantes. <strong>Dossier complet.</strong></p>
      <CheckListCard items={[
        { label: "RIB — vérifié", ok: true },
        { label: "Pièce d'identité", ok: true },
        { label: "Justificatif de domicile", ok: true },
        { label: "Attestation sécu", ok: true },
        { label: "Photo", ok: true },
        { label: "Certificats de travail", ok: true },
        { label: "DPAE — accusé reçu", ok: true },
      ]} />
      <p>J'ai automatiquement :</p>
      <ul className="text-sm text-muted-foreground space-y-0.5 ml-1">
        <li>— Créé la fiche salarié dans <strong className="text-foreground">Lucca Poplee Socle RH</strong></li>
        <li>— Initialisé le dossier paie dans <strong className="text-foreground">Silae</strong></li>
        <li>— Archivé les documents dans le dossier salarié Lucca</li>
      </ul>
      <div className="border border-border/60 rounded-xl px-4 py-3 space-y-2">
        <p className="text-sm font-medium flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500" /> Reste à planifier :</p>
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
        <Button size="sm" className="gap-1.5" onClick={() => onChoice("oui")}>
          <Stethoscope className="w-3.5 h-3.5" /> Oui, envoie au SPST
        </Button>
        <Button size="sm" variant="outline" onClick={() => onChoice("later")}>⏭️ Plus tard</Button>
      </div>
    </>
  );
}

function S9b({ onReset }: { onReset: () => void }) {
  return (
    <>
      <p>Demande de visite médicale envoyée au SPST (Efficience Santé au Travail). Je vous notifie quand le créneau est confirmé.</p>
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
        <CheckCircle2 className="w-4 h-4" /> L'onboarding administratif de Thomas Durand est terminé.
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-2">
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

function KBubble({ children, ts }: { children: React.ReactNode; ts: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">K</div>
      <div className="flex-1 min-w-0">
        <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-5 py-4 text-sm leading-relaxed space-y-3">
          {children}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 ml-1">Kalia · {ts}</p>
      </div>
    </div>
  );
}

function SysBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-center">
      <div className="bg-muted/50 border border-border/50 rounded-full px-4 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
        <Bell className="w-3 h-3" />{text}
      </div>
    </div>
  );
}

// ─── Ticket item ──────────────────────────────────────────────────────────────

function TicketItem({ ticket }: { ticket: DemoTicket }) {
  return (
    <div className="border border-border/60 rounded-xl px-3 py-2.5 space-y-1.5 bg-card">
      <div className="flex items-center gap-2">
        {ticket.variant === "done"
          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          : ticket.variant === "progress"
          ? <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          : <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
        <span className="text-xs font-medium truncate">{ticket.title}</span>
      </div>
      <Badge variant="secondary" className="text-[10px] h-4">{ticket.statusLabel}</Badge>
      {ticket.details && (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          {ticket.details.map((d, i) => <span key={i} className="text-[10px] text-muted-foreground">{d}</span>)}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DemoOnboardingPage() {
  const [msgs, setMsgs] = useState<DemoMsg[]>([]);
  const [activeScene, setActiveScene] = useState<SceneId | null>(null);
  const [tickets, setTickets] = useState<DemoTicket[]>([]);
  const [typing, setTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  // Restore from localStorage
  useEffect(() => {
    try {
      const m = localStorage.getItem(LS_MSGS);
      const s = localStorage.getItem(LS_SCENE);
      const t = localStorage.getItem(LS_TICKETS);
      if (m) setMsgs(JSON.parse(m));
      if (s) setActiveScene(JSON.parse(s));
      if (t) setTickets(JSON.parse(t));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (msgs.length) localStorage.setItem(LS_MSGS, JSON.stringify(msgs));
  }, [msgs]);

  useEffect(() => {
    if (activeScene) localStorage.setItem(LS_SCENE, JSON.stringify(activeScene));
  }, [activeScene]);

  useEffect(() => {
    localStorage.setItem(LS_TICKETS, JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const addMsg = useCallback((msg: DemoMsg) => setMsgs(p => [...p, msg]), []);

  const upsertTicket = useCallback((ticket: DemoTicket) => {
    setTickets(p => {
      const idx = p.findIndex(t => t.id === ticket.id);
      if (idx >= 0) { const n = [...p]; n[idx] = ticket; return n; }
      return [...p, ticket];
    });
  }, []);

  const kaliaScene = useCallback((scene: SceneId, delay = 1600) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setActiveScene(scene);
      addMsg({ id: uid(), ts: nowStr(), kind: "kalia", scene });
    }, delay);
  }, [addMsg]);

  const drh = useCallback((text: string) => {
    addMsg({ id: uid(), ts: nowStr(), kind: "question", text });
  }, [addMsg]);

  const handleChoice = useCallback((choice: string, currentScene: SceneId | null) => {
    if (currentScene === "1") {
      if (choice === "oui") {
        drh("Oui c'est lui.");
        kaliaScene("2");
      } else {
        drh("Non, cherche encore.");
      }
    } else if (currentScene === "2") {
      const labels: Record<string, string> = {
        A: "On ajuste le salaire à 3 650 €.",
        B: "Va pour l'option 2. Position 2.3, coefficient 150 à 3 500 €. On reverra sa classification à la fin de la période d'essai.",
        C: "On maintient 3 500 € en position 3.1.",
      };
      drh(labels[choice] || choice);
      kaliaScene("3", 800);
      // Scene 4 follows scene 3 after progress bar (~2.5s)
      setTimeout(() => kaliaScene("4", 2600), 900);
    } else if (currentScene === "4") {
      if (choice === "sign") {
        drh("C'est bon, envoie.");
        upsertTicket({ id: "onboarding-thomas", title: "Onboarding Thomas Durand", statusLabel: "Signature en cours", variant: "pending" });
        kaliaScene("5");
      } else {
        drh("Je vais modifier le contrat.");
      }
    } else if (currentScene === "5" && choice === "sim_24h") {
      addMsg({ id: uid(), ts: nowStr(), kind: "system", text: "24h plus tard" });
      toast("Kalia — Suivi signature", {
        description: "Thomas Durand n'a pas encore signé (envoyé hier 14h12). Relance automatique prévue demain 9h.",
        duration: 7000,
      });
      kaliaScene("6", 600);
    } else if (currentScene === "6" && choice === "sim_signed") {
      addMsg({ id: uid(), ts: nowStr(), kind: "system", text: "Thomas Durand a signé" });
      kaliaScene("7", 600);
    } else if (currentScene === "7" && choice === "sign") {
      drh("Je signe.");
      // 7b + then 8 with a delay
      kaliaScene("7b", 1200);
      upsertTicket({ id: "onboarding-thomas", title: "Onboarding Thomas Durand", statusLabel: "Collecte documents (0/6)", variant: "progress" });
      setTimeout(() => kaliaScene("8", 2000), 2800);
    } else if (currentScene === "8" && choice === "sim_docs") {
      addMsg({ id: uid(), ts: nowStr(), kind: "system", text: "3 jours plus tard" });
      toast("Kalia — Suivi onboarding Thomas Durand", {
        description: "Documents reçus : 4/6",
        duration: 6000,
      });
      upsertTicket({ id: "onboarding-thomas", title: "Onboarding Thomas Durand", statusLabel: "Collecte documents (4/6)", variant: "progress" });
      upsertTicket({ id: "dpae-thomas", title: "DPAE Thomas Durand", statusLabel: "Accusé URSSAF reçu", variant: "done" });
      kaliaScene("9", 600);
    } else if (currentScene === "9") {
      if (choice === "oui") {
        drh("Oui, envoie.");
        upsertTicket({ id: "onboarding-thomas", title: "Onboarding Thomas Durand", statusLabel: "Complet", variant: "done", details: ["Lucca ✅", "Silae ✅", "DPAE ✅", "Visite médicale demandée"] });
        kaliaScene("9b");
      } else {
        drh("Plus tard.");
        upsertTicket({ id: "onboarding-thomas", title: "Onboarding Thomas Durand", statusLabel: "Complet", variant: "done", details: ["Lucca ✅", "Silae ✅", "DPAE ✅"] });
        kaliaScene("9b");
      }
    }
  }, [addMsg, drh, kaliaScene, upsertTicket]);

  const handleSend = useCallback((text: string) => {
    const lower = text.toLowerCase();
    if (activeScene === null) {
      addMsg({ id: uid(), ts: nowStr(), kind: "question", text });
      if (lower.includes("embauche") && lower.includes("thomas")) {
        kaliaScene("1");
      } else {
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          addMsg({ id: uid(), ts: nowStr(), kind: "kalia", scene: "1" });
          // override: show generic message, not scene 1
          // We'll handle this with a special scene marker
        }, 1200);
        // Actually just show hint
        setTimeout(() => {
          setTyping(false);
          addMsg({
            id: uid(), ts: nowStr(), kind: "system",
            text: "Pour lancer la démo, mentionnez l'embauche de Thomas dans votre message.",
          });
        }, 1200);
      }
    }
  }, [activeScene, addMsg, kaliaScene]);

  const handleReset = () => {
    localStorage.removeItem(LS_MSGS);
    localStorage.removeItem(LS_SCENE);
    localStorage.removeItem(LS_TICKETS);
    setMsgs([]);
    setActiveScene(null);
    setTickets([]);
    setTyping(false);
  };

  const renderScene = (scene: SceneId) => {
    if (scene === "1") return <S1 onChoice={(c) => handleChoice(c, "1")} />;
    if (scene === "2") return <S2 onChoice={(c) => handleChoice(c, "2")} />;
    if (scene === "3") return <S3 />;
    if (scene === "4") return <S4 onChoice={(c) => handleChoice(c, "4")} />;
    if (scene === "5") return <S5 onSim={() => handleChoice("sim_24h", "5")} />;
    if (scene === "6") return <S6 onSim={() => handleChoice("sim_signed", "6")} />;
    if (scene === "7") return <S7 onSign={() => handleChoice("sign", "7")} />;
    if (scene === "7b") return <S7b />;
    if (scene === "8") return <S8 onSim={() => handleChoice("sim_docs", "8")} />;
    if (scene === "9") return <S9 onChoice={(c) => handleChoice(c, "9")} />;
    if (scene === "9b") return <S9b onReset={handleReset} />;
    return null;
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main */}
      <main className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="border-b bg-background px-8 py-6 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Onboarding administratif — Thomas Durand</h1>
              <p className="text-sm text-muted-foreground">Intégration administrative d'un nouveau salarié · Démo interactive</p>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => setShowSidebar(s => !s)} className="gap-2">
                      {showSidebar ? <><EyeOff className="w-4 h-4" />Masquer le contexte</> : <><Eye className="w-4 h-4" />Afficher le contexte</>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{showSidebar ? "Masquer" : "Afficher"} les tickets</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset}>
                <RotateCcw className="w-3.5 h-3.5" /> Recommencer
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full w-full">
              <div className="max-w-4xl mx-auto px-12 py-8 space-y-8">

                {msgs.length === 0 && !typing && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-violet-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold">Démo onboarding — Thomas Durand</p>
                      <p className="text-sm text-muted-foreground max-w-sm">Envoyez le message pré-rempli ci-dessous pour démarrer le scénario.</p>
                    </div>
                  </div>
                )}

                {msgs.map((msg) => {
                  if (msg.kind === "question") return <QBubble key={msg.id} text={msg.text!} ts={msg.ts} />;
                  if (msg.kind === "system")   return <SysBubble key={msg.id} text={msg.text!} />;
                  if (msg.kind === "kalia" && msg.scene) {
                    // For scene 8: only show once (last one wins when there are multiple 8s)
                    return (
                      <KBubble key={msg.id} ts={msg.ts}>
                        {renderScene(msg.scene)}
                      </KBubble>
                    );
                  }
                  return null;
                })}

                {typing && <TypingIndicator />}
                <div ref={endRef} />
              </div>
            </ScrollArea>
          </div>

          <div className="shrink-0">
            <ChatInput
              onSend={handleSend}
              placeholder={activeScene
                ? "Kalia répond aux étapes scriptées — ou posez une question libre…"
                : "Kalia, on embauche Thomas Durand. CDI cadre Syntec, position 3.1, coefficient 170, salaire brut 3 500 €. Entrée le 1er septembre. Son CV doit être dans mes mails."}
              disabled={typing || activeScene !== null}
              showDisclaimer
            />
          </div>
        </div>
      </main>

      {/* Ticket sidebar */}
      {showSidebar && (
        <aside className="w-72 border-l bg-muted/20 flex flex-col shrink-0 overflow-hidden">
          <div className="px-4 py-4 border-b">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Ticket className="w-4 h-4" /> Tickets & suivi
            </h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="px-3 py-4 space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide px-1">Conversations</p>
              <div className="border border-primary/30 bg-primary/5 rounded-xl px-3 py-2.5">
                <p className="text-xs font-medium text-primary">Onboarding — Thomas Durand</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">En cours</p>
              </div>
              <div className="border border-border/30 rounded-xl px-3 py-2.5 opacity-40">
                <p className="text-xs font-medium">Julie Martin</p>
                <p className="text-[10px] text-muted-foreground">Contrat CDD — en attente</p>
              </div>
              <div className="border border-border/30 rounded-xl px-3 py-2.5 opacity-40">
                <p className="text-xs font-medium">Karim Benali</p>
                <p className="text-[10px] text-muted-foreground">Avenant télétravail</p>
              </div>

              {tickets.length > 0 && (
                <>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide px-1 mt-4">Tickets</p>
                  {tickets.map(t => <TicketItem key={t.id} ticket={t} />)}
                </>
              )}
            </div>
          </ScrollArea>
        </aside>
      )}
    </div>
  );
}
