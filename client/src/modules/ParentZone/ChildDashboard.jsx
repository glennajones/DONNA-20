import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, MessageCircle, CheckCircle, Clock, User, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ChildDashboard() {
  const [activities, setActivities] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [childInfo, setChildInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchChildDashboardData();
  }, []);

  const fetchChildDashboardData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Fetch child's upcoming activities
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
        }).slice(0, 4); // Show only next 4 activities for child
        
        setActivities(upcoming);
      }

      // Fetch players to get child info (for parent view)
      const playersResponse = await fetch('/api/players', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (playersResponse.ok) {
        const players = await playersResponse.json();
        // For demo, take the first player as the child
        if (players.length > 0) {
          setChildInfo(players[0]);
        }
      }

      // Mock invoice data (would integrate with actual billing system)
      const mockInvoices = [
        { id: 101, label: "Summer Camp Registration", amount: 150, dueDate: "2025-08-01", status: "Open" },
        { id: 102, label: "Equipment Fee", amount: 75, dueDate: "2025-07-28", status: "Overdue" }
      ];
      setInvoices(mockInvoices);

    } catch (error) {
      console.error('Failed to fetch child dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMessageCoach = () => {
    toast({
      title: "Message Coach",
      description: "Opening communication system to contact your child's coach.",
    });
    // Would integrate with actual messaging system
  };

  const handlePayInvoice = (invoiceId) => {
    toast({
      title: "Payment Processing",
      description: "Redirecting to secure payment portal...",
    });
    // Would integrate with actual payment system
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <User className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {childInfo ? `${childInfo.firstName}'s Dashboard` : "Child Dashboard"}
        </h1>
      </div>

      {/* Child Information Card */}
      {childInfo && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {childInfo.firstName} {childInfo.lastName}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Age: {childInfo.age} • Team: {childInfo.team || 'Not assigned'}
                </p>
                <Badge variant="outline" className={`mt-1 ${
                  childInfo.status === 'active' ? 'text-green-600 border-green-600' : 'text-gray-600 border-gray-600'
                }`}>
                  {childInfo.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Child's Calendar */}
        <Card>
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
                  <div key={activity.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-start justify-between">
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing Center */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-yellow-600" />
              Billing Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No outstanding invoices</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{invoice.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Due: {invoice.dueDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${invoice.amount}</p>
                        <Badge 
                          variant={invoice.status === 'Overdue' ? 'destructive' : 'secondary'}
                          className="flex items-center gap-1"
                        >
                          {invoice.status === 'Overdue' ? (
                            <AlertCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handlePayInvoice(invoice.id)}
                      variant={invoice.status === 'Overdue' ? 'destructive' : 'default'}
                      className="w-full"
                    >
                      Pay Now
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Message Coach */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Message Coach</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Contact your child's coach directly
                </p>
              </div>
            </div>
            <Button onClick={handleMessageCoach} className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}