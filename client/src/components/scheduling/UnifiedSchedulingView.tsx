import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Calendar, Grid3X3, UserPlus, Edit2, Trash2, Copy, Check, X, Plus } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import EventRegistrationModal from "./EventRegistrationModal";
import { QuickAddEventForm } from "./QuickAddEventForm";
import { ScheduleEvent } from "@shared/schema";

// Event type colors
const getEventColor = (eventType: string) => {
  const colorMap: Record<string, string> = {
    "Practice": "#56A0D3",
    "School Activity": "#10B981", 
    "Tournament": "#FF0000",
    "Camp": "#8B5CF6",
    "Team Camp": "#FFA500",
    "Social": "#EC4899",
    "training": "#56A0D3",
    "match": "#FF0000",
    "tournament": "#FF0000",
    "practice": "#56A0D3",
    "personal": "#4B0082"  // Purple color for personal/admin events
  };
  return colorMap[eventType] || "#56A0D3";
};

// Court utilities
const COURTS = ["Court 1", "Court 2", "Court 3", "Court 4", "Court 5", "Court 6", "Court 7", "Beach 1", "Beach 2"];
const TIME_SLOTS = Array.from({ length: 32 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6; // Start from 6 AM
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

// Utility functions
const getCourtAbbreviation = (court: string) => {
  if (court.startsWith("Court")) return `C${court.split(" ")[1]}`;
  if (court.startsWith("Beach")) return `B${court.split(" ")[1]}`;
  return court;
};

const getDateRange = (viewType: string, currentDate: Date) => {
  if (viewType === "day") {
    const date = currentDate.toISOString().split('T')[0];
    return { from: date, to: date };
  } else if (viewType === "week") {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return {
      from: startOfWeek.toISOString().split('T')[0],
      to: endOfWeek.toISOString().split('T')[0]
    };
  } else if (viewType === "month") {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return {
      from: startOfMonth.toISOString().split('T')[0],
      to: endOfMonth.toISOString().split('T')[0]
    };
  }
  return { from: undefined, to: undefined };
};

interface UnifiedSchedulingViewProps {
  searchQuery?: string;
  targetDate?: string | null;
}

export default function UnifiedSchedulingView({ searchQuery = "", targetDate }: UnifiedSchedulingViewProps) {
  const [viewType, setViewType] = useState<"day" | "week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateRange, setDateRange] = useState(() => getDateRange(viewType, currentDate));
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState<Date | undefined>();
  const [quickAddTime, setQuickAddTime] = useState<string | undefined>();
  
  // Grid-specific state
  const [conflictMsg, setConflictMsg] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canManageEvents = user?.role && ["admin", "manager", "coach"].includes(user.role);
  const canDelete = user?.role && ["admin", "manager"].includes(user.role);

  useEffect(() => {
    setDateRange(getDateRange(viewType, currentDate));
  }, [viewType, currentDate]);

  // Navigate to target date when provided
  useEffect(() => {
    if (targetDate) {
      const newDate = new Date(targetDate);
      if (newDate.getTime() !== currentDate.getTime()) {
        setCurrentDate(newDate);
      }
    }
  }, [targetDate, currentDate]);

  // Fetch court events
  const { data: courtEvents = [], isLoading: isLoadingCourt } = useQuery({
    queryKey: ['/api/schedule', dateRange],
    select: (data: any) => {
      if (!data?.events) return [];
      return data.events.map((event: any) => ({
        ...event,
        title: event.title || event.name,
        court: event.court || (event.assigned_courts && event.assigned_courts[0]),
        eventType: event.eventType || event.event_type || 'practice',
        type: event.eventType || event.event_type || 'practice',
        isSimpleEvent: false
      }));
    }
  });

  // Fetch simple events (personal/admin events)
  const { data: simpleEvents = [], isLoading: isLoadingSimple } = useQuery({
    queryKey: ['/api/simple-events', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.from) params.append('from', dateRange.from);
      if (dateRange.to) params.append('to', dateRange.to);
      
      const response = await apiRequest(`/api/simple-events?${params}`);
      return response.json();
    },
    select: (data: any[]) => {
      return data.map((event: any) => {
        // Use startTime field from API response, not start_time
        const startDate = new Date(event.startTime);
        // Use UTC time to match the database storage format
        const timeString = startDate.toLocaleTimeString('en-US', {
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false,
          timeZone: 'UTC'
        });
        
        const processedEvent = {
          ...event,
          court: event.location?.includes('Court') ? event.location : null,
          location: event.location || '',
          eventType: 'personal',
          type: 'personal',
          isSimpleEvent: true,
          start_time: event.startTime, // Map startTime to start_time
          end_time: event.endTime,     // Map endTime to end_time
          startTime: event.startTime,
          date: event.startTime,
          time: timeString
        };
        
        return processedEvent;
      });
    }
  });

  // Combine court events and simple events
  const events = [...courtEvents, ...simpleEvents];
  const isLoading = isLoadingCourt || isLoadingSimple;
  
  // Remove debug logging now that we've identified the issue

  // Filter events based on search query
  const filteredEvents = events.filter((event: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.title?.toLowerCase().includes(query) ||
      event.eventType?.toLowerCase().includes(query) ||
      event.court?.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query)
    );
  });

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewType === "day") {
      newDate.setDate(currentDate.getDate() - 1);
    } else if (viewType === "week") {
      newDate.setDate(currentDate.getDate() - 7);
    } else if (viewType === "month") {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === "day") {
      newDate.setDate(currentDate.getDate() + 1);
    } else if (viewType === "week") {
      newDate.setDate(currentDate.getDate() + 7);
    } else if (viewType === "month") {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Reschedule mutation for grid mode
  const rescheduleMutation = useMutation({
    mutationFn: async ({ eventId, start_time, end_time, court }: {
      eventId: number;
      start_time: string;
      end_time: string;
      court: string;
    }) => {
      const event = events.find((e: any) => e.id === eventId);
      const isScheduleEvent = event?.id?.toString().startsWith('schedule-');
      
      if (isScheduleEvent) {
        const scheduleId = event.id.toString().replace('schedule-', '');
        return apiRequest(`/api/schedule/${scheduleId}/reschedule`, {
          method: 'PUT',
          body: JSON.stringify({ start_time, end_time, court })
        });
      } else {
        return apiRequest(`/api/events/${eventId}/reschedule`, {
          method: 'PUT',
          body: JSON.stringify({ start_time, end_time, court })
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      toast({
        title: "Event Rescheduled",
        description: "The event has been moved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Reschedule Failed",
        description: "Unable to reschedule the event. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Conflict detection
  const hasConflict = (eventId: number, court: string, startTime: Date, endTime: Date) => {
    return filteredEvents.some((event: any) => {
      if (event.id === eventId) return false;
      if (event.court !== court) return false;
      
      const eventStart = new Date(event.start_time || event.startTime);
      const eventEnd = new Date(event.end_time || event.endTime);
      
      return (startTime < eventEnd && endTime > eventStart);
    });
  };

  // Drag and drop handler for grid mode
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !canManageEvents) return;

    const { draggableId, destination } = result;
    const [courtIndex, timeSlot] = destination.droppableId.split('-').slice(1);
    const eventId = parseInt(draggableId);
    const newCourt = COURTS[parseInt(courtIndex)];
    
    // Calculate new time
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const newStart = new Date(currentDate);
    newStart.setHours(hours, minutes, 0, 0);
    
    // Calculate duration from original event
    const event = filteredEvents.find((e: any) => e.id === eventId);
    if (!event) return;
    
    let duration = 60; // Default 1 hour
    if (event.start_time && event.end_time) {
      const start = new Date(event.start_time);
      const end = new Date(event.end_time);
      duration = (end.getTime() - start.getTime()) / (1000 * 60);
    } else if (event.duration) {
      duration = event.duration;
    }
    
    const newEnd = new Date(newStart.getTime() + (duration * 60000));

    // Check for conflicts
    if (hasConflict(eventId, newCourt, newStart, newEnd)) {
      setConflictMsg('⚠️ Conflict detected with another event on this court/time.');
      setTimeout(() => setConflictMsg(''), 3000);
      return;
    }
    setConflictMsg('');

    rescheduleMutation.mutate({
      eventId,
      start_time: newStart.toISOString(),
      end_time: newEnd.toISOString(),
      court: newCourt
    });
  };

  // Render different view types
  const renderCalendarView = () => {
    if (viewType === "day") {
      return renderGridView(); // Use grid view for day view
    } else if (viewType === "week") {
      return renderWeekView();
    } else if (viewType === "month") {
      return renderMonthView();
    }
    return null;
  };



  const renderWeekView = () => {
    const weekDays: Date[] = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }

    return (
      <div className="grid grid-cols-8 gap-1 text-sm">
        {/* Header */}
        <div className="font-semibold p-2">Time</div>
        {weekDays.map((day, index) => (
          <div key={index} className="font-semibold p-2 text-center">
            <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className="text-xs text-gray-500">{day.getDate()}</div>
          </div>
        ))}

        {/* Time slots */}
        {TIME_SLOTS.map((timeSlot) => (
          <div key={timeSlot} className="contents">
            <div className="p-2 text-xs text-gray-500 border-r">{timeSlot}</div>
            {weekDays.map((day, dayIndex) => {
              const dayEvents = filteredEvents.filter((event: any) => {
                const eventDate = new Date(event.start_time || event.startTime || event.date);
                const eventTime = event.time || (event.start_time && new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}));
                const slotTime = timeSlot.length === 4 ? `0${timeSlot}` : timeSlot; // Convert "9:00" to "09:00"
                
                // Remove debug logging
                
                return eventDate.toDateString() === day.toDateString() && eventTime === slotTime;
              });

              // Group events by court for multi-court display
              const courtGroups = dayEvents.reduce((groups: any, event: any) => {
                const key = event.title + '-' + event.eventType + '-' + event.id;
                if (!groups[key]) {
                  const courts = event.court ? event.court.split(', ') : [];
                  groups[key] = { ...event, courts };
                } else {
                  const courts = event.court ? event.court.split(', ') : [];
                  groups[key].courts.push(...courts);
                }
                return groups;
              }, {});

              return (
                <div 
                  key={dayIndex} 
                  className="p-1 border border-gray-200 dark:border-gray-700 min-h-[40px] relative group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => {
                    const clickDate = new Date(day);
                    const [hours, minutes] = timeSlot.split(':').map(Number);
                    clickDate.setHours(hours, minutes);
                    setQuickAddDate(clickDate);
                    setQuickAddTime(timeSlot);
                    setQuickAddModalOpen(true);
                  }}
                >
                  {/* Plus icon appears on hover */}
                  <div className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 text-gray-400">
                    <Plus className="h-3 w-3" />
                  </div>
                  
                  {Object.values(courtGroups).map((eventGroup: any, index) => (
                    <div
                      key={index}
                      className="text-xs p-1 rounded mb-1 text-white cursor-pointer hover:opacity-80 relative z-10"
                      style={{ backgroundColor: eventGroup.isSimpleEvent ? '#4B0082' : getEventColor(eventGroup.eventType) }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(eventGroup);
                      }}
                    >
                      <div className="font-medium truncate">{eventGroup.title}</div>
                      <div className="text-xs opacity-90">
                        {eventGroup.isSimpleEvent ? (
                          <span>Personal</span>
                        ) : (
                          eventGroup.courts?.map((court: string) => getCourtAbbreviation(court)).join(', ')
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderMonthView = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 text-center font-semibold text-gray-600 dark:text-gray-400">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const dayEvents = filteredEvents.filter((event: any) => {
            const eventDate = new Date(event.start_time || event.startTime || event.date);
            return eventDate.toDateString() === day.toDateString();
          });

          return (
            <div
              key={index}
              className={`border border-gray-200 dark:border-gray-700 min-h-[100px] p-1 relative group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
              }`}
              onClick={() => {
                setQuickAddDate(day);
                setQuickAddTime(undefined);
                setQuickAddModalOpen(true);
              }}
            >
              <div className={`text-sm font-medium ${isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
                {day.getDate()}
              </div>
              
              {/* Plus icon appears on hover */}
              <div className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 text-gray-400">
                <Plus className="h-3 w-3" />
              </div>
              <div className="space-y-1 mt-1">
                {dayEvents.slice(0, 3).map((event: any) => (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded text-white cursor-pointer hover:opacity-80 truncate relative z-10"
                    style={{ backgroundColor: getEventColor(event.eventType) }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderGridView = () => {
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto">
          {conflictMsg && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800">
              {conflictMsg}
            </div>
          )}
          
          <table className="w-full border-collapse bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-sm font-semibold w-20">
                  Time
                </th>
                {COURTS.map((court) => (
                  <th key={court} className="border border-gray-300 dark:border-gray-600 p-2 text-sm font-semibold min-w-[120px]">
                    {court}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((timeSlot) => (
                <tr key={timeSlot}>
                  <td className="border border-gray-300 dark:border-gray-600 p-2 text-xs text-gray-600 dark:text-gray-400 text-center bg-gray-50 dark:bg-gray-700">
                    {timeSlot}
                  </td>
                  {COURTS.map((court, courtIndex) => {
                    // Filter court events and personal events for this time slot
                    const cellEvents = filteredEvents.filter((event: any) => {
                      const eventTime = event.time || (event.start_time && new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}));
                      const slotTime = timeSlot.length === 4 ? `0${timeSlot}` : timeSlot;
                      const eventDate = new Date(event.start_time || event.startTime || event.date);
                      
                      // Remove debug logging
                      
                      // Skip if wrong date
                      if (eventDate.toDateString() !== currentDate.toDateString()) {
                        return false;
                      }
                      
                      // For court events, match by court and time
                      if (event.court === court && eventTime === slotTime) {
                        return true;
                      }
                      
                      // For personal events (isSimpleEvent), show in first court column OR in their specified court
                      if (event.isSimpleEvent && eventTime === slotTime) {
                        // If event has Court 3 location, show in Court 3 column, otherwise show in first column
                        if (event.court && event.court === court) {
                          return true;
                        } else if (!event.court && courtIndex === 0) {
                          return true;
                        }
                      }
                      
                      return false;
                    });

                    return (
                      <Droppable key={`${court}-${timeSlot}`} droppableId={`drop-${courtIndex}-${timeSlot}`}>
                        {(provided, snapshot) => (
                          <td
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`border border-gray-300 dark:border-gray-600 p-1 min-h-[50px] relative ${
                              snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900' : ''
                            }`}
                          >
                            {cellEvents.map((event: any, eventIndex: number) => (
                              <Draggable
                                key={event.id}
                                draggableId={event.id.toString()}
                                index={eventIndex}
                                isDragDisabled={!canManageEvents}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`text-xs p-2 rounded text-white cursor-pointer mb-1 ${
                                      snapshot.isDragging ? 'shadow-lg' : 'hover:opacity-80'
                                    }`}
                                    style={{
                                      backgroundColor: event.isSimpleEvent ? '#4B0082' : getEventColor(event.eventType),
                                      ...provided.draggableProps.style
                                    }}
                                  >
                                    <div className="font-medium truncate">{event.title}</div>
                                    <div className="text-xs opacity-90 truncate">
                                      {event.isSimpleEvent ? (
                                        <span className="bg-white bg-opacity-20 px-1 rounded">Personal</span>
                                      ) : (
                                        event.eventType
                                      )}
                                    </div>
                                    
                                    {canManageEvents && (
                                      <div className="flex gap-1 mt-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-4 w-4 p-0 text-white hover:bg-white/20"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditId(event.id);
                                            setEditTitle(event.title);
                                            setEditType(event.eventType);
                                          }}
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </td>
                        )}
                      </Droppable>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DragDropContext>
    );
  };

  const formatDateRange = () => {
    if (viewType === "day") {
      return currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (viewType === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (viewType === "month") {
      return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } else {
      return "Court Grid View";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* View Type Selector */}
          <div className="flex bg-white dark:bg-gray-800 border rounded-lg">
            {[
              { key: "day", label: "Day", icon: Calendar },
              { key: "week", label: "Week", icon: Calendar },
              { key: "month", label: "Month", icon: Calendar }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewType(key as any)}
                className={`px-3 py-2 text-sm flex items-center gap-2 ${
                  viewType === key
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                } first:rounded-l-lg last:rounded-r-lg`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[200px] text-center">
                {formatDateRange()}
              </span>
              <Button variant="outline" size="sm" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
        </div>

        {/* Quick Add Button - Show for all views */}
        <Button
          onClick={() => {
            setQuickAddDate(currentDate);
            setQuickAddTime(undefined);
            setQuickAddModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Quick Add Event
        </Button>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">Loading events...</div>
          ) : (
            renderCalendarView()
          )}
        </CardContent>
      </Card>

      {/* Event Registration Modal */}
      {selectedEvent && (
        <EventRegistrationModal
          isOpen={registrationModalOpen}
          onClose={() => setRegistrationModalOpen(false)}
          event={{
            ...selectedEvent,
            coach: selectedEvent.coach || undefined,
            description: selectedEvent.description || undefined
          }}
        />
      )}

      {/* Quick Add Event Modal */}
      <QuickAddEventForm
        isOpen={quickAddModalOpen}
        onOpenChange={(open) => {
          setQuickAddModalOpen(open);
          if (!open) {
            // Refresh simple events when modal closes (in case event was added)
            queryClient.invalidateQueries({ queryKey: ['/api/simple-events'] });
          }
        }}
        initialDate={quickAddDate}
        initialTime={quickAddTime}
      />
    </div>
  );
}