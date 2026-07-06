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
import { Gift, MoreHorizontal, Plus, Search } from "lucide-react";

import { createVoucherAction, deleteVoucherAction, updateVoucherAction } from "../actions";
import type { VoucherFormMode, VoucherRow } from "./schema";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const pageSizeItems = [10, 20, 30, 40, 50];
const voucherTypeOptions = [
  { label: "Giảm tiền", value: "money" },
  { label: "Giảm phần trăm", value: "rate" },
  { label: "Monet", value: "monet" },
];
const ticketClassOptions = ["GOLD", "RUBY", "VIP"];

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

function getVoucherTypeLabel(value: string) {
  return voucherTypeOptions.find((option) => option.value === value)?.label || value || "-";
}

function toDatetimeLocal(value: string) {
  if (!value) return "";
  return value.replace(" ", "T").slice(0, 16);
}

function MoneyInput({ defaultValue, name }: { defaultValue?: number | null; name: string }) {
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

function VoucherForm({ mode, voucher }: { mode: VoucherFormMode; voucher?: VoucherRow | null }) {
  const action = mode === "create" ? createVoucherAction : updateVoucherAction;

  return (
    <form action={action} className="grid gap-5">
      {voucher ? <input type="hidden" name="id" value={voucher.id} /> : null}
      <section className="grid gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-sm">Thông tin voucher</h3>
          <Separator className="flex-1" />
        </div>
        <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Field label="Mã voucher" name="voucher">
            <Input id="voucher" name="voucher" defaultValue={voucher?.voucher} placeholder="FOB2026" required />
          </Field>
          <Field label="Loại giảm" name="classy">
            <Select name="classy" defaultValue={voucher?.classy || "money"}>
              <SelectTrigger id="classy" className="w-full">
                <SelectValue placeholder="Chọn loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {voucherTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Số tiền giảm" name="money">
            <MoneyInput name="money" defaultValue={voucher?.money} />
          </Field>
          <Field label="Phần trăm giảm" name="rate">
            <Input id="rate" name="rate" type="number" min="0" max="100" defaultValue={voucher?.rate ?? ""} placeholder="10" />
          </Field>
          <Field label="Số lượng" name="number">
            <Input id="number" name="number" type="number" min="0" defaultValue={voucher?.number ?? ""} placeholder="100" />
          </Field>
          <Field label="Hạng vé áp dụng" name="ticketClass">
            <Select name="ticketClass" defaultValue={voucher?.ticketClass || "GOLD"}>
              <SelectTrigger id="ticketClass" className="w-full">
                <SelectValue placeholder="Chọn hạng vé" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ticketClassOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>
      <section className="grid gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-sm">Thời gian hiệu lực</h3>
          <Separator className="flex-1" />
        </div>
        <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Field label="Từ ngày" name="fromDate">
            <Input id="fromDate" name="fromDate" type="datetime-local" defaultValue={toDatetimeLocal(voucher?.fromDate || "")} />
          </Field>
          <Field label="Đến ngày" name="toDate">
            <Input id="toDate" name="toDate" type="datetime-local" defaultValue={toDatetimeLocal(voucher?.toDate || "")} />
          </Field>
        </div>
      </section>
      <Button type="submit" className="w-fit">
        {mode === "create" ? "Thêm voucher" : "Lưu thay đổi"}
      </Button>
    </form>
  );
}

function VoucherPanel({
  mode,
  onOpenChange,
  open,
  voucher,
}: {
  mode: VoucherFormMode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  voucher: VoucherRow | null;
}) {
  const isEdit = mode === "edit";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent className="sm:[--drawer-content-width:34rem]">
        <DrawerHeader className="gap-1 border-b pb-4">
          <DrawerTitle>{isEdit && voucher ? `Sửa ${voucher.voucher}` : "Thêm voucher"}</DrawerTitle>
          <DrawerDescription>Quản lý mã voucher, loại giảm giá và thời gian hiệu lực.</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <VoucherForm key={voucher ? `${mode}-${voucher.id}` : mode} mode={mode} voucher={voucher} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function DeleteVoucherForm({ voucher }: { voucher: VoucherRow }) {
  return (
    <form
      action={deleteVoucherAction}
      onSubmit={(event) => {
        if (!window.confirm(`Xóa voucher ${voucher.voucher}?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={voucher.id} />
      <DropdownMenuItem variant="destructive" render={<button type="submit" className="w-full" />}>
        Xóa voucher
      </DropdownMenuItem>
    </form>
  );
}

function getColumns(onEdit: (voucher: VoucherRow) => void): ColumnDef<VoucherRow>[] {
  return [
    {
      id: "search",
      accessorFn: (row) => `${row.voucher} ${row.classy} ${row.ticketClass}`,
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      accessorKey: "voucher",
      header: "Voucher",
      cell: ({ row }) => (
        <button type="button" className="grid min-w-48 gap-0.5 text-left" onClick={() => onEdit(row.original)}>
          <span className="font-medium text-foreground text-sm">{row.original.voucher}</span>
          <span className="text-muted-foreground text-xs">{getVoucherTypeLabel(row.original.classy)}</span>
        </button>
      ),
    },
    {
      accessorKey: "ticketClass",
      header: "Hạng vé",
      cell: ({ row }) => <Badge variant="outline">{row.original.ticketClass || "-"}</Badge>,
    },
    {
      accessorKey: "money",
      header: "Giá trị",
      cell: ({ row }) => (
        <div className="grid gap-0.5 text-sm">
          <span className="font-medium">{row.original.money ? formatMoney(row.original.money) : "-"}</span>
          <span className="text-muted-foreground text-xs">Rate: {row.original.rate ?? "-"}%</span>
        </div>
      ),
    },
    {
      accessorKey: "number",
      header: "Số lượng",
      cell: ({ row }) => <div className="text-sm">{row.original.number ?? "-"}</div>,
    },
    {
      accessorKey: "fromDate",
      header: "Hiệu lực",
      cell: ({ row }) => (
        <div className="grid gap-0.5 text-sm">
          <span>{row.original.fromDate || "-"}</span>
          <span className="text-muted-foreground text-xs">đến {row.original.toDate || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Cập nhật",
      cell: ({ row }) => <div className="text-sm">{row.original.updatedAt || row.original.createdAt || "-"}</div>,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label={`Open actions for ${row.original.voucher}`}
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
                <DropdownMenuItem onClick={() => onEdit(row.original)}>Sửa voucher</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DeleteVoucherForm voucher={row.original} />
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

export function Vouchers({ vouchers }: { vouchers: VoucherRow[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "updatedAt", desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ search: false });
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [panelMode, setPanelMode] = React.useState<VoucherFormMode>("create");
  const [selectedVoucher, setSelectedVoucher] = React.useState<VoucherRow | null>(null);

  const handleCreate = React.useCallback(() => {
    setPanelMode("create");
    setSelectedVoucher(null);
    setPanelOpen(true);
  }, []);

  const handleEdit = React.useCallback((voucher: VoucherRow) => {
    setPanelMode("edit");
    setSelectedVoucher(voucher);
    setPanelOpen(true);
  }, []);

  const columns = React.useMemo(() => getColumns(handleEdit), [handleEdit]);
  const table = useReactTable({
    data: vouchers,
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

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">Voucher</CardTitle>
        <CardDescription className="max-w-sm leading-snug">Quản lý mã voucher dùng cho vé sự kiện.</CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <InputGroup className="h-7 w-full md:w-64">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              className="h-7"
              placeholder="Tìm voucher..."
              value={searchQuery}
              onChange={(event) => {
                table.getColumn("search")?.setFilterValue(event.target.value || undefined);
                table.setPageIndex(0);
              }}
            />
          </InputGroup>
          <Button size="sm" onClick={handleCreate}>
            <Plus /> Thêm voucher
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
          <Badge variant="outline" className="gap-1.5">
            <Gift className="size-3.5" />
            {vouchers.length} voucher
          </Badge>
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
                      Không có voucher.
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
                <span>Rows per page</span>
                <Select value={`${table.getState().pagination.pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
                  <SelectTrigger size="sm" className="w-20" id="vouchers-rows-per-page">
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
                Page {currentPage} of {pageCount}
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
      <VoucherPanel mode={panelMode} onOpenChange={setPanelOpen} open={panelOpen} voucher={selectedVoucher} />
    </Card>
  );
}