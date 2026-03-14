"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, XCircle, Clock, FileText, Send, RefreshCw,
  ChevronRight, Download, Eye, Zap, Bell, AlertTriangle,
  SkipForward, Building2, Stethoscope, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────

type SceneId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 75 | 8 | 9 | 99;

interface ChatMessage {
  id: string;
  role: "user" | "kalia" | "system";
  content: React.ReactNode;
  timestamp: Date;
  options?: Option[];
  isSimulator?: boolean;
}

interface Option {
  label: string;
  value: string;
  variant?: "default" | "outline" | "destructive" | "simulator";
}

interface Ticket {
  id: string;
  title: string;
  statusLabel: string;
  icon: string;
  details?: string[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function now() { return new Date(); }
function todayStr() {
  return new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── Sub-components ────────────────────────────────────────────────────────

function KaliaAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-500 text-white text-xs font-bold">
      K
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">
      DRH
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <KaliaAvatar />
      <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
        <div className="flex gap-1 items-center">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function FileCard({ name, meta }: { name: string; meta: string }) {
  return (
    <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-background p-3 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
        <FileText size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      <Button size="sm" variant="outline" className="shrink-0 text-xs">
        <Eye size={12} className="mr-1" /> Voir
      </Button>
    </div>
  );
}

function ChecklistCard({ items }: { items: { label: string; ok: boolean; pending?: boolean }[] }) {
  return (
    <div className="mt-2 rounded-xl border border-border bg-background p-3 space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          {item.ok ? (
            <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
          ) : item.pending ? (
            <Clock size={15} className="shrink-0 text-amber-500" />
          ) : (
            <XCircle size={15} className="shrink-0 text-destructive" />
          )}
          <span className={cn(item.ok ? "text-foreground" : item.pending ? "text-amber-700 dark:text-amber-400" : "text-destructive")}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function SourceBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 text-[11px] text-blue-700 dark:text-blue-300 font-medium">
      📚 {label}
    </span>
  );
}

function OptionCard({
  title,
  subtitle,
  warning,
  note,
  onClick,
}: {
  title: string;
  subtitle: string;
  warning?: boolean;
  note?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-all hover:shadow-md active:scale-[0.99]",
        warning
          ? "border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/40 hover:border-amber-400"
          : "border-border bg-background hover:border-primary/50"
      )}
    >
      <div className="flex items-start gap-2">
        {warning && <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />}
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          {note && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{note}</p>}
        </div>
      </div>
    </button>
  );
}

function ProgressBar({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); onDone(); return 100; }
        return p + 4;
      });
    }, 80);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-xs text-muted-foreground">Génération en cours…</p>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function SystemMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
      <Bell size={13} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function ReminderBlock({ items }: { items: string[] }) {
  return (
    <div className="mt-2 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/40 p-3 space-y-1">
      {items.map((item, i) => (
        <p key={i} className="flex items-center gap-2 text-xs text-violet-700 dark:text-violet-300">
          <span>📅</span>{item}
        </p>
      ))}
    </div>
  );
}

// ─── Ticket sidebar ────────────────────────────────────────────────────────

