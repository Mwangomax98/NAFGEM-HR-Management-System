import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings, Database, Shield, Bell, Mail, Clock, Save } from "lucide-react";
import { useState } from "react";

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    general: {
      companyName: "",
      timezone: "UTC+3",
      dateFormat: "DD/MM/YYYY",
      currency: "TZS",
      fiscalYearStart: "01-01"
    },
    email: {
      smtpServer: "",
      smtpPort: "",
      username: "",
      enableTLS: false,
      enableNotifications: false
    },
    security: {
      passwordExpiry: 90,
      minPasswordLength: 8,
      requireMFA: false,
      sessionTimeout: 480,
      loginAttempts: 5,
      enableAuditLog: false
    },
    leave: {
      defaultVacationDays: 0,
      defaultSickDays: 0,
      defaultPersonalDays: 0,
      carryOverLimit: 0,
      requireApproval: false
    },
    timesheet: {
      weekStartDay: "monday",
      defaultWorkHours: 8,
      enableOvertime: false,
      overtimeThreshold: 40,
      requireApproval: false
    }
  });

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as any),
        [key]: value
      }
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
        </div>
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Operational</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All services running
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              No data available
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              No data available
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              No backup configured
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </TabsTrigger>
          <TabsTrigger value="leave" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Leave</span>
          </TabsTrigger>
          <TabsTrigger value="timesheet" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Timesheet</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input 
                    id="companyName" 
                    value={settings.general.companyName}
                    onChange={(e) => updateSetting('general', 'companyName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={settings.general.timezone}
                    onValueChange={(value) => updateSetting('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC+3">East Africa Time (UTC+3)</SelectItem>
                      <SelectItem value="UTC+0">GMT (UTC+0)</SelectItem>
                      <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select 
                    value={settings.general.dateFormat}
                    onValueChange={(value) => updateSetting('general', 'dateFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={settings.general.currency}
                    onValueChange={(value) => updateSetting('general', 'currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure authentication and security policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                  <Input 
                    id="passwordExpiry" 
                    type="number"
                    value={settings.security.passwordExpiry}
                    onChange={(e) => updateSetting('security', 'passwordExpiry', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minPasswordLength">Minimum Password Length</Label>
                  <Input 
                    id="minPasswordLength" 
                    type="number"
                    value={settings.security.minPasswordLength}
                    onChange={(e) => updateSetting('security', 'minPasswordLength', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input 
                    id="sessionTimeout" 
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                  <Input 
                    id="loginAttempts" 
                    type="number"
                    value={settings.security.loginAttempts}
                    onChange={(e) => updateSetting('security', 'loginAttempts', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireMFA">Require Multi-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Force MFA for all admin and HR users</p>
                  </div>
                  <Switch 
                    id="requireMFA"
                    checked={settings.security.requireMFA}
                    onCheckedChange={(checked) => updateSetting('security', 'requireMFA', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableAuditLog">Enable Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">Log all user actions for security auditing</p>
                  </div>
                  <Switch 
                    id="enableAuditLog"
                    checked={settings.security.enableAuditLog}
                    onCheckedChange={(checked) => updateSetting('security', 'enableAuditLog', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure SMTP settings for system emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpServer">SMTP Server</Label>
                  <Input 
                    id="smtpServer" 
                    value={settings.email.smtpServer}
                    onChange={(e) => updateSetting('email', 'smtpServer', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input 
                    id="smtpPort" 
                    value={settings.email.smtpPort}
                    onChange={(e) => updateSetting('email', 'smtpPort', e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    value={settings.email.username}
                    onChange={(e) => updateSetting('email', 'username', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableTLS">Enable TLS Encryption</Label>
                    <p className="text-sm text-muted-foreground">Use TLS for secure email transmission</p>
                  </div>
                  <Switch 
                    id="enableTLS"
                    checked={settings.email.enableTLS}
                    onCheckedChange={(checked) => updateSetting('email', 'enableTLS', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableNotifications">Enable Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send automated email notifications to users</p>
                  </div>
                  <Switch 
                    id="enableNotifications"
                    checked={settings.email.enableNotifications}
                    onCheckedChange={(checked) => updateSetting('email', 'enableNotifications', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Management Settings</CardTitle>
              <CardDescription>Configure default leave policies and approvals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultVacationDays">Default Vacation Days</Label>
                  <Input 
                    id="defaultVacationDays" 
                    type="number"
                    value={settings.leave.defaultVacationDays}
                    onChange={(e) => updateSetting('leave', 'defaultVacationDays', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultSickDays">Default Sick Days</Label>
                  <Input 
                    id="defaultSickDays" 
                    type="number"
                    value={settings.leave.defaultSickDays}
                    onChange={(e) => updateSetting('leave', 'defaultSickDays', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultPersonalDays">Default Personal Days</Label>
                  <Input 
                    id="defaultPersonalDays" 
                    type="number"
                    value={settings.leave.defaultPersonalDays}
                    onChange={(e) => updateSetting('leave', 'defaultPersonalDays', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requireApproval">Require Manager Approval</Label>
                  <p className="text-sm text-muted-foreground">All leave requests must be approved by managers</p>
                </div>
                <Switch 
                  id="requireApproval"
                  checked={settings.leave.requireApproval}
                  onCheckedChange={(checked) => updateSetting('leave', 'requireApproval', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timesheet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timesheet Settings</CardTitle>
              <CardDescription>Configure timesheet policies and work hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weekStartDay">Week Start Day</Label>
                  <Select 
                    value={settings.timesheet.weekStartDay}
                    onValueChange={(value) => updateSetting('timesheet', 'weekStartDay', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">Sunday</SelectItem>
                      <SelectItem value="monday">Monday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultWorkHours">Default Work Hours/Day</Label>
                  <Input 
                    id="defaultWorkHours" 
                    type="number"
                    value={settings.timesheet.defaultWorkHours}
                    onChange={(e) => updateSetting('timesheet', 'defaultWorkHours', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableOvertime">Enable Overtime Tracking</Label>
                    <p className="text-sm text-muted-foreground">Track and calculate overtime hours automatically</p>
                  </div>
                  <Switch 
                    id="enableOvertime"
                    checked={settings.timesheet.enableOvertime}
                    onCheckedChange={(checked) => updateSetting('timesheet', 'enableOvertime', checked)}
                  />
                </div>
                
                {settings.timesheet.enableOvertime && (
                  <div className="space-y-2">
                    <Label htmlFor="overtimeThreshold">Overtime Threshold (hours/week)</Label>
                    <Input 
                      id="overtimeThreshold" 
                      type="number"
                      value={settings.timesheet.overtimeThreshold}
                      onChange={(e) => updateSetting('timesheet', 'overtimeThreshold', parseInt(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}