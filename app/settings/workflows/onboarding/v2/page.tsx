"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Zap, UserCheck, FileText, Send, Clock, CheckCircle2,
  Shield, Bot, User, Settings2, Save, ChevronLeft,
  GitBranch, Bell, Link2, Plus, Trash2, X,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExecMode = "full-auto" | "supervised" | "manual";

interface StepNodeData {
  label: string;
  description: string;
  icon: React.ElementType;
  mode: ExecMode;
  actor: "kalia" | "human" | "both";
  active: boolean;
  delay?: string;
  [key: string]: unknown;
}

// ─── Mode config ─────────────────────────────────────────────────────────────

const MODE_CONFIG: Record<ExecMode, { label: string; color: string; dot: string }> = {
  "full-auto":  { label: "Full auto",  color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-800", dot: "bg-emerald-500" },
  "supervised": { label: "Supervisé",  color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-400/10 dark:text-blue-300 dark:border-blue-800", dot: "bg-blue-500" },
  "manual":     { label: "Manuel",     color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-800", dot: "bg-amber-500" },
};

// ─── Custom Step Node ─────────────────────────────────────────────────────────

function StepNode({ data, selected }: NodeProps) {
  const d = data as StepNodeData;
  const Icon = d.icon;
  const mode = MODE_CONFIG[d.mode];

  return (
    <div className={cn(
      "w-[260px] rounded-xl border bg-card shadow-sm transition-all duration-150",
      selected ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border",
      !d.active && "opacity-50",
    )}>
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !border-2 !border-primary !bg-background" />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              d.actor === "kalia" ? "bg-primary/10 text-primary" :
              d.actor === "human" ? "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300" :
              "bg-purple-100 text-purple-700 dark:bg-purple-400/10 dark:text-purple-300",
            )}>
              <Icon size={15} />
            </div>
            <span className="text-sm font-semibold text-foreground leading-tight">{d.label}</span>
          </div>
          <div className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0", mode.color)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", mode.dot)} />
            {mode.label}
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] leading-relaxed text-muted-foreground">{d.description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {d.actor === "kalia" ? <Bot size={11} /> : d.actor === "human" ? <User size={11} /> : <GitBranch size={11} />}
            <span>{d.actor === "kalia" ? "Kalia" : d.actor === "human" ? "RH" : "Kalia + RH"}</span>
          </div>
          {d.delay && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock size={10} />
              <span>{d.delay}</span>
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !border-2 !border-primary !bg-background" />
    </div>
  );
}

// ─── Trigger Node ─────────────────────────────────────────────────────────────

function TriggerNode({ selected }: NodeProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border-2 border-dashed bg-primary/5 px-5 py-3.5 shadow-sm transition-all",
      selected ? "border-primary ring-2 ring-primary/20" : "border-primary/30",
    )}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Zap size={16} />
      </div>
      <div>
        <p className="text-xs font-bold text-primary uppercase tracking-wider">Déclencheur</p>
        <p className="text-sm font-semibold text-foreground">Nouvelle fiche salarié détectée</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">SIRH — création automatique</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !border-2 !border-primary !bg-background" />
    </div>
  );
}

// ─── End Node ─────────────────────────────────────────────────────────────────

function EndNode({ selected }: NodeProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border-2 bg-emerald-50 dark:bg-emerald-400/5 px-5 py-3.5 shadow-sm transition-all",
      selected ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-emerald-200 dark:border-emerald-800",
    )}>
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !border-2 !border-emerald-500 !bg-background" />
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
        <CheckCircle2 size={16} />
      </div>
      <div>
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Fin du workflow</p>
        <p className="text-sm font-semibold text-foreground">Dossier complet</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Intégration Lucca + Silae + DPST</p>
      </div>
    </div>
  );
}

// ─── Node types ───────────────────────────────────────────────────────────────

const nodeTypes = { step: StepNode, trigger: TriggerNode, end: EndNode };

// ─── Initial nodes ────────────────────────────────────────────────────────────

