import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, ExternalLink } from "lucide-react";
import type { Message } from "@/types/conversation";

interface TransmissionMessageProps {
  message: Message;
  formatDate: (dateString: string) => string;
  onSelect: () => void;
}

export function TransmissionMessage({ message, formatDate, onSelect }: TransmissionMessageProps) {
  if (!message.transmissionDetails) return null;

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
        
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 !py-2 ">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  Demande transmise au service RH
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
                  {message.content as string}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-700 dark:text-blue-400 font-medium">📋 Numéro :</span>
                    <span className="text-blue-900 dark:text-blue-200 font-semibold">
                      {message.transmissionDetails.requestId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-700 dark:text-blue-400 font-medium">📂 Catégorie :</span>
                    <Badge variant="outline" className="bg-white dark:bg-blue-900">
                      {message.transmissionDetails.category}
                    </Badge>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Résumé de la demande :</span>
                  <p className="text-sm text-blue-800 dark:text-blue-300 italic">
                    &quot;{message.transmissionDetails.summary}&quot;
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                    En attente de traitement
                  </Badge>
                  <Button variant="link" size="sm" className="h-auto p-0 text-blue-600 dark:text-blue-400">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Voir la demande
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
