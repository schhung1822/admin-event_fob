"use client";
"use no memo";

import * as React from "react";

import { useSearchParams } from "next/navigation";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  CircleCheckIcon,
  EllipsisVerticalIcon,
  LoaderIcon,
  PlusIcon,
  Settings2,
  Trash2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { deleteOrderAction } from "../actions";
import { OrderForm } from "./order-form";
import type { OrderFormMode, OrderRow } from "./schema";

const pageSizeItems = [10, 20, 30, 50, 100].map((pageSize) => ({
  value: `${pageSize}`,
  label: `${pageSize}`,
}));

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function StatusBadge({ status }: { status: string }) {
  const isPaid = status === "paydone" || status === "paid";

  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      {isPaid ? (
        <CircleCheckIcon className="fill-green-500 stroke-primary-foreground dark:fill-green-600" />
      ) : (
        <LoaderIcon />
      )}
      {status || "new"}
    </Badge>
  );
}

function StepBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Chưa có
      </Badge>
    );
  }

  return <Badge variant={value > 0 ? "default" : "outline"}>Step {value}</Badge>;
}

function DeleteOrderForm({ order }: { order: OrderRow }) {
  return (
    <form
      action={deleteOrderAction}
      onSubmit={(event) => {
        if (!window.confirm(`Xóa vé ${order.ordercode}?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={order.id} />
      <DropdownMenuItem variant="destructive" render={<button type="submit" className="w-full" />}>
        <Trash2Icon />
        Xóa
      </DropdownMenuItem>
    </form>
  );
}

function OrderPanel({
  mode,
  onOpenChange,
  open,
  order,
}: {
  mode: OrderFormMode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  order: OrderRow | null;
}) {
  const isEdit = mode === "edit";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent className="sm:[--drawer-content-width:34rem]">
        <DrawerHeader className="gap-1 border-b pb-4">
          <DrawerTitle>{isEdit && order ? `Sửa vé ${order.ordercode}` : "Thêm vé mới"}</DrawerTitle>
          <DrawerDescription>
            {isEdit
              ? "Cập nhật thông tin vé."
              : "Sau khi tạo vé thành công hệ thống sẽ tự động gửi thông báo tới email và zalo của khách hàng."}
          </DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <OrderForm key={order ? `${mode}-${order.id}` : mode} mode={mode} order={order ?? undefined} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function columns({ onEdit }: { onEdit: (order: OrderRow) => void }): ColumnDef<OrderRow>[] {
  return [
    {
      accessorKey: "ordercode",
      header: "Mã đơn",
      cell: ({ row }) => (
        <div className="min-w-28">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 font-medium text-foreground"
            onClick={() => onEdit(row.original)}
          >
            {row.original.ordercode}
          </Button>
          <div className="text-muted-foreground text-xs">{formatValue(row.original.create_time)}</div>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div className="min-w-44">
          <div className="font-medium">{row.original.name || "Chưa có tên"}</div>
          <div className="text-muted-foreground text-xs">{row.original.phone}</div>
          <div className="max-w-44 truncate text-muted-foreground text-xs">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: "class",
      header: "Hạng vé",
      cell: ({ row }) => (
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {row.original.class || "N/A"}
        </Badge>
      ),
    },
    {
      accessorKey: "money",
      header: () => <div className="text-right">Giá vé</div>,
      cell: ({ row }) => <div className="text-right font-medium">{formatMoney(row.original.money)}</div>,
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "payment_time",
      header: "Ngày thanh toán",
      cell: ({ row }) => (
        <div className="min-w-36 text-muted-foreground text-xs">{formatValue(row.original.payment_time)}</div>
      ),
    },
    {
      accessorKey: "is_checkin",
      header: "Check-in",
      cell: ({ row }) => (
        <Badge variant={row.original.is_checkin ? "default" : "outline"}>
          {row.original.is_checkin ? `Đã check-in (${row.original.number_checkin})` : "Chưa"}
        </Badge>
      ),
    },
    {
      accessorKey: "checkin_time",
      header: "Ngày check-in",
      cell: ({ row }) => (
        <div className="min-w-36 text-muted-foreground text-xs">{formatValue(row.original.checkin_time)}</div>
      ),
    },
    {
      accessorKey: "career",
      header: "Nghề nghiệp",
      cell: ({ row }) => <div className="max-w-40 truncate">{formatValue(row.original.career)}</div>,
    },
    {
      accessorKey: "brand",
      header: "Thương hiệu",
      cell: ({ row }) => <div className="max-w-44 truncate">{formatValue(row.original.brand)}</div>,
    },
    {
      accessorKey: "voucher",
      header: "Voucher",
      cell: ({ row }) => (
        <div className="max-w-64 truncate text-muted-foreground text-xs">{formatValue(row.original.voucher)}</div>
      ),
    },
    {
      accessorKey: "ref",
      header: "Nguồn Ref",
      cell: ({ row }) => (
        <div className="max-w-48">
          <div className="truncate">{formatValue(row.original.ref)}</div>
          <div className="truncate text-muted-foreground text-xs">Source: {formatValue(row.original.source)}</div>
        </div>
      ),
    },
    {
      accessorKey: "utm_source",
      header: "UTM Source",
      cell: ({ row }) => (
        <div className="max-w-44 truncate text-muted-foreground text-xs">{formatValue(row.original.utm_source)}</div>
      ),
    },
    {
      accessorKey: "utm_medium",
      header: "UTM Medium",
      cell: ({ row }) => (
        <div className="max-w-44 truncate text-muted-foreground text-xs">{formatValue(row.original.utm_medium)}</div>
      ),
    },
    {
      accessorKey: "utm_campaign",
      header: "UTM Campaign",
      cell: ({ row }) => (
        <div className="max-w-44 truncate text-muted-foreground text-xs">{formatValue(row.original.utm_campaign)}</div>
      ),
    },
    {
      accessorKey: "step_mail",
      header: "Step Mail",
      cell: ({ row }) => <StepBadge value={row.original.step_mail} />,
    },
    {
      accessorKey: "step_zbs",
      header: "Step ZBS",
      cell: ({ row }) => <StepBadge value={row.original.step_zbs} />,
    },
    {
      accessorKey: "order_id",
      header: "M\u00e3 \u0111\u01a1n h\u00e0ng",
      cell: ({ row }) => (
        <div className="min-w-32">
          <div className="font-medium">{formatValue(row.original.order_id)}</div>
          <div className="text-muted-foreground text-xs">{formatValue(row.original.create_time)}</div>
        </div>
      ),
      enableHiding: false,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="flex size-8 text-muted-foreground data-popup-open:bg-muted"
                size="icon"
              />
            }
          >
            <EllipsisVerticalIcon />
            <span className="sr-only">Mở menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>Sửa</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DeleteOrderForm order={row.original} />
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableHiding: false,
      enableSorting: false,
    },
  ];
}

export function OrdersTable({ data }: { data: OrderRow[] }) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "order_id", desc: true }]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [panelMode, setPanelMode] = React.useState<OrderFormMode>("create");
  const [selectedOrder, setSelectedOrder] = React.useState<OrderRow | null>(null);
  const searchParams = useSearchParams();

  const handleCreate = React.useCallback(() => {
    setPanelMode("create");
    setSelectedOrder(null);
    setPanelOpen(true);
  }, []);

  const handleEdit = React.useCallback((order: OrderRow) => {
    setPanelMode("edit");
    setSelectedOrder(order);
    setPanelOpen(true);
  }, []);

  React.useEffect(() => {
    if (searchParams.get("create") === "1") {
      handleCreate();
    }
  }, [handleCreate, searchParams]);

  React.useEffect(() => {
    window.addEventListener("orders:create", handleCreate);
    return () => window.removeEventListener("orders:create", handleCreate);
  }, [handleCreate]);

  const table = useReactTable({
    columns: columns({ onEdit: handleEdit }),
    data,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id.toString(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination,
      rowSelection,
      sorting,
    },
  });

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="flex @4xl/main:flex-row flex-col @4xl/main:items-center @4xl/main:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="orders-search" className="sr-only">
            Tìm đơn hàng
          </Label>
          <Input
            id="orders-search"
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Tìm mã vé, tên, SĐT, email..."
            className="h-8 @4xl/main:w-96 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <Settings2 data-icon="inline-start" />
              Kiểu xem
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Hiển thị cột</DropdownMenuLabel>
                {table
                  .getAllColumns()
                  .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id.replaceAll("_", " ")}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={handleCreate}>
            <PlusIcon data-icon="inline-start" />
            <span className="hidden lg:inline">Thêm vé</span>
          </Button>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border">
        <Table className="min-w-[1900px]">
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                  Không có đơn hàng.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="font-medium text-sm">
              Dòng trên trang
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                if (value !== null) {
                  table.setPageSize(Number(value));
                }
              }}
              items={pageSizeItems}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {pageSizeItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center font-medium text-sm">
            Trang {table.getState().pagination.pageIndex + 1} của {Math.max(table.getPageCount(), 1)}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Về trang đầu</span>
              <ChevronsLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Trang trước</span>
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Trang sau</span>
              <ChevronRightIcon />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Tới trang cuối</span>
              <ChevronsRightIcon />
            </Button>
          </div>
        </div>
      </div>
      <OrderPanel mode={panelMode} onOpenChange={setPanelOpen} open={panelOpen} order={selectedOrder} />
    </div>
  );
}
