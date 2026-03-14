"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  QuestionMessage,
  AnswerMessage,
  TransmissionMessage,
  TypingIndicator,
} from "@/components/conversation/messages";
import { ConversationContextPanel } from "@/components/conversation/context-panel";
import { ChatInput } from "@/components/conversation/chat-input";
import type { Message, Conversation } from "@/types/conversation";
import type { Attachment } from "@/types/request";

// ─── Scénario onboarding scripté ───────────────────────────────────────────
// L'utilisateur (DRH) joue le rôle de Sophie Martin.
// Les questions suivantes pilotent le scénario étape par étape.
const DEMO_STEPS: { userMessage: string; label: string }[] = [
  {
    label: "Lancer le scénario",
    userMessage:
      "Kalia, je viens de valider le recrutement de Thomas Leclerc, prise de poste le 3 février. Peux-tu me donner un état d'avancement de son dossier d'intégration administrative ?",
  },
  {
    label: "Contrat signé",
    userMessage: "Thomas vient de signer le contrat. Quel est l'état du dossier maintenant ?",
  },
  {
    label: "NIR transmis",
    userMessage:
      "Thomas vient de me transmettre son numéro de sécurité sociale. Tu peux déclencher les affiliations mutuelle et prévoyance ?",
  },
  {
    label: "Veille J-1",
    userMessage:
      "Nous sommes à J-1. Donne-moi le point sur ce qui reste à faire avant l'arrivée de Thomas demain matin.",
  },
  {
    label: "Fin J1",
    userMessage: "Thomas a pris son poste ce matin. Quel est le bilan de sa première journée ?",
  },
];

