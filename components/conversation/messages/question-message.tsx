import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { Message } from "@/types/conversation";

interface QuestionMessageProps {
  message: Message;
  formatDate: (dateString: string) => string;
  onClickAway?: () => void;
}

export function QuestionMessage({ message, formatDate, onClickAway }: QuestionMessageProps) {
  return (
    <div 
      className="flex justify-end gap-3 ml-24 cursor-pointer"
      onClick={onClickAway}
    >
      <div className="flex flex-col items-end max-w-xl">
        <div className="text-xs text-muted-foreground mb-2">
          {formatDate(message.timestamp)}
        </div>
        <Card className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-5 py-3.5 shadow-sm">
          <CardContent className="p-0">
            <p className="text-sm leading-relaxed">
              {message.content as string}
            </p>
          </CardContent>
        </Card>
      </div>
      <Avatar className="flex-shrink-0">
        <AvatarFallback className="bg-primary text-primary-foreground">U</AvatarFallback>
      </Avatar>
    </div>
  );
}
