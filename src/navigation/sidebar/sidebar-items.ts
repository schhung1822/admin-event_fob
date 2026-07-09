import {
  ChartBar,
  FileText,
  Gift,
  LayoutDashboard,
  type LucideIcon,
  ScanQrCode,
  ShoppingBagIcon,
  Ticket,
  User,
  Users,
} from "lucide-react";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Báo cáo",
    items: [
      {
        id: "default",
        title: "Tổng quan",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
      {
        id: "crm",
        title: "CRM",
        url: "/dashboard/crm",
        icon: ChartBar,
      },
    ],
  },
  {
    id: 2,
    label: "Quản lý",
    items: [
      {
        id: "orders",
        title: "Đơn hàng",
        url: "/dashboard/orders",
        icon: ShoppingBagIcon,
      },
      {
        id: "tickets",
        title: "Hạng vé",
        url: "/dashboard/tickets",
        icon: Ticket,
      },
      {
        id: "users",
        title: "Khách hàng",
        url: "/dashboard/users",
        icon: Users,
      },
      {
        id: "voucher",
        title: "Voucher",
        url: "/dashboard/voucher",
        icon: Gift,
      },
      {
        id: "checkin",
        title: "Checkin",
        url: "/dashboard/checkin",
        icon: ScanQrCode,
        badge: "soon",
        disabled: true,
      },
    ],
  },
  {
    id: 3,
    label: "Khác",
    items: [
      {
        id: "account",
        title: "Tài khoản",
        url: "/dashboard/account",
        icon: User,
      },
      {
        id: "document",
        title: "Tài liệu",
        url: "/document",
        icon: FileText,
      },
    ],
  },
];
