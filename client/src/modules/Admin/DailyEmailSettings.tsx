import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Mail, Send, Eye, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function DailyEmailSettings() {
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTriggeringEmail, setIsTriggeringEmail] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [triggerResults, setTriggerResults] = useState<any>(null);
  const { toast } = useToast();

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

      {/* Email Schedule Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Daily Send Time</p>
              <p className="text-sm text-muted-foreground">Emails are automatically sent every day at 6:00 PM</p>
            </div>
            <Badge variant="outline">6:00 PM Daily</Badge>
          </div>
          
          <Separator />
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Emails include tomorrow's court activities, training sessions, and personal events</span>
          </div>
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
            <p>• The system automatically sends daily schedule emails at 6:00 PM</p>
            <p>• Emails include all events scheduled for the next day</p>
            <p>• Only administrators with email addresses receive the notifications</p>
            <p>• The email includes court activities, training sessions, and personal events</p>
            <p>• The cron job runs in the background and logs all activity</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}