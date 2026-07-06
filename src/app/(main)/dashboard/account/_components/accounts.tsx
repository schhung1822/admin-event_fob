"use client";
"use no memo";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

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
import { Edit, Eye, EyeOff, KeyRound, Plus, Search, Trash2 } from "lucide-react";

import { changeCurrentPasswordAction, deleteAccountAction, saveAccountAction } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { AccountRow } from "./data";

type AccountPanelMode = "create" | "edit";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Đang lưu..." : children}
    </Button>
  );
}

function PasswordInput({ id, name, required }: { id: string; name: string; required?: boolean }) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        minLength={6}
        required={required}
        autoComplete="new-password"
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
}
function ChangePasswordCard() {
  const [state, formAction] = useActionState(changeCurrentPasswordAction, {});

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl leading-none">
          <KeyRound className="size-5" />
          Đổi mật khẩu hiện tại
        </CardTitle>
        <CardDescription>Đổi mật khẩu cho tài khoản đang đăng nhập.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form action={formAction} className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="currentPassword">Mật khẩu hiện tại</FieldLabel>
            <PasswordInput id="currentPassword" name="currentPassword" required />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="newPassword">Mật khẩu mới</FieldLabel>
            <PasswordInput id="newPassword" name="newPassword" required />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="confirmPassword">Nhập lại mật khẩu mới</FieldLabel>
            <PasswordInput id="confirmPassword" name="confirmPassword" required />
          </Field>
          <SubmitButton>Cập nhật</SubmitButton>
        </form>
        {state.error ? <p className="mt-3 text-destructive text-sm">{state.error}</p> : null}
        {state.success ? <p className="mt-3 text-green-700 text-sm dark:text-green-300">{state.success}</p> : null}
      </CardContent>
    </Card>
  );
}

function AccountForm({ account, mode }: { account: AccountRow | null; mode: AccountPanelMode }) {
  const isEdit = mode === "edit";

  return (
    <form action={saveAccountAction} className="grid gap-5">
      {isEdit && account ? <input type="hidden" name="id" value={account.id} /> : null}
      <FieldGroup className="gap-4">
        <Field className="gap-1.5">
          <FieldLabel htmlFor="username">Tài khoản</FieldLabel>
          <Input id="username" name="username" defaultValue={account?.username ?? ""} placeholder="admin" required />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="name">Tên hiển thị</FieldLabel>
          <Input id="name" name="name" defaultValue={account?.name ?? ""} placeholder="Admin" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" name="email" type="email" defaultValue={account?.email ?? ""} placeholder="admin@example.com" required />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="phone">Số điện thoại</FieldLabel>
            <Input id="phone" name="phone" defaultValue={account?.phone ?? ""} placeholder="0900000000" required />
          </Field>
        </div>

        <Field className="gap-1.5">
          <FieldLabel htmlFor="password">{isEdit ? "Mật khẩu mới (bỏ trống nếu không đổi)" : "Mật khẩu"}</FieldLabel>
          <PasswordInput id="password" name="password" required={!isEdit} />
        </Field>
      </FieldGroup>
      <div className="flex justify-end gap-2 border-t pt-4">
        <SubmitButton>{isEdit ? "Lưu thay đổi" : "Thêm tài khoản"}</SubmitButton>
      </div>
    </form>
  );
}

