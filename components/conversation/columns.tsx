"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { 
  MessageSquare,
  Calendar,
  ArrowUpDown,
  Sparkles,
  Ticket
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

const getRequestStatusBadge = (status: string) => {
  const configs = {
    pending: {
      label: "En attente",
      className: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/50"
    },
    in_progress: {
      label: "En cours",
      className: "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/50"
    },
    resolved: {
      label: "Résolue",
      className: "bg-green-500/10 text-green-700 border-green-500/30 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/50"
    },
    rejected: {
      label: "Rejetée",
      className: "bg-gray-500/10 text-gray-700 border-gray-500/30 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/50"
    }
  };

  const config = configs[status as keyof typeof configs];
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      <Ticket className="w-3 h-3 mr-1" />
      {config.label}
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
    id: "request",
    accessorFn: (row) => row.request ? "with_request" : "without_request",
    header: "Demande",
    cell: ({ row }) => {
      const request = row.original.request;
      if (!request) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      return getRequestStatusBadge(request.status);
    },
    filterFn: (row: Row<ConversationColumn>, id: string, value: string[]) => {
      const hasRequest = !!row.original.request;
      const filterValue = hasRequest ? "with_request" : "without_request";
      return value.includes(filterValue);
    },
  } as ColumnDef<ConversationColumn>,
  {
    id: "actions",
    cell: ({ row, table }) => {
      const handlers = (table.options.meta as { actionHandlers?: ColumnActionHandlers })?.actionHandlers;
      return <DataTableRowActions row={row} {...handlers} />;
    },
  },
];
