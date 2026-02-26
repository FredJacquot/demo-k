import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThumbsUp, AlertCircle, FileText, Send, CheckCircle2, Forward, Paperclip, X, Image as ImageIcon, FileSpreadsheet } from "lucide-react";
import type { Message, Conversation } from "@/types/conversation";
import type { Attachment } from "@/types/request";
import { useState } from "react";

interface AnswerMessageProps {
  message: Message;
  conversation: Conversation;
  formatDate: (dateString: string) => string;
  isSelected: boolean;
  onSelect: () => void;
  requestAlreadyCreated: boolean;
  showSuggestion: boolean;
  requestComment: string;
  onCommentChange: (value: string) => void;
  requestAttachments: Attachment[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onCreateRequest: () => void;
  onEscalateRequest: () => void;
  onDismiss: () => void;
  uploadingForMessage: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function AnswerMessage({
  message,
  conversation,
  formatDate,
  isSelected,
  onSelect,
  requestAlreadyCreated,
  showSuggestion,
  requestComment,
  onCommentChange,
  requestAttachments,
  onFileSelect,
  onRemoveAttachment,
  onCreateRequest,
  onEscalateRequest,
  onDismiss,
  uploadingForMessage,
  fileInputRef,
}: AnswerMessageProps) {
  if (typeof message.content !== "object") return null;

  const [feedbackVote, setFeedbackVote] = useState<"up" | "down" | null>(null);

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
      className="flex gap-3 mr-24 cursor-pointer group"
      onClick={onSelect}
    >
      <Avatar className="flex-shrink-0">
        <AvatarFallback className="bg-blue-600 text-white">K</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-3">
        <div className="text-xs text-muted-foreground">
          {formatDate(message.timestamp)}
        </div>

        <Card className={`rounded-tl transition-all !py-2 ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'group-hover:shadow-md'}`}>
          <CardContent className="p-0">
            <div className="px-5 py-4 space-y-4">
              {/* Minimalist header with metadata */}
              <div className="flex items-center justify-between border-b pb-3 -mt-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Thème : {conversation.category || "Information RH"}</span>
                  {(message.confirmationStatus === 'confirmed' || message.hrConfirmation) && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600 dark:text-blue-400">Validé par RH</span>
                    </>
                  )}
                </div>
              </div>

              <p className="text-sm leading-relaxed">
                {message.content.intro}
              </p>

              {message.content.sections.map((section, idx) => (
                <div key={idx}>
                  {section.type === "steps" && section.items && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm">{section.title}</h3>
                      <ol className="space-y-2">
                        {section.items.map((item) => (
                          <li key={item.number} className="flex gap-3 text-sm">
                            <span className="font-semibold">{item.number}.</span>
                            <div className="flex-1">
                              <span>{item.text}</span>
                              {item.reference && (
                                <span className="text-muted-foreground ml-1">
                                  ({item.reference})
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {(section.type === "info" || section.type === "warning") && (
                    <div className="text-sm">
                      <h4 className="font-semibold">{section.title}</h4>
                      <p>{section.content}</p>
                    </div>
                  )}
{/* 
                  {section.type === "warning" && (
                    <Alert variant="destructive" className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <AlertTitle className="text-orange-900 dark:text-orange-200">
                        {section.title}
                      </AlertTitle>
                      <AlertDescription className="text-orange-800 dark:text-orange-300">
                        {section.content}
                      </AlertDescription>
                    </Alert>
                  )} */}
                </div>
              ))}

              {message.traceability && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="w-3 h-3" />
                  <button className="hover:underline">
                    {message.traceability.sources.length} sources utilisées
                  </button>
                </div>
              )}
            </div>

            {showSuggestion && message.suggestHRTransmission && (
              <>
                <Separator className="my-0" />
                <div className="px-5 pb-5 pt-4">
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <Forward className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-purple-900 dark:text-purple-200 leading-relaxed">
                        {message.suggestHRTransmission.prompt}
                      </p>
                    </div>

                    {/* Comment field */}
                    <div 
                      className="space-y-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className="text-xs font-medium text-purple-900 dark:text-purple-200">
                        Commentaire additionnel (optionnel)
                      </label>
                      <textarea
                        className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-purple-200 dark:border-purple-700 bg-white dark:bg-purple-950/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ajoutez des détails supplémentaires..."
                        value={requestComment}
                        onChange={(e) => onCommentChange(e.target.value)}
                      />
                    </div>

                    {/* File upload section */}
                    <div 
                      className="space-y-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-purple-900 dark:text-purple-200">
                          Pièces jointes (optionnel)
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingForMessage || requestAttachments.length >= 5}
                        >
                          <Paperclip className="w-3 h-3 mr-1" />
                          Joindre un fichier
                        </Button>
                      </div>

                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                        onChange={onFileSelect}
                        className="hidden"
                      />

                      {/* Attachments list */}
                      {requestAttachments.length > 0 && (
                        <div className="space-y-2 p-2 bg-white/50 dark:bg-purple-950/20 rounded-md border border-purple-200 dark:border-purple-700">
                          {requestAttachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between p-2 bg-white dark:bg-purple-950/30 rounded hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {getFileIcon(attachment.type)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate text-purple-900 dark:text-purple-200">
                                    {attachment.originalName || attachment.name}
                                  </p>
                                  <p className="text-[10px] text-purple-700 dark:text-purple-400">
                                    {formatFileSize(attachment.size)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => onRemoveAttachment(attachment.id)}
                                className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900 rounded transition-colors"
                                disabled={uploadingForMessage}
                              >
                                <X className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              </button>
                            </div>
                          ))}
                          <p className="text-[10px] text-purple-700 dark:text-purple-400 text-center pt-1">
                            {requestAttachments.length}/5 fichiers
                          </p>
                        </div>
                      )}

                      {requestAttachments.length === 0 && (
                        <p className="text-xs text-purple-700/70 dark:text-purple-400/70 text-center py-2 border border-dashed border-purple-200 dark:border-purple-700 rounded">
                          Formats: PDF, PNG, JPG, DOC, DOCX, XLS, XLSX • Max 10MB
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 pt-2">
                      <Button 
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateRequest();
                        }}
                        disabled={uploadingForMessage}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {message.suggestHRTransmission.actions.primary.label}
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-purple-200 dark:border-purple-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismiss();
                        }}
                      >
                        {message.suggestHRTransmission.actions.secondary.label}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <TooltipProvider>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-2 border transition-colors ${
                    feedbackVote === "up"
                      ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800"
                      : "border-transparent"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFeedbackVote((prev) => (prev === "up" ? null : "up"));
                  }}
                >
                  <ThumbsUp className="w-4 h-4" />
                  Utile
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cette réponse vous a été utile</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-2 border transition-colors ${
                    feedbackVote === "down"
                      ? "bg-red-100 text-red-700 border-red-300 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800"
                      : "border-transparent"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFeedbackVote((prev) => (prev === "down" ? null : "down"));
                  }}
                >
                  <ThumbsUp className="w-4 h-4 rotate-180" />
                  Pas utile
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cette réponse nécessite des améliorations</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEscalateRequest();
                  }}
                  disabled={requestAlreadyCreated}
                >
                  <Send className="w-4 h-4" />
                  {requestAlreadyCreated ? "Demande créée" : "Créer une demande"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Créer une demande RH depuis cette réponse</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
