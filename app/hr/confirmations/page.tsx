"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Edit, AlertCircle, Eye, User, Calendar, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useUser } from "@/contexts/user-context";
import { hasAccess } from "@/lib/permissions";
import type { Request as ApiRequest } from "@/types/request";
import type { Conversation, Message, MessageContent, Request as ConversationRequest } from "@/types/conversation";
import { updateRequestAndSyncConversation } from "@/lib/requests-storage";
import { getConversationById, saveConversation } from "@/lib/conversations-storage";

interface ConfirmationRequest extends ApiRequest {
  assignedToName?: string;
  hrConfirmationData: {
    originalMessageId: string;
    kaliaResponse: string | MessageContent;
    kaliaConfidence: number;
    questionAsked: string;
  };
}

export default function HRConfirmationsPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useUser();
  const [requests, setRequests] = useState<ConfirmationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ConfirmationRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'confirm' | 'correct'>('confirm');
  const [hrComment, setHrComment] = useState('');
  const [correctedContent, setCorrectedContent] = useState('');

  // Check permissions
  useEffect(() => {
    if (!isLoading && currentUser && !hasAccess(currentUser.role, "espace-rh")) {
      router.push("/");
    }
  }, [currentUser, isLoading, router]);

  // Load confirmation requests
  useEffect(() => {
    const loadRequests = async () => {
      try {
        // Use API route with role and category filter
        const response = await fetch("/api/conversations?role=hr&category=hr_confirmation&full=true");
        const data = await response.json();
        
        // Extract requests from conversations
        const allRequestsFromConvs: ApiRequest[] = [];
        
        for (const conv of data.conversations) {
          if (conv.request) {
            allRequestsFromConvs.push(conv.request);
          }
        }
        
        // Filter only hr_confirmation requests (should already be filtered by API, but double check)
        const confirmationRequests = allRequestsFromConvs.filter(
          (req: ApiRequest) => req.category === 'hr_confirmation'
        ) as ConfirmationRequest[];
        
        setRequests(confirmationRequests);
      } catch (error) {
        console.error("Error loading requests:", error);
        toast.error("Erreur lors du chargement des demandes");
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const pendingRequests = requests.filter(req => req.status === 'pending' || req.status === 'in_progress');
  const resolvedRequests = requests.filter(req => req.status === 'resolved');

  const handleOpenDialog = (request: ConfirmationRequest, type: 'confirm' | 'correct') => {
    setSelectedRequest(request);
    setActionType(type);
    setHrComment('');
    setCorrectedContent(
      typeof request.hrConfirmationData.kaliaResponse === 'string'
        ? request.hrConfirmationData.kaliaResponse
        : JSON.stringify(request.hrConfirmationData.kaliaResponse, null, 2)
    );
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedRequest || !currentUser) return;

    const resolvedAt = new Date().toISOString();

    const normalizeStructuredContentToText = (content: string | MessageContent): string => {
      if (typeof content === "string") return content;

      const parsed = content as MessageContent;
      if (!parsed?.intro) {
        return JSON.stringify(content, null, 2);
      }

      const sectionsText = parsed.sections
        .map((section) => {
          if (section.type === "steps" && section.items?.length) {
            const steps = section.items.map((item) => `${item.number}. ${item.text}`).join("\n");
            return `${section.title}\n${steps}`;
          }

          if (section.content) {
            return `${section.title}\n${section.content}`;
          }

          return section.title;
        })
        .join("\n\n");

      return [parsed.intro, sectionsText].filter(Boolean).join("\n\n");
    };

    const parseCorrectedContent = (value: string): string | MessageContent => {
      const trimmed = value.trim();
      if (!trimmed) return value;

      // Tentative de parsing JSON pour permettre une correction structurée.
      if (trimmed.startsWith("{")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === "object") {
            return parsed as MessageContent;
          }
        } catch {
          // Si ce n'est pas du JSON valide, on garde la valeur texte telle quelle.
        }
      }

      return value;
    };

    const originalResponse = selectedRequest.hrConfirmationData.kaliaResponse;
    const resolvedResponseContent =
      actionType === "correct" ? parseCorrectedContent(correctedContent) : originalResponse;
    const resolvedResponseText = normalizeStructuredContentToText(resolvedResponseContent);

    try {
      // 1) Persister la demande et synchroniser le champ request dans la conversation
      updateRequestAndSyncConversation(selectedRequest.id, {
        status: "resolved",
        resolvedAt,
        response: resolvedResponseText,
        assignedTo: currentUser.id,
        assignedToName: currentUser.name,
      });

      // 2) Ajouter un message RH dans la timeline de conversation
      if (selectedRequest.conversationId) {
        let conversation = getConversationById(selectedRequest.conversationId);

        // Si la conversation n'est pas encore en localStorage, la charger depuis /public/data
        // pour pouvoir ensuite la persister localement avec les mises à jour RH.
        if (!conversation) {
          // Note: on reste dans un handler synchrone côté UI; on utilise une IIFE async
          // pour éviter de réécrire toute la fonction en async.
          const syncFromFile = async (): Promise<Conversation | null> => {
            try {
              const response = await fetch(`/data/${selectedRequest.conversationId}.json`);
              if (!response.ok) return null;
              return (await response.json()) as Conversation;
            } catch {
              return null;
            }
          };

          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          syncFromFile().then((loadedConversation) => {
            if (!loadedConversation) return;
            if (!loadedConversation.request) return;

            const updatedRequest: ConversationRequest = {
              ...loadedConversation.request,
              status: "resolved",
              resolvedAt,
              response: resolvedResponseText,
              assignedTo: currentUser.id,
              assignedToName: currentUser.name,
            };

            const hrConfirmationMessage: Message = {
              id: `msg-${Date.now()}`,
              type: "hrConfirmation",
              content: resolvedResponseContent,
              timestamp: resolvedAt,
              author: "hr",
              confirmationStatus: actionType === "correct" ? "corrected" : "confirmed",
              hrConfirmation: {
                confirmedBy: currentUser.id,
                confirmedByName: currentUser.name,
                confirmedAt: resolvedAt,
                comment: hrComment.trim() || undefined,
                correctedContent: actionType === "correct" ? resolvedResponseContent : undefined,
              },
              hasNewUpdate: true,
            };

            saveConversation({
              ...loadedConversation,
              request: updatedRequest,
              messages: [...loadedConversation.messages, hrConfirmationMessage],
              updatedAt: resolvedAt,
            });
          });
        }

        if (conversation) {
          if (!conversation.request) return;

          const updatedRequest: ConversationRequest = {
            ...conversation.request,
            status: "resolved",
            resolvedAt,
            response: resolvedResponseText,
            assignedTo: currentUser.id,
            assignedToName: currentUser.name,
          };

          const hrConfirmationMessage: Message = {
            id: `msg-${Date.now()}`,
            type: "hrConfirmation",
            content: resolvedResponseContent,
            timestamp: resolvedAt,
            author: "hr",
            confirmationStatus: actionType === "correct" ? "corrected" : "confirmed",
            hrConfirmation: {
              confirmedBy: currentUser.id,
              confirmedByName: currentUser.name,
              confirmedAt: resolvedAt,
              comment: hrComment.trim() || undefined,
              correctedContent: actionType === "correct" ? resolvedResponseContent : undefined,
            },
            hasNewUpdate: true,
          };

          saveConversation({
            ...conversation,
            request: updatedRequest,
            messages: [...conversation.messages, hrConfirmationMessage],
            updatedAt: resolvedAt,
          });
        }
      }

      // 3) Mise à jour immédiate de l'UI locale
      setRequests((prev) =>
        prev.map((req) =>
          req.id === selectedRequest.id
            ? {
                ...req,
                status: "resolved" as const,
                resolvedAt,
                response: resolvedResponseText,
                assignedTo: currentUser.id,
                assignedToName: currentUser.name,
              }
            : req,
        ),
      );

      toast.success(actionType === "confirm" ? "Réponse confirmée avec succès" : "Réponse corrigée avec succès");
      setDialogOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error("Error confirming/correcting HR response:", error);
      toast.error("Erreur lors de la validation de la réponse");
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderKaliaResponse = (response: string | object) => {
    if (typeof response === 'string') {
      return <p className="text-sm">{response}</p>;
    }

    const content = response as MessageContent;
    return (
      <div className="space-y-3">
        <p className="text-sm">{content.intro}</p>
        {content.sections.map((section, idx) => (
          <div key={idx}>
            {section.type === "steps" && section.items && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{section.title}</h4>
                <ol className="space-y-1 text-sm">
                  {section.items.map((item) => (
                    <li key={item.number} className="flex gap-2">
                      <span className="font-semibold">{item.number}.</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {section.type === "info" && (
              <div className="text-sm">
                <h4 className="font-semibold">{section.title}</h4>
                <p>{section.content}</p>
              </div>
            )}
            {section.type === "warning" && (
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                <h4 className="font-semibold text-sm text-orange-900 dark:text-orange-200">{section.title}</h4>
                <p className="text-sm text-orange-800 dark:text-orange-300">{section.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading || isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des demandes...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !hasAccess(currentUser.role, "espace-rh")) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-background px-8 py-6 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Confirmations RH</h1>
            <p className="text-sm text-muted-foreground">
              Gérez les demandes de confirmation des réponses de Kalia
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {pendingRequests.length} en attente
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {resolvedRequests.length} traitées
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="pending" className="h-full flex flex-col">
          <div className="px-8 pt-6 shrink-0">
            <TabsList>
              <TabsTrigger value="pending">
                À traiter ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Traitées ({resolvedRequests.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="pending" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="px-8 py-6 space-y-4">
                  {pendingRequests.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <CheckCircle2 className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Aucune demande en attente</p>
                      </CardContent>
                    </Card>
                  ) : (
                    pendingRequests.map((request) => (
                      <Card key={request.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">{request.title}</CardTitle>
                              </div>
                              <CardDescription className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {request.userName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(request.createdAt)}
                                </span>
                                {request.conversationId && (
                                  <Button 
                                    variant="link" 
                                    size="sm" 
                                    className="h-auto p-0 text-xs"
                                    onClick={() => router.push(`/conversation/${request.conversationId}`)}
                                  >
                                    <MessageSquare className="w-3 h-3 mr-1" />
                                    Voir la conversation
                                  </Button>
                                )}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Question posée */}
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
                              Question du salarié
                            </Label>
                            <div className="bg-muted/50 rounded-lg p-3">
                              <p className="text-sm">{request.hrConfirmationData.questionAsked}</p>
                            </div>
                          </div>

                          {/* Réponse de Kalia */}
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
                              Réponse de Kalia
                            </Label>
                            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                              {renderKaliaResponse(request.hrConfirmationData.kaliaResponse)}
                            </div>
                          </div>

                          <Separator />

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button 
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleOpenDialog(request, 'confirm')}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Confirmer la réponse
                            </Button>
                            <Button 
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleOpenDialog(request, 'correct')}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Corriger et préciser
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="resolved" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="px-8 py-6 space-y-4">
                  {resolvedRequests.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Aucune demande traitée</p>
                      </CardContent>
                    </Card>
                  ) : (
                    resolvedRequests.map((request) => (
                      <Card key={request.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <CardTitle className="text-lg">{request.title}</CardTitle>
                              <CardDescription className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {request.userName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Traité par {request.assignedToName || request.assignedTo}
                                </span>
                                {request.resolvedAt && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(request.resolvedAt)}
                                  </span>
                                )}
                              </CardDescription>
                            </div>
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              Traitée
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Dialog pour confirmer ou corriger */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'confirm' ? 'Confirmer la réponse' : 'Corriger et préciser la réponse'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'confirm' 
                ? 'La réponse de Kalia sera confirmée sans modification.'
                : 'Modifiez ou complétez la réponse de Kalia pour apporter des précisions.'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {selectedRequest && (
                <>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
                      Question du salarié
                    </Label>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm">{selectedRequest.hrConfirmationData.questionAsked}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
                      Réponse originale de Kalia
                    </Label>
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      {renderKaliaResponse(selectedRequest.hrConfirmationData.kaliaResponse)}
                    </div>
                  </div>

                  {actionType === 'correct' && (
                    <div>
                      <Label htmlFor="corrected-content" className="mb-2 block">
                        Réponse corrigée / Précisions <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="corrected-content"
                        value={correctedContent}
                        onChange={(e) => setCorrectedContent(e.target.value)}
                        placeholder="Saisissez votre réponse corrigée ou vos précisions..."
                        className="min-h-[200px] font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Cette réponse sera affichée au salarié à la place de la réponse de Kalia.
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="hr-comment" className="mb-2 block">
                      Commentaire interne (optionnel)
                    </Label>
                    <Textarea
                      id="hr-comment"
                      value={hrComment}
                      onChange={(e) => setHrComment(e.target.value)}
                      placeholder="Ajoutez un commentaire pour votre suivi interne..."
                      className="min-h-[80px]"
                    />
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirm}
              className={actionType === 'confirm' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {actionType === 'confirm' ? 'Confirmer' : 'Enregistrer la correction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
