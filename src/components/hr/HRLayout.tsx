import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HRSidebar } from "./HRSidebar";
import { HRDashboard } from "./HRDashboard";
import { NotificationDropdown } from "../notifications/NotificationDropdown";
import { SettingsModal } from "../settings/SettingsModal";
import { LogoutConfirmation } from "../auth/LogoutConfirmation";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useUserRole } from "@/hooks/useUserRole";
import { AppRole } from "@/lib/roles";
import nafgemLogo from "@/assets/nafgem-logo.png";

export function HRLayout({ children }: { children?: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { userRole, loading: roleLoading } = useUserRole();

  useEffect(() => {
    // Get current user and profile
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }
      }
      setLoading(false);
    };

    getCurrentUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          getCurrentUser();
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const displayName = profile?.full_name || user?.email || "User";
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <HRSidebar userRole={userRole} userName={displayName} />
        
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
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
              {/* Notifications */}
              <NotificationDropdown />

              {/* Settings */}
              <SettingsModal />

              {/* User Info */}
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

              {/* Logout */}
              <LogoutConfirmation />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children || <HRDashboard userRole={userRole} userName={displayName} />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}