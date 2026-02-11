"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = (table.getState() as any).columnFilters?.length > 0;

  const statusOptions = [
    {
      label: "En attente",
      value: "pending",
      icon: "🟠",
    },
    {
      label: "En cours",
      value: "in_progress",
      icon: "🔵",
    },
    {
      label: "Résolue",
      value: "resolved",
      icon: "🟢",
    },
  ];

  const priorityOptions = [
    {
      label: "Urgent",
      value: "urgent",
      icon: "🔴",
    },
    {
      label: "High",
      value: "high",
      icon: "🟠",
    },
    {
      label: "Medium",
      value: "medium",
      icon: "🟡",
    },
    {
      label: "Low",
      value: "low",
      icon: "🟢",
    },
  ];

  const categoryOptions = [
    {
      label: "Paie",
      value: "paie",
      icon: "💼",
    },
    {
      label: "Congés",
      value: "conges",
      icon: "☂️",
    },
    {
      label: "Formation",
      value: "formation",
      icon: "🎓",
    },
    {
      label: "Contrat",
      value: "contrat",
      icon: "📄",
    },
    {
      label: "Avantages",
      value: "avantages",
      icon: "🎁",
    },
    {
      label: "Autre",
      value: "autre",
      icon: "➕",
    },
  ];

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Rechercher par titre, ID, utilisateur..."
          value={((table.getColumn("title") as any)?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            (table.getColumn("title") as any)?.setFilterValue(event.target.value)
          }
          className="h-8 w-[250px] lg:w-[350px]"
        />
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status") as any}
            title="Statut"
            options={statusOptions}
          />
        )}
        {table.getColumn("priority") && (
          <DataTableFacetedFilter
            column={table.getColumn("priority") as any}
            title="Priorité"
            options={priorityOptions}
          />
        )}
        {table.getColumn("category") && (
          <DataTableFacetedFilter
            column={table.getColumn("category") as any}
            title="Catégorie"
            options={categoryOptions}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => (table as any).resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Réinitialiser
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