// ─── Conversation factice en mémoire ───────────────────────────────────────
function buildDemoConversation(): Conversation {
  return {
    id: "demo-onboarding",
    userId: "demo-drh",
    title: "Onboarding administratif — Thomas Leclerc",
    subtitle: "Intégration administrative d'un nouveau salarié",
    messages: [],
    category: "Administration du personnel",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const DEMO_CONV_ID = "demo-onboarding-scenario";

export default function DemoOnboardingPage() {
  const [conversation, setConversation] = useState<Conversation>(buildDemoConversation());
  const [showContext, setShowContext] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [stepIndex, setStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const scrollToBottom = () => {
    const viewport = scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]');
    if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    if (conversation.messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [conversation.messages]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Avance d'une étape : ajoute le message user + génère la réponse Kalia
  const advanceStep = async () => {
    if (stepIndex >= DEMO_STEPS.length || isRunning) return;
    setIsRunning(true);

    const step = DEMO_STEPS[stepIndex];

    // 1. Ajouter le message user
    const userMsg: Message = {
      id: `msg-user-${stepIndex}`,
      type: "question",
      content: step.userMessage,
      timestamp: new Date().toISOString(),
      author: "user",
    };

    setConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      updatedAt: new Date().toISOString(),
    }));

    // 2. Afficher le typing indicator
    setShowTypingIndicator(true);
    setTimeout(scrollToBottom, 100);

    // 3. Générer la réponse Kalia via le mock existant
    const { generateKaliaResponse } = await import("@/lib/kalia-mock");
    const kaliaMessages = await generateKaliaResponse(
      step.userMessage,
      conversation.messages,
      DEMO_CONV_ID
    );

    // Délai simulé 2-3s
    const delay = 2000 + Math.random() * 1000;
    await new Promise((r) => setTimeout(r, delay));

    setShowTypingIndicator(false);

    if (kaliaMessages.length > 0) {
      setConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, userMsg, ...kaliaMessages].filter(
          (m, i, arr) => arr.findIndex((x) => x.id === m.id) === i
        ),
        updatedAt: new Date().toISOString(),
      }));

      const firstKalia = kaliaMessages[0];
      setSelectedMessageId(firstKalia.id);
    }

    setStepIndex((i) => i + 1);
    setIsRunning(false);
  };

  // Envoi libre depuis le ChatInput (continue le scénario)
  const handleSendMessage = async (message: string) => {
    if (isRunning) return;
    setIsRunning(true);

    const userMsg: Message = {
      id: `msg-free-${Date.now()}`,
      type: "question",
      content: message,
      timestamp: new Date().toISOString(),
      author: "user",
    };

    setConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg],
    }));

    setShowTypingIndicator(true);
    setTimeout(scrollToBottom, 100);

    const { generateKaliaResponse } = await import("@/lib/kalia-mock");
    const kaliaMessages = await generateKaliaResponse(
      message,
      conversation.messages,
      DEMO_CONV_ID
    );

    const delay = 2000 + Math.random() * 1000;
    await new Promise((r) => setTimeout(r, delay));

    setShowTypingIndicator(false);

    setConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, ...kaliaMessages],
      updatedAt: new Date().toISOString(),
    }));

    if (kaliaMessages.length > 0) setSelectedMessageId(kaliaMessages[0].id);
    setIsRunning(false);
  };

  const handleCreateRequest = async (messageId: string) => {
    const { generateRequestId, saveRequest } = await import("@/lib/requests-storage");
    const requestId = generateRequestId();

    const msgIndex = conversation.messages.findIndex((m) => m.id === messageId);
    const questionMsg = conversation.messages.slice(0, msgIndex).reverse().find((m) => m.type === "question");
    if (!questionMsg) return;

    const request = {
      id: requestId,
      conversationId: conversation.id,
      userId: "demo-drh",
      userName: "Sophie Martin (DRH)",
      createdAt: new Date().toISOString(),
      status: "pending" as const,
      priority: "medium" as const,
      category: "autre" as const,
      title: conversation.title,
      reformulatedRequest: questionMsg.content as string,
      includeFullConversation: true,
      userComment: "",
      assignedTo: null,
      response: null,
      resolvedAt: null,
    };

    saveRequest(request);

    const transmissionMsg: Message = {
      id: `msg-tx-${Date.now()}`,
      type: "transmission",
      content: "Demande transmise au service RH.",
      timestamp: new Date().toISOString(),
      author: "kalia",
      transmissionDetails: {
        requestId,
        category: conversation.category || "Administration du personnel",
        priority: "medium",
        summary: questionMsg.content as string,
        status: "pending",
      },
    };

    setConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, transmissionMsg],
    }));

    toast.success("Ticket de suivi créé avec succès !");
  };

  const handleDismiss = (messageId: string) => {
    setDismissedSuggestions((prev) => new Set([...prev, messageId]));
  };

  const handleEscalateRequest = () => {/* no-op in demo */};

  const selectedMessage = conversation.messages.find((m) => m.id === selectedMessageId);
  const nextStep = DEMO_STEPS[stepIndex];
  const isFinished = stepIndex >= DEMO_STEPS.length;

  return (
    <div className="flex flex-1 overflow-hidden">
      <main className={`flex-1 flex flex-col min-h-0 transition-all ${showContext ? "" : "mr-0"}`}>

        {/* ── Header identique à la page conversation ── */}
        <header className="border-b bg-background px-8 py-6 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">{conversation.title}</h1>
              <p className="text-sm text-muted-foreground">{conversation.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowContext(!showContext)}
                      className="gap-2"
                    >
                      {showContext ? (
                        <><EyeOff className="w-4 h-4" />Masquer le contexte</>
                      ) : (
                        <><Eye className="w-4 h-4" />Afficher le contexte</>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showContext ? "Masquer" : "Afficher"} les sources</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-hidden">
            <ScrollArea ref={scrollAreaRef} className="h-full w-full">
              <div className="max-w-4xl mx-auto px-12 py-8 space-y-8">

                {/* Message d'introduction si la démo n'a pas encore commencé */}
                {conversation.messages.length === 0 && !isRunning && (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold">
                      K
                    </div>
                    <h2 className="text-xl font-semibold">Démo — Onboarding administratif</h2>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Ce scénario illustre comment Kalia accompagne le service RH tout au long de l&apos;intégration administrative d&apos;un nouveau salarié, de la signature du contrat jusqu&apos;à la prise de poste.
                    </p>
                  </div>
                )}

                {/* Messages de la conversation */}
                {conversation.messages.map((message) => {
                  if (message.type === "question") {
                    return (
                      <QuestionMessage
                        key={message.id}
                        message={message}
                        formatDate={formatDate}
                        onClickAway={() => setShowContext(false)}
                      />
                    );
                  }

                  if (message.type === "answer" && typeof message.content === "object") {
                    const requestAlreadyCreated =
                      !!message.actions?.requestCreated ||
                      conversation.messages.some((m) => m.type === "transmission");
                    const showSuggestion =
                      message.suggestHRTransmission &&
                      !requestAlreadyCreated &&
                      !dismissedSuggestions.has(message.id);
                    const isSelected = selectedMessageId === message.id;

                    const fileInputRef = {
                      get current() { return fileInputRefs.current.get(message.id) || null; },
                      set current(value: HTMLInputElement | null) {
                        if (value) fileInputRefs.current.set(message.id, value);
                        else fileInputRefs.current.delete(message.id);
                      },
                    } as React.RefObject<HTMLInputElement>;

                    return (
                      <AnswerMessage
                        key={message.id}
                        message={message}
                        conversation={conversation}
                        formatDate={formatDate}
                        isSelected={isSelected}
                        onSelect={() => { setSelectedMessageId(message.id); setShowContext(true); }}
                        requestAlreadyCreated={requestAlreadyCreated}
                        showSuggestion={!!showSuggestion}
                        requestComment=""
                        onCommentChange={() => {}}
                        requestAttachments={[] as Attachment[]}
                        onFileSelect={() => {}}
                        onRemoveAttachment={() => {}}
                        onCreateRequest={() => handleCreateRequest(message.id)}
                        onEscalateRequest={() => handleEscalateRequest()}
                        onDismiss={() => handleDismiss(message.id)}
                        uploadingForMessage={false}
                        fileInputRef={fileInputRef}
                      />
                    );
                  }

                  if (message.type === "transmission" && message.transmissionDetails) {
                    return (
                      <TransmissionMessage
                        key={message.id}
                        message={message}
                        formatDate={formatDate}
                        onSelect={() => { setSelectedMessageId(message.id); setShowContext(true); }}
                      />
                    );
                  }

                  return null;
                })}

                {showTypingIndicator && <TypingIndicator />}
                <div />
              </div>
            </ScrollArea>
          </div>

          {/* ── Zone de saisie : bouton scénario + ChatInput ── */}
          <div className="shrink-0">
            {/* Bouton d'avancement du scénario scripté */}
            {!isFinished && (
              <div className="border-t px-8 py-3 bg-muted/30">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                  <span className="text-xs text-muted-foreground shrink-0">
                    Étape {stepIndex + 1}/{DEMO_STEPS.length}
                  </span>
                  <Button
                    size="sm"
                    onClick={advanceStep}
                    disabled={isRunning}
                    className="flex-1 max-w-sm text-xs truncate"
                    variant="outline"
                  >
                    {isRunning ? "Kalia rédige…" : `Simuler : "${nextStep?.label}"`}
                  </Button>
                </div>
              </div>
            )}

            <ChatInput
              onSend={handleSendMessage}
              placeholder={
                isFinished
                  ? "Posez une question libre à Kalia…"
                  : "Ou posez directement votre question à Kalia…"
              }
              disabled={isRunning}
              showDisclaimer={true}
            />
          </div>
        </div>
      </main>

      <ConversationContextPanel
        selectedMessage={selectedMessage}
        conversation={conversation}
        showContext={showContext}
      />
    </div>
  );
}
