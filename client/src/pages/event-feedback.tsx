import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import EventFeedbackForm from '@/modules/Events/EventFeedbackForm';
import EventFeedbackAdmin from '@/modules/Admin/EventFeedbackAdmin';
import { MessageSquare, Star, Users, Calendar } from 'lucide-react';

interface Event {
  id: number;
  name: string;
  date: string;
  time: string;
  status: string;
  eventType: string;
}

export default function EventFeedbackPage() {
  const { user } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'submit' | 'admin'>('submit');

  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['/api/events']
  });

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const isAdmin = user && ['admin', 'manager'].includes(user.role);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Feedback System</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Submit feedback or review responses from participants' : 'Share your experience with events you\'ve attended'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'submit' ? 'default' : 'outline'}
              onClick={() => setViewMode('submit')}
              size="sm"
            >
              Submit Feedback
            </Button>
            <Button
              variant={viewMode === 'admin' ? 'default' : 'outline'}
              onClick={() => setViewMode('admin')}
              size="sm"
            >
              Review Feedback
            </Button>
          </div>
        )}
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Select Event
          </CardTitle>
          <CardDescription>
            Choose an event to {viewMode === 'admin' ? 'review feedback for' : 'provide feedback on'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading events...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No events available</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Label className="text-sm font-medium">Choose an event:</Label>
              <Select value={selectedEventId?.toString() || ''} onValueChange={(value) => setSelectedEventId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event..." />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <span>{event.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {event.eventType}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Content */}
      {selectedEventId && selectedEvent && (
        <div className="space-y-6">
          {viewMode === 'submit' ? (
            <EventFeedbackForm 
              eventId={selectedEventId} 
              eventName={selectedEvent.name}
            />
          ) : (
            <EventFeedbackAdmin 
              eventId={selectedEventId}
              eventName={selectedEvent.name}
            />
          )}
        </div>
      )}

      {/* Demo Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-700">
            <MessageSquare className="h-5 w-5 mr-2" />
            Event Feedback System Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">For Participants:</h4>
              <ul className="text-sm space-y-1">
                <li>• Submit ratings (1-5 stars) for events you've attended</li>
                <li>• Add optional comments about your experience</li>
                <li>• One feedback submission per event per user</li>
                <li>• Helps improve future events</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">For Administrators:</h4>
              <ul className="text-sm space-y-1">
                <li>• View all feedback for any event</li>
                <li>• See average ratings and response statistics</li>
                <li>• Filter and search through feedback</li>
                <li>• Export capabilities for reporting</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}