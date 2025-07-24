import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { COURTS, TIME_SLOTS, getSlotForEvent, durationInSlots, getEventColor } from './utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit2, Copy, Check, X } from 'lucide-react';

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
  type?: string;
  is_recurring?: boolean;
}

export default function CourtGridDnD() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for advanced features
  const [conflictMsg, setConflictMsg] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Batch controls
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchType, setBatchType] = useState('training');
  const [batchTimeStart, setBatchTimeStart] = useState('');
  const [batchTimeEnd, setBatchTimeEnd] = useState('');
  const [batchCourt, setBatchCourt] = useState('');

  // Fetch events from both sources
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/schedule'],
    select: (data: any) => {
      if (!data?.events) return [];
      return data.events.map((event: any) => ({
        ...event,
        title: event.title || event.name,
        court: event.court || (event.assigned_courts && event.assigned_courts[0]),
        eventType: event.eventType || event.event_type || 'practice',
        type: event.eventType || event.event_type || 'practice'
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

  // Conflict detection
  const hasConflict = (ignoreId: number, court: string, start: string | Date, end: string | Date) => {
    return events.some((e: Event) => {
      if (e.id === ignoreId || e.court !== court) return false;
      const s1 = new Date(e.start_time!);
      const e1 = new Date(e.end_time!);
      const s2 = new Date(start);
      const e2 = new Date(end);
      return s1 < e2 && s2 < e1;
    });
  };

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
    const newStart = new Date(event.start_time!);
    newStart.setHours(parseInt(h), parseInt(m), 0, 0);
    
    // Calculate duration and end time
    let duration = 120; // default 2 hours in minutes
    if (event.end_time && event.start_time) {
      duration = (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000;
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

  // Inline editing functions
  const startInlineEdit = (event: Event) => {
    setEditId(event.id);
    setEditTitle(event.title || event.name || '');
    setEditType(event.type || event.eventType || 'training');
    setEditStart(event.start_time ? event.start_time.slice(11, 16) : '');
    setEditEnd(event.end_time ? event.end_time.slice(11, 16) : '');
  };

  const saveInlineEdit = async () => {
    if (!editId) return;
    
    const event = events.find((e: Event) => e.id === editId);
    if (!event) return;

    const baseStart = new Date(event.start_time!);
    const baseEnd = new Date(event.end_time!);
    const [sh, sm] = editStart.split(':');
    const [eh, em] = editEnd.split(':');
    const newStart = new Date(baseStart);
    newStart.setHours(parseInt(sh), parseInt(sm), 0, 0);
    const newEnd = new Date(baseEnd);
    newEnd.setHours(parseInt(eh), parseInt(em), 0, 0);

    if (hasConflict(editId, event.court!, newStart, newEnd)) {
      toast({
        title: "Conflict Detected",
        description: "⚠️ Conflict with another event.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest(`/api/events/${editId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editTitle,
          eventType: editType,
          startTime: editStart,
          endTime: editEnd
        })
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      setEditId(null);
      toast({
        title: "Event Updated",
        description: "Event details have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Unable to update the event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (eventId: number) => {
    if (!canDelete) return;
    deleteMutation.mutate(eventId);
  };

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return apiRequest(`/api/events/${eventId}/duplicate`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      toast({
        title: "Event Duplicated",
        description: "A copy of the event has been created.",
      });
    },
    onError: () => {
      toast({
        title: "Duplicate Failed",
        description: "Unable to duplicate the event. Please try again.",
        variant: "destructive",
      });
    }
  });

  const duplicateEvent = async (eventId: number) => {
    duplicateMutation.mutate(eventId);
  };

  // Batch operations
  const batchUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: number[], updates: any }) => {
      return apiRequest('/api/events/batch-update', {
        method: 'POST',
        body: JSON.stringify({ ids, updates })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      setSelectedIds([]);
      toast({
        title: "Batch Update Complete",
        description: "Selected events have been updated.",
      });
    }
  });

  const batchMoveMutation = useMutation({
    mutationFn: async ({ ids, newCourt }: { ids: number[], newCourt: string }) => {
      return apiRequest('/api/events/batch-move', {
        method: 'POST',
        body: JSON.stringify({ ids, newCourt })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      setSelectedIds([]);
      setBatchCourt('');
      toast({
        title: "Batch Move Complete",
        description: "Selected events have been moved.",
      });
    }
  });

  const applyBatchUpdate = async () => {
    const updates: any = { eventType: batchType };
    if (batchTimeStart && batchTimeEnd) {
      updates.startTime = batchTimeStart;
      updates.endTime = batchTimeEnd;
    }
    batchUpdateMutation.mutate({ ids: selectedIds, updates });
  };

  const applyBatchMove = async () => {
    if (!batchCourt) return;
    batchMoveMutation.mutate({ ids: selectedIds, newCourt: batchCourt });
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
      
      {conflictMsg && (
        <div className="mb-3 p-2 bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
          {conflictMsg}
        </div>
      )}

      {/* Batch Panel */}
      {canEdit && selectedIds.length > 0 && (
        <div className="p-3 mb-4 bg-yellow-100 dark:bg-yellow-900 rounded">
          <h3 className="font-bold mb-2">Batch Edit {selectedIds.length} Event(s)</h3>
          <div className="flex gap-2 mb-2 flex-wrap">
            <Select value={batchType} onValueChange={setBatchType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="match">Match</SelectItem>
                <SelectItem value="tournament">Tournament</SelectItem>
                <SelectItem value="practice">Practice</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              type="time" 
              className="w-24" 
              value={batchTimeStart} 
              onChange={(e) => setBatchTimeStart(e.target.value)} 
              placeholder="Start" 
            />
            <Input 
              type="time" 
              className="w-24" 
              value={batchTimeEnd} 
              onChange={(e) => setBatchTimeEnd(e.target.value)} 
              placeholder="End" 
            />
            <Button onClick={applyBatchUpdate} className="bg-green-600 hover:bg-green-700">
              Apply Changes
            </Button>
          </div>
          <div className="flex gap-2">
            <Select value={batchCourt} onValueChange={setBatchCourt}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Move to Court" />
              </SelectTrigger>
              <SelectContent>
                {COURTS.map(court => (
                  <SelectItem key={court} value={court}>{court}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={applyBatchMove} className="bg-purple-600 hover:bg-purple-700">
              Move to Court
            </Button>
            <Button 
              onClick={() => setSelectedIds([])} 
              variant="outline"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}
      
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
                                const editing = editId === event.id;
                                
                                return (
                                  <Draggable
                                    key={event.id}
                                    draggableId={event.id.toString()}
                                    index={index}
                                    isDragDisabled={!canEdit || editing}
                                  >
                                    {(prov: any, snap: any) => (
                                      <div
                                        ref={prov.innerRef}
                                        {...prov.draggableProps}
                                        {...prov.dragHandleProps}
                                        className={`relative text-white text-xs rounded p-1 mb-1 ${
                                          getEventColor(event.eventType || event.type)
                                        } ${snap.isDragging ? 'opacity-70' : ''} ${
                                          !canEdit ? 'cursor-default' : 'cursor-pointer'
                                        }`}
                                        style={{ 
                                          minHeight: `${Math.max(span * 30, 40)}px`,
                                          zIndex: snap.isDragging ? 1000 : 1
                                        }}
                                        title={`Title: ${event.title || event.name}\nType: ${event.type || event.eventType}\nStart: ${event.start_time ? new Date(event.start_time).toLocaleString() : ''}\nEnd: ${event.end_time ? new Date(event.end_time).toLocaleString() : ''}\nCourt: ${event.court}${event.is_recurring ? ' 🔁 recurring' : ''}`}
                                      >
                                        {editing ? (
                                          <div className="space-y-1 bg-white p-1 rounded text-black">
                                            <Input 
                                              className="w-full text-xs h-6" 
                                              value={editTitle} 
                                              onChange={(e) => setEditTitle(e.target.value)}
                                              placeholder="Event title"
                                            />
                                            <Select value={editType} onValueChange={setEditType}>
                                              <SelectTrigger className="w-full text-xs h-6">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="training">Training</SelectItem>
                                                <SelectItem value="match">Match</SelectItem>
                                                <SelectItem value="tournament">Tournament</SelectItem>
                                                <SelectItem value="practice">Practice</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <div className="flex gap-1">
                                              <Input 
                                                type="time" 
                                                className="text-xs h-6" 
                                                value={editStart} 
                                                onChange={(e) => setEditStart(e.target.value)}
                                              />
                                              <Input 
                                                type="time" 
                                                className="text-xs h-6" 
                                                value={editEnd} 
                                                onChange={(e) => setEditEnd(e.target.value)}
                                              />
                                            </div>
                                            <div className="flex gap-1">
                                              <Button 
                                                onClick={saveInlineEdit} 
                                                size="sm" 
                                                className="bg-green-600 hover:bg-green-700 h-6 px-2"
                                              >
                                                <Check className="h-3 w-3" />
                                              </Button>
                                              <Button 
                                                onClick={() => setEditId(null)} 
                                                size="sm" 
                                                variant="secondary"
                                                className="h-6 px-2"
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            {canEdit && (
                                              <input
                                                type="checkbox"
                                                className="absolute top-1 left-1 w-3 h-3"
                                                checked={selectedIds.includes(event.id)}
                                                onChange={(e) => {
                                                  if (e.target.checked) {
                                                    setSelectedIds(prev => [...prev, event.id]);
                                                  } else {
                                                    setSelectedIds(prev => prev.filter(i => i !== event.id));
                                                  }
                                                }}
                                              />
                                            )}
                                            <div className="font-bold truncate">{event.title || event.name}</div>
                                            <div className="opacity-90">
                                              {event.start_time 
                                                ? new Date(event.start_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
                                                : event.time
                                              }
                                            </div>
                                            {canEdit && (
                                              <Button
                                                onClick={() => startInlineEdit(event)}
                                                size="sm"
                                                variant="secondary"
                                                className="absolute bottom-1 right-8 h-4 w-4 p-0 opacity-0 hover:opacity-100 transition-opacity"
                                                title="Edit"
                                              >
                                                <Edit2 className="h-2 w-2" />
                                              </Button>
                                            )}
                                            {canEdit && (
                                              <Button
                                                onClick={() => duplicateEvent(event.id)}
                                                size="sm"
                                                variant="secondary"
                                                className="absolute top-1 right-6 h-4 w-4 p-0 opacity-0 hover:opacity-100 transition-opacity"
                                                title="Duplicate"
                                              >
                                                <Copy className="h-2 w-2" />
                                              </Button>
                                            )}
                                            {canDelete && (
                                              <Button
                                                onClick={() => setDeleteId(event.id)}
                                                size="sm"
                                                variant="destructive"
                                                className="absolute bottom-1 right-1 h-4 w-4 p-0 opacity-0 hover:opacity-100 transition-opacity"
                                              >
                                                <Trash2 className="h-2 w-2" />
                                              </Button>
                                            )}
                                          </>
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

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-2">Confirm Delete</h3>
            <p className="mb-4 text-gray-600 dark:text-gray-300">Are you sure you want to delete this event?</p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setDeleteId(null)} variant="outline">
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  await handleDelete(deleteId);
                  setDeleteId(null);
                }} 
                variant="destructive"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      
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