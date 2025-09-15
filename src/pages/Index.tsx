import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HRLayout } from "@/components/hr/HRLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogIn } from "lucide-react";
import type { User, Session } from "@supabase/supabase-js";


const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Welcome Section */}
          <div className="text-center lg:text-left space-y-6">
            <div className="flex items-center justify-center lg:justify-start space-x-3">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">N</div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">NAFGEM</h1>
                <p className="text-sm text-muted-foreground">HR Management System</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Streamline Your Workforce Management
              </h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto lg:mx-0">
                Access comprehensive HR tools, manage employee data, track performance, and optimize organizational efficiency.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
              <div className="p-4 rounded-lg bg-card border">
                <h3 className="font-semibold text-sm text-foreground">Employee Management</h3>
                <p className="text-xs text-muted-foreground mt-1">Comprehensive staff oversight</p>
              </div>
              <div className="p-4 rounded-lg bg-card border">
                <h3 className="font-semibold text-sm text-foreground">Performance Tracking</h3>
                <p className="text-xs text-muted-foreground mt-1">Real-time analytics</p>
              </div>
              <div className="p-4 rounded-lg bg-card border">
                <h3 className="font-semibold text-sm text-foreground">Leave Management</h3>
                <p className="text-xs text-muted-foreground mt-1">Streamlined approvals</p>
              </div>
              <div className="p-4 rounded-lg bg-card border">
                <h3 className="font-semibold text-sm text-foreground">Reporting Tools</h3>
                <p className="text-xs text-muted-foreground mt-1">Detailed insights</p>
              </div>
            </div>
          </div>

          {/* Authentication Card */}
          <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg"></div>
            <CardHeader className="text-center relative">
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to access your professional dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4 relative">
              <Button 
                onClick={() => navigate("/auth")}
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all text-primary-foreground"
                size="lg"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Access Your Account
              </Button>
              
              <div className="text-xs text-muted-foreground">
                New to the system? Contact your administrator for account setup.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <HRLayout />;
};

export default Index;
