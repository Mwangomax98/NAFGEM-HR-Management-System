import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, RefreshCw, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DiagnosticData {
  auth_uid: string | null;
  user_exists: boolean;
  role_record: { role: string; user_id: string } | null;
  has_hr_role: boolean;
  has_admin_role: boolean;
}

export function RoleDiagnostics() {
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('debug_user_role');
      
      if (error) {
        console.error('Diagnostic error:', error);
        return;
      }
      
      setDiagnosticData(data as unknown as DiagnosticData);
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  if (!diagnosticData && !loading) {
    return null;
  }

  const canCreateEmployees = diagnosticData?.has_hr_role || diagnosticData?.has_admin_role;

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4" />
          Role Diagnostics
          <Button
            variant="ghost"
            size="sm"
            onClick={runDiagnostics}
            disabled={loading}
            className="ml-auto h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        {loading ? (
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span className="text-muted-foreground">Running diagnostics...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span>Authentication:</span>
              {diagnosticData?.auth_uid ? (
                <Badge variant="default" className="h-5 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Authenticated
                </Badge>
              ) : (
                <Badge variant="destructive" className="h-5 text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Authenticated
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span>Current Role:</span>
              <Badge 
                variant={canCreateEmployees ? "default" : "secondary"} 
                className="h-5 text-xs"
              >
                {diagnosticData?.role_record?.role || 'No Role'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Can Create Employees:</span>
              {canCreateEmployees ? (
                <Badge variant="default" className="h-5 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Yes
                </Badge>
              ) : (
                <Badge variant="destructive" className="h-5 text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  No
                </Badge>
              )}
            </div>
            
            {!canCreateEmployees && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800">
                ⚠️ You need HR or Admin role to create employee profiles.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}