import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Edit2, Sparkles } from "lucide-react";
import type { Message, Conversation } from "@/types/conversation";

interface HRConfirmationMessageProps {
  message: Message;
  conversation: Conversation;
  formatDate: (dateString: string) => string;
  onSelect: () => void;
}

export function HRConfirmationMessage({ message, conversation, formatDate, onSelect }: HRConfirmationMessageProps) {
  if (!message.hrConfirmation) return null;

  // Ne pas afficher si la requête est en statut "pending"
  if (conversation.request?.status === "pending") {
    return null;
  }
  
  const isConfirmed = message.confirmationStatus === 'confirmed';
  const isCorrected = message.confirmationStatus === 'corrected';
  
  return (
    <div 
      className="flex gap-3 mr-24 cursor-pointer group"
      onClick={onSelect}
    >
      <Avatar className="flex-shrink-0">
        <AvatarFallback className="bg-green-600 text-white">HR</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">
            {formatDate(message.timestamp)}
          </div>
          {message.hasNewUpdate && (
            <Badge className="bg-blue-500 text-white text-[10px] px-2 py-0 h-5 animate-pulse">
              <Sparkles className="w-3 h-3 mr-1" />
              Nouveau
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isConfirmed && (
            <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Confirmé par {message.hrConfirmation.confirmedByName}
            </Badge>
          )}
          {isCorrected && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-800">
              <Edit2 className="w-3 h-3 mr-1" />
              Corrigé par {message.hrConfirmation.confirmedByName}
            </Badge>
          )}
        </div>

        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-5 space-y-4">
            {isCorrected && message.hrConfirmation.correctedContent && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">
                      Réponse initiale de Kalia
                    </div>
                    <Separator className="flex-1" />
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 opacity-60">
                    {typeof message.content === 'object' && 'intro' in message.content ? (
                      <div className="space-y-2 text-sm">
                        <p>{message.content.intro}</p>
                        {message.content.sections.map((section, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground">
                            • {section.title}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm">{message.content as string}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase">
                      Réponse corrigée par les RH
                    </div>
                    <Separator className="flex-1" />
                  </div>
                  <div className="space-y-3">
                    {typeof message.hrConfirmation.correctedContent === 'object' && 'intro' in message.hrConfirmation.correctedContent ? (
                      <>
                        <p className="text-sm leading-relaxed">
                          {message.hrConfirmation.correctedContent.intro}
                        </p>
                        {message.hrConfirmation.correctedContent.sections.map((section, idx) => (
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
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-sm">{String(message.hrConfirmation.correctedContent)}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {isConfirmed && !isCorrected && (
              <div className="space-y-3">
                {typeof message.content === 'string' ? (
                  <p className="text-sm leading-relaxed">
                    {message.content}
                  </p>
                ) : typeof message.content === 'object' && 'intro' in message.content ? (
                  <>
                    <p className="text-sm leading-relaxed">
                      {message.content.intro}
                    </p>
                    {message.content.sections.map((section, idx) => (
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
                      </div>
                    ))}
                  </>
                ) : null}
              </div>
            )}

            {message.hrConfirmation.comment && (
              <>
                <Separator />
                <div className="bg-green-50/50 dark:bg-green-950/20 rounded-lg p-3">
                  <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                    Note des RH
                  </div>
                  <p className="text-sm text-green-900 dark:text-green-200">
                    {message.hrConfirmation.comment}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
