"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/contexts/user-context";
import { DataTable } from "@/components/tracking/data-table";
import { columns, ColumnActionHandlers } from "@/components/tracking/columns";
import type { Request } from "@/types/request";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, Clock, AlertCircle, Bot, Paperclip, Download, Image as ImageIcon, FileSpreadsheet, X } from "lucide-react";
import { MobileSidebarTrigger } from "@/components/mobile-sidebar-trigger";
import type { Message } from "@/types/conversation";

function RequestsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const { currentUser, isLoading: userLoading } = useUser();
  
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [users, setUsers] = useState<Array<{id: string; name: string; email: string; role: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [initialStatusFilter, setInitialStatusFilter] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);

  const selectedRequest = allRequests.find((req) => req.id === selectedRequestId) || null;

  // Set initial filter from URL
  useEffect(() => {
    if (filter === "pending") {
      setInitialStatusFilter("pending");
    } else if (filter === "in-progress") {
      setInitialStatusFilter("in_progress");
    } else if (filter === "resolved") {
      setInitialStatusFilter("resolved");
    }
  }, [filter]);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      
      try {
        // Load users
        const usersResponse = await fetch('/data/users.json');
        const usersData = await usersResponse.json();
        setUsers(usersData.users);
        
        // Load requests from localStorage
        const { getRequests } = await import('@/lib/requests-storage');
        const localStorageRequests = getRequests();
        
        // Filter requests based on current user
        const userRequests = localStorageRequests.filter(req => req.userId === currentUser.id);
        
        // Try to load from API as well
        const apiRequests: Request[] = [];
        try {
          const response = await fetch(`/api/conversations?userId=${currentUser.id}&full=true`);
          const data = await response.json();
          
          // Extract requests from conversations
          for (const conv of data.conversations) {
            if (conv.request) {
              apiRequests.push(conv.request);
            }
          }
        } catch (apiError) {
          console.log("API not available, using only localStorage");
        }
        
        // Merge localStorage and API requests, removing duplicates by ID
        const allRequestsMap = new Map<string, Request>();
        
        // Add localStorage requests first
        userRequests.forEach(req => allRequestsMap.set(req.id, req));
        
        // Add API requests (will not override if same ID exists)
        apiRequests.forEach(req => {
          if (!allRequestsMap.has(req.id)) {
            allRequestsMap.set(req.id, req);
          }
        });
        
        setAllRequests(Array.from(allRequestsMap.values()));
      } catch (error) {
        console.error("Error loading requests:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Load real conversation messages when a request is selected
  useEffect(() => {
    const loadConversation = async () => {
      if (!selectedRequest || !selectedRequest.conversationId) {
        setConversationMessages([]);
        return;
      }

      try {
        const { getConversationById } = await import("@/lib/conversations-storage");
        let conversation = getConversationById(selectedRequest.conversationId);

        if (!conversation) {
          try {
            const response = await fetch(`/data/${selectedRequest.conversationId}.json`);
            if (response.ok) {
              conversation = await response.json();
            }
          } catch (fetchError) {
            console.error("Error fetching conversation from file:", fetchError);
          }
        }

        if (!conversation) {
          setConversationMessages([]);
          return;
        }

        setConversationMessages(conversation.messages);
      } catch (error) {
        console.error("Error loading conversation:", error);
        setConversationMessages([]);
      }
    };

    loadConversation();
  }, [selectedRequest]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "in_progress":
        return <AlertCircle className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "in_progress":
        return "En cours";
      case "resolved":
        return "Résolue";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "medium":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "low":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const handleViewConversation = (conversationId: string) => {
    router.push(`/conversation/${conversationId}`);
  };

  const handleToggleRequestPanel = (requestId: string) => {
    setSelectedRequestId((currentId) => (currentId === requestId ? null : requestId));
  };

  // Action handlers for the data table (employees can only view details and conversation)
  const actionHandlers: ColumnActionHandlers = {
    onViewDetails: (request) => {
      handleToggleRequestPanel(request.id);
    },
    onViewConversation: handleViewConversation,
    // No HR actions for employees: onTakeCharge, onResolve, onReopen
  };

  if (loading || userLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold">Mes demandes</h1>
              <p className="text-muted-foreground mt-1">
                Suivez l&apos;état de vos demandes RH
              </p>
            </div>
            <MobileSidebarTrigger />
          </div>
        </div>
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
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mes demandes</h1>
            <p className="text-sm text-muted-foreground">
              Suivez l&apos;état de vos demandes RH
            </p>
          </div>
          <MobileSidebarTrigger />
        </div>
      </div>

      {/* Split layout: Table + Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Table on the left */}
        <div className={`${selectedRequest ? "w-[60%]" : "w-full"} border-r flex flex-col transition-all`}>
          <div className="flex-1 overflow-auto p-4">
            <DataTable 
              columns={columns} 
              data={allRequests}
              onRowClick={(request) => handleToggleRequestPanel(request.id)}
              meta={{ actionHandlers, users }}
              initialStatusFilter={initialStatusFilter}
            />
          </div>
        </div>

        {/* Panel on the right */}
        {selectedRequest && (
          <div className="w-[40%] flex flex-col min-h-0">
            {/* Panel Header */}
            <div className="border-b p-4 shrink-0 px-2">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold">{selectedRequest.id}</h2>
                    <Badge variant="outline" className={getPriorityColor(selectedRequest.priority)}>
                      {selectedRequest.priority}
                    </Badge>
                    <Badge variant="outline">
                      {getStatusIcon(selectedRequest.status)}
                      <span className="ml-1">{getStatusLabel(selectedRequest.status)}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.userName} • {formatDate(selectedRequest.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedRequestId(null)}
                    aria-label="Fermer le panneau"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Panel Content */}
            <ScrollArea className="flex-1 min-h-0 px-2">
              <div className="p-6 space-y-4">
                {/* Conversation History */}
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Historique de la conversation
                </div>
                {conversationMessages.map((message, index) => {
                  const isUserMessage = message.author === "user";

                  return (
                  <div key={index} className={`flex ${isUserMessage ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`${isUserMessage ? "max-w-[75%] mr-2" : "max-w-[78%]"} ${isUserMessage ? "items-end" : "items-start"} flex flex-col gap-2 overflow-hidden`}
                    >
                      {!isUserMessage && (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                              <Bot className="w-3 h-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">
                            {message.author === "hr" ? "RH" : "Kalia"}
                          </span>
                        </div>
                      )}

                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          isUserMessage
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-background border shadow-sm rounded-tl-sm"
                        }`}
                      >
                        {isUserMessage && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content as string}
                          </p>
                        )}

                        {!isUserMessage && (
                          <div className="space-y-3">
                            {typeof message.content === "string" ? (
                              <p className="text-sm leading-relaxed">{message.content}</p>
                            ) : typeof message.content === "object" && "intro" in message.content ? (
                              <>
                                <p className="text-sm leading-relaxed">{message.content.intro}</p>

                                {message.content.sections.map((section, idx) => (
                                  <div key={idx} className="space-y-2">
                                    {section.type === "steps" && section.items && (
                                      <div>
                                        <h4 className="text-sm font-semibold mb-2">{section.title}</h4>
                                        <ol className="space-y-1.5 text-sm">
                                          {section.items.map((item) => (
                                            <li key={item.number} className="flex gap-2">
                                              <span className="font-semibold text-primary">{item.number}.</span>
                                              <span>{item.text}</span>
                                            </li>
                                          ))}
                                        </ol>
                                      </div>
                                    )}

                                    {section.type === "info" && (
                                      <div className="bg-blue-50 dark:bg-blue-950/20 rounded p-2.5 border border-blue-200 dark:border-blue-800">
                                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                                          {section.title}
                                        </h4>
                                        <p className="text-sm text-blue-800 dark:text-blue-300">{section.content}</p>
                                      </div>
                                    )}

                                    {section.type === "warning" && (
                                      <div className="bg-orange-50 dark:bg-orange-950/20 rounded p-2.5 border border-orange-200 dark:border-orange-800">
                                        <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-200 mb-1">
                                          ⚠️ {section.title}
                                        </h4>
                                        <p className="text-sm text-orange-800 dark:text-orange-300">{section.content}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </>
                            ) : null}

                            {message.traceability && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {message.traceability.sources.length} sources
                              </span>
                            </div>
                          </div>
                        )}
                          </div>
                        )}
                      </div>

                      {isUserMessage && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{selectedRequest.userName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}

                <Separator className="my-6" />

                {/* Request Created */}
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  Demande créée
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <h3 className="text-base font-semibold mb-2">{selectedRequest.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{selectedRequest.reformulatedRequest}</p>
                </div>

                {/* User Comment */}
                {selectedRequest.userComment && (
                  <div className="flex justify-end">
                    <div className="max-w-[76%] overflow-hidden">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3">
                        <p className="text-sm leading-relaxed">{selectedRequest.userComment}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 justify-end">
                        <span className="text-xs text-muted-foreground">{selectedRequest.userName}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Paperclip className="w-3 h-3" />
                        Pièces jointes ({selectedRequest.attachments.length})
                      </div>
                      <div className="space-y-2">
                        {selectedRequest.attachments.map((attachment) => {
                          const getFileIcon = (type: string) => {
                            if (type.startsWith("image/")) {
                              return <ImageIcon className="w-4 h-4 text-blue-600" />;
                            } else if (type.includes("spreadsheet") || type.includes("excel")) {
                              return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
                            } else if (type.includes("pdf")) {
                              return <FileText className="w-4 h-4 text-red-600" />;
                            } else {
                              return <FileText className="w-4 h-4 text-gray-600" />;
                            }
                          };

                          const formatFileSize = (bytes: number) => {
                            if (bytes < 1024) return bytes + " B";
                            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
                            return (bytes / (1024 * 1024)).toFixed(1) + " MB";
                          };

                          return (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border hover:bg-muted transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {getFileIcon(attachment.type)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {attachment.originalName || attachment.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(attachment.size)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="flex-shrink-0"
                                asChild
                              >
                                <a
                                  href={attachment.url}
                                  download={attachment.originalName || attachment.name}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Preview images */}
                      {selectedRequest.attachments.some(att => att.type.startsWith("image/")) && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {selectedRequest.attachments
                            .filter(att => att.type.startsWith("image/"))
                            .map((attachment) => (
                              <a
                                key={attachment.id}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block overflow-hidden rounded-lg border hover:opacity-80 transition-opacity"
                              >
                                <img
                                  src={attachment.url}
                                  alt={attachment.originalName || attachment.name}
                                  className="w-full h-32 object-cover"
                                />
                              </a>
                            ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* HR Response if resolved */}
                {selectedRequest.status === "resolved" && selectedRequest.response && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex justify-start">
                      <div className="max-w-[76%] overflow-hidden">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs bg-purple-100 text-purple-700">RH</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">Réponse RH</span>
                        </div>
                        <div className="bg-background border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                          <p className="text-sm leading-relaxed">{selectedRequest.response}</p>
                        </div>
                        {selectedRequest.resolvedAt && (
                          <div className="flex items-center gap-2 mt-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-muted-foreground">
                              Répondu le {formatDate(selectedRequest.resolvedAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Status messages for pending/in_progress */}
                {selectedRequest.status === "pending" && (
                  <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-muted-foreground italic">
                      En attente de prise en charge par les RH
                    </p>
                  </div>
                )}

                {selectedRequest.status === "in_progress" && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-muted-foreground italic">
                      Votre demande est en cours de traitement
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RequestsPage() {
  return (
    <Suspense fallback={<div className="p-8">Chargement...</div>}>
      <RequestsPageContent />
    </Suspense>
  );
}
