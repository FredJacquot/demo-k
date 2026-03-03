"use client";

import { useRef, useMemo, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import * as THREE from "three";
import {
  UserPlus, UserMinus, FileText, CalendarOff, FolderOpen,
  CheckCircle2, Clock, XCircle, Zap, ShieldCheck, Hand,
  RotateCcw, Bell, Pencil, AlertCircle, ChevronDown, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExecutionMode = "full-auto" | "auto-validation" | "assisted";
type StepStatus = "ok" | "pending" | "blocked" | "waiting" | "skipped";
type WorkflowType = "onboarding" | "offboarding" | "document" | "absence" | "completude";
type Health = "blocked" | "warning" | "ok" | "done";

type ProcessStep = {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
  by?: "kalia" | "human";
};

type EmployeeCase = {
  id: string;
  name: string;
  initials: string;
  role: string;
  workflowType: WorkflowType;
  workflowLabel: string;
  steps: ProcessStep[];
  mode: ExecutionMode;
  updatedAt: string;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const allCases: EmployeeCase[] = [
  {
    id: "ob-1", name: "Sophie Marchand", initials: "SM", role: "Chargée de projet",
    workflowType: "onboarding", workflowLabel: "Onboarding administratif",
    mode: "auto-validation", updatedAt: "il y a 2h",
    steps: [
      { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia" },
      { id: "s2", label: "Données Core HR récupérées", status: "ok", by: "kalia" },
      { id: "s3", label: "Pièces d'identité reçues", status: "blocked", detail: "Relance envoyée ×2 — sans réponse" },
      { id: "s4", label: "Création dans le SIRH", status: "pending" },
      { id: "s5", label: "Envoi des accès et contrat", status: "pending" },
    ],
  },
  {
    id: "ob-4", name: "Pauline Girard", initials: "PG", role: "Responsable marketing",
    workflowType: "onboarding", workflowLabel: "Onboarding administratif",
    mode: "full-auto", updatedAt: "il y a 30 min",
    steps: [
      { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia" },
      { id: "s2", label: "Données Core HR récupérées", status: "blocked", detail: "Date de naissance incohérente entre 2 sources" },
      { id: "s3", label: "Pièces d'identité reçues", status: "pending" },
      { id: "s4", label: "Création dans le SIRH", status: "pending" },
      { id: "s5", label: "Envoi des accès et contrat", status: "pending" },
    ],
  },
  {
    id: "ob-2", name: "Nathan Leroy", initials: "NL", role: "Développeur",
    workflowType: "onboarding", workflowLabel: "Onboarding administratif",
    mode: "full-auto", updatedAt: "il y a 1h",
    steps: [
      { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia" },
      { id: "s2", label: "Données Core HR récupérées", status: "ok", by: "kalia" },
      { id: "s3", label: "Pièces d'identité reçues", status: "ok", by: "kalia" },
      { id: "s4", label: "Création dans le SIRH", status: "ok", by: "kalia" },
      { id: "s5", label: "Envoi des accès et contrat", status: "waiting", detail: "En attente signature électronique" },
    ],
  },
  {
    id: "ob-5", name: "Clémence Aubert", initials: "CA", role: "Comptable",
    workflowType: "onboarding", workflowLabel: "Onboarding administratif",
    mode: "auto-validation", updatedAt: "il y a 3h",
    steps: [
      { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia" },
      { id: "s2", label: "Données Core HR récupérées", status: "ok", by: "kalia" },
      { id: "s3", label: "Pièces d'identité reçues", status: "ok", by: "kalia" },
      { id: "s4", label: "Création dans le SIRH", status: "ok", by: "kalia" },
      { id: "s5", label: "Envoi des accès et contrat", status: "ok", by: "kalia" },
    ],
  },
  {
    id: "ob-3", name: "Camille Dubois", initials: "CD", role: "Designer UX",
    workflowType: "onboarding", workflowLabel: "Onboarding administratif",
    mode: "auto-validation", updatedAt: "hier",
    steps: [
      { id: "s1", label: "Dossier initialisé", status: "ok", by: "kalia" },
      { id: "s2", label: "Données Core HR récupérées", status: "ok", by: "kalia" },
      { id: "s3", label: "Pièces d'identité reçues", status: "ok", by: "kalia" },
      { id: "s4", label: "Création dans le SIRH", status: "waiting", detail: "En attente de validation GP" },
      { id: "s5", label: "Envoi des accès et contrat", status: "pending" },
    ],
  },
  {
    id: "of-2", name: "Pierre Faure", initials: "PF", role: "Commercial",
    workflowType: "offboarding", workflowLabel: "Offboarding administratif",
    mode: "full-auto", updatedAt: "il y a 1j",
    steps: [
      { id: "s1", label: "Départ confirmé dans le SIRH", status: "ok", by: "kalia" },
      { id: "s2", label: "Checklist de sortie générée", status: "ok", by: "kalia" },
      { id: "s3", label: "Désactivation des accès", status: "blocked", detail: "Accès Salesforce non révoqué" },
      { id: "s4", label: "Solde de tout compte préparé", status: "pending" },
      { id: "s5", label: "Attestation employeur générée", status: "pending" },
    ],
  },
  {
    id: "of-1", name: "Julie Moreau", initials: "JM", role: "Assistante RH",
    workflowType: "offboarding", workflowLabel: "Offboarding administratif",
    mode: "auto-validation", updatedAt: "il y a 4h",
    steps: [
      { id: "s1", label: "Départ confirmé dans le SIRH", status: "ok", by: "kalia" },
      { id: "s2", label: "Checklist de sortie générée", status: "ok", by: "kalia" },
      { id: "s3", label: "Désactivation des accès", status: "ok", by: "kalia" },
      { id: "s4", label: "Solde de tout compte préparé", status: "waiting", detail: "En attente de validation GP" },
      { id: "s5", label: "Attestation employeur générée", status: "pending" },
    ],
  },
  {
    id: "ab-3", name: "Hélène Martin", initials: "HM", role: "Juriste",
    workflowType: "absence", workflowLabel: "Gestion des absences",
    mode: "auto-validation", updatedAt: "il y a 5h",
    steps: [
      { id: "s1", label: "Absence détectée (5 jours)", status: "ok", by: "kalia" },
      { id: "s2", label: "Qualification du cas", status: "ok", by: "kalia" },
      { id: "s3", label: "Demande de justificatif", status: "ok", by: "kalia" },
      { id: "s4", label: "Justificatif reçu", status: "blocked", detail: "Document illisible — re-demande nécessaire" },
      { id: "s5", label: "Intégration dans la paie", status: "pending" },
    ],
  },
  {
    id: "ab-1", name: "Léa Fontaine", initials: "LF", role: "Analyste data",
    workflowType: "absence", workflowLabel: "Gestion des absences",
    mode: "full-auto", updatedAt: "hier",
    steps: [
      { id: "s1", label: "Absence détectée (3 jours)", status: "ok", by: "kalia" },
      { id: "s2", label: "Qualification du cas", status: "ok", by: "kalia" },
      { id: "s3", label: "Demande de justificatif", status: "ok", by: "kalia" },
      { id: "s4", label: "Justificatif reçu", status: "waiting", detail: "2e relance envoyée — J+1" },
      { id: "s5", label: "Intégration dans la paie", status: "pending" },
    ],
  },
  {
    id: "doc-4", name: "Antoine Blanc", initials: "AB", role: "Technicien",
    workflowType: "document", workflowLabel: "Documents RH",
    mode: "full-auto", updatedAt: "il y a 1h",
    steps: [
      { id: "s1", label: "Demande reçue", status: "ok", by: "kalia" },
      { id: "s2", label: "Contexte salarié chargé", status: "blocked", detail: "Salarié introuvable dans le SIRH" },
      { id: "s3", label: "Génération du document", status: "pending" },
      { id: "s4", label: "Envoi au salarié", status: "pending" },
    ],
  },
  {
    id: "co-1", name: "Thomas Renard", initials: "TR", role: "Technicien terrain",
    workflowType: "completude", workflowLabel: "Complétude des dossiers",
    mode: "full-auto", updatedAt: "il y a 1j",
    steps: [
      { id: "s1", label: "Contrôle de complétude", status: "ok", by: "kalia", detail: "3 anomalies détectées" },
      { id: "s2", label: "Relances envoyées", status: "ok", by: "kalia" },
      { id: "s3", label: "Champs reçus (2/3)", status: "ok", by: "kalia" },
      { id: "s4", label: "Résolution incohérence", status: "blocked", detail: "Date de naissance contradictoire — escalade GP" },
      { id: "s5", label: "Mise à jour SIRH", status: "pending" },
    ],
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const typeConfig: Record<WorkflowType, {
  icon: React.ElementType;
  label: string;
  color: string;
  hexOk: string;
  hexBlocked: string;
  hexWarning: string;
  hexDone: string;
}> = {
  onboarding:  { icon: UserPlus,    label: "Onboarding",   color: "text-blue-500",   hexOk: "#3b82f6", hexBlocked: "#ef4444", hexWarning: "#f59e0b", hexDone: "#22c55e" },
  offboarding: { icon: UserMinus,   label: "Offboarding",  color: "text-orange-500", hexOk: "#f97316", hexBlocked: "#ef4444", hexWarning: "#f59e0b", hexDone: "#22c55e" },
  document:    { icon: FileText,    label: "Documents RH", color: "text-violet-500", hexOk: "#8b5cf6", hexBlocked: "#ef4444", hexWarning: "#f59e0b", hexDone: "#22c55e" },
  absence:     { icon: CalendarOff, label: "Absences",     color: "text-amber-500",  hexOk: "#f59e0b", hexBlocked: "#ef4444", hexWarning: "#f59e0b", hexDone: "#22c55e" },
  completude:  { icon: FolderOpen,  label: "Complétude",   color: "text-rose-500",   hexOk: "#f43f5e", hexBlocked: "#ef4444", hexWarning: "#f59e0b", hexDone: "#22c55e" },
};

const modeConfig: Record<ExecutionMode, { icon: React.ElementType; label: string }> = {
  "full-auto":       { icon: Zap,        label: "Auto" },
  "auto-validation": { icon: ShieldCheck, label: "Validation" },
  "assisted":        { icon: Hand,        label: "Assisté" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHealth(c: EmployeeCase): Health {
  if (c.steps.every(s => s.status === "ok" || s.status === "skipped")) return "done";
  if (c.steps.some(s => s.status === "blocked")) return "blocked";
  if (c.steps.some(s => s.status === "waiting")) return "warning";
  return "ok";
}

function getGlobalHealth(cases: EmployeeCase[]): Health {
  if (cases.some(c => getHealth(c) === "blocked")) return "blocked";
  if (cases.some(c => getHealth(c) === "warning")) return "warning";
  if (cases.every(c => getHealth(c) === "done")) return "done";
  return "ok";
}

function healthToHex(health: Health, cfg: typeof typeConfig[WorkflowType]): string {
  return { blocked: cfg.hexBlocked, warning: cfg.hexWarning, done: cfg.hexDone, ok: cfg.hexOk }[health];
}

// ─── 3D: Single Particle Sphere ───────────────────────────────────────────────

type ParticleData = {
  theta: number;
  phi: number;
  r: number;
  speed: number;
  offset: number;
  isUnhealthy: boolean;
};

function WorkflowSphere({
  cases,
  workflowType,
  isSelected,
  isAnySelected,
  position,
  onClick,
}: {
  cases: EmployeeCase[];
  workflowType: WorkflowType;
  isSelected: boolean;
  isAnySelected: boolean;
  position: [number, number, number];
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const cfg = typeConfig[workflowType];
  const globalHealth = getGlobalHealth(cases);
  const mainColor = healthToHex(globalHealth, cfg);
  const blockedCount = cases.filter(c => getHealth(c) === "blocked").length;
  const totalCount = cases.length;

  // Build particles — one per employee + ambient particles
  const particles = useMemo<ParticleData[]>(() => {
    const result: ParticleData[] = [];
    // Employee particles (larger, more visible)
    cases.forEach((c, i) => {
      const h = getHealth(c);
      result.push({
        theta: (i / cases.length) * Math.PI * 2,
        phi: Math.acos(2 * Math.random() - 1),
        r: 0.7 + Math.random() * 0.15,
        speed: 0.3 + Math.random() * 0.4,
        offset: Math.random() * Math.PI * 2,
        isUnhealthy: h === "blocked" || h === "warning",
      });
    });
    // Ambient filler particles
    for (let i = 0; i < 60; i++) {
      result.push({
        theta: Math.random() * Math.PI * 2,
        phi: Math.acos(2 * Math.random() - 1),
        r: 0.5 + Math.random() * 0.35,
        speed: 0.1 + Math.random() * 0.2,
        offset: Math.random() * Math.PI * 2,
        isUnhealthy: false,
      });
    }
    return result;
  }, [cases]);

  const positionsArray = useMemo(() => new Float32Array(particles.length * 3), [particles]);
  const colorsArray = useMemo(() => {
    const arr = new Float32Array(particles.length * 3);
    const c = new THREE.Color(mainColor);
    for (let i = 0; i < particles.length; i++) {
      // Employee particles get a slight variation
      if (i < cases.length) {
        const h = getHealth(cases[i]);
        const col = new THREE.Color(healthToHex(h, cfg));
        arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b;
      } else {
        arr[i * 3] = c.r * (0.6 + Math.random() * 0.4);
        arr[i * 3 + 1] = c.g * (0.6 + Math.random() * 0.4);
        arr[i * 3 + 2] = c.b * (0.6 + Math.random() * 0.4);
      }
    }
    return arr;
  }, [particles, mainColor, cfg, cases]);

  const glowColor = new THREE.Color(mainColor);

  useFrame(({ clock }) => {
    if (!groupRef.current || !meshRef.current) return;
    const t = clock.getElapsedTime();

    // Slow global rotation
    groupRef.current.rotation.y = t * 0.12;
    groupRef.current.rotation.x = Math.sin(t * 0.07) * 0.15;

    // Pulse scale when selected
    const baseScale = isAnySelected ? (isSelected ? 1.15 : 0.75) : 1.0;
    const pulse = isSelected ? 1 + Math.sin(t * 3) * 0.04 : 1;
    groupRef.current.scale.setScalar(baseScale * pulse);

    // Animate particle positions
    const pos = meshRef.current.geometry.attributes.position;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const wobble = p.isUnhealthy
        ? Math.sin(t * p.speed * 4 + p.offset) * 0.18  // erratic
        : Math.sin(t * p.speed + p.offset) * 0.04;      // gentle
      const r = p.r + wobble;
      const theta = p.theta + t * p.speed * (i < cases.length ? 0.4 : 0.15);
      const phi = p.phi + Math.sin(t * 0.3 + p.offset) * 0.1;
      pos.setXYZ(i, r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
    }
    pos.needsUpdate = true;

    // Glow pulse
    if (glowRef.current) {
      const glowOpacity = globalHealth === "blocked"
        ? 0.08 + Math.sin(t * 2) * 0.06
        : 0.04 + Math.sin(t * 0.8) * 0.02;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = glowOpacity;
    }
  });

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positionsArray, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colorsArray, 3));
    return g;
  }, [positionsArray, colorsArray]);

  return (
    <group ref={groupRef} position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.05, 16, 16]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>

      {/* Particles */}
      <points ref={meshRef} geometry={geo}>
        <pointsMaterial
          size={0.045}
          vertexColors
          transparent
          opacity={isAnySelected && !isSelected ? 0.3 : 0.9}
          sizeAttenuation
        />
      </points>

      {/* Core sphere */}
      <mesh>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial
          color={mainColor}
          emissive={mainColor}
          emissiveIntensity={globalHealth === "blocked" ? 0.8 : 0.3}
          transparent
          opacity={0.85}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>

      {/* HTML label */}
      <Html center position={[0, -1.3, 0]} distanceFactor={5}>
        <div
          className={cn(
            "pointer-events-none select-none text-center transition-all duration-300",
            isAnySelected && !isSelected ? "opacity-30" : "opacity-100"
          )}
        >
          <div className={cn("text-[11px] font-semibold whitespace-nowrap", cfg.color)}>
            {cfg.label}
          </div>
          <div className="text-[9px] text-muted-foreground mt-0.5">
            {totalCount} dossier{totalCount > 1 ? "s" : ""}
            {blockedCount > 0 && <span className="text-red-400 ml-1">· {blockedCount} bloqué{blockedCount > 1 ? "s" : ""}</span>}
          </div>
        </div>
      </Html>
    </group>
  );
}

// ─── 3D Scene ─────────────────────────────────────────────────────────────────

function Scene({
  activeType,
  onSelect,
}: {
  activeType: WorkflowType | null;
  onSelect: (t: WorkflowType) => void;
}) {
  const workflowTypes: WorkflowType[] = ["onboarding", "offboarding", "document", "absence", "completude"];
  const casesByType = useMemo(() =>
    Object.fromEntries(workflowTypes.map(t => [t, allCases.filter(c => c.workflowType === t)])),
    []
  );

  // Spread spheres in an arc
  const positions: [number, number, number][] = [
    [-4.2, 0, 0],
    [-2.1, 0.4, -0.5],
    [0, 0, 0],
    [2.1, 0.4, -0.5],
    [4.2, 0, 0],
  ];

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 4, 4]} intensity={1.5} />
      <pointLight position={[-6, -2, 2]} intensity={0.5} color="#6366f1" />
      <pointLight position={[6, -2, 2]} intensity={0.5} color="#06b6d4" />

      {workflowTypes.map((type, i) => (
        <WorkflowSphere
          key={type}
          cases={casesByType[type] ?? []}
          workflowType={type}
          isSelected={activeType === type}
          isAnySelected={activeType !== null}
          position={positions[i]}
          onClick={() => onSelect(type)}
        />
      ))}
    </>
  );
}

// ─── Progress Dots ────────────────────────────────────────────────────────────

function ProgressDots({ steps }: { steps: ProcessStep[] }) {
  const dot: Record<StepStatus, string> = {
    ok: "bg-emerald-500", blocked: "bg-red-500 animate-pulse",
    waiting: "bg-amber-400", pending: "bg-muted-foreground/20", skipped: "bg-muted-foreground/10",
  };
  return (
    <div className="flex items-center gap-0.5">
      {steps.map(s => <span key={s.id} className={cn("h-1.5 w-1.5 rounded-full", dot[s.status])} />)}
    </div>
  );
}

// ─── Step List ────────────────────────────────────────────────────────────────

function StepList({ steps }: { steps: ProcessStep[] }) {
  const iconMap: Record<StepStatus, React.ElementType> = {
    ok: CheckCircle2, blocked: XCircle, waiting: Clock, pending: Clock, skipped: CheckCircle2,
  };
  const colorMap: Record<StepStatus, string> = {
    ok: "text-emerald-500", blocked: "text-red-500", waiting: "text-amber-500",
    pending: "text-muted-foreground/25", skipped: "text-muted-foreground/20",
  };
  return (
    <div className="mt-2 space-y-1.5 border-t border-border/50 pt-2">
      {steps.map(s => {
        const Icon = iconMap[s.status];
        return (
          <div key={s.id} className="flex items-start gap-2 text-xs">
            <Icon size={12} className={cn("mt-0.5 shrink-0", colorMap[s.status])} />
            <span className={cn(s.status === "pending" ? "text-muted-foreground/40" : "text-foreground/80")}>
              {s.label}
              {s.detail && <span className="ml-1 text-muted-foreground opacity-70">— {s.detail}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Case Row ─────────────────────────────────────────────────────────────────

function CaseRow({
  c, selected, onToggle, expanded, onToggleExpand,
}: {
  c: EmployeeCase; selected: boolean; onToggle: () => void; expanded: boolean; onToggleExpand: () => void;
}) {
  const health = getHealth(c);
  const blocker = c.steps.find(s => s.status === "blocked") || c.steps.find(s => s.status === "waiting");
  const ModeIcon = modeConfig[c.mode].icon;

  const healthConfig = {
    blocked: { cls: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400", label: "Bloqué",     icon: XCircle },
    warning: { cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400", label: "Attente",     icon: Clock },
    done:    { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400", label: "Terminé",    icon: CheckCircle2 },
    ok:      { cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400", label: "En cours",   icon: Zap },
  }[health];
  const HealthIcon = healthConfig.icon;

  return (
    <div className={cn("transition-colors", selected && "bg-muted/30")}>
      <div className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-muted/20" onClick={onToggleExpand}>
        <div onClick={e => { e.stopPropagation(); onToggle(); }}>
          <Checkbox checked={selected} className="shrink-0" />
        </div>
        <div className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-2",
          { blocked: "bg-red-50 ring-red-200 dark:bg-red-500/10 dark:ring-red-500/30", warning: "bg-amber-50 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30", done: "bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30", ok: "bg-blue-50 ring-blue-200 dark:bg-blue-500/10 dark:ring-blue-500/30" }[health]
        )}>
          {c.initials}
        </div>
        <div className="min-w-[130px]">
          <div className="text-sm font-medium text-foreground leading-tight">{c.name}</div>
          <div className="text-[10px] text-muted-foreground">{c.role}</div>
        </div>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0", healthConfig.cls)}>
          <HealthIcon size={9} />{healthConfig.label}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <ProgressDots steps={c.steps} />
          {blocker && (
            <p className="truncate text-[10px] text-muted-foreground">
              <span className="font-medium text-foreground/70">{blocker.label}</span>
              {blocker.detail && <span className="opacity-60"> — {blocker.detail}</span>}
            </p>
          )}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
          <ModeIcon size={10} />
          <span className="hidden md:inline">{c.updatedAt}</span>
          <ChevronDown size={13} className={cn("transition-transform duration-200", expanded && "rotate-180")} />
        </div>
      </div>
      {expanded && <div className="px-14 pb-3"><StepList steps={c.steps} /></div>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ADPv3Page() {
  const [activeType, setActiveType] = useState<WorkflowType | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "blocked" | "warning" | "ok" | "done">("all");

  const workflowTypes: WorkflowType[] = ["onboarding", "offboarding", "document", "absence", "completude"];
  const casesByType = useMemo(() =>
    Object.fromEntries(workflowTypes.map(t => [t, allCases.filter(c => c.workflowType === t)])),
    []
  );

  const filteredCases = useMemo(() => {
    let cases = activeType ? (casesByType[activeType] ?? []) : allCases;
    if (statusFilter !== "all") cases = cases.filter(c => getHealth(c) === statusFilter);
    return cases;
  }, [activeType, statusFilter, casesByType]);

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    const allSel = filteredCases.every(c => selected.has(c.id));
    setSelected(prev => {
      const n = new Set(prev);
      filteredCases.forEach(c => allSel ? n.delete(c.id) : n.add(c.id));
      return n;
    });
  }

  const selectedItems = filteredCases.filter(c => selected.has(c.id));
  const allSel = filteredCases.length > 0 && filteredCases.every(c => selected.has(c.id));
  const someSel = filteredCases.some(c => selected.has(c.id));

  const statusTabs = [
    { key: "all",     label: "Tous",       count: activeType ? (casesByType[activeType]?.length ?? 0) : allCases.length },
    { key: "blocked", label: "Bloqués",    count: (activeType ? (casesByType[activeType] ?? []) : allCases).filter(c => getHealth(c) === "blocked").length },
    { key: "warning", label: "En attente", count: (activeType ? (casesByType[activeType] ?? []) : allCases).filter(c => getHealth(c) === "warning").length },
    { key: "ok",      label: "En cours",   count: (activeType ? (casesByType[activeType] ?? []) : allCases).filter(c => getHealth(c) === "ok").length },
    { key: "done",    label: "Terminés",   count: (activeType ? (casesByType[activeType] ?? []) : allCases).filter(c => getHealth(c) === "done").length },
  ] as const;

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* 3D Canvas — macro view */}
      <div className="relative h-56 shrink-0 bg-background border-b border-border overflow-hidden">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 55 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <Suspense fallback={null}>
            <Scene
              activeType={activeType}
              onSelect={(t) => setActiveType(prev => prev === t ? null : t)}
            />
          </Suspense>
        </Canvas>

        {/* Overlay: title + hint */}
        <div className="pointer-events-none absolute inset-x-0 top-3 flex flex-col items-center gap-0.5">
          <span className="text-xs font-semibold text-foreground/60 tracking-wider uppercase">
            Workflows ADP
          </span>
          <span className="text-[10px] text-muted-foreground">
            {activeType ? "Cliquez à nouveau pour désélectionner" : "Cliquez sur une sphère pour filtrer"}
          </span>
        </div>

        {/* Active workflow pill */}
        {activeType && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <button
              onClick={() => setActiveType(null)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1 text-xs font-medium text-foreground shadow backdrop-blur-sm hover:bg-muted transition-colors"
            >
              <ArrowLeft size={11} />
              {typeConfig[activeType].label} · voir tout
            </button>
          </div>
        )}
      </div>

      {/* Case list */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2 flex-wrap">
          <div className="flex items-center gap-1">
            {statusTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  statusFilter === tab.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                    statusFilter === tab.key ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {someSel && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground">{selectedItems.length} sél.</span>
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs"><RotateCcw size={10} /> Relancer</Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs"><Bell size={10} /> Notifier</Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs"><Pencil size={10} /> Corriger</Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400">
                <AlertCircle size={10} /> Escalader
              </Button>
            </div>
          )}
        </div>

        {/* Column header */}
        <div className="flex items-center gap-3 border-b border-border/40 bg-muted/20 px-4 py-1.5">
          <Checkbox checked={allSel ? true : someSel ? "indeterminate" : false} onCheckedChange={toggleAll} />
          <span className="w-7 shrink-0" />
          <span className="min-w-[130px] text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Salarié</span>
          <span className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Statut</span>
          <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Point bloquant</span>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40">
          {filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <CheckCircle2 size={28} className="text-emerald-500" />
              <p className="text-sm font-medium">Aucun dossier dans cette catégorie</p>
            </div>
          ) : (
            filteredCases.map(c => (
              <CaseRow
                key={c.id}
                c={c}
                selected={selected.has(c.id)}
                onToggle={() => toggleSelect(c.id)}
                expanded={expandedId === c.id}
                onToggleExpand={() => setExpandedId(prev => prev === c.id ? null : c.id)}
              />
            ))
          )}
        </div>

        <div className="border-t border-border/40 px-4 py-1.5 text-[10px] text-muted-foreground">
          {filteredCases.length} dossier{filteredCases.length > 1 ? "s" : ""}
          {activeType && ` · ${typeConfig[activeType].label}`}
          {statusFilter !== "all" && ` · ${statusTabs.find(t => t.key === statusFilter)?.label}`}
        </div>
      </div>
    </div>
  );
}
