"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";

import { getGenderLabel, type UserRow } from "./data";

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value || 0);
}

function CustomerCell({ customer, onView }: { customer: UserRow; onView: (customer: UserRow) => void }) {
  return (
    <button type="button" className="flex min-w-64 items-center gap-3 text-left" onClick={() => onView(customer)}>
      <Avatar size="lg" className="font-medium">
        <AvatarFallback>{getInitials(customer.name || customer.customerId || customer.phone || "KH")}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground text-sm">{customer.name || "-"}</div>
        <div className="truncate text-muted-foreground text-sm">{customer.email || customer.customerId || "-"}</div>
      </div>
    </button>
  );
}

function TrackingCell({ customer }: { customer: UserRow }) {
  const trackingItems = [
    ["fbp", customer.fbp],
    ["fbc", customer.fbc],
    ["ttclid", customer.ttclid],
    ["ttp", customer.ttp],
  ].filter(([, value]) => value);

  if (!trackingItems.length) return <span className="text-muted-foreground text-sm">-</span>;

  return (
    <div className="grid max-w-72 gap-1 text-xs">
      {trackingItems.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <span className="font-medium uppercase">{label}: </span>
          <span className="break-all text-muted-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
}

export function getUsersColumns(onView: (customer: UserRow) => void): ColumnDef<UserRow>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            aria-label="Chon tat ca khach hang"
            checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            aria-label={"Chon " + (row.original.name || row.original.customerId)}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
    },
    {
      id: "search",
      accessorFn: (row) =>
        [row.customerId, row.name, row.email, row.phone, row.career, row.brand, row.userIp].join(" "),
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      accessorKey: "name",
      header: "Kh\u00e1ch h\u00e0ng",
      cell: ({ row }) => <CustomerCell customer={row.original} onView={onView} />,
    },
    {
      accessorKey: "phone",
      header: "Li\u00ean h\u1ec7",
      cell: ({ row }) => (
        <div className="grid gap-0.5 text-sm">
          <span className="font-medium">{row.original.phone || "-"}</span>
          <span className="text-muted-foreground">{row.original.customerId || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "gender",
      header: "Gi\u1edbi t\u00ednh",
      filterFn: "equalsString",
      cell: ({ row }) => <Badge variant="outline">{getGenderLabel(row.original.gender)}</Badge>,
    },
    {
      accessorKey: "career",
      header: "Ngh\u1ec1 nghi\u1ec7p",
      filterFn: "equalsString",
      cell: ({ row }) => <div className="max-w-44 truncate text-sm">{row.original.career || "-"}</div>,
    },
    {
      accessorKey: "brand",
      header: "Th\u01b0\u01a1ng hi\u1ec7u",
      filterFn: "equalsString",
      cell: ({ row }) => <div className="max-w-44 truncate text-sm">{row.original.brand || "-"}</div>,
    },
    {
      accessorKey: "paidTicketCount",
      header: "V\u00e9 \u0111\u00e3 thanh to\u00e1n",
      cell: ({ row }) => (
        <div className="grid gap-0.5 text-sm">
          <span className="font-medium">{row.original.paidTicketCount}</span>
          <span className="text-muted-foreground text-xs">{formatMoney(row.original.paidSpend)}</span>
        </div>
      ),
    },
    {
      accessorKey: "userIp",
      header: "IP",
      cell: ({ row }) => <div className="whitespace-nowrap text-sm">{row.original.userIp || "-"}</div>,
    },
    {
      accessorKey: "tracking",
      header: "Tracking",
      cell: ({ row }) => <TrackingCell customer={row.original} />,
      enableSorting: false,
    },
    {
      accessorKey: "userAgent",
      header: "User agent",
      cell: ({ row }) => <div className="max-w-80 truncate text-muted-foreground text-sm">{row.original.userAgent || "-"}</div>,
    },
    {
      id: "createdAt",
      accessorFn: (row) => new Date(row.createTime || row.updatedAt || row.createdAt || 0).getTime(),
      header: "Ng\u00e0y t\u1ea1o",
      cell: ({ row }) => (
        <div className="grid gap-0.5 text-sm">
          <span>{row.original.createTime || row.original.createdAt || "-"}</span>
          {row.original.updatedAt ? <span className="text-muted-foreground text-xs">{"S\u1eeda: "}{row.original.updatedAt}</span> : null}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Tác vụ</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label={"Open actions for " + (row.original.name || row.original.customerId)}
                  className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                  size="icon-sm"
                  variant="ghost"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onView(row.original)}>{"Xem chi\u0020ti\u1ebft"}</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem disabled>Customer ID: {row.original.customerId || row.original.id}</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
    },
  ];
}