const INITIAL_NODES: Node[] = [
  {
    id: "trigger",
    type: "trigger",
    position: { x: 80, y: 0 },
    data: {},
    draggable: true,
  },
  {
    id: "s1",
    type: "step",
    position: { x: 0, y: 130 },
    data: {
      label: "Vérification convention collective",
      description: "Contrôle automatique de la cohérence du salaire, statut et classification par rapport à la CCN applicable.",
      icon: Shield, mode: "full-auto", actor: "kalia", active: true,
    },
  },
  {
    id: "s2",
    type: "step",
    position: { x: 0, y: 310 },
    data: {
      label: "Proposition de poste",
      description: "Génération et envoi de la proposition de poste au candidat pour validation.",
      icon: Send, mode: "supervised", actor: "both", active: true, delay: "J+0",
    },
  },
  {
    id: "s3",
    type: "step",
    position: { x: 0, y: 490 },
    data: {
      label: "Génération du contrat CDI",
      description: "Création du contrat de travail avec les 6 contrôles réglementaires et conventionnels.",
      icon: FileText, mode: "full-auto", actor: "kalia", active: true,
    },
  },
  {
    id: "s4",
    type: "step",
    position: { x: 0, y: 670 },
    data: {
      label: "Circuit de signature Yousign",
      description: "Lancement du circuit de signature électronique — salarié puis DRH.",
      icon: UserCheck, mode: "supervised", actor: "both", active: true, delay: "Relance à J+1",
    },
  },
  {
    id: "s5",
    type: "step",
    position: { x: 0, y: 850 },
    data: {
      label: "DPAE + collecte documents",
      description: "Transmission DPAE à l'URSSAF et déclenchement de la collecte des pièces justificatives.",
      icon: Bell, mode: "full-auto", actor: "kalia", active: true,
    },
  },
  {
    id: "s6",
    type: "step",
    position: { x: 0, y: 1030 },
    data: {
      label: "Intégration Lucca + Silae",
      description: "Synchronisation du dossier dans les outils RH et paie. Envoi du livret d'accueil.",
      icon: Link2, mode: "full-auto", actor: "kalia", active: true,
    },
  },
  {
    id: "end",
    type: "end",
    position: { x: 60, y: 1210 },
    data: {},
    draggable: true,
  },
];

// ─── Initial edges ────────────────────────────────────────────────────────────

