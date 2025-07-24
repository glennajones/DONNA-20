import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { COURTS, TIME_SLOTS, getSlotForEvent, durationInSlots, getEventColor } from './utils';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface Event {
  id: number;
  title?: string;
  name?: string;
  court?: string;
  assigned_courts?: string[];
  start_time?: string;
  end_time?: string;
  time?: string;
  duration?: number;
  eventType?: string;
  event_type?: string;
}

export default function CourtGridDnD() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch events from both sources
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/schedule'],
    select: (data: any) => {
      if (!data?.events) return [];
      return data.events.map((event: any) => ({
        ...event,
        title: event.title || event.name,
        court: event.court || (event.assigned_courts && event.assigned_courts[0]),
        eventType: event.eventType || event.event_type || 'practice'
      }));
    }
  });

  // Reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: async ({ eventId, start_time, end_time, court }: {
      eventId: number;
      start_time: string;
      end_time: string;
      court: string;
    }) => {
      // Check if this is a budget event (from Events table) or schedule event
      const event = events.find((e: Event) => e.id === eventId);
      const isScheduleEvent = event?.id?.toString().startsWith('schedule-');
      
      if (isScheduleEvent) {
        // Handle schedule events
        const actualId = eventId.toString().replace('schedule-', '');
        return apiRequest(`/api/schedule/${actualId}/reschedule`, {
          method: 'PUT',
          body: JSON.stringify({ start_time, end_time, court })
        });
      } else {
        // Handle budget events
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
        description: "The event has been successfully moved to the new time slot.",
      });
    },
    onError: (error: any) => {
      console.error('Reschedule error:', error);
      toast({
        title: "Reschedule Failed",
        description: "Unable to reschedule the event. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const event = events.find((e: Event) => e.id === eventId);
      const isScheduleEvent = event?.id?.toString().startsWith('schedule-');
      
      if (isScheduleEvent) {
        const actualId = eventId.toString().replace('schedule-', '');
        return apiRequest(`/api/schedule/${actualId}`, { method: 'DELETE' });
      } else {
        return apiRequest(`/api/events/${eventId}`, { method: 'DELETE' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      toast({
        title: "Event Deleted",
        description: "The event has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Unable to delete the event. Please try again.",
        variant: "destructive",
      });
    }
  });

  const canEdit = user?.role && ['admin', 'manager', 'coach'].includes(user.role);
  const canDelete = user?.role && ['admin', 'manager'].includes(user.role);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !canEdit) return;

    const eventId = Number(result.draggableId);
    const event = events.find((e: Event) => e.id === eventId);
    if (!event) return;

    const destinationId = result.destination.droppableId;
    if (!destinationId) return;
    
    const [newCourt, newTime] = destinationId.split('::');
    const [h, m] = newTime.split(':');
    
    // Create new start time
    const newStart = new Date();
    newStart.setHours(parseInt(h), parseInt(m), 0, 0);
    
    // Calculate duration and end time
    let duration = 120; // default 2 hours in minutes
    if (event.end_time && event.start_time) {
      duration = (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000;
    } else if (event.duration) {
      duration = event.duration;
    }
    
    const newEnd = new Date(newStart.getTime() + (duration * 60000));

    rescheduleMutation.mutate({
      eventId,
      start_time: newStart.toISOString(),
      end_time: newEnd.toISOString(),
      court: newCourt
    });
  };

  const handleDelete = async (eventId: number) => {
    if (!canDelete) return;
    if (confirm('Are you sure you want to delete this event?')) {
      deleteMutation.mutate(eventId);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading schedule...</div>;
  }

  return (
    <div className="p-4 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Court Schedule Grid</h2>
        <div className="text-sm text-gray-600">
          {canEdit ? 'Drag events to reschedule' : 'View only'}
        </div>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="inline-block border rounded-lg overflow-hidden">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-gray-100 dark:bg-gray-800 min-w-[80px]">Time</th>
                {COURTS.map(court => (
                  <th key={court} className="border p-2 bg-gray-100 dark:bg-gray-800 min-w-[120px]">
                    {court}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(time => (
                <tr key={time}>
                  <td className="border p-2 text-sm font-medium bg-gray-50 dark:bg-gray-900">
                    {time}
                  </td>
                  {COURTS.map(court => {
                    const droppableId = `${court}::${time}`;
                    const cellEvents = events.filter((event: Event) => {
                      const eventCourt = event.court || (event.assigned_courts && event.assigned_courts[0]);
                      const eventTime = getSlotForEvent(event);
                      return eventCourt === court && eventTime === time;
                    });

                    return (
                      <td key={droppableId} className="border align-top p-1 h-[60px] relative">
                        <Droppable droppableId={droppableId} direction="vertical">
                          {(provided: any, snapshot: any) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`h-full min-h-[50px] ${
                                snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              {cellEvents.map((event: Event, index: number) => {
                                const span = event.end_time && event.start_time 
                                  ? durationInSlots(event.start_time, event.end_time)
                                  : Math.max(1, Math.round((event.duration || 120) / 30));
                                
                                return (
                                  <Draggable
                                    key={event.id}
                                    draggableId={event.id.toString()}
                                    index={index}
                                    isDragDisabled={!canEdit}
                                  >
                                    {(prov: any, snap: any) => (
                                      <div
                                        ref={prov.innerRef}
                                        {...prov.draggableProps}
                                        {...prov.dragHandleProps}
                                        className={`relative text-white text-xs rounded p-1 mb-1 cursor-pointer ${
                                          getEventColor(event.eventType)
                                        } ${snap.isDragging ? 'opacity-70 rotate-2' : ''} ${
                                          !canEdit ? 'cursor-default' : ''
                                        }`}
                                        style={{ 
                                          minHeight: `${Math.max(span * 20, 40)}px`,
                                          zIndex: snap.isDragging ? 1000 : 1
                                        }}
                                      >
                                        <div className="font-bold truncate">{event.title}</div>
                                        <div className="opacity-90">
                                          {event.start_time 
                                            ? new Date(event.start_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
                                            : event.time
                                          }
                                        </div>
                                        {canDelete && (
                                          <Button
                                            onClick={(e: any) => {
                                              e.stopPropagation();
                                              handleDelete(event.id);
                                            }}
                                            size="sm"
                                            variant="destructive"
                                            className="absolute top-0 right-0 h-4 w-4 p-0 opacity-0 hover:opacity-100 transition-opacity"
                                          >
                                            <Trash2 className="h-2 w-2" />
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DragDropContext>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Training/Practice</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Match/Tournament</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span>Camp</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Social</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span>Other</span>
        </div>
      </div>
    </div>
  );
}