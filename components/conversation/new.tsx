"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, FileText, HelpCircle, ClipboardList, AlertCircle, TrendingUp, Clock } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChatInput } from "@/components/conversation/chat-input";
import { saveConversation } from "@/lib/conversations-storage";
import { MobileSidebarTrigger } from "@/components/mobile-sidebar-trigger";
import { getRequests } from "@/lib/requests-storage";
import { Badge } from "@/components/ui/badge";

export default function NewChat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useUser();
  const [showCards, setShowCards] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Détecter le mode mock via le paramètre URL
  const mockMode = searchParams.has('mock');

  const handleSendMessage = async (message: string, attachments?: import('@/types/request').Attachment[]) => {
    if (!currentUser) return;

    // Masquer les cartes
    setShowCards(false);
    setIsCreating(true);

    try {
      if (mockMode) {
        // MODE MOCK : Créer la conversation avec uniquement le message utilisateur
        const { generateConversationId } = await import('@/lib/conversations-storage');
        const conversationId = generateConversationId();
        
        const userMessage: import('@/types/conversation').Message = {
          id: "msg-1",
          type: "question",
          content: message,
          timestamp: new Date().toISOString(),
          author: "user",
          attachments: attachments
        };
        
        // Trouver le scénario correspondant pour obtenir le titre et la catégorie
        const { matchScenario } = await import('@/lib/kalia-mock');
        const scenario = await matchScenario(message);
        
        const conversation: import('@/types/conversation').Conversation = {
          id: conversationId,
          userId: currentUser.id,
          title: scenario.conversation.title,
          subtitle: scenario.conversation.subtitle,
          messages: [userMessage],
          category: scenario.category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Sauvegarder dans localStorage
        saveConversation(conversation);
        
        // Rediriger vers la conversation avec le paramètre ?mock
        setTimeout(() => {
          router.push(`/conversation/${conversation.id}?mock`);
        }, 300);
      } else {
        // MODE NORMAL : Appeler l'API
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser.id,
            message: message,
            attachments: attachments,
          }),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la création de la conversation");
        }

        const data = await response.json();
        
        if (data.success && data.conversation) {
          // Save to localStorage to simulate backend storage
          saveConversation(data.conversation);
          
          // Redirect to the new conversation page
          setTimeout(() => {
            router.push(`/conversation/${data.conversationId}`);
          }, 300);
        }
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      setIsCreating(false);
      setShowCards(true);
    }
  };

  const handleQuickQuestion = (question: string) => {
    // Use the same logic as sending a message
    handleSendMessage(question);
  };

  // Charger les demandes pour afficher les badges
  const [pendingCount, setPendingCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);

  useEffect(() => {
    if (currentUser && (currentUser.role === "hr" || currentUser.role === "drh")) {
      const requests = getRequests();
      const pending = requests.filter(r => r.status === "pending").length;
      const urgent = requests.filter(r => 
        (r.priority === "urgent" || r.priority === "high") && r.status !== "resolved"
      ).length;
      const inProgress = requests.filter(r => r.status === "in_progress").length;
      
      setPendingCount(pending);
      setUrgentCount(urgent);
      setInProgressCount(inProgress);
    }

    // Écouter les changements de demandes
    const handleRequestsUpdate = () => {
      if (currentUser && (currentUser.role === "hr" || currentUser.role === "drh")) {
        const requests = getRequests();
        const pending = requests.filter(r => r.status === "pending").length;
        const urgent = requests.filter(r => 
          (r.priority === "urgent" || r.priority === "high") && r.status !== "resolved"
        ).length;
        const inProgress = requests.filter(r => r.status === "in_progress").length;
        
        setPendingCount(pending);
        setUrgentCount(urgent);
        setInProgressCount(inProgress);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("requestsUpdated", handleRequestsUpdate);
      return () => window.removeEventListener("requestsUpdated", handleRequestsUpdate);
    }
  }, [currentUser]);

  const quickQuestions = [
    "Je veux demander une formation, comment faire ?",
    "J'ai une erreur sur mon bulletin de paie, que dois-je faire ?",
    "Quelle est la procédure pour un arrêt maladie ?",
    "Comment poser les congés payés ?"
  ];

  // Cartes contextualisées selon le rôle
  const getContextualCards = () => {
    if (!currentUser) return [];

    // Pour les RH et DRH
    if (currentUser.role === "hr" || currentUser.role === "drh") {
      const allRequests = getRequests();
      const totalCount = allRequests.length;
      
      return [
        {
          icon: ClipboardList,
          title: "Nouvelles demandes",
          description: "Voir et traiter les demandes en attente",
          badge: pendingCount > 0 ? pendingCount : null,
          badgeVariant: "default" as const,
          onClick: () => router.push("/tracking?status=pending"),
        },
        {
          icon: AlertCircle,
          title: "Demandes urgentes",
          description: "Demandes nécessitant une attention immédiate",
          badge: urgentCount > 0 ? urgentCount : null,
          badgeVariant: "destructive" as const,
          onClick: () => handleQuickQuestion("Affiche-moi un résumé des demandes urgentes et prioritaires à traiter"),
        },
        {
          icon: Clock,
          title: "Demandes en cours",
          description: "Suivre l'avancement des demandes",
          badge: inProgressCount > 0 ? inProgressCount : null,
          badgeVariant: "secondary" as const,
          onClick: () => handleQuickQuestion("Quelles sont les demandes en cours de traitement et leur statut ?"),
        },
        {
          icon: TrendingUp,
          title: "Analyse des demandes",
          description: "Statistiques et tendances globales",
          badge: totalCount > 0 ? totalCount : null,
          badgeVariant: "outline" as const,
          onClick: () => handleQuickQuestion("Donne-moi une analyse des demandes de cette semaine avec les tendances et statistiques"),
        },
        {
          icon: Database,
          title: "Base de connaissances",
          description: "Explorez notre documentation RH complète",
          badge: null,
          onClick: () => router.push("/knowledge-base"),
        },
        {
          icon: HelpCircle,
          title: "Questions fréquentes",
          description: "Suggestions de questions courantes",
          badge: null,
          isDropdown: true,
        },
      ];
    }

    // Pour les employés (cartes par défaut)
    return [
      {
        icon: FileText,
        title: "Mes demandes",
        description: "Consultez et gérez toutes vos demandes RH & Paie",
        badge: null,
        onClick: () => router.push("/requests/"),
      },
      {
        icon: Database,
        title: "Base de connaissances",
        description: "Explorez notre documentation RH complète",
        badge: null,
        onClick: () => router.push("/knowledge-base"),
      },
      {
        icon: HelpCircle,
        title: "Questions fréquentes",
        description: "Suggestions de questions courantes",
        badge: null,
        isDropdown: true,
      },
    ];
  };

  const contextualCards = getContextualCards();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Mobile Sidebar Trigger */}
      <div className="md:hidden p-4 border-b flex justify-end">
        <MobileSidebarTrigger />
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-4xl space-y-8 flex flex-col flex-1 justify-center py-12">
          {/* Message de bienvenue */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="flex aspect-square size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-2xl shadow-lg">
                K
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">
              Bonjour {currentUser?.name?.split(" ")[0] || ""}  👋
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Je suis Kalia, votre assistant RH & Paie. Vous pouvez explorer rapidement ces sujets ou bien tout simplement me poser vos questions.
            </p>
          </div>

          {/* Cartes d'accès rapide contextualisées */}
          <div 
            className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-500 ${
              showCards ? "opacity-100 scale-100" : "opacity-0 scale-95 h-0 overflow-hidden"
            }`}
          >
            {contextualCards.map((card, index) => {
              const Icon = card.icon;
              
              if (card.isDropdown) {
                return (
                  <DropdownMenu key={index}>
                    <DropdownMenuTrigger asChild>
                      <Card className="cursor-pointer hover:shadow-lg hover:border-primary transition-all">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Icon className="h-5 w-5 text-primary" />
                            {card.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription>
                            {card.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80">
                      {quickQuestions.map((question, qIndex) => (
                        <DropdownMenuItem 
                          key={qIndex}
                          onClick={() => handleQuickQuestion(question)}
                          className="cursor-pointer"
                        >
                          {question}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              return (
                <Card 
                  key={index}
                  className="cursor-pointer hover:shadow-lg hover:border-primary transition-all"
                  onClick={card.onClick}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        {card.title}
                      </div>
                      {card.badge !== null && (
                        <Badge variant={card.badgeVariant}>
                          {card.badge}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      {card.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Input de chat intégré dans l'espace principal */}
          <div className="mt-auto pt-8">
            <ChatInput 
              onSend={handleSendMessage}
              placeholder="Posez votre question ici..."
              disabled={isCreating}
              showDisclaimer={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
