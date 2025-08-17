import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HRSidebar } from "./HRSidebar";
import { HRDashboard } from "./HRDashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Settings, LogOut } from "lucide-react";

export function HRLayout() {
  const [currentUser] = useState({
    name: "Sarah Johnson",
    role: "hr" as const, // Start with HR role for demo
    avatar: "SJ"
  });

  const [roleDemo, setRoleDemo] = useState<"employee" | "hr" | "admin">("hr");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <HRSidebar userRole={roleDemo} userName={currentUser.name} />
        
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b border-border bg-card shadow-nav flex items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-white">HR</span>
                </div>
                <div>
                  <h1 className="text-xl font-heading font-bold text-primary">
                    NAFGEM HR Management System
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Role Demo Switcher */}
              <div className="flex items-center space-x-2 p-2 bg-accent/10 rounded-lg">
                <span className="text-sm font-medium">Demo as:</span>
                <div className="flex space-x-1">
                  {(["employee", "hr", "admin"] as const).map((role) => (
                    <Button
                      key={role}
                      size="sm"
                      variant={roleDemo === role ? "default" : "ghost"}
                      onClick={() => setRoleDemo(role)}
                      className="capitalize text-xs"
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div className="relative">
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
                >
                  3
                </Badge>
              </div>

              {/* Settings */}
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>

              {/* User Info */}
              <div className="flex items-center space-x-3 pl-4 border-l border-border">
                <div className="text-right">
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {roleDemo} Dashboard
                  </p>
                </div>
                <div className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">{currentUser.avatar}</span>
                </div>
              </div>

              {/* Logout */}
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <HRDashboard userRole={roleDemo} userName={currentUser.name} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}