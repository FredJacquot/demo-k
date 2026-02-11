import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mr-24">
      <Avatar className="flex-shrink-0">
        <AvatarFallback className="bg-blue-600 text-white">K</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-3">
        <Card className="rounded-tl bg-muted/50 w-20">
          <CardContent className="p-3">
            <div className="flex gap-1 items-center justify-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
