import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertCircle, Mail, Send, Eye, Clock, Settings, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';

export default function DailyEmailSettings() {
  const { user } = useAuth();
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTriggeringEmail, setIsTriggeringEmail] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [testResults, setTestResults] = useState<any>(null);
  const [triggerResults, setTriggerResults] = useState<any>(null);
  
  // Settings state
  const [dailyEmailEnabled, setDailyEmailEnabled] = useState(true);
  const [dailyEmailTime, setDailyEmailTime] = useState('18:00');
  
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user?.id]);

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const settings = await apiRequest(`/api/admin-settings/${user?.id}`);
      setDailyEmailEnabled(settings.dailyEmailEnabled);
      setDailyEmailTime(settings.dailyEmailTime?.slice(0, 5) || '18:00');
    } catch (error: any) {
      toast({
        title: "Error Loading Settings",
        description: error.response?.data?.message || "Failed to load admin settings",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await apiRequest('/api/admin-settings', {
        method: 'POST',
        body: JSON.stringify({
          adminId: user?.id,
          dailyEmailEnabled,
          dailyEmailTime: `${dailyEmailTime}:00`
        })
      });
      
      toast({
        title: "Settings Saved",
        description: "Your daily email preferences have been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.response?.data?.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    try {
      const response = await apiRequest('/api/admin/daily-email/test');
      setTestResults(response);
      toast({
        title: "Email Template Generated",
        description: `Found ${response.eventCounts.courtEvents + response.eventCounts.personalEvents + response.eventCounts.scheduleEvents} events for tomorrow`,
      });
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.response?.data?.message || "Failed to generate email template",
        variant: "destructive",
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleTriggerEmail = async () => {
    setIsTriggeringEmail(true);
    try {
      const response = await apiRequest('/api/admin/daily-email/trigger', {
        method: 'POST',
      });
      setTriggerResults(response);
      
      const successCount = response.results.filter((r: any) => r.status === 'sent').length;
      toast({
        title: "Emails Sent",
        description: `Successfully sent daily emails to ${successCount} admin(s)`,
      });
    } catch (error: any) {
      toast({
        title: "Send Failed",
        description: error.response?.data?.message || "Failed to send daily emails",
        variant: "destructive",
      });
    } finally {
      setIsTriggeringEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Daily Email Settings</h2>
        <p className="text-muted-foreground">
          Manage automated daily schedule emails for administrators
        </p>
      </div>

      {/* Email Schedule Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Email Schedule Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingSettings ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="daily-email-enabled" className="text-base font-medium">
                    Enable Daily Emails
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive automated emails with tomorrow's schedule
                  </p>
                </div>
                <Switch
                  id="daily-email-enabled"
                  checked={dailyEmailEnabled}
                  onCheckedChange={setDailyEmailEnabled}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <Label htmlFor="daily-email-time" className="text-base font-medium">
                  Send Time
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="daily-email-time"
                    type="time"
                    value={dailyEmailTime}
                    onChange={(e) => setDailyEmailTime(e.target.value)}
                    disabled={!dailyEmailEnabled}
                    className="w-32"
                  />
                  <p className="text-sm text-muted-foreground">
                    {dailyEmailEnabled ? 'Emails will be sent daily at this time' : 'Enable daily emails to set time'}
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={saveSettings} 
                disabled={isSavingSettings}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSavingSettings ? 'Saving Settings...' : 'Save Email Settings'}
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded p-3">
                <AlertCircle className="h-4 w-4" />
                <span>Emails include tomorrow's court activities, training sessions, and personal events</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Test Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Test Email Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate a preview of tomorrow's daily email template without sending it
          </p>
          
          <Button 
            onClick={handleTestEmail} 
            disabled={isTestingEmail}
            variant="outline"
            className="w-full"
          >
            <Eye className="h-4 w-4 mr-2" />
            {isTestingEmail ? 'Generating Preview...' : 'Preview Tomorrow\'s Email'}
          </Button>

          {testResults && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Email Preview Generated</span>
                <Badge variant="secondary">Success</Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-lg">{testResults.eventCounts.courtEvents}</div>
                  <div className="text-muted-foreground">Court Events</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-lg">{testResults.eventCounts.scheduleEvents}</div>
                  <div className="text-muted-foreground">Training Sessions</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-lg">{testResults.eventCounts.personalEvents}</div>
                  <div className="text-muted-foreground">Personal Events</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Email Now */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Manual Email Send
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Manually trigger the daily email to all administrators now
          </p>
          
          <Button 
            onClick={handleTriggerEmail} 
            disabled={isTriggeringEmail}
            className="w-full"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isTriggeringEmail ? 'Sending Emails...' : 'Send Daily Emails Now'}
          </Button>

          {triggerResults && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Email Send Results</span>
                <Badge variant="secondary">Completed</Badge>
              </div>
              
              <div className="space-y-2">
                {triggerResults.results.map((result: any, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-muted/50 rounded p-3">
                    <div>
                      <div className="font-medium">{result.admin}</div>
                      {result.email && (
                        <div className="text-sm text-muted-foreground">{result.email}</div>
                      )}
                      {result.reason && (
                        <div className="text-sm text-muted-foreground">{result.reason}</div>
                      )}
                    </div>
                    <Badge 
                      variant={result.status === 'sent' ? 'default' : result.status === 'failed' ? 'destructive' : 'secondary'}
                    >
                      {result.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p>• Each admin can configure their own email preferences and send time</p>
            <p>• The system checks every 5 minutes and sends emails at configured times</p>
            <p>• Emails include all events scheduled for the next day</p>
            <p>• Only admins with enabled settings and email addresses receive notifications</p>
            <p>• The email includes court activities, training sessions, and personal events</p>
            <p>• All email activity is logged for monitoring and troubleshooting</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}