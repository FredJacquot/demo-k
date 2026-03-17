"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Zap, UserCheck, FileText, Send, Clock, CheckCircle2,
  AlertTriangle, ChevronRight, GripVertical, Plus, Trash2,
  Bell, Link2, Shield, Settings2, Bot, User, ChevronDown,
  Info, Save, RotateCcw, Play,
} from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

type ExecMode = "full-auto" | "supervised" | "manual";
type StepStatus = "active" | "disabled";
type SectionId = "general" | "steps" | "execution" | "integrations" | "notifications";

interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  mode: ExecMode;
  status: StepStatus;
  actor: "kalia" | "human" | "both";
  delay?: string;
  condition?: string;
}

// ─── Static nav ──────────────────────────────────────────────────────────────

const NAV: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: "general",       label: "Général",       icon: Settings2 },
  { id: "steps",         label: "Étapes",         icon: Play },
  { id: "execution",     label: "Exécution",      icon: Bot },
  { id: "integrations",  label: "Intégrations",   icon: Link2 },
  { id: "notifications", label: "Notifications",  icon: Bell },
];

// ─── Default steps ───────────────────────────────────────────────────────────

const DEFAULT_STEPS: WorkflowStep[] = [
  {
    id: "s1", label: "Détection de l'embauche",
    description: "Kalia surveille le SIRH et déclenche le workflow dès qu'une nouvelle fiche salarié est créée.",
    icon: Zap, mode: "full-auto", status: "active", actor: "kalia",
  },
  {
    id: "s2", label: "Vérification de la convention collective",
    description: "Contrôle automatique de la cohérence du salaire, du statut et de la classification par rapport à la CCN applicable.",
    icon: Shield, mode: "full-auto", status: "active", actor: "kalia",
  },
  {
    id: "s3", label: "Proposition de poste",
    description: "Génération et envoi au candidat d'un email de proposition formalisant les conditions d'embauche.",
    icon: Send, mode: "supervised", status: "active", actor: "both",
    condition: "Acceptation requise avant de passer à l'étape suivante",
  },
  {
    id: "s4", label: "Génération du contrat de travail",
    description: "Création automatique du contrat CDI/CDD depuis le modèle de l'entreprise avec pré-remplissage des données salarié.",
    icon: FileText, mode: "full-auto", status: "active", actor: "kalia",
  },
  {
    id: "s5", label: "Circuit de signature électronique",
    description: "Envoi via Yousign au salarié puis au DRH. Relance automatique à J+1 si non signé.",
    icon: CheckCircle2, mode: "full-auto", status: "active", actor: "kalia",
    delay: "Relance automatique après 24h",
  },
  {
    id: "s6", label: "Validation DRH",
    description: "Contre-signature DRH requise avant finalisation du dossier.",
    icon: UserCheck, mode: "supervised", status: "active", actor: "human",
  },
  {
    id: "s7", label: "DPAE — Déclaration préalable à l'embauche",
    description: "Transmission automatique à l'URSSAF. Archivage de l'accusé de réception.",
    icon: Send, mode: "full-auto", status: "active", actor: "kalia",
    delay: "À réaliser au plus tard 8 jours avant la prise de poste",
  },
  {
    id: "s8", label: "Collecte des documents obligatoires",
    description: "Envoi d'un lien sécurisé au salarié pour le dépôt des pièces (NIR, RIB, titre de séjour si applicable, justificatif de domicile).",
    icon: FileText, mode: "full-auto", status: "active", actor: "kalia",
    delay: "Relance automatique J+2 si incomplet",
  },
  {
    id: "s9", label: "Affiliation mutuelle et prévoyance",
    description: "Déclenchement automatique après réception du NIR. Envoi des formulaires d'affiliation à AG2R et à l'organisme de prévoyance.",
    icon: Shield, mode: "full-auto", status: "active", actor: "kalia",
    condition: "Conditionnel : NIR obligatoire",
  },
  {
    id: "s10", label: "Intégration SIRH, Paie et ATS",
    description: "Création automatique du compte salarié dans Lucca, Silae, et clôture du dossier dans l'ATS.",
    icon: Link2, mode: "full-auto", status: "active", actor: "kalia",
  },
  {
    id: "s11", label: "Rappels période d'essai",
    description: "Planification automatique des relances à J+30 (bilan intermédiaire) et J+45 (évaluation) envoyées au manager et au RH.",
    icon: Clock, mode: "full-auto", status: "active", actor: "kalia",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MODE_CONFIG: Record<ExecMode, { label: string; color: string; bg: string; dot: string }> = {
  "full-auto":  { label: "Full auto",  color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-400/10", dot: "bg-emerald-500" },
  "supervised": { label: "Supervisé",  color: "text-amber-700 dark:text-amber-300",    bg: "bg-amber-50 dark:bg-amber-400/10",    dot: "bg-amber-500" },
  "manual":     { label: "Manuel",     color: "text-slate-600 dark:text-slate-400",    bg: "bg-slate-100 dark:bg-slate-400/10",   dot: "bg-slate-400" },
};

const ACTOR_CONFIG: Record<WorkflowStep["actor"], { label: string; icon: React.ElementType }> = {
  kalia:  { label: "Kalia",           icon: Bot },
  human:  { label: "RH / Manager",    icon: User },
  both:   { label: "Kalia + Humain",  icon: UserCheck },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepCard({
  step, index, onModeChange, onToggle,
}: {
  step: WorkflowStep;
  index: number;
  onModeChange: (id: string, mode: ExecMode) => void;
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const mode = MODE_CONFIG[step.mode];
  const actor = ACTOR_CONFIG[step.actor];
  const ActorIcon = actor.icon;
  const StepIcon = step.icon;
  const disabled = step.status === "disabled";

  return (
    <div className={cn(
      "rounded-lg border border-border bg-card transition-opacity",
      disabled && "opacity-50"
    )}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground">
          <GripVertical size={16} />
        </div>

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-[11px] font-semibold text-muted-foreground">
          {index + 1}
        </div>

        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          mode.bg
        )}>
          <StepIcon size={14} className={mode.color} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium truncate", disabled && "line-through text-muted-foreground")}>
            {step.label}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Actor badge */}
          <div className="hidden sm:flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1">
            <ActorIcon size={11} className="text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">{actor.label}</span>
          </div>

          {/* Mode select */}
          <Select value={step.mode} onValueChange={(v) => onModeChange(step.id, v as ExecMode)}>
            <SelectTrigger className={cn("h-7 w-32 border-0 text-[11px] font-medium gap-1", mode.bg, mode.color)}>
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", mode.dot)} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MODE_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">
                  <span className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full", v.dot)} />
                    {v.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Switch
            checked={!disabled}
            onCheckedChange={() => onToggle(step.id)}
            className="scale-90"
          />

          <button
            onClick={() => setExpanded(e => !e)}
            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ChevronDown size={14} className={cn("transition-transform", expanded && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {step.delay && (
              <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/20 px-3 py-2">
                <Clock size={12} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px] text-amber-700 dark:text-amber-300">{step.delay}</span>
              </div>
            )}
            {step.condition && (
              <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-400/10 border border-blue-200/60 dark:border-blue-400/20 px-3 py-2">
                <Info size={12} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] text-blue-700 dark:text-blue-300">{step.condition}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Description personnalisée</Label>
            <Textarea
              defaultValue={step.description}
              className="text-xs min-h-[60px] resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-border pb-4 mb-6">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function SettingRow({
  label, description, children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-8 py-4 border-b border-border/60 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function SectionGeneral() {
  return (
    <div>
      <SectionHeading
        title="Paramètres généraux"
        description="Informations de base et comportement global du workflow d'onboarding."
      />

      <div className="space-y-0 rounded-lg border border-border bg-card divide-y divide-border/60 px-4">
        <SettingRow label="Nom du workflow" description="Identifiant affiché dans l'interface et les notifications.">
          <Input defaultValue="Onboarding administratif" className="w-60 text-sm h-8" />
        </SettingRow>

        <SettingRow label="Workflow actif" description="Désactiver pour mettre en pause tous les déclenchements automatiques.">
          <Switch defaultChecked />
        </SettingRow>

        <SettingRow label="Convention collective par défaut" description="Utilisée si aucune CCN n'est détectée dans la fiche salarié.">
          <Select defaultValue="syntec">
            <SelectTrigger className="w-52 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="syntec">Syntec (bureaux d'études)</SelectItem>
              <SelectItem value="metallurgie">Métallurgie</SelectItem>
              <SelectItem value="commerce">Commerce de gros</SelectItem>
              <SelectItem value="none">Aucune (manuel)</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Déclenchement automatique" description="Kalia lance le workflow dès la création d'une fiche salarié dans le SIRH, sans action manuelle.">
          <Switch defaultChecked />
        </SettingRow>

        <SettingRow label="Délai de déclenchement" description="Délai entre la création de la fiche et le démarrage effectif du workflow.">
          <Select defaultValue="0">
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Immédiat</SelectItem>
              <SelectItem value="1h">1 heure</SelectItem>
              <SelectItem value="4h">4 heures</SelectItem>
              <SelectItem value="24h">24 heures</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Responsable par défaut" description="Personne notifiée en cas de blocage ou de décision requise.">
          <Select defaultValue="drh">
            <SelectTrigger className="w-52 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="drh">DRH (rôle)</SelectItem>
              <SelectItem value="rrh">RRH assigné</SelectItem>
              <SelectItem value="manager">Manager direct</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </div>
    </div>
  );
}

function SectionSteps({ steps, onModeChange, onToggle }: {
  steps: WorkflowStep[];
  onModeChange: (id: string, mode: ExecMode) => void;
  onToggle: (id: string) => void;
}) {
  const active = steps.filter(s => s.status === "active").length;

  return (
    <div>
      <SectionHeading
        title="Étapes du workflow"
        description="Configurez chaque étape : mode d'exécution, acteur responsable et activation. Glissez-déposez pour réordonner."
      />

      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{active} étape{active > 1 ? "s" : ""} active{active > 1 ? "s" : ""} sur {steps.length}</p>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-[10px] gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Full auto
          </Badge>
          <Badge variant="secondary" className="text-[10px] gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Supervisé
          </Badge>
          <Badge variant="secondary" className="text-[10px] gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Manuel
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-stretch gap-2">
            {/* Connector line */}
            <div className="flex flex-col items-center w-4 shrink-0 mt-4">
              {i < steps.length - 1 && (
                <div className={cn(
                  "mt-8 w-px flex-1",
                  step.status === "active" ? "bg-border" : "bg-border/30"
                )} />
              )}
            </div>
            <div className="flex-1">
              <StepCard step={step} index={i} onModeChange={onModeChange} onToggle={onToggle} />
            </div>
          </div>
        ))}
      </div>

      <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-muted/20 transition-colors">
        <Plus size={14} />
        Ajouter une étape personnalisée
      </button>
    </div>
  );
}

function SectionExecution() {
  return (
    <div>
      <SectionHeading
        title="Mode d'exécution global"
        description="Définit le comportement de Kalia lorsqu'une décision est requise à chaque étape."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {(Object.entries(MODE_CONFIG) as [ExecMode, typeof MODE_CONFIG[ExecMode]][]).map(([key, cfg]) => (
          <button
            key={key}
            className={cn(
              "rounded-lg border-2 p-4 text-left transition-all",
              key === "full-auto"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-border/80 hover:bg-muted/30"
            )}
          >
            <div className={cn("mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium", cfg.bg, cfg.color)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
              {cfg.label}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {key === "full-auto" && "Kalia exécute toutes les étapes automatiquement. Aucune validation manuelle requise sauf erreur."}
              {key === "supervised" && "Kalia prépare et propose, un humain valide avant chaque action critique."}
              {key === "manual" && "Kalia assiste mais toutes les actions sont déclenchées manuellement."}
            </p>
            {key === "full-auto" && (
              <p className="mt-2 text-[10px] font-medium text-primary">Mode actif</p>
            )}
          </button>
        ))}
      </div>

      <SectionHeading
        title="Gestion des erreurs"
        description="Comportement de Kalia en cas de blocage ou d'anomalie détectée."
      />
      <div className="space-y-0 rounded-lg border border-border bg-card divide-y divide-border/60 px-4">
        <SettingRow label="Escalade automatique" description="Si une étape est bloquée depuis plus de X heures, notifier automatiquement le responsable.">
          <div className="flex items-center gap-2">
            <Input defaultValue="24" className="w-16 h-8 text-sm text-center" />
            <span className="text-xs text-muted-foreground">heures</span>
          </div>
        </SettingRow>

        <SettingRow label="Pause du workflow en cas d'erreur critique" description="Suspendre toutes les étapes suivantes si une étape obligatoire échoue.">
          <Switch defaultChecked />
        </SettingRow>

        <SettingRow label="Journalisation détaillée" description="Enregistrer chaque action de Kalia avec horodatage et source de décision.">
          <Switch defaultChecked />
        </SettingRow>
      </div>
    </div>
  );
}

function SectionIntegrations() {
  const integrations = [
    { name: "Silae", desc: "Logiciel de paie", status: "connected" as const, icon: "S" },
    { name: "Lucca", desc: "SIRH et gestion RH", status: "connected" as const, icon: "L" },
    { name: "Yousign", desc: "Signature électronique", status: "connected" as const, icon: "Y" },
    { name: "AG2R La Mondiale", desc: "Mutuelle et prévoyance", status: "connected" as const, icon: "A" },
    { name: "Greenhouse / ATS", desc: "Applicant tracking system", status: "disconnected" as const, icon: "G" },
    { name: "URSSAF DPAE", desc: "Déclaration préalable à l'embauche", status: "connected" as const, icon: "U" },
  ];

  return (
    <div>
      <SectionHeading
        title="Intégrations"
        description="Services connectés utilisés par Kalia pour exécuter les étapes du workflow d'onboarding."
      />

      <div className="space-y-2">
        {integrations.map((int) => (
          <div key={int.name} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-xs font-bold text-foreground">
              {int.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{int.name}</p>
              <p className="text-xs text-muted-foreground">{int.desc}</p>
            </div>
            <div className="flex items-center gap-3">
              {int.status === "connected" ? (
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Connecté
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-border" />
                  Non connecté
                </span>
              )}
              <Button variant="outline" size="sm" className="h-7 text-xs">
                {int.status === "connected" ? "Configurer" : "Connecter"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionNotifications() {
  return (
    <div>
      <SectionHeading
        title="Notifications"
        description="Choisissez qui est notifié à chaque moment clé du workflow et par quel canal."
      />

      <div className="space-y-0 rounded-lg border border-border bg-card divide-y divide-border/60 px-4 mb-6">
        <SettingRow label="Nouveau dossier créé" description="Notification envoyée dès qu'un workflow est déclenché pour un nouveau salarié.">
          <div className="flex items-center gap-2">
            <Switch defaultChecked />
            <Select defaultValue="drh">
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drh">DRH</SelectItem>
                <SelectItem value="rrh">RRH</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SettingRow>

        <SettingRow label="Blocage détecté" description="Alerte quand une étape est en échec ou en attente depuis trop longtemps.">
          <div className="flex items-center gap-2">
            <Switch defaultChecked />
            <Select defaultValue="drh">
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drh">DRH</SelectItem>
                <SelectItem value="rrh">RRH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SettingRow>

        <SettingRow label="Signature requise" description="Notifier le signataire dès que le contrat est prêt dans Yousign.">
          <Switch defaultChecked />
        </SettingRow>

        <SettingRow label="Dossier complet" description="Confirmation envoyée au RH et au manager quand toutes les étapes sont terminées.">
          <div className="flex items-center gap-2">
            <Switch defaultChecked />
            <Select defaultValue="both">
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drh">DRH</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="both">DRH + Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SettingRow>

        <SettingRow label="Rappels période d'essai" description="Notifications automatiques à J+30 et J+45 pour le suivi de la période d'essai.">
          <Switch defaultChecked />
        </SettingRow>
      </div>

      <SectionHeading
        title="Canaux de notification"
        description="Définissez par quel canal les notifications sont envoyées."
      />
      <div className="space-y-0 rounded-lg border border-border bg-card divide-y divide-border/60 px-4">
        <SettingRow label="Email" description="Notifications par email via le serveur SMTP configuré.">
          <Switch defaultChecked />
        </SettingRow>
        <SettingRow label="Interface Kalia" description="Notifications dans la sidebar et le fil de conversation Kalia.">
          <Switch defaultChecked />
        </SettingRow>
        <SettingRow label="Slack / Teams" description="Intégration webhook pour envoyer les alertes sur un canal dédié.">
          <div className="flex items-center gap-2">
            <Switch />
            <Button variant="outline" size="sm" className="h-7 text-xs">Configurer</Button>
          </div>
        </SettingRow>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingWorkflowConfigPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("general");
  const [steps, setSteps] = useState<WorkflowStep[]>(DEFAULT_STEPS);
  const [saved, setSaved] = useState(false);

  const handleModeChange = (id: string, mode: ExecMode) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, mode } : s));
  };

  const handleToggle = (id: string) => {
    setSteps(prev => prev.map(s =>
      s.id === id ? { ...s, status: s.status === "active" ? "disabled" : "active" } : s
    ));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Configuration"
        subtitle="Workflows administratifs"
      />

      <div className="flex flex-1 min-h-0">
        {/* Left nav */}
        <aside className="w-56 shrink-0 border-r border-border bg-sidebar flex flex-col">
          {/* Back breadcrumb */}
          <div className="px-4 pt-4 pb-2">
            <Link
              href="/settings"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
            >
              <ChevronRight size={12} className="rotate-180" />
              Configuration
            </Link>
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <div className="h-6 w-6 rounded flex items-center justify-center bg-primary/10">
                <Zap size={12} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground leading-tight">Onboarding</p>
                <p className="text-[10px] text-muted-foreground">Workflow actif</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-2 py-2 space-y-0.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors text-left",
                  activeSection === id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon size={14} className="shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          {/* Other workflows */}
          <div className="border-t border-sidebar-border px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Autres workflows</p>
            {["Offboarding", "Absences", "Documents RH"].map(name => (
              <button
                key={name}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-border shrink-0" />
                {name}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-border px-6 py-3">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-foreground">
                {NAV.find(n => n.id === activeSection)?.label}
              </h1>
              <Badge variant="secondary" className="text-[10px]">Onboarding administratif</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <RotateCcw size={12} />
                Réinitialiser
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleSave}
              >
                {saved ? (
                  <>
                    <CheckCircle2 size={12} />
                    Enregistré
                  </>
                ) : (
                  <>
                    <Save size={12} />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Section content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-8">
              {activeSection === "general"       && <SectionGeneral />}
              {activeSection === "steps"         && <SectionSteps steps={steps} onModeChange={handleModeChange} onToggle={handleToggle} />}
              {activeSection === "execution"     && <SectionExecution />}
              {activeSection === "integrations"  && <SectionIntegrations />}
              {activeSection === "notifications" && <SectionNotifications />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
