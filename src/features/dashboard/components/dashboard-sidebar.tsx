"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type LucideIcon,
  HomeIcon,
  FolderOpenIcon,
  BarChart2Icon,
  SettingsIcon,
  HeadphonesIcon,
} from "lucide-react";
import Link from "next/link";
import { UsageContainer } from "@/features/usage/components/usage-container";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface NavSectionProps {
  label?: string;
  items: MenuItem[];
  pathname: string;
}

function NavSection({ label, items, pathname }: NavSectionProps) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      {label && (
        <SidebarGroupLabel className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-medium px-3 mb-1">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={
                  item.url === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.url)
                }
                onClick={() => setOpenMobile(false)}
                tooltip={item.title}
                className="h-9 px-3 rounded-lg text-[13px] font-medium tracking-tight text-muted-foreground
                  hover:text-foreground hover:bg-muted/60
                  data-[active=true]:text-foreground data-[active=true]:bg-muted
                  data-[active=true]:shadow-[inset_0_0_0_1px_hsl(var(--border))]
                  transition-all duration-150"
              >
                <Link href={item.url}>
                  <item.icon className="size-4 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  const mainItems: MenuItem[] = [
    { title: "Dashboard", url: "/", icon: HomeIcon },
    { title: "Projects", url: "/projects", icon: FolderOpenIcon },
    { title: "Analytics", url: "/analytics", icon: BarChart2Icon },
  ];

  const otherItems: MenuItem[] = [
    { title: "Settings", url: "/settings", icon: SettingsIcon },
    { title: "Help & Support", url: "/support", icon: HeadphonesIcon },
  ];

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <Image
          src="/logo.svg"
          alt="StackCraft"
          width={22}
          height={22}
          className="rounded-md shrink-0"
        />
        <span className="group-data-[collapsible=icon]:hidden font-semibold text-[15px] tracking-tight text-foreground">
          StackCraft
        </span>
        {isMobile && <SidebarTrigger className="ml-auto" />}
      </div>

      <div className="mx-3 border-t border-dashed border-border" />

      {/* Nav */}
      <SidebarContent className="pt-2">
        <NavSection items={mainItems} pathname={pathname} />
        <NavSection label="More" items={otherItems} pathname={pathname} />
      </SidebarContent>

      <div className="mx-3 border-t border-dashed border-border" />

      {/* Footer */}
      <SidebarFooter className="py-3 px-2">
        <UsageContainer />
        <SidebarMenu>
          <SidebarMenuItem>
            <UserButton
              showName
              fallback={
                <Skeleton className="h-8 w-full group-data-[collapsible=icon]:size-8 rounded-md border border-border" />
              }
              appearance={{
                elements: {
                  rootBox:
                    "w-full! group-data-[collapsible=icon]:w-auto! group-data-[collapsible=icon]:flex! group-data-[collapsible=icon]:justify-center!",
                  userButtonTrigger:
                    "w-full! justify-start! bg-transparent! border! border-border/20! rounded-lg! pl-1.5! pr-2! py-1! gap-2! group-data-[collapsible=icon]:w-auto! group-data-[collapsible=icon]:p-1! hover:bg-muted/60! hover:border-border! transition-all! duration-150!",
                  userButtonBox: "flex-row-reverse! gap-2!",
                  userButtonOuterIdentifier:
                    "text-[13px]! tracking-tight! font-medium! text-foreground! group-data-[collapsible=icon]:hidden!",
                  userButtonAvatarBox: "size-6!",
                },
              }}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
