import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Key, MessageSquare, Bell, Save, Shield } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    chatEnabled: true,
    pushEnabled: false,
    emailNotifications: true,
    maintenanceMode: false
  });
  
  const [apiKeys, setApiKeys] = useState({
    stripe: '',
    google: '',
    pusher: '',
    twilio: '',
    sendgrid: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // In a real implementation, these would come from your backend
      // For now, we'll use localStorage or default values
      const savedSettings = localStorage.getItem('system_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
      
      const savedApiKeys = localStorage.getItem('api_keys');
      if (savedApiKeys) {
        const parsedKeys = JSON.parse(savedApiKeys);
        // Mask the keys for security (show only last 4 characters)
        const maskedKeys = Object.keys(parsedKeys).reduce((acc, key) => {
          acc[key] = parsedKeys[key] ? '****' + parsedKeys[key].slice(-4) : '';
          return acc;
        }, {});
        setApiKeys(maskedKeys);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
  };

  const handleKeyChange = (e) => {
    const { name, value } = e.target;
    setApiKeys(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real implementation, you would send these to your backend
      localStorage.setItem('system_settings', JSON.stringify(settings));
      
      // Only save non-empty API keys
      const keysToSave = Object.keys(apiKeys).reduce((acc, key) => {
        if (apiKeys[key] && !apiKeys[key].startsWith('****')) {
          acc[key] = apiKeys[key];
        }
        return acc;
      }, {});
      
      if (Object.keys(keysToSave).length > 0) {
        localStorage.setItem('api_keys', JSON.stringify(keysToSave));
      }

      toast({
        title: "Success",
        description: "Settings saved successfully."
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-60 bg-gray-200 rounded"></div>
          <div className="h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
      </div>

      {/* System Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Real-Time Chat
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enable real-time messaging between coaches, players, and parents
              </p>
            </div>
            <Switch
              checked={settings.chatEnabled}
              onCheckedChange={(value) => handleSettingChange('chatEnabled', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Push Notifications
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Send push notifications for important updates and events
              </p>
            </div>
            <Switch
              checked={settings.pushEnabled}
              onCheckedChange={(value) => handleSettingChange('pushEnabled', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Email Notifications</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Send email notifications for registrations and important updates
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(value) => handleSettingChange('emailNotifications', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Maintenance Mode</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Temporarily disable access for system maintenance
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(value) => handleSettingChange('maintenanceMode', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys & Integrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stripe">Stripe API Key</Label>
              <Input
                id="stripe"
                name="stripe"
                type="password"
                value={apiKeys.stripe}
                onChange={handleKeyChange}
                placeholder="sk_test_..."
              />
              <p className="text-xs text-gray-500 mt-1">For payment processing</p>
            </div>

            <div>
              <Label htmlFor="google">Google OAuth Client ID</Label>
              <Input
                id="google"
                name="google"
                type="password"
                value={apiKeys.google}
                onChange={handleKeyChange}
                placeholder="123456789..."
              />
              <p className="text-xs text-gray-500 mt-1">For calendar integration</p>
            </div>

            <div>
              <Label htmlFor="pusher">Pusher App Key</Label>
              <Input
                id="pusher"
                name="pusher"
                type="password"
                value={apiKeys.pusher}
                onChange={handleKeyChange}
                placeholder="app-key..."
              />
              <p className="text-xs text-gray-500 mt-1">For real-time features</p>
            </div>

            <div>
              <Label htmlFor="twilio">Twilio API Key</Label>
              <Input
                id="twilio"
                name="twilio"
                type="password"
                value={apiKeys.twilio}
                onChange={handleKeyChange}
                placeholder="AC..."
              />
              <p className="text-xs text-gray-500 mt-1">For SMS notifications</p>
            </div>

            <div>
              <Label htmlFor="sendgrid">SendGrid API Key</Label>
              <Input
                id="sendgrid"
                name="sendgrid"
                type="password"
                value={apiKeys.sendgrid}
                onChange={handleKeyChange}
                placeholder="SG..."
              />
              <p className="text-xs text-gray-500 mt-1">For email services</p>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Security Notice</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  API keys are sensitive information. Ensure they are stored securely and never shared publicly.
                  In production, these should be stored as environment variables.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}