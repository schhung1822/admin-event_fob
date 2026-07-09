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
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  CircleCheckIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  LoaderIcon,
  PlusCircleIcon,
  Settings2,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { deleteOrderAction } from "../actions";
import { OrderForm } from "./order-form";
import type { OrderFormMode, OrderRow } from "./schema";

const pageSizeItems = [10, 20, 30, 50, 100].map((pageSize) => ({
  value: `${pageSize}`,
  label: `${pageSize}`,
}));
const allFilterValue = "all";
const paymentStatusFilterItems = [
  { value: allFilterValue, label: "Tất cả trạng thái" },
  { value: "new", label: "Mới" },
  { value: "paydone", label: "Đã Thanh toán" },
  { value: "expired", label: "Hết hạn" },
  { value: "cancel", label: "Hủy" },
  { value: "refund", label: "Hoàn tiền" },
];
const tableScrollbarClass =
  "[scrollbar-color:color-mix(in_oklab,var(--muted-foreground)_45%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50";

type ExportFormat = "csv" | "excel";

const orderExportColumns: Array<{ label: string; getValue: (order: OrderRow) => string | number | null }> = [
  { label: "Mã đơn", getValue: (order) => order.ordercode },
  { label: "Mã đơn hàng", getValue: (order) => order.order_id },
  { label: "Ngày tạo", getValue: (order) => order.create_time },
  { label: "Ngày thanh toán", getValue: (order) => order.payment_time },
  { label: "Ngày check-in", getValue: (order) => order.checkin_time },
  { label: "Khách hàng", getValue: (order) => order.name },
  { label: "Số điện thoại", getValue: (order) => order.phone },
  { label: "Email", getValue: (order) => order.email },
  { label: "Giới tính", getValue: (order) => order.gender },
  { label: "Hạng vé", getValue: (order) => order.class },
  { label: "Giá vé", getValue: (order) => order.money },
  { label: "Trạng thái", getValue: (order) => getPaymentStatusLabel(order.status) },
  { label: "Vé tặng", getValue: (order) => (order.is_gift ? "Co" : "Khong") },
  { label: "Check-in", getValue: (order) => (order.is_checkin ? "Da check-in" : "Chua") },
  { label: "Số lần check-in", getValue: (order) => order.number_checkin },
  { label: "Nghề nghiệp", getValue: (order) => order.career },
  { label: "Thương hiệu", getValue: (order) => order.brand },
  { label: "Nguồn", getValue: (order) => order.source },
  { label: "Nguồn Ref", getValue: (order) => order.ref },
  { label: "Voucher", getValue: (order) => order.voucher },
  { label: "UTM Source", getValue: (order) => order.utm_source },
  { label: "UTM Medium", getValue: (order) => order.utm_medium },
  { label: "UTM Campaign", getValue: (order) => order.utm_campaign },
  { label: "Step Mail", getValue: (order) => order.step_mail },
  { label: "Step ZBS", getValue: (order) => order.step_zbs },
];

function formatExportValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function escapeCsvValue(value: string | number | null | undefined) {
  const text = formatExportValue(value);
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function escapeHtmlValue(value: string | number | null | undefined) {
  return formatExportValue(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function downloadTextFile(content: string, mimeType: string, fileName: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getCreatedTimeValue(order: OrderRow) {
  const time = new Date(order.create_time.replace(" ", "T")).getTime();
  return Number.isFinite(time) ? time : 0;
}

function getCreateDateValue(order: OrderRow) {
  return order.create_time.slice(0, 10);
}

function getLocalDateValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function getDateRangeLabel(dateRange: DateRange | undefined) {
  if (dateRange?.from && dateRange.to) {
    return `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`;
  }

  if (dateRange?.from) {
    return `Từ ${format(dateRange.from, "dd/MM/yyyy")}`;
  }

  return "Khoảng ngày tạo";
}

const ticketClassBadgeClasses: Record<string, string> = {
  DIAMOND: "border-sky-400/60 bg-sky-400/10 text-sky-300",
  GOLD: "border-yellow-400/60 bg-yellow-400/10 text-yellow-300",
  RUBY: "border-rose-400/60 bg-rose-400/10 text-rose-300",
  SILVER: "border-slate-400/60 bg-slate-400/10 text-slate-300",
  STUDENT: "border-emerald-400/60 bg-emerald-400/10 text-emerald-300",
  VIP: "border-violet-400/60 bg-violet-400/10 text-violet-300",
};

function getTicketClassBadgeClass(ticketClass: string) {
  return ticketClassBadgeClasses[ticketClass.trim().toUpperCase()] ?? "border-border bg-muted/20 text-muted-foreground";
}
function TicketTypeDot({ isGift }: { isGift: number }) {
  const label = isGift ? "Vé tặng" : "Vé mua";

  return (
    <span title={label} className={`inline-flex size-3 rounded-full ${isGift ? "bg-amber-500" : "bg-blue-500"}`} />
  );
}

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

function getPaymentStatusLabel(status: string) {
  switch (status) {
    case "paydone":
    case "paid":
      return "Đã thanh toán";
    case "expired":
      return "Hết hạn";
    case "cancel":
      return "Hủy";
    case "refund":
      return "Hoàn tiền";
    default:
      return "Mới";
  }
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
      {getPaymentStatusLabel(status)}
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

function OrderDateRangeFilter({
  value,
  onChange,
}: {
  value: DateRange | undefined;
  onChange: (value: DateRange | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const hasValue = Boolean(value?.from || value?.to);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 w-56 shrink-0 justify-start gap-2 px-2.5 font-normal">
            <CalendarIcon data-icon="inline-start" />
            <span className="truncate">{getDateRangeLabel(value)}</span>
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto overflow-hidden p-0">
        <div className="border-b px-3 py-2">
          <div className="font-medium text-sm">Lọc theo ngày tạo</div>
          <div className="text-muted-foreground text-xs">Chọn khoảng ngày bắt đầu và kết thúc</div>
        </div>
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
          defaultMonth={value?.from}
          locale={vi}
          className="p-3 [--cell-size:--spacing(8)]"
          classNames={{
            months: "relative flex flex-col gap-4 lg:flex-row",
            month: "flex w-full flex-col gap-3",
            caption_label: "font-semibold text-sm",
            weekday: "flex-1 text-center text-[0.75rem] font-medium text-muted-foreground",
            day: "group/day relative aspect-square h-full w-full rounded-md p-0 text-center select-none",
          }}
        />
        <div className="flex items-center justify-between gap-2 border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            disabled={!hasValue}
            onClick={() => onChange(undefined)}
          >
            <XIcon data-icon="inline-start" />
            Xóa lọc
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setOpen(false)}>
            Áp dụng
          </Button>
        </div>
      </PopoverContent>
    </Popover>
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
      id: "createdAt",
      accessorFn: getCreatedTimeValue,
      header: "Ngay tao",
      enableHiding: false,
    },
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
        <span
          className={`inline-flex h-5 items-center rounded-full border px-2 font-medium text-xs ${getTicketClassBadgeClass(
            row.original.class,
          )}`}
        >
          {row.original.class || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "is_gift",
      header: "Loại vé",
      cell: ({ row }) => <TicketTypeDot isGift={row.original.is_gift} />,
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
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ createdAt: false });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [panelMode, setPanelMode] = React.useState<OrderFormMode>("create");
  const [selectedOrder, setSelectedOrder] = React.useState<OrderRow | null>(null);
  const [createdDateRange, setCreatedDateRange] = React.useState<DateRange | undefined>();
  const [ticketClassFilter, setTicketClassFilter] = React.useState(allFilterValue);
  const [paymentStatusFilter, setPaymentStatusFilter] = React.useState(allFilterValue);
  const [tableScrollWidth, setTableScrollWidth] = React.useState(0);
  const tableScrollRef = React.useRef<HTMLDivElement>(null);
  const horizontalScrollRef = React.useRef<HTMLDivElement>(null);
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

  React.useEffect(() => {
    const tableScroller = tableScrollRef.current;
    if (!tableScroller) return;

    const updateScrollWidth = () => setTableScrollWidth(tableScroller.scrollWidth);
    updateScrollWidth();

    const resizeObserver = new ResizeObserver(updateScrollWidth);
    resizeObserver.observe(tableScroller);
    if (tableScroller.firstElementChild) {
      resizeObserver.observe(tableScroller.firstElementChild);
    }
    window.addEventListener("resize", updateScrollWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollWidth);
    };
  }, []);

  React.useEffect(() => {
    const tableScroller = tableScrollRef.current;
    const horizontalScroller = horizontalScrollRef.current;
    if (!tableScroller || !horizontalScroller) return;

    let syncing = false;
    const releaseSync = () => {
      syncing = false;
    };
    const syncFromTable = () => {
      if (syncing) return;
      syncing = true;
      horizontalScroller.scrollLeft = tableScroller.scrollLeft;
      requestAnimationFrame(releaseSync);
    };
    const syncFromHorizontal = () => {
      if (syncing) return;
      syncing = true;
      tableScroller.scrollLeft = horizontalScroller.scrollLeft;
      requestAnimationFrame(releaseSync);
    };

    tableScroller.addEventListener("scroll", syncFromTable, { passive: true });
    horizontalScroller.addEventListener("scroll", syncFromHorizontal, { passive: true });

    return () => {
      tableScroller.removeEventListener("scroll", syncFromTable);
      horizontalScroller.removeEventListener("scroll", syncFromHorizontal);
    };
  }, []);

  const ticketClassFilterItems = React.useMemo(() => {
    const classes = Array.from(new Set(data.map((order) => order.class).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    );

    return [
      { value: allFilterValue, label: "Tất cả hạng vé" },
      ...classes.map((ticketClass) => ({ value: ticketClass, label: ticketClass })),
    ];
  }, [data]);

  const filteredData = React.useMemo(
    () =>
      data.filter((order) => {
        const createDateValue = getCreateDateValue(order);
        const fromDateValue = createdDateRange?.from ? getLocalDateValue(createdDateRange.from) : "";
        const toDateValue = createdDateRange?.to ? getLocalDateValue(createdDateRange.to) : fromDateValue;
        const matchesCreatedDate =
          !fromDateValue || (createDateValue >= fromDateValue && createDateValue <= toDateValue);
        const matchesTicketClass = ticketClassFilter === allFilterValue || order.class === ticketClassFilter;
        const matchesPaymentStatus =
          paymentStatusFilter === allFilterValue ||
          order.status === paymentStatusFilter ||
          (paymentStatusFilter === "paydone" && order.status === "paid");

        return matchesCreatedDate && matchesTicketClass && matchesPaymentStatus;
      }),
    [createdDateRange, data, paymentStatusFilter, ticketClassFilter],
  );

  const resetToFirstPage = React.useCallback(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, []);

  const handleCreatedDateRangeChange = React.useCallback(
    (value: DateRange | undefined) => {
      setCreatedDateRange(value);
      resetToFirstPage();
    },
    [resetToFirstPage],
  );

  const handleTicketClassFilterChange = React.useCallback(
    (value: string | null) => {
      if (value === null) return;
      setTicketClassFilter(value);
      resetToFirstPage();
    },
    [resetToFirstPage],
  );

  const handlePaymentStatusFilterChange = React.useCallback(
    (value: string | null) => {
      if (value === null) return;
      setPaymentStatusFilter(value);
      resetToFirstPage();
    },
    [resetToFirstPage],
  );
  const table = useReactTable({
    columns: columns({ onEdit: handleEdit }),
    data: filteredData,
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

  const handleExport = React.useCallback(
    (format: ExportFormat) => {
      const rows = table.getPrePaginationRowModel().rows.map((row) => row.original);
      const timestamp = new Date().toISOString().slice(0, 10);

      if (format === "csv") {
        const csv = [
          orderExportColumns.map((column) => escapeCsvValue(column.label)).join(","),
          ...rows.map((order) => orderExportColumns.map((column) => escapeCsvValue(column.getValue(order))).join(",")),
        ].join("\r\n");

        downloadTextFile(`\uFEFF${csv}`, "text/csv;charset=utf-8", `orders-${timestamp}.csv`);
        return;
      }

      const headerCells = orderExportColumns.map((column) => `<th>${escapeHtmlValue(column.label)}</th>`).join("");
      const bodyRows = rows
        .map(
          (order) =>
            `<tr>${orderExportColumns.map((column) => `<td>${escapeHtmlValue(column.getValue(order))}</td>`).join("")}</tr>`,
        )
        .join("");
      const excelHtml = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;

      downloadTextFile(excelHtml, "application/vnd.ms-excel;charset=utf-8", `orders-${timestamp}.xls`);
    },
    [table],
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col justify-start gap-4 overflow-hidden">
      <div className="flex shrink-0 @4xl/main:flex-row flex-col @4xl/main:items-center @4xl/main:justify-between gap-3">
        <div
          className={`flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-x-auto pb-1 ${tableScrollbarClass}`}
        >
          <Label htmlFor="orders-search" className="sr-only">
            Tìm đơn hàng
          </Label>
          <Input
            id="orders-search"
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Tìm mã vé, tên, SĐT, email..."
            className="h-8 @4xl/main:w-80 w-72 shrink-0"
          />
          <OrderDateRangeFilter value={createdDateRange} onChange={handleCreatedDateRangeChange} />
          <Select
            value={ticketClassFilter}
            onValueChange={handleTicketClassFilterChange}
            items={ticketClassFilterItems}
          >
            <SelectTrigger size="sm" className="h-8 w-40 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" className="w-40">
              <SelectGroup>
                {ticketClassFilterItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            value={paymentStatusFilter}
            onValueChange={handlePaymentStatusFilterChange}
            items={paymentStatusFilterItems}
          >
            <SelectTrigger size="sm" className="h-8 w-44 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" className="w-44">
              <SelectGroup>
                {paymentStatusFilterItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <DownloadIcon data-icon="inline-start" />
              Xuất dữ liệu
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => handleExport("excel")}>Excel (.xls)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>CSV (.csv)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            onClick={handleCreate}
          >
            <PlusCircleIcon data-icon="inline-start" />
            <span className="hidden lg:inline">Thêm vé</span>
          </Button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border">
        <div
          ref={tableScrollRef}
          className={`absolute inset-x-0 top-0 bottom-4 overflow-y-auto overflow-x-hidden ${tableScrollbarClass}`}
        >
          <table data-slot="table" className="w-full min-w-[1900px] caption-bottom text-sm">
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan} className="sticky top-0 z-20 bg-muted">
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
          </table>
        </div>
        <div
          ref={horizontalScrollRef}
          className={`absolute inset-x-0 bottom-0 z-20 h-4 overflow-x-auto overflow-y-hidden border-t bg-background/95 shadow-[0_-4px_10px_rgba(0,0,0,0.08)] ${tableScrollbarClass}`}
        >
          <div className="h-px" style={{ width: tableScrollWidth }} />
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between border-t px-4 py-3">
        <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} của {table.getFilteredRowModel().rows.length} dòng đã chọn.
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
