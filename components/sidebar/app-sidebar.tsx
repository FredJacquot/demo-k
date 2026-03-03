"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  User,
  Database,
  Users,
  CircleAlert,
  BarChart3,
  Settings,
  Plus,
  ChevronDown,
  CheckCircle2,
  Ticket,
  ChevronRight,
  LogOut,
  Wallet,
  Workflow,
} from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "../theme-toggle";
import Link from "next/link";
import { useUser } from "@/contexts/user-context";
import { hasAccess, getRoleLabel, getRoleBadgeClass } from "@/lib/permissions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


export function AppSidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const { currentUser, users, setCurrentUser, isLoading } = useUser();
  const [totalCount, setTotalCount] = useState(0);
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);

  // Load requests count for HR/DRH
  useEffect(() => {
    const loadRequestsCounts = async () => {
      if (!currentUser || (currentUser.role !== "hr" && currentUser.role !== "drh")) {
        return;
      }

      try {
        // Load requests from localStorage
        const { getRequests } = await import('@/lib/requests-storage');
        const localStorageRequests = getRequests();

        // Try to load from API as well
        const apiRequests: Array<{ id: string; status: string }> = [];
        try {
          const response = await fetch(`/api/conversations?role=${currentUser.role}&full=true`);
          const data = await response.json();

          // Extract requests from conversations
          for (const conv of data.conversations) {
            if (conv.request) {
              apiRequests.push(conv.request);
            }
          }
        } catch (apiError) {
          console.log("API not available, using only localStorage");
        }

        // Merge localStorage and API requests
        const allRequestsMap = new Map();
        localStorageRequests.forEach(req => allRequestsMap.set(req.id, req));
        apiRequests.forEach(req => {
          if (!allRequestsMap.has(req.id)) {
            allRequestsMap.set(req.id, req);
          }
        });

        // Count requests by status
        let pending = 0;
        let inProgress = 0;

        allRequestsMap.forEach((request) => {
          if (request.status === "pending") {
            pending++;
          } else if (request.status === "in_progress") {
            inProgress++;
          }
        });

        setNewRequestsCount(pending);
        setInProgressCount(inProgress);
        setTotalCount(pending + inProgress);
      } catch (error) {
        console.error("Error loading requests count:", error);
      }
    };

    loadRequestsCounts();

    // Écouter les événements de mise à jour des demandes
    const handleRequestsUpdated = () => {
      loadRequestsCounts();
    };

    window.addEventListener("requestsUpdated", handleRequestsUpdated);

    // Nettoyer l'écouteur d'événement
    return () => {
      window.removeEventListener("requestsUpdated", handleRequestsUpdated);
    };
  }, [currentUser]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                  K
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Kalia</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Bouton Nouvelle conversation */}
      <div className="p-4 border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="w-full !bg-gradient-to-r !from-blue-500 !to-purple-600 !text-white !font-normal hover:!from-blue-600 hover:!to-purple-700 hover:!text-white"
              tooltip="Nouvelle conversation"
            >
              <Link href="/conversation/new?mock">
                <Plus />
                <span>Nouvelle conversation</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>

      <SidebarContent>
        {/* Mon espace */}
        <SidebarGroup>
          <SidebarGroupLabel>Mon espace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Mes conversations */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/conversation/recents")}
                  tooltip="Mes conversations"
                >
                  <Link href="/conversation/recents">
                    <MessageSquare />
                    <span>Mes conversations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Mes demandes */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/requests")}
                  tooltip="Mes demandes"
                >
                  <Link href="/requests">
                    <User />
                    <span>Mes demandes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="!w-[calc(100%-1rem)]" />



        {/* Ressources */}
        <SidebarGroup>
          <SidebarGroupLabel>Ressources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/knowledge-base"} tooltip="Base de connaissances">
                  <Link href="/knowledge-base">
                    <Database />
                    <span>Base de connaissances</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Espace RH - Only visible for hr and drh */}
        {currentUser && hasAccess(currentUser.role, "espace-rh") && (
          <>
            <SidebarSeparator className="!w-[calc(100%-1rem)]" />


            <SidebarGroup>
              <SidebarGroupLabel>Espace RH</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <Collapsible asChild defaultOpen className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip="Gestion des demandes">
                          <Ticket />
                          <span>Gestion des demandes</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={pathname === "/tracking" && !pathname.includes("status")}>
                              <Link href="/tracking">
                                <span>Toutes les demandes</span>
                                {totalCount > 0 && (
                                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4">
                                    {totalCount}
                                  </Badge>
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={pathname.includes("status=pending")}>
                              <Link href="/tracking?status=pending">
                                <span>Nouvelles</span>
                                {newRequestsCount > 0 && (
                                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4">
                                    {newRequestsCount}
                                  </Badge>
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={pathname.includes("status=in_progress")}>
                              <Link href="/tracking?status=in_progress">
                                <span>En cours</span>
                                {inProgressCount > 0 && (
                                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4">
                                    {inProgressCount}
                                  </Badge>
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Kalia ADP */}
        {currentUser && hasAccess(currentUser.role, "espace-rh") && (
          <>
            <SidebarSeparator className="!w-[calc(100%-1rem)]" />
            <SidebarGroup>
              <SidebarGroupLabel>Kalia ADP</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/adp"}
                      tooltip="Workflows administratifs"
                    >
                      <Link href="/adp">
                        <Workflow />
                        <span>Workflows administratifs</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Gestion de la paie - visible pour payroll et drh */}
        {currentUser && hasAccess(currentUser.role, "gestion-paie") && (
          <>
            <SidebarSeparator className="!w-[calc(100%-1rem)]" />

            <SidebarGroup>
              <SidebarGroupLabel>Gestion de la paie</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <Collapsible asChild defaultOpen className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip="Gestion de la paie">
                          <Wallet />
                          <span>Gestion de la paie</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={pathname === "/payroll"}>
                              <Link href="/payroll">
                                <span>Changements à répercuter</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={pathname === "/payroll/calendar"}>
                              <Link href="/payroll/calendar">
                                <span>Calendrier de paie</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={pathname === "/payroll/timeline-lanes"}>
                              <Link href="/payroll/timeline-lanes">
                                <span>Calendrier Timeline lane</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === "/payroll/roadmap-swimlanes-v2"}
                            >
                              <Link href="/payroll/roadmap-swimlanes-v2">
                                <span>Roadmap swimlanes v2</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === "/payroll/pipeline-mensuel-v3"}
                            >
                              <Link href="/payroll/pipeline-mensuel-v3">
                                <span>Pipeline mensuel v3</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === "/payroll/pipeline-mensuel-v4"}
                            >
                              <Link href="/payroll/pipeline-mensuel-v4">
                                <span>Pipeline mensuel v4</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === "/payroll/pipeline-mensuel-v5"}
                            >
                              <Link href="/payroll/pipeline-mensuel-v5">
                                <span>Pipeline mensuel v5</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === "/payroll/pipeline-mensuel-v6"}
                            >
                              <Link href="/payroll/pipeline-mensuel-v6">
                                <span>Pipeline mensuel v6</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === "/payroll/pipeline-mensuel-v7"}
                            >
                              <Link href="/payroll/pipeline-mensuel-v7">
                                <span>Pipeline mensuel v7</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Administration - Only visible for drh */}
        {currentUser && hasAccess(currentUser.role, "administration") && (
          <>
            <SidebarSeparator className="!w-[calc(100%-1rem)]" />


            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/analytics"} tooltip="Analytiques">
                      <Link href="/analytics">
                        <BarChart3 />
                        <span>Analytiques</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/settings"} tooltip="Configuration">
                      <Link href="/settings">
                        <Settings />
                        <span>Configuration</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Theme Toggle */}
      <SidebarSeparator className="!w-[calc(100%-1rem)]" />


      <div className="p-2">
        <div className="flex items-center justify-center">
          <ThemeToggle />
        </div>
      </div>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            {currentUser && !isLoading ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="cursor-pointer h-auto min-h-16 py-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                        {currentUser.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 leading-none flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{currentUser.name}</span>
                        <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 ${getRoleBadgeClass(currentUser.role)}`}>
                          {getRoleLabel(currentUser.role)}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{currentUser.email}</span>
                    </div>
                    <ChevronDown className="ml-auto h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      localStorage.removeItem("demo_user_id");
                      window.location.href = "/login";
                    }}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton size="lg" disabled>
                <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-muted animate-pulse" />
                <div className="flex flex-col gap-1 leading-none flex-1">
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-2 w-32 bg-muted animate-pulse rounded" />
                </div>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
