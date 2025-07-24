import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, MessageSquare, Mail, Phone } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface MessageLog {
  id: number;
  eventId: number;
  userId: number;
  channel: 'email' | 'sms' | 'groupme';
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  messageId?: string;
  timestamp: string;
  errorMessage?: string;
}

interface Acknowledgement {
  id: number;
  eventId: number;
  userId: number;
  token: string;
  acknowledgedAt: string;
}

interface Props {
  eventId: number;
  eventName: string;
}

export default function CommunicationStatus({ eventId, eventName }: Props) {
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [acknowledgements, setAcknowledgements] = useState<Acknowledgement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunicationData();
  }, [eventId]);

  const loadCommunicationData = async () => {
    try {
      setLoading(true);
      
      const [logsResponse, acksResponse] = await Promise.all([
        apiRequest('GET', `/api/events/${eventId}/message-logs`),
        apiRequest('GET', `/api/events/${eventId}/acknowledgements`)
      ]);

      const logs = await logsResponse.json();
      const acks = await acksResponse.json();
      
      setMessageLogs(logs);
      setAcknowledgements(acks);
    } catch (error) {
      console.error('Failed to load communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <Phone className="h-4 w-4" />;
      case 'groupme':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const successfulMessages = messageLogs.filter(log => ['sent', 'delivered'].includes(log.status)).length;
  const failedMessages = messageLogs.filter(log => log.status === 'failed').length;
  const acknowledgedCount = acknowledgements.length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Communication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Messages Sent</p>
                <p className="text-2xl font-bold text-green-600">{successfulMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Failed Messages</p>
                <p className="text-2xl font-bold text-red-600">{failedMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Acknowledged</p>
                <p className="text-2xl font-bold text-blue-600">{acknowledgedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Message Log - {eventName}</CardTitle>
            <Button onClick={loadCommunicationData} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {messageLogs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No messages sent yet.</p>
          ) : (
            <div className="space-y-2">
              {messageLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getChannelIcon(log.channel)}
                    <div>
                      <p className="font-medium">User {log.userId}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={log.status === 'failed' ? 'destructive' : 'default'}>
                      {log.channel.toUpperCase()}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(log.status)}
                      <span className="text-sm capitalize">{log.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acknowledgements */}
      {acknowledgements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Acknowledgements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {acknowledgements.map((ack) => (
                <div key={ack.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">User {ack.userId}</p>
                    <p className="text-sm text-gray-500">
                      Acknowledged: {new Date(ack.acknowledgedAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    ✅ Confirmed
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}