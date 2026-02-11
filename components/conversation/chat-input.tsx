"use client";

import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, X, FileText, Image as ImageIcon, FileSpreadsheet } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUser } from "@/contexts/user-context";
import { toast } from "sonner";
import type { Attachment } from "@/types/request";

interface ChatInputProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
  placeholder?: string;
  disabled?: boolean;
  showDisclaimer?: boolean;
}

export function ChatInput({ 
  onSend, 
  placeholder = "Posez votre question à Kalia...", 
  disabled = false,
  showDisclaimer = true 
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useUser();

  const handleSend = () => {
    if ((!inputValue.trim() && attachments.length === 0) || disabled) return;
    onSend(inputValue, attachments.length > 0 ? attachments : undefined);
    setInputValue("");
    setAttachments([]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentUser) return;

    // Vérifier le nombre maximum de fichiers
    if (attachments.length + files.length > 5) {
      toast.error("Maximum 5 fichiers autorisés");
      return;
    }

    setUploading(true);

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
      setAttachments((prev) => [...prev, ...data.files]);
      toast.success(`${data.files.length} fichier(s) ajouté(s)`);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Erreur lors de l'upload des fichiers");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <ImageIcon className="w-4 h-4" />;
    } else if (type.includes("spreadsheet") || type.includes("excel")) {
      return <FileSpreadsheet className="w-4 h-4" />;
    } else {
      return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative bg-gradient-to-t from-background via-background to-background/0 pt-0 pb-4">
      <div className="max-w-3xl mx-auto px-4">
        {/* Attachments display */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm"
              >
                {getFileIcon(attachment.type)}
                <span className="max-w-[150px] truncate">{attachment.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                </span>
                <button
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  className="ml-1 hover:bg-background rounded p-0.5 transition-colors"
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="relative flex-1 rounded-3xl border border-border/50 bg-background shadow-lg shadow-black/5 px-4 py-2.5 transition-all duration-200 focus-within:border-primary/50 focus-within:shadow-xl focus-within:shadow-black/10">
            <Textarea
              placeholder={placeholder}
              className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent px-3 pt-2 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 shadow-none"
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || uploading}
            />
          </div>
          
          {/* File attachment button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="flex-shrink-0 rounded-2xl h-11 w-11"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || uploading || attachments.length >= 5}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Joindre des fichiers (max 5)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
            onChange={handleFileSelect}
            className="hidden"
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  className="flex-shrink-0 rounded-2xl h-11 w-11 transition-all duration-200"
                  onClick={handleSend}
                  disabled={(!inputValue.trim() && attachments.length === 0) || disabled || uploading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Envoyer votre question</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {showDisclaimer && (
          <p className="text-xs text-muted-foreground/70 mt-3 text-center font-medium">
            Toutes les réponses sont vérifiées et sourcées • RGPD
          </p>
        )}
      </div>
    </div>
  );
}
