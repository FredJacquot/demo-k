import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Forward } from "lucide-react";
import type { Message } from "@/types/conversation";

interface RequestPromptMessageProps {
  message: Message;
  formatDate: (dateString: string) => string;
}

export function RequestPromptMessage({ message, formatDate }: RequestPromptMessageProps) {
  return (
    <div className="flex gap-3 mr-24">
      <Avatar className="flex-shrink-0">
        <AvatarFallback className="bg-blue-600 text-white">K</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-3">
        <div className="text-xs text-muted-foreground">{formatDate(message.timestamp)}</div>

        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 !py-2">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Forward className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <p className="text-sm text-purple-900 dark:text-purple-200 leading-relaxed">
                {typeof message.content === "string"
                  ? message.content
                  : "Souhaitez-vous que je crée une demande RH à partir de cette conversation ?"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}