function TicketSidebar({ tickets }: { tickets: Ticket[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Tickets</p>
      {tickets.length === 0 && (
        <p className="text-xs text-muted-foreground px-1 italic">Aucun ticket actif</p>
      )}
      {tickets.map(t => (
        <div key={t.id} className="rounded-lg border border-border bg-card p-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <span>{t.icon}</span>
            <span className="truncate">{t.title}</span>
          </div>
          <p className="mt-1 text-muted-foreground">{t.statusLabel}</p>
          {t.details && t.details.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {t.details.map((d, i) => (
                <span key={i} className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{d}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "kalia_demo_onboarding_v2";

export default function DemoOnboardingPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [scene, setScene] = useState<SceneId | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("Kalia, on embauche Thomas Durand. CDI cadre Syntec, position 3.1, coefficient 170, salaire brut 3 500 €. Entrée le 1er septembre. Son CV doit être dans mes mails.");
  const [isDone, setIsDone] = useState(false);
  const [contractGenerated, setContractGenerated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const viewport = scrollRef.current?.querySelector('[data-slot="scroll-area-viewport"]');
      if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  // Persist state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { sceneId, ticketsData } = JSON.parse(saved);
        if (sceneId) setScene(sceneId);
        if (ticketsData) setTickets(ticketsData);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (scene !== null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sceneId: scene, ticketsData: tickets }));
    }
  }, [scene, tickets]);

  const addMessage = useCallback((msg: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMsg: ChatMessage = { ...msg, id: crypto.randomUUID(), timestamp: now() };
    setMessages(prev => [...prev, newMsg]);
    scrollToBottom();
    return newMsg.id;
  }, [scrollToBottom]);

  const updateTicket = useCallback((id: string, patch: Partial<Ticket>) => {
    setTickets(prev => {
      const exists = prev.find(t => t.id === id);
      if (exists) return prev.map(t => t.id === id ? { ...t, ...patch } : t);
      return [...prev, { id, title: "", statusLabel: "", icon: "📋", ...patch } as Ticket];
    });
  }, []);

  const showTyping = useCallback((ms: number): Promise<void> => {
    setIsTyping(true);
    return new Promise(resolve => setTimeout(() => { setIsTyping(false); resolve(); }, ms));
  }, []);

  const advanceToScene = useCallback(async (targetScene: SceneId) => {
    setScene(targetScene);
    await showTyping(1600);

    if (targetScene === 1) {
      addMessage({
        role: "kalia",
        content: (
          <div className="space-y-2">
            <p>J&apos;ai trouvé un mail de <strong>Thomas Durand</strong> reçu le 12 juin avec un CV en pièce jointe.</p>
            <FileCard name="thomas_durand_cv_2026.pdf" meta="Reçu le 12/06/2026 — t.durand@gmail.com" />
            <p className="pt-1">C&apos;est bien celui-ci ?</p>
          </div>
        ),
        options: [
          { label: "✅ Oui c'est lui", value: "oui_cv" },
          { label: "❌ Non, cherche encore", value: "non_cv", variant: "outline" },
        ],
      });
    }

    if (targetScene === 2) {
      addMessage({
        role: "kalia",
        content: (
          <div className="space-y-2">
            <p>Avant de générer le contrat, je détecte une <strong>incohérence avec la grille Syntec</strong> en vigueur.</p>
            <p>Pour la position 3.1, coefficient 170, le salaire minimum conventionnel est de <strong>3 650 € brut mensuel</strong>. Le salaire demandé de 3 500 € est en dessous de ce plancher.</p>
            <SourceBadge label="Grille Syntec — mise à jour janvier 2026" />
          </div>
        ),
        options: [
          { label: "Option A — Ajuster le salaire à 3 650 €", value: "option_a" },
          { label: "Option B — Position 2.3 · 3 500 € conforme", value: "option_b" },
          { label: "⚠️ Option C — Maintenir 3 500 € en 3.1 (non-conforme)", value: "option_c", variant: "outline" },
        ],
      });
      // Inline note
      addMessage({
        role: "system",
        content: "💡 Cohérence interne : 3 cadres en position 2.3, salaire moyen 3 420 €. Un salaire de 3 500 € en 2.3 serait cohérent. — Source : Lucca Poplee Socle RH",
      });
    }

    if (targetScene === 3) {
      addMessage({
        role: "kalia",
        content: (
          <div className="space-y-1">
            <p>C&apos;est noté. Je génère le contrat :</p>
            <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
              <li>— Thomas Durand — CDI cadre</li>
              <li>— CCN Syntec — Position 2.3 — Coefficient 150</li>
              <li>— Salaire brut mensuel : 3 500 €</li>
              <li>— Date d&apos;entrée : 1er septembre 2026</li>
            </ul>
            <ProgressBar onDone={() => advanceToScene(4)} />
          </div>
        ),
      });
    }

    if (targetScene === 4) {
      addMessage({
        role: "kalia",
        content: (
          <div className="space-y-2">
            <p>Le contrat est prêt.</p>
            <FileCard
              name={`Contrat CDI — Thomas Durand — Syntec 2.3.pdf`}
              meta={`Généré le ${todayStr()}`}
            />
            <ChecklistCard items={[
              { label: "Période d'essai : 4 mois renouvelable — conforme cadre Syntec", ok: true },
              { label: "Clause de non-concurrence : conforme template entreprise", ok: true },
              { label: "Lieu de travail : Paris, 15 rue des Lilas", ok: true },
              { label: "Mentions obligatoires : toutes présentes", ok: true },
              { label: "Salaire vs grille Syntec 2.3 : conforme (plancher 3 275 €)", ok: true },
              { label: "Cohérence interne : dans la fourchette position 2.3", ok: true },
            ]} />
            <p className="text-sm pt-1">💡 J&apos;ai programmé un rappel pour réévaluer la classification de Thomas à la fin de sa période d&apos;essai (31 décembre 2026).</p>
            <p className="text-sm font-medium">Souhaitez-vous modifier quelque chose ou lancer la signature ?</p>
          </div>
        ),
        options: [
          { label: "✍️ Lancer la signature", value: "lancer_signature" },
          { label: "✏️ Modifier le contrat", value: "modifier", variant: "outline" },
        ],
      });
      setContractGenerated(true);
    }

    if (targetScene === 5) {
      updateTicket("onboarding-thomas", {
        title: "Onboarding Thomas Durand",
        statusLabel: "Signature en cours",
        icon: "📋",
      });
      addMessage({
        role: "kalia",
        content: (
          <div className="space-y-2">
            <p>Signature électronique lancée via <strong>Yousign</strong>.</p>
            <div className="rounded-xl border border-border bg-background p-3 space-y-1 text-sm">
              <p className="font-medium mb-1">Circuit de signature :</p>
              <div className="flex items-center gap-2"><Clock size={13} className="text-amber-500" /><span>Thomas Durand — mail envoyé à t.durand@gmail.com</span></div>
              <div className="flex items-center gap-2"><Clock size={13} className="text-muted-foreground" /><span className="text-muted-foreground">Vous — après la signature du candidat</span></div>
            </div>
            <p className="text-sm text-muted-foreground">Si Thomas n&apos;a pas signé sous 48h, je le relance automatiquement. Je vous alerte au bout de 5 jours sans réponse.</p>
          </div>
        ),
        options: [
          { label: "⏩ Simuler : 24h plus tard", value: "skip_24h", variant: "simulator" },
        ],
      });
    }

    if (targetScene === 6) {
      toast("🔔 Kalia — Suivi signature", {
        description: "Thomas Durand n'a pas encore signé (envoyé hier 14h12). Relance automatique prévue demain 9h.",
        duration: 6000,
      });
      addMessage({
        role: "system",
        content: "📌 Point de suivi — Thomas Durand n'a pas encore signé son contrat. Pas d'action requise. Relance automatique prévue demain matin.",
      });
      addMessage({
        role: "kalia",
        content: <p>Thomas n&apos;a pas encore signé. Je m&apos;en occupe automatiquement.</p>,
        options: [
          { label: "⏩ Simuler : Thomas a signé", value: "skip_signed", variant: "simulator" },
        ],
      });
    }

    if (targetScene === 7) {
      addMessage({
        role: "kalia",
        content: (
          <div className="space-y-2">
            <p><CheckCircle2 size={14} className="inline mr-1 text-emerald-500" /><strong>Thomas Durand a signé son contrat</strong> à l&apos;instant.</p>
            <p className="text-sm">C&apos;est à votre tour. Le contrat signé est dans votre boîte mail connectée.</p>
            <FileCard name="Contrat signé — Thomas Durand.pdf" meta="Signé par Thomas Durand" />
            <div className="rounded-xl border border-border bg-background p-3 text-sm space-y-1">
              <p className="text-muted-foreground font-medium text-xs mb-1">En parallèle, j&apos;ai déjà préparé :</p>
              <div className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /><span>Mail de collecte onboarding : prêt à partir</span></div>
              <div className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-500" /><span>DPAE : pré-remplie</span></div>
            </div>
          </div>
        ),
        options: [{ label: "✍️ Je signe", value: "je_signe" }],
      });
    }

    if (targetScene === 75 as SceneId) {
      addMessage({
        role: "kalia",
        content: (
          <div className="space-y-2">
            <p>Contrat signé par les deux parties. <strong>Archivé dans Lucca</strong> (dossier Thomas Durand).</p>
            <p className="text-sm pt-1">J&apos;enchaîne automatiquement :</p>
            <ChecklistCard items={[
              { label: "DPAE transmise à l'URSSAF", ok: true },
              { label: "Mail de collecte envoyé à Thomas — lien sécurisé pour déposer ses documents", ok: true },
            ]} />
          </div>
        ),
        options: [
          { label: "⏩ Simuler : 3 jours plus tard", value: "skip_3days", variant: "simulator" },
        ],
      });
      updateTicket("onboarding-thomas", {
        statusLabel: "Collecte documents en cours (0/6)",
        icon: "📋",
      });
    }

    if (targetScene === 8) {
      toast("🔔 Kalia — Suivi onboarding Thomas Durand", {
        description: "Documents reçus : 4/6",
        duration: 6000,
      });
      addMessage({
        role: "system",
        content: "📌 Point de suivi onboarding — Thomas Durand",
      });
      addMessage({
        role: "kalia",
        content: (
          <div className="space-y-2">
            <ChecklistCard items={[
              { label: "RIB — format IBAN vérifié", ok: true },
              { label: "Pièce d'identité — reçue", ok: true },
              { label: "Attestation sécu — reçue", ok: true },
              { label: "Photo — reçue", ok: true },
              { label: "Justificatif de domicile — manquant", ok: false, pending: true },
              { label: "Certificats de travail — manquants", ok: false, pending: true },
            ]} />
            <p className="text-sm">J&apos;ai relancé Thomas ce matin pour les pièces manquantes.</p>
            <div className="flex items-center gap-2 text-sm"><CheckCircle2 size={13} className="text-emerald-500" /><span>DPAE — accusé de réception URSSAF reçu.</span></div>
            <p className="text-sm text-muted-foreground">Pas d&apos;action de votre part.</p>
          </div>
        ),
        options: [
          { label: "⏩ Simuler : Thomas complète son dossier", value: "skip_complete", variant: "simulator" },
        ],
      });
      updateTicket("onboarding-thomas", { statusLabel: "Collecte documents (4/6)" });
      updateTicket("dpae-thomas", {
        title: "DPAE Thomas Durand",
        statusLabel: "Accusé URSSAF reçu",
        icon: "✅",
      });
    }

    if (targetScene === 9) {
      addMessage({
        role: "kalia",
        content: (
          <div className="space-y-2">
            <p><strong>Thomas Durand a déposé les pièces restantes. Dossier complet.</strong></p>
            <ChecklistCard items={[
              { label: "RIB — vérifié", ok: true },
              { label: "Pièce d'identité", ok: true },
              { label: "Justificatif de domicile", ok: true },
              { label: "Attestation sécu", ok: true },
              { label: "Photo", ok: true },
              { label: "Certificats de travail", ok: true },
              { label: "DPAE — accusé reçu", ok: true },
            ]} />
            <div className="space-y-1 pt-1">
              <p className="text-sm">J&apos;ai automatiquement :</p>
              <div className="flex items-center gap-2 text-sm"><Building2 size={13} className="text-blue-500" /><span>Créé la fiche salarié dans <strong>Lucca Poplee Socle RH</strong></span></div>
              <div className="flex items-center gap-2 text-sm"><Zap size={13} className="text-violet-500" /><span>Initialisé le dossier paie dans <strong>Silae</strong></span></div>
              <div className="flex items-center gap-2 text-sm"><CheckCircle2 size={13} className="text-emerald-500" /><span>Archivé les documents dans le dossier salarié Lucca</span></div>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm space-y-1">
              <p className="font-medium text-xs text-muted-foreground mb-1">⚡ Reste à planifier :</p>
              <p>• Visite médicale d&apos;embauche</p>
              <p>• Affiliation mutuelle et prévoyance</p>
            </div>
            <ReminderBlock items={[
              "28/12/2026 : fin de période d'essai — renouvellement ou confirmation",
              "28/12/2026 : réévaluation classification 2.3 → 3.1",
            ]} />
            <p className="text-sm font-medium pt-1">Voulez-vous que j&apos;envoie la demande de visite médicale au SPST ?</p>
          </div>
        ),
        options: [
          { label: "🏥 Oui, envoie au SPST", value: "oui_spst" },
          { label: "⏭️ Plus tard", value: "plus_tard", variant: "outline" },
        ],
      });
      updateTicket("onboarding-thomas", {
        statusLabel: "Complet",
        icon: "✅",
        details: ["Lucca ✅", "Silae ✅", "DPAE ✅"],
      });
    }

    if (targetScene === 99) {
      addMessage({
        role: "kalia",
        content: (
          <div className="space-y-2">
            <p>Demande de visite médicale envoyée au <strong>SPST (Efficience Santé au Travail)</strong>. Je vous notifie quand le créneau est confirmé.</p>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
              <CheckCircle2 size={15} />
              <span>L&apos;onboarding administratif de Thomas Durand est terminé.</span>
            </div>
            <ChecklistCard items={[
              { label: "Contrat signé", ok: true },
              { label: "DPAE transmise", ok: true },
              { label: "Fiche Lucca créée", ok: true },
              { label: "Dossier Silae initialisé", ok: true },
              { label: "Visite médicale demandée", ok: true },
            ]} />
          </div>
        ),
      });
      updateTicket("onboarding-thomas", {
        statusLabel: "Complet",
        icon: "✅",
        details: ["Lucca ✅", "Silae ✅", "DPAE ✅", "Visite médicale demandée"],
      });
      setIsDone(true);
    }

    scrollToBottom();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addMessage, showTyping, updateTicket, scrollToBottom]);

  const handleOption = useCallback(async (value: string) => {
    // Disable all option buttons after click
    const userLabels: Record<string, string> = {
      oui_cv: "Oui c'est lui.",
      non_cv: "Non, ce n'est pas le bon CV.",
      option_a: "On ajuste le salaire à 3 650 €.",
      option_b: "Va pour l'option 2. Position 2.3, coefficient 150 à 3 500 €. On reverra sa classification à la fin de la période d'essai.",
      option_c: "On maintient 3 500 € en position 3.1.",
      lancer_signature: "C'est bon, envoie.",
      modifier: "Je veux modifier le contrat.",
      skip_24h: null as unknown as string,
      skip_signed: null as unknown as string,
      je_signe: "Je signe.",
      skip_3days: null as unknown as string,
      skip_complete: null as unknown as string,
      oui_spst: "Oui, envoie.",
      plus_tard: "On verra ça plus tard.",
    };

    const label = userLabels[value];
    if (label) {
      addMessage({ role: "user", content: label });
    }

    // Navigate to next scene
    const nextScene: Record<string, SceneId> = {
      oui_cv: 2,
      non_cv: 2,
      option_a: 3,
      option_b: 3,
      option_c: 3,
      lancer_signature: 5,
      modifier: 4,
      skip_24h: 6,
      skip_signed: 7,
      je_signe: 75 as SceneId,
      skip_3days: 8,
      skip_complete: 9,
      oui_spst: 99,
      plus_tard: 99,
    };

    if (nextScene[value]) {
      await advanceToScene(nextScene[value]);
    }
  }, [addMessage, advanceToScene]);

  const handleFirstMessage = useCallback(async () => {
    if (!inputValue.trim()) return;
    const lower = inputValue.toLowerCase();
    if (!lower.includes("thomas") || !lower.includes("embauch")) {
      addMessage({
        role: "kalia",
        content: "Je suis prêt à vous aider. Pour lancer la démo onboarding, mentionnez l'embauche de Thomas dans votre message.",
      });
      return;
    }
    addMessage({ role: "user", content: inputValue });
    setInputValue("");
    await advanceToScene(1);
  }, [inputValue, addMessage, advanceToScene]);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
    setTickets([]);
    setScene(null);
    setIsDone(false);
    setContractGenerated(false);
    setInputValue("Kalia, on embauche Thomas Durand. CDI cadre Syntec, position 3.1, coefficient 170, salaire brut 3 500 €. Entrée le 1er septembre. Son CV doit être dans mes mails.");
  }, []);

  // Message bubble renderer
  function renderMessage(msg: ChatMessage, index: number) {
    const isUser = msg.role === "user";
    const isSystem = msg.role === "system";

    if (isSystem) {
      return (
        <SystemMessage key={msg.id}>{msg.content}</SystemMessage>
      );
    }

    return (
      <div key={msg.id} className={cn("flex gap-2", isUser && "flex-row-reverse")}>
        {isUser ? <UserAvatar /> : <KaliaAvatar />}
        <div className={cn("flex flex-col gap-2 max-w-[80%]", isUser && "items-end")}>
          <div className={cn(
            "rounded-2xl px-4 py-3 text-sm",
            isUser
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-muted"
          )}>
            {msg.content}
          </div>
          {msg.options && (
            <div className="flex flex-wrap gap-2 mt-1">
              {msg.options.map((opt, i) => (
                opt.variant === "simulator" ? (
                  <button
                    key={i}
                    onClick={() => handleOption(opt.value)}
                    className="flex items-center gap-1.5 rounded-lg border-2 border-dashed border-amber-400 dark:border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100/80 dark:hover:bg-amber-900/40 transition-colors"
                  >
                    <SkipForward size={12} />
                    {opt.label.replace("⏩ ", "").replace("⏭️ ", "")}
                  </button>
                ) : (
                  <Button
                    key={i}
                    size="sm"
                    variant={opt.variant === "outline" ? "outline" : "default"}
                    className="h-8 text-xs"
                    onClick={() => handleOption(opt.value)}
                  >
                    {opt.label}
                  </Button>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left sidebar */}
      <div className="hidden w-56 shrink-0 flex-col gap-6 border-r border-border bg-muted/20 p-4 md:flex">
        {/* Conversations */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Conversations</p>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 text-xs">
            <p className="font-medium text-foreground">Onboarding — Thomas Durand</p>
            <p className="text-muted-foreground mt-0.5">En cours</p>
          </div>
          <div className="rounded-lg border border-border p-2.5 text-xs opacity-40 cursor-not-allowed select-none">
            <p className="font-medium">Julie Martin</p>
            <p className="text-muted-foreground mt-0.5">Absence longue durée</p>
          </div>
          <div className="rounded-lg border border-border p-2.5 text-xs opacity-40 cursor-not-allowed select-none">
            <p className="font-medium">Karim Benali</p>
            <p className="text-muted-foreground mt-0.5">Avenant contrat</p>
          </div>
        </div>
        <TicketSidebar tickets={tickets} />
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h1 className="text-sm font-semibold">Demo — Onboarding Thomas Durand</h1>
            <p className="text-xs text-muted-foreground">Scénario interactif</p>
          </div>
          <Button size="sm" variant="ghost" onClick={reset} className="gap-1.5 text-xs text-muted-foreground">
            <RefreshCw size={13} />
            Recommencer
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 px-4 py-4">
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 text-white text-xl font-bold shadow-lg">
                  K
                </div>
                <p className="text-sm font-medium">Bienvenue dans la démo Kalia</p>
                <p className="text-xs max-w-xs opacity-70">Envoyez le message pré-rempli pour lancer le scénario d&apos;onboarding de Thomas Durand.</p>
              </div>
            )}
            {messages.map((msg, i) => renderMessage(msg, i))}
            {isTyping && <TypingIndicator />}
            {isDone && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-emerald-400 dark:border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 p-6 text-center">
                <p className="text-base font-semibold text-emerald-700 dark:text-emerald-400">Fin de la démo</p>
                <p className="text-xs text-muted-foreground">L&apos;onboarding administratif de Thomas Durand est complet.</p>
                <Button size="sm" onClick={reset} className="gap-1.5 mt-1">
                  <RefreshCw size={13} />
                  Recommencer la démo
                </Button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        {scene === null && !isDone && (
          <div className="border-t border-border p-3">
            <div className="mx-auto flex max-w-2xl gap-2">
              <input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleFirstMessage()}
                placeholder="Tapez votre message…"
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button onClick={handleFirstMessage} size="sm" className="gap-1.5 shrink-0">
                <Send size={14} />
                Envoyer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
