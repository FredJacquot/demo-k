"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "@/components/tracking/data-table-faceted-filter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = (table.getState() as any).columnFilters?.length > 0;

  const requestOptions = [
    {
      label: "Avec demande",
      value: "with_request",
      icon: "🎫",
    },
    {
      label: "Sans demande",
      value: "without_request",
      icon: "—",
    },
  ];

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Rechercher par titre ou ID..."
          value={((table.getColumn("title") as any)?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            (table.getColumn("title") as any)?.setFilterValue(event.target.value)
          }
          className="h-8 w-[250px] lg:w-[350px]"
        />
        {table.getColumn("request") && (
          <DataTableFacetedFilter
            column={table.getColumn("request") as any}
            title="Demande"
            options={requestOptions}
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
