"use client";

import { ColumnDef } from "@tanstack/react-table";
import { 
  MessageSquare,
  Calendar,
  ArrowUpDown,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableRowActions } from "./data-table-row-actions";

export interface ColumnActionHandlers {
  onViewConversation?: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
}

export interface ConversationColumn {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  messages?: Array<{ id: string }>;
  isFromLocalStorage?: boolean;
  request?: {
    id: string;
    conversationId: string | null;
    status: "pending" | "in_progress" | "resolved" | "rejected";
    priority: string;
    category: string;
  };
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getSourceBadge = (isFromLocalStorage: boolean) => {
  if (isFromLocalStorage) {
    return (
      <Badge className="bg-blue-500 text-white text-xs">
        <Sparkles className="w-3 h-3 mr-1" />
        Nouvelle
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs">
      Serveur
    </Badge>
  );
};

export const columns: ColumnDef<ConversationColumn>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Sélectionner tout"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Sélectionner la ligne"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="text-sm">
          {formatDate(row.getValue("createdAt"))}
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Titre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const messageCount = row.original.messages?.length || 0;
      return (
        <div className="max-w-[500px]">
          <div className="font-medium truncate">{row.getValue("title")}</div>
          {messageCount > 0 && (
            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MessageSquare className="w-3 h-3" />
              <span>{messageCount} message{messageCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const handlers = (table.options.meta as { actionHandlers?: ColumnActionHandlers })?.actionHandlers;
      return <DataTableRowActions row={row} {...handlers} />;
    },
  },
];
