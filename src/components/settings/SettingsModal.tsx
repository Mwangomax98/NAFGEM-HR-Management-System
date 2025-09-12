import { useState } from "react";
import { Settings, User, Bell, Shield, Palette, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/providers/ThemeProvider";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/use-toast";

export function SettingsModal() {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation('common');
  
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      desktop: false,
      timesheet: true,
      leave: true,
      tasks: false
    },
    privacy: {
      profileVisible: true,
      statusVisible: true,
      activityTracking: false
    },
    preferences: {
      timezone: "UTC+3", // Kenya timezone
      dateFormat: "DD/MM/YYYY",
      startWeek: "monday"
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

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
    toast({
      title: t('messages.success'),
      description: language === 'en' ? 'Language changed to English' : 'Lugha imebadilishwa kuwa Kiswahili',
    });
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    toast({
      title: t('messages.success'),
      description: t('settings.saveChanges'),
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
          <DialogDescription>
            Manage your account preferences and system settings
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>{t('settings.general')}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>{t('settings.notifications')}</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>{t('settings.privacy')}</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>{t('settings.appearance')}</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 h-96 overflow-y-auto">
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.language')} & Region</CardTitle>
                  <CardDescription>Set your language and regional preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('settings.language')}</Label>
                      <Select 
                        value={i18n.language} 
                        onValueChange={handleLanguageChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="sw">Kiswahili</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select 
                        value={settings.preferences.timezone} 
                        onValueChange={(value) => updateSetting('preferences', 'timezone', value)}
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date Format</Label>
                      <Select 
                        value={settings.preferences.dateFormat} 
                        onValueChange={(value) => updateSetting('preferences', 'dateFormat', value)}
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
                      <Label>Week Starts On</Label>
                      <Select 
                        value={settings.preferences.startWeek} 
                        onValueChange={(value) => updateSetting('preferences', 'startWeek', value)}
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Delivery Methods</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <Switch 
                          id="email-notifications"
                          checked={settings.notifications.email}
                          onCheckedChange={(checked) => updateSetting('notifications', 'email', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <Switch 
                          id="push-notifications"
                          checked={settings.notifications.push}
                          onCheckedChange={(checked) => updateSetting('notifications', 'push', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="desktop-notifications">Desktop Notifications</Label>
                        <Switch 
                          id="desktop-notifications"
                          checked={settings.notifications.desktop}
                          onCheckedChange={(checked) => updateSetting('notifications', 'desktop', checked)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-3">Notification Types</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="timesheet-notifications">Timesheet Updates</Label>
                        <Switch 
                          id="timesheet-notifications"
                          checked={settings.notifications.timesheet}
                          onCheckedChange={(checked) => updateSetting('notifications', 'timesheet', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="leave-notifications">Leave Requests</Label>
                        <Switch 
                          id="leave-notifications"
                          checked={settings.notifications.leave}
                          onCheckedChange={(checked) => updateSetting('notifications', 'leave', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="task-notifications">Task Assignments</Label>
                        <Switch 
                          id="task-notifications"
                          checked={settings.notifications.tasks}
                          onCheckedChange={(checked) => updateSetting('notifications', 'tasks', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>Control your privacy and data sharing preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="profile-visible">Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">Allow others to see your profile information</p>
                    </div>
                    <Switch 
                      id="profile-visible"
                      checked={settings.privacy.profileVisible}
                      onCheckedChange={(checked) => updateSetting('privacy', 'profileVisible', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="status-visible">Status Visibility</Label>
                      <p className="text-sm text-muted-foreground">Show your online/offline status to colleagues</p>
                    </div>
                    <Switch 
                      id="status-visible"
                      checked={settings.privacy.statusVisible}
                      onCheckedChange={(checked) => updateSetting('privacy', 'statusVisible', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="activity-tracking">Activity Tracking</Label>
                      <p className="text-sm text-muted-foreground">Allow system to track your activity for insights</p>
                    </div>
                    <Switch 
                      id="activity-tracking"
                      checked={settings.privacy.activityTracking}
                      onCheckedChange={(checked) => updateSetting('privacy', 'activityTracking', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Theme & Appearance</CardTitle>
                  <CardDescription>Customize the look and feel of your workspace</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label>{t('settings.theme')}</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        className="flex items-center space-x-2 h-auto p-3"
                        onClick={() => handleThemeChange('light')}
                      >
                        <Sun className="w-4 h-4" />
                        <span>{t('settings.lightMode')}</span>
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        className="flex items-center space-x-2 h-auto p-3"
                        onClick={() => handleThemeChange('dark')}
                      >
                        <Moon className="w-4 h-4" />
                        <span>{t('settings.darkMode')}</span>
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        className="flex items-center space-x-2 h-auto p-3"
                        onClick={() => handleThemeChange('system')}
                      >
                        <Settings className="w-4 h-4" />
                        <span>{t('settings.systemMode')}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
        
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <DialogTrigger asChild>
            <Button variant="outline">{t('actions.cancel')}</Button>
          </DialogTrigger>
          <Button>{t('settings.saveChanges')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}