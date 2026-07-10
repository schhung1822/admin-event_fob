"use client";

import Link from "next/link";

import { CircleHelp, ClipboardList, Command, Database, File, Search, Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { type NavGroup, sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import type { CurrentUser } from "./account-switcher";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { SidebarSupportCard } from "./sidebar-support-card";

function getSidebarItemsForRole(role: string): NavGroup[] {
  if (role !== "staff") {
    return sidebarItems;
  }

  return sidebarItems
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.id === "checkin"),
    }))
    .filter((group) => group.items.length > 0);
}

const _data = {
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: CircleHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: Database,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardList,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: File,
    },
  ],
};

export function AppSidebar({
  currentUser,
  ...props
}: React.ComponentProps<typeof Sidebar> & { currentUser: CurrentUser }) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.values.sidebar_variant,
      sidebarCollapsible: s.values.sidebar_collapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;
  const roleSidebarItems = getSidebarItemsForRole(currentUser.role);
  const homeHref = currentUser.role === "staff" ? "/dashboard/checkin" : "/dashboard/default";

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link prefetch={false} href={homeHref} />}>
              <Command />
              <span className="font-semibold text-base">{APP_CONFIG.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={roleSidebarItems} showCreateOrder={currentUser.role !== "staff"} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        {currentUser.role === "staff" ? null : <SidebarSupportCard />}
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
