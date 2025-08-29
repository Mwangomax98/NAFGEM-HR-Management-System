import { useState } from "react";
import { 
  Users, 
  Clock, 
  CheckSquare, 
  Calendar, 
  LogOut, 
  Car, 
  BookOpen, 
  BarChart3, 
  Settings,
  User,
  Building2,
  Shield,
  MessageCircle,
  Target
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

interface SidebarItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  badge?: string;
  roles: string[];
}

const menuItems: SidebarItem[] = [
  // Employee Items
  { title: "My Profile", url: "/profile", icon: User, roles: ["employee", "hr", "admin"] },
  { title: "Communications", url: "/communications", icon: MessageCircle, roles: ["employee", "hr", "admin"] },
  { title: "My Timesheets", url: "/timesheets", icon: Clock, roles: ["employee", "hr", "admin"] },
  { title: "My Tasks", url: "/tasks", icon: CheckSquare, roles: ["employee", "hr", "admin"] },
  { title: "Leave Requests", url: "/leave", icon: Calendar, roles: ["employee", "hr", "admin"] },
  { title: "Trip Scheduler", url: "/trips", icon: Car, roles: ["employee", "hr", "admin"] },
  { title: "Exit Management", url: "/exit", icon: LogOut, roles: ["employee", "hr", "admin"] },
  
  // HR Items
  { title: "Employee Management", url: "/hr/employee-management", icon: Users, roles: ["hr", "admin"] },
  { title: "Project Management", url: "/hr/projects", icon: Building2, roles: ["hr", "admin"] },
  { title: "Timesheet Approvals", url: "/hr/timesheet-approvals", icon: Clock, roles: ["hr", "admin"] },
  { title: "Task Management", url: "/hr/task-management", icon: CheckSquare, roles: ["hr", "admin"] },
  { title: "Leave Approvals", url: "/hr/leave-approvals", icon: Calendar, roles: ["hr", "admin"] },
  { title: "Trip Management", url: "/hr/trip-management", icon: Car, roles: ["hr", "admin"] },
  { title: "Training & Development", url: "/hr/training", icon: BookOpen, roles: ["hr", "admin"] },
  { title: "Performance Reviews", url: "/hr/performance", icon: BarChart3, roles: ["hr", "admin"] },
  { title: "Monitoring & Evaluation", url: "/hr/monitoring-evaluation", icon: Target, roles: ["employee", "hr", "admin"] },
  
  // Admin Items
  { title: "User Management", url: "/admin/users", icon: Shield, roles: ["admin"] },
  { title: "System Settings", url: "/admin/settings", icon: Settings, roles: ["admin"] },
  { title: "Analytics & Reports", url: "/reports", icon: BarChart3, roles: ["hr", "admin"] },
];

interface HRSidebarProps {
  userRole: "employee" | "hr" | "admin";
  userName: string;
}

export function HRSidebar({ userRole, userName }: HRSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavClasses = (path: string) =>
    isActive(path) 
      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  // Group items by category
  const employeeItems = filteredItems.filter(item => 
    ["employee", "hr", "admin"].every(role => item.roles.includes(role))
  );
  const hrItems = filteredItems.filter(item => 
    item.roles.includes("hr") && !["employee", "hr", "admin"].every(role => item.roles.includes(role))
  );
  const adminItems = filteredItems.filter(item => 
    item.roles.includes("admin") && !item.roles.includes("hr")
  );

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* User Info */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sidebar-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <p className="font-medium text-sidebar-foreground">{userName}</p>
                <p className="text-sm text-sidebar-accent-foreground capitalize">{userRole}</p>
              </div>
            )}
          </div>
        </div>

        {/* Personal/Employee Items */}
        <SidebarGroup>
          <SidebarGroupLabel>Personal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {employeeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClasses(item.url)}>
                      <item.icon className="w-4 h-4" />
                      {!collapsed && (
                        <>
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* HR Management Items */}
        {hrItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>HR Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {hrItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavClasses(item.url)}
                        onClick={(e) => {
                          console.log('Navigating to:', item.url, 'Title:', item.title);
                        }}
                      >
                        <item.icon className="w-4 h-4" />
                        {!collapsed && (
                          <>
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge variant="destructive" className="ml-auto">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Items */}
        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClasses(item.url)}>
                        <item.icon className="w-4 h-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}