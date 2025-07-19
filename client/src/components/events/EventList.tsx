import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Users, DollarSign, Edit2, Trash2, Eye } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { Event } from "@shared/schema";

export function EventList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [actualRevenue, setActualRevenue] = useState<number>(0);

  const { data: events, isLoading, error } = useQuery({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await apiRequest("/api/events");
      return response as Event[];
    }
  });

  // Ensure events is always an array
  const eventsList = Array.isArray(events) ? events : [];

  const deleteEvent = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/events/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Event> }) => {
      const response = await apiRequest(`/api/events/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setEditingEvent(null);
      setActualRevenue(0);
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
    },
  });

  const calcNet = (event: Event) => {
    const proj = parseFloat(event.projectedRevenue || "0");
    const actual = parseFloat(event.actualRevenue || "0");
    const net = actual - proj;
    const pct = proj > 0 ? ((net / proj) * 100) : 0;
    return { net: net.toFixed(2), pct: pct.toFixed(1) };
  };

  const handleUpdateActualRevenue = (event: Event) => {
    setEditingEvent(event);
    setActualRevenue(parseFloat(event.actualRevenue || "0"));
  };

  const handleSaveActualRevenue = () => {
    if (editingEvent) {
      updateEvent.mutate({
        id: editingEvent.id,
        data: {
          actualRevenue: actualRevenue.toString(),
          status: actualRevenue > 0 ? "completed" : editingEvent.status
        }
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "active": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="text-gray-500">Loading events...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="text-red-500">Error loading events. Please try again.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {eventsList.length === 0 ? (
        <Card>
          <CardContent className="flex justify-center py-8">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">No events created yet.</div>
              <div className="text-sm text-gray-400 mt-1">Use the Event Wizard to create your first event.</div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {eventsList.map((event) => {
            const { net, pct } = calcNet(event);
            const isOverBudget = parseFloat(net) < 0;
            
            return (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold">{event.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {event.startDate} → {event.endDate}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.players} players
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(event.status)}>
                      {event.status?.charAt(0).toUpperCase() + event.status?.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-lg font-semibold text-green-600">
                        ${parseFloat(event.projectedRevenue || "0").toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">Projected Revenue</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-lg font-semibold text-blue-600">
                        ${parseFloat(event.actualRevenue || "0").toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">Actual Revenue</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className={`text-lg font-semibold ${isOverBudget ? "text-red-600" : "text-green-600"}`}>
                        ${net}
                      </div>
                      <div className="text-xs text-gray-500">Net Profit</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className={`text-lg font-semibold ${isOverBudget ? "text-red-600" : "text-green-600"}`}>
                        {pct}%
                      </div>
                      <div className="text-xs text-gray-500">Profit Margin</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{event.courts} courts</Badge>
                      <Badge variant="outline">{event.coaches} coaches</Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateActualRevenue(event)}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Update Revenue
                      </Button>
                      
                      {(user?.role === "admin" || user?.role === "manager") && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Event</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{event.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteEvent.mutate(event.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Update Actual Revenue Dialog */}
      {editingEvent && (
        <AlertDialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Update Actual Revenue</AlertDialogTitle>
              <AlertDialogDescription>
                Update the actual revenue for "{editingEvent.name}"
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="block text-sm font-medium mb-2">
                Actual Revenue ($)
              </label>
              <Input
                type="number"
                value={actualRevenue || ""}
                onChange={(e) => setActualRevenue(Number(e.target.value))}
                placeholder="Enter actual revenue"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setEditingEvent(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSaveActualRevenue}
                disabled={updateEvent.isPending}
                className="bg-[#56A0D3] hover:bg-[#4A90C2]"
              >
                {updateEvent.isPending ? "Updating..." : "Update Revenue"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}