function AccountPanel({ account, mode, onOpenChange, open }: { account: AccountRow | null; mode: AccountPanelMode; onOpenChange: (open: boolean) => void; open: boolean }) {
  const isEdit = mode === "edit";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent className="sm:[--drawer-content-width:32rem]">
        <DrawerHeader className="gap-1 border-b pb-4">
          <DrawerTitle>{isEdit ? "Sửa tài khoản" : "Thêm tài khoản"}</DrawerTitle>
          <DrawerDescription>{isEdit ? account?.username : "Tạo tài khoản đăng nhập mới cho website."}</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <AccountForm key={account ? `edit-${account.id}` : "create"} account={account} mode={mode} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function getPageNumbers(currentPage: number, pageCount: number) {
  if (pageCount <= 3) return Array.from({ length: pageCount }, (_, index) => index + 1);
  if (currentPage <= 2) return [1, 2, 3];
  if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
  return [currentPage - 1, currentPage, currentPage + 1];
}

function AccountsTable({ table }: { table: ReturnType<typeof useReactTable<AccountRow>> }) {
  const pageCount = Math.max(table.getPageCount(), 1);
  const currentPage = Math.min(table.getState().pagination.pageIndex + 1, pageCount);
  const pageNumbers = getPageNumbers(currentPage, pageCount);
  const rowsPerPage = `${table.getState().pagination.pageSize}`;

  return (
    <div className="flex flex-1 flex-col gap-4">
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
              <TableRow key={row.id} className="border-border/60 hover:bg-white/2.5" data-state={row.getIsSelected() && "selected"}>
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
                Không có kết quả
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Separator />

      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-4 text-muted-foreground text-sm">
          <span>Trang {currentPage} của {pageCount}</span>
          <span>Dòng mỗi trang: {rowsPerPage}</span>
        </div>
        <Pagination className="mx-0 w-auto justify-start md:justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text=""
                className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  table.previousPage();
                }}
              />
            </PaginationItem>
            {pageNumbers[0] > 1 ? <PaginationEllipsis /> : null}
            {pageNumbers.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  isActive={table.getState().pagination.pageIndex === pageNumber - 1}
                  onClick={(event) => {
                    event.preventDefault();
                    table.setPageIndex(pageNumber - 1);
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}
            {pageNumbers[pageNumbers.length - 1] < pageCount ? <PaginationEllipsis /> : null}
            <PaginationItem>
              <PaginationNext
                href="#"
                text=""
                className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  table.nextPage();
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

export function Accounts({ accounts }: { accounts: AccountRow[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ search: false });
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [panelMode, setPanelMode] = React.useState<AccountPanelMode>("create");
  const [selectedAccount, setSelectedAccount] = React.useState<AccountRow | null>(null);

  const openCreate = React.useCallback(() => {
    setSelectedAccount(null);
    setPanelMode("create");
    setPanelOpen(true);
  }, []);

  const openEdit = React.useCallback((account: AccountRow) => {
    setSelectedAccount(account);
    setPanelMode("edit");
    setPanelOpen(true);
  }, []);

  const columns = React.useMemo<ColumnDef<AccountRow>[]>(
    () => [
      {
        id: "search",
        accessorFn: (row) => [row.username, row.name, row.email, row.phone, row.role].join(" "),
        filterFn: (row, id, value) => String(row.getValue(id)).toLowerCase().includes(String(value).toLowerCase()),
      },
      {
        accessorKey: "username",
        header: "Tài khoản",
        cell: ({ row }) => (
          <button type="button" className="grid min-w-48 text-left" onClick={() => openEdit(row.original)}>
            <span className="font-medium text-sm">{row.original.username}</span>
            <span className="text-muted-foreground text-xs">{row.original.name || "-"}</span>
          </button>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <div className="max-w-64 truncate text-sm">{row.original.email || "-"}</div>,
      },
      {
        accessorKey: "phone",
        header: "Số điện thoại",
        cell: ({ row }) => <div className="whitespace-nowrap text-sm">{row.original.phone || "-"}</div>,
      },
      {
        accessorKey: "role",
        header: "Vai trò",
        cell: ({ row }) => <Badge variant="outline">{row.original.role || "admin"}</Badge>,
      },
      {
        accessorKey: "isCurrent",
        header: "Trạng thái",
        cell: ({ row }) => (row.original.isCurrent ? <Badge>Đang đăng nhập</Badge> : <span className="text-muted-foreground text-sm">-</span>),
      },
      {
        accessorKey: "createdAt",
        header: "Thời gian tạo",
        cell: ({ row }) => <div className="whitespace-nowrap text-muted-foreground text-sm">{row.original.createdAt || "-"}</div>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Tác vụ</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button type="button" size="icon-sm" variant="outline" onClick={() => openEdit(row.original)} aria-label="Sửa tài khoản">
              <Edit className="size-4" />
            </Button>
            <form
              action={deleteAccountAction}
              onSubmit={(event) => {
                if (!window.confirm(`Xóa tài khoản ${row.original.username}?`)) event.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={row.original.id} />
              <Button type="submit" size="icon-sm" variant="outline" disabled={row.original.isCurrent} aria-label="Xóa tài khoản">
                <Trash2 className="size-4" />
              </Button>
            </form>
          </div>
        ),
      },
    ],
    [openEdit],
  );

  const table = useReactTable({
    data: accounts,
    columns,
    state: { sorting, columnFilters, columnVisibility, pagination },
    getRowId: (row) => row.id.toString(),
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

  return (
    <div className="grid gap-4 md:gap-6">
      <ChangePasswordCard />
      <Card>
        <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <CardTitle className="text-xl leading-none">Quản lý tài khoản</CardTitle>
          <CardDescription className="max-w-sm leading-snug">Thêm, sửa, xóa tài khoản đăng nhập website.</CardDescription>
          <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
            <InputGroup className="h-7 w-full md:w-64">
              <InputGroupAddon align="inline-start">
                <Search className="size-3.5" />
              </InputGroupAddon>
              <InputGroupInput
                className="h-7"
                placeholder="Tìm tài khoản, email, phone..."
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
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Thêm tài khoản
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0">
          <div className="flex items-center justify-between gap-3 px-4 pt-4">
            <div className="text-muted-foreground text-sm tabular-nums">{accounts.length} tài khoản</div>
          </div>
          <AccountsTable table={table} />
        </CardContent>
      </Card>
      <AccountPanel account={selectedAccount} mode={panelMode} onOpenChange={setPanelOpen} open={panelOpen} />
    </div>
  );
}