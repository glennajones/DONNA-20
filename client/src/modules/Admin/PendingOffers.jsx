import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Clock, UserCheck, RefreshCw, AlertCircle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { getOutreachStatus, handleCoachResponse, initiateOutreach } from "@/services/CoachOutreachService";

export default function PendingOffers({ selectedEventId }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchOfferStatus(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/schedule-events', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const eventData = await response.json();
        setEvents(eventData);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const fetchOfferStatus = async (eventId) => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      const status = await getOutreachStatus(eventId);
      setOffers(status);
      
      const event = events.find(e => e.id === parseInt(eventId));
      setSelectedEvent(event);
    } catch (error) {
      console.error('Failed to fetch offer status:', error);
      toast({
        title: "Error",
        description: "Failed to load outreach status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForceAssign = async (coachId, coachName) => {
    try {
      await handleCoachResponse(selectedEventId, coachId, 'accept');
      await fetchOfferStatus(selectedEventId);
      toast({
        title: "Success",
        description: `${coachName} has been assigned to the event.`
      });
    } catch (error) {
      console.error('Failed to force assign coach:', error);
      toast({
        title: "Error",
        description: "Failed to assign coach. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReinitiate = async (coachId, coachName) => {
    try {
      await initiateOutreach(selectedEventId, [coachId], {
        reminders: [1, 3, 5],
        templates: {
          initial: "Hi {{coachName}}, we have a follow-up coaching opportunity for {{eventName}}. Are you available? Please respond: {{responseLink}}",
          reminder: "Hi {{coachName}}, following up on the coaching opportunity for {{eventName}}. Please let us know: {{responseLink}}"
        }
      });
      await fetchOfferStatus(selectedEventId);
      toast({
        title: "Success",
        description: `Outreach re-initiated for ${coachName}.`
      });
    } catch (error) {
      console.error('Failed to re-initiate outreach:', error);
      toast({
        title: "Error",
        description: "Failed to re-initiate outreach. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleMarkDeclined = async (coachId, coachName) => {
    try {
      await handleCoachResponse(selectedEventId, coachId, 'decline');
      await fetchOfferStatus(selectedEventId);
      toast({
        title: "Success",
        description: `${coachName} marked as declined.`
      });
    } catch (error) {
      console.error('Failed to mark as declined:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (response) => {
    switch (response) {
      case 'accept': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'decline': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'escalated': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (response) => {
    switch (response) {
      case 'accept': return 'default';
      case 'decline': return 'destructive';
      case 'escalated': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusDisplay = (response) => {
    switch (response) {
      case 'accept': return 'Assigned';
      case 'decline': return 'Declined';
      case 'escalated': return 'Escalated';
      case null:
      case undefined: return 'Pending';
      default: return response;
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const then = new Date(timestamp);
    const diffInHours = Math.floor((now - then) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const filteredOffers = filter ? offers.filter(offer => {
    if (filter === 'pending') return !offer.response;
    return offer.response === filter;
  }) : offers;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Coach Outreach Status</h1>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedEventId?.toString() || ''} onValueChange={(value) => fetchOfferStatus(parseInt(value))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose an event to view outreach status" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  {event.title} - {event.date} at {event.time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedEvent && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">{selectedEvent.title}</h3>
              <p className="text-blue-700 dark:text-blue-300">
                {selectedEvent.date} at {selectedEvent.time} - {selectedEvent.court}
              </p>
              {selectedEvent.description && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">{selectedEvent.description}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEventId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Outreach Status ({filteredOffers.length} coaches)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accept">Assigned</SelectItem>
                    <SelectItem value="decline">Declined</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchOfferStatus(selectedEventId)}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading outreach status...</p>
              </div>
            ) : filteredOffers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No outreach records found for this event</p>
                <p className="text-sm mt-2">Outreach may not have been initiated yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coach</TableHead>
                    <TableHead>Contact Method</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Last Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOffers.map((offer) => (
                    <TableRow key={`${offer.coachId}-${offer.eventId}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(offer.response)}
                          <div>
                            <div>{offer.coachName || `Coach ${offer.coachId}`}</div>
                            {offer.responseDetails && (
                              <div className="text-xs text-gray-500 mt-1">{offer.responseDetails}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {offer.channel.charAt(0).toUpperCase() + offer.channel.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <span className="font-mono text-sm">{offer.attemptNumber}</span>
                          {offer.remindersSent > 0 && (
                            <div className="text-xs text-gray-500">+{offer.remindersSent} reminders</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{getTimeAgo(offer.timestamp)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(offer.response)}>
                          {getStatusDisplay(offer.response)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!offer.response && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReinitiate(offer.coachId, offer.coachName)}
                                className="flex items-center gap-1"
                              >
                                <RefreshCw className="h-3 w-3" />
                                Re-initiate
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="default" className="flex items-center gap-1">
                                    <UserCheck className="h-3 w-3" />
                                    Force Assign
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Force Assign Coach</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to assign {offer.coachName || `Coach ${offer.coachId}`} to this event without their response?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleForceAssign(offer.coachId, offer.coachName)}>
                                      Force Assign
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                          {offer.response === 'accept' && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Assigned
                            </Badge>
                          )}
                          {offer.response === 'decline' && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Declined
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}