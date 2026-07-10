import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HRSidebar } from "./HRSidebar";
import { HRDashboard } from "./HRDashboard";
import { NotificationDropdown } from "../notifications/NotificationDropdown";
import { SettingsModal } from "../settings/SettingsModal";
import { LogoutConfirmation } from "../auth/LogoutConfirmation";
import { api } from "@/lib/api";
import { STUB_USER } from "@/lib/currentUser";
import { useUserRole } from "@/hooks/useUserRole";
import { normalizeRole } from "@/lib/roles";
import nafgemLogo from "@/assets/nafgem-logo.png";

export function HRLayout({ children }: { children?: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { userRole, loading: roleLoading } = useUserRole();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await api.auth.getUser();
      const profileId = user?.id || STUB_USER.id;

      const { data: profileData } = await api
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }
      setLoading(false);
    };

    load();
  }, []);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const displayName = profile?.full_name || STUB_USER.email || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <HRSidebar userRole={normalizeRole(userRole || 'employee')} userName={displayName} />

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-card shadow-nav flex items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={nafgemLogo}
                    alt="NAFGEM Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-heading font-bold text-primary">
                    NAFGEM HR Management System
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationDropdown />
              <SettingsModal />

              <div className="flex items-center space-x-3 pl-4 border-l border-border">
                <div className="text-right">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {userRole} Dashboard
                  </p>
                </div>
                <div className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">{initials}</span>
                </div>
              </div>

              <LogoutConfirmation />
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            {children || <HRDashboard userRole={userRole} userName={displayName} />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
