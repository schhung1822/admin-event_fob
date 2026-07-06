"use client";
"use no memo";

import * as React from "react";

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { createFilterOptions, emptyFilterValue, getGenderLabel, type UserRow } from "./data";
import { getUsersColumns } from "./users-columns";
import { UsersTable } from "./users-table";

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value || 0);
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border bg-muted/20 p-3">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div className="mt-1 break-words text-sm">{value || "-"}</div>
    </div>
  );
}

function DetailSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="grid gap-3">
      <div className="flex items-center gap-3">
        <h3 className="font-medium text-sm">{title}</h3>
        <Separator className="flex-1" />
      </div>
      <div className="grid min-w-0 gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function CustomerDetailPanel({ customer, onOpenChange, open }: { customer: UserRow | null; onOpenChange: (open: boolean) => void; open: boolean }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent className="sm:[--drawer-content-width:38rem]">
        <DrawerHeader className="gap-1 border-b pb-4">
          <DrawerTitle>{customer?.name || "Chi ti\u1ebft kh\u00e1ch h\u00e0ng"}</DrawerTitle>
          <DrawerDescription>{customer?.customerId || customer?.email || customer?.phone || "-"}</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {customer ? (
            <div className="grid gap-5">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="text-muted-foreground text-xs">{"S\u1ed1 v\u00e9 \u0111\u00e3 thanh to\u00e1n"}</div>
                  <div className="mt-1 font-semibold text-2xl">{customer.paidTicketCount}</div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="text-muted-foreground text-xs">{"Chi ti\u00eau"}</div>
                  <div className="mt-1 font-semibold text-2xl">{formatMoney(customer.paidSpend)}</div>
                </div>
              </div>

              <DetailSection title={"Th\u00f4ng tin kh\u00e1ch h\u00e0ng"}>
                <DetailItem label={"T\u00ean"} value={customer.name} />
                <DetailItem label={"Gi\u1edbi t\u00ednh"} value={<Badge variant="outline">{getGenderLabel(customer.gender)}</Badge>} />
                <DetailItem label={"S\u1ed1 \u0111i\u1ec7n tho\u1ea1i"} value={customer.phone} />
                <DetailItem label="Email" value={customer.email} />
                <DetailItem label={"Ngh\u1ec1 nghi\u1ec7p"} value={customer.career} />
                <DetailItem label={"Th\u01b0\u01a1ng hi\u1ec7u"} value={customer.brand} />
              </DetailSection>

              <DetailSection title={"Th\u1eddi gian & qu\u1ea3n tr\u1ecb"}>
                <DetailItem label="Thời gian tạo" value={customer.createTime} />
                <DetailItem label="Cập nhật lúc" value={customer.updatedAt} />
              </DetailSection>

              <DetailSection title="Tracking">
                <DetailItem label="user_ip" value={customer.userIp} />
                <DetailItem label="fbp" value={customer.fbp} />
                <DetailItem label="fbc" value={customer.fbc} />
                <DetailItem label="ttclid" value={customer.ttclid} />
                <DetailItem label="ttp" value={customer.ttp} />
                <div className="min-w-0 rounded-lg border bg-muted/20 p-3 md:col-span-2">
                  <Label className="text-muted-foreground text-xs">user_agent</Label>
                  <div className="mt-1 break-all text-sm">{customer.userAgent || "-"}</div>
                </div>
              </DetailSection>
            </div>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function Users({ users }: { users: UserRow[] }) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    search: false,
    tracking: false,
    userAgent: false,
  });
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [selectedCustomer, setSelectedCustomer] = React.useState<UserRow | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const handleViewCustomer = React.useCallback((customer: UserRow) => {
    setSelectedCustomer(customer);
    setDetailOpen(true);
  }, []);

  const filterOptions = React.useMemo(
    () => ({
      brand: createFilterOptions(users, "brand"),
      career: createFilterOptions(users, "career"),
      gender: createFilterOptions(users, "gender"),
    }),
    [users]
  );
  const columns = React.useMemo(() => getUsersColumns(handleViewCustomer), [handleViewCustomer]);

  const table = useReactTable({
    data: users,
    columns,
    state: {
      rowSelection,
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    autoResetPageIndex: false,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const searchQuery = (table.getColumn("search")?.getFilterValue() as string | undefined) ?? "";
  const genderFilter = (table.getColumn("gender")?.getFilterValue() as string | undefined) ?? emptyFilterValue;
  const careerFilter = (table.getColumn("career")?.getFilterValue() as string | undefined) ?? emptyFilterValue;
  const brandFilter = (table.getColumn("brand")?.getFilterValue() as string | undefined) ?? emptyFilterValue;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  function setColumnSelectFilter(columnId: string, value: string | null) {
    table.getColumn(columnId)?.setFilterValue(!value || value === emptyFilterValue ? undefined : value);
    table.setPageIndex(0);
  }

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">{"Kh\u00e1ch h\u00e0ng"}</CardTitle>
        <CardDescription className="max-w-sm leading-snug">
          {"Hi\u1ec3n th\u1ecb d\u1eef li\u1ec7u kh\u00e1ch h\u00e0ng \u0111\u00e3 \u0111\u0103ng k\u00fd mua v\u00e9."}
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <InputGroup className="h-7 w-full md:w-64">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              className="h-7"
              placeholder={"T\u00ecm kh\u00e1ch h\u00e0ng..."}
              value={searchQuery}
              onChange={(event) => {
                table.getColumn("search")?.setFilterValue(event.target.value || undefined);
                table.setPageIndex(0);
              }}
            />
            <InputGroupAddon align="inline-end">
              <Kbd className="h-4 text-[10px]">Ctrl K</Kbd>
            </InputGroupAddon>
          </InputGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={genderFilter} onValueChange={(value) => setColumnSelectFilter("gender", value)}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">{"Gi\u1edbi t\u00ednh:"}</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}>
                <SelectGroup>
                  {filterOptions.gender.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === emptyFilterValue ? "T\u1ea5t c\u1ea3" : getGenderLabel(option)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-4">
          <div className="text-muted-foreground text-sm tabular-nums">
            {selectedCount} {"\u0111\u00e3 ch\u1ecdn"} · {users.length} {"kh\u00e1ch h\u00e0ng"}
          </div>
        </div>

        <UsersTable table={table} />
      </CardContent>
      <CustomerDetailPanel customer={selectedCustomer} onOpenChange={setDetailOpen} open={detailOpen} />
    </Card>
  );
}