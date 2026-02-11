"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ShieldAlert, CheckCircle2, Clock, AlertCircle, Send, FileText, Bot } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { canViewRequest } from "@/lib/permissions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import type { Request } from "@/types/request"
import type { Message } from "@/types/conversation"
import { MobileSidebarTrigger } from "@/components/mobile-sidebar-trigger"
import { DataTable } from "@/components/tracking/data-table"
import { columns, type ColumnActionHandlers } from "@/components/tracking/columns"

export default function TrackingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentUser, isLoading: userLoading } = useUser()

  const [allRequests, setAllRequests] = useState<Request[]>([])
  const [usersData, setUsersData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [hrResponse, setHrResponse] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])

  const selectedRequest = allRequests.find((req) => req.id === selectedRequestId) || null

  useEffect(() => {
    if (
      !userLoading &&
      currentUser &&
      currentUser.role !== "hr" &&
      currentUser.role !== "drh" &&
      currentUser.role !== "payroll"
    ) {
      router.push("/")
      toast.error("Accès refusé", {
        description: "Cette page est réservée aux RH, DRH et Payroll",
      })
    }
  }, [currentUser, userLoading, router])

  useEffect(() => {
    const status = searchParams.get("status")
    if (status) {
      setStatusFilter(status)
    }
  }, [searchParams])

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return

      if (currentUser.role !== "hr" && currentUser.role !== "drh" && currentUser.role !== "payroll") {
        return
      }

      try {
        const usersResponse = await fetch("/data/users.json")
        const usersData = await usersResponse.json()
        setUsersData(usersData.users)

        const { getRequests } = await import("@/lib/requests-storage")
        const localStorageRequests = getRequests()

        const apiRequests: Request[] = []
        try {
          const response = await fetch(`/api/conversations?role=${currentUser.role}&full=true`)
          const data = await response.json()

          for (const conv of data.conversations) {
            if (conv.request) {
              apiRequests.push(conv.request)
            }
          }
        } catch (apiError) {
          console.log("API not available, using only localStorage")
        }

        const allRequestsMap = new Map<string, Request>()
        localStorageRequests.forEach((req) => allRequestsMap.set(req.id, req))
        apiRequests.forEach((req) => {
          if (!allRequestsMap.has(req.id)) {
            allRequestsMap.set(req.id, req)
          }
        })

        const allCombinedRequests = Array.from(allRequestsMap.values())
        const userRequests = allCombinedRequests.filter((req: Request) =>
          canViewRequest(currentUser.role, currentUser.id, req.userId),
        )

        setAllRequests(userRequests)
      } catch (error) {
        console.error("Error loading requests:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentUser])

  useEffect(() => {
    const loadConversation = async () => {
      if (!selectedRequest || !selectedRequest.conversationId) {
        setConversationMessages([])
        return
      }

      try {
        console.log("[Tracking] Loading conversation:", selectedRequest.conversationId)

        // Try to load from localStorage first
        const { getConversationById } = await import("@/lib/conversations-storage")
        let conversation = getConversationById(selectedRequest.conversationId)

        // If not in localStorage, try to fetch from public/data
        if (!conversation) {
          try {
            const response = await fetch(`/data/${selectedRequest.conversationId}.json`)
            if (response.ok) {
              conversation = await response.json()
            }
          } catch (fetchError) {
            console.error("Error fetching conversation from file:", fetchError)
          }
        }

        if (!conversation) {
          console.warn("Conversation not found:", selectedRequest.conversationId)
          setConversationMessages([])
          return
        }

        // Use the full messages directly
        setConversationMessages(conversation.messages)
        console.log("[Tracking] Real conversation loaded:", conversation.messages.length, "messages")
      } catch (error) {
        console.error("Error loading conversation:", error)
        setConversationMessages([])
      }
    }

    loadConversation()
  }, [selectedRequest])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "in_progress":
        return <AlertCircle className="w-4 h-4" />
      case "resolved":
        return <CheckCircle2 className="w-4 h-4" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente"
      case "in_progress":
        return "En cours"
      case "resolved":
        return "Résolue"
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-300"
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-300"
      case "medium":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "low":
        return "bg-gray-100 text-gray-700 border-gray-300"
      default:
        return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  const handleTakeCharge = async () => {
    if (!selectedRequest || !currentUser) return

    setIsSubmitting(true)
    try {
      const { updateRequestAndSyncConversation } = await import("@/lib/requests-storage")
      updateRequestAndSyncConversation(selectedRequest.id, {
        status: "in_progress",
        assignedTo: currentUser.id,
        assignedToName: currentUser.name,
      })

      const updatedRequests = allRequests.map((req) =>
        req.id === selectedRequest.id
          ? { ...req, status: "in_progress" as const, assignedTo: currentUser.id, assignedToName: currentUser.name }
          : req,
      )
      setAllRequests(updatedRequests)

      toast.success("Demande prise en charge")
    } catch (error) {
      toast.error("Erreur", {
        description: "Impossible de prendre en charge la demande",
        })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResolve = async () => {
    if (!selectedRequest || !hrResponse.trim()) {
      toast.error("Veuillez saisir une réponse")
      return
    }

    setIsSubmitting(true)
    try {
      const resolvedAt = new Date().toISOString()

      const { updateRequestAndSyncConversation } = await import("@/lib/requests-storage")
      updateRequestAndSyncConversation(selectedRequest.id, {
        status: "resolved",
        response: hrResponse,
        resolvedAt: resolvedAt,
      })

      const updatedRequests = allRequests.map((req) =>
        req.id === selectedRequest.id
          ? {
              ...req,
              status: "resolved" as const,
              response: hrResponse,
              resolvedAt: resolvedAt,
            }
          : req,
      )
      setAllRequests(updatedRequests)

      toast.success("Demande résolue")
      setHrResponse("")
    } catch (error) {
      toast.error("Erreur", {
        description: "Impossible de résoudre la demande",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReopen = async () => {
    if (!selectedRequest) return

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      const updatedRequests = allRequests.map((req) =>
        req.id === selectedRequest.id
          ? {
              ...req,
              status: "in_progress" as const,
              response: null,
              resolvedAt: null,
            }
          : req,
      )
      setAllRequests(updatedRequests)

      toast.success("Demande rouverte")
    } catch (error) {
      toast.error("Erreur", {
        description: "Impossible de rouvrir la demande",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const actionHandlers: ColumnActionHandlers = {
    onViewDetails: (request) => {
      setSelectedRequestId(request.id)
      setHrResponse(request.response || "")
    },
    onTakeCharge: handleTakeCharge,
    onResolve: handleResolve,
    onReopen: handleReopen,
    onViewConversation: (conversationId) => {
      router.push(`/conversation/${conversationId}`)
    },
  }

  if (!currentUser || (currentUser.role !== "hr" && currentUser.role !== "drh" && currentUser.role !== "payroll")) {
    return null
  }

  if (loading || userLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Suivi des demandes</h1>
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                <ShieldAlert className="w-3 h-3 mr-1" />
                RH
              </Badge>
            </div>
            <MobileSidebarTrigger />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Suivi des demandes</h1>
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
              <ShieldAlert className="w-3 h-3 mr-1" />
              RH
            </Badge>
          </div>
          <MobileSidebarTrigger />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`${selectedRequest ? "w-[60%]" : "w-full"} border-r flex flex-col transition-all`}>
          <div className="flex-1 overflow-auto p-4">
            <DataTable
              columns={columns}
              data={allRequests}
              onRowClick={(request) => {
                setSelectedRequestId(request.id)
                setHrResponse(request.response || "")
              }}
              meta={{ actionHandlers, usersData }}
              initialStatusFilter={statusFilter}
            />
          </div>
        </div>

        {selectedRequest && (
          <div className="w-[40%] flex flex-col min-h-0">
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
                  {selectedRequest.status === "pending" && (
                    <Button onClick={handleTakeCharge} disabled={isSubmitting} size="sm">
                      Prendre en charge
                    </Button>
                  )}
                  {selectedRequest.status === "resolved" && (
                    <Button onClick={handleReopen} disabled={isSubmitting} variant="outline" size="sm">
                      Rouvrir
                    </Button>
                  )}
                  {selectedRequest.conversationId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => actionHandlers.onViewConversation?.(selectedRequest.conversationId!)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Conversation
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 px-2">
              <div className="p-6 space-y-4">
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
                          {/* User message: simple text */}
                          {isUserMessage && (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.content as string}
                            </p>
                          )}

                          {/* Assistant message: structured content */}
                          {!isUserMessage && (
                            <div className="space-y-3">
                              {/* Intro text */}
                              {typeof message.content === "string" ? (
                                <p className="text-sm leading-relaxed">{message.content}</p>
                              ) : typeof message.content === "object" && "intro" in message.content ? (
                                <>
                                  <p className="text-sm leading-relaxed">{message.content.intro}</p>
                                  
                                  {/* Sections */}
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

                              {/* Metadata footer */}
                              {(message.traceability) && (
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
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  Demande créée
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <h3 className="text-base font-semibold mb-2">{selectedRequest.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{selectedRequest.reformulatedRequest}</p>
                </div>

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
              </div>
            </ScrollArea>

            {selectedRequest.status === "in_progress" && (
              <div className="border-t p-4 shrink-0 px-2">
                <Label className="text-sm font-medium mb-2 block">Répondre au collaborateur</Label>
                <div className="flex gap-2">
                  <Textarea
                    value={hrResponse}
                    onChange={(e) => setHrResponse(e.target.value)}
                    placeholder="Saisissez votre réponse..."
                    className="min-h-[80px] resize-none"
                  />
                  <Button
                    onClick={handleResolve}
                    disabled={isSubmitting || !hrResponse.trim()}
                    className="self-end"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
