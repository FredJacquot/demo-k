"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { getConversations, deleteConversation } from "@/lib/conversations-storage";
import { DataTable } from "@/components/conversation/data-table";
import { columns, ConversationColumn, ColumnActionHandlers } from "@/components/conversation/columns";
import { toast } from "sonner";
import { MobileSidebarTrigger } from "@/components/mobile-sidebar-trigger";

export default function HistoriquePage() {
  const router = useRouter();
  const { currentUser, isLoading: userLoading } = useUser();
  const [conversations, setConversations] = useState<ConversationColumn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      if (!currentUser) return;
      
      try {
        // 1. Load conversations from localStorage
        const localConversations = getConversations()
          .filter(conv => conv.userId === currentUser.id)
          .map(conv => ({
            ...conv,
            isFromLocalStorage: true,
            createdAt: conv.createdAt || new Date().toISOString()
          }));
        
        // 2. Load conversations from API (static files) with full details
        const response = await fetch(`/api/conversations?userId=${currentUser.id}&full=true`);
        const data = await response.json();
        const apiConversations = data.conversations || [];
        
        // 3. Merge both lists, avoiding duplicates (localStorage takes precedence)
        const localIds = new Set(localConversations.map(c => c.id));
        const mergedConversations = [
          ...localConversations,
          ...apiConversations.filter((conv: ConversationColumn) => !localIds.has(conv.id))
        ];
        
        // 4. Sort by createdAt descending (most recent first)
        mergedConversations.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
        
        setConversations(mergedConversations);
      } catch (error) {
        console.error("Error loading conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [currentUser]);

  const handleViewConversation = (conversationId: string) => {
    router.push(`/conversation/${conversationId}`);
  };

  const handleDeleteConversation = (conversationId: string) => {
    try {
      deleteConversation(conversationId);
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      toast.success("Conversation supprimée", {
        description: "La conversation a été supprimée avec succès",
      });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Erreur", {
        description: "Impossible de supprimer la conversation",
      });
    }
  };

  const handleRowClick = (conversation: ConversationColumn) => {
    router.push(`/conversation/${conversation.id}`);
  };

  // Action handlers for the data table
  const actionHandlers: ColumnActionHandlers = {
    onViewConversation: handleViewConversation,
    onDeleteConversation: handleDeleteConversation,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header fixe */}
      <div className="p-8 pb-4 shrink-0">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">Historique des conversations</h1>
            <p className="text-muted-foreground mt-1">
              Retrouvez toutes vos conversations passées
            </p>
          </div>
          <MobileSidebarTrigger />
        </div>
      </div>

      {/* Zone scrollable avec le tableau */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        {(loading || userLoading) ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border rounded-lg p-6 animate-pulse"
              >
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune conversation trouvée</p>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={conversations}
            onRowClick={handleRowClick}
            meta={{ actionHandlers }}
          />
        )}
      </div>
    </div>
  );
}
