"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { 
  Briefcase,
  Umbrella,
  GraduationCap,
  FileText,
  Gift,
  MoreHorizontal,
  Calendar,
  ArrowUpDown,
  MessageSquare,
  CheckCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableRowActions } from "./data-table-row-actions";
import type { Request } from "@/types/request";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  position?: string;
}

export interface ColumnActionHandlers {
  onViewDetails?: (request: Request) => void;
  onTakeCharge?: (request: Request) => void;
  onResolve?: (request: Request) => void;
  onReopen?: (request: Request) => void;
  onViewConversation?: (conversationId: string) => void;
}

export interface TableMeta {
  actionHandlers?: ColumnActionHandlers;
  users?: User[];
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getPriorityBadge = (priority: string) => {
  const configs = {
    urgent: {
      label: "Urgent",
      emoji: "🔴",
      className: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700"
    },
    high: {
      label: "High",
      emoji: "🟠",
      className: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700"
    },
    medium: {
      label: "Medium",
      emoji: "🟡",
      className: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700"
    },
    low: {
      label: "Low",
      emoji: "🟢",
      className: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700"
    }
  };

  const config = configs[priority as keyof typeof configs];
  return (
    <Badge variant="outline" className={config.className}>
      <span className="mr-1">{config.emoji}</span>
      {config.label}
    </Badge>
  );
};

const getCategoryBadge = (category: string) => {
  const configs = {
    paie: { label: "Paie", icon: Briefcase },
    conges: { label: "Congés", icon: Umbrella },
    formation: { label: "Formation", icon: GraduationCap },
    contrat: { label: "Contrat", icon: FileText },
    avantages: { label: "Avantages", icon: Gift },
    hr_confirmation: { label: "Confirmation RH", icon: CheckCircle },
    autre: { label: "Autre", icon: MoreHorizontal }
  };

  // Fallback to 'autre' if category doesn't exist
  const config = configs[category as keyof typeof configs] || configs.autre;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className="bg-background">
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};

const getStatusBadge = (status: string) => {
  const configs = {
    pending: {
      label: "En attente",
      className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
    },
    in_progress: {
      label: "En cours",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
    },
    resolved: {
      label: "Résolue",
      className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
    }
  };

  const config = configs[status as keyof typeof configs];
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
};

export const columns: ColumnDef<Request>[] = [
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
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const hasConversation = row.original.conversationId;
      return (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{row.getValue("id")}</span>
          {hasConversation && (
            <MessageSquare className="h-3 w-3 text-muted-foreground" />
          )}
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
      return (
        <div className="max-w-[500px]">
          <div className="font-medium truncate">{row.getValue("title")}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.userName}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Statut
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return getStatusBadge(row.getValue("status"));
    },
    filterFn: (row: Row<Request>, id: string, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  } as ColumnDef<Request>,
  {
    accessorKey: "priority",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Priorité
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return getPriorityBadge(row.getValue("priority"));
    },
    filterFn: (row: Row<Request>, id: string, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  } as ColumnDef<Request>,
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Catégorie
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return getCategoryBadge(row.getValue("category"));
    },
    filterFn: (row: Row<Request>, id: string, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  } as ColumnDef<Request>,
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
    accessorKey: "assignedTo",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Affecté à
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row, table }) => {
      const assignedToId = row.getValue("assignedTo") as string | null;
      const users = (table.options.meta as TableMeta)?.users || [];
      
      if (!assignedToId) {
        return (
          <div className="text-sm text-muted-foreground italic">
            Non assigné
          </div>
        );
      }

      const assignedUser = users.find((user: User) => user.id === assignedToId);
      const displayName = assignedUser ? assignedUser.name : assignedToId;

      return (
        <div className="text-sm font-medium">
          {displayName}
        </div>
      );
    },
    filterFn: (row: Row<Request>, id: string, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  } as ColumnDef<Request>,
  {
    id: "actions",
    cell: ({ row, table }) => {
      const handlers = (table.options.meta as TableMeta)?.actionHandlers;
      return <DataTableRowActions row={row} {...handlers} />;
    },
  },
];
