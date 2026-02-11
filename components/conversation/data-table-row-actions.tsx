"use client";

import { Row } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConversationColumn } from "./columns";

interface DataTableRowActionsProps {
  row: Row<ConversationColumn>;
  onViewConversation?: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
}

export function DataTableRowActions({
  row,
  onViewConversation,
  onDeleteConversation,
}: DataTableRowActionsProps) {
  const conversation = row.original;

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
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onViewConversation?.(conversation.id)
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          Voir
        </DropdownMenuItem>
        {conversation.isFromLocalStorage && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { 
                  e.stopPropagation();
                  onDeleteConversation?.(conversation.id)
              }}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
