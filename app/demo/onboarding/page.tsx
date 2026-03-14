"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Send, FileText, CheckCircle2, Clock, AlertTriangle, ChevronRight,
  RotateCcw, FastForward, MessageSquare, Ticket, Zap, X, Bot,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "kalia" | "drh";
type MessageType = "text" | "file" | "checklist" | "options" | "progress" | "system" | "option-cards";

interface ChecklistItem {
  status: "ok" | "warning" | "error" | "pending";
  label: string;
}

interface OptionCard {
  id: string;
  label: string;
  sublabel?: string;
  warning?: boolean;
}

interface ChatMessage {
  id: string;
  role: Role;
  type: MessageType;
  text?: string;
  file?: { name: string; meta: string };
  checklist?: ChecklistItem[];
  options?: { id: string; label: string; isSkip?: boolean }[];
  optionCards?: OptionCard[];
  infoBlock?: string;
  progress?: boolean;
  timestamp: string;
}

interface SidebarTicket {
  id: string;
  title: string;
  statusLabel: string;
  icon: "pending" | "ok" | "warning";
  details?: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowTime() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function uid() {
  return Math.random().toString(36).slice(2);
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const LS_SCENE   = "kalia_demo_scene";
const LS_MSGS    = "kalia_demo_messages";
const LS_TICKETS = "kalia_demo_tickets";

// ─── Sub-components ───────────────────────────────────────────────────────────

function KaliaAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-500 text-white text-xs font-bold shadow-sm select-none">
      K
    </div>
  );
}

function DrhAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-semibold select-none">
      MR
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <KaliaAvatar />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-card border border-border px-4 py-3 shadow-sm">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
          />
        ))}
      </div>
    </div>
  );
}

function FileCard({ file }: { file: { name: string; meta: string } }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 mt-1 max-w-xs">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <FileText size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{file.meta}</p>
      </div>
      <button className="shrink-0 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors">
        Voir
      </button>
    </div>
  );
}

