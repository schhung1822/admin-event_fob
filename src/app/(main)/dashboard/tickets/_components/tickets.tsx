"use client";
"use no memo";

import * as React from "react";
import type { MouseEvent } from "react";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Download, ImageIcon, MoreHorizontal, Plus, Search, SlidersHorizontal, TicketIcon } from "lucide-react";

import { createTicketAction, deleteTicketAction, updateTicketAction } from "../actions";
import type { TicketFormMode, TicketRow } from "./schema";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const pageSizeItems = [10, 20, 30, 40, 50];

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(value || 0));
}

function formatMoneyInput(value: string | number | null | undefined) {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(digits));
}

function toDatetimeLocal(value: string) {
  if (!value) return "";
  return value.replace(" ", "T").slice(0, 16);
}

function MoneyInput({ defaultValue, name, required }: { defaultValue?: number | null; name: string; required?: boolean }) {
  const [rawValue, setRawValue] = React.useState(() => String(defaultValue ?? ""));

  React.useEffect(() => {
    setRawValue(String(defaultValue ?? ""));
  }, [defaultValue]);

  return (
    <>
      <Input
        id={`${name}_display`}
        inputMode="numeric"
        value={formatMoneyInput(rawValue)}
        placeholder="0"
        required={required}
        onChange={(event) => setRawValue(event.target.value.replace(/[^\d]/g, ""))}
      />
      <input type="hidden" name={name} value={rawValue || ""} />
    </>
  );
}

function Field({ children, label, name }: { children: React.ReactNode; label: string; name: string }) {
  return (
    <div className="min-w-0 flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
    </div>
  );
}

function TicketImage({ ticket, variant = "thumb" }: { ticket: TicketRow; variant?: "thumb" | "preview" }) {
  if (!ticket.img) {
    return (
      <div className="flex size-14 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
        <ImageIcon className="size-5" />
      </div>
    );
  }

  return (
    <img
      src={ticket.img}
      alt={ticket.name}
      className={
        variant === "preview"
          ? "h-auto w-full max-w-full rounded-lg object-contain"
          : "h-auto max-h-16 w-24 max-w-24 rounded-md object-contain"
      }
      loading="lazy"
    />
  );
}
function TicketForm({ mode, ticket }: { mode: TicketFormMode; ticket?: TicketRow | null }) {
  const action = mode === "create" ? createTicketAction : updateTicketAction;

  return (
    <form action={action} className="grid gap-5">
      {ticket ? <input type="hidden" name="id" value={ticket.id} /> : null}
      <section className="grid gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-sm">Thông tin hạng vé</h3>
          <Separator className="flex-1" />
        </div>
        <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Field label="Mã hạng vé" name="ticket_id">
            <Input id="ticket_id" name="ticket_id" defaultValue={ticket?.ticket_id} placeholder="GOLD" required />
          </Field>
          <Field label="Tên hạng vé" name="name">
            <Input id="name" name="name" defaultValue={ticket?.name} placeholder="GOLD" required />
          </Field>
          <Field label="Giá gốc" name="money">
            <MoneyInput name="money" defaultValue={ticket?.money} required />
          </Field>
          <Field label="Giá ưu đãi" name="money_sale">
            <MoneyInput name="money_sale" defaultValue={ticket?.money_sale} />
          </Field>
          <Field label="Thứ tự" name="nc_order">
            <Input id="nc_order" name="nc_order" type="number" step="0.01" defaultValue={ticket?.nc_order ?? ""} />
          </Field>
          <Field label="Ảnh hiện tại / URL ảnh" name="img">
                        <Input
              id="img"
              name="img"
              className="min-w-0"
              defaultValue={ticket?.img}
              placeholder="https://... hoặc /uploads/tickets/..."
            />
          </Field>
        </div>
      </section>
      <section className="grid gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-sm">Thời gian khuyến mãi & ảnh vé</h3>
          <Separator className="flex-1" />
        </div>
        <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Field label="Bắt đầu bán" name="time_start">
            <Input id="time_start" name="time_start" type="datetime-local" defaultValue={toDatetimeLocal(ticket?.time_start || "")} />
          </Field>
          <Field label="Kết thúc bán" name="time_end">
            <Input id="time_end" name="time_end" type="datetime-local" defaultValue={toDatetimeLocal(ticket?.time_end || "")} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Tải ảnh vé" name="image_file">
              <Input id="image_file" name="image_file" type="file" accept="image/*" />
            </Field>
          </div>
        </div>
        {ticket?.img ? (
          <div className="grid min-w-0 gap-3 rounded-lg border bg-muted/30 p-3">
            <TicketImage ticket={ticket} variant="preview" />
            <div className="min-w-0 text-sm">
              <div className="font-medium">Ảnh đang dùng</div>
              <div className="break-all text-muted-foreground text-xs leading-relaxed">{ticket.img}</div>
            </div>
          </div>
        ) : null}
      </section>
      <Button type="submit" className="w-fit">
        {mode === "create" ? "Thêm hạng vé" : "Lưu thay đổi"}
      </Button>
    </form>
  );
}

