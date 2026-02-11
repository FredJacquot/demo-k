"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useUser } from "@/contexts/user-context";
import { canViewConversation } from "@/lib/permissions";
import { ConversationContextPanel } from "@/components/conversation/context-panel";
import { ChatInput } from "@/components/conversation/chat-input";
import { 
  QuestionMessage, 
  AnswerMessage, 
  TransmissionMessage, 
  HRConfirmationMessage,
  TypingIndicator 
} from "@/components/conversation/messages";
import type { Message, Conversation, Request } from "@/types/conversation";
import type { Attachment } from "@/types/request";
import { getConversationById } from "@/lib/conversations-storage";
import { MobileSidebarTrigger } from "@/components/mobile-sidebar-trigger";

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isLoading: userLoading } = useUser();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContext, setShowContext] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  
  // Request form states (per message)
  const [requestComments, setRequestComments] = useState<Map<string, string>>(new Map());
  const [requestAttachments, setRequestAttachments] = useState<Map<string, Attachment[]>>(new Map());
  const [uploadingForMessage, setUploadingForMessage] = useState<string | null>(null);
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Mock mode state
  const mockMode = searchParams.has('mock');
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const viewport = scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]');
    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const loadConversation = async () => {
      if (!currentUser || userLoading) return;
      
      const { id } = await params;
      
      try {
        // First, try to load from localStorage (for newly created conversations)
        let data = getConversationById(id);
        
        // If not in localStorage, try to fetch from public/data
        if (!data) {
          const response = await fetch(`/data/${id}.json`);
          if (!response.ok) throw new Error("Conversation not found");
          data = await response.json();
        }
        
        if (!data) {
          throw new Error("Conversation not found");
        }
        
        if (!canViewConversation(currentUser.role, currentUser.id, data.userId)) {
          setAccessDenied(true);
          setTimeout(() => router.push("/"), 100);
          return;
        }
        
        setConversation(data);
      } catch (error) {
        console.error("Error loading conversation:", error);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [params, currentUser, userLoading, router]);

  useEffect(() => {
    if (conversation?.messages && !loading) {
      const timer = setTimeout(() => scrollToBottom(), 100);
      return () => clearTimeout(timer);
    }
  }, [conversation?.messages, loading]);

  // Générer les réponses Kalia pour les nouvelles conversations en mode mock
  useEffect(() => {
    const generateInitialKaliaResponse = async () => {
      if (!conversation || !currentUser || !mockMode) return;
      
      // Vérifier si c'est une nouvelle conversation (seulement 1 message user)
      if (conversation.messages.length !== 1 || conversation.messages[0].type !== "question") {
        return;
      }
      
      const userMessage = conversation.messages[0];
      
      // Afficher le spinner
      setShowTypingIndicator(true);
      setTimeout(() => scrollToBottom(), 100);
      
      // Générer les réponses Kalia en arrière-plan
      const { generateKaliaResponse } = await import('@/lib/kalia-mock');
      const kaliaMessages = await generateKaliaResponse(
        userMessage.content as string,
        [],
        conversation.id
      );
      
      // Attendre 3-5 secondes pour simuler la génération
      const delay = 3000 + Math.random() * 2000;
      
      setTimeout(async () => {
        // Masquer le spinner
        setShowTypingIndicator(false);
        
        // Ajouter les messages Kalia
        const { saveConversation } = await import('@/lib/conversations-storage');
        const updatedConversation = {
          ...conversation,
          messages: [...conversation.messages, ...kaliaMessages],
          updatedAt: new Date().toISOString()
        };
        
        saveConversation(updatedConversation);
        setConversation(updatedConversation);
        
        // Scroll vers le bas
        setTimeout(() => scrollToBottom(), 100);
      }, delay);
    };
    
    generateInitialKaliaResponse();
  }, [conversation, mockMode, currentUser]);

  // Initialize selectedMessageId with the first Kalia message
  useEffect(() => {
    if (conversation?.messages && !selectedMessageId) {
      const firstKaliaMessage = conversation.messages.find(
        (m) => m.type === "answer" || m.type === "hrConfirmation"
      );
      if (firstKaliaMessage) {
        setSelectedMessageId(firstKaliaMessage.id);
      }
    }
  }, [conversation?.messages, selectedMessageId]);

  const selectedMessage = conversation?.messages.find((m) => m.id === selectedMessageId);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper functions for file upload
  const handleFileSelect = async (messageId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentUser) return;

    const currentAttachments = requestAttachments.get(messageId) || [];
    
    // Vérifier le nombre maximum de fichiers
    if (currentAttachments.length + files.length > 5) {
      toast.error("Maximum 5 fichiers autorisés");
      return;
    }

    setUploadingForMessage(messageId);

    try {
      const formData = new FormData();
      formData.append("userId", currentUser.id);
      
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de l'upload");
        return;
      }

      const data = await response.json();
      const newAttachments = new Map(requestAttachments);
      newAttachments.set(messageId, [...currentAttachments, ...data.files]);
      setRequestAttachments(newAttachments);
      toast.success(`${data.files.length} fichier(s) ajouté(s)`);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Erreur lors de l'upload des fichiers");
    } finally {
      setUploadingForMessage(null);
      // Reset file input
      const input = fileInputRefs.current.get(messageId);
      if (input) {
        input.value = "";
      }
    }
  };

  const handleRemoveAttachment = (messageId: string, attachmentId: string) => {
    const currentAttachments = requestAttachments.get(messageId) || [];
    const newAttachments = new Map(requestAttachments);
    newAttachments.set(messageId, currentAttachments.filter((att) => att.id !== attachmentId));
    setRequestAttachments(newAttachments);
  };

  const handleCreateRequest = async (messageId: string) => {
    if (!conversation || !currentUser) return;

    // Get comment and attachments for this message
    const comment = requestComments.get(messageId) || "";
    const attachments = requestAttachments.get(messageId);

    // Find the question message for context
    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    const questionMsg = conversation.messages.slice(0, messageIndex).reverse().find(m => m.type === "question");
    
    if (!questionMsg) return;

    // In mock mode, create real request in localStorage
    if (mockMode) {
      const { generateRequestId, saveRequest } = await import('@/lib/requests-storage');
      const { saveConversation } = await import('@/lib/conversations-storage');
      
      const requestId = generateRequestId();
      
      // Create the request object with comment and attachments
      const request: Request = {
        id: requestId,
        conversationId: conversation.id,
        userId: currentUser.id,
        userName: currentUser.name,
        createdAt: new Date().toISOString(),
        status: "pending",
        priority: "medium",
        category: "autre",
        title: conversation.title,
        reformulatedRequest: questionMsg.content as string,
        includeFullConversation: true,
        userComment: comment,
        assignedTo: null,
        response: null,
        resolvedAt: null,
        attachments: attachments
      };
      
      // Save request to localStorage
      saveRequest(request);
      
      // Create transmission message
      const transmissionMessage: Message = {
        id: `msg-${conversation.messages.length + 1}`,
        type: "transmission",
        content: "J'ai bien transmis votre demande au service RH.",
        timestamp: new Date().toISOString(),
        author: "kalia",
        transmissionDetails: {
          requestId: requestId,
          category: conversation.category || "Information RH",
          priority: "medium",
          summary: questionMsg.content as string,
          status: "pending"
        }
      };

      // Update conversation with transmission message and linked request
      const updatedConversation = {
        ...conversation,
        messages: [...conversation.messages, transmissionMessage],
        request: request,
        updatedAt: new Date().toISOString()
      };
      
      saveConversation(updatedConversation);
      setConversation(updatedConversation);
      
      toast.success("Demande créée avec succès !");
    } else {
      // Normal mode without backend
      const requestId = `REQ-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      
      const transmissionMessage: Message = {
        id: `msg-${conversation.messages.length + 1}`,
        type: "transmission",
        content: "J'ai bien transmis votre demande au service RH.",
        timestamp: new Date().toISOString(),
        author: "kalia",
        transmissionDetails: {
          requestId: requestId,
          category: "Congés",
          priority: "medium",
          summary: `${questionMsg.content} suite à ma conversation avec Kalia`,
          status: "pending"
        }
      };

      setConversation({
        ...conversation,
        messages: [...conversation.messages, transmissionMessage]
      });
    }
  };

  const handleDismiss = (messageId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, messageId]));
  };

  const handleSendNewMessage = async (message: string) => {
    if (!currentUser || !conversation) return;

    if (mockMode) {
      // MODE MOCK : Générer réponses Kalia avec temporisation
      const { generateKaliaResponse } = await import('@/lib/kalia-mock');
      const { saveConversation } = await import('@/lib/conversations-storage');
      
      // Créer le message user
      const userMessage: Message = {
        id: `msg-${conversation.messages.length + 1}`,
        type: "question",
        content: message,
        timestamp: new Date().toISOString(),
        author: "user"
      };
      
      // Ajouter immédiatement le message utilisateur
      const conversationWithUserMessage = {
        ...conversation,
        messages: [...conversation.messages, userMessage],
        updatedAt: new Date().toISOString()
      };
      setConversation(conversationWithUserMessage);
      
      // Afficher le spinner de typing
      setShowTypingIndicator(true);
      
      // Scroll pour montrer le spinner
      setTimeout(() => scrollToBottom(), 100);
      
      // Générer les réponses Kalia en arrière-plan
      const kaliaMessages = await generateKaliaResponse(message, conversation.messages, conversation.id);
      
      // Attendre 3-5 secondes aléatoires pour simuler la génération
      const delay = 3000 + Math.random() * 2000; // Entre 3000ms et 5000ms
      
      setTimeout(() => {
        // Masquer le spinner
        setShowTypingIndicator(false);
        
        // Ajouter les messages Kalia
        const updatedConversation = {
          ...conversationWithUserMessage,
          messages: [...conversationWithUserMessage.messages, ...kaliaMessages],
          updatedAt: new Date().toISOString()
        };
        
        saveConversation(updatedConversation);
        setConversation(updatedConversation);
        
        // Scroll vers le bas
        setTimeout(() => scrollToBottom(), 100);
        
      }, delay);
    } 
  };

  if (loading || userLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-4xl space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-4 mt-8">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Accès refusé</h2>
          <p className="text-muted-foreground mb-4">Vous n&apos;avez pas l&apos;autorisation de voir cette conversation.</p>
          <p className="text-sm text-muted-foreground">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground">Conversation non trouvée</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <main className={`flex-1 flex flex-col min-h-0 transition-all ${showContext ? "" : "mr-0"}`}>
        <header className="border-b bg-background px-8 py-6 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">{conversation.title}</h1>
              <p className="text-sm text-muted-foreground">{conversation.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <MobileSidebarTrigger />
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
                        <>
                          <EyeOff className="w-4 h-4" />
                          Masquer le contexte
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Afficher le contexte
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showContext ? "Masquer" : "Afficher"} les sources et la traçabilité</p>
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
                {conversation.messages.map((message) => {
                  // QUESTION MESSAGE
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

                  // ANSWER MESSAGE
                  if (message.type === "answer" && typeof message.content === "object") {
                    const requestAlreadyCreated =
                      !!message.actions?.requestCreated ||
                      conversation.messages.some((m) => m.type === "transmission");
                    const showSuggestion = message.suggestHRTransmission && !requestAlreadyCreated && !dismissedSuggestions.has(message.id);
                    const isSelected = selectedMessageId === message.id;
                    
                    // Create a ref callback object that mimics RefObject
                    const fileInputRef = {
                      get current() {
                        return fileInputRefs.current.get(message.id) || null;
                      },
                      set current(value: HTMLInputElement | null) {
                        if (value) {
                          fileInputRefs.current.set(message.id, value);
                        } else {
                          fileInputRefs.current.delete(message.id);
                        }
                      }
                    } as React.RefObject<HTMLInputElement>;

                    return (
                      <AnswerMessage
                        key={message.id}
                        message={message}
                        conversation={conversation}
                        formatDate={formatDate}
                        isSelected={isSelected}
                        onSelect={() => {
                          setSelectedMessageId(message.id);
                          setShowContext(true);
                        }}
                        requestAlreadyCreated={requestAlreadyCreated}
                        showSuggestion={!!showSuggestion}
                        requestComment={requestComments.get(message.id) || ""}
                        onCommentChange={(value) => {
                          const newComments = new Map(requestComments);
                          newComments.set(message.id, value);
                          setRequestComments(newComments);
                        }}
                        requestAttachments={requestAttachments.get(message.id) || []}
                        onFileSelect={(e) => handleFileSelect(message.id, e)}
                        onRemoveAttachment={(attachmentId) => handleRemoveAttachment(message.id, attachmentId)}
                        onCreateRequest={() => handleCreateRequest(message.id)}
                        onDismiss={() => handleDismiss(message.id)}
                        uploadingForMessage={uploadingForMessage === message.id}
                        fileInputRef={fileInputRef}
                      />
                    );
                  }

                  // TRANSMISSION MESSAGE
                  if (message.type === "transmission" && message.transmissionDetails) {
                    return (
                      <TransmissionMessage
                        key={message.id}
                        message={message}
                        formatDate={formatDate}
                        onSelect={() => {
                          setSelectedMessageId(message.id);
                          setShowContext(true);
                        }}
                      />
                    );
                  }

                  // HR CONFIRMATION MESSAGE
                  if (message.type === "hrConfirmation" && message.hrConfirmation) {
                    return (
                      <HRConfirmationMessage
                        key={message.id}
                        message={message}
                        conversation={conversation}
                        formatDate={formatDate}
                        onSelect={() => {
                          setSelectedMessageId(message.id);
                          setShowContext(true);
                        }}
                      />
                    );
                  }

                  return null;
                })}
                
                {/* Typing indicator for Kalia */}
                {mockMode && showTypingIndicator && <TypingIndicator />}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>
          
          <div className="shrink-0">
            <ChatInput 
              onSend={handleSendNewMessage}
              placeholder="Posez votre question à Kalia..."
              disabled={!mockMode}
              showDisclaimer={true}
            />
          </div>
        </div>
      </main>

      <ConversationContextPanel selectedMessage={selectedMessage} conversation={conversation} showContext={showContext} />
    </div>
  );
}
