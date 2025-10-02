import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, RefreshCw, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔧 [RoleDiagnostics] Running diagnostics...');
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      console.log('🔐 [RoleDiagnostics] Session:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email
      });

      // Call debug function
      const { data, error: rpcError } = await supabase.rpc('debug_user_role');
      
      console.log('📊 [RoleDiagnostics] Debug response:', {
        data,
        error: rpcError
      });

      if (rpcError) throw rpcError;
      
      setDiagnosticData(data as unknown as DiagnosticData);
    } catch (err: any) {
      console.error('❌ [RoleDiagnostics] Error:', err);
      setError(err.message || 'Failed to run diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const canCreateEmployees = diagnosticData?.has_hr_role || diagnosticData?.has_admin_role;
  const currentRole = diagnosticData?.role_record?.role || 'employee';

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Shield className="h-5 w-5" />
          Role & Permissions Diagnostics
        </CardTitle>
        <CardDescription>
          Current user authentication and permission status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : diagnosticData ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Authentication Status:</span>
                  {diagnosticData.auth_uid ? (
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Authenticated
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Authenticated
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User Exists:</span>
                  {diagnosticData.user_exists ? (
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Yes
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      No
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Role:</span>
                  <Badge variant={canCreateEmployees ? "default" : "secondary"}>
                    {currentRole.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Can Create Employees:</span>
                  {canCreateEmployees ? (
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Yes
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      No
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {!canCreateEmployees && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  You need HR or Admin role to create employee profiles. Please contact your administrator to be assigned the appropriate role.
                </AlertDescription>
              </Alert>
            )}

            {diagnosticData.auth_uid && (
              <div className="pt-2 border-t">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>User ID: {diagnosticData.auth_uid}</span>
                </div>
              </div>
            )}

            <Button 
              onClick={runDiagnostics} 
              variant="outline" 
              size="sm" 
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Diagnostics
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}