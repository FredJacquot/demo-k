"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, FileText, Calendar, CheckCircle2, AlertCircle, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useUser } from "@/contexts/user-context"
import { canViewDocument } from "@/lib/permissions"
import type { UserRole } from "@/contexts/user-context"
import { MobileSidebarTrigger } from "@/components/mobile-sidebar-trigger"
import { cn } from "@/lib/utils"

interface Document {
  id: string
  title: string
  description: string
  type: string
  category: string
  thematic: string
  status: string
  statusLabel: string
  date: string
  reference: string
  allowedRoles: UserRole[]
  content?: string // Add content field for document preview
}

export default function KnowledgeBasePage() {
  const { currentUser } = useUser()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedThematics, setSelectedThematics] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null) // Add selected document state

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await fetch("/data/knowledge-base.json")
        const data = await response.json()
        const docsWithContent = data.documents.map((doc: Document) => ({
          ...doc,
          content: generateMockContent(doc),
        }))
        setDocuments(docsWithContent)
      } catch (error) {
        console.error("Error loading documents:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDocuments()
  }, [])

  const generateMockContent = (doc: Document): string => {
    return `# ${doc.title}

**Référence:** ${doc.reference}
**Dernière mise à jour:** ${doc.date}
**Catégorie:** ${doc.category}

## Description

${doc.description}

## Contenu principal

### Article 1 - Dispositions générales

Le présent document définit les règles applicables en matière de ${doc.thematic.toLowerCase()}. Ces dispositions s'appliquent à l'ensemble des salariés et doivent être respectées conformément à la législation en vigueur.

### Article 2 - Champ d'application

Les dispositions du présent document s'appliquent à tous les collaborateurs de l'entreprise, quel que soit leur statut (CDI, CDD, alternance, stage).

### Article 3 - Modalités pratiques

#### 3.1 Procédure

Pour toute demande relative à ${doc.thematic.toLowerCase()}, le collaborateur doit :
1. Consulter le présent document
2. Vérifier son éligibilité
3. Effectuer sa demande via l'interface Kalia
4. Attendre la validation RH

#### 3.2 Délais

Les délais de traitement sont les suivants :
- Demande standard : 5 jours ouvrés
- Demande urgente : 48 heures
- Demande exceptionnelle : selon contexte

### Article 4 - Références légales

Ce document est conforme aux dispositions suivantes :
- Code du travail (articles L1234-1 à L1234-20)
- Convention collective ${doc.category}
- Accords d'entreprise en vigueur

### Article 5 - Contact

Pour toute question relative à l'application de ce document, vous pouvez :
- Utiliser le chatbot Kalia
- Contacter votre gestionnaire RH
- Consulter le service paie

---

*Document vérifié et validé par le service juridique et RH.*`
  }

  const accessibleDocuments = useMemo(() => {
    if (!currentUser) return []
    return documents.filter((doc) => canViewDocument(currentUser.role, doc.allowedRoles))
  }, [documents, currentUser])

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    accessibleDocuments.forEach((doc) => {
      counts[doc.category] = (counts[doc.category] || 0) + 1
    })
    return counts
  }, [accessibleDocuments])

  const thematicCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    accessibleDocuments.forEach((doc) => {
      counts[doc.thematic] = (counts[doc.thematic] || 0) + 1
    })
    return counts
  }, [accessibleDocuments])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    accessibleDocuments.forEach((doc) => {
      counts[doc.statusLabel] = (counts[doc.statusLabel] || 0) + 1
    })
    return counts
  }, [accessibleDocuments])

  const filteredDocuments = useMemo(() => {
    return accessibleDocuments.filter((doc) => {
      const matchesSearch =
        searchQuery === "" ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(doc.category)

      const matchesThematic = selectedThematics.length === 0 || selectedThematics.includes(doc.thematic)

      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(doc.statusLabel)

      return matchesSearch && matchesType && matchesThematic && matchesStatus
    })
  }, [accessibleDocuments, searchQuery, selectedTypes, selectedThematics, selectedStatuses])

  const toggleFilter = (value: string, selected: string[], setSelected: (values: string[]) => void) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value))
    } else {
      setSelected([...selected, value])
    }
  }

  const getStatusBadgeColor = (status: string) => {
    if (status === "up-to-date") {
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
    }
    return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar - Filters */}
      <aside className="w-64 border-r bg-background flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Filtres</h2>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Type de document */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Type de document</h3>
              <div className="space-y-3">
                {Object.entries(typeCounts).map(([type, count]) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => toggleFilter(type, selectedTypes, setSelectedTypes)}
                    />
                    <label
                      htmlFor={`type-${type}`}
                      className="text-sm flex-1 cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {type}
                    </label>
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Thématique */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Thématique</h3>
              <div className="space-y-3">
                {Object.entries(thematicCounts).map(([thematic, count]) => (
                  <div key={thematic} className="flex items-center space-x-2">
                    <Checkbox
                      id={`thematic-${thematic}`}
                      checked={selectedThematics.includes(thematic)}
                      onCheckedChange={() => toggleFilter(thematic, selectedThematics, setSelectedThematics)}
                    />
                    <label
                      htmlFor={`thematic-${thematic}`}
                      className="text-sm flex-1 cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {thematic}
                    </label>
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Statut */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Statut</h3>
              <div className="space-y-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={selectedStatuses.includes(status)}
                      onCheckedChange={() => toggleFilter(status, selectedStatuses, setSelectedStatuses)}
                    />
                    <label
                      htmlFor={`status-${status}`}
                      className="text-sm flex-1 cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {status}
                    </label>
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>

      <div className="flex-1 flex overflow-hidden">
        {/* Document list column */}
        <div
          className={cn("flex flex-col border-r bg-background transition-all", selectedDoc ? "w-[400px]" : "flex-1")}
        >
          {/* Header */}
          <div className="p-6 border-b space-y-4 shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">Base de connaissances</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredDocuments.length} document{filteredDocuments.length !== 1 ? "s" : ""}
                </p>
              </div>
              <MobileSidebarTrigger />
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Document list */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4 border rounded-lg animate-pulse">
                      <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">Aucun document trouvé</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocuments.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border transition-all",
                        "hover:bg-accent hover:border-primary/50",
                        selectedDoc?.id === doc.id && "bg-accent border-primary",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm mb-1 line-clamp-1">{doc.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{doc.description}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {doc.category}
                            </Badge>
                            {doc.status === "up-to-date" ? (
                              <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                                <CheckCircle2 className="w-3 h-3 mr-1" />À jour
                              </Badge>
                            ) : (
                              <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {doc.statusLabel}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {selectedDoc && (
          <div className="flex-1 flex flex-col bg-background">
            {/* Preview header */}
            <div className="p-6 border-b">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{selectedDoc.title}</h2>
                  <p className="text-sm text-muted-foreground">{selectedDoc.description}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedDoc(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Document metadata */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{selectedDoc.date}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <span>Réf: {selectedDoc.reference}</span>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {selectedDoc.category}
                </Badge>
                <Badge variant="secondary">{selectedDoc.thematic}</Badge>
                <Badge className={getStatusBadgeColor(selectedDoc.status)}>{selectedDoc.statusLabel}</Badge>
              </div>
            </div>

            {/* Document content */}
            <ScrollArea className="flex-1">
              <div className="p-6 prose prose-sm max-w-none dark:prose-invert">
                {selectedDoc.content?.split("\n").map((line, idx) => {
                  if (line.startsWith("# ")) {
                    return (
                      <h1 key={idx} className="text-2xl font-bold mt-0 mb-4">
                        {line.substring(2)}
                      </h1>
                    )
                  } else if (line.startsWith("## ")) {
                    return (
                      <h2 key={idx} className="text-xl font-semibold mt-6 mb-3">
                        {line.substring(3)}
                      </h2>
                    )
                  } else if (line.startsWith("### ")) {
                    return (
                      <h3 key={idx} className="text-lg font-semibold mt-4 mb-2">
                        {line.substring(4)}
                      </h3>
                    )
                  } else if (line.startsWith("#### ")) {
                    return (
                      <h4 key={idx} className="text-base font-semibold mt-3 mb-2">
                        {line.substring(5)}
                      </h4>
                    )
                  } else if (line.startsWith("**") && line.endsWith("**")) {
                    return (
                      <p key={idx} className="font-semibold my-2">
                        {line.substring(2, line.length - 2)}
                      </p>
                    )
                  } else if (line.startsWith("- ")) {
                    return (
                      <li key={idx} className="ml-4">
                        {line.substring(2)}
                      </li>
                    )
                  } else if (line.match(/^\d+\. /)) {
                    return (
                      <li key={idx} className="ml-4">
                        {line.substring(line.indexOf(". ") + 2)}
                      </li>
                    )
                  } else if (line.startsWith("---")) {
                    return <hr key={idx} className="my-6 border-border" />
                  } else if (line.startsWith("*") && line.endsWith("*")) {
                    return (
                      <p key={idx} className="italic text-sm text-muted-foreground my-2">
                        {line.substring(1, line.length - 1)}
                      </p>
                    )
                  } else if (line.trim() === "") {
                    return <div key={idx} className="h-2" />
                  } else {
                    return (
                      <p key={idx} className="my-2">
                        {line}
                      </p>
                    )
                  }
                })}
              </div>
            </ScrollArea>

            {/* Footer actions */}
            <div className="p-6 border-t bg-muted/20">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Document officiel vérifié par le service RH</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Télécharger PDF
                  </Button>
                  <Button size="sm">Poser une question à Kalia</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
