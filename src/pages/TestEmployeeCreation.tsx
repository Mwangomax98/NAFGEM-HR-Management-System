import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuickLogin } from '@/components/auth/QuickLogin';
import AddEmployeeForm from '@/components/employee/AddEmployeeForm';
import { useToast } from '@/hooks/use-toast';

export default function TestEmployeeCreation() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: role } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        setUserRole(role);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    setShowForm(false);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  const handleEmployeeSaved = () => {
    toast({
      title: "Success",
      description: "Employee has been saved successfully!",
    });
    setShowForm(false);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Employee Creation Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <div className="space-y-4">
              <p>Please login to test employee creation</p>
              <QuickLogin />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium">Current User:</h3>
                <p>Email: {user.email}</p>
                <p>Role: {userRole?.role || 'No role assigned'}</p>
                <p>Can create employees: {['hr', 'admin'].includes(userRole?.role) ? 'Yes' : 'No'}</p>
              </div>
              
              <div className="flex gap-4">
                <Button onClick={() => setShowForm(!showForm)}>
                  {showForm ? 'Hide' : 'Show'} Employee Form
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && user && (
        <AddEmployeeForm
          onSave={handleEmployeeSaved}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}