const INITIAL_EDGES: Edge[] = [
  { id: "e0-1",  source: "trigger", target: "s1", animated: true, style: { stroke: "var(--color-primary)", strokeWidth: 2 } },
  { id: "e1-2",  source: "s1",      target: "s2", animated: false, style: { stroke: "hsl(var(--border))", strokeWidth: 1.5 } },
  { id: "e2-3",  source: "s2",      target: "s3", animated: false, style: { stroke: "hsl(var(--border))", strokeWidth: 1.5 } },
  { id: "e3-4",  source: "s3",      target: "s4", animated: false, style: { stroke: "hsl(var(--border))", strokeWidth: 1.5 } },
  { id: "e4-5",  source: "s4",      target: "s5", animated: false, style: { stroke: "hsl(var(--border))", strokeWidth: 1.5 } },
  { id: "e5-6",  source: "s5",      target: "s6", animated: false, style: { stroke: "hsl(var(--border))", strokeWidth: 1.5 } },
  { id: "e6-end",source: "s6",      target: "end", animated: false, style: { stroke: "oklch(0.723 0.174 149)", strokeWidth: 2 } },
];

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ node, onClose, onUpdate }: {
  node: Node;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<StepNodeData>) => void;
}) {
  if (node.type === "trigger" || node.type === "end") return null;
  const d = node.data as StepNodeData;

  return (
    <div className="absolute right-0 top-0 h-full w-[320px] border-l border-border bg-card shadow-xl z-10 flex flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-foreground">Configurer l'étape</span>
        <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Active toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Étape active</p>
            <p className="text-xs text-muted-foreground">Désactiver pour exclure du workflow</p>
          </div>
          <Switch
            checked={d.active}
            onCheckedChange={(v) => onUpdate(node.id, { active: v })}
          />
        </div>

        {/* Label */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nom de l'étape</label>
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={d.label}
            onChange={(e) => onUpdate(node.id, { label: e.target.value })}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={d.description}
            onChange={(e) => onUpdate(node.id, { description: e.target.value })}
          />
        </div>

        {/* Mode */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mode d'exécution</label>
          <Select value={d.mode} onValueChange={(v) => onUpdate(node.id, { mode: v as ExecMode })}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-auto">Full auto — Kalia agit seule</SelectItem>
              <SelectItem value="supervised">Supervisé — validation RH requise</SelectItem>
              <SelectItem value="manual">Manuel — action humaine uniquement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actor */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Acteur responsable</label>
          <Select value={d.actor} onValueChange={(v) => onUpdate(node.id, { actor: v as "kalia" | "human" | "both" })}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kalia">Kalia</SelectItem>
              <SelectItem value="human">Équipe RH</SelectItem>
              <SelectItem value="both">Kalia + RH</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Delay */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Délai / Relance</label>
          <input
            placeholder="ex: J+1, 24h, Immédiat"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={d.delay ?? ""}
            onChange={(e) => onUpdate(node.id, { delay: e.target.value })}
          />
        </div>
      </div>
      <div className="border-t border-border p-4">
        <Button size="sm" className="w-full gap-2" onClick={onClose}>
          <Save size={14} />
          Appliquer
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingWorkflowV2() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saved, setSaved] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, style: { stroke: "hsl(var(--border))", strokeWidth: 1.5 } }, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type !== "trigger" && node.type !== "end") setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const updateNodeData = useCallback((id: string, data: Partial<StepNodeData>) => {
    setNodes((nds) =>
      nds.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n),
    );
    setSelectedNode((prev) =>
      prev && prev.id === id ? { ...prev, data: { ...prev.data, ...data } } : prev,
    );
  }, [setNodes]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const activeCount = nodes.filter((n) => n.type === "step" && (n.data as StepNodeData).active).length;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href="/settings/workflows/onboarding" className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Settings2 size={14} className="text-primary" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">Workflow Onboarding</span>
              <span className="ml-2 text-xs text-muted-foreground">v2 — Éditeur visuel</span>
            </div>
          </div>
          <Badge variant="secondary" className="ml-1 text-[10px]">
            {activeCount} étape{activeCount > 1 ? "s" : ""} active{activeCount > 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/adp/v3" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Link2 size={12} />
            Voir les workflows actifs
          </Link>
          <Button size="sm" className="gap-2" onClick={handleSave} variant={saved ? "outline" : "default"}>
            {saved ? <><CheckCircle2 size={14} className="text-emerald-500" /> Sauvegardé</> : <><Save size={14} /> Sauvegarder</>}
          </Button>
        </div>
      </header>

      {/* Canvas */}
      <div className="relative flex-1 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          className="bg-background"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            className="opacity-30"
          />
          <Controls
            className="!border-border !bg-card !shadow-md"
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === "trigger") return "oklch(0.42 0.11 260)";
              if (n.type === "end") return "oklch(0.723 0.174 149)";
              const d = n.data as StepNodeData;
              if (!d.active) return "oklch(0.91 0.003 247)";
              return d.mode === "full-auto" ? "oklch(0.723 0.174 149)" : d.mode === "supervised" ? "oklch(0.58 0.13 240)" : "oklch(0.769 0.16 70)";
            }}
            className="!border-border !bg-card !shadow-md"
            maskColor="rgba(0,0,0,0.05)"
          />
        </ReactFlow>

        {/* Toolbar flottant */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-lg z-10">
          <span className="text-xs text-muted-foreground mr-1">Ajouter :</span>
          {[
            { label: "Étape auto", icon: Bot, mode: "full-auto" as ExecMode },
            { label: "Validation RH", icon: User, mode: "supervised" as ExecMode },
            { label: "Condition", icon: GitBranch, mode: "manual" as ExecMode },
          ].map(({ label, icon: Icon, mode }) => (
            <button
              key={label}
              onClick={() => {
                const newNode: Node = {
                  id: `step-${Date.now()}`,
                  type: "step",
                  position: { x: 80, y: 400 + Math.random() * 200 },
                  data: {
                    label,
                    description: "Décrivez cette étape...",
                    icon: Icon,
                    mode,
                    actor: mode === "supervised" ? "both" : mode === "manual" ? "human" : "kalia",
                    active: true,
                  },
                };
                setNodes((nds) => [...nds, newNode]);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
          {selectedNode && (
            <>
              <div className="h-4 w-px bg-border mx-1" />
              <button
                onClick={() => {
                  setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                  setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
                  setSelectedNode(null);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 size={13} />
                Supprimer
              </button>
            </>
          )}
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <DetailPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={updateNodeData}
          />
        )}
      </div>
    </div>
  );
}