function TicketPanel({
  mode,
  onOpenChange,
  open,
  ticket,
}: {
  mode: TicketFormMode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  ticket: TicketRow | null;
}) {
  const isEdit = mode === "edit";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent className="sm:[--drawer-content-width:34rem]">
        <DrawerHeader className="gap-1 border-b pb-4">
          <DrawerTitle>{isEdit && ticket ? `Sửa ${ticket.name}` : "Thêm hạng vé"}</DrawerTitle>
          <DrawerDescription>Quản lý thông tin hạng vé và ảnh hiển thị.</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <TicketForm key={ticket ? `${mode}-${ticket.id}` : mode} mode={mode} ticket={ticket} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function DeleteTicketForm({ ticket }: { ticket: TicketRow }) {
  return (
    <form
      action={deleteTicketAction}
      onSubmit={(event) => {
        if (!window.confirm(`Xóa hạng vé ${ticket.name}?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={ticket.id} />
      <DropdownMenuItem variant="destructive" render={<button type="submit" className="w-full" />}>
        Xóa hạng vé
      </DropdownMenuItem>
    </form>
  );
}

function getColumns(onEdit: (ticket: TicketRow) => void): ColumnDef<TicketRow>[] {
  return [
    {
      id: "search",
      accessorFn: (row) => `${row.ticket_id} ${row.name} ${row.money} ${row.money_sale ?? ""}`,
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      accessorKey: "name",
      header: "Hạng vé",
      cell: ({ row }) => (
        <button type="button" className="flex min-w-0 items-center gap-3 text-left" onClick={() => onEdit(row.original)}>
          <TicketImage ticket={row.original} />
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground text-sm">{row.original.name}</div>
            <div className="truncate text-muted-foreground text-sm">{row.original.ticket_id}</div>
          </div>
        </button>
      ),
    },
    {
      accessorKey: "money",
      header: "Giá vé",
      cell: ({ row }) => (
        <div className="grid gap-0.5">
          <span className="font-medium">{formatMoney(row.original.money)}</span>
          {row.original.money_sale !== null ? (
            <span className="text-muted-foreground text-xs">Sale: {formatMoney(row.original.money_sale)}</span>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "nc_order",
      header: "Thứ tự",
      cell: ({ row }) => <Badge variant="outline">{row.original.nc_order ?? "-"}</Badge>,
    },
    {
      accessorKey: "time_start",
      header: "Thời gian khuyến mãi",
      cell: ({ row }) => (
        <div className="grid gap-0.5 text-sm">
          <span>{row.original.time_start || "-"}</span>
          <span className="text-muted-foreground text-xs">đến {row.original.time_end || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "updated_at",
      header: "Cập nhật",
      cell: ({ row }) => <div className="text-sm">{row.original.updated_at || "-"}</div>,
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
                  aria-label={`Open actions for ${row.original.name}`}
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
                <DropdownMenuItem onClick={() => onEdit(row.original)}>Sửa hạng vé</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DeleteTicketForm ticket={row.original} />
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

function preventPaginationNavigation(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

function getPageNumbers(currentPage: number, pageCount: number) {
  if (pageCount <= 3) return Array.from({ length: pageCount }, (_, index) => index + 1);
  if (currentPage <= 2) return [1, 2, 3];
  if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
  return [currentPage - 1, currentPage, currentPage + 1];
}

export function Tickets({ tickets }: { tickets: TicketRow[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "nc_order", desc: false }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ search: false });
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [panelMode, setPanelMode] = React.useState<TicketFormMode>("create");
  const [selectedTicket, setSelectedTicket] = React.useState<TicketRow | null>(null);

  const handleCreate = React.useCallback(() => {
    setPanelMode("create");
    setSelectedTicket(null);
    setPanelOpen(true);
  }, []);

  const handleEdit = React.useCallback((ticket: TicketRow) => {
    setPanelMode("edit");
    setSelectedTicket(ticket);
    setPanelOpen(true);
  }, []);

  const columns = React.useMemo(() => getColumns(handleEdit), [handleEdit]);
  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting, columnFilters, columnVisibility, pagination },
    getRowId: (row) => row.id.toString(),
    autoResetPageIndex: false,
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
  const pageCount = Math.max(table.getPageCount(), 1);
  const currentPage = Math.min(table.getState().pagination.pageIndex + 1, pageCount);
  const pageNumbers = getPageNumbers(currentPage, pageCount);
  const totalValue = tickets.reduce((sum, ticket) => sum + ticket.money, 0);

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">Hạng vé</CardTitle>
        <CardDescription className="max-w-sm leading-snug">
          Quản lý các hạng vé hiển thị trên trang bán vé
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <InputGroup className="h-7 w-full md:w-64">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              className="h-7"
              placeholder="Tìm hạng vé..."
              value={searchQuery}
              onChange={(event) => {
                table.getColumn("search")?.setFilterValue(event.target.value || undefined);
                table.setPageIndex(0);
              }}
            />
          </InputGroup>
          <Button size="sm" onClick={handleCreate}>
            <Plus /> Thêm hạng vé
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <Badge variant="outline" className="gap-1.5">
              <TicketIcon className="size-3.5" />
              {tickets.length} hạng vé
            </Badge>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div>
            <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
              <TableHeader className="[&_tr]:border-t">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="py-4 font-normal">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="border-border/60 hover:bg-white/2.5">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-3 py-4 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                      Không có hạng vé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Separator />

          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <span>Dòng trên trang</span>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    if (value !== null) table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger size="sm" className="w-20" id="tickets-rows-per-page">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectGroup>
                      {pageSizeItems.map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <span>
                Trang {currentPage} của {pageCount}
              </span>
            </div>

            <Pagination className="mx-0 w-auto justify-start md:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    text=""
                    className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : undefined}
                    onClick={(event) => {
                      preventPaginationNavigation(event);
                      table.previousPage();
                    }}
                  />
                </PaginationItem>
                {pageNumbers[0] > 1 ? (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : null}
                {pageNumbers.map((pageNumber) => (
                  <PaginationItem key={`page-${pageNumber}`}>
                    <PaginationLink
                      href="#"
                      isActive={table.getState().pagination.pageIndex === pageNumber - 1}
                      onClick={(event) => {
                        preventPaginationNavigation(event);
                        table.setPageIndex(pageNumber - 1);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                {pageNumbers[pageNumbers.length - 1] < pageCount ? (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : null}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    text=""
                    className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : undefined}
                    onClick={(event) => {
                      preventPaginationNavigation(event);
                      table.nextPage();
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </CardContent>
      <TicketPanel mode={panelMode} onOpenChange={setPanelOpen} open={panelOpen} ticket={selectedTicket} />
    </Card>
  );
}
