"use client";

import { CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/contexts/user-context";
import type { Message, Conversation } from "@/types/conversation";

interface ConversationContextPanelProps {
  selectedMessage: Message | undefined;
  conversation: Conversation | null;
  showContext: boolean;
}

export function ConversationContextPanel({ selectedMessage, conversation, showContext }: ConversationContextPanelProps) {
  const { currentUser } = useUser();
  
  if (!showContext) return null;

  // Calculs dynamiques
  const questionCount = conversation?.messages.filter(m => m.type === "question").length || 0;
  const sourcesCount = selectedMessage?.traceability?.sources.length || 0;
  
  // Traduction du rôle
  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      employee: "Employé",
      hr: "Gestionnaire RH",
      drh: "DRH",
      payroll: "Responsable Paie"
    };
    return roles[role] || role;
  };

  // Badge de complexité
  const getComplexityBadge = (complexity?: string) => {
    switch (complexity) {
      case "low":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">Faible</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">Moyenne</Badge>;
      case "high":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">Élevée</Badge>;
      default:
        return <Badge variant="outline">Non définie</Badge>;
    }
  };

  return (
    <aside className="w-96 border-l bg-background flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold mb-1">Sources</h2>
        <p className="text-xs text-muted-foreground">
          Sources de Kalia
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sources" className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b bg-transparent h-auto p-0">
          <TabsTrigger 
            value="sources" 
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Sources
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="sources" className="p-6 space-y-4 mt-0">
            {selectedMessage?.traceability?.sources.length ? (
              selectedMessage.traceability.sources.map((source) => (
                <Card key={source.id}>
                  <CardHeader className="pb-3">
                    <Badge variant="outline" className="w-fit mb-2 bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                      {source.name}
                    </Badge>
                    <CardTitle className="text-sm">{source.article}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      {source.title}
                    </CardDescription>
                  </CardHeader>
                  <Separator />
                  <CardFooter className="flex items-center justify-between text-xs pt-3">
                    <span className="text-muted-foreground">
                      Vérifié le {new Date(source.verifiedDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Validée</span>
                    </div>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Aucune source disponible pour ce message
              </div>
            )}
          </TabsContent>

          <TabsContent value="traceability" className="p-6 mt-0">
            {selectedMessage ? (
              <div className="space-y-3">
                {/* Timeline pour messages Answer avec traçabilité */}
                {selectedMessage.type === "answer" && selectedMessage.traceability && (
                  <>
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div className="w-px h-full bg-border mt-2" />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-sm font-medium text-foreground mb-1">Analyse de l&apos;intention</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {selectedMessage.traceability.context}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(selectedMessage.timestamp).toLocaleString("fr-FR", { 
                            day: "numeric", 
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div className="w-px h-full bg-border mt-2" />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-sm font-medium text-foreground mb-1">Recherche documentaire</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {selectedMessage.traceability.sources.length} source{selectedMessage.traceability.sources.length > 1 ? 's' : ''} trouvée{selectedMessage.traceability.sources.length > 1 ? 's' : ''}: {selectedMessage.traceability.sources.map(s => s.name).join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Validé par {selectedMessage.traceability.validatedBy}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground mb-1">Génération de la réponse</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Synthèse validée
                        </p>
                        {selectedMessage.suggestsHumanReview && (
                          <Badge variant="outline" className="mt-2 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                            Révision humaine suggérée
                          </Badge>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Timeline pour messages HR Confirmation */}
                {selectedMessage.type === "hrConfirmation" && selectedMessage.hrConfirmation && (
                  <>
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-green-600" />
                        <div className="w-px h-full bg-border mt-2" />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-sm font-medium text-foreground mb-1">Réception de la demande</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Demande reçue et assignée au service RH pour traitement
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(selectedMessage.timestamp).toLocaleString("fr-FR", { 
                            day: "numeric", 
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-green-600" />
                        <div className="w-px h-full bg-border mt-2" />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-sm font-medium text-foreground mb-1">Analyse par les RH</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {selectedMessage.confirmationStatus === "corrected" 
                            ? "Analyse approfondie et correction de la réponse initiale" 
                            : "Vérification et validation de la réponse de Kalia"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Par {selectedMessage.hrConfirmation.confirmedByName}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground mb-1">
                          {selectedMessage.confirmationStatus === "corrected" ? "Réponse corrigée" : "Réponse confirmée"}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {selectedMessage.confirmationStatus === "corrected" 
                            ? "Réponse personnalisée fournie avec précisions complémentaires" 
                            : "La réponse initiale de Kalia a été validée comme exacte"}
                        </p>
                        {selectedMessage.hrConfirmation.comment && (
                          <div className="mt-2 p-2 bg-green-50/50 dark:bg-green-950/20 rounded text-xs text-muted-foreground italic">
                            &quot;{selectedMessage.hrConfirmation.comment}&quot;
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Timeline pour messages Transmission */}
                {selectedMessage.type === "transmission" && selectedMessage.transmissionDetails && (
                  <>
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        <div className="w-px h-full bg-border mt-2" />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-sm font-medium text-foreground mb-1">Création de la demande</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Demande créée automatiquement par Kalia
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          ID: {selectedMessage.transmissionDetails.requestId}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        <div className="w-px h-full bg-border mt-2" />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-sm font-medium text-foreground mb-1">Classification</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Catégorie: {selectedMessage.transmissionDetails.category}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Priorité: {selectedMessage.transmissionDetails.priority}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground mb-1">Statut actuel</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {selectedMessage.transmissionDetails.status === "pending" 
                            ? "En attente de traitement par le service RH" 
                            : "Demande envoyée"}
                        </p>
                        <Badge variant="outline" className="mt-2 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                          {selectedMessage.transmissionDetails.status === "pending" ? "En attente" : "Envoyée"}
                        </Badge>
                      </div>
                    </div>
                  </>
                )}

                {/* Message par défaut si pas de traçabilité */}
                {!selectedMessage.traceability && selectedMessage.type !== "hrConfirmation" && selectedMessage.type !== "transmission" && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <p className="mb-2">Aucune information de traçabilité disponible</p>
                    <p className="text-xs">Ce message ne contient pas de données de traçabilité détaillées</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Sélectionnez un message pour voir sa traçabilité
              </div>
            )}
          </TabsContent>

          <TabsContent value="context" className="p-6 mt-0">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Informations utilisateur</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nom</span>
                    <span className="font-medium text-foreground">{currentUser?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rôle</span>
                    <span className="font-medium text-foreground">{currentUser ? getRoleLabel(currentUser.role) : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Département</span>
                    <span className="font-medium text-foreground">{currentUser?.department || "N/A"}</span>
                  </div>
                  {currentUser?.company && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entreprise</span>
                      <span className="font-medium text-foreground">{currentUser.company}</span>
                    </div>
                  )}
                  {currentUser?.convention && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Convention</span>
                      <span className="font-medium text-foreground">{currentUser.convention}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-foreground mb-2">Contexte de la conversation</p>
                <div className="space-y-2 text-sm">
                  {conversation?.category && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Catégorie</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                        {conversation.category}
                      </Badge>
                    </div>
                  )}
                  {conversation?.complexity && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Complexité</span>
                      {getComplexityBadge(conversation.complexity)}
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Questions posées</span>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-muted-foreground" />
                      <span className="font-medium text-foreground">{questionCount}</span>
                    </div>
                  </div>
                  {conversation?.hasLinkedRequest && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Demande liée</span>
                      <span className="font-medium text-foreground text-xs">{conversation.hasLinkedRequest}</span>
                    </div>
                  )}
                  {conversation?.tags && conversation.tags.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-muted-foreground">Tags</span>
                      <div className="flex flex-wrap gap-1">
                        {conversation.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {conversation?.createdAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Métadonnées</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Créée le</span>
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-foreground">
                            {new Date(conversation.createdAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>
                      {conversation.updatedAt && conversation.updatedAt !== conversation.createdAt && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Dernière mise à jour</span>
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-foreground">
                              {new Date(conversation.updatedAt).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  );
}
