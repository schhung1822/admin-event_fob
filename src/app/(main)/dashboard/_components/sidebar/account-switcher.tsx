"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { CircleUser, LogOut } from "lucide-react";

import { logoutAction } from "@/app/(main)/auth/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";

export type CurrentUser = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: string;
};

export function AccountSwitcher({ user }: { readonly user: CurrentUser }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger nativeButton={false} render={<Avatar className="size-9 rounded-lg" />}>
        <AvatarImage src={user.avatar || undefined} alt={user.name} />
        <AvatarFallback>{getInitials(user.name || user.username)}</AvatarFallback>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-60 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
        <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
          <Avatar className="size-9 rounded-lg">
            <AvatarImage src={user.avatar || undefined} alt={user.name} />
            <AvatarFallback>{getInitials(user.name || user.username)}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{user.name || user.username}</span>
            <span className="truncate text-muted-foreground text-xs capitalize">{user.username || user.role}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard/account")}>
          <CircleUser />
          Tài khoản
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <button
          type="button"
          disabled={isPending}
          className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0"
          onClick={() => startTransition(() => logoutAction())}
        >
          <LogOut />
          {isPending ? "Đang đăng xuất..." : "Đăng xuất"}
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}