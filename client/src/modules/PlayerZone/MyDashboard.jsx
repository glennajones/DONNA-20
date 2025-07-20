import React, { useState, useEffect } from "react";
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, TrendingUp, CheckCircle, Clock, CalendarDays, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EventRegistrationModal from '@/components/scheduling/EventRegistrationModal';

export default function MyDashboard() {
  const [activities, setActivities] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [performance, setPerformance] = useState({ matches: 0, goals: 0, assists: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Fetch upcoming events/activities
      const eventsResponse = await fetch('/api/schedule-events', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (eventsResponse.ok) {
        const events = await eventsResponse.json();
        // Filter to upcoming events for the next 30 days
        const upcoming = events.filter(event => {
          const eventDate = new Date(event.date);
          const now = new Date();
          const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          return eventDate >= now && eventDate <= thirtyDaysFromNow;
        }).slice(0, 5); // Show only next 5 activities
        
        setActivities(upcoming);

        // Also set available events for registration (showing next 30 days)
        const availableForRegistration = events.filter(event => {
          const eventDate = new Date(event.date);
          const now = new Date();
          const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          return eventDate >= now && eventDate <= thirtyDaysFromNow;
        });
        setAvailableEvents(availableForRegistration);
      }

      // Fetch payment information (mock for now - would integrate with actual payment system)
      const mockPayments = [
        { id: 1, label: "Monthly Club Fee", amount: 50, due: "2025-07-25", status: "Pending" },
        { id: 2, label: "Tournament Registration", amount: 25, due: "2025-08-01", status: "Overdue" }
      ];
      setPayments(mockPayments);

      // Mock performance data (would come from actual tracking system)
      setPerformance({ matches: 12, goals: 8, assists: 5 });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEventRegistration = (event) => {
    setSelectedEvent(event);
    setIsRegistrationModalOpen(true);
  };

  const handleRegistrationSuccess = () => {
    toast({
      title: "Registration Successful",
      description: "You have successfully registered for the event!",
    });
    setIsRegistrationModalOpen(false);
    fetchDashboardData(); // Refresh data
  };

  const handleRegistrationClose = () => {
    setIsRegistrationModalOpen(false);
    setSelectedEvent(null);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Upcoming Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming activities scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{activity.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(activity.date).toLocaleDateString()} at {activity.startTime}
                      </p>
                      <p className="text-xs text-gray-500">{activity.court}</p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Registered
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{performance.matches}</div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Matches Played</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{performance.goals}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Goals</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{performance.assists}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Assists</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-600" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending payments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{payment.label}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Due: {payment.due}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${payment.amount}</p>
                    <Badge 
                      variant={payment.status === 'Overdue' ? 'destructive' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      <Clock className="h-3 w-3" />
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Calendar - Available Events for Registration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            Training Calendar - Register for Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming events available for registration</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableEvents.slice(0, 6).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border hover:border-blue-300 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{event.title}</p>
                      <Badge variant="outline" className="text-xs">
                        {event.eventType || 'Training'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.startTime} - {event.endTime}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        📍 {event.court}
                      </div>
                    </div>
                    {event.coach && (
                      <p className="text-xs text-gray-500 mt-1">Coach: {event.coach}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleEventRegistration(event)}
                    size="sm"
                    className="ml-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Register
                  </Button>
                </div>
              ))}
              {availableEvents.length > 6 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500">
                    Showing 6 of {availableEvents.length} available events
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Registration Modal */}
      {selectedEvent && (
        <EventRegistrationModal
          event={selectedEvent}
          isOpen={isRegistrationModalOpen}
          onClose={handleRegistrationClose}
          onSuccess={handleRegistrationSuccess}
        />
      )}
      </div>
    </>
  );
}