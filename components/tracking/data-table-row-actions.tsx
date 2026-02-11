"use client";

import { Row } from "@tanstack/react-table";
import { MoreHorizontal, Eye, PlayCircle, CheckCircle, RotateCcw, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Request } from "@/types/request";

interface DataTableRowActionsProps {
  row: Row<Request>;
  onViewDetails?: (request: Request) => void;
  onTakeCharge?: (request: Request) => void;
  onResolve?: (request: Request) => void;
  onReopen?: (request: Request) => void;
  onViewConversation?: (conversationId: string) => void;
}

export function DataTableRowActions({ 
  row,
  onViewDetails,
  onTakeCharge,
  onResolve,
  onReopen,
  onViewConversation
}: DataTableRowActionsProps) {
  const request = row.original;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuItem onClick={() => onViewDetails?.(request)}>
          <Eye className="mr-2 h-4 w-4" />
          Voir les détails
        </DropdownMenuItem>
        
        {request.conversationId && (
          <DropdownMenuItem onClick={() => onViewConversation?.(request.conversationId!)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Voir la conversation
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {request.status === "pending" && (
          <DropdownMenuItem onClick={() => onTakeCharge?.(request)}>
            <PlayCircle className="mr-2 h-4 w-4" />
            Prendre en charge
          </DropdownMenuItem>
        )}
        
        {request.status === "in_progress" && (
          <DropdownMenuItem onClick={() => onResolve?.(request)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Résoudre
          </DropdownMenuItem>
        )}
        
        {request.status === "resolved" && (
          <DropdownMenuItem onClick={() => onReopen?.(request)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Rouvrir
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