function ChecklistCard({ items }: { items: ChecklistItem[] }) {
  const icons: Record<ChecklistItem["status"], React.ReactNode> = {
    ok:      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />,
    warning: <AlertTriangle size={14} className="text-amber-500 shrink-0" />,
    error:   <AlertTriangle size={14} className="text-destructive shrink-0" />,
    pending: <Clock size={14} className="text-muted-foreground shrink-0" />,
  };
  return (
    <div className="mt-1 rounded-xl border border-border bg-background divide-y divide-border overflow-hidden max-w-sm">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5">
          {icons[item.status]}
          <span className={cn("text-sm", item.status === "error" || item.status === "pending" ? "text-muted-foreground" : "text-foreground")}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ done }: { done: boolean }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (done) return;
    const interval = setInterval(() => setPct(p => Math.min(p + 4, 95)), 80);
    return () => clearInterval(interval);
  }, [done]);
  return (
    <div className="mt-2 max-w-xs">
      <p className="text-xs text-muted-foreground mb-1.5">Génération en cours…</p>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function OptionCardsBlock({
  cards,
  onSelect,
}: {
  cards: OptionCard[];
  onSelect: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="mt-2 flex flex-col gap-2 max-w-sm">
      {cards.map(card => (
        <button
          key={card.id}
          disabled={selected !== null}
          onClick={() => { setSelected(card.id); onSelect(card.id); }}
          className={cn(
            "text-left rounded-xl border px-4 py-3 transition-all",
            selected === card.id
              ? "border-primary bg-primary/10"
              : card.warning
              ? "border-amber-400/50 bg-amber-50 dark:bg-amber-900/10 hover:border-amber-400"
              : "border-border bg-background hover:border-primary hover:bg-primary/5",
          )}
        >
          {card.warning && (
            <span className="mb-1 flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <AlertTriangle size={11} /> Risque de non-conformité
            </span>
          )}
          <p className="text-sm font-semibold text-foreground">{card.label}</p>
          {card.sublabel && <p className="mt-0.5 text-xs text-muted-foreground">{card.sublabel}</p>}
        </button>
      ))}
    </div>
  );
}

function SourceBadge({ text }: { text: string }) {
  return (
    <span className="mt-2 inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
      <FileText size={10} /> {text}
    </span>
  );
}

function InfoBlock({ text }: { text: string }) {
  return (
    <div className="mt-2 max-w-sm rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground leading-relaxed">
      {text}
    </div>
  );
}

function SystemMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
        <Clock size={11} /> {text}
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastData { id: string; title: string; body: string }

function Toast({ toast, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className="animate-in slide-in-from-top-2 fade-in flex w-80 flex-col gap-1.5 rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <KaliaAvatar />
          <span className="text-sm font-semibold text-foreground">{toast.title}</span>
        </div>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={14} />
        </button>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed pl-10">{toast.body}</p>
      <div className="pl-10">
        <button onClick={onDismiss} className="text-xs font-medium text-primary hover:underline">Vu</button>
      </div>
    </div>
  );
}

// ─── Scenario ─────────────────────────────────────────────────────────────────

type SceneStep = {
  messages: Omit<ChatMessage, "id" | "timestamp">[];
  drhText?: string; // DRH bubble that appears when user clicks an option
  ticketUpdate?: Partial<SidebarTicket> & { isNew?: boolean };
};

const TODAY = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

const SCENES: SceneStep[] = [
  // Scene 1 — CV retrieval (triggered by "embauche" + "thomas")
  {
    messages: [
      {
        role: "kalia", type: "text",
        text: "J'ai trouvé un mail de Thomas Durand reçu le 12 juin avec un CV en pièce jointe.",
      },
      {
        role: "kalia", type: "file",
        file: { name: "thomas_durand_cv_2026.pdf", meta: "Reçu le 12/06/2026 — t.durand@gmail.com" },
      },
      {
        role: "kalia", type: "options",
        text: "C'est bien celui-ci ?",
        options: [
          { id: "yes", label: "Oui c'est lui" },
          { id: "no",  label: "Non, cherche encore" },
        ],
      },
    ],
    drhText: "Oui c'est lui.",
  },
  // Scene 2 — Salary inconsistency
  {
    messages: [
      {
        role: "kalia", type: "text",
        text: "Avant de générer le contrat, je détecte une **incohérence avec la grille Syntec en vigueur**.\n\nPour la position 3.1, coefficient 170, le **salaire minimum conventionnel est de 3 650 € brut mensuel**. Le salaire demandé de 3 500 € est en dessous de ce plancher.",
      },
      {
        role: "kalia", type: "option-cards",
        optionCards: [
          { id: "A", label: "Ajuster le salaire au minimum", sublabel: "3 650 € — Position 3.1, Coefficient 170" },
          { id: "B", label: "Ajuster la classification", sublabel: "Position 2.3, Coefficient 150 — salaire 3 500 € conforme (plancher 3 275 €)" },
          { id: "C", label: "Maintenir 3 500 € en position 3.1", sublabel: "Non-conformité conventionnelle — risque en cas de contrôle", warning: true },
        ],
        infoBlock: "Cohérence interne : 3 cadres en position 2.3, salaire moyen 3 420 €. Un salaire de 3 500 € en 2.3 serait cohérent.\nSource : Lucca Poplee Socle RH",
      },
    ],
    drhText: "Va pour l'option 2. Position 2.3, coefficient 150 à 3 500 €. On reverra sa classification à la fin de la période d'essai.",
  },
  // Scene 3 — Contract generation
  {
    messages: [
      {
        role: "kalia", type: "text",
        text: "C'est noté. Je génère le contrat :\n\n— Thomas Durand — CDI cadre\n— CCN Syntec — Position 2.3 — Coefficient 150\n— Salaire brut mensuel : 3 500 €\n— Date d'entrée : 1er septembre 2026",
      },
      { role: "kalia", type: "progress" },
    ],
    drhText: undefined,
  },
  // Scene 4 — Contract review
  {
    messages: [
      { role: "kalia", type: "text", text: "Le contrat est prêt." },
      {
        role: "kalia", type: "file",
        file: { name: "Contrat CDI — Thomas Durand — Syntec 2.3.pdf", meta: `Généré le ${TODAY}` },
      },
      {
        role: "kalia", type: "checklist",
        checklist: [
          { status: "ok", label: "Période d'essai : 4 mois renouvelable — conforme cadre Syntec" },
          { status: "ok", label: "Clause de non-concurrence : conforme template entreprise" },
          { status: "ok", label: "Lieu de travail : Paris, 15 rue des Lilas" },
          { status: "ok", label: "Mentions obligatoires : toutes présentes" },
          { status: "ok", label: "Salaire vs grille Syntec 2.3 : conforme (plancher 3 275 €)" },
          { status: "ok", label: "Cohérence interne : dans la fourchette position 2.3" },
        ],
      },
      {
        role: "kalia", type: "options",
        text: "J'ai programmé un rappel pour réévaluer la classification de Thomas à la fin de sa période d'essai (31 décembre 2026).\n\nSouhaitez-vous modifier quelque chose ou lancer la signature ?",
        options: [
          { id: "sign",   label: "Lancer la signature" },
          { id: "modify", label: "Modifier le contrat" },
        ],
      },
    ],
    drhText: "C'est bon, envoie.",
    ticketUpdate: {
      id: "onboarding-thomas", title: "Onboarding Thomas Durand",
      statusLabel: "Signature en cours", icon: "pending", isNew: true,
    },
  },
  // Scene 5 — E-signature launched
  {
    messages: [
      {
        role: "kalia", type: "text",
        text: "Signature électronique lancée via Yousign.\n\nCircuit de signature :\n1. **Thomas Durand** — mail envoyé à t.durand@gmail.com\n2. **Vous** — après la signature du candidat\n\nSi Thomas n'a pas signé sous 48h, je le relance automatiquement. Je vous alerte au bout de 5 jours sans réponse.",
      },
      {
        role: "kalia", type: "options",
        options: [{ id: "skip1", label: "Simuler : 24h plus tard", isSkip: true }],
      },
    ],
    drhText: undefined,
  },
  // Scene 6 — 24h follow-up
  {
    messages: [
      {
        role: "kalia", type: "system",
        text: "24 heures plus tard",
      },
      {
        role: "kalia", type: "text",
        text: "Point de suivi — Thomas Durand n'a pas encore signé son contrat. Pas d'action requise. Relance automatique prévue demain matin.",
      },
      {
        role: "kalia", type: "options",
        options: [{ id: "skip2", label: "Simuler : Thomas a signé", isSkip: true }],
      },
    ],
    drhText: undefined,
    ticketUpdate: undefined,
  },
  // Scene 7 — Thomas signs
  {
    messages: [
      {
        role: "kalia", type: "text",
        text: "Thomas Durand a signé son contrat à l'instant.\n\nC'est à votre tour. Le contrat signé est dans votre boîte mail connectée.",
      },
      {
        role: "kalia", type: "file",
        file: { name: "Contrat signé — Thomas Durand.pdf", meta: "Via Yousign — les deux parties ont signé" },
      },
      {
        role: "kalia", type: "text",
        text: "En parallèle, j'ai déjà préparé :\n— Mail de collecte onboarding : **prêt à partir** dès votre signature\n— DPAE : **pré-remplie**",
      },
      {
        role: "kalia", type: "options",
        options: [{ id: "countersign", label: "Je signe" }],
      },
    ],
    drhText: "Je signe.",
  },
  // Scene 7b — after DRH signs
  {
    messages: [
      {
        role: "kalia", type: "text",
        text: "Contrat signé par les deux parties. Archivé dans Lucca (dossier Thomas Durand).",
      },
      {
        role: "kalia", type: "checklist",
        checklist: [
          { status: "ok", label: "DPAE transmise à l'URSSAF" },
          { status: "ok", label: "Mail de collecte envoyé à Thomas — lien sécurisé pour déposer ses documents" },
        ],
      },
      {
        role: "kalia", type: "options",
        options: [{ id: "skip3", label: "Simuler : 3 jours plus tard", isSkip: true }],
      },
    ],
    drhText: undefined,
    ticketUpdate: {
      id: "onboarding-thomas", title: "Onboarding Thomas Durand",
      statusLabel: "Collecte documents (0/6)", icon: "pending",
    },
  },
  // Scene 8 — document follow-up
  {
    messages: [
      { role: "kalia", type: "system", text: "3 jours plus tard" },
      {
        role: "kalia", type: "text",
        text: "Point de suivi onboarding — Thomas Durand\n\nDocuments reçus : 4/6",
      },
      {
        role: "kalia", type: "checklist",
        checklist: [
          { status: "ok",      label: "RIB — format IBAN vérifié" },
          { status: "ok",      label: "Pièce d'identité — reçue" },
          { status: "ok",      label: "Attestation sécu — reçue" },
          { status: "ok",      label: "Photo — reçue" },
          { status: "pending", label: "Justificatif de domicile — manquant" },
          { status: "pending", label: "Certificats de travail — manquants" },
        ],
      },
      {
        role: "kalia", type: "text",
        text: "J'ai relancé Thomas ce matin pour les pièces manquantes.\nDPAE — accusé de réception URSSAF reçu. Pas d'action de votre part.",
      },
      {
        role: "kalia", type: "options",
        options: [{ id: "skip4", label: "Simuler : Thomas complète son dossier", isSkip: true }],
      },
    ],
    drhText: undefined,
    ticketUpdate: {
      id: "onboarding-thomas", title: "Onboarding Thomas Durand",
      statusLabel: "Collecte documents (4/6)", icon: "pending",
    },
  },
  // Scene 9 — complete
  {
    messages: [
      {
        role: "kalia", type: "text",
        text: "Thomas Durand a déposé les pièces restantes. Dossier complet.",
      },
      {
        role: "kalia", type: "checklist",
        checklist: [
          { status: "ok", label: "RIB — vérifié" },
          { status: "ok", label: "Pièce d'identité" },
          { status: "ok", label: "Justificatif de domicile" },
          { status: "ok", label: "Attestation sécu" },
          { status: "ok", label: "Photo" },
          { status: "ok", label: "Certificats de travail" },
          { status: "ok", label: "DPAE — accusé reçu" },
        ],
      },
      {
        role: "kalia", type: "text",
        text: "J'ai automatiquement :\n— Créé la fiche salarié dans **Lucca Poplee Socle RH**\n— Initialisé le **dossier paie dans Silae**\n— Archivé les documents dans le dossier salarié Lucca\n\nReste à planifier :\n— Visite médicale d'embauche\n— Affiliation mutuelle et prévoyance\n\nRappels programmés :\n— 28/12/2026 : fin de période d'essai — renouvellement ou confirmation\n— 28/12/2026 : réévaluation classification 2.3 → 3.1\n\nVoulez-vous que j'envoie la demande de visite médicale au SPST ?",
      },
      {
        role: "kalia", type: "options",
        options: [
          { id: "spst", label: "Oui, envoie au SPST" },
          { id: "later", label: "Plus tard" },
        ],
      },
    ],
    drhText: "Oui, envoie.",
    ticketUpdate: {
      id: "onboarding-thomas", title: "Onboarding Thomas Durand",
      statusLabel: "Complet", icon: "ok",
      details: ["Lucca", "Silae", "DPAE", "Visite médicale demandée"],
    },
  },
];

// ─── Render a single message bubble ──────────────────────────────────────────

function MessageBubble({
  msg,
  onOption,
}: {
  msg: ChatMessage;
  onOption: (msgId: string, optId: string) => void;
}) {
  const isKalia = msg.role === "kalia";

  if (msg.type === "system") {
    return <SystemMessage text={msg.text ?? ""} />;
  }

  const renderContent = () => {
    if (msg.type === "file" && msg.file) {
      return <FileCard file={msg.file} />;
    }
    if (msg.type === "checklist" && msg.checklist) {
      return <ChecklistCard items={msg.checklist} />;
    }
    if (msg.type === "progress") {
      return <ProgressBar done={false} />;
    }
    if (msg.type === "option-cards" && msg.optionCards) {
      return (
        <>
          <OptionCardsBlock cards={msg.optionCards} onSelect={id => onOption(msg.id, id)} />
          {msg.infoBlock && <InfoBlock text={msg.infoBlock} />}
        </>
      );
    }
    if (msg.type === "options") {
      return (
        <>
          {msg.text && <FormattedText text={msg.text} />}
          <div className="mt-2 flex flex-wrap gap-2">
            {msg.options?.map(opt => (
              <button
                key={opt.id}
                onClick={() => onOption(msg.id, opt.id)}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all",
                  opt.isSkip
                    ? "border border-dashed border-primary/50 bg-primary/5 text-primary hover:bg-primary/10"
                    : "border border-border bg-background text-foreground hover:border-primary hover:bg-primary/5",
                )}
              >
                {opt.isSkip && <FastForward size={12} className="inline mr-1.5 -mt-0.5" />}
                {opt.label}
              </button>
            ))}
          </div>
        </>
      );
    }
    return <FormattedText text={msg.text ?? ""} />;
  };

  if (!isKalia) {
    return (
      <div className="flex items-end justify-end gap-2 animate-in slide-in-from-bottom-2 fade-in">
        <div className="max-w-xs rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
          {msg.text}
        </div>
        <DrhAvatar />
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 animate-in slide-in-from-bottom-2 fade-in">
      <KaliaAvatar />
      <div className="flex flex-col gap-1 max-w-lg">
        {renderContent()}
      </div>
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  // simple: **bold**, newlines → line breaks
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div className="rounded-2xl rounded-bl-sm bg-card border border-border px-4 py-2.5 text-sm text-foreground shadow-sm leading-relaxed whitespace-pre-wrap">
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KaliaDemoOnboarding() {
  const [scene, setScene] = useState<number>(-1); // -1 = not started
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tickets, setTickets] = useState<SidebarTicket[]>([]);
  const [inputValue, setInputValue] = useState("Kalia, on embauche Thomas Durand. CDI cadre Syntec, position 3.1, coefficient 170, salaire brut 3 500 €. Entrée le 1er septembre. Son CV doit être dans mes mails.");
  const [typing, setTyping] = useState(false);
  const [progressDone, setProgressDone] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [finished, setFinished] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist / restore
  useEffect(() => {
    try {
      const s = localStorage.getItem(LS_SCENE);
      const m = localStorage.getItem(LS_MSGS);
      const t = localStorage.getItem(LS_TICKETS);
      if (s) setScene(parseInt(s));
      if (m) setMessages(JSON.parse(m));
      if (t) setTickets(JSON.parse(t));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_SCENE, String(scene));
      localStorage.setItem(LS_MSGS, JSON.stringify(messages));
      localStorage.setItem(LS_TICKETS, JSON.stringify(tickets));
    } catch { /* ignore */ }
  }, [scene, messages, tickets]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const addMessage = useCallback((msg: Omit<ChatMessage, "id" | "timestamp">) => {
    setMessages(prev => [...prev, { ...msg, id: uid(), timestamp: nowTime() }]);
  }, []);

  const showToast = useCallback((title: string, body: string) => {
    const id = uid();
    setToasts(prev => [...prev, { id, title, body }]);
  }, []);

  const updateTicket = useCallback((update: Partial<SidebarTicket> & { isNew?: boolean }) => {
    setTickets(prev => {
      const existing = prev.find(t => t.id === update.id);
      if (!existing || update.isNew) {
        const newTicket: SidebarTicket = {
          id: update.id!,
          title: update.title!,
          statusLabel: update.statusLabel!,
          icon: update.icon!,
          details: update.details,
        };
        return [...prev.filter(t => t.id !== update.id), newTicket];
      }
      return prev.map(t => t.id === update.id ? { ...t, ...update } : t);
    });
  }, []);

  const playScene = useCallback(async (sceneIdx: number) => {
    const step = SCENES[sceneIdx];
    if (!step) { setFinished(true); return; }

    setScene(sceneIdx);

    for (const msg of step.messages) {
      // typing indicator before kalia messages (except system)
      if (msg.role === "kalia" && msg.type !== "system") {
        setTyping(true);
        await delay(1600);
        setTyping(false);
      }

      if (msg.type === "progress") {
        addMessage(msg);
        await delay(2400);
        setProgressDone(true);
        // advance to next scene after progress
        playScene(sceneIdx + 1);
        return;
      }

      addMessage(msg);

      if (msg.type !== "options" && msg.type !== "option-cards") {
        await delay(400);
      }
    }

    // toast notifications for specific scenes
    if (sceneIdx === 5) {
      showToast(
        "Kalia — Suivi signature",
        "Thomas Durand n'a pas encore signé (envoyé hier 14h12). Relance automatique prévue demain 9h.",
      );
    }
    if (sceneIdx === 7) {
      showToast(
        "Kalia — Suivi onboarding Thomas Durand",
        "Documents reçus : 4/6",
      );
    }

    if (step.ticketUpdate) {
      updateTicket(step.ticketUpdate);
    }
  }, [addMessage, showToast, updateTicket]);

  const handleSend = useCallback(() => {
    const val = inputValue.trim();
    if (!val) return;

    if (scene === -1) {
      const lower = val.toLowerCase();
      if (lower.includes("embauche") && lower.includes("thomas")) {
        addMessage({ role: "drh", type: "text", text: val });
        setInputValue("");
        playScene(0);
      } else {
        addMessage({ role: "drh", type: "text", text: val });
        setInputValue("");
        setTimeout(() => {
          addMessage({
            role: "kalia", type: "text",
            text: "Je suis prêt à vous aider. Pour lancer la démo onboarding, mentionnez l'embauche de Thomas dans votre message.",
          });
        }, 1200);
      }
      return;
    }
    // After demo started: free typing does nothing meaningful
    addMessage({ role: "drh", type: "text", text: val });
    setInputValue("");
  }, [inputValue, scene, addMessage, playScene]);

  const handleOption = useCallback((msgId: string, optId: string) => {
    // Don't re-trigger if already reacted
    const currentScene = scene;
    const step = SCENES[currentScene];
    if (!step) return;

    if (step.drhText) {
      addMessage({ role: "drh", type: "text", text: step.drhText });
    }

    // remove option buttons from the triggering message
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, options: undefined, optionCards: undefined } : m
    ));

    setTimeout(() => playScene(currentScene + 1), 600);
  }, [scene, addMessage, playScene]);

  const handleReset = useCallback(() => {
    localStorage.removeItem(LS_SCENE);
    localStorage.removeItem(LS_MSGS);
    localStorage.removeItem(LS_TICKETS);
    setScene(-1);
    setMessages([]);
    setTickets([]);
    setFinished(false);
    setProgressDone(false);
    setInputValue("Kalia, on embauche Thomas Durand. CDI cadre Syntec, position 3.1, coefficient 170, salaire brut 3 500 €. Entrée le 1er septembre. Son CV doit être dans mes mails.");
  }, []);

  const ticketIcon = (icon: SidebarTicket["icon"]) => {
    if (icon === "ok") return <CheckCircle2 size={13} className="text-emerald-500" />;
    if (icon === "warning") return <AlertTriangle size={13} className="text-amber-500" />;
    return <Clock size={13} className="text-muted-foreground" />;
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background relative">

      {/* ── Toasts ── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onDismiss={() => setToasts(p => p.filter(x => x.id !== t.id))} />
        ))}
      </div>

      {/* ── Demo watermark ── */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-40 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[10px] font-medium text-muted-foreground tracking-widest uppercase select-none">
        DEMO
      </div>

      {/* ── Internal Sidebar ── */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-sidebar overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-500 text-white text-sm font-bold">
            K
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground">Kalia</p>
            <p className="text-[10px] text-muted-foreground">Assistant RH</p>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-2 pt-3">
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Conversations
          </p>

          {/* Active */}
          <button className={cn(
            "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
            scene >= 0 ? "bg-sidebar-accent" : "opacity-50"
          )}>
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-500 text-white text-[9px] font-bold">
              TD
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-sidebar-foreground">Onboarding — Thomas Durand</p>
              <p className="truncate text-[10px] text-muted-foreground">
                {messages.length > 0 ? messages[messages.length - 1]?.text?.slice(0, 32) + "…" : "Nouvelle conversation"}
              </p>
            </div>
            {scene >= 0 && <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
          </button>

          {/* Inactive threads */}
          {[
            { initials: "JM", name: "Julie Martin",    preview: "Document attestation…" },
            { initials: "KB", name: "Karim Benali",    preview: "Fin de CDD — renouvellement" },
          ].map(c => (
            <div key={c.name} className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 opacity-40 cursor-default">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-muted-foreground">
                {c.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-sidebar-foreground">{c.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{c.preview}</p>
              </div>
            </div>
          ))}

          {/* Tickets */}
          {tickets.length > 0 && (
            <>
              <p className="mb-1.5 mt-4 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Tickets
              </p>
              {tickets.map(t => (
                <div
                  key={t.id}
                  className="flex items-start gap-2 rounded-lg px-2.5 py-2 animate-in slide-in-from-left-2 fade-in"
                >
                  {ticketIcon(t.icon)}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-sidebar-foreground">{t.title}</p>
                    <p className="text-[10px] text-muted-foreground">{t.statusLabel}</p>
                    {t.details && (
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {t.details.map(d => (
                          <span key={d} className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">{d}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Integrations footer */}
        <div className="border-t border-border px-4 py-3">
          <p className="text-[9px] text-muted-foreground leading-relaxed">
            Connecté à : <span className="text-foreground/60">Lucca · Silae · Yousign · Gmail</span>
          </p>
        </div>
      </aside>

      {/* ── Chat Area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-2.5">
            <Bot size={15} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {scene >= 0 ? "Onboarding — Thomas Durand" : "Kalia — Assistant RH"}
            </span>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RotateCcw size={11} /> Recommencer
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 shadow-lg">
                <Bot size={26} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Kalia est prêt</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                  Envoyez un message mentionnant l'embauche de Thomas pour lancer la démo onboarding.
                </p>
              </div>
              <div className="mt-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground max-w-sm text-left leading-relaxed">
                <SourceBadge text="Message suggéré" />
                <p className="mt-2">Kalia, on embauche Thomas Durand. CDI cadre Syntec, position 3.1, coefficient 170, salaire brut 3 500 €. Entrée le 1er septembre. Son CV doit être dans mes mails.</p>
              </div>
            </div>
          )}

          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} onOption={handleOption} />
          ))}

          {typing && <TypingIndicator />}

          {finished && (
            <div className="flex flex-col items-center gap-3 py-6 animate-in fade-in">
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/10 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={15} /> Fin de la démo
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <RotateCcw size={13} /> Recommencer
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border px-4 py-3">
          <form
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/30 transition-all"
          >
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Envoyez un message à Kalia…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-opacity hover:opacity-90"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}
