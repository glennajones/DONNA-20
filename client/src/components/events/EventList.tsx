import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Users, DollarSign, Edit2, Trash2, Eye, Plus, Save, X, Repeat, User, Search } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

import type { Event } from "@shared/schema";

interface CoachRate {
  profile: string;
  rate: number;
}

interface MiscExpense {
  item: string;
  cost: number;
}

export function EventList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [actualRevenue, setActualRevenue] = useState<number>(0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Event>>({});
  const [enableRecurring, setEnableRecurring] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recurringSettings, setRecurringSettings] = useState({
    frequency: "weekly" as "weekly" | "daily" | "monthly",
    daysOfWeek: [] as string[],
    endDate: "",
    occurrences: 1,
  });

  // Available courts from the scheduling system
  const availableCourts = [
    "Court 1", "Court 2", "Court 3", "Court 4", 
    "Court 5", "Court 6", "Court 7", "Beach 1", "Beach 2"
  ];

  const { data: events, isLoading, error } = useQuery({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await apiRequest("/api/events");
      const data = await response.json();
      return data as Event[];
    }
  });

  // Ensure events is always an array
  const eventsList = Array.isArray(events) ? events : [];

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) {
      return eventsList;
    }
    
    const query = searchQuery.toLowerCase();
    return eventsList.filter(event => 
      event.name?.toLowerCase().includes(query) ||
      event.eventType?.toLowerCase().includes(query) ||
      event.status?.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query) ||
      event.assignedCourts?.some(court => court?.toLowerCase().includes(query))
    );
  }, [eventsList, searchQuery]);

  const deleteEvent = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/events/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      // Invalidate all schedule queries (with any date range parameters)
      queryClient.invalidateQueries({ 
        queryKey: ["/api/schedule"],
        exact: false  // This will invalidate all queries that start with "/api/schedule"
      });
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
      // Invalidate all schedule queries (with any date range parameters)
      queryClient.invalidateQueries({ 
        queryKey: ["/api/schedule"],
        exact: false  // This will invalidate all queries that start with "/api/schedule"
      });
      setEditingEvent(null);
      setActualRevenue(0);
      setShowEditDialog(false);
      setEditFormData({});
      setEnableRecurring(false);
      setRecurringSettings({
        frequency: "weekly",
        daysOfWeek: [],
        endDate: "",
        occurrences: 1,
      });
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

  const handleEditEvent = (event: Event) => {
    // Ensure we have at least one coach rate and one misc expense for the form
    const coachRates = Array.isArray(event.coachRates) && event.coachRates.length > 0 
      ? event.coachRates 
      : [{ profile: "", rate: 0 }];
    const miscExpenses = Array.isArray(event.miscExpenses) && event.miscExpenses.length > 0 
      ? event.miscExpenses 
      : [{ item: "", cost: 0 }];

    setEditFormData({
      name: event.name,
      eventType: event.eventType,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      location: event.location,
      players: event.players,
      courts: event.courts,
      coaches: event.coaches,
      assignedCourts: Array.isArray(event.assignedCourts) ? event.assignedCourts : [],
      feePerPlayer: event.feePerPlayer,
      status: event.status,
      coachRates: coachRates,
      miscExpenses: miscExpenses,
    });
    setEditingEvent(event);
    setShowEditDialog(true);
    setEnableRecurring(false);
    setRecurringSettings({
      frequency: "weekly",
      daysOfWeek: [],
      endDate: "",
      occurrences: 1,
    });
  };

  // Helper function to generate recurring event dates
  const generateRecurringDates = () => {
    const dates = [];
    const startDate = new Date(editFormData.startDate || editingEvent?.startDate || "");
    
    if (!enableRecurring) {
      return [{ startDate: editFormData.startDate || editingEvent?.startDate, endDate: editFormData.endDate || editFormData.startDate || editingEvent?.endDate || editingEvent?.startDate }];
    }

    if (recurringSettings.frequency === "weekly" && recurringSettings.daysOfWeek.length > 0) {
      const endDate = recurringSettings.endDate ? new Date(recurringSettings.endDate) : null;
      const maxOccurrences = recurringSettings.occurrences;
      let currentDate = new Date(startDate);
      let occurrenceCount = 0;

      // Find the first occurrence based on selected days
      const dayMap = {
        Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
        Thursday: 4, Friday: 5, Saturday: 6
      };

      while (occurrenceCount < maxOccurrences && (!endDate || currentDate <= endDate)) {
        const dayName = Object.keys(dayMap).find(key => dayMap[key as keyof typeof dayMap] === currentDate.getDay());
        
        if (dayName && recurringSettings.daysOfWeek.includes(dayName)) {
          // Use local date formatting to avoid timezone shifts
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          dates.push({ startDate: dateStr, endDate: dateStr });
          occurrenceCount++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (recurringSettings.frequency === "daily") {
      for (let i = 0; i < recurringSettings.occurrences; i++) {
        const eventDate = new Date(startDate);
        eventDate.setDate(startDate.getDate() + i);
        // Use local date formatting to avoid timezone shifts
        const year = eventDate.getFullYear();
        const month = String(eventDate.getMonth() + 1).padStart(2, '0');
        const day = String(eventDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        dates.push({ startDate: dateStr, endDate: dateStr });
      }
    } else if (recurringSettings.frequency === "monthly") {
      for (let i = 0; i < recurringSettings.occurrences; i++) {
        const eventDate = new Date(startDate);
        eventDate.setMonth(startDate.getMonth() + i);
        // Use local date formatting to avoid timezone shifts
        const year = eventDate.getFullYear();
        const month = String(eventDate.getMonth() + 1).padStart(2, '0');
        const day = String(eventDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        dates.push({ startDate: dateStr, endDate: dateStr });
      }
    }

    return dates.length > 0 ? dates : [{ startDate: editFormData.startDate || editingEvent?.startDate, endDate: editFormData.endDate || editFormData.startDate || editingEvent?.endDate || editingEvent?.startDate }];
  };

  const handleSaveEdit = async () => {
    if (editingEvent && editFormData) {
      try {
        if (enableRecurring) {
          // Create multiple events based on recurring settings
          const eventDates = generateRecurringDates();
          const createdEvents = [];

          for (let i = 0; i < eventDates.length; i++) {
            const { startDate, endDate } = eventDates[i];
            const eventName = eventDates.length > 1 ? `${editFormData.name} #${i + 1}` : editFormData.name;
            
            const eventData = {
              ...editFormData,
              name: eventName,
              startDate: startDate,
              endDate: endDate,
            };

            if (i === 0) {
              // Update the original event
              await updateEvent.mutateAsync({
                id: editingEvent.id,
                data: eventData
              });
            } else {
              // Create new events for additional occurrences
              const response = await apiRequest("/api/events", {
                method: "POST",
                body: JSON.stringify(eventData),
              });
              createdEvents.push(await response.json());
            }
          }

          queryClient.invalidateQueries({ queryKey: ["/api/events"] });
          // Invalidate all schedule queries (with any date range parameters)
          queryClient.invalidateQueries({ 
            queryKey: ["/api/schedule"],
            exact: false  // This will invalidate all queries that start with "/api/schedule"
          });
          setEditingEvent(null);
          setActualRevenue(0);
          setShowEditDialog(false);
          setEditFormData({});
          setEnableRecurring(false);
          setRecurringSettings({
            frequency: "weekly",
            daysOfWeek: [],
            endDate: "",
            occurrences: 1,
          });
          
          toast({
            title: "Success",
            description: `Created ${eventDates.length} recurring events`,
          });
        } else {
          // Regular single event update
          updateEvent.mutate({
            id: editingEvent.id,
            data: editFormData
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update event",
          variant: "destructive",
        });
      }
    }
  };

  const updateCoachRate = (index: number, field: keyof CoachRate, value: string | number) => {
    const coachRates = (editFormData.coachRates as CoachRate[]) || [];
    const updated = [...coachRates];
    updated[index] = { ...updated[index], [field]: field === "rate" ? Number(value) : value };
    setEditFormData({ ...editFormData, coachRates: updated });
  };

  const addCoachRate = () => {
    const coachRates = (editFormData.coachRates as CoachRate[]) || [];
    setEditFormData({ 
      ...editFormData, 
      coachRates: [...coachRates, { profile: "", rate: 0 }] 
    });
  };

  const removeCoachRate = (index: number) => {
    const coachRates = (editFormData.coachRates as CoachRate[]) || [];
    if (coachRates.length > 1) {
      setEditFormData({
        ...editFormData,
        coachRates: coachRates.filter((_, i) => i !== index)
      });
    }
  };

  const updateMiscExpense = (index: number, field: keyof MiscExpense, value: string | number) => {
    const miscExpenses = (editFormData.miscExpenses as MiscExpense[]) || [];
    const updated = [...miscExpenses];
    updated[index] = { ...updated[index], [field]: field === "cost" ? Number(value) : value };
    setEditFormData({ ...editFormData, miscExpenses: updated });
  };

  const addMiscExpense = () => {
    const miscExpenses = (editFormData.miscExpenses as MiscExpense[]) || [];
    setEditFormData({ 
      ...editFormData, 
      miscExpenses: [...miscExpenses, { item: "", cost: 0 }] 
    });
  };

  const removeMiscExpense = (index: number) => {
    const miscExpenses = (editFormData.miscExpenses as MiscExpense[]) || [];
    if (miscExpenses.length > 1) {
      setEditFormData({
        ...editFormData,
        miscExpenses: miscExpenses.filter((_, i) => i !== index)
      });
    }
  };

  // Court assignment handlers for edit form
  const toggleEditCourt = (court: string) => {
    const currentCourts = (editFormData.assignedCourts as string[]) || [];
    const updatedCourts = currentCourts.includes(court) 
      ? currentCourts.filter(c => c !== court)
      : [...currentCourts, court];
    setEditFormData({ ...editFormData, assignedCourts: updatedCourts });
  };

  const canManageEvents = user?.role === "admin" || user?.role === "manager";

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
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search events by name, type, status, location, or court..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600">
              Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </div>
          )}
        </CardContent>
      </Card>

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
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="flex justify-center py-8">
            <div className="text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">No events match your search.</div>
              <div className="text-sm text-gray-400 mt-1">Try adjusting your search terms.</div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map((event) => {
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
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {(() => {
                            // Parse coach rates to show specific coach names if available
                            let coachRates = [];
                            try {
                              coachRates = Array.isArray(event.coachRates) 
                                ? event.coachRates 
                                : typeof event.coachRates === 'string' 
                                  ? JSON.parse(event.coachRates) 
                                  : [];
                            } catch (e) {
                              coachRates = [];
                            }
                            
                            const coachNames = coachRates
                              .filter((coach: any) => coach.profile && coach.profile.trim())
                              .map((coach: any) => coach.profile.trim());
                            
                            if (coachNames.length > 0) {
                              return coachNames.length <= 2 
                                ? coachNames.join(", ")
                                : `${coachNames.slice(0, 2).join(", ")} +${coachNames.length - 2} more`;
                            }
                            
                            return `${event.coaches} coach${event.coaches !== 1 ? 'es' : ''}`;
                          })()}
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
                      
                      {canManageEvents && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEvent(event)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      
                      {canManageEvents && (
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
      {editingEvent && !showEditDialog && (
        <AlertDialog open={!!editingEvent && !showEditDialog} onOpenChange={() => setEditingEvent(null)}>
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

      {/* Edit Event Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Make changes to "{editingEvent?.name}" event details
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
            {/* Edit Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Basic Information
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name">Event Name</Label>
                    <Input
                      id="edit-name"
                      value={editFormData.name || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-eventType">Event Type</Label>
                    <Select
                      value={editFormData.eventType || "Practice"}
                      onValueChange={(value) => setEditFormData({ ...editFormData, eventType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Practice">Practice</SelectItem>
                        <SelectItem value="School Activity">School Activity</SelectItem>
                        <SelectItem value="Tournament">Tournament</SelectItem>
                        <SelectItem value="Camp">Camp</SelectItem>
                        <SelectItem value="Team Camp">Team Camp</SelectItem>
                        <SelectItem value="Social">Social</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-startDate">Start Date</Label>
                      <Input
                        id="edit-startDate"
                        type="date"
                        value={editFormData.startDate || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-endDate">End Date</Label>
                      <Input
                        id="edit-endDate"
                        type="date"
                        value={editFormData.endDate || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-startTime">Start Time</Label>
                      <Input
                        id="edit-startTime"
                        type="time"
                        value={editFormData.startTime || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-endTime">End Time</Label>
                      <Input
                        id="edit-endTime"
                        type="time"
                        value={editFormData.endTime || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-location">Location</Label>
                    <Input
                      id="edit-location"
                      value={editFormData.location || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Recurring Options */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  Recurring Options
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enable-recurring"
                      checked={enableRecurring}
                      onCheckedChange={(checked) => setEnableRecurring(!!checked)}
                    />
                    <Label htmlFor="enable-recurring" className="text-sm">
                      Create recurring events from this event
                    </Label>
                  </div>

                  {enableRecurring && (
                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="frequency">Frequency</Label>
                          <Select
                            value={recurringSettings.frequency}
                            onValueChange={(value: "weekly" | "daily" | "monthly") => 
                              setRecurringSettings({ ...recurringSettings, frequency: value, daysOfWeek: [] })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="occurrences">Number of Events</Label>
                          <Input
                            id="occurrences"
                            type="number"
                            min="1"
                            max="50"
                            value={recurringSettings.occurrences}
                            onChange={(e) => setRecurringSettings({ 
                              ...recurringSettings, 
                              occurrences: Math.max(1, Number(e.target.value) || 1) 
                            })}
                          />
                        </div>
                      </div>

                      {recurringSettings.frequency === "weekly" && (
                        <div>
                          <Label className="text-sm font-medium">Days of Week</Label>
                          <div className="grid grid-cols-7 gap-2 mt-2">
                            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                              <div key={day} className="flex items-center space-x-1">
                                <Checkbox
                                  id={`day-${day}`}
                                  checked={recurringSettings.daysOfWeek.includes(day)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setRecurringSettings({
                                        ...recurringSettings,
                                        daysOfWeek: [...recurringSettings.daysOfWeek, day]
                                      });
                                    } else {
                                      setRecurringSettings({
                                        ...recurringSettings,
                                        daysOfWeek: recurringSettings.daysOfWeek.filter(d => d !== day)
                                      });
                                    }
                                  }}
                                />
                                <Label htmlFor={`day-${day}`} className="text-xs">
                                  {day.slice(0, 3)}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="recurring-end-date">End Date (Optional)</Label>
                        <Input
                          id="recurring-end-date"
                          type="date"
                          value={recurringSettings.endDate}
                          onChange={(e) => setRecurringSettings({ ...recurringSettings, endDate: e.target.value })}
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Leave empty to use the "Number of Events" setting
                        </p>
                      </div>

                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Preview:</strong> This will create {recurringSettings.frequency === "weekly" && recurringSettings.daysOfWeek.length === 0 
                          ? "0" 
                          : recurringSettings.occurrences} event{recurringSettings.occurrences !== 1 ? "s" : ""} 
                        {recurringSettings.frequency === "weekly" && recurringSettings.daysOfWeek.length > 0 && 
                          ` on ${recurringSettings.daysOfWeek.join(", ")}`}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Resource Planning */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Resources
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-players">Players</Label>
                    <Input
                      id="edit-players"
                      type="number"
                      value={editFormData.players || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, players: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-courts">Courts</Label>
                    <Input
                      id="edit-courts"
                      type="number"
                      value={editFormData.courts || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, courts: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-coaches">Coaches</Label>
                    <Input
                      id="edit-coaches"
                      type="number"
                      value={editFormData.coaches || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, coaches: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* Court Assignment */}
                <div className="space-y-3">
                  <Label>Assigned Courts</Label>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Select specific courts for this event.
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {availableCourts.map(court => (
                      <div key={court} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-court-${court}`}
                          checked={((editFormData.assignedCourts as string[]) || []).includes(court)}
                          onCheckedChange={() => toggleEditCourt(court)}
                        />
                        <Label 
                          htmlFor={`edit-court-${court}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {court}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {((editFormData.assignedCourts as string[]) || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {((editFormData.assignedCourts as string[]) || []).map(court => (
                        <Badge key={court} variant="outline" className="text-xs">
                          {court}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Budget */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Budget
                </h4>
                <div>
                  <Label htmlFor="edit-feePerPlayer">Fee per Player ($)</Label>
                  <Input
                    id="edit-feePerPlayer"
                    type="number"
                    value={editFormData.feePerPlayer || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, feePerPlayer: e.target.value })}
                  />
                </div>

                {/* Coach Rates */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Coach Rates</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addCoachRate}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Coach
                    </Button>
                  </div>
                  {((editFormData.coachRates as CoachRate[]) || []).map((coach, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Coach profile"
                        value={coach.profile}
                        onChange={(e) => updateCoachRate(index, "profile", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Hourly Rate"
                        value={coach.rate}
                        onChange={(e) => updateCoachRate(index, "rate", e.target.value)}
                        className="w-32"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCoachRate(index)}
                        disabled={((editFormData.coachRates as CoachRate[]) || []).length === 1}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Miscellaneous Expenses */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Miscellaneous Expenses</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addMiscExpense}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Expense
                    </Button>
                  </div>
                  {((editFormData.miscExpenses as MiscExpense[]) || []).map((expense, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Expense item"
                        value={expense.item}
                        onChange={(e) => updateMiscExpense(index, "item", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Cost"
                        value={expense.cost}
                        onChange={(e) => updateMiscExpense(index, "cost", e.target.value)}
                        className="w-32"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMiscExpense(index)}
                        disabled={((editFormData.miscExpenses as MiscExpense[]) || []).length === 1}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Status */}
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editFormData.status || "planning"} onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Live Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg">Event Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editFormData.name && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Event</h4>
                      <p className="font-semibold">{editFormData.name}</p>
                      {editFormData.startDate && (
                        <p className="text-sm text-gray-600">{new Date(editFormData.startDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}

                  {editFormData.players && editFormData.players > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Resources</h4>
                      <div className="space-y-1 text-sm">
                        <p>{editFormData.players} players</p>
                        <p>{editFormData.courts} courts needed</p>
                        <p>{editFormData.coaches} coaches needed</p>
                        {(() => {
                          // Calculate event duration in hours for live calculations
                          if (!editFormData.startTime || !editFormData.endTime) return null;
                          
                          const startTime = new Date(`2000-01-01T${editFormData.startTime}`);
                          const endTime = new Date(`2000-01-01T${editFormData.endTime}`);
                          
                          // Handle overnight events
                          if (endTime <= startTime) {
                            endTime.setDate(endTime.getDate() + 1);
                          }
                          
                          const diffMs = endTime.getTime() - startTime.getTime();
                          const hours = diffMs / (1000 * 60 * 60);
                          
                          if (hours > 0) {
                            return <p>{hours.toFixed(1)} hours</p>;
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Financial Summary</h4>
                    
                    {(() => {
                      // Live financial calculations
                      const players = editFormData.players || 0;
                      const feePerPlayer = parseFloat(editFormData.feePerPlayer || "0");
                      const projectedRevenue = players * feePerPlayer;
                      
                      // Calculate event duration for coach costs
                      let eventDurationHours = 1; // default to 1 hour
                      if (editFormData.startTime && editFormData.endTime) {
                        const startTime = new Date(`2000-01-01T${editFormData.startTime}`);
                        const endTime = new Date(`2000-01-01T${editFormData.endTime}`);
                        
                        if (endTime <= startTime) {
                          endTime.setDate(endTime.getDate() + 1);
                        }
                        
                        const diffMs = endTime.getTime() - startTime.getTime();
                        eventDurationHours = Math.max(diffMs / (1000 * 60 * 60), 0);
                      }
                      
                      const coachRates = (editFormData.coachRates as CoachRate[]) || [];
                      const miscExpenses = (editFormData.miscExpenses as MiscExpense[]) || [];
                      
                      const totalCoachCost = coachRates.reduce((sum, coach) => sum + ((coach.rate || 0) * eventDurationHours), 0);
                      const totalMiscCost = miscExpenses.reduce((sum, expense) => sum + (expense.cost || 0), 0);
                      const totalCosts = totalCoachCost + totalMiscCost;
                      const netProfit = projectedRevenue - totalCosts;
                      
                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Projected Revenue:</span>
                            <span className="font-medium">${projectedRevenue.toFixed(2)}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span>Coach Costs:</span>
                            <span className="font-medium">
                              ${totalCoachCost.toFixed(2)}
                              {eventDurationHours > 0 && eventDurationHours !== 1 && (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({eventDurationHours.toFixed(1)}h)
                                </span>
                              )}
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span>Other Expenses:</span>
                            <span className="font-medium">${totalMiscCost.toFixed(2)}</span>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex justify-between font-semibold">
                            <span>Net Profit:</span>
                            <span className={netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                              ${netProfit.toFixed(2)}
                            </span>
                          </div>
                          
                          {projectedRevenue > 0 && (
                            <div className="text-xs text-gray-500">
                              {((netProfit / projectedRevenue) * 100).toFixed(1)}% margin
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={updateEvent.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateEvent.isPending}
              className="bg-[#56A0D3] hover:bg-[#4A90C2]"
            >
              {updateEvent.isPending 
                ? "Saving..." 
                : enableRecurring 
                  ? `Update & Create ${recurringSettings.occurrences} Event${recurringSettings.occurrences !== 1 ? 's' : ''}` 
                  : "Save Changes"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}