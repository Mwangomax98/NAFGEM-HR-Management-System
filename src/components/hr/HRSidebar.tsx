import {
  Users,
  Calendar,
  Car,
  Settings,
  User,
  Building2,
  Shield,
  FileText,
  GraduationCap,
  MapPin,
  BarChart3,
  CheckSquare,
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { hasMinimumRole, normalizeRole, ROLES, getRoleLabel } from "@/lib/roles";

interface SidebarItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  minimumRole: string;
  excludeRoles?: string[];
  badge?: string;
}

const menuItems: SidebarItem[] = [
  { title: "My Profile", url: "/profile", icon: User, minimumRole: ROLES.EMPLOYEE, excludeRoles: [ROLES.FIELD_OFFICER] },
  { title: "My Tasks", url: "/tasks", icon: CheckSquare, minimumRole: ROLES.EMPLOYEE, excludeRoles: [ROLES.FIELD_OFFICER] },
  { title: "Leave Requests", url: "/leave", icon: Calendar, minimumRole: ROLES.EMPLOYEE, excludeRoles: [ROLES.FIELD_OFFICER] },
  { title: "Trip Scheduler", url: "/trips", icon: Car, minimumRole: ROLES.EMPLOYEE, excludeRoles: [ROLES.FIELD_OFFICER] },
  { title: "Staff Requests", url: "/staff-requests", icon: FileText, minimumRole: ROLES.EMPLOYEE, excludeRoles: [ROLES.FIELD_OFFICER] },
  { title: "My Training", url: "/training", icon: GraduationCap, minimumRole: ROLES.EMPLOYEE, excludeRoles: [ROLES.FIELD_OFFICER] },
  { title: "Field Reports", url: "/field-reports", icon: MapPin, minimumRole: ROLES.FIELD_OFFICER },

  { title: "Employee Management", url: "/hr/employee-management", icon: Users, minimumRole: ROLES.HR_ADMIN },
  { title: "Donor Projects", url: "/hr/projects", icon: Building2, minimumRole: ROLES.HR_ADMIN },
  { title: "Training Records", url: "/hr/training", icon: GraduationCap, minimumRole: ROLES.HR_ADMIN },
  { title: "Field Reports (All)", url: "/hr/field-reports", icon: MapPin, minimumRole: ROLES.HR_ADMIN },
  { title: "Trip Management", url: "/hr/trip-management", icon: Car, minimumRole: ROLES.HR_ADMIN },
  { title: "Performance", url: "/hr/performance", icon: BarChart3, minimumRole: ROLES.MANAGER },

  { title: "User Management", url: "/admin/users", icon: Shield, minimumRole: ROLES.SUPER_ADMIN },
  { title: "System Settings", url: "/admin/settings", icon: Settings, minimumRole: ROLES.SUPER_ADMIN },
];

interface HRSidebarProps {
  userRole: string;
  userName: string;
}

export function HRSidebar({ userRole, userName }: HRSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const role = normalizeRole(userRole);

  const isActive = (path: string) => location.pathname === path;
  const getNavClasses = (path: string) =>
    isActive(path)
      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  const filteredItems = menuItems.filter((item) => {
    if (item.excludeRoles?.includes(role)) return false;
    return hasMinimumRole(role, item.minimumRole);
  });

  const employeeItems = filteredItems.filter((item) => item.url.startsWith("/") && !item.url.startsWith("/hr") && !item.url.startsWith("/admin"));
  const hrItems = filteredItems.filter((item) => item.url.startsWith("/hr"));
  const adminItems = filteredItems.filter((item) => item.url.startsWith("/admin"));

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sidebar-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <p className="font-medium text-sidebar-foreground">{userName}</p>
                <p className="text-sm text-sidebar-accent-foreground">{getRoleLabel(role)}</p>
              </div>
            )}
          </div>
        </div>

        {employeeItems.length > 0 && (
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
                              <Badge variant="secondary" className="ml-auto">{item.badge}</Badge>
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

        {hrItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>HR Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {hrItems.map((item) => (
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
